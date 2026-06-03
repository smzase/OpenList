const ROLE_GENERAL = 0;
const ROLE_GUEST = 1;
const ROLE_ADMIN = 2;

const FLAG_PUBLIC = 0;
const FLAG_PRIVATE = 1;
const FLAG_READONLY = 2;

const STATIC_HASH_SALT = "https://github.com/alist-org/alist";
const WORK_STATUS = "work";

const DEFAULT_WEB_CDN = "https://res.oplist.org";
const MEM_CACHE = new Map();
const INFLIGHT_LISTS = new Map();
const VOLATILE_SETTING_KEYS = new Set(["index_progress", "scan_progress"]);
const SETTINGS_MEMORY_TTL = 60;
const GUEST_API_CACHE_SECONDS = 60;
const PUBLIC_CONFIG_TTL = 300;
const RUNTIME_MEMORY_TTL = 300;
const SESSION_CACHE_SECONDS = 60;
const LONG_CACHE_SECONDS = 30 * 24 * 3600;
const DIRECTORY_REVALIDATE_LOCK_SECONDS = 60;
const BUILTIN_ADMIN_SCRIPT_VERSION = "storage-cache-refresh-v4";
const TURNSTILE_VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const TURNSTILE_COOKIE = "openlist_turnstile";
const TURNSTILE_PASS_SECONDS = 30 * 60;
const ONEDRIVE_LIST_SELECT = [
  "id",
  "name",
  "size",
  "folder",
  "file",
  "fileSystemInfo",
  "createdDateTime",
  "lastModifiedDateTime",
  "cTag",
  "eTag",
].join(",");
let initPromise = null;
let initializedUntil = 0;
let runtimeCacheNamespace = "default";
let fsRuntimeCacheNamespace = "openlist-fs-v1";

const GROUPS = {
  SINGLE: 0,
  SITE: 1,
  STYLE: 2,
  PREVIEW: 3,
  GLOBAL: 4,
  INDEX: 6,
};

const DEFAULT_SETTINGS = [
  item("version", "Cloudflare Pages", "string", GROUPS.SITE, FLAG_READONLY),
  item("site_title", "OpenList", "string", GROUPS.SITE),
  item("announcement", "Welcome to OpenList Pages.", "text", GROUPS.SITE),
  item("pagination_type", "all", "select", GROUPS.SITE, FLAG_PUBLIC, "all,pagination,load_more,auto_load_more"),
  item("default_page_size", "30", "number", GROUPS.SITE),
  item("allow_indexed", "false", "bool", GROUPS.SITE),
  item("allow_mounted", "true", "bool", GROUPS.SITE),
  item("robots_txt", "User-agent: *\nAllow: /", "text", GROUPS.SITE),
  item("logo", "https://res.oplist.org/logo/logo.svg", "text", GROUPS.STYLE),
  item("favicon", "https://res.oplist.org/logo/logo.svg", "string", GROUPS.STYLE),
  item("main_color", "#1890ff", "string", GROUPS.STYLE),
  item("home_icon", "Home", "string", GROUPS.STYLE),
  item("share_icon", "Share", "string", GROUPS.STYLE),
  item("home_container", "max_980px", "select", GROUPS.STYLE, FLAG_PUBLIC, "max_980px,hope_container"),
  item("settings_layout", "list", "select", GROUPS.STYLE, FLAG_PUBLIC, "list,responsive"),
  item("hide_storage_details", "true", "bool", GROUPS.STYLE, FLAG_PRIVATE),
  item("hide_storage_details_in_manage_page", "true", "bool", GROUPS.STYLE, FLAG_PRIVATE),
  item("show_disk_usage_in_plain_text", "false", "bool", GROUPS.STYLE),
  item("text_types", "txt,htm,html,xml,java,properties,sql,js,md,json,conf,ini,yml,go,sh,c,cpp,h,tsx,vtt,srt,ass,rs,lrc,strm", "text", GROUPS.PREVIEW, FLAG_PRIVATE),
  item("audio_types", "mp3,flac,ogg,m4a,wav,opus,wma", "text", GROUPS.PREVIEW, FLAG_PRIVATE),
  item("video_types", "mp4,mkv,avi,mov,rmvb,webm,flv,m3u8", "text", GROUPS.PREVIEW, FLAG_PRIVATE),
  item("image_types", "jpg,tiff,jpeg,png,gif,bmp,svg,ico,webp,avif", "text", GROUPS.PREVIEW, FLAG_PRIVATE),
  item("proxy_types", "m3u8,url", "text", GROUPS.PREVIEW, FLAG_PRIVATE),
  item("proxy_ignore_headers", "authorization,referer", "text", GROUPS.PREVIEW, FLAG_PRIVATE),
  item("external_previews", "{}", "text", GROUPS.PREVIEW),
  item("iframe_previews", JSON.stringify({
    "doc,docx,xls,xlsx,ppt,pptx": {
      Microsoft: "https://view.officeapps.live.com/op/view.aspx?src=$e_url",
      Google: "https://docs.google.com/gview?url=$e_url&embedded=true",
    },
    pdf: {
      "PDF.js": "https://res.oplist.org/pdf.js/web/viewer.html?file=$e_url",
    },
    epub: {
      "EPUB.js": "https://res.oplist.org/epub.js/viewer.html?url=$e_url",
    },
  }, null, 2), "text", GROUPS.PREVIEW),
  item("audio_cover", "https://res.oplist.org/logo/logo.svg", "string", GROUPS.PREVIEW),
  item("audio_autoplay", "true", "bool", GROUPS.PREVIEW),
  item("video_autoplay", "true", "bool", GROUPS.PREVIEW),
  item("preview_download_by_default", "false", "bool", GROUPS.PREVIEW),
  item("preview_archives_by_default", "false", "bool", GROUPS.PREVIEW),
  item("share_preview_download_by_default", "true", "bool", GROUPS.PREVIEW),
  item("share_preview_archives_by_default", "false", "bool", GROUPS.PREVIEW),
  item("readme_autorender", "true", "bool", GROUPS.PREVIEW),
  item("filter_readme_scripts", "true", "bool", GROUPS.PREVIEW),
  item("non_efs_zip_encoding", "IBM437", "string", GROUPS.PREVIEW),
  item("hide_files", "/\\/README.md/i", "text", GROUPS.GLOBAL),
  item("package_download", "false", "bool", GROUPS.GLOBAL),
  item("customize_head", "", "text", GROUPS.GLOBAL, FLAG_PRIVATE),
  item("customize_body", "", "text", GROUPS.GLOBAL, FLAG_PRIVATE),
  item("link_expiration", "0", "number", GROUPS.GLOBAL, FLAG_PRIVATE),
  item("sign_all", "true", "bool", GROUPS.GLOBAL, FLAG_PRIVATE),
  item("preheat_directories", "true", "bool", GROUPS.GLOBAL, FLAG_PRIVATE),
  item("preheat_directory_limit", "3", "number", GROUPS.GLOBAL, FLAG_PRIVATE),
  item("privacy_regs", "(?:(?:\\d|[1-9]\\d|1\\d\\d|2[0-4]\\d|25[0-5])\\.){3}(?:\\d|[1-9]\\d|1\\d\\d|2[0-4]\\d|25[0-5])", "text", GROUPS.GLOBAL, FLAG_PRIVATE),
  item("ocr_api", "https://openlistteam-ocr-api-server.hf.space/ocr/file/json", "string", GROUPS.GLOBAL),
  item("filename_char_mapping", "{\"/\":\"|\"}", "text", GROUPS.GLOBAL),
  item("forward_direct_link_params", "false", "bool", GROUPS.GLOBAL),
  item("ignore_direct_link_params", "sign,sign_ts,openlist_ts,raw", "string", GROUPS.GLOBAL),
  item("webauthn_login_enabled", "false", "bool", GROUPS.GLOBAL),
  item("share_preview", "false", "bool", GROUPS.GLOBAL),
  item("share_archive_preview", "false", "bool", GROUPS.GLOBAL),
  item("share_force_proxy", "true", "bool", GROUPS.GLOBAL, FLAG_PRIVATE),
  item("handle_hook_after_writing", "false", "bool", GROUPS.GLOBAL, FLAG_PRIVATE),
  item("handle_hook_rate_limit", "0", "number", GROUPS.GLOBAL, FLAG_PRIVATE),
  item("ignore_system_files", "true", "bool", GROUPS.GLOBAL, FLAG_PRIVATE),
  item("token", "", "string", GROUPS.SINGLE, FLAG_PRIVATE),
  item("search_index", "database", "select", GROUPS.INDEX, FLAG_PRIVATE, "database,none"),
  item("auto_update_index", "false", "bool", GROUPS.INDEX),
  item("ignore_paths", "", "text", GROUPS.INDEX, FLAG_PRIVATE),
  item("max_index_depth", "20", "number", GROUPS.INDEX, FLAG_PRIVATE),
  item("index_progress", "{}", "text", GROUPS.SINGLE, FLAG_PRIVATE),
];

const ONEDRIVE_DRIVER_INFO = {
  common: [
    driverItem("mount_path", "string", "", "", true, "The path you want to mount to, it is unique and cannot be repeated"),
    driverItem("order", "number", "", "", false, "use to sort"),
    driverItem("remark", "text"),
    driverItem("cache_expiration", "number", "30", "", true, "The cache expiration time for this storage, in minutes"),
    driverItem("custom_cache_policies", "text"),
    driverItem("web_proxy", "bool"),
    driverItem("webdav_policy", "select", "302_redirect", "302_redirect,use_proxy_url,native_proxy", true),
    driverItem("down_proxy_url", "text"),
    driverItem("disable_proxy_sign", "bool", "false"),
    driverItem("order_by", "select", "", "name,size,modified"),
    driverItem("order_direction", "select", "", "asc,desc"),
    driverItem("extract_folder", "select", "", "front,back"),
    driverItem("disable_index", "bool", "false", "", true),
    driverItem("enable_sign", "bool", "false", "", true),
  ],
  additional: [
    driverItem("root_folder_path", "string", "/", "", true),
    driverItem("region", "select", "global", "global,cn,us,de", true),
    driverItem("is_sharepoint", "bool"),
    driverItem("use_online_api", "bool", "true"),
    driverItem("api_url_address", "string", "https://api.oplist.org/onedrive/renewapi"),
    driverItem("client_id", "string"),
    driverItem("client_secret", "string"),
    driverItem("redirect_uri", "string", "https://api.oplist.org/onedrive/callback", true),
    driverItem("refresh_token", "string", "", "", true),
    driverItem("site_id", "string"),
    driverItem("chunk_size", "number", "5"),
    driverItem("custom_host", "string", "", "", false, "Custom host for onedrive download link"),
    driverItem("disable_disk_usage", "bool", "false"),
    driverItem("enable_direct_upload", "bool", "false", "", false, "Stored for UI compatibility only in Pages mode"),
  ],
  config: {
    name: "Onedrive",
    local_sort: true,
    only_proxy: false,
    no_cache: false,
    no_upload: true,
    need_ms: false,
    default_root: "/",
    alert: "",
    only_indices: false,
    prefer_proxy: false,
  },
};

export async function onRequest(context) {
  const { request, env } = context;
  try {
    runtimeCacheNamespace = runtimeCacheNamespaceFromEnv(env);
    fsRuntimeCacheNamespace = fsRuntimeCacheNamespaceFromEnv(env);
    const url = new URL(request.url);
    const path = normalizePath(url.pathname);

    if (isStaticAssetRequest(path) && !isDynamicAssetRoute(path) && env.ASSETS) {
      const assetResp = await env.ASSETS.fetch(request);
      if (assetResp.status !== 404) return staticAssetResponse(assetResp, path);
    }

    if (path === "/api/turnstile/status") return turnstileStatus(request, env);
    if (path === "/api/turnstile/challenge") return turnstileChallengeResponse(request, env, 200);
    if (path === "/api/turnstile/verify") return turnstileVerify(request, env);

    const turnstileGate = await requireTurnstile(request, env, path);
    if (turnstileGate) return turnstileGate;

    if (!env.OPENLIST_DB) {
      return text("OPENLIST_DB D1 binding is missing", 500);
    }
    await ensureInitialized(env);

    if (isStaticAssetRequest(path) && !isDynamicAssetRoute(path) && env.ASSETS) {
      const assetResp = await env.ASSETS.fetch(request);
      if (assetResp.status !== 404) return staticAssetResponse(assetResp, path);
    }
    if (path === "/ping") return text("pong");
    if (path === "/manifest.json") return manifest(env, request);
    if (path.startsWith("/api/")) return apiRouter(request, env, path, context);
    if (path === "/robots.txt") return robots(env);
    if (path === "/favicon.ico") return favicon(env);
    if (path.startsWith("/d/")) return downloadRouter(request, env, path);

    return frontend(request, env);
  } catch (error) {
    return jsonError(error, 500, true);
  }
}

async function apiRouter(request, env, path, context) {
  if (path === "/api/public/settings") return publicSettings(env);
  if (path === "/api/public/offline_download_tools") {
    return ok([], publicApiDebugHeaders("static", nowMilliseconds(), { "Cache-Control": "public, max-age=86400" }));
  }
  if (path === "/api/public/archive_extensions") {
    return ok([], publicApiDebugHeaders("static", nowMilliseconds(), { "Cache-Control": "public, max-age=86400" }));
  }
  if (path === "/api/auth/login" || path === "/api/auth/login/hash") return login(request, env, path.endsWith("/hash"));
  if (path === "/api/auth/login/ldap") return apiError("LDAP login is not supported in Cloudflare Pages mode", 400);
  if (path === "/api/auth/sso") return apiError("SSO login is not supported in Cloudflare Pages mode", 400);
  if (path === "/api/auth/logout") return logout(request, env);
  if (path === "/api/me") return currentUser(request, env);
  if (path === "/api/me/update") return requireLogin(request, env, (user) => updateCurrentUser(request, env, user));
  if (path === "/api/auth/2fa/generate") return apiError("2FA is not supported in Cloudflare Pages mode", 400);
  if (path === "/api/auth/2fa/verify") return apiError("2FA is not supported in Cloudflare Pages mode", 400);
  if (path === "/api/authn/getcredentials") return requireLogin(request, env, () => ok([]));
  if (path === "/api/authn/delete_authn") return requireLogin(request, env, () => ok());
  if (path.startsWith("/api/authn/")) return apiError("WebAuthn is not supported in Cloudflare Pages mode", 400);
  if (path === "/api/me/sshkey/list") return requireLogin(request, env, () => ok({ content: [], total: 0 }));
  if (path === "/api/me/sshkey/add") return requireLogin(request, env, () => apiError("SSH keys are not supported in Cloudflare Pages mode", 400));
  if (path === "/api/me/sshkey/delete") return requireLogin(request, env, () => ok());
  if (path === "/api/fs/list") return fsList(request, env, context);
  if (path === "/api/fs/get") return fsGet(request, env);
  if (path === "/api/fs/dirs") return fsDirs(request, env);
  if (path === "/api/fs/search") return fsSearch(request, env);
  if (path.startsWith("/api/fs/")) return fsCompat(request, env, path);
  if (path.startsWith("/api/task/")) return requireLogin(request, env, (user) => taskCompat(request, env, path, user));
  if (path.startsWith("/api/share/")) return requireLogin(request, env, (user) => shareCompat(request, env, path, user));
  if (path === "/api/admin/driver/list") return requireAdmin(request, env, () => ok({ Onedrive: ONEDRIVE_DRIVER_INFO }));
  if (path === "/api/admin/driver/names") return requireAdmin(request, env, () => ok(["Onedrive"]));
  if (path === "/api/admin/driver/info") return requireAdmin(request, env, async () => {
    const url = new URL(request.url);
    const driver = url.searchParams.get("driver") || "Onedrive";
    if (driver !== "Onedrive") return apiError(`driver [${driver}] not found`, 404);
    return ok(ONEDRIVE_DRIVER_INFO);
  });
  if (path.startsWith("/api/admin/user/")) return requireAdmin(request, env, (admin) => adminUser(request, env, path, admin));
  if (path.startsWith("/api/admin/setting/")) return requireAdmin(request, env, () => adminSetting(request, env, path));
  if (path.startsWith("/api/admin/storage/")) return requireAdmin(request, env, () => adminStorage(request, env, path, context));
  if (path.startsWith("/api/admin/meta/")) return requireAdmin(request, env, () => adminMeta(request, env, path));
  if (path.startsWith("/api/admin/index/")) return requireAdmin(request, env, () => adminIndex(request, env, path));
  if (path.startsWith("/api/admin/scan/")) return requireAdmin(request, env, () => adminScan(request, env, path));
  if (path.startsWith("/api/admin/message/")) return requireAdmin(request, env, () => adminMessage(request, env, path));
  if (path.startsWith("/api/admin/")) return requireAdmin(request, env, () => adminCompat(path));
  return apiError("api not found", 404);
}

async function requireTurnstile(request, env, path) {
  if (!turnstileEnabled(env)) return null;
  if (isTurnstileBypassPath(path)) return null;
  if (await hasValidTurnstilePass(request, env)) return null;
  if (path.startsWith("/api/")) return turnstileRequiredJson();
  if (request.method !== "GET" && request.method !== "HEAD") return turnstileRequiredJson();
  return turnstileChallengeResponse(request, env);
}

function isTurnstileBypassPath(path) {
  return (
    path === "/api/turnstile/status" ||
    path === "/api/turnstile/challenge" ||
    path === "/api/turnstile/verify" ||
    path === "/ping" ||
    (isStaticAssetRequest(path) && !isDynamicAssetRoute(path))
  );
}

async function hasValidTurnstilePass(request, env) {
  const secret = turnstileSecretKey(env);
  if (!secret) return false;
  const value = cookieValue(request, TURNSTILE_COOKIE);
  const parts = value.split(".");
  if (parts.length !== 2) return false;
  const expiresAt = Number(parts[0]);
  const signature = String(parts[1] || "").toLowerCase();
  if (!Number.isSafeInteger(expiresAt) || expiresAt <= nowSeconds() || !/^[a-f0-9]{64}$/.test(signature)) return false;
  const expected = await turnstileCookieSignature(env, expiresAt);
  return timingSafeEqual(expected, signature);
}

