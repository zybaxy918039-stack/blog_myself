# 雾中书桌 - 个人博客

一个混合型个人博客：随笔、小说草稿、技术笔记、AI 绘图和读书摘录。站点是纯静态页面，部署在 Cloudflare Pages，由 GitHub Actions 在每次推送时自动构建上线。

## 结构

```
blog/
├── index.html          # 首页
├── essays.html         # 随笔分类页
├── fiction.html        # 小说分类页
├── tech.html           # 技术分类页
├── ai-art.html         # AI 绘图页
├── books.html          # 读书页
├── about.html          # 关于页
├── deploy.html         # 首次部署辅助页（前台导航不显示）
├── admin/              # 隐藏管理后台，通过 /admin/ 访问
├── content/
│   ├── posts/          # Markdown 文章源
│   ├── uploads/        # 上传的图片与 AI 绘图
│   └── data/
│       └── site-data.json  # 外观、首页气泡、书单等仓库级默认配置
├── migrations/         # D1 初始表结构
├── scripts/            # 构建与 Cloudflare 资源准备脚本
└── .github/workflows/  # 自动部署工作流
```

## 写文章

在 `content/posts/` 下新建 `.md` 文件，frontmatter 格式参考 `content/posts/_template.md`：

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

`category` 支持 `essays`（随笔）、`fiction`（小说）、`tech`（技术）。`draft: true` 的文章不会进入构建产物。

图片放到 `content/uploads/` 对应目录。AI 绘图页可以维护 `content/uploads/ai-art/manifest.json`，格式如下：

```json
{
  "groups": [
    {
      "name": "晨雾系列",
      "images": [
        { "src": "content/uploads/ai-art/example.jpg", "caption": "雾中清晨" }
      ]
    }
  ]
}
```

## 本地预览

直接双击根目录的 `index.html` 即可预览（构建注入的站点数据在本地源码中不存在，页面会使用内置默认值）。

也可以完整构建后在本地服务器查看：

```powershell
npm install
npm run build
npx wrangler pages dev dist
```

## 首次部署

1. 在 Cloudflare 创建 API Token，权限至少包含 Account 下的 D1 编辑、R2 编辑、Workers Scripts 编辑、Pages 编辑。
2. 在 GitHub 仓库的 Settings -> Secrets and variables -> Actions 中添加：
   - `CLOUDFLARE_API_TOKEN`
   - `CLOUDFLARE_ACCOUNT_ID`
3. 把这个仓库推送到 GitHub 的 `main` 分支。
4. Actions 会执行 `prepare-cloudflare.mjs`，自动创建 D1 数据库 `blog-comments-db` 与 R2 存储桶 `blog-attachments`、执行 `migrations/0001_init.sql`，然后构建并部署到 Cloudflare Pages。
5. 部署成功后，在 Cloudflare Pages 项目中绑定你的自定义域名。之后每次推送都会自动更新线上站点。

页面项目名默认取 GitHub 仓库名（只保留小写字母、数字和连字符）。如果 Cloudflare 上的项目名不同，在 Secrets 中额外添加 `CLOUDFLARE_PAGES_PROJECT`。

## 本地手动部署

```powershell
$env:CLOUDFLARE_API_TOKEN = "<你的 API Token>"
$env:CLOUDFLARE_ACCOUNT_ID = "<你的 Account ID>"
$env:CLOUDFLARE_PAGES_PROJECT = "blog"
npm run deploy
```

## 管理后台

后台位于 `/admin/`，可以管理外观、首页气泡、文章草稿和读书数据。当前后台设置保存在浏览器本地，作为仓库级配置的来源是 `content/data/site-data.json`；正式环境的评论和附件接口后续接入 D1 与 R2。
