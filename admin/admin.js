(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", async function () {
    if (!window.AdminAuth) return;
    if (!(await window.AdminAuth.requireAuth())) return;

    const logoutButton = document.getElementById("logout-btn");
    if (logoutButton) {
      logoutButton.addEventListener("click", function (event) {
        event.preventDefault();
        window.AdminAuth.logout();
      });
    }

    const navItems = Array.from(document.querySelectorAll(".admin-nav-item"));
    const sections = Array.from(document.querySelectorAll(".admin-section"));

    function activate(targetId) {
      navItems.forEach(function (item) {
        item.classList.toggle("active", item.getAttribute("href").slice(1) === targetId);
      });
      sections.forEach(function (section) {
        section.classList.toggle("active", section.id === targetId);
      });
      const target = document.getElementById(targetId);
      if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    navItems.forEach(function (item) {
      item.addEventListener("click", function (event) {
        event.preventDefault();
        activate(item.getAttribute("href").slice(1));
      });
    });
  });
})();
