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
const langPreloadStart = "<!-- openlist pages language preload -->";
const langPreloadEnd = "<!-- /openlist pages language preload -->";
const fsListCacheBootstrap = `<script id="openlist-pages-fs-list-cache">
  (function () {
    if (window.__openlistPagesFsListCache) return;
    window.__openlistPagesFsListCache = true;
    var ttl = 60 * 1000;
    var maxEntries = 64;
    var cache = new Map();
    function tokenPresent() {
      try {
        return !!(localStorage.getItem("token") || localStorage.getItem("openlist_token") || localStorage.getItem("alist_token"));
      } catch (error) {
        return false;
      }
    }
    function headerValue(headers, name) {
      if (!headers) return "";
      var lower = name.toLowerCase();
      if (typeof Headers !== "undefined" && headers instanceof Headers) return headers.get(name) || "";
      if (Array.isArray(headers)) {
        for (var i = 0; i < headers.length; i++) {
          if (String(headers[i][0] || "").toLowerCase() === lower) return String(headers[i][1] || "");
        }
        return "";
      }
      for (var key in headers) {
        if (String(key).toLowerCase() === lower) return String(headers[key] || "");
      }
      return "";
    }
    function hasAuthHeader(input, init, extraHeaders) {
      return !!(
        tokenPresent() ||
        headerValue(extraHeaders, "authorization") ||
        headerValue(init && init.headers, "authorization") ||
        headerValue(input && input.headers, "authorization")
      );
    }
    function pathOf(input) {
      try {
        var raw = typeof input === "string" ? input : input && input.url;
        if (!raw) return "";
        var url = new URL(raw, location.href);
        if (url.origin !== location.origin) return "";
        return url.pathname;
      } catch (error) {
        return "";
      }
    }
    function truthy(value) {
      return value === true || value === 1 || value === "1" || String(value).toLowerCase() === "true";
    }
    function cacheKeyFromBody(body) {
      if (typeof body !== "string") return "";
      var payload;
      try {
        payload = JSON.parse(body || "{}");
      } catch (error) {
        return "";
      }
      if (!payload || typeof payload !== "object") return "";
      if (truthy(payload.refresh)) return "";
      if (String(payload.password || "")) return "";
      return JSON.stringify({
        path: String(payload.path || "/"),
        page: Number(payload.page || 1) || 1,
        per_page: Number(payload.per_page || 0) || 0
      });
    }
    function getCached(key) {
      var hit = cache.get(key);
      if (!hit) return null;
      if (hit.expires <= Date.now()) {
        cache.delete(key);
        return null;
      }
      return hit;
    }
    function setCached(key, text) {
      try {
        var payload = JSON.parse(text || "{}");
        if (!payload || payload.code !== 200) return;
      } catch (error) {
        return;
      }
      if (cache.size >= maxEntries) cache.delete(cache.keys().next().value);
      cache.set(key, { text: text, expires: Date.now() + ttl });
    }
    function cachedHeaders() {
      return "content-type: application/json; charset=utf-8\\r\\ncache-control: private, max-age=60\\r\\nx-openlist-client-cache: hit\\r\\n";
    }
    function cachedHeader(name) {
      name = String(name || "").toLowerCase();
      if (name === "content-type") return "application/json; charset=utf-8";
      if (name === "cache-control") return "private, max-age=60";
      if (name === "x-openlist-client-cache") return "hit";
      return null;
    }
    var nativeFetch = window.fetch;
    if (nativeFetch) {
      window.fetch = function (input, init) {
        var method = String((init && init.method) || (input && input.method) || "GET").toUpperCase();
        var key = "";
        if (method === "POST" && pathOf(input) === "/api/fs/list" && !hasAuthHeader(input, init)) {
          key = cacheKeyFromBody(init && init.body);
          var hit = key && getCached(key);
          if (hit && typeof Response !== "undefined") {
            return Promise.resolve(new Response(hit.text, {
              status: 200,
              headers: { "Content-Type": "application/json; charset=utf-8", "X-OpenList-Client-Cache": "hit" }
            }));
          }
        }
        var promise = nativeFetch.apply(this, arguments);
        if (key) {
          promise.then(function (res) {
            if (res && res.ok) res.clone().text().then(function (text) { setCached(key, text); }).catch(function () {});
          }).catch(function () {});
        }
        return promise;
      };
    }
    var NativeXHR = window.XMLHttpRequest;
    if (!NativeXHR || !NativeXHR.prototype) return;
    function CachedXHR() {
      this.__xhr = new NativeXHR();
      this.__method = "GET";
      this.__url = "";
      this.__headers = {};
      this.__listeners = {};
      this.__listenerWrappers = {};
      this.__handlers = {};
      this.__cached = null;
      this.__responseType = "";
      this.upload = this.__xhr.upload;
    }
    function defineHandler(name) {
      Object.defineProperty(CachedXHR.prototype, name, {
        get: function () { return this.__handlers[name] || null; },
        set: function (handler) {
          var self = this;
          this.__handlers[name] = handler;
          this.__xhr[name] = typeof handler === "function" ? function (event) { return handler.call(self, event); } : handler;
        }
      });
    }
    function dispatchCached(xhr, type) {
      var event;
      try {
        event = new Event(type);
        Object.defineProperty(event, "target", { value: xhr });
        Object.defineProperty(event, "currentTarget", { value: xhr });
      } catch (error) {
        event = { type: type, target: xhr, currentTarget: xhr };
      }
      var handler = xhr.__handlers["on" + type];
      if (typeof handler === "function") handler.call(xhr, event);
      var listeners = xhr.__listeners[type] || [];
      for (var i = 0; i < listeners.length; i++) {
        if (typeof listeners[i] === "function") listeners[i].call(xhr, event);
        else if (listeners[i] && typeof listeners[i].handleEvent === "function") listeners[i].handleEvent(event);
      }
    }
    CachedXHR.prototype.open = function (method, url) {
      this.__method = String(method || "GET").toUpperCase();
      this.__url = url;
      return this.__xhr.open.apply(this.__xhr, arguments);
    };
    CachedXHR.prototype.setRequestHeader = function (name, value) {
      this.__headers[String(name || "").toLowerCase()] = String(value || "");
      return this.__xhr.setRequestHeader.apply(this.__xhr, arguments);
    };
    CachedXHR.prototype.send = function (body) {
      var self = this;
      var key = "";
      if (this.__method === "POST" && pathOf(this.__url) === "/api/fs/list" && !hasAuthHeader(null, null, this.__headers)) {
        key = cacheKeyFromBody(body);
        var hit = key && getCached(key);
        if (hit) {
          this.__cached = {
            readyState: 4,
            status: 200,
            statusText: "OK",
            responseText: hit.text,
            responseType: this.__responseType || ""
          };
          setTimeout(function () {
            dispatchCached(self, "readystatechange");
            dispatchCached(self, "load");
            dispatchCached(self, "loadend");
          }, 0);
          return;
        }
      }
      if (key) {
        this.__xhr.addEventListener("load", function () {
          try {
            if (self.__xhr.status === 200) setCached(key, self.__xhr.responseText);
          } catch (error) {}
        });
      }
      return this.__xhr.send.apply(this.__xhr, arguments);
    };
    CachedXHR.prototype.abort = function () { return this.__xhr.abort.apply(this.__xhr, arguments); };
    CachedXHR.prototype.getAllResponseHeaders = function () { return this.__cached ? cachedHeaders() : this.__xhr.getAllResponseHeaders(); };
    CachedXHR.prototype.getResponseHeader = function (name) { return this.__cached ? cachedHeader(name) : this.__xhr.getResponseHeader(name); };
    CachedXHR.prototype.overrideMimeType = function () { return this.__xhr.overrideMimeType.apply(this.__xhr, arguments); };
    CachedXHR.prototype.addEventListener = function (type, listener, options) {
      if (!listener) return;
      var self = this;
      (this.__listeners[type] || (this.__listeners[type] = [])).push(listener);
      var wrapper = function (event) { return typeof listener === "function" ? listener.call(self, event) : listener.handleEvent(event); };
      (this.__listenerWrappers[type] || (this.__listenerWrappers[type] = new Map())).set(listener, wrapper);
      return this.__xhr.addEventListener(type, wrapper, options);
    };
    CachedXHR.prototype.removeEventListener = function (type, listener, options) {
      var list = this.__listeners[type] || [];
      var index = list.indexOf(listener);
      if (index >= 0) list.splice(index, 1);
      var wrappers = this.__listenerWrappers[type];
      var wrapper = wrappers && wrappers.get(listener);
      if (wrapper) wrappers.delete(listener);
      return this.__xhr.removeEventListener(type, wrapper || listener, options);
    };
    CachedXHR.prototype.dispatchEvent = function (event) { return this.__xhr.dispatchEvent(event); };
    Object.defineProperties(CachedXHR.prototype, {
      readyState: { get: function () { return this.__cached ? this.__cached.readyState : this.__xhr.readyState; } },
      status: { get: function () { return this.__cached ? this.__cached.status : this.__xhr.status; } },
      statusText: { get: function () { return this.__cached ? this.__cached.statusText : this.__xhr.statusText; } },
      responseURL: { get: function () { return this.__cached ? new URL(this.__url, location.href).href : this.__xhr.responseURL; } },
      responseText: { get: function () { return this.__cached ? this.__cached.responseText : this.__xhr.responseText; } },
      responseXML: { get: function () { return this.__cached ? null : this.__xhr.responseXML; } },
      response: {
        get: function () {
          if (!this.__cached) return this.__xhr.response;
          if (this.__cached.responseType === "json") {
            try { return JSON.parse(this.__cached.responseText); } catch (error) { return null; }
          }
          return this.__cached.responseText;
        }
      },
      responseType: {
        get: function () { return this.__cached ? this.__cached.responseType : this.__xhr.responseType; },
        set: function (value) {
          this.__responseType = value;
          try { this.__xhr.responseType = value; } catch (error) {}
        }
      },
      timeout: { get: function () { return this.__xhr.timeout; }, set: function (value) { this.__xhr.timeout = value; } },
      withCredentials: { get: function () { return this.__xhr.withCredentials; }, set: function (value) { this.__xhr.withCredentials = value; } }
    });
    defineHandler("onreadystatechange");
    defineHandler("onload");
    defineHandler("onloadend");
    defineHandler("onerror");
    defineHandler("ontimeout");
    defineHandler("onabort");
    CachedXHR.UNSENT = CachedXHR.prototype.UNSENT = 0;
    CachedXHR.OPENED = CachedXHR.prototype.OPENED = 1;
    CachedXHR.HEADERS_RECEIVED = CachedXHR.prototype.HEADERS_RECEIVED = 2;
    CachedXHR.LOADING = CachedXHR.prototype.LOADING = 3;
    CachedXHR.DONE = CachedXHR.prototype.DONE = 4;
    window.XMLHttpRequest = CachedXHR;
  })();
</script>`;
const loadingImageBootstrap = `<style id="openlist-pages-loading-image-style">
  .openlist-loading-image {
    width: 100px !important;
    height: 100px !important;
    border: 0 !important;
    border-radius: 14px !important;
    background: url("/images/loading.webp") center / cover no-repeat !important;
    animation: none !important;
    color: transparent !important;
    overflow: hidden !important;
    box-sizing: border-box !important;
  }
  .openlist-loading-image > * {
    opacity: 0 !important;
  }
</style>
<script id="openlist-pages-loading-image">
  (function () {
    if (window.__openlistPagesLoadingImage) return;
    window.__openlistPagesLoadingImage = true;
    function isFullScreenLoader(spinner) {
      var rect = spinner.getBoundingClientRect();
      if (Math.max(rect.width, rect.height) < 40) return false;
      var parent = spinner.parentElement;
      for (var i = 0; parent && i < 6; i++, parent = parent.parentElement) {
        var box = parent.getBoundingClientRect();
        if (box.height >= window.innerHeight * 0.5 && box.width >= window.innerWidth * 0.5) return true;
      }
      return false;
    }
    function scan() {
      var spinners = document.querySelectorAll(".hope-spinner");
      for (var i = 0; i < spinners.length; i++) {
        var spinner = spinners[i];
        if (isFullScreenLoader(spinner)) spinner.classList.add("openlist-loading-image");
      }
    }
    function scheduleScan() {
      requestAnimationFrame(function () { requestAnimationFrame(scan); });
    }
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", scheduleScan, { once: true });
    else scheduleScan();
    new MutationObserver(scheduleScan).observe(document.documentElement, { childList: true, subtree: true });
    window.addEventListener("resize", scheduleScan);
  })();
</script>`;
const turnstileBootstrap = `<script id="openlist-pages-turnstile">
  (function () {
    if (window.__openlistPagesTurnstile) return;
    window.__openlistPagesTurnstile = true;
    var statusPath = "/api/turnstile/status";
    var challengePath = "/api/turnstile/challenge";
    var verifyPath = "/api/turnstile/verify";
    var renewHintKey = "openlist_turnstile_verified_until";
    var lastRenew = 0;
    function returnTo() {
      return location.pathname + location.search + location.hash;
    }
    function challenge() {
      try { document.documentElement.style.visibility = "hidden"; } catch (error) {}
      location.replace(challengePath + "?return_to=" + encodeURIComponent(returnTo()));
    }
    function pathOf(input) {
      try {
        var raw = typeof input === "string" ? input : input && input.url;
        return raw ? new URL(raw, location.href).pathname : "";
      } catch (error) {
        return "";
      }
    }
    function payloadNeedsChallenge(payload) {
      var data = payload && payload.data ? payload.data : {};
      return !!(data.challenge_url || data.verify_url || payload && payload.message === "Turnstile verification required");
    }
    function inspectPayload(payload) {
      if (payloadNeedsChallenge(payload)) challenge();
    }
    function verifiedUntil() {
      try {
        return Number(localStorage.getItem(renewHintKey) || 0);
      } catch (error) {
        return 0;
      }
    }
    function needsRenewal(now) {
      var until = verifiedUntil();
      return until > 0 && until - Math.floor(now / 1000) < 5 * 60;
    }
    function rememberVerified(payload) {
      var data = payload && payload.data ? payload.data : {};
      if (!data.verified) return;
      try {
        localStorage.setItem(renewHintKey, String(data.expires_at || Math.floor(Date.now() / 1000) + 30 * 60));
      } catch (error) {}
    }
    function inspectResponse(res, input) {
      if (!res || res.status !== 403) return;
      var path = pathOf(input || res.url);
      if (path === statusPath || path === challengePath || path === verifyPath) return;
      if (!path.startsWith("/api/") && !path.startsWith("/d/")) return;
      res.clone().json().then(inspectPayload).catch(function () {});
    }
    function checkStatus() {
      lastRenew = Date.now();
      fetch(statusPath, { credentials: "same-origin", cache: "no-store" })
        .then(function (res) { return res && res.ok ? res.json() : null; })
        .then(function (payload) {
          var data = payload && payload.data ? payload.data : {};
          rememberVerified(payload);
          if (data.enabled && !data.verified) challenge();
        })
        .catch(function () {});
    }
    function renewSoon() {
      var now = Date.now();
      if (now - lastRenew < 60 * 1000) return;
      if (!needsRenewal(now)) return;
      checkStatus();
    }
    var nativeFetch = window.fetch;
    if (nativeFetch) {
      window.fetch = function (input, init) {
        var promise = nativeFetch.apply(this, arguments);
        promise.then(function (res) { inspectResponse(res, input); }).catch(function () {});
        return promise;
      };
    }
    var nativeOpen = XMLHttpRequest.prototype.open;
    var nativeSend = XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype.open = function (method, url) {
      this.__openlistTurnstileUrl = url;
      return nativeOpen.apply(this, arguments);
    };
    XMLHttpRequest.prototype.send = function () {
      this.addEventListener("load", function () {
        if (this.status !== 403) return;
        var path = pathOf(this.__openlistTurnstileUrl || "");
        if (path === statusPath || path === challengePath || path === verifyPath) return;
        if (!path.startsWith("/api/") && !path.startsWith("/d/")) return;
        try { inspectPayload(JSON.parse(this.responseText || "{}")); } catch (error) {}
      });
      return nativeSend.apply(this, arguments);
    };
    if (window.setInterval) {
      window.setInterval(renewSoon, 60 * 1000);
    }
    document.addEventListener("play", renewSoon, true);
    document.addEventListener("playing", renewSoon, true);
    document.addEventListener("timeupdate", renewSoon, true);
    document.addEventListener("seeking", renewSoon, true);
    document.addEventListener("waiting", renewSoon, true);
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", function () {
        Array.prototype.forEach.call(document.querySelectorAll("audio,video"), function (media) {
          if (!media.paused && !media.ended) renewSoon();
        });
      }, { once: true });
    }
  })();
</script>`;
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
  if (process.env.OPENLIST_PATCH_ONLY === "1") {
    await patchIndexHtml();
    await patchFrontendBundles();
    await writeFile(resolve(distDir, "_routes.json"), JSON.stringify(pagesRoutes, null, 2) + "\n");
    await writeFile(resolve(distDir, "_headers"), pagesHeaders);
    await writeFile(resolve(distDir, "_redirects"), "/* /index.html 200\n");
    console.log("OpenList frontend patches have been applied to existing cloudflare-pages/dist");
    return;
  }

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
  let replacedCustomize = false;
  html = html.replace(/<script\b[^>]*id=["']openlist-pages-customize["'][\s\S]*?<\/script>/i, () => {
    replacedCustomize = true;
    return customizeBootstrap.replace(/\n/g, "\n    ");
  });
  html = await injectPreloadLinks(html);
  html = await injectLanguagePreloadScript(html);
  html = injectLoadingImageBootstrap(html);
  html = injectTurnstileBootstrap(html);
  html = injectFsListCacheBootstrap(html);
  if (!replacedCustomize) html = injectCustomizeBootstrap(html);
  html = html
    .replace(/\n<meta charset=/i, "\n    <meta charset=")
    .replace(/\n\s*\n    <meta charset=/i, "\n    <meta charset=");
  await writeFile(indexPath, html);
}

