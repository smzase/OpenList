const ROLE_GENERAL = 0;
const ROLE_GUEST = 1;
const ROLE_ADMIN = 2;

const FLAG_PUBLIC = 0;
const FLAG_PRIVATE = 1;
const FLAG_READONLY = 2;

const STATIC_HASH_SALT = "https://github.com/alist-org/alist";
const WORK_STATUS = "work";

const DEFAULT_WEB_CDN = "https://res.oplist.org";

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
  item("privacy_regs", "(?:(?:\\d|[1-9]\\d|1\\d\\d|2[0-4]\\d|25[0-5])\\.){3}(?:\\d|[1-9]\\d|1\\d\\d|2[0-4]\\d|25[0-5])", "text", GROUPS.GLOBAL, FLAG_PRIVATE),
  item("ocr_api", "https://openlistteam-ocr-api-server.hf.space/ocr/file/json", "string", GROUPS.GLOBAL),
  item("filename_char_mapping", "{\"/\":\"|\"}", "text", GROUPS.GLOBAL),
  item("forward_direct_link_params", "false", "bool", GROUPS.GLOBAL),
  item("ignore_direct_link_params", "sign,openlist_ts,raw", "string", GROUPS.GLOBAL),
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
    driverItem("cache_expiration", "number", "30", "", true, "The cache expiration time for this storage"),
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
    driverItem("use_online_api", "bool", "false"),
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
    if (!env.OPENLIST_DB) {
      return text("OPENLIST_DB D1 binding is missing", 500);
    }
    await ensureInitialized(env);
    const url = new URL(request.url);
    const path = normalizePath(url.pathname);

    if (path === "/ping") return text("pong");
    if (path === "/manifest.json") return manifest(env, request);
    if (path.startsWith("/api/")) return apiRouter(request, env, path);
    if (path === "/robots.txt") return robots(env);
    if (path === "/favicon.ico") return favicon(env);
    if (path.startsWith("/d/")) return downloadRouter(request, env, path);

    return frontend(request, env);
  } catch (error) {
    return jsonError(error, 500, true);
  }
}

async function apiRouter(request, env, path) {
  if (path === "/api/public/settings") return publicSettings(env);
  if (path === "/api/public/offline_download_tools") return ok([]);
  if (path === "/api/public/archive_extensions") return ok([]);
  if (path === "/api/auth/login" || path === "/api/auth/login/hash") return login(request, env, path.endsWith("/hash"));
  if (path === "/api/auth/logout") return logout(request, env);
  if (path === "/api/me") return currentUser(request, env);
  if (path === "/api/fs/list") return fsList(request, env);
  if (path === "/api/fs/get") return fsGet(request, env);
  if (path === "/api/fs/dirs") return fsDirs(request, env);
  if (path === "/api/fs/search") return fsSearch(request, env);
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
  if (path.startsWith("/api/admin/storage/")) return requireAdmin(request, env, () => adminStorage(request, env, path));
  if (path.startsWith("/api/admin/meta/")) return requireAdmin(request, env, () => adminMeta(request, env, path));
  if (path.startsWith("/api/admin/index/")) return requireAdmin(request, env, () => adminIndex(request, env, path));
  return apiError("api not found", 404);
}

async function ensureInitialized(env) {
  const db = env.OPENLIST_DB;
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
  return ok({ token });
}

async function logout(request, env) {
  const token = bearerToken(request);
  if (token) await env.OPENLIST_DB.prepare("DELETE FROM sessions WHERE token = ?").bind(token).run();
  return ok();
}

async function currentUser(request, env) {
  const user = await getRequestUser(request, env, false);
  if (!user) return apiError("Guest user is disabled, login please", 401);
  return ok(safeUser(user));
}

async function getRequestUser(request, env, allowDisabledGuest) {
  const token = bearerToken(request);
  if (token) {
    const row = await env.OPENLIST_DB.prepare(
      "SELECT users.* FROM sessions JOIN users ON users.id = sessions.user_id WHERE sessions.token = ? AND sessions.expires_at > ? LIMIT 1"
    ).bind(token, nowSeconds()).first();
    if (row && !row.disabled) return row;
  }
  const guest = await env.OPENLIST_DB.prepare("SELECT * FROM users WHERE role = ? LIMIT 1").bind(ROLE_GUEST).first();
  if (!guest) return null;
  if (guest.disabled && !allowDisabledGuest) return null;
  return guest;
}

