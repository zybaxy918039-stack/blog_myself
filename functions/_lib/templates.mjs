import { CATEGORIES } from "./site-data.mjs";
import { renderMarkdown } from "./markdown.mjs";

export function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function safeUrl(value) {
  const url = String(value || "").trim();
  if (/^(https?:|mailto:|tel:|data:|#|\/|\.\.?\/)/i.test(url)) return url;
  return "#";
}

function escapeCssString(value) {
  return String(value || "")
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/[\r\n]+/g, " ");
}

function backgroundValue(src) {
  const value = String(src || "").trim();
  if (!value) return "";
  if (/^url\(/i.test(value)) return value;
  return `url("${escapeCssString(safeUrl(value))}")`;
}

function inlineStyle(entries) {
  const pairs = [];
  for (const [key, value] of Object.entries(entries || {})) {
    if (value === undefined || value === null || value === "") continue;
    pairs.push(`${key}:${value}`);
  }
  return pairs.join(";");
}

function textStyle({ color, size, weight }) {
  return inlineStyle({
    color,
    "font-size": size ? `${size}px` : undefined,
    "font-weight": weight
  });
}

const NAV_ITEMS = [
  { id: "home", label: "首页", href: "/" },
  { id: "essays", label: "随笔", href: "/essays.html" },
  { id: "fiction", label: "小说", href: "/fiction.html" },
  { id: "tech", label: "技术", href: "/tech.html" },
  { id: "ai-art", label: "AI 绘图", href: "/ai-art.html" },
  { id: "books", label: "读书", href: "/books.html" },
  { id: "about", label: "关于", href: "/about.html" }
];

const DEFAULT_BG = 'url("assets/bg-mist-morning.jpg")';

export function appearanceStyle(appearance) {
  const a = appearance || {};
  return [
    `--bg-image:${backgroundValue(a.image) || DEFAULT_BG}`,
    `--backdrop-opacity:${a.backdropOpacity ?? 0.78}`,
    `--backdrop-blur:${a.backdropBlur ?? 18}px`,
    `--panel-opacity:${a.panelOpacity ?? 0.82}`,
    `--panel-blur:${a.panelBlur ?? 12}px`,
    `--content-width:${a.contentWidth ?? 1100}px`
  ].join(";");
}

function brandHtml(siteData) {
  const appearance = siteData.appearance || {};
  const title = appearance.siteTitle || "雾中书桌";
  const subtitle = appearance.siteSubtitle || "个人网络日志";
  return (
    `<a class="brand" href="/">` +
    `<span class="brand-mark">书</span>` +
    `<span class="brand-title"><span>${escapeHtml(title)}</span>` +
    `<span class="brand-sub">${escapeHtml(subtitle)}</span></span></a>`
  );
}

function headerHtml(siteData, active) {
  const nav = NAV_ITEMS
    .map(
      (item) =>
        `<a href="${item.href}" class="nav-bubble${item.id === active ? " active" : ""}">${item.label}</a>`
    )
    .join("");
  return (
    `<header class="site-header">${brandHtml(siteData)}` +
    `<nav class="site-nav" aria-label="主导航">${nav}</nav></header>`
  );
}

function footerHtml(siteData) {
  const title = (siteData.appearance || {}).siteTitle || "雾中书桌";
  return `<footer class="site-footer"><p>&copy; 2026 ${escapeHtml(title)}</p></footer>`;
}

function slideshowHtml(siteData) {
  const source = siteData.backgroundSlideshow || {};
  const config = {
    enabled: source.enabled !== false,
    images: Array.isArray(source.images)
      ? source.images.map((image) => String(image || "").trim()).filter(Boolean).slice(0, 20)
      : [],
    intervalMs: Math.min(120000, Math.max(3000, Number(source.intervalMs) || 10000)),
    transitionMs: Math.min(6000, Math.max(600, Number(source.transitionMs) || 1800)),
    rippleStrength: Math.min(1, Math.max(0.15, Number(source.rippleStrength) || 0.68))
  };
  const json = JSON.stringify(config).replace(/</g, "\\u003c");
  return (
    `<div class="background-slideshow" aria-hidden="true">` +
    `<div class="background-slide background-slide-current"></div>` +
    `<div class="background-slide background-slide-next"></div>` +
    `</div>` +
    `<div class="background-ripple-field" aria-hidden="true"></div>` +
    `<script id="background-slideshow-data" type="application/json">${json}</script>`
  );
}

export function renderPage({
  siteData,
  title,
  description = "",
  bodyClass = "",
  active = "",
  mainHtml,
  footer = true
}) {
  const appearance = siteData.appearance || {};
  const siteTitle = appearance.siteTitle || "雾中书桌";
  const bodyClassAttr = bodyClass ? ` class="${bodyClass}"` : "";
  return (
    `<!DOCTYPE html>\n<html lang="zh-CN">\n<head>\n` +
    `<meta charset="UTF-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n` +
    `<title>${escapeHtml(title)}</title>\n` +
    `<meta name="description" content="${escapeHtml(description)}">\n` +
    `<link rel="stylesheet" href="/style.css?v=20260911-2">\n` +
    `<style>:root{${appearanceStyle(appearance)}}</style>\n` +
    `</head>\n<body${bodyClassAttr}>\n` +
    `${slideshowHtml(siteData)}\n` +
    `<div class="backdrop-layer" aria-hidden="true"></div>\n` +
    `<div class="page-shell">\n${headerHtml(siteData, active)}\n` +
    `${mainHtml}\n` +
    (footer ? footerHtml(siteData) : "") +
    `<script src="/script.js?v=20260911-2" defer></script>\n` +
    `</body>\n</html>`
  );
}

function pageHead({ eyebrow, title, description }) {
  return (
    `<div class="page-head">` +
    `<div><div class="eyebrow">${escapeHtml(eyebrow)}</div><h1>${escapeHtml(title)}</h1></div>` +
    `<p>${escapeHtml(description)}</p></div>`
  );
}

function homeProfileHtml(siteData) {
  const profile = siteData.homeProfile || {};
  return (
    `<article class="home-feature home-profile-card">` +
    `<div class="home-profile-intro">` +
    `<div class="home-profile-avatar">${escapeHtml(profile.avatar || "书")}</div>` +
    `<div class="home-profile-identity">` +
    `<div class="eyebrow">个人资料</div>` +
    `<h1>${escapeHtml(profile.name || "博主")}</h1>` +
    `<p class="home-profile-signature">${escapeHtml(profile.signature || "")}</p>` +
    `</div></div>` +
    `<p class="home-profile-bio">${escapeHtml(profile.bio || "")}</p></article>`
  );
}

function homeMusicHtml(siteData) {
  const music = siteData.music || {};
  const hasMusic = Boolean(String(music.url || "").trim());
  const src = hasMusic ? ` src="${escapeHtml(safeUrl(music.url))}"` : "";
  return (
    `<article class="home-feature home-music-card${hasMusic ? " has-music" : ""}">` +
    `<div class="home-music-head">` +
    `<div><div class="eyebrow">正在播放</div>` +
    `<h2>${escapeHtml(music.title || "未设置音乐")}</h2>` +
    `<p>${escapeHtml(music.artist || (hasMusic ? "未知歌手" : "在管理后台添加音乐链接后可用"))}</p>` +
    `</div><div class="home-music-disc" aria-hidden="true"><span></span></div></div>` +
    `<audio id="home-audio-player" controls preload="metadata" aria-label="音乐播放器"${src}></audio>` +
    `<p class="home-music-hint">${hasMusic ? "把喜欢的音乐放在这里，作为每次点开博客时的小小背景。" : "在管理后台添加音乐链接后，这里就可以播放。"}</p>` +
    `</article>`
  );
}

function weeklyCoverHtml(siteData) {
  const settings = (siteData.homeBubbles || {}).books || {};
  const weeklyCover = siteData.weeklyCover || {};
  const image = settings.coverImage || weeklyCover.image || "";
  const title = settings.title || weeklyCover.title || "本周书单";
  const subtitle = settings.subtitle || weeklyCover.subtitle || "";
  const imageHtml = image
    ? `<img class="home-weekly-cover-image" src="${escapeHtml(safeUrl(image))}" alt="">`
    : `<div class="home-weekly-cover-image home-weekly-cover-placeholder">读</div>`;
  return (
    `<div id="home-weekly-books" class="mini-list">` +
    `<article class="home-weekly-cover">${imageHtml}` +
    `<div class="home-weekly-cover-copy">` +
    `<div class="home-weekly-cover-title" style="${textStyle(settings)}">${escapeHtml(title)}</div>` +
    `<p style="${textStyle(settings)}">${escapeHtml(subtitle)}</p>` +
    `</div></article></div>`
  );
}

function bubbleHtml({ id, href, linkLabel, settings }) {
  const style = settings.background
    ? inlineStyle({ "background-image": backgroundValue(settings.background) })
    : "";
  const customClass = settings.background ? " has-custom-background" : "";
  const eyebrowStyle = textStyle({
    color: settings.textColor,
    size: Math.round((settings.textSize || 16) * 0.78),
    weight: settings.fontWeight
  });
  const headingStyle = textStyle({
    color: settings.titleColor,
    size: settings.titleSize,
    weight: settings.fontWeight
  });
  const bodyStyle = textStyle({
    color: settings.textColor,
    size: settings.textSize,
    weight: settings.fontWeight
  });
  const styleAttr = style ? ` style="${style}"` : "";
  const copy = id === "books"
    ? "" 
    : `<p style="${bodyStyle}">${escapeHtml(settings.description || "")}</p>`;
  return (
    `<article class="home-bubble home-bubble-${id}${customClass}"${styleAttr}>` +
    `<div class="home-bubble-head">` +
    `<span class="eyebrow" style="${eyebrowStyle}">${escapeHtml(settings.eyebrow || "")}</span>` +
    `<h2 style="${headingStyle}">${escapeHtml(settings.title || "")}</h2>` +
    `</div>${copy}` +
    `<a href="${href}" class="bubble-link">${escapeHtml(linkLabel)}</a></article>`
  );
}

function homeBubblesHtml(siteData) {
  const bubbles = siteData.homeBubbles || {};
  const essays = bubbleHtml({
    id: "essays",
    href: "/essays.html",
    linkLabel: "进入随笔",
    settings: bubbles.essays || {}
  });
  const tech = bubbleHtml({
    id: "tech",
    href: "/tech.html",
    linkLabel: "进入技术",
    settings: bubbles.tech || {}
  });
  const booksBubble = bubbleHtml({
    id: "books",
    href: "/books.html",
    linkLabel: "查看读书区",
    settings: bubbles.books || {}
  });
  const books = booksBubble.replace("</article>", `${weeklyCoverHtml(siteData)}</article>`);
  return (
    `<section class="home-bubble-grid" aria-label="内容概览">${essays}${tech}${books}</section>`
  );
}

export function renderHomePage(siteData) {
  const main = (
    `<main class="home-layout fade-in">` +
    `<section class="home-hero-layout" aria-label="个人资料与音乐">` +
    `${homeProfileHtml(siteData)}${homeMusicHtml(siteData)}</section>` +
    `${homeBubblesHtml(siteData)}` +
    footerHtml(siteData) +
    `</main>`
  );
  return (
    renderPage({
      siteData,
      title: `${(siteData.appearance || {}).siteTitle || "雾中书桌"} - 个人网络日志`,
      description: "一个混合型个人博客，包含技术文章、生活随笔和小说草稿",
      active: "home",
      mainHtml: main,
      footer: false
    })
  );
}

function formatDate(value) {
  const text = String(value || "").trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(text)) {
    const parts = text.slice(0, 10).split("-");
    if (parts.length === 3) return `${parts[0]}年${Number(parts[1])}月${Number(parts[2])}日`;
  }
  return text;
}

function postCardHtml(article) {
  const category = CATEGORIES[article.category]?.name || article.categoryName || "文章";
  const tags = Array.isArray(article.tags)
    ? article.tags.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("")
    : "";
  return (
    `<article class="post-card" data-categories="${escapeHtml(category)}">` +
    `<a href="/posts/${encodeURIComponent(article.slug)}.html" class="post-link">` +
    `<div class="post-badge">${escapeHtml(category)}</div>` +
    `<h3 class="post-title">${escapeHtml(article.title)}</h3>` +
    `<p class="post-summary">${escapeHtml(article.summary || "还没有写摘要。")}</p>` +
    `<div class="post-meta"><span class="post-date">${escapeHtml(formatDate(article.date))}</span>` +
    (tags ? `<span class="post-tags">${tags}</span>` : "") +
    `</div></a></article>`
  );
}

function categoryName(id) {
  return CATEGORIES[id]?.name || "文章";
}

export function renderCategoryPage(siteData, articles, id) {
  const meta = CATEGORIES[id] || CATEGORIES.essays;
  const list = articles
    .filter((article) => article.category === id)
    .map(postCardHtml)
    .join("");
  const gridHtml = list
    ? `<div class="posts-grid">${list}</div>`
    : `<div class="empty-board">这里暂时还没有文章，等待第一块碎片落下来。</div>`;
  const main = (
    `<main class="glass-panel fade-in">` +
    pageHead({ eyebrow: meta.name, title: meta.name, description: `${meta.name}相关文章` }) +
    `<section class="category-board" id="${id}">` +
    `<div class="board-head"><div><div class="eyebrow">${meta.name}</div><h2>${meta.name}</h2></div>` +
    `<span class="board-count">${list ? `${articles.filter((a) => a.category === id).length} 篇` : "暂无文章"}</span></div>` +
    gridHtml +
    `</section></main>`
  );
  const descriptions = {
    essays: "一些日常记录，和没有急着变成结论的想法。",
    fiction: "故事草稿、角色片段和还在生长的虚构世界。",
    tech: "编程经验、工具使用，以及解决具体问题的过程。"
  };
  return (
    renderPage({
      siteData,
      title: `${meta.name} - 雾中书桌`,
      description: descriptions[id] || `${meta.name}相关文章`,
      active: id,
      mainHtml: main
    })
  );
}

function weeklyBookItemHtml(book) {
  return (
    `<article class="weekly-book-item">` +
    `<div class="weekly-book-title">${escapeHtml(book.title)}</div>` +
    `<div class="weekly-book-author">${escapeHtml(book.author || "未知作者")}</div>` +
    `<div class="weekly-book-reason">${escapeHtml(book.reason || "还在想为什么读它")}</div>` +
    `<span class="tag${book.progress === "已读完" ? " tag-warm" : ""}">${escapeHtml(book.progress || "未开始")}</span>` +
    `</article>`
  );
}

function reviewCardHtml(review) {
  const cover = review.cover
    ? `<img class="review-cover" src="${escapeHtml(safeUrl(review.cover))}" alt="${escapeHtml(review.title)}封面">`
    : `<div class="review-cover review-cover-placeholder">书</div>`;
  const quotes = (review.quotes || [])
    .map(
      (quote) =>
        `<div class="review-quote"><blockquote>${escapeHtml(quote.text)}</blockquote>` +
        `<p>${escapeHtml(quote.note || "")}</p></div>`
    )
    .join("");
  return (
    `<article class="book-review-card">` +
    `<div class="review-book-head">${cover}` +
    `<div><h3>${escapeHtml(review.title)}</h3><p>${escapeHtml(review.author || "未知作者")}</p></div></div>` +
    `<div class="review-quote-list">${quotes || '<div class="library-empty">还没有摘录</div>'}</div>` +
    `</article>`
  );
}

export function renderBooksPage(siteData) {
  const books = Array.isArray(siteData.weeklyBooks) ? siteData.weeklyBooks : [];
  const reviews = Array.isArray(siteData.bookReviews) ? siteData.bookReviews : [];
  const bookList = books.length
    ? books.map(weeklyBookItemHtml).join("")
    : '<div class="library-empty">这周还没有放进书单</div>';
  const reviewList = reviews.length
    ? reviews.map(reviewCardHtml).join("")
    : '<div class="library-empty">还没有创建书评分区</div>';
  const main = (
    `<main class="glass-panel fade-in">` +
    pageHead({ eyebrow: "读书", title: "读书与摘录", description: "把计划读的书留在这里，把真正留下来的句子慢慢收成一本自己的阅读册。" }) +
    `<section class="library-section" id="weekly-reading">` +
    `<div class="section-header"><div><div class="eyebrow">本周书单</div><h2>本周书单</h2></div>` +
    `<span class="board-count">从后台随时更新</span></div>` +
    `<div id="weekly-book-list" class="weekly-book-list">${bookList}</div></section>` +
    `<section class="library-section" id="book-reviews">` +
    `<div class="section-header"><div><div class="eyebrow">书评</div><h2>书评分区</h2></div>` +
    `<span class="board-count">每本书一个独立分区</span></div>` +
    `<div id="book-review-shelf" class="book-review-shelf">${reviewList}</div></section>` +
    `</main>`
  );
  return (
    renderPage({
      siteData,
      title: "读书 - 雾中书桌",
      description: "本周书单、书籍摘录和短评",
      bodyClass: "books-page",
      active: "books",
      mainHtml: main
    })
  );
}

function normalizeImagePath(src) {
  let value = String(src || "").trim();
  if (!value) return "";
  value = value.replace(/^\.\//, "").replace(/^\/+/, "");
  return value;
}

const ROTATIONS = [-7, 5, -2, 6, -5, 2, -8, 4, -1, 7, -6, 3];
const OFFSETS = [
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

export function renderGalleryPage(siteData) {
  const groups = Array.isArray(siteData.galleryBoards) ? siteData.galleryBoards : [];
  const boards = groups
    .map((group, groupIndex) => {
      const images = Array.isArray(group.images) ? group.images : [];
      const stack = images.length
        ? images
            .map((image, index) => {
              const rotation = ROTATIONS[(index + groupIndex * 2) % ROTATIONS.length];
              const offset = OFFSETS[(index + groupIndex * 3) % OFFSETS.length];
              const src = normalizeImagePath(image.src || image.url || "");
              const img = src
                ? `<img src="${escapeHtml(src)}" alt="${escapeHtml(image.caption || group.name || "")}">`
                : "";
              return (
                `<figure class="pinned-photo" style="--r: ${rotation}deg; --x: ${offset[0]}; --y: ${offset[1]}; --z: ${index + 1};">` +
                img +
                `<span class="pin"></span><figcaption>${escapeHtml(image.caption || "")}</figcaption></figure>`
              );
            })
            .join("")
        : '<div class="library-empty">这组还没有照片</div>';
      return (
        `<article class="gallery-board">` +
        `<div class="gallery-board-head"><h2>${escapeHtml(group.name || "未命名分组")}</h2>` +
        `<span>${images.length} 张</span></div>` +
        `<div class="pinned-stack">${stack}</div></article>`
      );
    })
    .join("");
  const main = (
    `<main class="gallery-stage fade-in">` +
    pageHead({ eyebrow: "AI 绘图", title: "AI 绘图", description: "把生成图像的实验整理成一个小画廊。" }) +
    `<section class="photo-gallery" id="ai-art">` +
    `<div class="gallery-title"><span>作品墙</span><small>${groups.length} 组</small></div>` +
    `<div class="gallery-board-grid">${boards}</div></section></main>`
  );
  return (
    renderPage({
      siteData,
      title: "AI 绘图 - 雾中书桌",
      description: "AI 绘图作品和实验",
      bodyClass: "ai-art-page",
      active: "ai-art",
      mainHtml: main
    })
  );
}

export function renderAboutPage(siteData) {
  const profile = siteData.homeProfile || {};
  const name = profile.name || "博主";
  const bio = profile.bio || "";
  const avatar = profile.avatar || "书";
  const main = (
    `<main class="glass-panel fade-in">` +
    pageHead({ eyebrow: "关于", title: "关于我", description: "这个博客用来收纳我想写、想留、想继续生长的东西。" }) +
    `<article class="post-content"><div class="about-content">` +
    `<section class="profile-section">` +
    `<div class="profile-avatar"><span class="avatar-text">${escapeHtml(name)}</span></div>` +
    `<div><h2>我是${escapeHtml(name)}</h2><p class="bio">${escapeHtml(bio)}</p></div></section>` +
    `<section class="content-section"><h3>关于这个博客</h3><p>欢迎来到我的博客。这里会慢慢积累：</p>` +
    `<ul class="topics-list">` +
    `<li><strong>技术文章</strong> - 编程技巧、工具使用、项目经验</li>` +
    `<li><strong>生活随笔</strong> - 日常点滴、思考感悟、读书笔记</li>` +
    `<li><strong>小说创作</strong> - 故事草稿、角色设定、创意想法</li>` +
    `<li><strong>AI 绘图</strong> - 生成图像的实验与整理</li>` +
    `</ul></section>` +
    `<section class="contact-section"><h3>联系我</h3>` +
    `<div class="contact-links">` +
    `<a href="/books.html" class="contact-item"><span class="icon">读</span><span>读书与摘录</span></a>` +
    `<a href="/" class="contact-item"><span class="icon">书</span><span>${escapeHtml(avatar)} · ${escapeHtml(name)}</span></a>` +
    `</div></section></div>` +
    `<div class="nav-actions"><a href="/" class="btn btn-secondary">返回首页</a></div></article></main>`
  );
  return (
    renderPage({
      siteData,
      title: "关于我 - 雾中书桌",
      description: "关于这个个人博客与作者",
      active: "about",
      mainHtml: main
    })
  );
}

export function renderArticlePage(siteData, article) {
  const category = CATEGORIES[article.category] || CATEGORIES.essays;
  const body = article.bodyHtml || renderMarkdown(article.markdown);
  const tags = Array.isArray(article.tags)
    ? article.tags.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("")
    : "";
  const main = (
    `<main class="glass-panel fade-in">` +
    pageHead({ eyebrow: category.name, title: article.title, description: article.summary || "" }) +
    `<article class="post-content">` +
    `<div class="post-header">` +
    `<div class="post-badge">${category.name}</div>` +
    `<div class="post-meta"><span class="post-date">${escapeHtml(formatDate(article.date))}</span>` +
    (tags ? `<span class="post-tags">${tags}</span>` : "") +
    `</div></div>` +
    `<div class="markdown-content">${body}</div>` +
    `<div class="nav-actions">` +
    `<a class="btn btn-secondary" href="/${category.page}">${category.backLabel}</a>` +
    `<a href="/" class="btn btn-secondary">返回首页</a></div>` +
    `</article></main>`
  );
  return (
    renderPage({
      siteData,
      title: `${article.title} - 雾中书桌`,
      description: article.summary || article.title,
      mainHtml: main
    })
  );
}

export function renderNotFound(siteData) {
  const main =
    `<main class="glass-panel fade-in">` +
    pageHead({ eyebrow: "404", title: "没有找到这一页", description: "地址可能拼写错误，或者文章还没有发布。" }) +
    `<div class="nav-actions"><a href="/" class="btn btn-primary">返回首页</a></div></main>`;
  return renderPage({
    siteData,
    title: "404 - 雾中书桌",
    description: "页面不存在",
    mainHtml: main,
    status: 404
  });
}
