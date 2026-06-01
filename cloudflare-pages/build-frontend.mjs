import { mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { createWriteStream } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));
const distDir = resolve(root, "dist");
const tmpTar = resolve(root, "openlist-frontend-dist.tar.gz");
const preloadStart = "<!-- openlist pages preloads -->";
const preloadEnd = "<!-- /openlist pages preloads -->";
const settingsPreload = `<link rel="preload" as="fetch" crossorigin href="/api/public/settings">`;
const langPreloadStart = "<!-- openlist pages language preload -->";
const langPreloadEnd = "<!-- /openlist pages language preload -->";
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
  await patchFrontendBundles();
  await writeFile(resolve(distDir, "_routes.json"), JSON.stringify(pagesRoutes, null, 2) + "\n");
  await writeFile(resolve(distDir, "_headers"), pagesHeaders);
  await writeFile(resolve(distDir, "_redirects"), "/* /index.html 200\n");
  console.log("OpenList frontend has been written to cloudflare-pages/dist");
  return true;
}

async function patchIndexHtml() {
  const indexPath = resolve(distDir, "index.html");
  let html = await readFile(indexPath, "utf8");
  html = await injectPreloadLinks(html);
  html = await injectLanguagePreloadScript(html);
  html = html.replace(/<script\b[^>]*id=["']openlist-pages-customize["'][\s\S]*?<\/script>\s*/i, "");
  const marker = "<!-- customize head -->";
  if (html.includes(marker)) {
    html = html.replace(marker, `${marker}\n    ${customizeBootstrap.replace(/\n/g, "\n    ")}`);
  } else {
    html = html.replace("</head>", `    ${customizeBootstrap.replace(/\n/g, "\n    ")}\n  </head>`);
  }
  await writeFile(indexPath, html);
}

async function injectLanguagePreloadScript(html) {
  html = html.replace(new RegExp(`\\s*${escapeRegExp(langPreloadStart)}[\\s\\S]*?${escapeRegExp(langPreloadEnd)}\\s*`, "i"), "\n");
  const entries = await collectLanguageEntryMap();
  if (Object.keys(entries).length === 0) return html;
  const block = [
    langPreloadStart,
    `    <script id="openlist-pages-language-preload">`,
    `      (function(){`,
    `        try {`,
    `          var entries = ${JSON.stringify(entries)};`,
    `          var saved = "";`,
    `          try { saved = localStorage.getItem("lang") || ""; } catch (error) {}`,
    `          var lang = String(saved || navigator.language || "en").toLowerCase();`,
    `          var key = entries[lang] ? lang : lang.split("-")[0];`,
    `          if (lang.indexOf("zh") === 0 && !entries[key]) key = /tw|hk|mo|hant/.test(lang) ? "zh-tw" : "zh-cn";`,
    `          var href = entries[key] || entries.en;`,
    `          if (!href) return;`,
    `          var link = document.createElement("link");`,
    `          link.rel = "modulepreload";`,
    `          link.crossOrigin = "";`,
    `          link.href = href;`,
    `          document.head.appendChild(link);`,
    `        } catch (error) {}`,
    `      })();`,
    `    </script>`,
    `    ${langPreloadEnd}`,
  ].join("\n");
  if (html.includes(preloadEnd)) return html.replace(preloadEnd, `${preloadEnd}\n    ${block}`);
  const marker = "<!-- customize head -->";
  if (html.includes(marker)) return html.replace(marker, `${marker}\n    ${block}`);
  return html.replace("</head>", `    ${block}\n  </head>`);
}

async function injectPreloadLinks(html) {
  html = html.replace(new RegExp(`\\s*${escapeRegExp(preloadStart)}[\\s\\S]*?${escapeRegExp(preloadEnd)}\\s*`, "i"), "\n");
  const preloads = await collectPreloadLinks(html);
  if (preloads.length === 0) return injectSettingsPreload(html);
  const block = [
    preloadStart,
    `    ${settingsPreload}`,
    ...preloads.map((href) => {
      if (href.endsWith(".css")) return `    <link rel="preload" as="style" crossorigin href="${href}" >`;
      return `    <link rel="modulepreload" crossorigin href="${href}" >`;
    }),
    `    ${preloadEnd}`,
  ].join("\n");
  const marker = "<!-- customize head -->";
  if (html.includes(marker)) return html.replace(marker, `${marker}\n    ${block}`);
  return html.replace("</head>", `    ${block}\n  </head>`);
}

function injectSettingsPreload(html) {
  if (html.includes(settingsPreload)) return html;
  const marker = "<!-- customize head -->";
  if (html.includes(marker)) return html.replace(marker, `${marker}\n    ${settingsPreload}`);
  return html.replace("</head>", `    ${settingsPreload}\n  </head>`);
}

async function collectPreloadLinks(html) {
  const links = new Set();
  const add = (href) => {
    if (href && href.startsWith("/assets/") && !href.includes("-legacy-")) links.add(href);
  };

  for (const match of html.matchAll(/(?:src|href|data-src)=["'](\/assets\/index-[^"']+\.(?:js|css))["']/g)) {
    add(match[1]);
  }

  const mainJs = [...links].find((href) => /^\/assets\/index-[^/]+\.js$/.test(href));
  if (mainJs) {
    const source = await readFile(resolve(distDir, mainJs.slice(1)), "utf8").catch(() => "");
    const depsMatch = source.match(/m\.f\|\|\(m\.f=(\[[^\]]+\])\)/);
    if (depsMatch) {
      try {
        const deps = JSON.parse(depsMatch[1]);
        for (const dep of deps) {
          const name = dep.split("/").pop() || "";
          if (/^Layout-/.test(name)) {
            add(`/${dep}`);
            break;
          }
        }
      } catch (error) {
        console.warn(`Could not parse frontend dependency preload list: ${error.message}`);
      }
    }
  }

  return [...links];
}

async function collectLanguageEntryMap() {
  const assetNames = await readdir(resolve(distDir, "assets")).catch(() => []);
  const mainJs = assetNames.find((name) => /^index-(?!legacy-)[A-Za-z0-9_-]+\.js$/.test(name));
  if (!mainJs) return {};
  const source = await readFile(resolve(distDir, "assets", mainJs), "utf8").catch(() => "");
  const entries = {};
  for (const match of source.matchAll(/"\.\.\/lang\/([^/]+)\/entry\.ts":\(\)=>[^`]*import\(`\.\/(entry-[^`]+\.js)`\)/g)) {
    entries[match[1].toLowerCase()] = `/assets/${match[2]}`;
  }
  return entries;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function patchFrontendBundles() {
  const assetsDir = resolve(distDir, "assets");
  const files = await readdir(assetsDir).catch(() => []);
  let patched = 0;
  for (const file of files) {
    if (!file.endsWith(".js")) continue;
    const filePath = resolve(assetsDir, file);
    const source = await readFile(filePath, "utf8");
    const next = source.replace(
      /\b[A-Za-z_$][\w$]*\.get\(([`"'])\/public\/(?:archive_extensions|offline_download_tools)\1\)/g,
      'Promise.resolve({code:200,message:"success",data:[]})',
    ).replace(
      /\b([A-Za-z_$][\w$]*)\.get\(([`"'])\/public\/settings\2\)/g,
      '(window.__openlistPagesPublicSettings?Promise.resolve({code:200,message:"success",data:window.__openlistPagesTakePublicSettings()}):$1.get("/public/settings"))',
    );
    if (next === source) continue;
    await writeFile(filePath, next);
    patched += 1;
  }
  if (patched > 0) console.log(`Patched ${patched} frontend bundle(s) to inline fixed public API responses`);
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