async function turnstileVerify(request, env) {
  if (!turnstileEnabled(env)) {
    return json({ code: 400, message: "Turnstile is not enabled", data: null }, 400, { "Cache-Control": "no-store" });
  }
  if (request.method !== "POST") {
    return json({ code: 405, message: "method not allowed", data: null }, 405, { "Cache-Control": "no-store" });
  }
  const secret = turnstileSecretKey(env);
  const body = await readBody(request);
  const token = String(body.token || body.response || body["cf-turnstile-response"] || "").trim();
  if (!token) {
    return json({ code: 400, message: "Turnstile token is required", data: null }, 400, { "Cache-Control": "no-store" });
  }

  const form = new URLSearchParams();
  form.set("secret", secret);
  form.set("response", token);
  const remoteIp = request.headers.get("CF-Connecting-IP") || request.headers.get("x-forwarded-for") || "";
  if (remoteIp) form.set("remoteip", remoteIp.split(",")[0].trim());

  const verifyResp = await fetch(TURNSTILE_VERIFY_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: form.toString(),
  }).catch((error) => {
    throw new Error(`Turnstile siteverify request failed: ${error && error.message ? error.message : error}`);
  });
  const verifyData = await verifyResp.json().catch(() => null);
  if (!verifyResp.ok || !verifyData || !verifyData.success) {
    return json({
      code: 403,
      message: "Turnstile verification failed",
      data: { error_codes: verifyData ? verifyData["error-codes"] || [] : [] },
    }, 403, { "Cache-Control": "no-store" });
  }

  const expiresAt = nowSeconds() + TURNSTILE_PASS_SECONDS;
  return ok(
    { expires_at: expiresAt, expires_in: TURNSTILE_PASS_SECONDS },
    {
      "Cache-Control": "no-store",
      "Set-Cookie": await turnstilePassCookie(env, expiresAt),
    },
  );
}

async function turnstileStatus(request, env) {
  const enabled = turnstileEnabled(env);
  const verified = enabled ? await hasValidTurnstilePass(request, env) : false;
  const headers = { "Cache-Control": "no-store" };
  if (verified) {
    headers["Set-Cookie"] = await turnstilePassCookie(env, nowSeconds() + TURNSTILE_PASS_SECONDS);
  }
  return ok({
    enabled,
    verified,
    expires_in: verified ? TURNSTILE_PASS_SECONDS : 0,
    challenge_url: "/api/turnstile/challenge",
  }, headers);
}

function turnstileRequiredJson() {
  return json({
    code: 403,
    message: "Turnstile verification required",
    data: { challenge_url: "/api/turnstile/challenge", verify_url: "/api/turnstile/verify" },
  }, 403, { "Cache-Control": "no-store" });
}