function injectLoadingImageBootstrap(html) {
  html = html.replace(/<style\b[^>]*id=["']openlist-pages-loading-image-style["'][\s\S]*?<\/style>\s*/i, "");
  html = html.replace(/<script\b[^>]*id=["']openlist-pages-loading-image["'][\s\S]*?<\/script>\s*/i, "");
  const block = loadingImageBootstrap.replace(/\n/g, "\n    ");
  const marker = "<!-- customize head -->";
  if (html.includes(marker)) return html.replace(marker, `${marker}\n    ${block}`);
  return html.replace("</head>", `    ${block}\n  </head>`);
}

function injectTurnstileBootstrap(html) {
  html = html.replace(/<script\b[^>]*id=["']openlist-pages-turnstile["'][\s\S]*?<\/script>\s*/i, "");
  const block = turnstileBootstrap.replace(/\n/g, "\n    ");
  const marker = "<!-- customize head -->";
  if (html.includes(marker)) return html.replace(marker, `${marker}\n    ${block}`);
  return html.replace("</head>", `    ${block}\n  </head>`);
}

function injectFsListCacheBootstrap(html) {
  html = html.replace(/<script\b[^>]*id=["']openlist-pages-fs-list-cache["'][\s\S]*?<\/script>\s*/i, "");
  const block = fsListCacheBootstrap.replace(/\n/g, "\n    ");
  const marker = "<!-- customize head -->";
  if (html.includes(marker)) return html.replace(marker, `${marker}\n    ${block}`);
  return html.replace("</head>", `    ${block}\n  </head>`);
}

function injectCustomizeBootstrap(html) {
  const marker = "<!-- customize head -->";
  const block = customizeBootstrap.replace(/\n/g, "\n    ");
  if (/<script\s+type=["']module["']>/i.test(html)) {
    return html.replace(/(\n\s*<script\s+type=["']module["'][^>]*>)/i, `\n    ${block}$1`);
  }
  if (html.includes(marker)) {
    return html.replace(marker, `${marker}\n    ${block}`);
  }
  return html.replace("</head>", `    ${block}\n  </head>`);
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
    `          function normalizeLang(value) {`,
    `            var raw = String(value || "en");`,
    `            var lower = raw.toLowerCase();`,
    `            if (lower === "zh-cn" || lower === "zh-hans" || lower === "zh-sg") return { storage: "zh-CN", key: "zh-cn" };`,
    `            if (lower === "zh-tw" || lower === "zh-hk" || lower === "zh-mo" || lower === "zh-hant") return { storage: "zh-TW", key: "zh-tw" };`,
    `            if (lower.indexOf("zh") === 0) return /tw|hk|mo|hant/.test(lower) ? { storage: "zh-TW", key: "zh-tw" } : { storage: "zh-CN", key: "zh-cn" };`,
    `            if (lower.indexOf("en") === 0) return { storage: "en", key: "en" };`,
    `            return { storage: saved || "", key: lower };`,
    `          }`,
    `          var normalized = normalizeLang(saved || navigator.language || "en");`,
    `          if (normalized.storage && normalized.storage !== saved) {`,
    `            try { localStorage.setItem("lang", normalized.storage); } catch (error) {}`,
    `          }`,
    `          var lang = normalized.key;`,
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
  if (html.includes(preloadEnd)) return html.replace(preloadEnd, `${preloadEnd}\n    ${block}\n    `);
  const marker = "<!-- customize head -->";
  if (html.includes(marker)) return html.replace(marker, `${marker}\n    ${block}\n    `);
  return html.replace("</head>", `    ${block}\n    </head>`);
}

async function injectPreloadLinks(html) {
  html = html.replace(new RegExp(`\\s*${escapeRegExp(preloadStart)}[\\s\\S]*?${escapeRegExp(preloadEnd)}\\s*`, "i"), "\n");
  html = html.replace(/\s*<link\b(?=[^>]*rel=["']preload["'])(?=[^>]*href=["']\/api\/public\/settings["'])[^>]*>\s*/i, "\n");
  const preloads = await collectPreloadLinks(html);
  if (preloads.length === 0) return html;
  const block = [
    preloadStart,
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

async function collectPreloadLinks(html) {
  const links = new Set();
  const add = (href) => {
    if (href && href.startsWith("/assets/") && !href.includes("-legacy-")) links.add(href);
  };

  for (const match of html.matchAll(/(?:src|href|data-src)=["'](\/assets\/index-[^"']+\.(?:js|css))["']/g)) {
    add(match[1]);
  }
  for (const match of html.matchAll(/["'](?:src|href|data-src)["']\s*:\s*["'](\/assets\/index-[^"']+\.(?:js|css))["']/g)) {
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
      /(?<!:)\b([A-Za-z_$][\w$]*)\.get\(([`"'])\/public\/settings\2\)/g,
      '(window.__openlistPagesPublicSettings?Promise.resolve({code:200,message:"success",data:window.__openlistPagesTakePublicSettings()}):$1.get("/public/settings"))',
    );
    const nextWithLanguageFallback = patchLanguageDictionaryFallback(next);
    if (nextWithLanguageFallback === source) continue;
    await writeFile(filePath, nextWithLanguageFallback);
    patched += 1;
  }
  if (patched > 0) console.log(`Patched ${patched} frontend bundle(s) for Pages compatibility`);
}

function patchLanguageDictionaryFallback(source) {
  const pattern =
    /var ([A-Za-z_$][\w$]*)=async ([A-Za-z_$][\w$]*)=>\{try\{let ([A-Za-z_$][\w$]*)=\(await ([A-Za-z_$][\w$]*)\(Object\.assign\((\{[\s\S]*?"\.\.\/lang\/zh-TW\/entry\.ts"[\s\S]*?\})\),`\.\.\/lang\/\$\{\2\}\/entry\.ts`,4\)\)\.dict;return ([A-Za-z_$][\w$]*)\(\3\)\}catch\(([A-Za-z_$][\w$]*)\)\{throw console\.error\(`Error loading dictionary for locale: \$\{\2\}`,\7\),Error\(`Failed to load dictionary for \$\{\2\}`\)\}\}/;
  return source.replace(pattern, (_match, loader, locale, dict, importMap, modules, transform) => {
    return `var ${loader}=async ${locale}=>{let n=String(${locale}||\`en\`),r=[n,n.toLowerCase().startsWith(\`zh\`)?(/tw|hk|mo|hant/i.test(n)?\`zh-TW\`:\`zh-CN\`):\`en\`,\`en\`].filter((e,t,n)=>e&&n.indexOf(e)===t);for(let i of r)try{let ${dict}=(await ${importMap}(Object.assign(${modules}),\`../lang/\${i}/entry.ts\`,4)).dict;return ${transform}(${dict})}catch(a){console.error(\`Error loading dictionary for locale: \`+i,a)}throw Error(\`Failed to load dictionary for \`+${locale})}`;
  });
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
