export const SESSION_COOKIE = "blog_admin_session";
const SESSION_HOURS = 12;
const REMEMBER_DAYS = 30;

function firstEnv(env, ...names) {
  for (const name of names) {
    const value = env && env[name];
    if (value) return String(value).trim();
  }
  return "";
}

function b64UrlEncode(bytes) {
  let binary = "";
  for (const byte of new Uint8Array(bytes)) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64UrlDecode(value) {
  const base64 = String(value || "")
    .replace(/-/g, "+")
    .replace(/_/g, "/");
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function adminUsername(env) {
  return firstEnv(env, "ADMIN_USERNAME", "BLOG_ADMIN_USERNAME");
}

function adminPassword(env) {
  return firstEnv(env, "ADMIN_PASSWORD", "BLOG_ADMIN_PASSWORD");
}

function sessionSecret(env) {
  return firstEnv(env, "ADMIN_SESSION_SECRET") || adminPassword(env);
}

export function credentialsConfigured(env) {
  return Boolean(adminUsername(env) && adminPassword(env));
}

export function checkCredentials(username, password, env) {
  if (!credentialsConfigured(env)) return false;
  const expectedUser = adminUsername(env);
  const expectedPass = adminPassword(env);
  return String(username || "") === expectedUser && String(password || "") === expectedPass;
}

async function sign(secret, message) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  return new Uint8Array(await crypto.subtle.sign("HMAC", key, encoder.encode(message)));
}

function parseCookies(request) {
  const header = request.headers.get("Cookie") || "";
  const cookies = {};
  for (const part of header.split(";")) {
    const separator = part.indexOf("=");
    if (separator < 0) continue;
    const name = part.slice(0, separator).trim();
    const value = part.slice(separator + 1).trim();
    cookies[name] = value;
  }
  return cookies;
}

export async function issueSession(username, remember, env) {
  const expiresAt =
    Date.now() + (remember ? REMEMBER_DAYS * 24 * 60 * 60 * 1000 : SESSION_HOURS * 60 * 60 * 1000);
  const payload = `${username}\n${expiresAt}\n${SESSION_COOKIE}`;
  const signature = await sign(sessionSecret(env), payload);
  return `${b64UrlEncode(new TextEncoder().encode(username))}.${expiresAt}.${b64UrlEncode(signature)}`;
}

export async function verifyToken(token, env) {
  const parts = String(token || "").split(".");
  if (parts.length !== 3) return false;
  let username = "";
  try {
    username = new TextDecoder().decode(b64UrlDecode(parts[0]));
  } catch (error) {
    return false;
  }
  const expiresAt = Number(parts[1]);
  if (!Number.isFinite(expiresAt) || expiresAt < Date.now()) return false;
  const payload = `${username}\n${expiresAt}\n${SESSION_COOKIE}`;
  const expected = await sign(sessionSecret(env), payload);
  let received;
  try {
    received = b64UrlDecode(parts[2]);
  } catch (error) {
    return false;
  }
  if (expected.length !== received.length) return false;
  let same = 0;
  for (let i = 0; i < expected.length; i += 1) {
    same |= expected[i] ^ received[i];
  }
  if (same !== 0) return false;
  return username === adminUsername(env);
}

export async function isAuthenticated(request, env) {
  const token = parseCookies(request)[SESSION_COOKIE] || "";
  if (!token) return false;
  return await verifyToken(token, env);
}

export function sessionCookieHeader(token, remember, secure) {
  let value = `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax`;
  if (remember) value += `; Max-Age=${REMEMBER_DAYS * 24 * 60 * 60}`;
  if (secure) value += "; Secure";
  return value;
}

export function clearSessionCookie(secure) {
  let value = `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
  if (secure) value += "; Secure";
  return value;
}
