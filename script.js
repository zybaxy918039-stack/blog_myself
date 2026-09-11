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

  function initBackgroundSlideshow() {
    const dataNode = document.getElementById("background-slideshow-data");
    const stage = document.querySelector(".background-slideshow");
    if (!dataNode || !stage) return;

    let config;
    try {
      config = JSON.parse(dataNode.textContent || "{}");
    } catch (error) {
      return;
    }
    if (!config.enabled || !Array.isArray(config.images)) return;

    function normalizeUrl(value) {
      const url = String(value || "").trim();
      if (!url || /^javascript:/i.test(url)) return "";
      if (/^(https?:|data:image\/|blob:|\/)/i.test(url)) return url;
      return "/" + url.replace(/^\.\//, "").replace(/^(\.\.\/)+/, "");
    }

    const urls = config.images
      .map(normalizeUrl)
      .filter(function (value, index, values) {
        return value && values.indexOf(value) === index;
      });
    if (!urls.length) return;

    const current = stage.querySelector(".background-slide-current");
    const next = stage.querySelector(".background-slide-next");
    const ripple = document.querySelector(".background-ripple-field");
    const backdrop = document.querySelector(".backdrop-layer");
    if (!current || !next || !ripple || !backdrop) return;

    const transitionMs = Math.min(6000, Math.max(600, Number(config.transitionMs) || 1800));
    const intervalMs = Math.max(3000, Number(config.intervalMs) || 10000);
    const strength = Math.min(1, Math.max(0.15, Number(config.rippleStrength) || 0.68));
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let timer = 0;
    let index = 0;
    let running = false;

    function cssImage(url) {
      return "url(" + JSON.stringify(url) + ")";
    }

    function preload(url) {
      return new Promise(function (resolve) {
        const image = new Image();
        let settled = false;
        const timeout = window.setTimeout(function () { finish(""); }, 8000);
        function finish(result) {
          if (settled) return;
          settled = true;
          window.clearTimeout(timeout);
          image.onload = null;
          image.onerror = null;
          resolve(result);
        }
        image.onload = function () { finish(url); };
        image.onerror = function () { finish(""); };
        image.src = url;
      });
    }

    function schedule(images) {
      window.clearTimeout(timer);
      if (document.hidden || images.length < 2 || reducedMotion) return;
      timer = window.setTimeout(function () { transition(images); }, intervalMs);
    }

    function createRipples() {
      ripple.replaceChildren();
      const count = 3 + Math.round(strength);
      const positions = [
        [18, 24],
        [74, 28],
        [36, 76],
        [84, 72]
      ];
      for (let i = 0; i < count; i += 1) {
        const drop = document.createElement("span");
        drop.className = "water-drop";
        drop.style.setProperty("--drop-x", positions[i][0] + "%");
        drop.style.setProperty("--drop-y", positions[i][1] + "%");
        drop.style.setProperty("--drop-size", "clamp(260px, 58vmax, 900px)");
        drop.style.setProperty("--drop-delay", Math.round(transitionMs * (0.02 + i * 0.04 + Math.random() * 0.018)) + "ms");
        for (let ring = 0; ring < 3; ring += 1) {
          drop.appendChild(document.createElement("span"));
        }
        ripple.appendChild(drop);
      }
    }

    function transition(images) {
      if (running || document.hidden) {
        schedule(images);
        return;
      }
      running = true;
      const nextIndex = (index + 1) % images.length;
      stage.style.setProperty("--ripple-duration", transitionMs + "ms");
      stage.style.setProperty("--ripple-strength", String(strength));
      stage.style.setProperty("--lake-blur", 6 + Math.round(strength * 10) + "px");
      ripple.style.setProperty("--ripple-duration", transitionMs + "ms");
      ripple.style.setProperty("--ripple-strength", String(strength));
      ripple.style.setProperty("--ripple-opacity", String(0.25 + strength * 0.55));
      backdrop.style.setProperty("--ripple-duration", transitionMs + "ms");
      backdrop.style.setProperty("--lake-transition-blur", 4 + Math.round(strength * 8) + "px");
      createRipples();
      next.style.backgroundImage = cssImage(images[nextIndex]);
      current.classList.remove("is-blurring");
      next.classList.remove("is-settling-in");
      ripple.classList.remove("is-active");
      backdrop.classList.remove("is-lake-blurring");
      void stage.offsetWidth;
      current.classList.add("is-blurring");
      next.classList.add("is-settling-in");
      ripple.classList.add("is-active");
      backdrop.classList.add("is-lake-blurring");

      window.setTimeout(function () {
        current.style.backgroundImage = cssImage(images[nextIndex]);
        current.classList.remove("is-blurring");
        next.classList.remove("is-settling-in");
        next.style.backgroundImage = "";
        ripple.classList.remove("is-active");
        backdrop.classList.remove("is-lake-blurring");
        ripple.replaceChildren();
        index = nextIndex;
        running = false;
        schedule(images);
      }, transitionMs);
    }

    Promise.all(urls.map(preload)).then(function (results) {
      const images = results.filter(Boolean);
      if (!images.length) return;
      stage.style.setProperty("--ripple-duration", transitionMs + "ms");
      stage.style.setProperty("--ripple-strength", String(strength));
      ripple.style.setProperty("--ripple-duration", transitionMs + "ms");
      ripple.style.setProperty("--ripple-strength", String(strength));
      current.style.backgroundImage = cssImage(images[0]);
      current.classList.add("is-visible");
      schedule(images);
      document.addEventListener("visibilitychange", function () { schedule(images); });
    });
  }

  function ready() {
    initBackgroundSlideshow();
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
