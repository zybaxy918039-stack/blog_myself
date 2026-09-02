(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", function () {
    if (window.AdminAuth && window.AdminAuth.isAuthed()) {
      window.location.replace("dashboard.html");
      return;
    }

    const form = document.getElementById("login-form");
    const error = document.getElementById("login-error");
    if (!form || !error) return;

    form.addEventListener("submit", function (event) {
      event.preventDefault();
      const username = document.getElementById("login-username").value.trim();
      const password = document.getElementById("login-password").value;
      const remember = document.getElementById("login-remember").checked;

      if (window.AdminAuth.attemptLogin(username, password, remember)) {
        window.location.href = "dashboard.html";
      } else {
        error.hidden = false;
        document.getElementById("login-password").value = "";
        document.getElementById("login-password").focus();
      }
    });
  });
})();
