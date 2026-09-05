import { cp, mkdir, readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";
import { marked } from "marked";
import * as cheerio from "cheerio";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIST = path.resolve(ROOT, "dist");
const CONTENT = path.join(ROOT, "content");

const CATEGORIES = {
  essays: {
    id: "essays",
    page: "essays.html",
    name: "随笔",
    backLabel: "返回随笔"
  },
  fiction: {
    id: "fiction",
    page: "fiction.html",
    name: "小说",
    backLabel: "返回小说"
  },
  tech: {
    id: "tech",
    page: "tech.html",
    name: "技术",
    backLabel: "返回技术"
  }
};

const CATEGORY_ALIASES = {
  essay: "essays",
  essays: "essays",
  随笔: "essays",
  fiction: "fiction",
  novel: "fiction",
  novels: "fiction",
  小说: "fiction",
  tech: "tech",
  technology: "tech",
  技术: "tech"
};

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function escapeJsonForHtml(value) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

function slugify(value) {
  const base = String(value || "untitled")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9\u4e00-\u9fa5_-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return base || "untitled";
}

function normalizeCategory(value) {
  const key = String(value || "essays").trim().toLowerCase();
  return CATEGORY_ALIASES[key] || "essays";
}

function formatDate(value) {
  const text = String(value || "").trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(text)) {
    const parts = text.slice(0, 10).split("-");
    if (parts.length === 3) return `${parts[0]}年${Number(parts[1])}月${Number(parts[2])}日`;
  }
  return text;
}

async function walk(dir) {
  const files = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walk(full)));
    } else {
      files.push(full);
    }
  }
  return files;
}

async function readMarkdownPosts() {
  const root = path.join(CONTENT, "posts");
  const posts = [];
  for (const file of await walk(root)) {
    if (!file.toLowerCase().endsWith(".md")) continue;
    const baseName = path.basename(file);
    if (baseName.startsWith("_") || baseName.startsWith(".")) continue;
    const raw = await readFile(file, "utf8");
    const parsed = matter(raw);
    const { data, content } = parsed;
    if (data.draft === true || data.draft === "true") continue;

    const relative = path.relative(root, file).replace(/\\/g, "/");
    const slug = path.posix.join(path.posix.dirname(relative), slugify(path.basename(relative, ".md")));
    const category = normalizeCategory(data.category);
    const meta = CATEGORIES[category] || CATEGORIES.essays;

    posts.push({
      slug,
      category,
      categoryName: meta.name,
      title: String(data.title || "未命名文章").trim(),
      date: formatDate(data.date),
      summary: String(data.summary || data.description || "").trim(),
      tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
      cover: String(data.cover || "").trim(),
      bodyHtml: marked.parse(content, {
        gfm: true,
        breaks: true
      }),
      sortDate: String(data.date || "")
    });
  }
  posts.sort((a, b) => (b.sortDate || "").localeCompare(a.sortDate || "") || a.title.localeCompare(b.title));
  return posts;
}

function injectSiteData($, siteData) {
  const jsonScript = `<script id="site-data-json" type="application/json">${escapeJsonForHtml(siteData)}</script>`;
  const seedScript = '<script src="site-data.js"></script>';
  const anchors = [
    'script[src="library.js"]',
    'script[src="../library.js"]',
    'script[src="script.js"]',
    'script[src="../script.js"]'
  ];
  for (const selector of anchors) {
    const anchor = $(selector).first();
    if (anchor.length) {
      anchor.before(`${jsonScript}${seedScript}`);
      return;
    }
  }
}

const ARTICLE_TEMPLATE = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title data-field="title">文章 - 雾中书桌</title>
    <meta name="description" data-field="description" content="">
    <link rel="stylesheet" href="../style.css">
</head>
<body>
    <div class="backdrop-layer" aria-hidden="true"></div>
    <div class="page-shell">
        <header class="site-header">
            <a class="brand" href="../index.html">
                <span class="brand-mark">书</span>
                <span class="brand-title">
                    <span data-site-title>雾中书桌</span>
                    <span class="brand-sub" data-site-subtitle>个人网络日志</span>
                </span>
            </a>
            <nav class="site-nav" aria-label="主导航">
                <a href="../index.html" class="nav-bubble">首页</a>
                <a href="../essays.html" class="nav-bubble">随笔</a>
                <a href="../fiction.html" class="nav-bubble">小说</a>
                <a href="../tech.html" class="nav-bubble">技术</a>
                <a href="../ai-art.html" class="nav-bubble">AI 绘图</a>
                <a href="../books.html" class="nav-bubble">读书</a>
                <a href="../about.html" class="nav-bubble">关于</a>
            </nav>
        </header>
        <main class="glass-panel fade-in">
            <div class="page-head">
                <div>
                    <div class="eyebrow" data-field="category">随笔</div>
                    <h1 data-field="title">文章标题</h1>
                </div>
                <p data-field="summary"></p>
            </div>
            <article class="post-content">
                <div class="post-header">
                    <div class="post-badge" data-field="category">随笔</div>
                    <div class="post-meta">
                        <span class="post-date" data-field="date"></span>
                        <span class="post-tags" data-field="tags"></span>
                    </div>
                </div>
                <div class="markdown-content" data-field="body"></div>
                <div class="nav-actions">
                    <a class="btn btn-secondary" data-field="back">返回随笔</a>
                    <a href="../index.html" class="btn btn-secondary">返回首页</a>
                </div>
            </article>
            <footer class="site-footer">
                <p>&copy; 2026 <span data-site-title>雾中书桌</span></p>
            </footer>
        </main>
    </div>
    <script src="../script.js"></script>