function turnstileChallengeResponse(request, env, status = 403) {
  return new Response(turnstileChallengeHtml(request, env), {
    status,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

function turnstileChallengeHtml(request, env) {
  const siteKey = turnstileSiteKey(env);
  const secretMissing = !turnstileSecretKey(env);
  const siteKeyMissing = !siteKey;
  const configMissing = secretMissing || siteKeyMissing;
  const missingKeys = [
    siteKeyMissing ? "OPENLIST_TURNSTILE_SITE_KEY" : "",
    secretMissing ? "OPENLIST_TURNSTILE_SECRET_KEY" : "",
  ].filter(Boolean).join(" and ");
  const returnTo = turnstileReturnTo(request);
  const notice = configMissing
    ? `<div class="notice">${escapeHtml(missingKeys)} ${missingKeys.includes(" and ") ? "are" : "is"} not configured in Cloudflare Pages.</div>`
    : `<div class="cf-turnstile" data-sitekey="${escapeAttr(siteKey)}" data-callback="openlistTurnstileCallback" data-expired-callback="openlistTurnstileExpired" data-error-callback="openlistTurnstileError" data-theme="auto"></div>`;
  const script = configMissing ? "" : `<script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>`;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<title>Security check - OpenList</title>
<style>
:root{color-scheme:light dark;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
*{box-sizing:border-box}
body{margin:0;min-height:100vh;display:grid;place-items:center;background:url("https://acgpic.072158.xyz/pb/pic/1780203886061_mdadhf.webp") top / cover no-repeat;padding:24px}
.shell{width:min(360px,calc(100vw - 32px));min-height:120px;display:grid;place-items:center;background:rgba(255,255,255,.72);border:1px solid rgba(255,255,255,.72);border-radius:12px;padding:24px;box-shadow:0 24px 70px rgba(15,23,42,.24);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px)}
.widget{display:grid;place-items:center;min-height:70px}
.notice{border:1px solid rgba(245,158,11,.45);background:rgba(255,248,225,.82);color:#854d0e;border-radius:8px;padding:12px;line-height:1.45;text-align:center}
@media(max-width:520px){body{padding:16px}.shell{padding:18px}}
</style>
<script>
var openlistTurnstileReturnTo = ${scriptJson(returnTo)};
function openlistTurnstileStatus(message) {
  var target = document.getElementById("turnstile-status");
  if (target) target.textContent = message || "";
}
window.openlistTurnstileCallback = async function(token) {
  openlistTurnstileStatus("Verifying...");
  try {
    var resp = await fetch("/api/turnstile/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: token })
    });
    var data = await resp.json().catch(function(){ return {}; });
    if (!resp.ok || data.code !== 200) throw new Error(data.message || "Verification failed");
    try {
      var expiresAt = data && data.data ? data.data.expires_at : 0;
      if (expiresAt) localStorage.setItem("openlist_turnstile_verified_until", String(expiresAt));
    } catch (error) {}
    openlistTurnstileStatus("Verified. Continuing...");
    location.replace(openlistTurnstileReturnTo || "/");
  } catch (error) {
    openlistTurnstileStatus(error && error.message ? error.message : "Verification failed");
    if (window.turnstile) window.turnstile.reset();
  }
};
window.openlistTurnstileExpired = function() {
  openlistTurnstileStatus("Verification expired. Please try again.");
};
window.openlistTurnstileError = function() {
  openlistTurnstileStatus("Verification failed to load. Please refresh and try again.");
};
</script>
</head>
<body>
<main class="shell">
  <div class="widget">${notice}</div>
  <noscript><div class="notice">JavaScript is required.</div></noscript>
</main>
${script}
</body>
</html>`;
}

function turnstileReturnTo(request) {
  const url = new URL(request.url);
  const explicit = url.searchParams.get("return_to");
  if (explicit && explicit.startsWith("/") && !explicit.startsWith("//")) return explicit;
  return `${url.pathname}${url.search}`;
}

function turnstileSiteKey(env) {
  return String(env.OPENLIST_TURNSTILE_SITE_KEY || "").trim();
}

function turnstileSecretKey(env) {
  return String(env.OPENLIST_TURNSTILE_SECRET_KEY || "").trim();
}

function turnstileEnabled(env) {
  return !!turnstileSiteKey(env) && !!turnstileSecretKey(env);
}

async function turnstilePassCookie(env, expiresAt) {
  const value = `${expiresAt}.${await turnstileCookieSignature(env, expiresAt)}`;
  return `${TURNSTILE_COOKIE}=${encodeURIComponent(value)}; Path=/; Max-Age=${TURNSTILE_PASS_SECONDS}; HttpOnly; Secure; SameSite=Lax`;
}

async function turnstileCookieSignature(env, expiresAt) {
  return hmacHex(turnstileSecretKey(env), `turnstile:${expiresAt}`);
}

async function ensureInitialized(env) {
  if (initializedUntil > nowSeconds()) return;
  if (!initPromise) {
    initPromise = initializeIfNeeded(env).finally(() => {
      initPromise = null;
    });
  }
  await initPromise;
  initializedUntil = nowSeconds() + 3600;
}

async function initializeIfNeeded(env) {
  const db = env.OPENLIST_DB;
  const ready = await db.prepare(`
    SELECT
      (SELECT COUNT(*) FROM settings WHERE key IN ('version', 'token')) AS settings_count,
      (SELECT COUNT(*) FROM users WHERE role = ?) AS admin_count,
      (SELECT COUNT(*) FROM users WHERE role = ?) AS guest_count
  `).bind(ROLE_ADMIN, ROLE_GUEST).first();

  if (
    Number(ready?.settings_count || 0) >= 2 &&
    Number(ready?.admin_count || 0) > 0 &&
    Number(ready?.guest_count || 0) > 0
  ) {
    return;
  }

  await db.prepare("INSERT OR IGNORE INTO settings (key, value, help, type, options, group_id, flag, item_index) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
    .bind("token", await randomToken(), "", "string", "", GROUPS.SINGLE, FLAG_PRIVATE, 0)
    .run();

  for (let i = 0; i < DEFAULT_SETTINGS.length; i++) {
    const s = DEFAULT_SETTINGS[i];
    await db.prepare("INSERT OR IGNORE INTO settings (key, value, help, type, options, group_id, flag, item_index) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
      .bind(s.key, s.value, s.help, s.type, s.options, s.group, s.flag, i)
      .run();
  }

  const adminName = env.OPENLIST_ADMIN_USERNAME || "admin";
  const adminPassword = env.OPENLIST_ADMIN_PASSWORD || "admin";
  const existingAdmin = await db.prepare("SELECT id FROM users WHERE role = ? LIMIT 1").bind(ROLE_ADMIN).first();
  if (!existingAdmin) {
    const salt = await randomToken(16);
    const pwdHash = await passwordHashFromRaw(adminPassword, salt);
    await db.prepare("INSERT INTO users (username, pwd_hash, pwd_ts, salt, base_path, role, disabled, permission, authn) VALUES (?, ?, ?, ?, '/', ?, 0, ?, '[]')")
      .bind(adminName, pwdHash, nowSeconds(), salt, ROLE_ADMIN, 65535)
      .run();
  }

  const guest = await db.prepare("SELECT id FROM users WHERE role = ? LIMIT 1").bind(ROLE_GUEST).first();
  if (!guest) {
    await db.prepare("INSERT INTO users (username, pwd_hash, pwd_ts, salt, base_path, role, disabled, permission, authn) VALUES ('guest', '', 0, '', '/', ?, 0, 0, '[]')")
      .bind(ROLE_GUEST)
      .run();
  }
  await clearSettingsCache(env);
  clearMemoryPrefix("");
}

async function login(request, env, passwordIsStaticHash) {
  const body = await readBody(request);
  const username = String(body.username || "");
  const password = String(body.password || "");
  if (!username || !password) return apiError("username and password are required", 400);
  const user = await env.OPENLIST_DB.prepare("SELECT * FROM users WHERE username = ? LIMIT 1").bind(username).first();
  if (!user || user.disabled) return apiError("Invalid username or password", 401);
  const staticHash = passwordIsStaticHash ? password : await staticPasswordHash(password);
  const hash = await sha256Hex(`${staticHash}-${user.salt}`);
  if (hash !== user.pwd_hash) return apiError("Invalid username or password", 401);
  const token = await randomToken(32);
  const expires = nowSeconds() + 86400 * 7;
  await env.OPENLIST_DB.prepare("INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)")
    .bind(token, user.id, expires)
    .run();
  memorySet(`session:${token}`, user, SESSION_CACHE_SECONDS);
  return ok({ token });
}

async function logout(request, env) {
  const token = bearerToken(request);
  if (token) {
    await env.OPENLIST_DB.prepare("DELETE FROM sessions WHERE token = ?").bind(token).run();
    memoryDelete(`session:${token}`);
  }
  return ok();
}

async function currentUser(request, env) {
  const token = bearerToken(request);
  const user = await getRequestUser(request, env, false);
  if (!user) return apiError("Guest user is disabled, login please", 401);
  return ok(
    safeUser(user),
    token
      ? { "Cache-Control": "no-store", Vary: "Authorization" }
      : shortPublicCacheHeaders({ Vary: "Authorization" }),
  );
}

async function getRequestUser(request, env, allowDisabledGuest) {
  const token = bearerToken(request);
  if (token) {
    const sessionKey = `session:${token}`;
    let row = memoryGet(sessionKey);
    if (row === undefined) {
      row = await env.OPENLIST_DB.prepare(
        "SELECT users.* FROM sessions JOIN users ON users.id = sessions.user_id WHERE sessions.token = ? AND sessions.expires_at > ? LIMIT 1"
      ).bind(token, nowSeconds()).first();
      memorySet(sessionKey, row || null, SESSION_CACHE_SECONDS);
    }
    if (row && !row.disabled) return row;
  }
  const guest = await getGuestUser(env);
  if (!guest) return null;
  if (guest.disabled && !allowDisabledGuest) return null;
  return guest;
}

async function getGuestUser(env) {
  let guest = memoryGet("user:guest");
  if (guest !== undefined) return guest;
  guest = await getRuntimeCache("user:guest");
  if (guest !== null) {
    memorySet("user:guest", guest, PUBLIC_CONFIG_TTL);
    return guest;
  }
  guest = await env.OPENLIST_DB.prepare("SELECT id, username, base_path, role, disabled, permission, allow_ldap FROM users WHERE role = ? LIMIT 1").bind(ROLE_GUEST).first();
  memorySet("user:guest", guest || null, PUBLIC_CONFIG_TTL);
  if (guest) await setRuntimeCache("user:guest", guest, PUBLIC_CONFIG_TTL);
  return guest || null;
}

async function requireAdmin(request, env, handler) {
  if (!bearerToken(request)) return apiError("permission denied", 403);
  const user = await getRequestUser(request, env, true);
  if (!user || user.role !== ROLE_ADMIN || user.disabled) return apiError("permission denied", 403);
  return handler(user);
}

async function requireLogin(request, env, handler) {
  if (!bearerToken(request)) return apiError("login required", 401);
  const user = await getRequestUser(request, env, false);
  if (!user || user.role === ROLE_GUEST) return apiError("login required", 401);
  return handler(user);
}

async function updateCurrentUser(request, env, user) {
  const body = await readBody(request);
  let salt = user.salt;
  let pwdHash = user.pwd_hash;
  let pwdTs = user.pwd_ts;
  if (body.password) {
    salt = await randomToken(16);
    pwdHash = await passwordHashFromRaw(String(body.password), salt);
    pwdTs = nowSeconds();
  }
  await env.OPENLIST_DB.prepare("UPDATE users SET username = ?, pwd_hash = ?, pwd_ts = ?, salt = ?, sso_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
    .bind(String(body.username || user.username), pwdHash, pwdTs, salt, String(body.sso_id || user.sso_id || ""), user.id)
    .run();
  await clearUserCache(env);
  return ok();
}

async function adminUser(request, env, path, admin) {
  const db = env.OPENLIST_DB;
  if (path.includes("/sshkey/")) {
    if (path.endsWith("/list")) return ok({ content: [], total: 0 });
    if (path.endsWith("/delete")) return ok();
    return apiError("SSH keys are not supported in Cloudflare Pages mode", 400);
  }
  if (path.endsWith("/list")) {
    const page = pageReq(await readBody(request), request);
    const total = await db.prepare("SELECT COUNT(*) AS count FROM users").first();
    const rows = await db.prepare("SELECT * FROM users ORDER BY id LIMIT ? OFFSET ?").bind(page.per_page, page.offset).all();
    return ok({ content: rows.results.map(safeUser), total: total.count || 0 });
  }
  if (path.endsWith("/get")) {
    const id = intParam(request, "id");
    const user = await db.prepare("SELECT * FROM users WHERE id = ?").bind(id).first();
    if (!user) return apiError("user not found", 404);
    return ok(safeUser(user));
  }
  if (path.endsWith("/create")) {
    const body = await readBody(request);
    if (Number(body.role) === ROLE_ADMIN || Number(body.role) === ROLE_GUEST) {
      return apiError("admin or guest user can not be created", 400);
    }
    const salt = await randomToken(16);
    const pwdHash = await passwordHashFromRaw(String(body.password || ""), salt);
    await db.prepare("INSERT INTO users (username, pwd_hash, pwd_ts, salt, base_path, role, disabled, permission, authn, allow_ldap) VALUES (?, ?, ?, ?, ?, ?, ?, ?, '[]', ?)")
      .bind(String(body.username || ""), pwdHash, nowSeconds(), salt, normalizePath(body.base_path || "/"), ROLE_GENERAL, boolInt(body.disabled), Number(body.permission || 0), boolInt(body.allow_ldap ?? true))
      .run();
    await clearUserCache(env);
    return ok();
  }
  if (path.endsWith("/update")) {
    const body = await readBody(request);
    const current = await db.prepare("SELECT * FROM users WHERE id = ?").bind(Number(body.id)).first();
    if (!current) return apiError("user not found", 404);
    if (Number(body.role) !== Number(current.role)) return apiError("role can not be changed", 400);
    if (current.role === ROLE_ADMIN && truthy(body.disabled)) return apiError("admin user can not be disabled", 400);
    let salt = current.salt;
    let pwdHash = current.pwd_hash;
    let pwdTs = current.pwd_ts;
    if (body.password) {
      salt = await randomToken(16);
      pwdHash = await passwordHashFromRaw(String(body.password), salt);
      pwdTs = nowSeconds();
    }
    await db.prepare("UPDATE users SET username = ?, pwd_hash = ?, pwd_ts = ?, salt = ?, base_path = ?, disabled = ?, permission = ?, sso_id = ?, allow_ldap = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?")
      .bind(String(body.username || current.username), pwdHash, pwdTs, salt, normalizePath(body.base_path || "/"), boolInt(body.disabled), Number(body.permission || 0), String(body.sso_id || ""), boolInt(body.allow_ldap ?? true), Number(body.id))
      .run();
    if (admin.id !== Number(body.id)) await db.prepare("DELETE FROM sessions WHERE user_id = ?").bind(Number(body.id)).run();
    await clearUserCache(env);
    return ok();
  }
  if (path.endsWith("/delete")) {
    const id = intParam(request, "id");
    const user = await db.prepare("SELECT * FROM users WHERE id = ?").bind(id).first();
    if (!user) return apiError("user not found", 404);
    if (user.role === ROLE_ADMIN || user.role === ROLE_GUEST) return apiError("admin or guest user can not be deleted", 400);
    await db.prepare("DELETE FROM users WHERE id = ?").bind(id).run();
    await db.prepare("DELETE FROM sessions WHERE user_id = ?").bind(id).run();
    await clearUserCache(env);
    return ok();
  }
  if (path.endsWith("/cancel_2fa")) {
    await db.prepare("UPDATE users SET otp_secret = '' WHERE id = ?").bind(intParam(request, "id")).run();
    return ok();
  }
  if (path.endsWith("/del_cache")) return ok();
  return apiError("api not found", 404);
}

async function adminSetting(request, env, path) {
  const db = env.OPENLIST_DB;
  if (path.endsWith("/list")) {
    const url = new URL(request.url);
    const groups = (url.searchParams.get("groups") || url.searchParams.get("group") || "")
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean)
      .map(Number);
    let rows;
    if (groups.length > 0) {
      const placeholders = groups.map(() => "?").join(",");
      rows = await db.prepare(`SELECT * FROM settings WHERE group_id IN (${placeholders}) ORDER BY item_index`).bind(...groups).all();
    } else {
      rows = await db.prepare("SELECT * FROM settings ORDER BY item_index").all();
    }
    const saved = rows.results.map(settingFromRow);
    const savedKeys = new Set(saved.map((row) => row.key));
    const defaults = DEFAULT_SETTINGS
      .map(settingFromDefault)
      .filter((row) => !savedKeys.has(row.key))
      .filter((row) => groups.length === 0 || groups.includes(row.group));
    return ok([...saved, ...defaults].sort((a, b) => (a.index - b.index) || a.key.localeCompare(b.key)));
  }
  if (path.endsWith("/get")) {
    const url = new URL(request.url);
    const key = url.searchParams.get("key");
    const keys = (url.searchParams.get("keys") || "").split(",").filter(Boolean);
    if (key) {
      const row = await db.prepare("SELECT * FROM settings WHERE key = ?").bind(key).first();
      if (!row) {
        const def = DEFAULT_SETTINGS.find((item) => item.key === key);
        if (def) return ok(settingFromDefault(def, DEFAULT_SETTINGS.indexOf(def)));
        return apiError("setting not found", 404);
      }
      return ok(settingFromRow(row));
    }
    if (keys.length === 0) return ok([]);
    const placeholders = keys.map(() => "?").join(",");
    const rows = await db.prepare(`SELECT * FROM settings WHERE key IN (${placeholders}) ORDER BY item_index`).bind(...keys).all();
    const saved = rows.results.map(settingFromRow);
    const savedKeys = new Set(saved.map((row) => row.key));
    const defaults = DEFAULT_SETTINGS
      .map(settingFromDefault)
      .filter((row) => keys.includes(row.key) && !savedKeys.has(row.key));
    return ok([...saved, ...defaults].sort((a, b) => (a.index - b.index) || a.key.localeCompare(b.key)));
  }
  if (path.endsWith("/save")) {
    const body = await readBody(request);
    const items = Array.isArray(body) ? body : [];
    for (const s of items) {
      await db.prepare("INSERT INTO settings (key, value, help, type, options, group_id, flag, item_index) VALUES (?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, help = excluded.help, type = excluded.type, options = excluded.options, group_id = excluded.group_id, flag = excluded.flag, item_index = excluded.item_index")
        .bind(String(s.key), String(s.value ?? ""), String(s.help ?? ""), String(s.type || "string"), String(s.options || ""), Number(s.group ?? s.group_id ?? 0), Number(s.flag ?? 0), Number(s.index ?? s.item_index ?? 0))
        .run();
    }
    await clearSettingsCache(env);
    return ok();
  }
  if (path.endsWith("/delete")) {
    const key = new URL(request.url).searchParams.get("key");
    if (!key) return apiError("key is required", 400);
    await db.prepare("DELETE FROM settings WHERE key = ?").bind(key).run();
    await clearSettingsCache(env);
    return ok();
  }
  if (path.endsWith("/default")) {
    const url = new URL(request.url);
    const groups = (url.searchParams.get("groups") || url.searchParams.get("group") || "")
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean)
      .map(Number);
    const result = DEFAULT_SETTINGS
      .map((s, index) => ({ ...s, index }))
      .filter((s) => groups.length === 0 || groups.includes(s.group));
    return ok(result);
  }
  if (path.endsWith("/reset_token")) {
    const token = await randomToken(24);
    await setSetting(env, "token", token);
    return ok(token);
  }
  if (path.includes("/set_")) {
    return ok("Cloudflare Pages mode does not support offline download tool settings");
  }
  return apiError("api not found", 404);
}

async function adminStorage(request, env, path, context = null) {
  const db = env.OPENLIST_DB;
  if (path.endsWith("/list")) {
    const page = pageReq(await readBody(request), request);
    const total = await db.prepare("SELECT COUNT(*) AS count FROM storages").first();
    const rows = await db.prepare("SELECT * FROM storages ORDER BY storage_order, mount_path LIMIT ? OFFSET ?").bind(page.per_page, page.offset).all();
    return ok({ content: rows.results.map(storageFromRow), total: total.count || 0 });
  }
  if (path.endsWith("/get")) {
    const storage = await getStorageById(env, intParam(request, "id"));
    if (!storage) return apiError("storage not found", 404);
    return ok(storage);
  }
  if (path.endsWith("/create")) {
    const body = normalizeStorageInput(await readBody(request));
    const result = await db.prepare("INSERT INTO storages (mount_path, storage_order, driver, cache_expiration, custom_cache_policies, status, addition, remark, disabled, disable_index, enable_sign, order_by, order_direction, extract_folder, web_proxy, webdav_policy, proxy_range, down_proxy_url, disable_proxy_sign, modified) VALUES (?, ?, 'Onedrive', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)")
      .bind(body.mount_path, body.order, body.cache_expiration, body.custom_cache_policies, WORK_STATUS, body.addition, body.remark, body.disabled, body.disable_index, body.enable_sign, body.order_by, body.order_direction, body.extract_folder, body.web_proxy, body.webdav_policy, body.proxy_range, body.down_proxy_url, body.disable_proxy_sign)
      .run();
    const id = result.meta.last_row_id;
    await saveOneDriveToken(env, id, parseJson(body.addition));
    await clearStorageCache(env);
    return ok({ id });
  }
  if (path.endsWith("/update")) {
    const body = normalizeStorageInput(await readBody(request));
    if (!body.id) return apiError("id is required", 400);
    await db.prepare("UPDATE storages SET mount_path = ?, storage_order = ?, cache_expiration = ?, custom_cache_policies = ?, addition = ?, remark = ?, disabled = ?, disable_index = ?, enable_sign = ?, order_by = ?, order_direction = ?, extract_folder = ?, web_proxy = ?, webdav_policy = ?, proxy_range = ?, down_proxy_url = ?, disable_proxy_sign = ?, modified = CURRENT_TIMESTAMP WHERE id = ?")
      .bind(body.mount_path, body.order, body.cache_expiration, body.custom_cache_policies, body.addition, body.remark, body.disabled, body.disable_index, body.enable_sign, body.order_by, body.order_direction, body.extract_folder, body.web_proxy, body.webdav_policy, body.proxy_range, body.down_proxy_url, body.disable_proxy_sign, body.id)
      .run();
    await saveOneDriveToken(env, body.id, parseJson(body.addition));
    await clearStorageCache(env);
    return ok();
  }
  if (path.endsWith("/delete")) {
    const id = intParam(request, "id");
    await db.prepare("DELETE FROM storages WHERE id = ?").bind(id).run();
    await db.prepare("DELETE FROM onedrive_tokens WHERE storage_id = ?").bind(id).run();
    await db.prepare("DELETE FROM search_nodes WHERE storage_id = ?").bind(id).run();
    await clearStorageCache(env);
    return ok();
  }
  if (path.endsWith("/enable") || path.endsWith("/disable")) {
    const disabled = path.endsWith("/disable") ? 1 : 0;
    await db.prepare("UPDATE storages SET disabled = ?, modified = CURRENT_TIMESTAMP WHERE id = ?").bind(disabled, intParam(request, "id")).run();
    await clearStorageCache(env);
    return ok();
  }
  if (path.endsWith("/refresh_cache") || path.endsWith("/clear_cache")) {
    const body = await readBody(request);
    const id = Number(body.id || new URL(request.url).searchParams.get("id") || 0);
    let changed = 0;
    let refreshedStorages = [];
    if (id > 0) {
      const result = await db.prepare("UPDATE storages SET modified = CURRENT_TIMESTAMP WHERE id = ?").bind(id).run();
      changed = Number(result.meta?.changes || result.changes || 0);
      if (!changed) return apiError("storage not found", 404);
      const row = await db.prepare("SELECT * FROM storages WHERE id = ?").bind(id).first();
      if (row) refreshedStorages = [storageFromRow(row)];
    } else {
      const result = await db.prepare("UPDATE storages SET modified = CURRENT_TIMESTAMP").run();
      changed = Number(result.meta?.changes || result.changes || 0);
      const rows = await db.prepare("SELECT * FROM storages WHERE disabled = 0 ORDER BY storage_order, mount_path").all();
      refreshedStorages = rows.results.map(storageFromRow);
    }
    await clearStorageVersionCache(env);
    const preheat = scheduleStorageCachePreheat(context, env, refreshedStorages);
    return ok({ refreshed: changed, id: id || null, preheat });
  }
  if (path.endsWith("/load_all")) return ok();
  return apiError("api not found", 404);
}

function scheduleStorageCachePreheat(context, env, storages) {
  const activeStorages = (storages || []).filter((storage) => storage && !storage.disabled);
  if (activeStorages.length === 0) return "none";
  if (!context || typeof context.waitUntil !== "function") return "unavailable";
  context.waitUntil(preheatStorageCaches(env, activeStorages).catch(() => {}));
  return "scheduled";
}

async function preheatStorageCaches(env, storages) {
  await Promise.allSettled(storages.map((storage) => preheatStorageCache(env, storage)));
}

async function preheatStorageCache(env, storage) {
  const rootPath = normalizePath(storage.mount_path || "/");
  const listing = await listPath(env, rootPath, null, { refresh: true });
  const dirs = sortObjects(listing.content || [], listing.storage || storage)
    .filter((obj) => obj && obj.is_dir && !obj.virtual);
  await preheatChildDirectories(env, storage, rootPath, dirs);
}

async function adminMeta(request, env, path) {
  const db = env.OPENLIST_DB;
  if (path.endsWith("/list")) {
    const page = pageReq(await readBody(request), request);
    const total = await db.prepare("SELECT COUNT(*) AS count FROM metas").first();
    const rows = await db.prepare("SELECT * FROM metas ORDER BY path LIMIT ? OFFSET ?").bind(page.per_page, page.offset).all();
    return ok({ content: rows.results.map(metaFromRow), total: total.count || 0 });
  }
  if (path.endsWith("/get")) {
    const row = await db.prepare("SELECT * FROM metas WHERE id = ?").bind(intParam(request, "id")).first();
    if (!row) return apiError("meta not found", 404);
    return ok(metaFromRow(row));
  }
  if (path.endsWith("/create") || path.endsWith("/update")) {
    const body = normalizeMetaInput(await readBody(request));
    const invalid = validateHideRules(body.hide);
    if (invalid) return apiError(`${invalid.rule} is illegal: ${invalid.message}`, 400);
    if (path.endsWith("/create")) {
      await db.prepare("INSERT INTO metas (path, read_users, read_users_sub, write_users, write_users_sub, password, p_sub, write, w_sub, hide, h_sub, readme, r_sub, header, header_sub) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
        .bind(body.path, body.read_users, body.read_users_sub, body.write_users, body.write_users_sub, body.password, body.p_sub, body.write, body.w_sub, body.hide, body.h_sub, body.readme, body.r_sub, body.header, body.header_sub)
        .run();
    } else {
      await db.prepare("UPDATE metas SET path = ?, read_users = ?, read_users_sub = ?, write_users = ?, write_users_sub = ?, password = ?, p_sub = ?, write = ?, w_sub = ?, hide = ?, h_sub = ?, readme = ?, r_sub = ?, header = ?, header_sub = ? WHERE id = ?")
        .bind(body.path, body.read_users, body.read_users_sub, body.write_users, body.write_users_sub, body.password, body.p_sub, body.write, body.w_sub, body.hide, body.h_sub, body.readme, body.r_sub, body.header, body.header_sub, body.id)
        .run();
    }
    await clearMetaCache(env);
    return ok();
  }
  if (path.endsWith("/delete")) {
    await db.prepare("DELETE FROM metas WHERE id = ?").bind(intParam(request, "id")).run();
    await clearMetaCache(env);
    return ok();
  }
  return apiError("api not found", 404);
}

async function adminIndex(request, env, path) {
  if (path.endsWith("/progress")) {
    const value = await getSetting(env, "index_progress", "{}");
    const progress = parseJson(value, {});
    return ok({
      is_done: progress.is_done ?? progress.status !== "running",
      obj_count: progress.obj_count ?? progress.indexed ?? 0,
      last_done_time: progress.last_done_time || progress.updated_at || "",
      error: progress.error || "",
      ...progress,
    });
  }
  if (path.endsWith("/clear")) {
    await env.OPENLIST_DB.prepare("DELETE FROM search_nodes").run();
    await setSetting(env, "index_progress", JSON.stringify({ status: "cleared", is_done: true, indexed: 0, obj_count: 0, updated_at: new Date().toISOString() }));
    return ok();
  }
  if (path.endsWith("/stop")) {
    await setSetting(env, "index_progress", JSON.stringify({ status: "stopped", is_done: true, updated_at: new Date().toISOString() }));
    return ok();
  }
  if (path.endsWith("/build") || path.endsWith("/update")) {
    const result = await buildIndex(env);
    return ok(result);
  }
  return apiError("api not found", 404);
}

async function adminScan(request, env, path) {
  if (path.endsWith("/progress")) {
    const value = await getSetting(env, "scan_progress", "");
    return ok(parseJson(value, { is_done: true, obj_count: 0, updated_at: new Date().toISOString() }));
  }
  if (path.endsWith("/start")) {
    await setSetting(env, "scan_progress", JSON.stringify({ is_done: true, obj_count: 0, updated_at: new Date().toISOString() }));
    return ok();
  }
  if (path.endsWith("/stop")) {
    await setSetting(env, "scan_progress", JSON.stringify({ is_done: true, obj_count: 0, updated_at: new Date().toISOString() }));
    return ok();
  }
  return apiError("api not found", 404);
}

async function adminMessage(request, env, path) {
  if (path.endsWith("/get")) {
    return ok({ type: "string", content: "Cloudflare Pages mode: no Microsoft OAuth messenger messages." });
  }
  if (path.endsWith("/send")) return ok();
  return apiError("api not found", 404);
}

async function taskCompat(request, env, path, user) {
  const parts = path.split("/").filter(Boolean);
  const action = parts[3] || "";
  if (action === "undone" || action === "done") return ok([]);
  if (["retry_some", "cancel_some", "delete_some", "retry_failed"].includes(action)) return ok({});
  return ok();
}

async function shareCompat(request, env, path, user) {
  if (path.endsWith("/list")) return ok({ content: [], total: 0 });
  if (path.endsWith("/get")) return apiError("Share is not supported in Cloudflare Pages mode", 404);
  if (path.endsWith("/create") || path.endsWith("/update")) return ok({ id: String((await readBody(request)).id || "") });
  if (path.endsWith("/delete") || path.endsWith("/enable") || path.endsWith("/disable")) return ok();
  return apiError("Share is not supported in Cloudflare Pages mode", 404);
}

async function fsCompat(request, env, path) {
  if (path.endsWith("/get_direct_upload_info")) return ok(null);
  if (path.endsWith("/archive/meta")) return apiError("Archive preview is not supported in Cloudflare Pages mode", 400);
  if (path.endsWith("/archive/list")) return apiError("Archive preview is not supported in Cloudflare Pages mode", 400);
  if (path.endsWith("/torrent/parse")) return apiError("Torrent parsing is not supported in Cloudflare Pages mode", 400);
  if (path.endsWith("/torrent/rapid_upload")) return apiError("Torrent rapid upload is not supported in Cloudflare Pages mode", 400);
  if (path.endsWith("/add_offline_download")) return apiError("Offline download is not supported in Cloudflare Pages mode", 400);
  if (path.endsWith("/form") || path.endsWith("/put")) return apiError("Upload is not supported in Cloudflare Pages mode", 400);
  if (path.endsWith("/mkdir") || path.endsWith("/rename") || path.endsWith("/batch_rename")) return apiError("File modification is not supported in Cloudflare Pages mode", 400);
  if (path.endsWith("/move") || path.endsWith("/recursive_move") || path.endsWith("/copy")) return apiError("File modification is not supported in Cloudflare Pages mode", 400);
  if (path.endsWith("/remove") || path.endsWith("/remove_empty_directory")) return apiError("File deletion is not supported in Cloudflare Pages mode", 400);
  return apiError("This file API is not supported in Cloudflare Pages mode", 400);
}

function adminCompat(path) {
  if (path.endsWith("/list")) return ok({ content: [], total: 0 });
  if (path.endsWith("/progress")) return ok({ is_done: true, obj_count: 0 });
  if (path.endsWith("/get")) return ok({});
  return ok();
}

async function fsList(request, env, context) {
  const startedAt = nowMilliseconds();
  const user = await getRequestUser(request, env, false);
  if (!user) return apiError("Guest user is disabled, login please", 401);
  const body = await readBody(request);
  const requestedPath = body.path || new URL(request.url).searchParams.get("path") || "/";
  const reqPath = joinBasePath(user.base_path, requestedPath);
  const password = String(body.password || "");
  const meta = await nearestMeta(env, reqPath);
  if (!(await canAccess(user, meta, reqPath, password))) return apiError("password is incorrect or you have no permission", 403);
  let listing;
  try {
    listing = await listPath(env, reqPath, context, { refresh: truthy(body.refresh) });
  } catch (error) {
    return apiError(`Failed to list ${reqPath}: ${error && error.message ? error.message : String(error)}`, 500);
  }
  const filtered = applyMetaHide(listing.content, meta, reqPath);
  const sorted = sortObjects(filtered, listing.storage);
  const page = pageReq(body, request);
  const sliced = sorted.slice(page.offset, page.offset + page.per_page);
  const settings = await settingsMap(env);
  scheduleDirectoryPreheat(context, env, reqPath, requestedPath, listing, sorted, body);
  return ok({
    content: await Promise.all(sliced.map((obj) => objResp(env, obj, reqPath, listing.storage, settings))),
    total: sorted.length,
    readme: metaText(meta, reqPath, "readme", "r_sub"),
    header: metaText(meta, reqPath, "header", "header_sub"),
    write: false,
    write_content_bypass: false,
    provider: listing.storage ? "Onedrive" : "unknown",
    direct_upload_tools: [],
  }, fsDebugHeaders(listing, startedAt));
}

async function fsGet(request, env) {
  const startedAt = nowMilliseconds();
  const user = await getRequestUser(request, env, false);
  if (!user) return apiError("Guest user is disabled, login please", 401);
  const body = await readBody(request);
  const reqPath = joinBasePath(user.base_path, body.path || new URL(request.url).searchParams.get("path") || "/");
  const password = String(body.password || "");
  const meta = await nearestMeta(env, reqPath);
  if (!(await canAccess(user, meta, reqPath, password))) return apiError("password is incorrect or you have no permission", 403);
  let found;
  try {
    found = await getObjAtPath(env, reqPath);
  } catch (error) {
    return apiError(`Failed to get ${reqPath}: ${error && error.message ? error.message : String(error)}`, 500);
  }
  if (!found.obj) return apiError("object not found", 404);
  const parent = dirname(reqPath);
  const rawUrl = found.obj.is_dir ? "" : await signedDownloadUrl(env, reqPath, found.storage);
  const relatedList = found.obj.is_dir ? [] : (await listPath(env, parent).catch(() => ({ content: [] }))).content
    .filter((obj) => !obj.is_dir && obj.name !== found.obj.name && obj.name.startsWith(found.obj.name.replace(/\.[^.]+$/, "")))
    .slice(0, 20);
  const settings = await settingsMap(env);
  return ok({
    ...(await objResp(env, found.obj, parent, found.storage, settings)),
    raw_url: rawUrl,
    readme: metaText(meta, reqPath, "readme", "r_sub"),
    header: metaText(meta, reqPath, "header", "header_sub"),
    provider: "Onedrive",
    related: await Promise.all(relatedList.map((obj) => objResp(env, obj, parent, found.storage, settings))),
  }, debugHeaders(startedAt));
}

async function fsDirs(request, env) {
  const user = await getRequestUser(request, env, false);
  if (!user) return apiError("Guest user is disabled, login please", 401);
  const body = await readBody(request);
  const forceRoot = truthy(body.force_root || new URL(request.url).searchParams.get("force_root"));
  if (forceRoot && user.role !== ROLE_ADMIN) return apiError("Permission denied", 403);
  const reqPath = forceRoot
    ? normalizePath(body.path || new URL(request.url).searchParams.get("path") || "/")
    : joinBasePath(user.base_path, body.path || new URL(request.url).searchParams.get("path") || "/");
  const password = String(body.password || "");
  const meta = await nearestMeta(env, reqPath);
  if (!(await canAccess(user, meta, reqPath, password))) return apiError("password is incorrect or you have no permission", 403);
  const listing = await listPath(env, reqPath);
  return ok(listing.content
    .filter((obj) => obj.is_dir)
    .map((obj) => ({ name: obj.name, modified: obj.modified || new Date().toISOString() })));
}

async function fsSearch(request, env) {
  const user = await getRequestUser(request, env, false);
  if (!user) return apiError("Guest user is disabled, login please", 401);
  const body = await readBody(request);
  const keyword = String(body.keywords || body.keyword || body.name || "").trim();
  const parent = joinBasePath(user.base_path, body.parent || "/");
  const page = pageReq(body, request);
  if (!keyword) return ok({ content: [], total: 0 });
  const like = `%${keyword.replace(/[%_]/g, "\\$&")}%`;
  const rows = await env.OPENLIST_DB.prepare("SELECT * FROM search_nodes WHERE name LIKE ? ESCAPE '\\' AND parent LIKE ? ORDER BY parent, name LIMIT ? OFFSET ?")
    .bind(like, `${parent === "/" ? "" : parent}%`, page.per_page + 1, page.offset)
    .all();
  const content = [];
  const hasMore = rows.results.length > page.per_page;
  const settings = await settingsMap(env);
  for (const row of rows.results.slice(0, page.per_page)) {
    const full = joinPath(row.parent, row.name);
    const meta = await nearestMeta(env, full);
    if (await canAccess(user, meta, full, String(body.password || ""))) {
      content.push({
        parent: row.parent,
        name: row.name,
        is_dir: !!row.is_dir,
        size: row.size,
        modified: row.modified,
        type: objType(row.name, !!row.is_dir, settings),
      });
    }
  }
  return ok({ content, total: page.offset + content.length + (hasMore ? 1 : 0) });
}

async function downloadRouter(request, env, path) {
  const reqPath = normalizePath(decodeURIComponent(path.slice(2)) || "/");
  const storage = await matchedStorage(env, reqPath);
  if (!storage || samePath(storage.mount_path, reqPath)) return text("not found", 404);
  const url = new URL(request.url);
  const sign = url.searchParams.get("sign") || "";
  const signTs = Number(url.searchParams.get("sign_ts") || url.searchParams.get("openlist_ts") || "0");
  const mustSign = boolSetting(await getSetting(env, "sign_all", "true")) || truthy(storage.enable_sign);
  if (mustSign) {
    const verified = await verifyDownloadSign(env, reqPath, sign, signTs);
    if (!verified.ok) return text("invalid sign", 403);
    const expiration = linkExpirationSeconds(await getSetting(env, "link_expiration", "0"));
    if (expiration > 0 && (!verified.ts || nowSeconds() - verified.ts > expiration)) return text("link expired", 403);
  }
  try {
    const downloadUrl = await oneDriveDownloadUrl(env, storage, reqPath);
    return Response.redirect(downloadUrl, 302);
  } catch (error) {
    return text(error && error.message ? error.message : "not found", 404);
  }
}

async function listPath(env, reqPath, context = null, options = {}) {
  const virtual = await virtualListing(env, reqPath);
  const storage = await matchedStorage(env, reqPath);
  if (!storage) return { content: virtual, storage: null, cache: "virtual", revalidate: "none" };
  if (samePath(reqPath, storage.mount_path) && virtual.length > 0) {
    return { content: virtual, storage, cache: "virtual", revalidate: "none" };
  }
  const cacheKey = fsListCacheKey(storage, reqPath);
  const cacheSeconds = cacheSecondsForPath(storage, reqPath);
  const refresh = truthy(options.refresh);
  if (cacheSeconds > 0 && !refresh) {
    const cached = await getRuntimeCache(cacheKey);
    const cachedContent = fsListContent(cached);
    if (cachedContent) {
      if (await isOneDriveListCacheTrusted(env, storage, reqPath, cached)) {
        return { content: cachedContent, storage, cache: "hit", revalidate: "fresh" };
      }
      const revalidate = scheduleListRevalidate(context, env, storage, reqPath, virtual, cacheKey, cacheSeconds, cached);
      return { content: cachedContent, storage, cache: "stale", revalidate };
    }
  }
  if (cacheSeconds > 0) {
    let inflight = INFLIGHT_LISTS.get(cacheKey);
    if (!inflight) {
      inflight = loadListPathContent(env, storage, reqPath, virtual, cacheKey, cacheSeconds)
        .finally(() => INFLIGHT_LISTS.delete(cacheKey));
      INFLIGHT_LISTS.set(cacheKey, inflight);
    }
    return { content: await inflight, storage, cache: refresh ? "refresh" : "miss", revalidate: "sync" };
  }
  const content = await loadListPathContent(env, storage, reqPath, virtual, cacheKey, cacheSeconds);
  return { content, storage, cache: "bypass", revalidate: "none" };
}

async function loadListPathContent(env, storage, reqPath, virtual, cacheKey, cacheSeconds) {
  let tag = "";
  let items = [];
  if (cacheSeconds > 0) {
    [tag, items] = await Promise.all([
      oneDriveFolderTag(env, storage, reqPath).catch(() => ""),
      oneDriveList(env, storage, reqPath),
    ]);
  } else {
    items = await oneDriveList(env, storage, reqPath);
  }
  const content = mergeListContent(items, virtual);
  if (cacheSeconds > 0) {
    await cacheListPathContent(env, storage, reqPath, cacheKey, cacheSeconds, tag, content);
  }
  return content;
}

function mergeListContent(items, virtual) {
  return [...items, ...virtual.filter((v) => !items.some((i) => i.name === v.name))];
}

async function cacheListPathContent(env, storage, reqPath, cacheKey, cacheSeconds, tag, content) {
  const cachedAt = nowSeconds();
  const contentCacheSeconds = Math.max(LONG_CACHE_SECONDS, cacheSeconds);
  await setRuntimeCache(cacheKey, {
    tag,
    content,
    cached_at: cachedAt,
    fresh_until: cachedAt + cacheSeconds,
  }, contentCacheSeconds);
  if (tag) await setRuntimeCache(fsListFreshKey(storage, reqPath), tag, cacheSeconds);
}

function scheduleListRevalidate(context, env, storage, reqPath, virtual, cacheKey, cacheSeconds, cached) {
  if (!context || typeof context.waitUntil !== "function") return "none";
  const lockKey = `revalidate:${cacheKey}`;
  if (memoryGet(lockKey)) return "inflight";
  memorySet(lockKey, true, DIRECTORY_REVALIDATE_LOCK_SECONDS);
  context.waitUntil(revalidateListCache(env, storage, reqPath, virtual, cacheKey, cacheSeconds, cached)
    .finally(() => memoryDelete(lockKey))
    .catch(() => {}));
  return "scheduled";
}

async function revalidateListCache(env, storage, reqPath, virtual, cacheKey, cacheSeconds, cached) {
  const oldTag = fsListTag(cached);
  let currentTag = "";
  try {
    currentTag = await oneDriveFolderTag(env, storage, reqPath);
  } catch (error) {
    const code = String(error && error.graphCode || "").toLowerCase();
    if (code.includes("notfound") || code.includes("not_found")) await deleteRuntimeCache(cacheKey);
    return;
  }
  if (oldTag && currentTag && currentTag === oldTag) {
    await setRuntimeCache(fsListFreshKey(storage, reqPath), currentTag, cacheSeconds);
    return;
  }
  const items = await oneDriveList(env, storage, reqPath);
  await cacheListPathContent(env, storage, reqPath, cacheKey, cacheSeconds, currentTag, mergeListContent(items, virtual));
}

function scheduleDirectoryPreheat(context, env, reqPath, requestedPath, listing, sorted, body) {
  if (!context || typeof context.waitUntil !== "function") return;
  if (!listing || !listing.storage || !Array.isArray(sorted)) return;
  if (normalizePath(requestedPath || "/") === "/" || truthy(body.refresh)) return;
  const dirs = sorted.filter((obj) => obj && obj.is_dir && !obj.virtual);
  if (dirs.length === 0) return;
  context.waitUntil(preheatChildDirectories(env, listing.storage, reqPath, dirs).catch(() => {}));
}

async function preheatChildDirectories(env, storage, parentPath, dirs) {
  if (!boolSetting(await getSetting(env, "preheat_directories", "true"))) return;
  const limit = Math.min(20, Math.max(0, Number(await getSetting(env, "preheat_directory_limit", "3")) || 0));
  if (limit <= 0) return;
  const selected = dirs.slice(0, limit);
  await Promise.allSettled(selected.map(async (obj) => {
    const childPath = joinPath(parentPath, obj.name);
    const lockKey = `preheat:${storage.id}:${storage.modified || ""}:${childPath}`;
    if (memoryGet(lockKey)) return;
    memorySet(lockKey, true, 60);
    const cached = fsListContent(await getRuntimeCache(fsListCacheKey(storage, childPath)));
    if (cached) return;
    await listPath(env, childPath);
  }));
}

async function virtualListing(env, reqPath) {
  const storages = await enabledStorages(env, "order");
  const names = new Map();
  const prefix = addSlash(reqPath);
  for (const storage of storages) {
    if (samePath(storage.mount_path, reqPath)) continue;
    if (!storage.mount_path.startsWith(prefix)) continue;
    const rest = storage.mount_path.slice(prefix.length);
    if (!rest) continue;
    const name = rest.split("/")[0];
    if (!name) continue;
    names.set(name, {
      name,
      size: 0,
      is_dir: true,
      modified: storage.modified || new Date().toISOString(),
      created: storage.modified || new Date().toISOString(),
      thumb: "",
      hashinfo: "",
      hash_info: {},
      virtual: true,
    });
  }
  return [...names.values()];
}

async function getObjAtPath(env, reqPath) {
  const storage = await matchedStorage(env, reqPath);
  if (!storage) {
    const virtual = await virtualListing(env, dirname(reqPath));
    return { storage: null, obj: virtual.find((obj) => obj.name === basename(reqPath)) || null };
  }
  if (samePath(storage.mount_path, reqPath)) {
    return {
      storage,
      obj: { name: basename(reqPath) || "", size: 0, is_dir: true, modified: storage.modified, created: storage.modified },
    };
  }
  const cached = await cachedObjFromParentList(env, storage, reqPath);
  if (cached) return { storage, obj: cached };
  return { storage, obj: await oneDriveGet(env, storage, reqPath) };
}

async function cachedObjFromParentList(env, storage, reqPath) {
  const parent = dirname(reqPath);
  const cached = fsListContent(await getRuntimeCache(fsListCacheKey(storage, parent)));
  if (!Array.isArray(cached)) return null;
  return cached.find((obj) => obj && obj.name === basename(reqPath)) || null;
}

async function matchedStorage(env, reqPath) {
  const storages = await enabledStorages(env, "length");
  for (const storage of storages) {
    if (samePath(reqPath, storage.mount_path) || reqPath.startsWith(addSlash(storage.mount_path))) return storage;
  }
  return null;
}

async function oneDriveList(env, storage, reqPath) {
  const api = await oneDriveApi(env, storage);
  const url = oneDriveChildrenListUrl(api, reqPath);
  return oneDrivePagedList(api.accessToken, url).catch(async (error) => {
    if (error.graphCode !== "InvalidAuthenticationToken") throw error;
    const freshApi = await oneDriveApi(env, storage, true);
    return oneDrivePagedList(freshApi.accessToken, oneDriveChildrenListUrl(freshApi, reqPath));
  });
}

function oneDriveChildrenListUrl(api, reqPath) {
  return `${api.childrenUrl(reqPath)}?$top=1000&$select=${encodeURIComponent(ONEDRIVE_LIST_SELECT)}`;
}

async function oneDriveGet(env, storage, reqPath) {
  const api = await oneDriveApi(env, storage);
  const data = await graphJson(api.accessToken, api.itemUrl(reqPath)).catch(async (error) => {
    if (error.graphCode !== "InvalidAuthenticationToken") throw error;
    const freshApi = await oneDriveApi(env, storage, true);
    return graphJson(freshApi.accessToken, freshApi.itemUrl(reqPath));
  });
  return oneDriveObj(data, true);
}

async function oneDriveFolderTag(env, storage, reqPath) {
  const api = await oneDriveApi(env, storage);
  const url = `${api.itemUrl(reqPath)}?$select=id,eTag,cTag,lastModifiedDateTime,size,folder,fileSystemInfo`;
  const data = await graphJson(api.accessToken, url).catch(async (error) => {
    if (error.graphCode !== "InvalidAuthenticationToken") throw error;
    const freshApi = await oneDriveApi(env, storage, true);
    return graphJson(freshApi.accessToken, `${freshApi.itemUrl(reqPath)}?$select=id,eTag,cTag,lastModifiedDateTime,size,folder,fileSystemInfo`);
  });
  return driveItemTag(data);
}

async function oneDriveDownloadUrl(env, storage, reqPath) {
  const cacheKey = downloadCacheKey(storage, reqPath);
  const cached = memoryGet(cacheKey);
  if (cached) return cached;
  const runtimeCached = await getRuntimeCache(cacheKey);
  if (runtimeCached) {
    memorySet(cacheKey, runtimeCached, RUNTIME_MEMORY_TTL);
    return runtimeCached;
  }

  const cachedObj = await cachedObjFromParentList(env, storage, reqPath);
  if (cachedObj && cachedObj.download_url) {
    const downloadUrl = applyCustomDownloadHost(cachedObj.download_url, storage);
    await cacheDownloadUrl(env, storage, reqPath, downloadUrl);
    return downloadUrl;
  }

  const api = await oneDriveApi(env, storage);
  const data = await graphJson(api.accessToken, api.itemUrl(reqPath)).catch(async (error) => {
    if (error.graphCode !== "InvalidAuthenticationToken") throw error;
    const freshApi = await oneDriveApi(env, storage, true);
    return graphJson(freshApi.accessToken, freshApi.itemUrl(reqPath));
  });
  let downloadUrl = data["@microsoft.graph.downloadUrl"] || data.content?.downloadUrl || "";
  if (!downloadUrl) throw new Error("OneDrive download URL not found");
  downloadUrl = applyCustomDownloadHost(downloadUrl, storage);
  await cacheDownloadUrl(env, storage, reqPath, downloadUrl);
  return downloadUrl;
}

function applyCustomDownloadHost(downloadUrl, storage) {
  const addition = parseJson(storage.addition);
  if (addition.custom_host) {
    const original = new URL(downloadUrl);
    const custom = new URL(addition.custom_host.includes("://") ? addition.custom_host : `https://${addition.custom_host}`);
    original.protocol = custom.protocol;
    original.host = custom.host;
    downloadUrl = original.toString();
  }
  return downloadUrl;
}

async function cacheDownloadUrl(env, storage, reqPath, downloadUrl) {
  const seconds = Math.min(cacheSecondsForPath(storage, dirname(reqPath)), 3300);
  if (seconds > 0) {
    const key = downloadCacheKey(storage, reqPath);
    memorySet(key, downloadUrl, seconds);
    await setRuntimeCache(key, downloadUrl, seconds);
  }
}

async function oneDrivePagedList(accessToken, url) {
  const values = [];
  let next = url;
  while (next) {
    const data = await graphJson(accessToken, next);
    values.push(...(data.value || []).map((item) => oneDriveObj(item)));
    next = data["@odata.nextLink"] || "";
  }
  return values;
}

async function oneDriveApi(env, storage, forceRefresh = false) {
  const addition = parseJson(storage.addition);
  const token = await getOneDriveAccessToken(env, storage, addition, forceRefresh);
  const graphBase = graphBaseUrl(addition.region);
  const driveBase = addition.site_id
    ? `${graphBase}/sites/${encodeURIComponent(addition.site_id)}/drive`
    : `${graphBase}/me/drive`;
  return {
    accessToken: token,
    childrenUrl: (reqPath) => {
      const drivePath = oneDrivePath(storage, addition, reqPath);
      if (!drivePath || drivePath === "/") return `${driveBase}/root/children`;
      return `${driveBase}/root:${encodeDrivePath(drivePath)}:/children`;
    },
    itemUrl: (reqPath) => {
      const drivePath = oneDrivePath(storage, addition, reqPath);
      if (!drivePath || drivePath === "/") return `${driveBase}/root`;
      return `${driveBase}/root:${encodeDrivePath(drivePath)}`;
    },
  };
}

async function getOneDriveAccessToken(env, storage, addition, forceRefresh = false) {
  const tokenCacheKey = `onedrive:${storage.id}`;
  const cachedToken = forceRefresh ? null : memoryGet(tokenCacheKey);
  if (cachedToken && cachedToken.access_token && Number(cachedToken.expires_at) > nowSeconds() + 120) return cachedToken.access_token;
  const runtimeToken = forceRefresh ? null : await getRuntimeCache(tokenCacheKey);
  if (runtimeToken && runtimeToken.access_token && Number(runtimeToken.expires_at) > nowSeconds() + 120) {
    memorySet(tokenCacheKey, runtimeToken, Math.min(Number(runtimeToken.expires_at) - nowSeconds(), 3300));
    return runtimeToken.access_token;
  }

  const row = await env.OPENLIST_DB.prepare("SELECT * FROM onedrive_tokens WHERE storage_id = ?").bind(storage.id).first();
  if (!forceRefresh && row && row.access_token && Number(row.expires_at) > nowSeconds() + 120) {
    const tokenValue = { access_token: row.access_token, expires_at: Number(row.expires_at) };
    const ttl = Math.min(Number(row.expires_at) - nowSeconds(), 3300);
    memorySet(tokenCacheKey, tokenValue, ttl);
    await setRuntimeCache(tokenCacheKey, tokenValue, ttl);
    return row.access_token;
  }
  const refreshToken = (row && row.refresh_token) || addition.refresh_token;
  if (!refreshToken) throw new Error("OneDrive refresh_token is required");
  const clientId = addition.client_id || env.ONEDRIVE_CLIENT_ID;
  const clientSecret = addition.client_secret || env.ONEDRIVE_CLIENT_SECRET;
  const shouldUseOnlineApi = truthy(addition.use_online_api ?? true) || (!clientId || !clientSecret);
  if (shouldUseOnlineApi && addition.api_url_address) {
    const data = await refreshOneDriveWithOnlineApi(addition.api_url_address, refreshToken);
    await env.OPENLIST_DB.prepare("INSERT INTO onedrive_tokens (storage_id, access_token, refresh_token, expires_at, updated_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP) ON CONFLICT(storage_id) DO UPDATE SET access_token = excluded.access_token, refresh_token = excluded.refresh_token, expires_at = excluded.expires_at, updated_at = CURRENT_TIMESTAMP")
      .bind(storage.id, data.access_token, data.refresh_token || refreshToken, nowSeconds() + Number(data.expires_in || 3600))
      .run();
    const tokenValue = { access_token: data.access_token, expires_at: nowSeconds() + Number(data.expires_in || 3600) };
    const ttl = Math.min(Number(data.expires_in || 3600), 3300);
    memorySet(tokenCacheKey, tokenValue, ttl);
    await setRuntimeCache(tokenCacheKey, tokenValue, ttl);
    return data.access_token;
  }
  if (!clientId || !clientSecret) throw new Error("OneDrive client_id and client_secret are required");
  const tenant = addition.tenant || "common";
  const tokenUrl = oauthBaseUrl(addition.region, tenant);
  const form = new URLSearchParams();
  form.set("client_id", clientId);
  form.set("client_secret", clientSecret);
  form.set("refresh_token", refreshToken);
  form.set("grant_type", "refresh_token");
  if (addition.redirect_uri) form.set("redirect_uri", addition.redirect_uri);
  const resp = await fetch(tokenUrl, { method: "POST", body: form });
  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) throw new Error(data.error_description || data.error || "failed to refresh OneDrive token");
  await env.OPENLIST_DB.prepare("INSERT INTO onedrive_tokens (storage_id, access_token, refresh_token, expires_at, updated_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP) ON CONFLICT(storage_id) DO UPDATE SET access_token = excluded.access_token, refresh_token = excluded.refresh_token, expires_at = excluded.expires_at, updated_at = CURRENT_TIMESTAMP")
    .bind(storage.id, data.access_token, data.refresh_token || refreshToken, nowSeconds() + Number(data.expires_in || 3600))
    .run();
  const tokenValue = { access_token: data.access_token, expires_at: nowSeconds() + Number(data.expires_in || 3600) };
  const ttl = Math.min(Number(data.expires_in || 3600), 3300);
  memorySet(tokenCacheKey, tokenValue, ttl);
  await setRuntimeCache(tokenCacheKey, tokenValue, ttl);
  return data.access_token;
}

async function refreshOneDriveWithOnlineApi(apiAddress, refreshToken) {
  const url = new URL(apiAddress);
  url.searchParams.set("refresh_ui", refreshToken);
  url.searchParams.set("server_use", "true");
  url.searchParams.set("driver_txt", "onedrive_pr");
  const resp = await fetch(url.toString(), { headers: { Accept: "application/json" } });
  const textBody = await resp.text();
  const data = parseJson(textBody, {});
  if (!resp.ok) throw new Error(data.text || data.error_description || data.error || textBody || "failed to refresh OneDrive token with online API");
  if (!data.access_token || !data.refresh_token) {
    throw new Error(data.text || "empty token returned from OneDrive online API, please check refresh_token");
  }
  return data;
}

async function graphJson(accessToken, url) {
  const resp = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) {
    const graphCode = data.error && data.error.code;
    const message = data.error && (data.error.message || data.error.code);
    const error = new Error(message || `Microsoft Graph request failed: ${resp.status}`);
    error.graphCode = graphCode || "";
    throw error;
  }
  return data;
}

