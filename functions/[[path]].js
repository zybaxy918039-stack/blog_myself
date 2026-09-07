import {
  renderHomePage,
  renderCategoryPage,
  renderGalleryPage,
  renderBooksPage,
  renderAboutPage,
  renderArticlePage,
  renderNotFound
} from "./_lib/templates.mjs";
import {
  DEFAULTS,
  loadSiteData,
  loadPublicArticles,
  loadArticles,
  loadRepoArticles,
  mergeArticles,
  normalizeCategory,
  slugify,
  upsertSetting,
  saveArticle,
  deleteArticle
} from "./_lib/site-data.mjs";
import { renderMarkdown } from "./_lib/markdown.mjs";
import { jsonResponse, htmlResponse } from "./_lib/http.mjs";
import {
  checkCredentials,
  issueSession,
  isAuthenticated,
  sessionCookieHeader,
  clearSessionCookie,
  credentialsConfigured
} from "./_lib/auth.mjs";

async function readJson(request) {
  try {
    const body = await request.json();
    return body && typeof body === "object" ? body : {};
  } catch (error) {
    return {};
  }
}

async function fetchAsset(env, pathname, url) {
  const assetRequest = new Request(new URL(pathname, url));
  return env.ASSETS.fetch(assetRequest);
}

function redirectTo(location) {
  return new Response(null, {
    status: 302,
    headers: { Location: location }
  });
}

function secureRequest(request) {
  return String(request.url || "").toLowerCase().startsWith("https:");
}

async function servePublicPage(context, renderer) {
  const { env, request } = context;
  const siteData = await loadSiteData(env);
  const html = renderer(siteData);
  return htmlResponse(html);
}

async function requireAdmin(request, env) {
  return await isAuthenticated(request, env);
}

function jsonApiError(status, message) {
  return jsonResponse({ ok: false, error: message }, status);
}

async function siteDataForAdmin(env) {
  return await loadSiteData(env);
}

function safeText(value, fallback = "") {
  const text = String(value ?? "").trim();
  return text || fallback;
}

function articleFromBody(body, existingSlugs, currentArticle) {
  const source = currentArticle || {};
  const slugBase = slugify(body.slug || body.title || source.slug || "untitled");
  let slug = slugBase;
  let counter = 2;
  while (existingSlugs.has(slug)) {
    if (currentArticle && String(currentArticle.slug) === slug) break;
    slug = `${slugBase}-${counter}`;
    counter += 1;
  }
  const category = normalizeCategory(body.category || source.category || "essays");
  return {
    id: String(body.id || source.id || ""),
    slug,
    category,
    title: safeText(body.title || source.title, "未命名文章"),
    date: String(body.date || source.date || ""),
    summary: String(body.summary || source.summary || ""),
    tags: Array.isArray(body.tags) ? body.tags.map(String) : Array.isArray(source.tags) ? source.tags.map(String) : [],
    cover: String(body.cover || source.cover || ""),
    markdown: String(body.markdown ?? source.markdown ?? ""),
    status: String(body.status || source.status || "draft"),
    origin: "admin"
  };
}

async function handleApiGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const pathname = url.pathname;

  if (pathname === "/api/admin/session") {
    const authenticated = await requireAdmin(request, env);
    return jsonResponse({
      ok: true,
      authenticated,
      credentialsConfigured: credentialsConfigured(env)
    });
  }

  if (!(await requireAdmin(request, env))) {
    return jsonApiError(401, "未登录或登录已过期");
  }

  if (pathname === "/api/admin/site-data") {
    return jsonResponse({ ok: true, data: await siteDataForAdmin(env) });
  }

  if (pathname === "/api/admin/articles") {
    const d1Articles = await loadArticles(env, true);
    const repoArticles = await loadRepoArticles(env, request);
    return jsonResponse({ ok: true, articles: mergeArticles(d1Articles, repoArticles) });
  }

  return jsonApiError(404, "接口不存在");
}

async function handleApiPost(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const pathname = url.pathname;

  if (pathname === "/api/admin/login") {
    const body = await readJson(request);
    const username = String(body.username || "").trim();
    const password = String(body.password || "");
    const remember = Boolean(body.remember);
    if (!checkCredentials(username, password, env)) {
      return jsonApiError(401, "账号或密码不正确");
    }
    const token = await issueSession(username, remember, env);
    const headers = {
      "Set-Cookie": sessionCookieHeader(token, remember, secureRequest(request))
    };
    return jsonResponse({ ok: true }, 200, headers);
  }

  if (pathname === "/api/admin/logout") {
    return jsonResponse(
      { ok: true },
      200,
      { "Set-Cookie": clearSessionCookie(secureRequest(request)) }
    );
  }

  if (!(await requireAdmin(request, env))) {
    return jsonApiError(401, "未登录或登录已过期");
  }

  if (pathname === "/api/admin/articles") {
    const body = await readJson(request);
    const d1Articles = await loadArticles(env, true);
    const repoArticles = await loadRepoArticles(env, request);
    const all = mergeArticles(d1Articles, repoArticles);
    const existingSlugs = new Set(all.map((article) => article.slug).filter(Boolean));
    const article = articleFromBody(body, existingSlugs);
    article.bodyHtml = renderMarkdown(article.markdown);
    await saveArticle(env, article);
    return jsonResponse({ ok: true, article }, 201);
  }

  return jsonApiError(404, "接口不存在");
}

