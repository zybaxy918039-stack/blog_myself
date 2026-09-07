(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", async function () {
    if (!window.AdminAuth) return;

    if (await window.AdminAuth.isAuthed()) {
      window.location.replace("dashboard.html");
      return;
    }

    const form = document.getElementById("login-form");
    const error = document.getElementById("login-error");
    const submit = form ? form.querySelector('button[type="submit"]') : null;
    if (!form || !error) return;

    form.addEventListener("submit", async function (event) {
      event.preventDefault();
      const username = document.getElementById("login-username").value.trim();
      const password = document.getElementById("login-password").value;
      const remember = document.getElementById("login-remember").checked;

      if (submit) submit.disabled = true;
      error.hidden = true;

      const ok = await window.AdminAuth.attemptLogin(username, password, remember);
      if (submit) submit.disabled = false;

      if (ok) {
        window.location.href = "dashboard.html";
      } else {
        error.hidden = false;
        document.getElementById("login-password").value = "";
        document.getElementById("login-password").focus();
      }
    });
  });
})();
