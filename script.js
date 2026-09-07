(function () {
  "use strict";

  function addRipple(target, event) {
    const rect = target.getBoundingClientRect();
    const ripple = document.createElement("span");
    ripple.className = "click-ripple";
    ripple.style.left = `${event.clientX - rect.left}px`;
    ripple.style.top = `${event.clientY - rect.top}px`;
    target.appendChild(ripple);
    setTimeout(function () {
      ripple.remove();
    }, 600);
  }

  function initRipple() {
    document
      .querySelectorAll(".nav-bubble, .btn, .filter-btn, .tool-btn, .preset-card")
      .forEach(function (target) {
        target.addEventListener("pointerdown", function (event) {
          addRipple(target, event);
        });
      });
  }

  function initFilters() {
    const filterButtons = document.querySelectorAll(".filter-btn");
    const postCards = document.querySelectorAll(".post-card:not(.add-new-post-card)");
    if (!filterButtons.length || !postCards.length) return;

    filterButtons.forEach(function (button) {
      button.addEventListener("click", function () {
        filterButtons.forEach(function (item) {
          item.classList.remove("active");
        });
        button.classList.add("active");
        const filter = button.dataset.filter || "all";

        postCards.forEach(function (card) {
          const categories = card.dataset.categories || "";
          card.style.display =
            filter === "all" || categories.includes(filter) ? "block" : "none";
        });
      });
    });
  }

  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
      anchor.addEventListener("click", function (event) {
        const target = document.querySelector(anchor.getAttribute("href"));
        if (!target) return;
        event.preventDefault();
        target.scrollIntoView({ behavior: "smooth" });
      });
    });
  }

  function ready() {
    initRipple();
    initFilters();
    initSmoothScroll();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", ready);
  } else {
    ready();
  }

  window.addEventListener("load", function () {
    document.body.classList.add("loaded");
  });
})();