async function requireAdmin(request, env, handler) {
  const user = await getRequestUser(request, env, true);
  if (!user || user.role !== ROLE_ADMIN || user.disabled) return apiError("permission denied", 403);
  return handler(user);
}

async function adminUser(request, env, path, admin) {
  const db = env.OPENLIST_DB;
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
    return ok();
  }
  if (path.endsWith("/delete")) {
    const id = intParam(request, "id");
    const user = await db.prepare("SELECT * FROM users WHERE id = ?").bind(id).first();
    if (!user) return apiError("user not found", 404);
    if (user.role === ROLE_ADMIN || user.role === ROLE_GUEST) return apiError("admin or guest user can not be deleted", 400);
    await db.prepare("DELETE FROM users WHERE id = ?").bind(id).run();
    await db.prepare("DELETE FROM sessions WHERE user_id = ?").bind(id).run();
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
    return ok(rows.results.map(settingFromRow));
  }
  if (path.endsWith("/get")) {
    const url = new URL(request.url);
    const key = url.searchParams.get("key");
    const keys = (url.searchParams.get("keys") || "").split(",").filter(Boolean);
    if (key) {
      const row = await db.prepare("SELECT * FROM settings WHERE key = ?").bind(key).first();
      if (!row) return apiError("setting not found", 404);
      return ok(settingFromRow(row));
    }
    if (keys.length === 0) return ok([]);
    const placeholders = keys.map(() => "?").join(",");
    const rows = await db.prepare(`SELECT * FROM settings WHERE key IN (${placeholders}) ORDER BY item_index`).bind(...keys).all();
    return ok(rows.results.map(settingFromRow));
  }
  if (path.endsWith("/save")) {
    const body = await readBody(request);
    const items = Array.isArray(body) ? body : [];
    for (const s of items) {
      await db.prepare("INSERT INTO settings (key, value, help, type, options, group_id, flag, item_index) VALUES (?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, help = excluded.help, type = excluded.type, options = excluded.options, group_id = excluded.group_id, flag = excluded.flag, item_index = excluded.item_index")
        .bind(String(s.key), String(s.value ?? ""), String(s.help ?? ""), String(s.type || "string"), String(s.options || ""), Number(s.group ?? s.group_id ?? 0), Number(s.flag ?? 0), Number(s.index ?? s.item_index ?? 0))
        .run();
    }
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
  return apiError("api not found", 404);
}

async function adminStorage(request, env, path) {
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
    return ok({ id });
  }
  if (path.endsWith("/update")) {
    const body = normalizeStorageInput(await readBody(request));
    if (!body.id) return apiError("id is required", 400);
    await db.prepare("UPDATE storages SET mount_path = ?, storage_order = ?, cache_expiration = ?, custom_cache_policies = ?, addition = ?, remark = ?, disabled = ?, disable_index = ?, enable_sign = ?, order_by = ?, order_direction = ?, extract_folder = ?, web_proxy = ?, webdav_policy = ?, proxy_range = ?, down_proxy_url = ?, disable_proxy_sign = ?, modified = CURRENT_TIMESTAMP WHERE id = ?")
      .bind(body.mount_path, body.order, body.cache_expiration, body.custom_cache_policies, body.addition, body.remark, body.disabled, body.disable_index, body.enable_sign, body.order_by, body.order_direction, body.extract_folder, body.web_proxy, body.webdav_policy, body.proxy_range, body.down_proxy_url, body.disable_proxy_sign, body.id)
      .run();
    await saveOneDriveToken(env, body.id, parseJson(body.addition));
    await clearCachePrefix(env, "fs:");
    return ok();
  }
  if (path.endsWith("/delete")) {
    const id = intParam(request, "id");
    await db.prepare("DELETE FROM storages WHERE id = ?").bind(id).run();
    await db.prepare("DELETE FROM onedrive_tokens WHERE storage_id = ?").bind(id).run();
    await db.prepare("DELETE FROM search_nodes WHERE storage_id = ?").bind(id).run();
    return ok();
  }
  if (path.endsWith("/enable") || path.endsWith("/disable")) {
    const disabled = path.endsWith("/disable") ? 1 : 0;
    await db.prepare("UPDATE storages SET disabled = ?, modified = CURRENT_TIMESTAMP WHERE id = ?").bind(disabled, intParam(request, "id")).run();
    await clearCachePrefix(env, "fs:");
    return ok();
  }
  if (path.endsWith("/load_all")) return ok();
  return apiError("api not found", 404);
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
    return ok();
  }
  if (path.endsWith("/delete")) {
    await db.prepare("DELETE FROM metas WHERE id = ?").bind(intParam(request, "id")).run();
    return ok();
  }
  return apiError("api not found", 404);
}

