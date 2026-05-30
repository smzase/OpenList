# OpenList Cloudflare Pages 版

这是一个独立的 Cloudflare Pages 轻量版实现，位于 `cloudflare-pages/` 目录。

它不运行原 Go 服务，不使用 Docker，也不在 Cloudflare 上存放用户文件。当前版本只用于挂载 OneDrive / SharePoint，提供公开目录浏览，并在用户下载文件时返回 OneDrive 的临时直链 `302` 跳转。

## 功能

- 支持 OneDrive / SharePoint 挂载。
- 支持公开访问，未登录用户使用内置 `guest` 用户。
- 支持设置 `guest` 的 `base_path`，限制公开用户只能访问指定目录。
- 支持内置官方 OpenList 前端和管理员登录。
- 支持用户、设置、存储、元信息、轻量索引管理接口。
- 支持自定义站点标题、Logo、favicon、主色、头部内容和页面内容。
- 支持元信息：README、Header、密码、隐藏规则、读写用户字段。
- 支持直链有效期设置。
- 支持 D1 轻量搜索索引。
- 下载文件时返回 OneDrive 临时下载链接的 `302` 跳转。

## 不支持

- 不支持上传、删除、重命名、移动、复制文件。
- 不支持在 Cloudflare R2 中存放文件。
- 不支持离线下载。
- 不支持 WebDAV、FTP、SFTP。
- 不支持本地存储。
- 不支持 S3 服务端模式。
- 不支持 Bleve、Meilisearch 等完整搜索引擎。
- 当前只实现 OneDrive 驱动，其他网盘需要后续单独适配。
- 官方前端中可能仍会显示上传、离线下载等入口；这些入口在 Pages 版后端不会生效。

## 目录说明

```text
cloudflare-pages/
  dist/
    index.html
    _routes.json
  functions/
    [[path]].js
  schema.sql
  wrangler.toml.example
```

- `dist/index.html`：Cloudflare Pages 静态入口。部署时会下载官方 OpenList 前端并写入这里。
- `dist/_routes.json`：只让 `/api/*`、`/d/*` 等后端路由进入 Pages Functions，前端静态文件由 Pages 直接服务。
- `dist/_redirects`：让前端路由刷新时回到 `index.html`。
- `functions/[[path]].js`：Pages Functions 后端逻辑。
- `schema.sql`：D1 数据库表结构。
- `wrangler.toml.example`：绑定名参考文件；网页部署时不需要本地使用。

## Cloudflare Pages 部署

只需要使用 Cloudflare 网页控制台部署，不需要本地部署。

1. 打开 `https://dash.cloudflare.com/workers-and-pages`。
2. 点击“创建应用程序”。
3. 在“想要部署 Pages？”中点击“开始使用”。
4. 连接当前 Git 仓库。
5. 设置 Pages 构建参数：
   - Root directory：`cloudflare-pages`
   - Build command：留空
   - Build output directory：`dist`
6. 在 Cloudflare 控制台创建一个 D1 数据库。
7. 在 Pages 项目中绑定 D1 数据库，绑定名必须为：
   - `OPENLIST_DB`
8. 打开 D1 控制台，执行 `cloudflare-pages/schema.sql` 中的 SQL。
9. 在 Pages 项目中设置环境变量：
   - `OPENLIST_ADMIN_USERNAME`：初始管理员用户名，例如 `admin`
   - `OPENLIST_ADMIN_PASSWORD`：初始管理员密码
   - `OPENLIST_JWT_SECRET`：用于签名下载链接的长随机字符串
   - `OPENLIST_WEB_CDN`：可选，OpenList 前端 CDN 地址；通常可以留空，因为官方前端已经内置在 `dist` 中
10. 部署 Pages 项目。

如果构建日志出现 `Output directory "cloudflare-pages/dist" not found`，通常是下面两种原因之一：

- Cloudflare 部署的提交还没有包含本仓库的 `cloudflare-pages/` 目录。请先把当前改动提交并推送到 GitHub，再重新部署。
- Pages 设置里 Root directory 和 Build output directory 填错了。推荐配置是 Root directory 填 `cloudflare-pages`，Build output directory 只填 `dist`，不要填 `cloudflare-pages/dist`。

如果日志里显示的提交哈希仍是旧提交，说明 Cloudflare Pages 还没有拉到包含 Pages 版代码的新提交。

## 首次使用

1. 访问你的 Pages 域名。
2. 使用 `OPENLIST_ADMIN_USERNAME` 和 `OPENLIST_ADMIN_PASSWORD` 登录管理端。
3. 添加 OneDrive 存储。
4. 如果只想公开指定目录，编辑 `guest` 用户，将 `base_path` 设置为对应挂载路径，例如 `/public`。
5. 根据需要配置元信息、直链有效期、自定义头部和自定义内容。
6. 如需搜索，进入索引管理构建 D1 轻量索引。

默认不需要配置 `OPENLIST_WEB_CDN`。官方前端已经直接放在 `cloudflare-pages/dist` 中，Cloudflare Pages 部署时不需要联网下载前端。

`cloudflare-pages/build-frontend.mjs` 只用于以后手动更新官方前端版本，部署时可以不用执行。

## OneDrive 存储配置

添加 OneDrive 存储时，常用字段如下：

- `mount_path`：挂载路径，例如 `/drive`
- `root_folder_path`：OneDrive 根目录路径，例如 `/`
- `region`：区域，通常使用 `global`
- `client_id`：Microsoft 应用 Client ID
- `client_secret`：Microsoft 应用 Client Secret
- `redirect_uri`：OAuth 回调地址
- `refresh_token`：OneDrive refresh token
- `site_id`：SharePoint 站点 ID，可选
- `custom_host`：自定义下载链接 host，可选

## 公开访问与 guest

未登录访问会使用内置 `guest` 用户。

- `guest.base_path = /`：公开用户可以从根路径开始浏览。
- `guest.base_path = /public`：公开用户只能从 `/public` 开始浏览。
- 禁用 `guest` 后，公开访问会返回需要登录。

## 元信息

元信息会影响文件列表和文件详情：

- `readme`：目录 README 内容。
- `header`：目录顶部内容。
- `password`：访问密码。
- `hide`：隐藏规则，每行一个 JavaScript 正则表达式。
- `read_users` / `write_users`：保留与 OpenList 前端兼容。

## 直链有效期

通过设置项 `link_expiration` 控制下载链接有效期。

- `0`：不过期。
- 大于 `0`：单位为秒，超时后 `/d/*` 下载链接会失效。

下载时 Pages Functions 会向 Microsoft Graph 获取 OneDrive 的临时下载链接，然后返回 `302 Location`，不会代理文件内容。

## 索引说明

Pages 版索引使用 D1 的 `search_nodes` 表实现，适合中小目录。

超大网盘受 Cloudflare Pages Functions 执行时间限制，可能需要多次点击构建或更新索引。该索引不是原 Go 版本的 Bleve / Meilisearch 全文索引。

## 许可证

本项目沿用原项目许可证，详见 [LICENSE](./LICENSE)。
