import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { createWriteStream } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
const distDir = resolve(root, "dist");
const tmpTar = resolve(root, "openlist-frontend-dist.tar.gz");
const customizeBootstrap = `<script id="openlist-pages-customize">
  (function () {
    if (window.__openlistPagesCustomizeObserver) return;
    window.__openlistPagesCustomizeObserver = true;
    function appendHtml(target, html) {
      if (!target || !html) return;
      var template = document.createElement("template");
      template.innerHTML = html;
      var scripts = Array.prototype.slice.call(template.content.querySelectorAll("script")).map(function (oldScript) {
        var script = document.createElement("script");
        for (var i = 0; i < oldScript.attributes.length; i++) {
          var attr = oldScript.attributes[i];
          script.setAttribute(attr.name, attr.value);
        }
        script.text = oldScript.textContent || "";
        oldScript.parentNode.removeChild(oldScript);
        return script;
      });
      target.appendChild(template.content);
      scripts.forEach(function (script) {
        target.appendChild(script);
      });
    }
    function appendBody(html) {
      if (document.body) appendHtml(document.body, html);
      else document.addEventListener("DOMContentLoaded", function () { appendHtml(document.body, html); }, { once: true });
    }
    function settingsPath(input) {
      try {
        var raw = typeof input === "string" ? input : input && input.url;
        return raw ? new URL(raw, location.href).pathname === "/api/public/settings" : false;
      } catch (error) {
        return false;
      }
    }
    function apply(payload) {
      if (window.__openlistPagesCustomizeApplied) return;
      var data = payload && payload.data ? payload.data : {};
      if (!data.customize_head && !data.customize_body) return;
      window.__openlistPagesCustomizeApplied = true;
      appendHtml(document.head, data.customize_head);
      appendBody(data.customize_body);
    }
    var nativeFetch = window.fetch;
    if (nativeFetch) {
      window.fetch = function (input, init) {
        var promise = nativeFetch.apply(this, arguments);
        if (settingsPath(input)) {
          promise.then(function (res) {
            if (res && res.ok) res.clone().json().then(apply).catch(function () {});
          }).catch(function () {});
        }
        return promise;
      };
    }
    var nativeOpen = XMLHttpRequest.prototype.open;
    var nativeSend = XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype.open = function (method, url) {
      this.__openlistPagesSettings = settingsPath(url);
      return nativeOpen.apply(this, arguments);
    };
    XMLHttpRequest.prototype.send = function () {
      if (this.__openlistPagesSettings) {
        this.addEventListener("load", function () {
          try {
            if (this.status >= 200 && this.status < 300) apply(JSON.parse(this.responseText || "{}"));
          } catch (error) {}
        });
      }
      return nativeSend.apply(this, arguments);
    };
  })();
</script>`;

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

const pagesRoutes = {
  version: 1,
  include: ["/api/*", "/d/*", "/ping", "/manifest.json", "/robots.txt", "/favicon.ico"],
  exclude: [],
};

const pagesHeaders = `/assets/*
  Cache-Control: public, max-age=31536000, immutable

/images/*
  Cache-Control: public, max-age=31536000, immutable

/static/*
  Cache-Control: public, max-age=31536000, immutable

/streamer/*
  Cache-Control: public, max-age=31536000, immutable

/VERSION
  Cache-Control: public, max-age=3600

/index.html
  Cache-Control: no-store
`;

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
  await patchIndexHtml();
  await writeFile(resolve(distDir, "_routes.json"), JSON.stringify(pagesRoutes, null, 2) + "\n");
  await writeFile(resolve(distDir, "_headers"), pagesHeaders);
  await writeFile(resolve(distDir, "_redirects"), "/* /index.html 200\n");
  console.log("OpenList frontend has been written to cloudflare-pages/dist");
  return true;
}

async function patchIndexHtml() {
  const indexPath = resolve(distDir, "index.html");
  let html = await readFile(indexPath, "utf8");
  html = html.replace(/<script\b[^>]*id=["']openlist-pages-customize["'][\s\S]*?<\/script>\s*/i, "");
  const marker = "<!-- customize head -->";
  if (html.includes(marker)) {
    html = html.replace(marker, `${marker}\n    ${customizeBootstrap.replace(/\n/g, "\n    ")}`);
  } else {
    html = html.replace("</head>", `    ${customizeBootstrap.replace(/\n/g, "\n    ")}\n  </head>`);
  }
  await writeFile(indexPath, html);
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