async function adminIndex(request, env, path) {
  if (path.endsWith("/progress")) {
    const value = await getSetting(env, "index_progress", "{}");
    return ok(parseJson(value, {}));
  }
  if (path.endsWith("/clear")) {
    await env.OPENLIST_DB.prepare("DELETE FROM search_nodes").run();
    await setSetting(env, "index_progress", JSON.stringify({ status: "cleared", indexed: 0, updated_at: new Date().toISOString() }));
    return ok();
  }
  if (path.endsWith("/stop")) {
    await setSetting(env, "index_progress", JSON.stringify({ status: "stopped", updated_at: new Date().toISOString() }));
    return ok();
  }
  if (path.endsWith("/build") || path.endsWith("/update")) {
    const result = await buildIndex(env);
    return ok(result);
  }
  return apiError("api not found", 404);
}

async function fsList(request, env) {
  const user = await getRequestUser(request, env, false);
  if (!user) return apiError("Guest user is disabled, login please", 401);
  const body = await readBody(request);
  const reqPath = joinBasePath(user.base_path, body.path || new URL(request.url).searchParams.get("path") || "/");
  const password = String(body.password || "");
  const meta = await nearestMeta(env, reqPath);
  if (!(await canAccess(user, meta, reqPath, password))) return apiError("password is incorrect or you have no permission", 403);
  const listing = await listPath(env, reqPath);
  const filtered = applyMetaHide(listing.content, meta, reqPath);
  const sorted = sortObjects(filtered, listing.storage);
  const page = pageReq(body, request);
  const sliced = sorted.slice(page.offset, page.offset + page.per_page);
  return ok({
    content: await Promise.all(sliced.map((obj) => objResp(env, obj, reqPath, listing.storage))),
    total: sorted.length,
    readme: metaText(meta, reqPath, "readme", "r_sub"),
    header: metaText(meta, reqPath, "header", "header_sub"),
    write: false,
    write_content_bypass: false,
    provider: listing.storage ? "Onedrive" : "unknown",
    direct_upload_tools: [],
  });
}

async function fsGet(request, env) {
  const user = await getRequestUser(request, env, false);
  if (!user) return apiError("Guest user is disabled, login please", 401);
  const body = await readBody(request);
  const reqPath = joinBasePath(user.base_path, body.path || new URL(request.url).searchParams.get("path") || "/");
  const password = String(body.password || "");
  const meta = await nearestMeta(env, reqPath);
  if (!(await canAccess(user, meta, reqPath, password))) return apiError("password is incorrect or you have no permission", 403);
  const found = await getObjAtPath(env, reqPath);
  if (!found.obj) return apiError("object not found", 404);
  const parent = dirname(reqPath);
  const rawUrl = found.obj.is_dir ? "" : await signedDownloadUrl(env, reqPath, found.storage);
  const relatedList = found.obj.is_dir ? [] : (await listPath(env, parent).catch(() => ({ content: [] }))).content
    .filter((obj) => !obj.is_dir && obj.name !== found.obj.name && obj.name.startsWith(found.obj.name.replace(/\.[^.]+$/, "")))
    .slice(0, 20);
  return ok({
    ...(await objResp(env, found.obj, parent, found.storage)),
    raw_url: rawUrl,
    readme: metaText(meta, reqPath, "readme", "r_sub"),
    header: metaText(meta, reqPath, "header", "header_sub"),
    provider: "Onedrive",
    related: await Promise.all(relatedList.map((obj) => objResp(env, obj, parent, found.storage))),
  });
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
  const total = await env.OPENLIST_DB.prepare("SELECT COUNT(*) AS count FROM search_nodes WHERE name LIKE ? ESCAPE '\\' AND parent LIKE ?")
    .bind(like, `${parent === "/" ? "" : parent}%`)
    .first();
  const rows = await env.OPENLIST_DB.prepare("SELECT * FROM search_nodes WHERE name LIKE ? ESCAPE '\\' AND parent LIKE ? ORDER BY parent, name LIMIT ? OFFSET ?")
    .bind(like, `${parent === "/" ? "" : parent}%`, page.per_page, page.offset)
    .all();
  const content = [];
  for (const row of rows.results) {
    const full = joinPath(row.parent, row.name);
    const meta = await nearestMeta(env, full);
    if (await canAccess(user, meta, full, String(body.password || ""))) {
      content.push({
        parent: row.parent,
        name: row.name,
        is_dir: !!row.is_dir,
        size: row.size,
        modified: row.modified,
        type: objType(row.name, !!row.is_dir),
      });
    }
  }
  return ok({ content, total: total.count || content.length });
}

