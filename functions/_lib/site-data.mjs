export const CATEGORIES = {
  essays: { id: "essays", page: "essays.html", name: "随笔", backLabel: "返回随笔" },
  fiction: { id: "fiction", page: "fiction.html", name: "小说", backLabel: "返回小说" },
  tech: { id: "tech", page: "tech.html", name: "技术", backLabel: "返回技术" }
};

export const CATEGORY_ALIASES = {
  essay: "essays",
  essays: "essays",
  随笔: "essays",
  fiction: "fiction",
  novel: "fiction",
  novels: "fiction",
  小说: "fiction",
  tech: "tech",
  technology: "tech",
  技术: "tech",
  项目: "tech",
  project: "tech",
  projects: "tech"
};

export function slugify(value) {
  const base = String(value || "untitled")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9\u4e00-\u9fa5_-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return base || "untitled";
}

export const DEFAULTS = {
  appearance: {
    siteTitle: "雾中书桌",
    siteSubtitle: "个人网络日志",
    image: 'url("assets/bg-mist-morning.jpg")',
    backdropOpacity: 0.78,
    backdropBlur: 18,
    panelOpacity: 0.82,
    panelBlur: 12,
    contentWidth: 1100
  },
  homeProfile: {
    avatar: "书",
    name: "博主",
    bio: "热爱技术和创作，用这个博客记录生活点滴、技术分享和未完的故事。",
    signature: "把想法留在纸上。"
  },
  music: {
    title: "未设置音乐",
    artist: "",
    url: ""
  },
  homeBubbles: {
    essays: {
      eyebrow: "随笔",
      title: "随笔与日常",
      description: "记录一些没有急着变成结论的想法，和生活里值得留下的碎片。",
      background: "",
      titleColor: "#17201f",
      textColor: "#35413f",
      titleSize: 24,
      textSize: 16,
      fontWeight: 700
    },
    tech: {
      eyebrow: "技术",
      title: "技术笔记",
      description: "编程经验、工具使用，以及解决具体问题后留下的过程记录。",
      background: "",
      titleColor: "#17201f",
      textColor: "#35413f",
      titleSize: 24,
      textSize: 16,
      fontWeight: 700
    },
    books: {
      eyebrow: "阅读",
      title: "本周书单",
      subtitle: "在读书与摘录之间，留下一小块慢下来的地方。",
      coverImage: "",
      background: "",
      titleColor: "#17201f",
      textColor: "#35413f",
      titleSize: 22,
      textSize: 15,
      fontWeight: 700
    }
  },
  weeklyCover: {
    image: "",
    title: "本周书单",
    subtitle: "在读书与摘录之间，留下一小块慢下来的地方。"
  },
  weeklyBooks: [
    {
      id: "weekly-default-1",
      title: "置身事内",
      author: "兰小欢",
      reason: "补一补中国经济运行与制度脉络",
      progress: "进行中"
    },
    {
      id: "weekly-default-2",
      title: "写作这回事",
      author: "斯蒂芬·金",
      reason: "从作者的写作经验里重新理解表达",
      progress: "未开始"
    }
  ],
  bookReviews: [
    {
      id: "book-default-1",
      title: "百年孤独",
      author: "加西亚·马尔克斯",
      cover: "",
      quotes: [
        {
          id: "quote-default-1",
          text: "过去都是假的，回忆没有归路，春天总是一去不返。",
          note: "第一次读到这里时，感到时间被折叠成了一张薄纸。"
        },
        {
          id: "quote-default-2",
          text: "世界新生伊始，许多事物还没有名字，提到的时候尚需用手指指点点。",
          note: "像重新学习语言，也像重新命名自己的经验。"
        }
      ]
    }
  ],
  galleryBoards: [
    {
      name: "晨雾系列",
      images: [
        { src: "assets/1.png", caption: "雾中清晨" },
        { src: "assets/bg-mist-morning.jpg", caption: "晨雾" },
        { src: "assets/bg-night-ink.jpg", caption: "雾后夜色" }
      ]
    },
    {
      name: "夜墨系列",
      images: [
        { src: "assets/bg-night-ink.jpg", caption: "夜墨" },
        { src: "assets/1.png", caption: "冷光" },
        { src: "assets/bg-warm-desk.jpg", caption: "案头余温" }
      ]
    },
    {
      name: "暖桌系列",
      images: [
        { src: "assets/bg-warm-desk.jpg", caption: "暖桌" },
        { src: "assets/bg-mist-morning.jpg", caption: "窗外晨光" },
        { src: "assets/1.png", caption: "静物" }
      ]
    },
    {
      name: "幻想系列",
      images: [
        { src: "assets/1.png", caption: "雾中幻境" },
        { src: "assets/bg-night-ink.jpg", caption: "夜航" },
        { src: "assets/bg-mist-morning.jpg", caption: "未知来信" }
      ]
    }
  ]
};

