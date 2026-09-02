/* 本地管理后台鉴权（原型） */
(function () {
  "use strict";

  // 部署前请修改这两个值。纯静态站的前端鉴权只能作为本地原型，
  // 正式上线时建议改用 Cloudflare Access 或 Cloudflare Worker 校验。
  const ADMIN_CONFIG = {
    username: "admin",
    password: "blog2026"
  };

  const SESSION_KEY = "blogAdminSession";
  const REMEMBER_KEY = "blogAdminRemember";

  function isAuthed() {
    try {
      if (window.sessionStorage.getItem(SESSION_KEY) === "1") return true;
    } catch (error) {
      // ignore
    }
    try {
      if (window.localStorage.getItem(REMEMBER_KEY) === "1") return true;
    } catch (error) {
      // ignore
    }
    return false;
  }

  function requireAuth() {
    if (isAuthed()) return true;
    window.location.replace("index.html");
    return false;
  }

  function attemptLogin(username, password, remember) {
    if (username !== ADMIN_CONFIG.username || password !== ADMIN_CONFIG.password) {
      return false;
    }
    try {
      window.sessionStorage.setItem(SESSION_KEY, "1");
    } catch (error) {
      // ignore
    }
    try {
      if (remember) {
        window.localStorage.setItem(REMEMBER_KEY, "1");
      } else {
        window.localStorage.removeItem(REMEMBER_KEY);
      }
    } catch (error) {
      // ignore
    }
    return true;
  }

  function logout() {
    try {
      window.sessionStorage.removeItem(SESSION_KEY);
      window.localStorage.removeItem(REMEMBER_KEY);
    } catch (error) {
      // ignore
    }
    window.location.replace("index.html");
  }

  window.AdminAuth = {
    isAuthed: isAuthed,
    requireAuth: requireAuth,
    attemptLogin: attemptLogin,
    logout: logout
  };
})();
