const APPEARANCE_KEY = "blogAppearance";

const DEFAULT_APPEARANCE = {
  image: 'url("assets/bg-mist-morning.jpg")',
  backdropOpacity: 0.78,
  backdropBlur: 18,
  panelOpacity: 0.82,
  panelBlur: 12,
  contentWidth: 1100
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
  root.style.setProperty(
    "--backdrop-opacity",
    String(saved.backdropOpacity ?? saved.opacity ?? DEFAULT_APPEARANCE.backdropOpacity)
  );
  root.style.setProperty(
    "--backdrop-blur",
    `${saved.backdropBlur ?? saved.blur ?? DEFAULT_APPEARANCE.backdropBlur}px`
  );
  root.style.setProperty(
    "--panel-opacity",
    String(saved.panelOpacity ?? saved.opacity ?? DEFAULT_APPEARANCE.panelOpacity)
  );
  root.style.setProperty(
    "--panel-blur",
    `${saved.panelBlur ?? saved.blur ?? DEFAULT_APPEARANCE.panelBlur}px`
  );
  root.style.setProperty(
    "--content-width",
    `${saved.contentWidth ?? DEFAULT_APPEARANCE.contentWidth}px`
  );
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
  const backdropOpacityRange = document.getElementById("backdrop-opacity-range");
  const backdropBlurRange = document.getElementById("backdrop-blur-range");
  const panelOpacityRange = document.getElementById("panel-opacity-range");
  const panelBlurRange = document.getElementById("panel-blur-range");
  const contentWidthRange = document.getElementById("content-width-range");
  const backdropOpacityValue = document.getElementById("backdrop-opacity-value");
  const backdropBlurValue = document.getElementById("backdrop-blur-value");
  const panelOpacityValue = document.getElementById("panel-opacity-value");
  const panelBlurValue = document.getElementById("panel-blur-value");
  const contentWidthValue = document.getElementById("content-width-value");
  const statusLine = document.getElementById("status-line");
  if (
    !imageInput ||
    !backdropOpacityRange ||
    !backdropBlurRange ||
    !panelOpacityRange ||
    !panelBlurRange ||
    !contentWidthRange
  ) return;

  const saved = getSavedAppearance();
  if (saved.image) {
    const match = saved.image.match(/url\(["']?(.+?)["']?\)/);
    if (match) imageInput.value = match[1];
  }
  backdropOpacityRange.value =
    saved.backdropOpacity ?? saved.opacity ?? DEFAULT_APPEARANCE.backdropOpacity;
  backdropBlurRange.value =
    saved.backdropBlur ?? saved.blur ?? DEFAULT_APPEARANCE.backdropBlur;
  panelOpacityRange.value =
    saved.panelOpacity ?? saved.opacity ?? DEFAULT_APPEARANCE.panelOpacity;
  panelBlurRange.value = saved.panelBlur ?? saved.blur ?? DEFAULT_APPEARANCE.panelBlur;
  contentWidthRange.value = saved.contentWidth ?? DEFAULT_APPEARANCE.contentWidth;

  const syncLabels = () => {
    if (backdropOpacityValue) {
      backdropOpacityValue.textContent = `${Math.round(backdropOpacityRange.value * 100)}%`;
    }
    if (backdropBlurValue) backdropBlurValue.textContent = `${backdropBlurRange.value}px`;
    if (panelOpacityValue) {
      panelOpacityValue.textContent = `${Math.round(panelOpacityRange.value * 100)}%`;
    }
    if (panelBlurValue) panelBlurValue.textContent = `${panelBlurRange.value}px`;
    if (contentWidthValue) contentWidthValue.textContent = `${contentWidthRange.value}px`;
  };
  syncLabels();

  const previewFromInputs = () => {
    const root = document.documentElement;
    const image = imageInput.value.trim()
      ? `url("${imageInput.value.trim()}")`
      : DEFAULT_APPEARANCE.image;
    root.style.setProperty("--bg-image", image);
    root.style.setProperty("--backdrop-opacity", String(backdropOpacityRange.value));
    root.style.setProperty("--backdrop-blur", `${backdropBlurRange.value}px`);
    root.style.setProperty("--panel-opacity", String(panelOpacityRange.value));
    root.style.setProperty("--panel-blur", `${panelBlurRange.value}px`);
    root.style.setProperty("--content-width", `${contentWidthRange.value}px`);
    syncLabels();
  };

  imageInput.addEventListener("input", previewFromInputs);
  backdropOpacityRange.addEventListener("input", previewFromInputs);
  backdropBlurRange.addEventListener("input", previewFromInputs);
  panelOpacityRange.addEventListener("input", previewFromInputs);
  panelBlurRange.addEventListener("input", previewFromInputs);
  contentWidthRange.addEventListener("input", previewFromInputs);

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
        backdropOpacity: Number(backdropOpacityRange.value),
        backdropBlur: Number(backdropBlurRange.value),
        panelOpacity: Number(panelOpacityRange.value),
        panelBlur: Number(panelBlurRange.value),
        contentWidth: Number(contentWidthRange.value)
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
      backdropOpacityRange.value = DEFAULT_APPEARANCE.backdropOpacity;
      backdropBlurRange.value = DEFAULT_APPEARANCE.backdropBlur;
      panelOpacityRange.value = DEFAULT_APPEARANCE.panelOpacity;
      panelBlurRange.value = DEFAULT_APPEARANCE.panelBlur;
      contentWidthRange.value = DEFAULT_APPEARANCE.contentWidth;
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
