# 个人博客网站

这是一个基于静态 HTML/CSS/JavaScript 的个人博客网站，部署在 Cloudflare Pages 上。

## 功能特点

- ✅ Markdown 文章写作支持
- ✅ 响应式设计（适配移动端）
- ✅ 标签分类系统
- ✅ 文章摘要和列表
- ✅ Cloudflare Pages 部署页面
- ✅ 自定义域名支持
- ✅ 优雅的动画效果
- ✅ 本地和在线编辑支持

## 快速开始

1. 克隆或下载这个仓库
2. 打开 `index.html` 在浏览器中预览
3. 修改内容并添加你的文章
4. 点击「部署管理」配置 Cloudflare Pages 部署

## 文件结构

```
blog/
├── index.html          # 首页
├── about.html          # 关于页面
├── deploy.html         # 部署管理页面
├── style.css           # 主题样式
├── deploy.css          # 部署页面样式
├── deploy.js           # 部署逻辑
├── posts.json          # 文章数据
├── posts/
│   └── post1.html      # 示例文章
└── README.md           # 说明文档
```

## 自定义配置

### 修改主题颜色

在 `style.css` 中修改 CSS 变量：

```css
:root {
    --primary-color: #667eea;
    --secondary-color: #764ba2;
}
```

### 添加新文章

1. 在 `posts/` 目录下创建新 HTML 文件
2. 复制现有文章的 HTML 结构
3. 修改标题、内容和标签
4. 在 `posts.json` 中添加文章元数据

### 修改部署配置

在 `deploy.html` 中修改默认配置：

- GitHub 仓库地址
- 分支名称
- 自定义域名

## 部署到 Cloudflare Pages

1. 登录 Cloudflare Dashboard
2. 进入 Pages 部分
3. 点击「创建项目」
4. 选择「连接到 GitHub」
5. 选择你的博客仓库
6. 配置构建设置（静态站点无需构建）
7. 点击「保存并部署」

## 技术栈

- HTML5
- CSS3 (Flexbox, Grid, Animations)
- Vanilla JavaScript

## 许可证

MIT License

## 贡献

欢迎提交 Issue 和 Pull Request！