async function handleApiPut(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const pathname = url.pathname;
  if (!(await requireAdmin(request, env))) {
    return jsonApiError(401, "未登录或登录已过期");
  }

  if (pathname === "/api/admin/site-data") {
    const body = await readJson(request);
    const sections = Object.keys(body || {});
    for (const key of sections) {
      if (!Object.prototype.hasOwnProperty.call(DEFAULTS, key)) continue;
      await upsertSetting(env, key, body[key]);
    }
    return jsonResponse({ ok: true, data: await siteDataForAdmin(env) });
  }

  if (pathname.startsWith("/api/admin/articles/")) {
    const idOrSlug = decodeURIComponent(pathname.slice("/api/admin/articles/".length));
    const d1Articles = await loadArticles(env, true);
    const repoArticles = await loadRepoArticles(env, request);
    const all = mergeArticles(d1Articles, repoArticles);
    const current = all.find((article) => article.id === idOrSlug || article.slug === idOrSlug);
    if (!current) return jsonApiError(404, "文章不存在");
    const body = await readJson(request);
    const existingSlugs = new Set(all.map((article) => article.slug).filter(Boolean));
    const article = articleFromBody(body, existingSlugs, current);
    article.id = current.id || `admin-${article.slug}`;
    article.bodyHtml = renderMarkdown(article.markdown);
    await saveArticle(env, article);
    return jsonResponse({ ok: true, article });
  }

  return jsonApiError(404, "接口不存在");
}

async function handleApiDelete(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const pathname = url.pathname;
  if (!(await requireAdmin(request, env))) {
    return jsonApiError(401, "未登录或登录已过期");
  }
  if (pathname.startsWith("/api/admin/articles/")) {
    const idOrSlug = decodeURIComponent(pathname.slice("/api/admin/articles/".length));
    await deleteArticle(env, idOrSlug);
    return jsonResponse({ ok: true });
  }
  return jsonApiError(404, "接口不存在");
}

async function routeAdminGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const pathname = url.pathname;
  const authenticated = await requireAdmin(request, env);

  if (pathname === "/admin/dashboard.html") {
    if (!authenticated) return redirectTo("/admin/");
    const asset = await fetchAsset(env, "/admin/dashboard.html", url);
    return asset;
  }

  if (pathname === "/admin/" || pathname === "/admin" || pathname === "/admin/index.html") {
    if (authenticated) return redirectTo("/admin/dashboard.html");
    const asset = await fetchAsset(env, "/admin/index.html", url);
    return asset;
  }

  if (pathname.startsWith("/admin/")) {
    return await fetchAsset(env, pathname, url);
  }

  return null;
}

async function routePublicGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const pathname = url.pathname;
  const siteData = await loadSiteData(env);

  if (pathname === "/" || pathname === "/index.html") {
    return htmlResponse(renderHomePage(siteData));
  }
  if (pathname === "/essays.html" || pathname === "/fiction.html" || pathname === "/tech.html") {
    const id = pathname.slice(1, pathname.lastIndexOf(".html"));
    const articles = await loadPublicArticles(env, request);
    return htmlResponse(renderCategoryPage(siteData, articles, id));
  }
  if (pathname === "/ai-art.html") {
    return htmlResponse(renderGalleryPage(siteData));
  }
  if (pathname === "/books.html") {
    return htmlResponse(renderBooksPage(siteData));
  }
  if (pathname === "/about.html") {
    return htmlResponse(renderAboutPage(siteData));
  }

  const postMatch = pathname.match(/^\/posts\/(.+)\.html$/);
  if (postMatch) {
    const slug = decodeURIComponent(postMatch[1]);
    const articles = await loadPublicArticles(env, request);
    const article = articles.find((item) => item.slug === slug);
    if (article) return htmlResponse(renderArticlePage(siteData, article));
  }

  return null;
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const pathname = url.pathname;

  if (pathname.startsWith("/api/")) {
    return await handleApiGet(context);
  }

  const adminResponse = await routeAdminGet(context);
  if (adminResponse) return adminResponse;

  const publicResponse = await routePublicGet(context);
  if (publicResponse) return publicResponse;

  const asset = await fetchAsset(env, pathname, url);
  if (asset && asset.status !== 404) return asset;

  const siteData = await loadSiteData(env);
  return htmlResponse(renderNotFound(siteData), 404);
}

export async function onRequestPost(context) {
  const { request } = context;
  const url = new URL(request.url);
  if (!url.pathname.startsWith("/api/")) {
    return jsonApiError(404, "接口不存在");
  }
  return await handleApiPost(context);
}

export async function onRequestPut(context) {
  const { request } = context;
  const url = new URL(request.url);
  if (!url.pathname.startsWith("/api/")) {
    return jsonApiError(404, "接口不存在");
  }
  return await handleApiPut(context);
}

export async function onRequestDelete(context) {
  const { request } = context;
  const url = new URL(request.url);
  if (!url.pathname.startsWith("/api/")) {
    return jsonApiError(404, "接口不存在");
  }
  return await handleApiDelete(context);
}