</body>
</html>`;

function renderArticlePage(post, siteData) {
  const $ = cheerio.load(ARTICLE_TEMPLATE);
  const category = CATEGORIES[post.category];
  const pageTitle = `${post.title} - 雾中书桌`;

  $("title").text(pageTitle);
  $('[data-field="description"]').attr("content", post.summary || post.title);
  $('[data-field="title"]').text(post.title);
  $('[data-field="category"]').text(category.name);
  $('[data-field="summary"]').text(post.summary || "还没有写简介。");
  $('[data-field="date"]').text(post.date);
  $('[data-field="back"]').attr("href", `../${category.page}`).text(category.backLabel);
  $('[data-field="tags"]').html(
    post.tags.length
      ? post.tags.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("")
      : ""
  );
  $('[data-field="body"]').html(post.bodyHtml);
  injectSiteData($, siteData);
  return $.html();
}

function buildPostCard($, post) {
  const card = $("<article class=\"post-card\"></article>");
  card.attr("data-categories", post.categoryName);
  const link = $("<a class=\"post-link\"></a>").attr("href", `posts/${post.slug}.html`);
  link.append(`<div class="post-badge">${escapeHtml(post.categoryName)}</div>`);
  link.append(`<h3 class="post-title">${escapeHtml(post.title)}</h3>`);
  link.append(`<p class="post-summary">${escapeHtml(post.summary || "还没有写摘要。")}</p>`);
  const meta = $("<div class=\"post-meta\"></div>");
  meta.append(`<span class="post-date">${escapeHtml(post.date || post.sortDate || "")}</span>`);
  if (post.tags.length) {
    meta.append(`<span class="post-tags">${post.tags.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("")}</span>`);
  }
  link.append(meta);
  card.append(link);
  return card;
}

function renderCategoryPage(sourceHtml, posts, category, siteData) {
  const $ = cheerio.load(sourceHtml);
  const section = $(`#${category.id}`).first();
  section.find(".empty-board").remove();

  const count = section.find(".board-count").first();
  count.text(posts.length ? `${posts.length} 篇` : "暂无文章");

  let grid = section.find(".posts-grid").first();
  if (posts.length === 0) {
    grid.remove();
    section.append('<div class="empty-board">这里暂时还没有文章，等待第一块碎片落下来。</div>');
  } else {
    if (!grid.length) {
      grid = $("<div class=\"posts-grid\"></div>");
      section.append(grid);
    }
    grid.empty();
    for (const post of posts) {
      grid.append(buildPostCard($, post));
    }
  }

  injectSiteData($, siteData);
  return $.html();
}

