(function () {
  "use strict";

  async function requestJson(path, options) {
    const response = await fetch(path, {
      credentials: "same-origin",
      ...(options || {})
    });
    const data = await response.json().catch(function () {
      return {};
    });
    return { ok: response.ok, status: response.status, data: data };
  }

  async function isAuthed() {
    const result = await requestJson("/api/admin/session");
    return result.ok && Boolean(result.data.authenticated);
  }

  async function requireAuth() {
    if (await isAuthed()) return true;
    window.location.replace("index.html");
    return false;
  }

  async function attemptLogin(username, password, remember) {
    const result = await requestJson("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: username,
        password: password,
        remember: Boolean(remember)
      })
    });
    return result.ok;
  }

  async function logout() {
    await requestJson("/api/admin/logout", { method: "POST" });
    window.location.replace("index.html");
  }

  window.AdminAuth = {
    isAuthed: isAuthed,
    requireAuth: requireAuth,
    attemptLogin: attemptLogin,
    logout: logout
  };
})();
