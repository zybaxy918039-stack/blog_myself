import path from "node:path";
import { spawn } from "node:child_process";
import { writeFile } from "node:fs/promises";

const API = "https://api.cloudflare.com/client/v4";
const token = process.env.CLOUDFLARE_API_TOKEN;
const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
const d1Name = process.env.CLOUDFLARE_D1_NAME || "blog-comments-db";
const r2Bucket = process.env.CLOUDFLARE_R2_BUCKET || "blog-attachments";
const projectName =
  process.env.CLOUDFLARE_PAGES_PROJECT ||
  (process.env.GITHUB_REPOSITORY
    ? sanitize(process.env.GITHUB_REPOSITORY.split("/")[1] || "blog-site")
    : "blog-site");

function sanitize(value) {
  return String(value || "blog-site")
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function requireConfig() {
  const missing = [];
  if (!token) missing.push("CLOUDFLARE_API_TOKEN");
  if (!accountId) missing.push("CLOUDFLARE_ACCOUNT_ID");
  if (missing.length) {
    console.error(`缺少环境变量: ${missing.join(", ")}`);
    console.error("请在 GitHub Actions Secrets 中配置这两个值，或在本地运行前导入它们。");
    process.exit(2);
  }
}

async function apiRequest(pathname, options = {}) {
  const response = await fetch(`${API}${pathname}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok || body.success === false) {
    throw new Error(`${pathname} -> ${response.status}: ${JSON.stringify(body.errors || body)}`);
  }
  return body.result;
}

async function ensureD1() {
  const databases = await apiRequest(`/accounts/${accountId}/d1/database`);
  const existing = databases.find((item) => item.name === d1Name);
  if (existing) {
    console.log(`D1 exists: ${d1Name} (${existing.uuid})`);
    return existing.uuid;
  }
  const created = await apiRequest(`/accounts/${accountId}/d1/database`, {
    method: "POST",
    body: JSON.stringify({ name: d1Name })
  });
  console.log(`D1 created: ${d1Name} (${created.uuid})`);
  return created.uuid;
}

async function ensureR2() {
  const result = await apiRequest(`/accounts/${accountId}/r2/buckets`);
  const buckets = Array.isArray(result) ? result : result.buckets || [];
  if (buckets.some((item) => item.name === r2Bucket)) {
    console.log(`R2 bucket exists: ${r2Bucket}`);
    return;
  }
  await apiRequest(`/accounts/${accountId}/r2/buckets`, {
    method: "POST",
    body: JSON.stringify({ name: r2Bucket })
  });
  console.log(`R2 bucket created: ${r2Bucket}`);
}

function runWrangler(args) {
  return new Promise((resolve, reject) => {
    const executable = process.platform === "win32" ? "npx.cmd" : "npx";
    const child = spawn(executable, args, {
      stdio: "inherit",
      env: { ...process.env, CI: "1" }
    });
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`wrangler exited with code ${code}`));
    });
  });
}

async function writeConfig(databaseId) {
  const lines = [
    `name = "${projectName}"`,
    `pages_build_output_dir = "./dist"`,
    `compatibility_date = "2026-09-05"`,
    `compatibility_flags = ["nodejs_compat"]`,
    "",
    "[[d1_databases]]",
    `binding = "BLOG_COMMENTS_DB"`,
    `database_name = "${d1Name}"`,
    `database_id = "${databaseId}"`,
    "",
    "[[r2_buckets]]",
    `binding = "BLOG_ATTACHMENTS"`,
    `bucket_name = "${r2Bucket}"`,
    ""
  ];
  await writeFile(path.resolve("wrangler.ci.toml"), lines.join("\n"), "utf8");
  console.log(`wrangler.ci.toml written for Pages project: ${projectName}`);
}

async function main() {
  requireConfig();
  const databaseId = await ensureD1();
  await ensureR2();
  console.log("applying migrations/0001_init.sql to remote D1 ...");
  await runWrangler([
    "wrangler",
    "d1",
    "execute",
    d1Name,
    "--file",
    path.join("migrations", "0001_init.sql"),
    "--remote",
    "--yes"
  ]);
  await writeConfig(databaseId);
  console.log("Cloudflare resources ready.");
}

main().catch((error) => {
  console.error(String(error && error.stack ? error.stack : error));
  process.exit(1);
});
