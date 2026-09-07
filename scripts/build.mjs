import { cp, mkdir, readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import matter from "gray-matter";
import { marked } from "marked";

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
  let entries = [];
  try {
    entries = await walk(root);
  } catch (error) {
    return posts;
  }

  for (const file of entries) {
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
      id: `repo-${slug}`,
      slug,
      category,
      categoryName: meta.name,
      title: String(data.title || "未命名文章").trim(),
      date: formatDate(data.date),
      summary: String(data.summary || data.description || "").trim(),
      tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
      cover: String(data.cover || "").trim(),
      markdown: content,
      bodyHtml: marked.parse(content, {
        gfm: true,
        breaks: true
      }),
      status: "published",
      origin: "repo",
      updatedAt: String(data.updatedAt || data.date || ""),
      createdAt: String(data.date || ""),
      sortDate: String(data.date || "")
    });
  }
  posts.sort((a, b) => (b.sortDate || "").localeCompare(a.sortDate || "") || a.title.localeCompare(b.title));
  return posts;
}

// 公开页面的 HTML 全部由 functions/_lib/templates.mjs 在服务端渲染，
// build 只负责产出 data/posts.json（供 SSR 加载仓库文章）并拷贝
// 后台、样式、脚本与图片等静态资源到 dist。
const STATIC_ENTRIES = [
  "style.css",
  "script.js",
  "deploy.html",
  "deploy.css",
  "deploy.js",
  "assets",
  "admin"
];

async function copyStaticEntries() {
  for (const entry of STATIC_ENTRIES) {
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

async function copyUploads() {
  const uploadsSource = path.join(CONTENT, "uploads");
  const uploadsInfo = await stat(uploadsSource).catch(() => null);
  if (uploadsInfo && uploadsInfo.isDirectory()) {
    await cp(uploadsSource, path.join(DIST, "content", "uploads"), { recursive: true });
  }
}

async function prepare() {
  if (DIST !== path.join(ROOT, "dist")) {
    throw new Error(`Unexpected dist path: ${DIST}`);
  }
  await rm(DIST, { recursive: true, force: true });
  await mkdir(DIST, { recursive: true });

  const posts = await readMarkdownPosts();

  await copyStaticEntries();
  await copyUploads();

  await mkdir(path.join(DIST, "data"), { recursive: true });
  await writeFile(
    path.join(DIST, "data", "posts.json"),
    JSON.stringify(posts, null, 2),
    "utf8"
  );

  const generatedTitles = posts.map((post) => post.slug).join(", ");
  console.log(`build ok: ${posts.length} posts -> data/posts.json`);
  if (generatedTitles) console.log(`repo posts: ${generatedTitles}`);
}

prepare().catch((error) => {
  console.error("build failed:", error);
  process.exit(1);
});