async function downloadRouter(request, env, path) {
  const reqPath = normalizePath(decodeURIComponent(path.slice(2)) || "/");
  const found = await getObjAtPath(env, reqPath);
  if (!found.obj || found.obj.is_dir) return text("not found", 404);
  const url = new URL(request.url);
  const sign = url.searchParams.get("sign") || "";
  const ts = Number(url.searchParams.get("openlist_ts") || "0");
  const mustSign = boolSetting(await getSetting(env, "sign_all", "true")) || truthy(found.storage.enable_sign);
  if (mustSign) {
    if (!sign || !(await verifyPathSign(env, reqPath, ts, sign))) return text("invalid sign", 403);
    const expiration = Number(await getSetting(env, "link_expiration", "0"));
    if (expiration > 0 && (!ts || nowSeconds() - ts > expiration)) return text("link expired", 403);
  }
  const downloadUrl = await oneDriveDownloadUrl(env, found.storage, reqPath);
  return Response.redirect(downloadUrl, 302);
}

async function listPath(env, reqPath) {
  const virtual = await virtualListing(env, reqPath);
  const storage = await matchedStorage(env, reqPath);
  if (!storage) return { content: virtual, storage: null };
  if (samePath(reqPath, storage.mount_path) && virtual.length > 0) {
    return { content: virtual, storage };
  }
  const cacheKey = `fs:list:${storage.id}:${reqPath}`;
  const cached = await getCache(env, cacheKey);
  if (cached) return { content: cached, storage };
  const items = await oneDriveList(env, storage, reqPath);
  const content = [...items, ...virtual.filter((v) => !items.some((i) => i.name === v.name))];
  if (Number(storage.cache_expiration) > 0) await setCache(env, cacheKey, content, Number(storage.cache_expiration));
  return { content, storage };
}