function parseJson(value, fallback) {
  if (value === undefined || value === null || value === "") return fallback;
  try {
    return JSON.parse(value);
  } catch (error) {
    return fallback;
  }
}

function mergeSection(name, saved) {
  const fallback = DEFAULTS[name];
  if (!fallback) return saved;
  if (Array.isArray(fallback)) return Array.isArray(saved) ? saved : fallback;
  if (saved && typeof saved === "object") {
    return { ...fallback, ...saved };
  }
  return fallback;
}

export async function loadSiteData(env) {
  const data = {};
  const db = env && env.BLOG_COMMENTS_DB;
  if (db) {
    try {
      const result = await db.prepare("SELECT key, value FROM settings").all();
      for (const row of result.results || []) {
        data[row.key] = parseJson(row.value, undefined);
      }
    } catch (error) {
      // 本地或新数据库没有 settings 表时使用仓库默认值。
    }
  }

  const siteData = {};
  for (const key of Object.keys(DEFAULTS)) {
    siteData[key] = mergeSection(key, data[key]);
  }
  return siteData;
}

export function normalizeCategory(value) {
  const key = String(value || "essays").trim().toLowerCase();
  return CATEGORY_ALIASES[key] || "essays";
}

export function normalizeArticleRow(row) {
  return {
    id: row.id,
    slug: row.slug,
    category: normalizeCategory(row.category),
    categoryName: CATEGORIES[normalizeCategory(row.category)].name,
    title: String(row.title || "未命名文章"),
    date: String(row.date || ""),
    summary: String(row.summary || ""),
    tags: parseJson(row.tags, []),
    cover: String(row.cover || ""),
    markdown: String(row.markdown || ""),
    bodyHtml: String(row.body_html || ""),
    status: String(row.status || "draft"),
    origin: String(row.origin || "admin"),
    updatedAt: String(row.updated_at || ""),
    createdAt: String(row.created_at || "")
  };
}

export async function loadArticles(env, includeDrafts = false) {
  const db = env && env.BLOG_COMMENTS_DB;
  if (!db) return [];
  const sql = includeDrafts
    ? "SELECT * FROM articles ORDER BY updated_at DESC"
    : "SELECT * FROM articles WHERE status = 'published' ORDER BY date DESC, updated_at DESC";
  const result = await db.prepare(sql).all();
  return (result.results || []).map(normalizeArticleRow);
}

export async function loadRepoArticles(env, request) {
  const assets = env && env.ASSETS;
  if (!assets) return [];
  try {
    const url = new URL("/data/posts.json", request ? request.url : undefined);
    const response = await assets.fetch(new Request(url, { headers: { Accept: "application/json" } }));
    if (!response.ok) return [];
    const payload = await response.json();
    return Array.isArray(payload) ? payload : [];
  } catch (error) {
    return [];
  }
}