async function buildIndex(env) {
  await setSetting(env, "index_progress", JSON.stringify({ status: "running", is_done: false, indexed: 0, obj_count: 0, updated_at: new Date().toISOString() }));
  await env.OPENLIST_DB.prepare("DELETE FROM search_nodes").run();
  const rows = await env.OPENLIST_DB.prepare("SELECT * FROM storages WHERE disabled = 0 AND disable_index = 0 ORDER BY storage_order, mount_path").all();
  let indexed = 0;
  const maxNodes = 1200;
  const maxDepth = Number(await getSetting(env, "max_index_depth", "20"));
  for (const row of rows.results) {
    const storage = storageFromRow(row);
    const queue = [{ path: storage.mount_path, depth: 0 }];
    while (queue.length && indexed < maxNodes) {
      const stopped = parseJson(await getSetting(env, "index_progress", "{}"), {});
      if (stopped.status === "stopped") return stopped;
      const cur = queue.shift();
      const items = await oneDriveList(env, storage, cur.path).catch(() => []);
      for (const obj of items) {
        await env.OPENLIST_DB.prepare("INSERT OR REPLACE INTO search_nodes (parent, name, is_dir, size, modified, storage_id) VALUES (?, ?, ?, ?, ?, ?)")
          .bind(cur.path, obj.name, boolInt(obj.is_dir), obj.size || 0, obj.modified || "", storage.id)
          .run();
        indexed++;
        if (obj.is_dir && cur.depth + 1 <= maxDepth && indexed < maxNodes) {
          queue.push({ path: joinPath(cur.path, obj.name), depth: cur.depth + 1 });
        }
      }
      await setSetting(env, "index_progress", JSON.stringify({
        status: indexed >= maxNodes ? "partial" : "running",
        is_done: indexed >= maxNodes,
        indexed,
        obj_count: indexed,
        current: cur.path,
        updated_at: new Date().toISOString(),
      }));
    }
  }
  const progress = {
    status: indexed >= maxNodes ? "partial" : "done",
    is_done: true,
    indexed,
    obj_count: indexed,
    limit: maxNodes,
    last_done_time: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  await setSetting(env, "index_progress", JSON.stringify(progress));
  return progress;
}

async function frontend(request, env) {
  const settings = await settingsMap(env, true);
  const cdn = (env.OPENLIST_WEB_CDN || "").replace(/\/$/, "");
  const cacheKey = await frontendHtmlCacheKey(env, settings, cdn);
  const cached = await getRuntimeCache(cacheKey);
  if (cached) return htmlResponse(cached);
  if (cdn) {
    const resp = await fetch(`${cdn}/index.html`, { headers: { Accept: "text/html" } }).catch(() => null);
    if (resp && resp.ok) {
      const html = await resp.text();
      const out = injectHtml(html, settings, cdn);
      await setRuntimeCache(cacheKey, out, LONG_CACHE_SECONDS);
      return htmlResponse(out);
    }
  }
  if (env.ASSETS) {
    const assetUrl = new URL(request.url);
    assetUrl.pathname = "/index.html";
    assetUrl.search = "";
    const resp = await env.ASSETS.fetch(new Request(assetUrl.toString(), request));
    if (resp.ok) {
      const html = await resp.text();
      const out = injectHtml(html, settings, "");
      await setRuntimeCache(cacheKey, out, LONG_CACHE_SECONDS);
      return htmlResponse(out);
    }
  }
  const title = settings.site_title || "OpenList";
  const out = builtinFrontendHtml(settings, title);
  await setRuntimeCache(cacheKey, out, LONG_CACHE_SECONDS);
  return htmlResponse(out);
}

function builtinFrontendHtml(settings, title) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
<link rel="icon" href="${escapeAttr(settings.favicon || "https://res.oplist.org/logo/logo.svg")}">
<style>
:root{color-scheme:light dark;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;--main:${escapeCss(settings.main_color || "#1890ff")}}
*{box-sizing:border-box}
body{margin:0;background:#f5f7fb;color:#172033}
a{color:var(--main)}
button,input,textarea,select{font:inherit}
button{border:1px solid #cbd5e1;background:#fff;border-radius:6px;padding:8px 10px;cursor:pointer}
button.primary{background:var(--main);border-color:var(--main);color:#fff}
input,textarea,select{border:1px solid #cbd5e1;border-radius:6px;padding:8px;width:100%;background:#fff;color:inherit}
textarea{min-height:84px;resize:vertical}
main{width:min(1180px,calc(100vw - 28px));margin:24px auto 44px}
.top{display:flex;align-items:center;justify-content:space-between;gap:16px;margin-bottom:16px}
.brand{display:flex;align-items:center;gap:12px;min-width:0}
.logo{width:38px;height:38px;object-fit:contain}
.brand h1{font-size:22px;margin:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.tabs{display:flex;gap:8px;flex-wrap:wrap;margin:14px 0}
.tabs button.active{background:#172033;color:#fff;border-color:#172033}
.card{border:1px solid #d8dee8;border-radius:8px;background:#fff;padding:16px;margin:12px 0}
.grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
.grid.three{grid-template-columns:repeat(3,minmax(0,1fr))}
.row{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
.row>*{width:auto}
.muted{color:#64748b}
.table{width:100%;border-collapse:collapse;margin-top:10px}
.table th,.table td{border-bottom:1px solid #e5e7eb;padding:8px;text-align:left;vertical-align:top}
.table th{font-weight:600;color:#475569}
.hidden{display:none!important}
.msg{min-height:22px;color:#b45309;margin:8px 0}
.mono{font-family:ui-monospace,SFMono-Regular,Consolas,monospace}
label{display:grid;gap:5px;font-size:13px;color:#475569}
label span{font-weight:600}
@media(max-width:760px){.grid,.grid.three{grid-template-columns:1fr}.top{align-items:flex-start;flex-direction:column}.row>*{width:100%}}
@media(prefers-color-scheme:dark){body{background:#101827;color:#e5e7eb}.card,input,textarea,select,button{background:#182235;border-color:#334155}.tabs button.active{background:#e5e7eb;color:#111827;border-color:#e5e7eb}.table th,.table td{border-color:#334155}.muted,label{color:#94a3b8}}
</style>
${settings.customize_head || ""}
</head>
<body>
<main>
<div class="top">
  <div class="brand"><img class="logo" src="${escapeAttr((settings.logo || "").split("\\n")[0] || "https://res.oplist.org/logo/logo.svg")}" alt=""><h1>${escapeHtml(title)}</h1></div>
  <div class="row"><span id="who" class="muted"></span><button id="logout" class="hidden">Logout</button></div>
</div>
<div class="card">${markdownish(settings.announcement || "")}</div>
<div class="tabs">
  <button data-tab="files" class="active">Files</button>
  <button data-tab="login">Login</button>
  <button data-tab="storages">Storages</button>
  <button data-tab="users">Users</button>
  <button data-tab="settings">Settings</button>
  <button data-tab="metas">Metadata</button>
  <button data-tab="index">Index</button>
</div>
<div id="msg" class="msg"></div>

<section id="tab-files" class="card">
  <h2>Files</h2>
  <div class="row"><input id="path" value="/" aria-label="path"><button id="go" class="primary">Open</button><button id="up">Up</button></div>
  <div id="readme" class="muted"></div>
  <div id="files">Loading...</div>
</section>

<section id="tab-login" class="card hidden">
  <h2>Admin Login</h2>
  <div class="grid">
    <label><span>Username</span><input id="login-user" autocomplete="username"></label>
    <label><span>Password</span><input id="login-pass" type="password" autocomplete="current-password"></label>
  </div>
  <p><button id="login-btn" class="primary">Login</button></p>
</section>

<section id="tab-storages" class="card hidden">
  <h2>OneDrive Storages</h2>
  <div class="row"><button id="storage-new">New</button><button id="storage-load">Refresh</button><button id="storage-refresh-cache">Refresh cache</button></div>
  <div id="storage-list"></div>
  <h3 id="storage-form-title">Create Storage</h3>
  <input id="storage-id" type="hidden">
  <div class="grid three">
    <label><span>Mount path</span><input id="st-mount" value="/drive"></label>
    <label><span>Root folder path</span><input id="st-root" value="/"></label>
    <label><span>Region</span><select id="st-region"><option>global</option><option>cn</option><option>us</option><option>de</option></select></label>
    <label><span>Client ID</span><input id="st-client-id"></label>
    <label><span>Client Secret</span><input id="st-client-secret" type="password"></label>
    <label><span>Redirect URI</span><input id="st-redirect" value="https://api.oplist.org/onedrive/callback"></label>
    <label><span>Refresh token</span><input id="st-refresh"></label>
    <label><span>SharePoint site_id (optional)</span><input id="st-site"></label>
    <label><span>Custom download host (optional)</span><input id="st-host"></label>
    <label><span>Cache minutes</span><input id="st-cache" type="number" value="30"></label>
    <label><span>Order by</span><select id="st-order-by"><option value="">Default</option><option>name</option><option>size</option><option>modified</option></select></label>
    <label><span>Direction</span><select id="st-order-dir"><option value="">Default</option><option>asc</option><option>desc</option></select></label>
  </div>
  <p class="row"><label><span><input id="st-disabled" type="checkbox"> Disabled</span></label><label><span><input id="st-sign" type="checkbox"> Enable sign</span></label></p>
  <p><button id="storage-save" class="primary">Save Storage</button></p>
</section>

<section id="tab-users" class="card hidden">
  <h2>Users</h2>
  <p class="muted">Edit guest base_path here to restrict public browsing.</p>
  <div class="row"><button id="users-load">Refresh</button></div>
  <div id="users-list"></div>
</section>

<section id="tab-settings" class="card hidden">
  <h2>Settings</h2>
  <div class="grid">
    <label><span>Site title</span><input id="set-site-title"></label>
    <label><span>Main color</span><input id="set-main-color"></label>
    <label><span>Logo URL</span><input id="set-logo"></label>
    <label><span>Favicon URL</span><input id="set-favicon"></label>
    <label><span>Link expiration seconds</span><input id="set-link-exp" type="number"></label>
    <label><span>Sign all downloads</span><select id="set-sign-all"><option value="true">true</option><option value="false">false</option></select></label>
  </div>
  <label><span>Announcement</span><textarea id="set-announcement"></textarea></label>
  <label><span>Customize head</span><textarea id="set-head"></textarea></label>
  <label><span>Customize body</span><textarea id="set-body"></textarea></label>
  <p><button id="settings-save" class="primary">Save Settings</button></p>
</section>

<section id="tab-metas" class="card hidden">
  <h2>Metadata</h2>
  <div class="row"><button id="meta-new">New</button><button id="meta-load">Refresh</button></div>
  <div id="meta-list"></div>
  <h3 id="meta-form-title">Create Metadata</h3>
  <input id="meta-id" type="hidden">
  <div class="grid">
    <label><span>Path</span><input id="meta-path" value="/"></label>
    <label><span>Password</span><input id="meta-password"></label>
  </div>
  <label><span>README</span><textarea id="meta-readme"></textarea></label>
  <label><span>Header</span><textarea id="meta-header"></textarea></label>
  <label><span>Hide rules, one JavaScript RegExp per line</span><textarea id="meta-hide"></textarea></label>
  <p class="row">
    <label><span><input id="meta-p-sub" type="checkbox"> Password applies to sub paths</span></label>
    <label><span><input id="meta-r-sub" type="checkbox"> README applies to sub paths</span></label>
    <label><span><input id="meta-h-sub" type="checkbox"> Hide applies to sub paths</span></label>
  </p>
  <p><button id="meta-save" class="primary">Save Metadata</button></p>
</section>

<section id="tab-index" class="card hidden">
  <h2>Search Index</h2>
  <p class="muted">D1 lightweight index. Very large drives may need repeated builds.</p>
  <div class="row"><button id="index-build" class="primary">Build / Update</button><button id="index-clear">Clear</button><button id="index-progress">Progress</button></div>
  <pre id="index-output" class="mono"></pre>
</section>
</main>
${settings.customize_body || ""}
<script>
var token = localStorage.getItem("openlist_token") || "";
function byId(id){return document.getElementById(id)}
function show(msg){byId("msg").textContent = msg || ""}
function esc(s){return String(s == null ? "" : s).replace(/[&<>"]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;","\\"":"&quot;"}[c]})}
async function api(path, body, method) {
  var headers = { "content-type": "application/json" };
  if (token) headers.authorization = "Bearer " + token;
  var res = await fetch(path, { method: method || "POST", headers: headers, body: method === "GET" ? undefined : JSON.stringify(body || {}) });
  const json = await res.json();
  if (json.code !== 200) throw new Error(json.message);
  return json.data;
}
async function admin(path, body, method){return api(path, body, method)}
function tab(name){
  document.querySelectorAll(".tabs button").forEach(function(b){b.classList.toggle("active", b.dataset.tab === name)});
  document.querySelectorAll("section[id^=tab-]").forEach(function(s){s.classList.add("hidden")});
  byId("tab-" + name).classList.remove("hidden");
  show("");
}
document.querySelectorAll(".tabs button").forEach(function(b){b.onclick=function(){tab(b.dataset.tab); if(b.dataset.tab==="storages") loadStorages(); if(b.dataset.tab==="users") loadUsers(); if(b.dataset.tab==="settings") loadSettings(); if(b.dataset.tab==="metas") loadMetas();}});
async function load() {
  const p = byId("path").value || "/";
  const box = byId("files");
  box.textContent = "Loading...";
  try {
    const data = await api("/api/fs/list", { path: p, page: 1, per_page: 200 });
    byId("readme").innerHTML = data.readme ? esc(data.readme).replace(/\\n/g,"<br>") : "";
    box.innerHTML = data.content.map(function (item) {
      const child = (p.replace(/\\/$/, "") + "/" + item.name).replace(/\\/+/g, "/");
      return '<p>' + (item.is_dir ? 'DIR ' : 'FILE ') + '<a href="' + (item.is_dir ? '#" data-path="' + esc(child) : esc(item.raw_url || "/d" + child + "?sign=" + encodeURIComponent(item.sign || "") + "&openlist_ts=" + Math.floor(Date.now()/1000))) + '">' + esc(item.name) + '</a> <span class="muted">' + (item.is_dir ? "" : item.size + " bytes") + '</span></p>';
    }).join("") || "Empty";
    box.querySelectorAll("a[data-path]").forEach(function (a) { a.onclick = function () { byId("path").value = a.dataset.path; load(); return false; }; });
  } catch (e) {
    box.textContent = e.message;
  }
}
byId("go").onclick = load;
byId("up").onclick = function(){var p=byId("path").value.replace(/\\/$/,""); byId("path").value = p.split("/").slice(0,-1).join("/") || "/"; load()};

async function refreshMe(){
  try{var me=await api("/api/me",{}); byId("who").textContent = me.username + (me.role === 2 ? " (admin)" : ""); byId("logout").classList.toggle("hidden", !token)}
  catch(e){byId("who").textContent="guest"}
}
byId("login-btn").onclick = async function(){
  try{var data=await api("/api/auth/login",{username:byId("login-user").value,password:byId("login-pass").value}); token=data.token; localStorage.setItem("openlist_token",token); await refreshMe(); tab("storages"); loadStorages(); show("Logged in")}
  catch(e){show(e.message)}
};
byId("logout").onclick = async function(){try{await api("/api/auth/logout",{})}catch(e){} token=""; localStorage.removeItem("openlist_token"); await refreshMe(); tab("files")};

function storagePayload(){
  return {
    id: Number(byId("storage-id").value || 0),
    mount_path: byId("st-mount").value || "/drive",
    cache_expiration: Number(byId("st-cache").value || 30),
    disabled: byId("st-disabled").checked,
    enable_sign: byId("st-sign").checked,
    order_by: byId("st-order-by").value,
    order_direction: byId("st-order-dir").value,
    addition: {
      root_folder_path: byId("st-root").value || "/",
      region: byId("st-region").value || "global",
      client_id: byId("st-client-id").value,
      client_secret: byId("st-client-secret").value,
      redirect_uri: byId("st-redirect").value,
      refresh_token: byId("st-refresh").value,
      site_id: byId("st-site").value,
      custom_host: byId("st-host").value
    }
  };
}
function resetStorage(){["storage-id","st-client-id","st-client-secret","st-refresh","st-site","st-host"].forEach(function(id){byId(id).value=""}); byId("st-mount").value="/drive"; byId("st-root").value="/"; byId("st-region").value="global"; byId("st-cache").value="30"; byId("st-disabled").checked=false; byId("st-sign").checked=false; byId("storage-form-title").textContent="Create Storage"}
byId("storage-new").onclick=resetStorage;
byId("storage-load").onclick=loadStorages;
byId("storage-refresh-cache").onclick=async function(){try{await admin("/api/admin/storage/refresh_cache",{}); show("Storage cache refreshed"); loadStorages()}catch(e){show(e.message)}};
byId("storage-save").onclick=async function(){try{var p=storagePayload(); await admin("/api/admin/storage/" + (p.id ? "update" : "create"), p); show("Storage saved"); resetStorage(); loadStorages()}catch(e){show(e.message)}};
async function loadStorages(){
  try{var data=await admin("/api/admin/storage/list",{page:1,per_page:100}); byId("storage-list").innerHTML='<table class="table"><tr><th>ID</th><th>Mount</th><th>Status</th><th>Action</th></tr>'+data.content.map(function(s){return '<tr><td>'+s.id+'</td><td>'+esc(s.mount_path)+'</td><td>'+esc(s.disabled?"disabled":s.status)+'</td><td><button data-edit="'+s.id+'">Edit</button> <button data-cache="'+s.id+'">Refresh cache</button> <button data-toggle="'+s.id+'" data-disabled="'+s.disabled+'">'+(s.disabled?"Enable":"Disable")+'</button> <button data-del="'+s.id+'">Delete</button></td></tr>'}).join("")+'</table>';
    byId("storage-list").querySelectorAll("[data-edit]").forEach(function(b){b.onclick=async function(){editStorage(b.dataset.edit)}});
    byId("storage-list").querySelectorAll("[data-cache]").forEach(function(b){b.onclick=async function(){await admin("/api/admin/storage/refresh_cache?id="+b.dataset.cache,{},"GET"); show("Storage cache refreshed"); loadStorages()}});
    byId("storage-list").querySelectorAll("[data-toggle]").forEach(function(b){b.onclick=async function(){await admin("/api/admin/storage/"+(b.dataset.disabled==="true"?"enable":"disable")+"?id="+b.dataset.toggle,{},"GET"); loadStorages()}});
    byId("storage-list").querySelectorAll("[data-del]").forEach(function(b){b.onclick=async function(){if(confirm("Delete storage?")){await admin("/api/admin/storage/delete?id="+b.dataset.del,{},"GET"); loadStorages()}}});
  }catch(e){show(e.message)}
}
async function editStorage(id){
  var s=await admin("/api/admin/storage/get?id="+id,{},"GET"); var a={}; try{a=JSON.parse(s.addition||"{}")}catch(e){}
  byId("storage-id").value=s.id; byId("st-mount").value=s.mount_path; byId("st-root").value=a.root_folder_path||"/"; byId("st-region").value=a.region||"global"; byId("st-client-id").value=a.client_id||""; byId("st-client-secret").value=a.client_secret||""; byId("st-redirect").value=a.redirect_uri||"https://api.oplist.org/onedrive/callback"; byId("st-refresh").value=a.refresh_token||""; byId("st-site").value=a.site_id||""; byId("st-host").value=a.custom_host||""; byId("st-cache").value=s.cache_expiration||30; byId("st-disabled").checked=!!s.disabled; byId("st-sign").checked=!!s.enable_sign; byId("st-order-by").value=s.order_by||""; byId("st-order-dir").value=s.order_direction||""; byId("storage-form-title").textContent="Edit Storage #"+s.id;
}

byId("users-load").onclick=loadUsers;
async function loadUsers(){
  try{var data=await admin("/api/admin/user/list",{page:1,per_page:100}); byId("users-list").innerHTML='<table class="table"><tr><th>ID</th><th>User</th><th>Role</th><th>Base path</th><th>Disabled</th><th>Action</th></tr>'+data.content.map(function(u){return '<tr><td>'+u.id+'</td><td>'+esc(u.username)+'</td><td>'+u.role+'</td><td><input data-base="'+u.id+'" value="'+esc(u.base_path||"/")+'"></td><td><input type="checkbox" data-dis="'+u.id+'" '+(u.disabled?'checked':'')+'></td><td><button data-user-save="'+u.id+'">Save</button></td></tr>'}).join("")+'</table>';
    byId("users-list").querySelectorAll("[data-user-save]").forEach(function(b){b.onclick=async function(){var id=Number(b.dataset.userSave); var u=data.content.find(function(x){return x.id===id}); u.base_path=byId("users-list").querySelector('[data-base="'+id+'"]').value; u.disabled=byId("users-list").querySelector('[data-dis="'+id+'"]').checked; await admin("/api/admin/user/update",u); show("User saved"); loadUsers()}});
  }catch(e){show(e.message)}
}

var settingKeys=["site_title","main_color","logo","favicon","link_expiration","sign_all","announcement","customize_head","customize_body"];
async function loadSettings(){
  try{var data=await admin("/api/admin/setting/get?keys="+settingKeys.join(","),{},"GET"); var map={}; data.forEach(function(x){map[x.key]=x}); byId("set-site-title").value=(map.site_title||{}).value||""; byId("set-main-color").value=(map.main_color||{}).value||""; byId("set-logo").value=(map.logo||{}).value||""; byId("set-favicon").value=(map.favicon||{}).value||""; byId("set-link-exp").value=(map.link_expiration||{}).value||"0"; byId("set-sign-all").value=(map.sign_all||{}).value||"true"; byId("set-announcement").value=(map.announcement||{}).value||""; byId("set-head").value=(map.customize_head||{}).value||""; byId("set-body").value=(map.customize_body||{}).value||""}catch(e){show(e.message)}
}
byId("settings-save").onclick=async function(){
  var items=[
    {key:"site_title",value:byId("set-site-title").value,type:"string",group:1},
    {key:"main_color",value:byId("set-main-color").value,type:"string",group:2},
    {key:"logo",value:byId("set-logo").value,type:"text",group:2},
    {key:"favicon",value:byId("set-favicon").value,type:"string",group:2},
    {key:"link_expiration",value:byId("set-link-exp").value,type:"number",group:4,flag:1},
    {key:"sign_all",value:byId("set-sign-all").value,type:"bool",group:4,flag:1},
    {key:"announcement",value:byId("set-announcement").value,type:"text",group:1},
    {key:"customize_head",value:byId("set-head").value,type:"text",group:4,flag:1},
    {key:"customize_body",value:byId("set-body").value,type:"text",group:4,flag:1}
  ];
  try{await admin("/api/admin/setting/save",items); show("Settings saved. Refresh page to see HTML changes.")}catch(e){show(e.message)}
};

function resetMeta(){["meta-id","meta-password","meta-readme","meta-header","meta-hide"].forEach(function(id){byId(id).value=""}); byId("meta-path").value="/"; byId("meta-p-sub").checked=false; byId("meta-r-sub").checked=false; byId("meta-h-sub").checked=false; byId("meta-form-title").textContent="Create Metadata"}
byId("meta-new").onclick=resetMeta; byId("meta-load").onclick=loadMetas;
byId("meta-save").onclick=async function(){var p={id:Number(byId("meta-id").value||0),path:byId("meta-path").value,password:byId("meta-password").value,readme:byId("meta-readme").value,header:byId("meta-header").value,hide:byId("meta-hide").value,p_sub:byId("meta-p-sub").checked,r_sub:byId("meta-r-sub").checked,h_sub:byId("meta-h-sub").checked}; try{await admin("/api/admin/meta/"+(p.id?"update":"create"),p); show("Metadata saved"); resetMeta(); loadMetas()}catch(e){show(e.message)}};
async function loadMetas(){try{var data=await admin("/api/admin/meta/list",{page:1,per_page:100}); byId("meta-list").innerHTML='<table class="table"><tr><th>ID</th><th>Path</th><th>Action</th></tr>'+data.content.map(function(m){return '<tr><td>'+m.id+'</td><td>'+esc(m.path)+'</td><td><button data-meta-edit="'+m.id+'">Edit</button> <button data-meta-del="'+m.id+'">Delete</button></td></tr>'}).join("")+'</table>'; byId("meta-list").querySelectorAll("[data-meta-edit]").forEach(function(b){b.onclick=async function(){var m=await admin("/api/admin/meta/get?id="+b.dataset.metaEdit,{},"GET"); byId("meta-id").value=m.id; byId("meta-path").value=m.path; byId("meta-password").value=m.password||""; byId("meta-readme").value=m.readme||""; byId("meta-header").value=m.header||""; byId("meta-hide").value=m.hide||""; byId("meta-p-sub").checked=!!m.p_sub; byId("meta-r-sub").checked=!!m.r_sub; byId("meta-h-sub").checked=!!m.h_sub; byId("meta-form-title").textContent="Edit Metadata #"+m.id}}); byId("meta-list").querySelectorAll("[data-meta-del]").forEach(function(b){b.onclick=async function(){if(confirm("Delete metadata?")){await admin("/api/admin/meta/delete?id="+b.dataset.metaDel,{},"GET"); loadMetas()}}})}catch(e){show(e.message)}}

byId("index-build").onclick=async function(){try{byId("index-output").textContent="Running..."; byId("index-output").textContent=JSON.stringify(await admin("/api/admin/index/build",{}),null,2)}catch(e){show(e.message)}};
byId("index-clear").onclick=async function(){try{byId("index-output").textContent=JSON.stringify(await admin("/api/admin/index/clear",{}),null,2)}catch(e){show(e.message)}};
byId("index-progress").onclick=async function(){try{byId("index-output").textContent=JSON.stringify(await admin("/api/admin/index/progress",{},"GET"),null,2)}catch(e){show(e.message)}};

refreshMe();
load();
</script>
</body>
</html>`;
}

function injectHtml(html, settings, cdn) {
  const manifestPath = "/manifest.json";
  const publicSettingsScript = inlinePublicSettingsScript(settings);
  let out = html
    .replace(/<script\b[^>]*id=["']openlist-pages-customize["'][\s\S]*?<\/script>\s*/i, "")
    .replace(/<script\b[^>]*id=["']openlist-pages-public-settings["'][\s\S]*?<\/script>\s*/i, "")
    .replace("cdn: undefined", `cdn: '${cdn}'`)
    .replace("base_path: undefined", "base_path: '/'")
    .replace("main_color: undefined", `main_color: '${settings.main_color || "#1890ff"}'`)
    .replace('href="/manifest.json"', `href="${manifestPath}"`)
    .replace("Loading...", escapeHtml(settings.site_title || "OpenList"))
    .replace("https://res.oplist.org/logo/logo.svg", settings.favicon || "https://res.oplist.org/logo/logo.svg")
    .replace("https://res.oplist.org/logo/logo.png", (settings.logo || "").split("\n")[0] || "https://res.oplist.org/logo/logo.svg");
  out = out.replace("</head>", `${publicSettingsScript}${settings.customize_head || ""}</head>`);
  out = out.replace("</body>", `${storageCacheRefreshScript()}${settings.customize_body || ""}</body>`);
  return out;
}

async function frontendHtmlCacheKey(env, settings, cdn) {
  const version = env.OPENLIST_FRONTEND_CACHE_VERSION || env.CF_PAGES_COMMIT_SHA || env.CF_PAGES_DEPLOYMENT_ID || "default";
  const data = {
    version,
    builtin_admin_script: BUILTIN_ADMIN_SCRIPT_VERSION,
    cdn,
    site_title: settings.site_title || "",
    favicon: settings.favicon || "",
    logo: settings.logo || "",
    main_color: settings.main_color || "",
    customize_head: settings.customize_head || "",
    customize_body: settings.customize_body || "",
    public_settings: publicSettingsFromMap(settings),
  };
  return `frontend:html:${await sha256Hex(JSON.stringify(data))}`;
}

function storageCacheRefreshScript() {
  return `<script data-openlist-storage-cache-refresh>
(function(){
  if (window.__openlistStorageCacheRefresh) return;
  window.__openlistStorageCacheRefresh = true;
  var panel = null;
  var select = null;
  var status = null;
  var refreshButton = null;
  var refreshAllButton = null;
  var loaded = false;
  var loading = false;
  function inStoragePage() {
    return /\\/(?:@|%40)manage\\/storages(?:\\/|$)/.test(location.pathname) || location.hash.indexOf("@manage/storages") >= 0;
  }
  function authToken() {
    return localStorage.getItem("token") || localStorage.getItem("openlist_token") || localStorage.getItem("alist_token") || "";
  }
  function setStatus(message) {
    if (status) status.textContent = message || "";
  }
  function setBusy(busy) {
    if (refreshButton) refreshButton.disabled = busy;
    if (refreshAllButton) refreshAllButton.disabled = busy;
    if (select) select.disabled = busy;
  }
  function authHeaders() {
    var token = authToken();
    if (!token) throw new Error("Please login first.");
    return { "Content-Type": "application/json", Authorization: token };
  }
  async function adminApi(path, body) {
    var resp = await fetch(path, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(body || {})
    });
    var data = await resp.json().catch(function(){ return {}; });
    if (!resp.ok || data.code !== 200) throw new Error(data.message || "Request failed");
    return data.data || {};
  }
  function createPanel() {
    if (panel) return;
    panel = document.createElement("div");
    panel.style.cssText = "position:fixed;right:18px;bottom:18px;z-index:2147483647;width:min(320px,calc(100vw - 36px));border:1px solid rgba(148,163,184,.42);border-radius:8px;padding:12px;background:rgba(15,23,42,.94);color:#fff;font:14px system-ui,-apple-system,Segoe UI,sans-serif;box-shadow:0 12px 30px rgba(15,23,42,.28)";
    var title = document.createElement("div");
    title.textContent = "OneDrive cache";
    title.style.cssText = "font-weight:700;margin-bottom:8px";
    select = document.createElement("select");
    select.style.cssText = "box-sizing:border-box;width:100%;height:34px;border:1px solid rgba(203,213,225,.72);border-radius:6px;background:#fff;color:#111827;margin-bottom:8px";
    var row = document.createElement("div");
    row.style.cssText = "display:flex;gap:8px";
    refreshButton = document.createElement("button");
    refreshButton.type = "button";
    refreshButton.textContent = "Refresh selected";
    refreshButton.style.cssText = "flex:1;border:0;border-radius:6px;padding:8px 10px;background:#2563eb;color:#fff;font-weight:650;cursor:pointer";
    refreshAllButton = document.createElement("button");
    refreshAllButton.type = "button";
    refreshAllButton.textContent = "Refresh all";
    refreshAllButton.style.cssText = "border:0;border-radius:6px;padding:8px 10px;background:#475569;color:#fff;font-weight:650;cursor:pointer";
    status = document.createElement("div");
    status.style.cssText = "min-height:18px;margin-top:8px;color:#cbd5e1;font-size:12px;line-height:1.4";
    refreshButton.onclick = function() {
      var id = select && select.value ? Number(select.value) : 0;
      refreshCache(id);
    };
    refreshAllButton.onclick = function() {
      if (confirm("Refresh all OneDrive storage caches now?")) refreshCache(0);
    };
    row.appendChild(refreshButton);
    row.appendChild(refreshAllButton);
    panel.appendChild(title);
    panel.appendChild(select);
    panel.appendChild(row);
    panel.appendChild(status);
    document.body.appendChild(panel);
  }
  async function loadStorages(force) {
    if (!panel || loading || (loaded && !force)) return;
    if (!authToken()) {
      if (select) select.innerHTML = '<option value="">Login required</option>';
      setStatus("Login as admin to refresh storage cache.");
      return;
    }
    loading = true;
    setStatus("Loading storages...");
    try {
      var previous = select ? select.value : "";
      var data = await adminApi("/api/admin/storage/list", { page: 1, per_page: 100 });
      var storages = Array.isArray(data.content) ? data.content : [];
      if (select) {
        select.innerHTML = storages.map(function(storage) {
          var disabled = storage.disabled ? " disabled" : "";
          return '<option value="' + String(storage.id) + '"' + disabled + '>' + String(storage.mount_path || "/") + '</option>';
        }).join("") || '<option value="">No storages</option>';
        if (previous && Array.prototype.some.call(select.options, function(option) { return option.value === previous; })) {
          select.value = previous;
        }
      }
      loaded = true;
      setStatus(storages.length ? "Ready." : "No storage found.");
    } catch (error) {
      setStatus(error && error.message ? error.message : "Failed to load storages.");
    } finally {
      loading = false;
    }
  }
  async function refreshCache(id) {
    setBusy(true);
    setStatus("Refreshing cache...");
    try {
      var result = await adminApi("/api/admin/storage/refresh_cache", id ? { id: id } : {});
      loaded = false;
      setStatus("Refreshed " + (result.refreshed || 0) + " storage(s); preheat " + (result.preheat || "none") + ".");
      loadStorages(true);
    } catch (error) {
      setStatus(error && error.message ? error.message : "Refresh failed.");
    } finally {
      setBusy(false);
    }
  }
  function ensurePanel() {
    if (!inStoragePage()) {
      if (panel) panel.hidden = true;
      return;
    }
    createPanel();
    panel.hidden = false;
    loadStorages(false);
  }
  window.addEventListener("popstate", ensurePanel);
  window.addEventListener("hashchange", ensurePanel);
  new MutationObserver(ensurePanel).observe(document.documentElement, { childList: true, subtree: true });
  setInterval(ensurePanel, 1000);
  ensurePanel();
})();
</script>`;
}

function isStaticAssetRequest(path) {
  if (
    path.startsWith("/assets/") ||
    path.startsWith("/images/") ||
    path.startsWith("/static/") ||
    path.startsWith("/streamer/")
  ) {
    return true;
  }
  return /\.(?:js|mjs|css|map|png|jpg|jpeg|gif|svg|ico|webp|avif|woff2?|ttf|wasm|json|txt)$/i.test(path);
}

function staticAssetResponse(resp, path) {
  const headers = new Headers(resp.headers);
  if (path.startsWith("/assets/") || /-[A-Za-z0-9_-]{8,}\.[A-Za-z0-9]+$/.test(path)) {
    headers.set("Cache-Control", "public, max-age=31536000, immutable");
  } else {
    headers.set("Cache-Control", "public, max-age=86400");
  }
  return new Response(resp.body, {
    status: resp.status,
    statusText: resp.statusText,
    headers,
  });
}

function isDynamicAssetRoute(path) {
  return path === "/manifest.json" || path === "/robots.txt" || path === "/favicon.ico";
}

async function publicSettings(env) {
  const startedAt = nowMilliseconds();
  const trace = { cache: "unknown" };
  return ok(await publicSettingsMap(env, trace), publicApiDebugHeaders(trace.cache, startedAt, shortPublicCacheHeaders()));
}

async function publicSettingsMap(env, trace = null) {
  const cacheKey = `settings:public:${BUILTIN_ADMIN_SCRIPT_VERSION}`;
  const cached = memoryGet("settings:public");
  if (cached !== undefined) {
    if (trace) trace.cache = "memory";
    return cached;
  }
  const bundled = await getRuntimeCache(cacheKey);
  if (bundled && typeof bundled === "object" && !Array.isArray(bundled)) {
    memorySet("settings:public", bundled, SETTINGS_MEMORY_TTL);
    if (trace) trace.cache = "runtime";
    return bundled;
  }
  const data = publicSettingsFromMap(await settingsMap(env));
  await setRuntimeCache(cacheKey, data, PUBLIC_CONFIG_TTL);
  memorySet("settings:public", data, SETTINGS_MEMORY_TTL);
  if (trace) trace.cache = "d1";
  return data;
}

function publicSettingsFromMap(settings) {
  const exposedPrivate = new Set([
    "customize_head",
    "customize_body",
    "text_types",
    "audio_types",
    "video_types",
    "image_types",
    "proxy_types",
    "proxy_ignore_headers",
  ]);
  const data = {};
  for (const item of DEFAULT_SETTINGS) {
    if (item.flag !== FLAG_PRIVATE || exposedPrivate.has(item.key)) data[item.key] = settings[item.key] ?? item.value;
  }
  data.customize_body = `${storageCacheRefreshScript()}${data.customize_body || ""}`;
  return data;
}

function inlinePublicSettingsScript(settings) {
  return `<script id="openlist-pages-public-settings">window.__openlistPagesPublicSettings=${scriptJson(publicSettingsFromMap(settings))};window.__openlistPagesTakePublicSettings=function(){var data=window.__openlistPagesPublicSettings;window.__openlistPagesPublicSettings=undefined;return data;};</script>`;
}

function scriptJson(value) {
  return JSON.stringify(value).replace(/[<>&\u2028\u2029]/g, (char) => {
    if (char === "<") return "\\u003c";
    if (char === ">") return "\\u003e";
    if (char === "&") return "\\u0026";
    if (char === "\u2028") return "\\u2028";
    return "\\u2029";
  });
}

async function manifest(env, request) {
  const settings = await settingsMap(env, true);
  return json({
    display: "standalone",
    scope: "/",
    start_url: "/",
    name: settings.site_title || "OpenList",
    icons: [{ src: (settings.logo || "").split("\n")[0] || "https://res.oplist.org/logo/logo.svg", sizes: "512x512", type: "image/png" }],
  }, 200, { "Cache-Control": "public, max-age=3600" });
}

async function robots(env) {
  return text(await getSetting(env, "robots_txt", "User-agent: *\nAllow: /"), 200, { "Content-Type": "text/plain; charset=utf-8" });
}

async function favicon(env) {
  const faviconUrl = await getSetting(env, "favicon", "https://res.oplist.org/logo/logo.svg");
  return Response.redirect(faviconUrl, 302);
}

async function signedDownloadUrl(env, reqPath, storage) {
  const ts = nowSeconds();
  const sign = await downloadSign(env, reqPath, ts);
  return `/d${encodeDownloadPath(reqPath)}?sign=${encodeURIComponent(sign)}&sign_ts=${ts}&openlist_ts=${ts}`;
}

async function objResp(env, obj, parent, storage, settings = {}) {
  const reqPath = joinPath(parent, obj.name);
  const ts = nowSeconds();
  const sign = obj.is_dir ? "" : await downloadSign(env, reqPath, ts);
  return {
    name: obj.name,
    size: obj.size || 0,
    is_dir: !!obj.is_dir,
    modified: obj.modified || new Date().toISOString(),
    created: obj.created || obj.modified || new Date().toISOString(),
    sign,
    thumb: obj.thumb || "",
    type: objType(obj.name, !!obj.is_dir, settings),
    hashinfo: "",
    hash_info: {},
    raw_url: obj.is_dir ? "" : `/d${encodeDownloadPath(reqPath)}?sign=${encodeURIComponent(sign)}&sign_ts=${ts}&openlist_ts=${ts}`,
  };
}

function oneDriveObj(item, includeDownloadUrl = false) {
  const info = item.fileSystemInfo || {};
  const obj = {
    id: item.id || "",
    name: item.name || "",
    size: Number(item.size || 0),
    is_dir: !!item.folder || !item.file,
    modified: info.lastModifiedDateTime || item.lastModifiedDateTime || new Date().toISOString(),
    created: info.createdDateTime || item.createdDateTime || "",
    thumb: item.thumbnails && item.thumbnails[0] && item.thumbnails[0].medium ? item.thumbnails[0].medium.url : "",
  };
  if (includeDownloadUrl) obj.download_url = item["@microsoft.graph.downloadUrl"] || item.content?.downloadUrl || "";
  return obj;
}

function driveItemTag(item) {
  const info = item.fileSystemInfo || {};
  return [
    item.cTag || "",
    item.eTag || "",
    info.lastModifiedDateTime || item.lastModifiedDateTime || "",
    String(item.size ?? ""),
  ].join("|");
}

function oneDrivePath(storage, addition, reqPath) {
  const relative = stripPrefix(reqPath, storage.mount_path);
  return normalizePath(joinPath(addition.root_folder_path || "/", relative));
}

function graphBaseUrl(region) {
  if (region === "cn") return "https://microsoftgraph.chinacloudapi.cn/v1.0";
  if (region === "us") return "https://graph.microsoft.us/v1.0";
  if (region === "de") return "https://graph.microsoft.de/v1.0";
  return "https://graph.microsoft.com/v1.0";
}

function oauthBaseUrl(region, tenant) {
  if (region === "cn") return `https://login.partner.microsoftonline.cn/${tenant}/oauth2/v2.0/token`;
  if (region === "us") return `https://login.microsoftonline.us/${tenant}/oauth2/v2.0/token`;
  if (region === "de") return `https://login.microsoftonline.de/${tenant}/oauth2/v2.0/token`;
  return `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`;
}

function encodeDrivePath(p) {
  return normalizePath(p).split("/").filter(Boolean).map(encodeURIComponent).join("/").replace(/^/, "/");
}

async function saveOneDriveToken(env, storageId, addition) {
  if (!addition.refresh_token) return;
  await env.OPENLIST_DB.prepare("INSERT INTO onedrive_tokens (storage_id, refresh_token, access_token, expires_at, updated_at) VALUES (?, ?, '', 0, CURRENT_TIMESTAMP) ON CONFLICT(storage_id) DO UPDATE SET refresh_token = excluded.refresh_token, updated_at = CURRENT_TIMESTAMP")
    .bind(storageId, addition.refresh_token)
    .run();
  clearMemoryPrefix(`onedrive:${storageId}`);
  await deleteRuntimeCache(`onedrive:${storageId}`);
}

async function nearestMeta(env, reqPath) {
  const metas = await allMetas(env);
  for (const meta of metas) {
    if (samePath(reqPath, meta.path) || reqPath.startsWith(addSlash(meta.path))) return meta;
  }
  return null;
}

async function canAccess(user, meta, reqPath, password) {
  if (!meta) return true;
  const readUsers = parseJson(meta.read_users, []);
  const readApplies = samePath(reqPath, meta.path) || (meta.read_users_sub && reqPath.startsWith(addSlash(meta.path)));
  if (readApplies && readUsers.length > 0 && !readUsers.includes(user.id) && user.role !== ROLE_ADMIN) return false;
  const passApplies = meta.password && (samePath(reqPath, meta.path) || (meta.p_sub && reqPath.startsWith(addSlash(meta.path))));
  if (passApplies && user.role !== ROLE_ADMIN && !canAccessWithoutPassword(user.permission) && password !== meta.password) return false;
  return true;
}

function metaText(meta, reqPath, field, subField) {
  if (!meta || !meta[field]) return "";
  if (samePath(reqPath, meta.path) || (meta[subField] && reqPath.startsWith(addSlash(meta.path)))) return meta[field];
  return "";
}

function applyMetaHide(content, meta, reqPath) {
  if (!meta || !meta.hide) return content;
  const applies = samePath(reqPath, meta.path) || (meta.h_sub && reqPath.startsWith(addSlash(meta.path)));
  if (!applies) return content;
  const rules = meta.hide.split("\n").map((x) => x.trim()).filter(Boolean).map(parseRegexRule).filter(Boolean);
  if (rules.length === 0) return content;
  return content.filter((obj) => !rules.some((rule) => rule.test(obj.name)));
}

function validateHideRules(hide) {
  for (const rule of String(hide || "").split("\n").map((x) => x.trim()).filter(Boolean)) {
    try {
      parseRegexRule(rule);
    } catch (error) {
      return { rule, message: error.message };
    }
  }
  return null;
}

function parseRegexRule(raw) {
  if (raw.startsWith("/") && raw.lastIndexOf("/") > 0) {
    const end = raw.lastIndexOf("/");
    return new RegExp(raw.slice(1, end), raw.slice(end + 1));
  }
  return new RegExp(raw);
}

function canAccessWithoutPassword(permission) {
  return ((Number(permission || 0) >> 1) & 1) === 1;
}

function sortObjects(content, storage) {
  if (!storage || !storage.order_by) return content;
  const direction = storage.order_direction === "desc" ? -1 : 1;
  const field = storage.order_by;
  return [...content].sort((a, b) => {
    if (field === "size") return ((a.size || 0) - (b.size || 0)) * direction;
    if (field === "modified") return (String(a.modified || "").localeCompare(String(b.modified || ""))) * direction;
    return String(a.name || "").localeCompare(String(b.name || "")) * direction;
  });
}

function normalizeStorageInput(input) {
  const addition = typeof input.addition === "string" ? input.addition : JSON.stringify(input.addition || {});
  return {
    id: Number(input.id || 0),
    mount_path: normalizePath(input.mount_path || "/"),
    order: Number(input.order ?? input.storage_order ?? 0),
    cache_expiration: Number(input.cache_expiration ?? 30),
    custom_cache_policies: String(input.custom_cache_policies || ""),
    addition,
    remark: String(input.remark || ""),
    disabled: boolInt(input.disabled),
    disable_index: boolInt(input.disable_index),
    enable_sign: boolInt(input.enable_sign),
    order_by: String(input.order_by || ""),
    order_direction: String(input.order_direction || ""),
    extract_folder: String(input.extract_folder || ""),
    web_proxy: boolInt(input.web_proxy),
    webdav_policy: String(input.webdav_policy || "302_redirect"),
    proxy_range: boolInt(input.proxy_range),
    down_proxy_url: String(input.down_proxy_url || ""),
    disable_proxy_sign: boolInt(input.disable_proxy_sign),
  };
}

function normalizeMetaInput(input) {
  return {
    id: Number(input.id || 0),
    path: normalizePath(input.path || "/"),
    read_users: JSON.stringify(input.read_users || []),
    read_users_sub: boolInt(input.read_users_sub),
    write_users: JSON.stringify(input.write_users || []),
    write_users_sub: boolInt(input.write_users_sub),
    password: String(input.password || ""),
    p_sub: boolInt(input.p_sub),
    write: boolInt(input.write),
    w_sub: boolInt(input.w_sub),
    hide: String(input.hide || ""),
    h_sub: boolInt(input.h_sub),
    readme: String(input.readme || ""),
    r_sub: boolInt(input.r_sub),
    header: String(input.header || ""),
    header_sub: boolInt(input.header_sub),
  };
}

function storageFromRow(row) {
  return {
    id: row.id,
    mount_path: row.mount_path,
    order: row.storage_order,
    driver: row.driver,
    cache_expiration: row.cache_expiration,
    custom_cache_policies: row.custom_cache_policies,
    status: row.status,
    addition: row.addition,
    remark: row.remark,
    modified: row.modified,
    disabled: !!row.disabled,
    disable_index: !!row.disable_index,
    enable_sign: !!row.enable_sign,
    order_by: row.order_by,
    order_direction: row.order_direction,
    extract_folder: row.extract_folder,
    web_proxy: !!row.web_proxy,
    webdav_policy: row.webdav_policy,
    proxy_range: !!row.proxy_range,
    down_proxy_url: row.down_proxy_url,
    disable_proxy_sign: !!row.disable_proxy_sign,
    mount_details: null,
  };
}

function metaFromRow(row) {
  return {
    id: row.id,
    path: row.path,
    read_users: parseJson(row.read_users, []),
    read_users_sub: !!row.read_users_sub,
    write_users: parseJson(row.write_users, []),
    write_users_sub: !!row.write_users_sub,
    password: row.password,
    p_sub: !!row.p_sub,
    write: !!row.write,
    w_sub: !!row.w_sub,
    hide: row.hide,
    h_sub: !!row.h_sub,
    readme: row.readme,
    r_sub: !!row.r_sub,
    header: row.header,
    header_sub: !!row.header_sub,
  };
}

function settingFromRow(row) {
  return {
    key: row.key,
    value: row.value,
    help: row.help,
    type: row.type,
    options: row.options,
    group: row.group_id,
    flag: row.flag,
    index: row.item_index,
  };
}

function settingFromDefault(item, index) {
  return {
    key: item.key,
    value: item.value,
    help: item.help,
    type: item.type,
    options: item.options,
    group: item.group,
    flag: item.flag,
    index,
  };
}

function safeUser(user) {
  return {
    id: user.id,
    username: user.username,
    password: "",
    base_path: user.base_path,
    role: user.role,
    is_admin: user.role === ROLE_ADMIN,
    is_guest: user.role === ROLE_GUEST,
    disabled: !!user.disabled,
    permission: user.permission,
    otp: !!user.otp_secret,
    otp_secret: "",
    sso_id: user.sso_id || "",
    allow_ldap: !!user.allow_ldap,
  };
}

async function getStorageById(env, id) {
  const storages = await allStorages(env);
  return storages.find((storage) => Number(storage.id) === Number(id)) || null;
}

async function allStorages(env) {
  const cached = memoryGet("storages:all");
  if (cached !== undefined) return cached;
  const runtime = await getRuntimeCache("storages:all");
  if (runtime !== null) {
    memorySet("storages:all", runtime, PUBLIC_CONFIG_TTL);
    return runtime;
  }
  const rows = await env.OPENLIST_DB.prepare("SELECT * FROM storages ORDER BY storage_order, mount_path").all();
  const storages = rows.results.map(storageFromRow);
  memorySet("storages:all", storages, PUBLIC_CONFIG_TTL);
  await setRuntimeCache("storages:all", storages, PUBLIC_CONFIG_TTL);
  return storages;
}

async function enabledStorages(env, sort = "order") {
  const key = `storages:enabled:${sort}`;
  const cached = memoryGet(key);
  if (cached !== undefined) return cached;
  const storages = (await allStorages(env)).filter((storage) => !storage.disabled);
  if (sort === "length") {
    storages.sort((a, b) => b.mount_path.length - a.mount_path.length);
  } else {
    storages.sort((a, b) => (a.order - b.order) || a.mount_path.localeCompare(b.mount_path));
  }
  memorySet(key, storages, PUBLIC_CONFIG_TTL);
  return storages;
}

async function allMetas(env) {
  const cached = memoryGet("metas:all");
  if (cached !== undefined) return cached;
  const runtime = await getRuntimeCache("metas:all");
  if (runtime !== null) {
    memorySet("metas:all", runtime, PUBLIC_CONFIG_TTL);
    return runtime;
  }
  const rows = await env.OPENLIST_DB.prepare("SELECT * FROM metas ORDER BY LENGTH(path) DESC").all();
  const metas = rows.results.map(metaFromRow);
  memorySet("metas:all", metas, PUBLIC_CONFIG_TTL);
  await setRuntimeCache("metas:all", metas, PUBLIC_CONFIG_TTL);
  return metas;
}

async function allSettingRows(env) {
  const cached = memoryGet("settings:rows");
  if (cached !== undefined) return cached;
  const rows = await env.OPENLIST_DB.prepare("SELECT * FROM settings ORDER BY item_index").all();
  memorySet("settings:rows", rows.results, SETTINGS_MEMORY_TTL);
  return rows.results;
}

async function settingsMap(env) {
  const cached = memoryGet("settings:map");
  if (cached !== undefined) return cached;
  const bundled = await getRuntimeCache("settings:map");
  if (bundled && typeof bundled === "object" && !Array.isArray(bundled)) {
    memorySet("settings:map", bundled, SETTINGS_MEMORY_TTL);
    return bundled;
  }
  const rows = await allSettingRows(env);
  const result = {};
  for (const row of rows) result[row.key] = row.value;
  for (const item of DEFAULT_SETTINGS) {
    if (result[item.key] === undefined) result[item.key] = item.value;
  }
  await setRuntimeCache("settings:map", result, PUBLIC_CONFIG_TTL);
  memorySet("settings:map", result, SETTINGS_MEMORY_TTL);
  return result;
}

async function getSetting(env, key, fallback = "") {
  if (VOLATILE_SETTING_KEYS.has(key)) {
    const row = await env.OPENLIST_DB.prepare("SELECT value FROM settings WHERE key = ?").bind(key).first();
    return row ? row.value : fallback;
  }
  const settings = await settingsMap(env);
  return settings[key] ?? fallback;
}

async function setSetting(env, key, value) {
  const def = DEFAULT_SETTINGS.find((s) => s.key === key) || item(key, "", "string", GROUPS.SINGLE, FLAG_PRIVATE);
  await env.OPENLIST_DB.prepare("INSERT INTO settings (key, value, help, type, options, group_id, flag, item_index) VALUES (?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value")
    .bind(key, String(value), def.help, def.type, def.options, def.group, def.flag, def.index || 0)
    .run();
  if (!VOLATILE_SETTING_KEYS.has(key)) await clearSettingsCache(env);
}

function fsListCacheKey(storage, reqPath) {
  return `fs:list:${storage.id}:${storage.modified || ""}:${normalizePath(reqPath)}`;
}

function fsListFreshKey(storage, reqPath) {
  return `fs:fresh:${storage.id}:${storage.modified || ""}:${normalizePath(reqPath)}`;
}

function fsListContent(payload) {
  if (Array.isArray(payload)) return payload;
  if (payload && Array.isArray(payload.content)) return payload.content;
  return null;
}

function fsListTag(payload) {
  return payload && !Array.isArray(payload) ? String(payload.tag || "") : "";
}

async function isOneDriveListCacheTrusted(env, storage, reqPath, payload) {
  const freshUntil = payload && !Array.isArray(payload) ? Number(payload.fresh_until || 0) : 0;
  if (freshUntil > nowSeconds()) return true;
  const tag = payload && !Array.isArray(payload) ? String(payload.tag || "") : "";
  if (!tag) return false;
  const freshKey = fsListFreshKey(storage, reqPath);
  const trusted = await getRuntimeCache(freshKey);
  if (trusted === tag) return true;
  return false;
}

function downloadCacheKey(storage, reqPath) {
  return `download:${storage.id}:${storage.modified || ""}:${normalizePath(reqPath)}`;
}

async function getRuntimeCache(key) {
  const memKey = runtimeMemoryKey(key);
  const cached = memoryGet(memKey);
  if (cached !== undefined) return cached;
  if (isFsRuntimeCacheKey(key)) {
    const legacyCached = memoryGet(`runtime:${key}`);
    if (legacyCached !== undefined) {
      memorySet(memKey, legacyCached, RUNTIME_MEMORY_TTL);
      return legacyCached;
    }
  }
  const current = await getRuntimeCacheFromNamespace(key, runtimeCacheNamespaceForKey(key), memKey);
  if (current !== null) return current;
  if (isFsRuntimeCacheKey(key) && runtimeCacheNamespace !== fsRuntimeCacheNamespace) {
    return getRuntimeCacheFromNamespace(key, runtimeCacheNamespace, memKey);
  }
  return null;
}

async function getRuntimeCacheFromNamespace(key, namespace, memKey) {
  if (typeof caches === "undefined" || !caches.default) return null;
  const request = await runtimeCacheRequest(key, namespace);
  const resp = await caches.default.match(request).catch(() => null);
  if (!resp || !resp.ok) return null;
  const data = await resp.json().catch(() => null);
  if (!data || Number(data.expires_at || 0) <= nowSeconds()) return null;
  memorySet(memKey, data.value, Math.min(Number(data.expires_at) - nowSeconds(), RUNTIME_MEMORY_TTL));
  return data.value;
}

async function setRuntimeCache(key, value, seconds) {
  if (seconds <= 0) return;
  memorySet(runtimeMemoryKey(key), value, Math.min(seconds, RUNTIME_MEMORY_TTL));
  if (typeof caches === "undefined" || !caches.default) return;
  const request = await runtimeCacheRequest(key);
  const body = JSON.stringify({ value, expires_at: nowSeconds() + seconds });
  const response = new Response(body, {
    headers: {
      "Cache-Control": `public, max-age=${seconds}`,
      "Content-Type": "application/json; charset=utf-8",
    },
  });
  await caches.default.put(request, response).catch(() => {});
}

async function deleteRuntimeCache(key) {
  memoryDelete(runtimeMemoryKey(key));
  if (typeof caches === "undefined" || !caches.default) return;
  const request = await runtimeCacheRequest(key);
  await caches.default.delete(request).catch(() => {});
}

async function runtimeCacheRequest(key, namespace = runtimeCacheNamespaceForKey(key)) {
  return new Request(`https://openlist-runtime-cache.local/${await sha256Hex(`${namespace}:${key}`)}`, { method: "GET" });
}

function runtimeMemoryKey(key) {
  if (isFsRuntimeCacheKey(key)) return `runtime:${fsRuntimeCacheNamespace}:${key}`;
  return `runtime:${key}`;
}

function runtimeCacheNamespaceForKey(key) {
  return isFsRuntimeCacheKey(key) ? fsRuntimeCacheNamespace : runtimeCacheNamespace;
}

function isFsRuntimeCacheKey(key) {
  return String(key || "").startsWith("fs:list:") || String(key || "").startsWith("fs:fresh:");
}

function runtimeCacheNamespaceFromEnv(env) {
  return String(
    env.OPENLIST_CACHE_VERSION ||
    env.CF_PAGES_COMMIT_SHA ||
    env.CF_PAGES_DEPLOYMENT_ID ||
    "default"
  );
}

function fsRuntimeCacheNamespaceFromEnv(env) {
  return String(env.OPENLIST_FS_CACHE_VERSION || env.OPENLIST_CACHE_VERSION || "openlist-fs-v1");
}

async function pathSign(env, path, ts) {
  const secret = env.OPENLIST_JWT_SECRET || await getSetting(env, "token", "openlist-pages");
  return hmacHex(secret, `${normalizePath(path)}:${ts || 0}`);
}

async function downloadSign(env, path, ts) {
  const signTs = Number(ts || nowSeconds());
  return `${signTs}:${await pathSign(env, path, signTs)}`;
}

async function verifyDownloadSign(env, path, sign, explicitTs) {
  sign = String(sign || "");
  const embedded = /^(\d{1,16}):([a-f0-9]{64})$/i.exec(sign);
  if (embedded) {
    const ts = Number(embedded[1]);
    const expected = await pathSign(env, path, ts);
    return { ok: timingSafeEqual(expected, embedded[2].toLowerCase()), ts };
  }

  if (explicitTs) {
    const expected = await pathSign(env, path, explicitTs);
    if (timingSafeEqual(expected, sign)) return { ok: true, ts: explicitTs };
  }

  const unsignedTsExpected = await pathSign(env, path, 0);
  return { ok: timingSafeEqual(unsignedTsExpected, sign), ts: 0 };
}

async function passwordHashFromRaw(password, salt) {
  const staticHash = await staticPasswordHash(password);
  return sha256Hex(`${staticHash}-${salt}`);
}

async function staticPasswordHash(password) {
  return sha256Hex(`${password}-${STATIC_HASH_SALT}`);
}

async function sha256Hex(input) {
  const data = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return hex(hash);
}

async function hmacHex(secret, input) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(input));
  return hex(signature);
}

function hex(buffer) {
  return [...new Uint8Array(buffer)].map((x) => x.toString(16).padStart(2, "0")).join("");
}

async function randomToken(size = 24) {
  const bytes = new Uint8Array(size);
  crypto.getRandomValues(bytes);
  return [...bytes].map((x) => x.toString(16).padStart(2, "0")).join("");
}

async function readBody(request) {
  if (request.method === "GET" || request.method === "HEAD") return Object.fromEntries(new URL(request.url).searchParams.entries());
  const type = request.headers.get("content-type") || "";
  if (type.includes("application/json")) return request.json().catch(() => ({}));
  if (type.includes("form")) return Object.fromEntries((await request.formData()).entries());
  const textBody = await request.text();
  if (!textBody) return {};
  try {
    return JSON.parse(textBody);
  } catch {
    return {};
  }
}

function pageReq(body, request) {
  const url = new URL(request.url);
  const page = Math.max(1, Number(body.page || url.searchParams.get("page") || 1));
  const perPage = Math.min(500, Math.max(1, Number(body.per_page || body.perPage || url.searchParams.get("per_page") || 30)));
  return { page, per_page: perPage, offset: (page - 1) * perPage };
}

function intParam(request, key) {
  return Number(new URL(request.url).searchParams.get(key) || 0);
}

function bearerToken(request) {
  const auth = request.headers.get("authorization") || "";
  if (!auth) return "";
  if (auth.toLowerCase().startsWith("bearer ")) return auth.slice(7).trim();
  return auth.trim();
}

function cookieValue(request, name) {
  const cookies = request.headers.get("cookie") || "";
  for (const part of cookies.split(";")) {
    const index = part.indexOf("=");
    if (index <= 0) continue;
    const key = part.slice(0, index).trim();
    if (key !== name) continue;
    try {
      return decodeURIComponent(part.slice(index + 1).trim());
    } catch {
      return part.slice(index + 1).trim();
    }
  }
  return "";
}

function item(key, value, type, group, flag = FLAG_PUBLIC, options = "", help = "") {
  return { key, value, type, group, flag, options, help };
}

function driverItem(name, type = "string", defaultValue = "", options = "", required = false, help = "") {
  return { name, type, default: defaultValue, options, required, help };
}

function ok(data = null, headers = {}) {
  return json({ code: 200, message: "success", data }, 200, headers);
}

function apiError(message, code = 500) {
  return json({ code, message: String(message), data: null });
}

function jsonError(error, code = 500) {
  return apiError(error && error.message ? error.message : String(error), code);
}

function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...headers },
  });
}

function text(data, status = 200, headers = {}) {
  return new Response(data, { status, headers: { "Content-Type": "text/plain; charset=utf-8", ...headers } });
}

function htmlResponse(data) {
  return new Response(data, { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } });
}

function fsDebugHeaders(listing, startedAt) {
  return debugHeaders(startedAt, {
    "X-OpenList-FS-Cache": listing.cache || "unknown",
    "X-OpenList-FS-Revalidate": listing.revalidate || "none",
    "X-OpenList-Storage": listing.storage ? String(listing.storage.id) : "virtual",
  });
}

function publicApiDebugHeaders(cacheState, startedAt, headers = {}) {
  return debugHeaders(startedAt, {
    ...headers,
    "X-OpenList-Cache": cacheState || "unknown",
  });
}

function shortPublicCacheHeaders(headers = {}) {
  return {
    "Cache-Control": `public, max-age=${GUEST_API_CACHE_SECONDS}`,
    ...headers,
  };
}

function debugHeaders(startedAt, headers = {}) {
  return {
    ...headers,
    "Server-Timing": `openlist;dur=${Math.max(0, nowMilliseconds() - startedAt)}`,
  };
}

function nowSeconds() {
  return Math.floor(Date.now() / 1000);
}

function nowMilliseconds() {
  return Date.now();
}

function memoryGet(key) {
  const item = MEM_CACHE.get(key);
  if (!item) return undefined;
  if (item.expires <= Date.now()) {
    MEM_CACHE.delete(key);
    return undefined;
  }
  return item.value;
}

function memorySet(key, value, seconds) {
  if (seconds <= 0) return;
  MEM_CACHE.set(key, { value, expires: Date.now() + seconds * 1000 });
}

function memoryDelete(key) {
  MEM_CACHE.delete(key);
}

function clearMemoryPrefix(prefix) {
  for (const key of MEM_CACHE.keys()) {
    if (!prefix || key.startsWith(prefix)) MEM_CACHE.delete(key);
  }
}

function clearSettingsMemory() {
  clearMemoryPrefix("settings:");
}

async function clearSettingsCache(env) {
  clearSettingsMemory();
  await deleteRuntimeCache("settings:map");
  await deleteRuntimeCache("settings:public");
  await deleteRuntimeCache(`settings:public:${BUILTIN_ADMIN_SCRIPT_VERSION}`);
}

function clearStorageMemory() {
  clearMemoryPrefix("storages:");
  clearMemoryPrefix("onedrive:");
  clearMemoryPrefix("download:");
  clearMemoryPrefix("runtime:storages:");
  clearMemoryPrefix("runtime:onedrive:");
  clearMemoryPrefix("runtime:download:");
}

async function clearStorageCache(env) {
  clearStorageMemory();
  await deleteRuntimeCache("storages:all");
}

async function clearStorageVersionCache(env) {
  clearMemoryPrefix("storages:");
  clearMemoryPrefix("download:");
  clearMemoryPrefix("runtime:storages:");
  clearMemoryPrefix("runtime:download:");
  clearMemoryPrefix("runtime:fs:");
  clearMemoryPrefix(`runtime:${fsRuntimeCacheNamespace}:fs:`);
  await deleteRuntimeCache("storages:all");
}

function clearMetaMemory() {
  clearMemoryPrefix("metas:");
  clearMemoryPrefix("runtime:metas:");
}

async function clearMetaCache(env) {
  clearMetaMemory();
  await deleteRuntimeCache("metas:all");
}

function clearUserMemory() {
  clearMemoryPrefix("session:");
  clearMemoryPrefix("user:");
  clearMemoryPrefix("runtime:user:");
}

async function clearUserCache(env) {
  clearUserMemory();
  await deleteRuntimeCache("user:guest");
}

function normalizePath(input) {
  let path = `/${String(input || "").replace(/\\/g, "/")}`;
  const parts = [];
  for (const part of path.split("/")) {
    if (!part || part === ".") continue;
    if (part === "..") {
      parts.pop();
    } else {
      parts.push(part);
    }
  }
  return `/${parts.join("/")}`;
}

function joinPath(...parts) {
  return normalizePath(parts.filter((x) => x !== undefined && x !== null).join("/"));
}

function encodeDownloadPath(path) {
  return normalizePath(path).split("/").map((part) => encodeURIComponent(part)).join("/");
}

function joinBasePath(base, req) {
  return joinPath(base || "/", req || "/");
}

function addSlash(path) {
  path = normalizePath(path);
  return path === "/" ? "/" : `${path}/`;
}

function dirname(path) {
  path = normalizePath(path);
  const index = path.lastIndexOf("/");
  return index <= 0 ? "/" : path.slice(0, index);
}

function basename(path) {
  path = normalizePath(path);
  return path === "/" ? "" : path.slice(path.lastIndexOf("/") + 1);
}

function samePath(a, b) {
  return normalizePath(a) === normalizePath(b);
}

function stripPrefix(path, prefix) {
  path = normalizePath(path);
  prefix = normalizePath(prefix);
  if (samePath(path, prefix)) return "/";
  if (path.startsWith(addSlash(prefix))) return normalizePath(path.slice(prefix.length));
  return path;
}

function parseJson(value, fallback = {}) {
  try {
    return JSON.parse(value || "");
  } catch {
    return fallback;
  }
}

function truthy(value) {
  return value === true || value === 1 || value === "1" || String(value).toLowerCase() === "true";
}

function boolInt(value) {
  return truthy(value) ? 1 : 0;
}

function boolSetting(value) {
  return truthy(value);
}

function linkExpirationSeconds(value) {
  const hours = Number(value || 0);
  return hours > 0 ? Math.floor(hours * 3600) : 0;
}

function cacheSecondsForPath(storage, reqPath) {
  let minutes = Number(storage?.cache_expiration ?? 30);
  const policies = String(storage?.custom_cache_policies || "").split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const relative = storage ? stripPrefix(reqPath, storage.mount_path) : normalizePath(reqPath);
  for (const line of policies) {
    const index = line.lastIndexOf(":");
    if (index <= 0) continue;
    const pattern = line.slice(0, index).trim();
    const policyMinutes = Number(line.slice(index + 1).trim());
    if (!Number.isFinite(policyMinutes)) continue;
    if (globMatch(pattern, relative) || globMatch(pattern, reqPath)) {
      minutes = policyMinutes;
      break;
    }
  }
  return minutes > 0 ? Math.floor(minutes * 60) : 0;
}

function globMatch(pattern, path) {
  pattern = normalizePath(pattern || "/");
  path = normalizePath(path || "/");
  let source = "";
  for (let i = 0; i < pattern.length; i++) {
    const c = pattern[i];
    if (c === "*") {
      if (pattern[i + 1] === "*") {
        source += ".*";
        i++;
      } else {
        source += "[^/]*";
      }
    } else if (c === "?") {
      source += "[^/]";
    } else {
      source += c.replace(/[|\\{}()[\]^$+?.]/g, "\\$&");
    }
  }
  return new RegExp(`^${source}$`).test(path);
}

function objType(name, isDir, settings = {}) {
  if (isDir) return 1;
  const ext = String(name).split(".").pop().toLowerCase();
  if (settingExts(settings, "video_types").includes(ext)) return 2;
  if (settingExts(settings, "audio_types").includes(ext)) return 3;
  if (settingExts(settings, "text_types").includes(ext)) return 4;
  if (settingExts(settings, "image_types").includes(ext)) return 5;
  return 0;
}

function settingExts(settings, key) {
  const fallback = (DEFAULT_SETTINGS.find((s) => s.key === key) || {}).value || "";
  return String(settings[key] ?? fallback)
    .split(/[\s,]+/)
    .map((ext) => ext.trim().replace(/^\./, "").toLowerCase())
    .filter(Boolean);
}

function timingSafeEqual(a, b) {
  a = String(a);
  b = String(b);
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;" }[c]));
}

function escapeAttr(value) {
  return escapeHtml(value).replace(/'/g, "&#39;");
}

function escapeCss(value) {
  return String(value).replace(/[^#a-zA-Z0-9(),.%\s-]/g, "");
}

function markdownish(value) {
  return escapeHtml(value).replace(/\n/g, "<br>");
}