function normalizeImagePath(src) {
  let value = String(src || "").trim();
  if (!value) return "";
  value = value.replace(/^\.\//, "").replace(/^\/+/, "");
  return value;
}

function renderGalleryBoards(sourceHtml, groups) {
  const $ = cheerio.load(sourceHtml);
  const grid = $(".gallery-board-grid").first();
  if (!grid.length) return sourceHtml;

  grid.empty();
  const rotations = [-7, 5, -2, 6, -5, 2, -8, 4, -1, 7, -6, 3];
  const offsets = [
    ["-22px", "10px"],
    ["20px", "-8px"],
    ["0", "18px"],
    ["18px", "-12px"],
    ["-20px", "6px"],
    ["0", "-18px"],
    ["-24px", "-6px"],
    ["18px", "12px"],
    ["2px", "-16px"],
    ["24px", "8px"],
    ["-18px", "-14px"],
    ["0", "16px"]
  ];

  groups.forEach((group, groupIndex) => {
    const board = $("<article class=\"gallery-board\"></article>");
    const head = $("<div class=\"gallery-board-head\"></div>");
    head.append(`<h2>${escapeHtml(group.name || "未命名分组")}</h2>`);
    head.append(`<span>${Array.isArray(group.images) ? group.images.length : 0} 张</span>`);
    board.append(head);

    const stack = $("<div class=\"pinned-stack\"></div>");
    const images = Array.isArray(group.images) ? group.images : [];
    if (images.length === 0) {
      stack.append('<div class="library-empty">这组还没有照片</div>');
    }
    images.forEach((image, index) => {
      const offset = offsets[(index + groupIndex * 3) % offsets.length];
      const figure = $("<figure class=\"pinned-photo\"></figure>");
      figure.attr("style", `--r: ${rotations[(index + groupIndex * 2) % rotations.length]}deg; --x: ${offset[0]}; --y: ${offset[1]}; --z: ${index + 1};`);
      const src = normalizeImagePath(image.src || image.url || "");
      if (src) {
        figure.append(`<img src="${escapeHtml(src)}" alt="${escapeHtml(image.caption || group.name || "")}">`);
      }
      figure.append('<span class="pin"></span>');
      figure.append(`<figcaption>${escapeHtml(image.caption || "")}</figcaption>`);
      stack.append(figure);
    });
    board.append(stack);
    grid.append(board);
  });
  return $.html();
}

async function copyStaticEntries() {
  const entries = [
    "index.html",
    "about.html",
    "ai-art.html",
    "books.html",
    "essays.html",
    "fiction.html",
    "tech.html",
    "deploy.html",
    "style.css",
    "deploy.css",
    "deploy.js",
    "library.js",
    "script.js",
    "edit.css",
    "edit.js",
    "site-data.js",
    "assets",
    "admin",
    "posts"
  ];
  for (const entry of entries) {
    const source = path.join(ROOT, entry);
    const target = path.join(DIST, entry);
    const info = await stat(source).catch(() => null);
    if (!info) continue;
    if (info.isDirectory()) {
      await cp(source, target, {
        recursive: true,
        filter: (src) => !String(src).replace(/\\/g, "/").includes("node_modules")
      });
    } else {
      await mkdir(path.dirname(target), { recursive: true });
      await cp(source, target);
    }
  }
}

async function prepare() {
  if (DIST !== path.join(ROOT, "dist")) {
    throw new Error(`Unexpected dist path: ${DIST}`);
  }
  await rm(DIST, { recursive: true, force: true });
  await mkdir(DIST, { recursive: true });

  const siteData = JSON.parse(await readFile(path.join(CONTENT, "data", "site-data.json"), "utf8"));
  await mkdir(path.join(DIST, "content-data"), { recursive: true });
  await writeFile(
    path.join(DIST, "content-data", "site-data.json"),
    JSON.stringify(siteData, null, 2),
    "utf8"
  );

  const uploadsSource = path.join(CONTENT, "uploads");
  const uploadsInfo = await stat(uploadsSource).catch(() => null);
  if (uploadsInfo && uploadsInfo.isDirectory()) {
    await cp(uploadsSource, path.join(DIST, "content", "uploads"), { recursive: true });
  }

  const posts = await readMarkdownPosts();
  await copyStaticEntries();

  await mkdir(path.join(DIST, "posts"), { recursive: true });
  for (const post of posts) {
    const target = path.join(DIST, "posts", `${post.slug}.html`);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, renderArticlePage(post, siteData), "utf8");
  }

  for (const category of Object.values(CATEGORIES)) {
    const source = await readFile(path.join(ROOT, category.page), "utf8");
    const categoryPosts = posts.filter((post) => post.category === category.id);
    const output = renderCategoryPage(source, categoryPosts, category, siteData);
    await writeFile(path.join(DIST, category.page), output, "utf8");
  }

  const galleryManifest = path.join(CONTENT, "uploads", "ai-art", "manifest.json");
  const manifestInfo = await stat(galleryManifest).catch(() => null);
  if (manifestInfo && manifestInfo.isFile()) {
    const manifest = JSON.parse(await readFile(galleryManifest, "utf8"));
    const groups = Array.isArray(manifest.groups) ? manifest.groups : [];
    const source = await readFile(path.join(ROOT, "ai-art.html"), "utf8");
    const output = renderGalleryBoards(source, groups);
    const $ = cheerio.load(output);
    injectSiteData($, siteData);
    await writeFile(path.join(DIST, "ai-art.html"), $.html(), "utf8");
  }

  const indexSource = await readFile(path.join(ROOT, "index.html"), "utf8");
  const booksSource = await readFile(path.join(ROOT, "books.html"), "utf8");
  const aboutSource = await readFile(path.join(ROOT, "about.html"), "utf8");
  for (const [file, source] of [
    ["index.html", indexSource],
    ["books.html", booksSource],
    ["about.html", aboutSource]
  ]) {
    const $ = cheerio.load(source);
    injectSiteData($, siteData);
    await writeFile(path.join(DIST, file), $.html(), "utf8");
  }

  const generatedTitles = posts.map((post) => post.slug).join(", ");
  console.log(`build ok: ${posts.length} posts, pages: index, essays, fiction, tech, books, ai-art, about`);
  if (generatedTitles) console.log(`generated: ${generatedTitles}`);
}

prepare().catch((error) => {
  console.error("build failed:", error);
  process.exit(1);
});
