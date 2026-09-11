# 雾中书桌 - 个人博客

一个混合型个人博客：随笔、小说草稿、技术笔记、AI 绘图和读书摘录。站点采用 Cloudflare Pages Functions 服务端渲染（SSR）+ Cloudflare D1 持久化：所有公开页面由服务端模板渲染，后台的外观、首页气泡、书单、书评与文章全部写入 D1，不依赖浏览器 localStorage。

## 结构

```
blog/
├── functions/              # Pages Functions：SSR 页面渲染 + 后台 API
│   ├── [[path]].js         # 路由入口（公开页 SSR、/api/admin/* 接口）
│   └── _lib/
│       ├── templates.mjs   # 所有公开页面的 SSR 模板
│       ├── site-data.mjs   # D1 读取、站点数据合并与默认值
│       ├── markdown.mjs    # Markdown 渲染
│       ├── auth.mjs        # 后台会话认证
│       └── http.mjs        # 响应辅助
├── admin/                  # 隐藏管理后台，通过 /admin/ 访问（前台导航不显示）
├── content/
│   ├── posts/              # Markdown 文章源（构建时生成 data/posts.json）
│   ├── uploads/            # 上传的图片与 AI 绘图
│   └── data/
│       └── site-data.json  # 仓库级默认配置参考快照
├── migrations/             # D1 初始表结构
├── scripts/                # 构建与 Cloudflare 资源准备脚本
└── .github/workflows/      # 自动部署工作流
```

## 数据与保存方式

- 所有站点配置（外观、个人资料、音乐、首页气泡、书单、书评）保存在 D1 `settings` 表；后台发布的文章与草稿保存在 D1 `articles` 表；评论与上传元数据分别使用 `comments`、`uploads` 表。
- 全局背景支持多图片轮播。后台可以逐行填写图片链接，并分别设置轮播间隔、涟漪过渡时长和涟漪强度；单张背景保留为加载失败时的后备。
- 公开页面由 Functions 从 D1 读取数据后由 `functions/_lib/templates.mjs` 服务端渲染，不注入任何 `site-data-json`，也不向 localStorage 写入覆盖值。
- 后台所有写操作都通过 `/api/admin/*` 接口落到 D1；附件与上传图片走 R2 存储桶（绑定名 `BLOG_ATTACHMENTS`）。

D1 中没有对应配置时，使用 `functions/_lib/site-data.mjs` 里 `DEFAULTS` 定义的内置默认值；`content/data/site-data.json` 只是这份默认值的参考快照，不参与运行时读取。

## 关键绑定与环境变量

- D1 绑定：`BLOG_COMMENTS_DB`
- R2 绑定：`BLOG_ATTACHMENTS`
- GitHub Secrets：`CLOUDFLARE_API_TOKEN`、`CLOUDFLARE_ACCOUNT_ID`
- Pages 环境变量：`ADMIN_USERNAME`、`ADMIN_PASSWORD`、`ADMIN_SESSION_SECRET`

## 写文章

仓库文章放在 `content/posts/` 下，frontmatter 格式参考 `content/posts/_template.md`：

```yaml
---
title: 文章标题
category: essays
date: 2026-09-05
summary: 分类页显示的摘要
tags:
  - 随笔
draft: false
---
```

`category` 支持 `essays`（随笔）、`fiction`（小说）、`tech`（技术）。`draft: true` 的文章不会进入构建产物。构建时这些 Markdown 会生成 `data/posts.json`，由 SSR 在公开页读取并合并；后台发布的文章则直接写入 D1 `articles` 表。

图片放到 `content/uploads/` 对应目录。AI 绘图页可以在后台维护画廊分组，或使用仓库级默认分组（定义在 `functions/_lib/site-data.mjs` 的 `DEFAULTS.galleryBoards`）。

## 本地预览

```powershell
npm install
npm run build
npx wrangler pages dev dist
```

公开页面由 `functions/` 服务端渲染；本地没有 D1 绑定时会回退到内置默认值，后台写入接口则需要配置 `wrangler.toml` 的 D1 绑定后才能持久化。

## 首次部署

1. 在 Cloudflare 创建 API Token，权限至少包含 Account 下的 D1 编辑、R2 编辑、Workers Scripts 编辑、Pages 编辑。
2. 在 GitHub 仓库的 Settings -> Secrets and variables -> Actions 中添加：
   - `CLOUDFLARE_API_TOKEN`
   - `CLOUDFLARE_ACCOUNT_ID`
3. 把这个仓库推送到 GitHub 的 `main` 分支。
4. Actions 会执行 `prepare-cloudflare.mjs`，自动创建 D1 数据库 `blog-comments-db` 与 R2 存储桶 `blog-attachments`、执行 `migrations/0001_init.sql`，然后构建并部署到 Cloudflare Pages。
5. 部署成功后，在 Cloudflare Pages 项目设置里配置环境变量 `ADMIN_USERNAME`、`ADMIN_PASSWORD`、`ADMIN_SESSION_SECRET`，再绑定自定义域名。之后每次推送都会自动更新线上站点。

页面项目名默认取 GitHub 仓库名（只保留小写字母、数字和连字符）。如果 Cloudflare 上的项目名不同，在 Secrets 中额外添加 `CLOUDFLARE_PAGES_PROJECT`。

## 本地手动部署

```powershell
$env:CLOUDFLARE_API_TOKEN = "<你的 API Token>"
$env:CLOUDFLARE_ACCOUNT_ID = "<你的 Account ID>"
$env:CLOUDFLARE_PAGES_PROJECT = "blog"
npm run deploy
```

## 管理后台

后台位于 `/admin/`，可以管理外观、首页气泡、文章草稿和读书数据。所有修改都会通过 `/api/admin/*` 接口写入 Cloudflare D1 `settings` 与 `articles` 表；评论与附件接口使用 D1 与 R2 绑定，不退回浏览器本地存储。
