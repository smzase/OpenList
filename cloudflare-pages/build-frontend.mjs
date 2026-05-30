import { mkdir, rm, writeFile } from "node:fs/promises";
import { createWriteStream } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
const distDir = resolve(root, "dist");
const tmpTar = resolve(root, "openlist-frontend-dist.tar.gz");

const repo = process.env.OPENLIST_FRONTEND_REPO || "OpenListTeam/OpenList-Frontend";
const version = process.env.OPENLIST_FRONTEND_VERSION || "latest";
const assetName = process.env.OPENLIST_FRONTEND_ASSET || "openlist-frontend-dist.tar.gz";
const releasePath = version === "latest" ? "latest/download" : `download/${version}`;
const directUrl = `https://github.com/${repo}/releases/${releasePath}/${assetName}`;
const apiUrl =
  version === "latest"
    ? `https://api.github.com/repos/${repo}/releases/latest`
    : `https://api.github.com/repos/${repo}/releases/tags/${version}`;

const headers = {
  "User-Agent": "openlist-cloudflare-pages-build",
  Accept: "application/vnd.github+json",
};
if (process.env.GITHUB_TOKEN) {
  headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
}

async function main() {
  console.log(`Downloading OpenList frontend directly: ${directUrl}`);
  if (await downloadAndExtract(directUrl)) {
    return;
  }

  console.log(`Direct download failed. Fetching OpenList frontend release metadata: ${apiUrl}`);
  const releaseResp = await fetch(apiUrl, { headers });
  if (!releaseResp.ok) {
    throw new Error(
      `Failed to fetch frontend release metadata: ${releaseResp.status} ${releaseResp.statusText}. ` +
        "If this is a GitHub API rate limit, set a Pages environment variable named GITHUB_TOKEN, " +
        "or set OPENLIST_FRONTEND_VERSION and OPENLIST_FRONTEND_ASSET to use a direct release asset.",
    );
  }
  const release = await releaseResp.json();
  const asset = (release.assets || []).find((item) => {
    const name = item.name || "";
    return name.includes("openlist-frontend-dist") && !name.includes("lite") && name.endsWith(".tar.gz");
  });
  if (!asset) {
    throw new Error("Could not find openlist-frontend-dist*.tar.gz in frontend release assets");
  }

  console.log(`Downloading frontend asset: ${asset.name}`);
  if (!(await downloadAndExtract(asset.browser_download_url))) {
    throw new Error(`Failed to download frontend asset: ${asset.browser_download_url}`);
  }
}

async function downloadAndExtract(url) {
  const assetResp = await fetch(url, { headers: { "User-Agent": headers["User-Agent"] }, redirect: "follow" });
  if (!assetResp.ok || !assetResp.body) {
    console.log(`Download failed: ${assetResp.status} ${assetResp.statusText}`);
    return false;
  }

  await rm(tmpTar, { force: true });
  await streamToFile(assetResp.body, tmpTar);

  await rm(distDir, { recursive: true, force: true });
  await mkdir(distDir, { recursive: true });

  const tar = spawnSync("tar", ["-xzf", tmpTar, "-C", distDir], { stdio: "inherit" });
  if (tar.status !== 0) {
    throw new Error("Failed to extract frontend asset with tar");
  }

  await rm(tmpTar, { force: true });
  await writeFile(
    resolve(distDir, "_routes.json"),
    JSON.stringify({ version: 1, include: ["/*"], exclude: [] }, null, 2) + "\n",
  );
  console.log("OpenList frontend has been written to cloudflare-pages/dist");
  return true;
}

async function streamToFile(stream, path) {
  const file = createWriteStream(path);
  const reader = stream.getReader();
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      file.write(Buffer.from(value));
    }
  } finally {
    file.end();
  }
  await new Promise((resolvePromise, reject) => {
    file.on("finish", resolvePromise);
    file.on("error", reject);
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