async function virtualListing(env, reqPath) {
  const rows = await env.OPENLIST_DB.prepare("SELECT * FROM storages WHERE disabled = 0 ORDER BY storage_order, mount_path").all();
  const names = new Map();
  const prefix = addSlash(reqPath);
  for (const row of rows.results) {
    const storage = storageFromRow(row);
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
  return { storage, obj: await oneDriveGet(env, storage, reqPath) };
}

async function matchedStorage(env, reqPath) {
  const rows = await env.OPENLIST_DB.prepare("SELECT * FROM storages WHERE disabled = 0 ORDER BY LENGTH(mount_path) DESC").all();
  for (const row of rows.results) {
    const storage = storageFromRow(row);
    if (samePath(reqPath, storage.mount_path) || reqPath.startsWith(addSlash(storage.mount_path))) return storage;
  }
  return null;
}

async function oneDriveList(env, storage, reqPath) {
  const api = await oneDriveApi(env, storage);
  const url = `${api.childrenUrl(reqPath)}?$top=200`;
  const values = [];
  let next = url;
  while (next) {
    const data = await graphJson(api.accessToken, next);
    values.push(...(data.value || []).map((item) => oneDriveObj(item)));
    next = data["@odata.nextLink"] || "";
  }
  return values;
}

async function oneDriveGet(env, storage, reqPath) {
  const api = await oneDriveApi(env, storage);
  const data = await graphJson(api.accessToken, api.itemUrl(reqPath));
  return oneDriveObj(data);
}

async function oneDriveDownloadUrl(env, storage, reqPath) {
  const api = await oneDriveApi(env, storage);
  const data = await graphJson(api.accessToken, api.itemUrl(reqPath));
  let downloadUrl = data["@microsoft.graph.downloadUrl"];
  if (!downloadUrl) throw new Error("OneDrive download URL not found");
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

async function oneDriveApi(env, storage) {
  const addition = parseJson(storage.addition);
  const token = await getOneDriveAccessToken(env, storage, addition);
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

async function getOneDriveAccessToken(env, storage, addition) {
  const row = await env.OPENLIST_DB.prepare("SELECT * FROM onedrive_tokens WHERE storage_id = ?").bind(storage.id).first();
  if (row && row.access_token && Number(row.expires_at) > nowSeconds() + 120) return row.access_token;
  const refreshToken = (row && row.refresh_token) || addition.refresh_token;
  if (!refreshToken) throw new Error("OneDrive refresh_token is required");
  const clientId = addition.client_id || env.ONEDRIVE_CLIENT_ID;
  const clientSecret = addition.client_secret || env.ONEDRIVE_CLIENT_SECRET;
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
  return data.access_token;
}

async function graphJson(accessToken, url) {
  const resp = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) {
    const message = data.error && (data.error.message || data.error.code);
    throw new Error(message || `Microsoft Graph request failed: ${resp.status}`);
  }
  return data;
}

async function buildIndex(env) {
  await setSetting(env, "index_progress", JSON.stringify({ status: "running", indexed: 0, updated_at: new Date().toISOString() }));
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
        indexed,
        current: cur.path,
        updated_at: new Date().toISOString(),
      }));
    }
  }
  const progress = {
    status: indexed >= maxNodes ? "partial" : "done",
    indexed,
    limit: maxNodes,
    updated_at: new Date().toISOString(),
  };
  await setSetting(env, "index_progress", JSON.stringify(progress));
  return progress;
}

