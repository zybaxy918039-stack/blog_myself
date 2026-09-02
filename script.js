const APPEARANCE_KEY = "blogAppearance";

const DEFAULT_APPEARANCE = {
  image: 'url("assets/bg-mist-morning.jpg")',
  opacity: 0.78,
  blur: 18
};

function getSavedAppearance() {
  try {
    const raw = localStorage.getItem(APPEARANCE_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch (error) {
    return {};
  }
}

function applyAppearance() {
  const saved = getSavedAppearance();
  const root = document.documentElement;
  root.style.setProperty("--bg-image", saved.image || DEFAULT_APPEARANCE.image);
  root.style.setProperty("--glass-opacity", String(saved.opacity ?? DEFAULT_APPEARANCE.opacity));
  root.style.setProperty("--glass-blur", `${saved.blur ?? DEFAULT_APPEARANCE.blur}px`);
}

function addRipple(target, event) {
  const rect = target.getBoundingClientRect();
  const ripple = document.createElement("span");
  ripple.className = "click-ripple";
  ripple.style.left = `${event.clientX - rect.left}px`;
  ripple.style.top = `${event.clientY - rect.top}px`;
  target.appendChild(ripple);
  setTimeout(() => ripple.remove(), 600);
}

function initRipple() {
  const targets = document.querySelectorAll(
    ".nav-bubble, .btn, .filter-btn, .tool-btn, .preset-card"
  );
  targets.forEach((target) => {
    target.addEventListener("pointerdown", (event) => addRipple(target, event));
  });
}

function initFilters() {
  const filterButtons = document.querySelectorAll(".filter-btn");
  const postCards = document.querySelectorAll(".post-card:not(.add-new-post-card)");

  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      filterButtons.forEach((btn) => btn.classList.remove("active"));
      button.classList.add("active");
      const filter = button.dataset.filter;

      postCards.forEach((card) => {
        const categories = card.dataset.categories || "";
        const visible = filter === "all" || categories.includes(filter);
        card.style.display = visible ? "block" : "none";
      });
    });
  });
}

function initAppearanceControls() {
  const imageInput = document.getElementById("bg-url");
  const opacityRange = document.getElementById("opacity-range");
  const blurRange = document.getElementById("blur-range");
  const opacityValue = document.getElementById("opacity-value");
  const blurValue = document.getElementById("blur-value");
  const statusLine = document.getElementById("status-line");
  if (!imageInput || !opacityRange || !blurRange) return;

  const saved = getSavedAppearance();
  if (saved.image) {
    const match = saved.image.match(/url\(["']?(.+?)["']?\)/);
    if (match) imageInput.value = match[1];
  }
  opacityRange.value = saved.opacity ?? DEFAULT_APPEARANCE.opacity;
  blurRange.value = saved.blur ?? DEFAULT_APPEARANCE.blur;

  const syncLabels = () => {
    if (opacityValue) opacityValue.textContent = `${Math.round(opacityRange.value * 100)}%`;
    if (blurValue) blurValue.textContent = `${blurRange.value}px`;
  };
  syncLabels();

  const previewFromInputs = () => {
    const root = document.documentElement;
    const image = imageInput.value.trim()
      ? `url("${imageInput.value.trim()}")`
      : DEFAULT_APPEARANCE.image;
    root.style.setProperty("--bg-image", image);
    root.style.setProperty("--glass-opacity", String(opacityRange.value));
    root.style.setProperty("--glass-blur", `${blurRange.value}px`);
    syncLabels();
  };

  imageInput.addEventListener("input", previewFromInputs);
  opacityRange.addEventListener("input", previewFromInputs);
  blurRange.addEventListener("input", previewFromInputs);

  document.querySelectorAll(".preset-card[data-image]").forEach((card) => {
    card.addEventListener("click", () => {
      document.querySelectorAll(".preset-card").forEach((item) => item.classList.remove("active"));
      card.classList.add("active");
      imageInput.value = card.dataset.image;
      previewFromInputs();
    });
  });

  const saveButton = document.getElementById("save-appearance");
  if (saveButton) {
    saveButton.addEventListener("click", () => {
      const appearance = {
        image: imageInput.value.trim()
          ? `url("${imageInput.value.trim()}")`
          : DEFAULT_APPEARANCE.image,
        opacity: Number(opacityRange.value),
        blur: Number(blurRange.value)
      };
      try {
        localStorage.setItem(APPEARANCE_KEY, JSON.stringify(appearance));
        applyAppearance();
        if (statusLine) statusLine.textContent = "已保存到本地偏好";
      } catch (error) {
        if (statusLine) statusLine.textContent = "浏览器未允许保存";
      }
    });
  }

  const resetButton = document.getElementById("reset-appearance");
  if (resetButton) {
    resetButton.addEventListener("click", () => {
      try {
        localStorage.removeItem(APPEARANCE_KEY);
      } catch (error) {
        // Ignore unavailable storage.
      }
      applyAppearance();
      imageInput.value = "assets/bg-mist-morning.jpg";
      opacityRange.value = DEFAULT_APPEARANCE.opacity;
      blurRange.value = DEFAULT_APPEARANCE.blur;
      syncLabels();
      document.querySelectorAll(".preset-card").forEach((card) => {
        card.classList.toggle("active", card.dataset.image === "assets/bg-mist-morning.jpg");
      });
      if (statusLine) statusLine.textContent = "已恢复默认外观";
    });
  }
}

document.addEventListener("DOMContentLoaded", function () {
  applyAppearance();
  initRipple();
  initFilters();
  initAppearanceControls();

  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", (event) => {
      const target = document.querySelector(anchor.getAttribute("href"));
      if (target) {
        event.preventDefault();
        target.scrollIntoView({ behavior: "smooth" });
      }
    });
  });

  window.addEventListener("load", () => {
    document.body.classList.add("loaded");
  });
});