export function mergeArticles(d1Articles, repoArticles) {
  const bySlug = new Map();
  for (const article of Array.isArray(repoArticles) ? repoArticles : []) {
    if (!article || !article.slug) continue;
    const normalized = {
      id: String(article.id || `repo-${article.slug}`),
      slug: String(article.slug),
      category: normalizeCategory(article.category),
      categoryName: CATEGORIES[normalizeCategory(article.category)].name,
      title: String(article.title || "未命名文章"),
      date: String(article.date || ""),
      summary: String(article.summary || ""),
      tags: Array.isArray(article.tags) ? article.tags.map(String) : [],
      cover: String(article.cover || ""),
      markdown: String(article.markdown || ""),
      bodyHtml: String(article.bodyHtml || ""),
      status: String(article.status || "published"),
      origin: String(article.origin || "repo"),
      updatedAt: String(article.updatedAt || ""),
      createdAt: String(article.createdAt || "")
    };
    bySlug.set(normalized.slug, normalized);
  }
  for (const article of Array.isArray(d1Articles) ? d1Articles : []) {
    if (!article || !article.slug) continue;
    bySlug.set(article.slug, article);
  }
  return Array.from(bySlug.values());
}

export async function loadPublicArticles(env, request) {
  const d1Articles = await loadArticles(env, false);
  const repoArticles = await loadRepoArticles(env, request);
  return mergeArticles(d1Articles, repoArticles);
}

export async function upsertSetting(env, key, value) {
  const db = env.BLOG_COMMENTS_DB;
  if (!db) throw new Error("D1 binding missing");
  if (value === null || value === undefined) {
    await db.prepare("DELETE FROM settings WHERE key = ?").bind(key).run();
    return;
  }
  const encoded = JSON.stringify(value);
  await db
    .prepare(
      `INSERT INTO settings (key, value, updated_at)
       VALUES (?, ?, datetime('now'))
       ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`
    )
    .bind(key, encoded)
    .run();
}

export async function saveArticle(env, article) {
  const db = env.BLOG_COMMENTS_DB;
  if (!db) throw new Error("D1 binding missing");
  const tags = JSON.stringify(Array.isArray(article.tags) ? article.tags : []);
  const id = article.id && String(article.id).trim()
    ? String(article.id).trim()
    : `admin-${article.slug}`;
  await db
    .prepare(
      `INSERT INTO articles
       (id, slug, category, title, date, summary, tags, cover, markdown, body_html, status, origin, updated_at, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'admin', datetime('now'), datetime('now'))
       ON CONFLICT(slug) DO UPDATE SET
         id = excluded.id,
         category = excluded.category,
         title = excluded.title,
         date = excluded.date,
         summary = excluded.summary,
         tags = excluded.tags,
         cover = excluded.cover,
         markdown = excluded.markdown,
         body_html = excluded.body_html,
         status = excluded.status,
         updated_at = excluded.updated_at`
    )
    .bind(
      id,
      article.slug,
      article.category,
      article.title,
      article.date,
      article.summary,
      tags,
      article.cover,
      article.markdown,
      article.bodyHtml || "",
      article.status
    )
    .run();
  return { ...article, id };
}

export async function deleteArticle(env, idOrSlug) {
  const db = env.BLOG_COMMENTS_DB;
  if (!db) throw new Error("D1 binding missing");
  const value = String(idOrSlug || "").trim();
  if (!value) return;
  await db.prepare("DELETE FROM articles WHERE id = ? OR slug = ?").bind(value, value).run();
}

export async function upsertArticleBySlug(env, article) {
  const db = env.BLOG_COMMENTS_DB;
  if (!db) throw new Error("D1 binding missing");
  const tags = JSON.stringify(Array.isArray(article.tags) ? article.tags : []);
  await db
    .prepare(
      `INSERT INTO articles
       (id, slug, category, title, date, summary, tags, cover, markdown, body_html, status, origin, updated_at, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'published', 'repo', datetime('now'), datetime('now'))
       ON CONFLICT(slug) DO UPDATE SET
         id = excluded.id,
         category = excluded.category,
         title = excluded.title,
         date = excluded.date,
         summary = excluded.summary,
         tags = excluded.tags,
         cover = excluded.cover,
         markdown = excluded.markdown,
         body_html = excluded.body_html,
         status = excluded.status,
         origin = excluded.origin,
         updated_at = excluded.updated_at`
    )
    .bind(
      article.id,
      article.slug,
      article.category,
      article.title,
      article.date,
      article.summary,
      tags,
      article.cover,
      article.markdown,
      article.bodyHtml || ""
    )
    .run();
}