async function frontend(request, env) {
  const settings = await settingsMap(env, true);
  const cdn = (env.OPENLIST_WEB_CDN || "").replace(/\/$/, "");
  if (cdn) {
    const resp = await fetch(`${cdn}/index.html`, { headers: { Accept: "text/html" } }).catch(() => null);
    if (resp && resp.ok) {
      const html = await resp.text();
      return htmlResponse(injectHtml(html, settings, cdn));
    }
  }
  const title = settings.site_title || "OpenList";
  const fallback = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
<link rel="icon" href="${escapeAttr(settings.favicon || "https://res.oplist.org/logo/logo.svg")}">
<style>
:root{color-scheme:light dark;font-family:Inter,ui-sans-serif,system-ui,sans-serif}
body{margin:0;background:#f7f8fa;color:#1f2937}
main{width:min(980px,calc(100vw - 32px));margin:40px auto}
.bar{display:flex;align-items:center;gap:12px;margin-bottom:20px}
.logo{width:36px;height:36px}
.card{border:1px solid #d8dee8;border-radius:8px;background:#fff;padding:18px;margin:12px 0}
a{color:${escapeCss(settings.main_color || "#1890ff")}}
button{border:1px solid #cbd5e1;background:#fff;border-radius:6px;padding:8px 10px;cursor:pointer}
input{border:1px solid #cbd5e1;border-radius:6px;padding:8px;width:min(420px,100%)}
@media(prefers-color-scheme:dark){body{background:#111827;color:#e5e7eb}.card{background:#18212f;border-color:#334155}button,input{background:#111827;color:#e5e7eb;border-color:#334155}}
</style>
${settings.customize_head || ""}
</head>
<body>
<main>
<div class="bar"><img class="logo" src="${escapeAttr((settings.logo || "").split("\\n")[0] || "https://res.oplist.org/logo/logo.svg")}" alt=""><h1>${escapeHtml(title)}</h1></div>
<div class="card">${markdownish(settings.announcement || "")}</div>
<div class="card">
<h2>Files</h2>
<p><input id="path" value="/" aria-label="path"> <button id="go">Open</button></p>
<div id="files">Loading...</div>
</div>
</main>
${settings.customize_body || ""}
<script>
async function api(path, body) {
  const res = await fetch(path, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body || {}) });
  const json = await res.json();
  if (json.code !== 200) throw new Error(json.message);
  return json.data;
}
async function load() {
  const p = document.getElementById("path").value || "/";
  const box = document.getElementById("files");
  box.textContent = "Loading...";
  try {
    const data = await api("/api/fs/list", { path: p, page: 1, per_page: 200 });
    box.innerHTML = data.content.map(function (item) {
      const child = (p.replace(/\\/$/, "") + "/" + item.name).replace(/\\/+/g, "/");
      return '<p>' + (item.is_dir ? 'DIR ' : 'FILE ') + '<a href="' + (item.is_dir ? '#" data-path="' + child : item.raw_url || "/d" + child + "?sign=" + encodeURIComponent(item.sign || "") + "&openlist_ts=" + Math.floor(Date.now()/1000)) + '">' + item.name.replace(/[&<>"]/g, function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;","\\"":"&quot;"}[c]}) + '</a></p>';
    }).join("") || "Empty";
    box.querySelectorAll("a[data-path]").forEach(function (a) { a.onclick = function () { document.getElementById("path").value = a.dataset.path; load(); return false; }; });
  } catch (e) {
    box.textContent = e.message;
  }
}
document.getElementById("go").onclick = load;
load();
</script>
</body>
</html>`;
  return htmlResponse(fallback);
}

function injectHtml(html, settings, cdn) {
  const manifestPath = "/manifest.json";
  let out = html
    .replace("cdn: undefined", `cdn: '${cdn}'`)
    .replace("base_path: undefined", "base_path: '/'")
    .replace("main_color: undefined", `main_color: '${settings.main_color || "#1890ff"}'`)
    .replace('href="/manifest.json"', `href="${manifestPath}"`)
    .replace("Loading...", escapeHtml(settings.site_title || "OpenList"))
    .replace("https://res.oplist.org/logo/logo.svg", settings.favicon || "https://res.oplist.org/logo/logo.svg")
    .replace("https://res.oplist.org/logo/logo.png", (settings.logo || "").split("\n")[0] || "https://res.oplist.org/logo/logo.svg");
  out = out.replace("</head>", `${settings.customize_head || ""}</head>`);
  out = out.replace("</body>", `${settings.customize_body || ""}</body>`);
  return out;
}

async function publicSettings(env) {
  const rows = await env.OPENLIST_DB.prepare("SELECT * FROM settings WHERE flag != ? ORDER BY item_index").bind(FLAG_PRIVATE).all();
  const data = {};
  for (const row of rows.results) data[row.key] = row.value;
  return ok(data);
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
  const sign = await pathSign(env, reqPath, ts);
  return `/d${encodeURI(reqPath)}?sign=${encodeURIComponent(sign)}&openlist_ts=${ts}`;
}

async function objResp(env, obj, parent, storage) {
  const reqPath = joinPath(parent, obj.name);
  const sign = obj.is_dir ? "" : await pathSign(env, reqPath, nowSeconds());
  return {
    name: obj.name,
    size: obj.size || 0,
    is_dir: !!obj.is_dir,
    modified: obj.modified || new Date().toISOString(),
    created: obj.created || obj.modified || new Date().toISOString(),
    sign,
    thumb: obj.thumb || "",
    type: objType(obj.name, !!obj.is_dir),
    hashinfo: "",
    hash_info: {},
    raw_url: obj.is_dir ? "" : `/d${encodeURI(reqPath)}?sign=${encodeURIComponent(sign)}&openlist_ts=${nowSeconds()}`,
  };
}

function oneDriveObj(item) {
  const info = item.fileSystemInfo || {};
  return {
    id: item.id || "",
    name: item.name || "",
    size: Number(item.size || 0),
    is_dir: !!item.folder || !item.file,
    modified: info.lastModifiedDateTime || item.lastModifiedDateTime || new Date().toISOString(),
    created: info.createdDateTime || item.createdDateTime || "",
    thumb: item.thumbnails && item.thumbnails[0] && item.thumbnails[0].medium ? item.thumbnails[0].medium.url : "",
  };
}

function oneDrivePath(storage, addition, reqPath) {
  const relative = stripPrefix(reqPath, storage.mount_path);
  return normalizePath(joinPath(addition.root_folder_path || "/", relative));
}

function graphBaseUrl(region) {
  if (region === "cn") return "https://microsoftgraph.chinacloudapi.cn/v1.0";
  return "https://graph.microsoft.com/v1.0";
}

function oauthBaseUrl(region, tenant) {
  if (region === "cn") return `https://login.partner.microsoftonline.cn/${tenant}/oauth2/v2.0/token`;
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
}

async function nearestMeta(env, reqPath) {
  const rows = await env.OPENLIST_DB.prepare("SELECT * FROM metas ORDER BY LENGTH(path) DESC").all();
  for (const row of rows.results) {
    const meta = metaFromRow(row);
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

function safeUser(user) {
  return {
    id: user.id,
    username: user.username,
    password: "",
    base_path: user.base_path,
    role: user.role,
    disabled: !!user.disabled,
    permission: user.permission,
    otp: !!user.otp_secret,
    sso_id: user.sso_id || "",
    allow_ldap: !!user.allow_ldap,
  };
}

async function getStorageById(env, id) {
  const row = await env.OPENLIST_DB.prepare("SELECT * FROM storages WHERE id = ?").bind(id).first();
  return row ? storageFromRow(row) : null;
}

async function settingsMap(env) {
  const rows = await env.OPENLIST_DB.prepare("SELECT key, value FROM settings").all();
  const result = {};
  for (const row of rows.results) result[row.key] = row.value;
  return result;
}

async function getSetting(env, key, fallback = "") {
  const row = await env.OPENLIST_DB.prepare("SELECT value FROM settings WHERE key = ?").bind(key).first();
  return row ? row.value : fallback;
}

async function setSetting(env, key, value) {
  const def = DEFAULT_SETTINGS.find((s) => s.key === key) || item(key, "", "string", GROUPS.SINGLE, FLAG_PRIVATE);
  await env.OPENLIST_DB.prepare("INSERT INTO settings (key, value, help, type, options, group_id, flag, item_index) VALUES (?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value")
    .bind(key, String(value), def.help, def.type, def.options, def.group, def.flag, def.index || 0)
    .run();
}

async function getCache(env, key) {
  const row = await env.OPENLIST_DB.prepare("SELECT value FROM cache WHERE key = ? AND expires_at > ?").bind(key, nowSeconds()).first();
  return row ? parseJson(row.value, null) : null;
}

async function setCache(env, key, value, seconds) {
  await env.OPENLIST_DB.prepare("INSERT INTO cache (key, value, expires_at) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, expires_at = excluded.expires_at")
    .bind(key, JSON.stringify(value), nowSeconds() + seconds)
    .run();
}

async function clearCachePrefix(env, prefix) {
  await env.OPENLIST_DB.prepare("DELETE FROM cache WHERE key LIKE ?").bind(`${prefix}%`).run();
}

async function pathSign(env, path, ts) {
  const secret = env.OPENLIST_JWT_SECRET || await getSetting(env, "token", "openlist-pages");
  return hmacHex(secret, `${normalizePath(path)}:${ts || 0}`);
}

async function verifyPathSign(env, path, ts, sign) {
  const expected = await pathSign(env, path, ts);
  return timingSafeEqual(expected, sign);
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
  return auth.toLowerCase().startsWith("bearer ") ? auth.slice(7).trim() : "";
}

function item(key, value, type, group, flag = FLAG_PUBLIC, options = "", help = "") {
  return { key, value, type, group, flag, options, help };
}

function driverItem(name, type = "string", defaultValue = "", options = "", required = false, help = "") {
  return { name, type, default: defaultValue, options, required, help };
}

function ok(data = null) {
  return json({ code: 200, message: "success", data });
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

function nowSeconds() {
  return Math.floor(Date.now() / 1000);
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

function objType(name, isDir) {
  if (isDir) return 1;
  const ext = String(name).split(".").pop().toLowerCase();
  if (["mp4", "mkv", "avi", "mov", "webm", "flv", "m3u8"].includes(ext)) return 2;
  if (["mp3", "flac", "ogg", "m4a", "wav", "opus", "wma"].includes(ext)) return 3;
  if (["txt", "md", "json", "js", "ts", "go", "sh", "yml", "html", "css"].includes(ext)) return 4;
  if (["jpg", "jpeg", "png", "gif", "bmp", "svg", "webp", "avif"].includes(ext)) return 5;
  return 0;
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
