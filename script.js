const APPEARANCE_KEY = "blogAppearance";
const HOME_PROFILE_KEY = "blogHomeProfile";
const MUSIC_KEY = "blogMusic";
const HOME_BUBBLE_BACKGROUNDS_KEY = "blogHomeBubbleBackgrounds";
const HOME_BUBBLE_SETTINGS_KEY = "blogHomeBubbleSettings";

const DEFAULT_APPEARANCE = {
  siteTitle: "雾中书桌",
  siteSubtitle: "个人网络日志",
  image: 'url("assets/bg-mist-morning.jpg")',
  backdropOpacity: 0.78,
  backdropBlur: 18,
  panelOpacity: 0.82,
  panelBlur: 12,
  contentWidth: 1100
};

const DEFAULT_HOME_PROFILE = {
  avatar: "书",
  name: "博主",
  bio: "热爱技术和创作，用这个博客记录生活点滴、技术分享和未完的故事。",
  signature: "把想法留在纸上。"
};

const DEFAULT_MUSIC = {
  title: "未设置音乐",
  artist: "",
  url: ""
};

const DEFAULT_HOME_BUBBLE_BACKGROUNDS = {
  essays: "",
  tech: "",
  books: ""
};

const DEFAULT_HOME_BUBBLE_SETTINGS = {
  essays: {
    eyebrow: "随笔",
    title: "随笔与日常",
    description: "记录一些没有急着变成结论的想法，和生活里值得留下的碎片。",
    background: "",
    titleColor: "#17201f",
    textColor: "#35413f",
    titleSize: 24,
    textSize: 16,
    fontWeight: 700
  },
  tech: {
    eyebrow: "技术",
    title: "技术笔记",
    description: "编程经验、工具使用，以及解决具体问题后留下的过程记录。",
    background: "",
    titleColor: "#17201f",
    textColor: "#35413f",
    titleSize: 24,
    textSize: 16,
    fontWeight: 700
  },
  books: {
    eyebrow: "阅读",
    title: "本周书单",
    subtitle: "在读书与摘录之间，留下一小块慢下来的地方。",
    coverImage: "",
    background: "",
    titleColor: "#17201f",
    textColor: "#35413f",
    titleSize: 22,
    textSize: 15,
    fontWeight: 700
  }
};

function applySiteIdentity(title, subtitle) {
  document.querySelectorAll("[data-site-title]").forEach((element) => {
    element.textContent = title;
  });
  document.querySelectorAll("[data-site-subtitle]").forEach((element) => {
    element.textContent = subtitle;
  });
}

function getSavedAppearance() {
  try {
    const raw = localStorage.getItem(APPEARANCE_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch (error) {
    return {};
  }
}

function getSavedHomeContent() {
  try {
    const rawProfile = localStorage.getItem(HOME_PROFILE_KEY);
    const rawMusic = localStorage.getItem(MUSIC_KEY);
    return {
      profile: rawProfile ? JSON.parse(rawProfile) : {},
      music: rawMusic ? JSON.parse(rawMusic) : {}
    };
  } catch (error) {
    return { profile: {}, music: {} };
  }
}

function getSavedHomeBubbleBackgrounds() {
  try {
    const raw = localStorage.getItem(HOME_BUBBLE_BACKGROUNDS_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch (error) {
    return {};
  }
}

function readLegacyWeeklyCover() {
  try {
    const raw = localStorage.getItem("blogWeeklyCover");
    return raw ? JSON.parse(raw) || {} : {};
  } catch (error) {
    return {};
  }
}

function getSavedHomeBubbleSettings() {
  let saved = {};
  let hasSavedSettings = false;

  try {
    const raw = localStorage.getItem(HOME_BUBBLE_SETTINGS_KEY);
    if (raw) {
      hasSavedSettings = true;
      saved = JSON.parse(raw) || {};
    }
  } catch (error) {
    saved = {};
  }

  const legacyBackgrounds = getSavedHomeBubbleBackgrounds();
  const settings = ["essays", "tech", "books"].reduce((result, key) => {
    result[key] = {
      ...DEFAULT_HOME_BUBBLE_SETTINGS[key],
      ...(saved[key] || {})
    };
    if (!hasSavedSettings && legacyBackgrounds[key]) {
      result[key].background = legacyBackgrounds[key];
    }
    return result;
  }, {});

  if (!hasSavedSettings) {
    const legacyCover = readLegacyWeeklyCover();
    if (legacyCover.image) settings.books.coverImage = legacyCover.image;
    if (legacyCover.title) settings.books.title = legacyCover.title;
    if (legacyCover.subtitle) settings.books.subtitle = legacyCover.subtitle;
  }

  return settings;
}

function applyHomeBubbleBackgrounds() {
  const saved = getSavedHomeBubbleBackgrounds();
  const backgrounds = {
    ...DEFAULT_HOME_BUBBLE_BACKGROUNDS,
    ...saved
  };
  const bubbles = [
    { key: "essays", selector: ".home-bubble-essays" },
    { key: "tech", selector: ".home-bubble-tech" },
    { key: "books", selector: ".home-bubble-books" }
  ];

  bubbles.forEach(({ key, selector }) => {
    const bubble = document.querySelector(selector);
    if (!bubble) return;
    const image = String(backgrounds[key] || "").trim();
    if (image) {
      bubble.style.backgroundImage = `url("${image}")`;
      bubble.classList.add("has-custom-background");
    } else {
      bubble.style.backgroundImage = "";
      bubble.classList.remove("has-custom-background");
    }
  });
}

function setBubbleBackground(bubble, image) {
  const url = String(image || "").trim();
  if (url) {
    bubble.style.backgroundImage = `url("${url}")`;
    bubble.classList.add("has-custom-background");
  } else {
    bubble.style.backgroundImage = "";
    bubble.classList.remove("has-custom-background");
  }
}

function styleBubbleText(element, color, size, weight) {
  if (!element) return;
  if (color) {
    element.style.color = color;
  } else {
    element.style.color = "";
  }
  element.style.fontSize = size ? `${size}px` : "";
  element.style.fontWeight = weight ? String(weight) : "";
}

function applyTextBubble(bubble, settings) {
  if (!bubble) return;

  const eyebrow = bubble.querySelector(".eyebrow");
  const heading = bubble.querySelector(".home-bubble-head h2");
  const paragraph = bubble.querySelector(".home-bubble-head + p");

  if (eyebrow) {
    eyebrow.textContent = settings.eyebrow || "";
    styleBubbleText(
      eyebrow,
      settings.textColor,
      Math.max(11, Math.round(settings.textSize * 0.78)),
      settings.fontWeight
    );
  }

  if (heading) {
    heading.textContent = settings.title || "";
    styleBubbleText(
      heading,
      settings.titleColor,
      settings.titleSize,
      settings.fontWeight
    );
  }

  if (paragraph) {
    paragraph.textContent = settings.description || "";
    styleBubbleText(
      paragraph,
      settings.textColor,
      settings.textSize,
      settings.fontWeight
    );
  }
}

function applyWeeklyCoverStyles(settings) {
  const title = document.querySelector(".home-weekly-cover-title");
  const copy = document.querySelector(".home-weekly-cover-copy p");
  const placeholder = document.querySelector(".home-weekly-cover-placeholder");

  styleBubbleText(title, settings.titleColor, settings.titleSize, settings.fontWeight);
  styleBubbleText(copy, settings.textColor, settings.textSize, settings.fontWeight);
  styleBubbleText(placeholder, settings.titleColor, settings.titleSize, settings.fontWeight);
}

function applyHomeBubbleSettings(savedSettings) {
  const settings = savedSettings || getSavedHomeBubbleSettings();
  const bubbles = [
    { key: "essays", selector: ".home-bubble-essays" },
    { key: "tech", selector: ".home-bubble-tech" },
    { key: "books", selector: ".home-bubble-books" }
  ];

  bubbles.forEach(({ key, selector }) => {
    const bubble = document.querySelector(selector);
    if (!bubble) return;
    setBubbleBackground(bubble, settings[key].background);
  });

  applyTextBubble(document.querySelector(".home-bubble-essays"), settings.essays);
  applyTextBubble(document.querySelector(".home-bubble-tech"), settings.tech);

  const booksBubble = document.querySelector(".home-bubble-books");
  if (booksBubble) {
    const heading = booksBubble.querySelector(".home-bubble-head h2");
    const eyebrow = booksBubble.querySelector(".eyebrow");
    if (heading) {
      heading.textContent = settings.books.title || "";
      styleBubbleText(
        heading,
        settings.books.titleColor,
        settings.books.titleSize,
        settings.books.fontWeight
      );
    }
    if (eyebrow) {
      eyebrow.textContent = settings.books.eyebrow || "";
      styleBubbleText(
        eyebrow,
        settings.books.textColor,
        Math.max(11, Math.round(settings.books.textSize * 0.78)),
        settings.books.fontWeight
      );
    }
  }

  if (window.BlogLibrary) {
    window.BlogLibrary.saveWeeklyCover({
      image: settings.books.coverImage,
      title: settings.books.title,
      subtitle: settings.books.subtitle
    });
    window.BlogLibrary.renderHome();
  }

  applyWeeklyCoverStyles(settings.books);
}

function applyHomeContent() {
  const saved = getSavedHomeContent();
  const profile = {
    ...DEFAULT_HOME_PROFILE,
    ...saved.profile
  };
  const music = {
    ...DEFAULT_MUSIC,
    ...saved.music
  };

  const avatar = document.querySelector("[data-profile-avatar]");
  const name = document.querySelector("[data-profile-name]");
  const bio = document.querySelector("[data-profile-bio]");
  const signature = document.querySelector("[data-profile-signature]");
  if (avatar) avatar.textContent = profile.avatar;
  if (name) name.textContent = profile.name;
  if (bio) bio.textContent = profile.bio;
  if (signature) signature.textContent = profile.signature;

  const title = document.querySelector("[data-music-title]");
  const artist = document.querySelector("[data-music-artist]");
  const empty = document.querySelector("[data-music-empty]");
  const audio = document.getElementById("home-audio-player");
  const musicCard = document.querySelector(".home-music-card");
  if (title) title.textContent = music.title || DEFAULT_MUSIC.title;
  if (artist) {
    artist.textContent = music.artist || (music.url ? "未知歌手" : "在管理后台添加音乐链接后可用");
  }

  const hasMusic = Boolean(music.url && String(music.url).trim());
  if (musicCard) musicCard.classList.toggle("has-music", hasMusic);
  if (empty) {
    empty.textContent = hasMusic
      ? "把喜欢的音乐放在这里，作为每次点开博客时的小小背景。"
      : "在管理后台添加音乐链接后，这里就可以播放。";
  }
  if (audio) {
    if (hasMusic) {
      audio.src = String(music.url).trim();
      audio.load();
    } else {
      audio.removeAttribute("src");
      audio.load();
    }
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
  applySiteIdentity(
    saved.siteTitle ?? DEFAULT_APPEARANCE.siteTitle,
    saved.siteSubtitle ?? DEFAULT_APPEARANCE.siteSubtitle
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
  const siteTitleInput = document.getElementById("site-title");
  const siteSubtitleInput = document.getElementById("site-subtitle");
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
    !siteTitleInput ||
    !siteSubtitleInput ||
    !imageInput ||
    !backdropOpacityRange ||
    !backdropBlurRange ||
    !panelOpacityRange ||
    !panelBlurRange ||
    !contentWidthRange
  ) return;

  const saved = getSavedAppearance();
  siteTitleInput.value = saved.siteTitle ?? DEFAULT_APPEARANCE.siteTitle;
  siteSubtitleInput.value = saved.siteSubtitle ?? DEFAULT_APPEARANCE.siteSubtitle;
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
    applySiteIdentity(
      siteTitleInput.value.trim() || DEFAULT_APPEARANCE.siteTitle,
      siteSubtitleInput.value.trim() || DEFAULT_APPEARANCE.siteSubtitle
    );
    syncLabels();
  };

  siteTitleInput.addEventListener("input", previewFromInputs);
  siteSubtitleInput.addEventListener("input", previewFromInputs);
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
        siteTitle: siteTitleInput.value.trim() || DEFAULT_APPEARANCE.siteTitle,
        siteSubtitle: siteSubtitleInput.value.trim() || DEFAULT_APPEARANCE.siteSubtitle,
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
      siteTitleInput.value = DEFAULT_APPEARANCE.siteTitle;
      siteSubtitleInput.value = DEFAULT_APPEARANCE.siteSubtitle;
      applySiteIdentity(DEFAULT_APPEARANCE.siteTitle, DEFAULT_APPEARANCE.siteSubtitle);
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

function initHomeContentControls() {
  const avatarInput = document.getElementById("profile-avatar-text");
  const nameInput = document.getElementById("profile-name");
  const bioInput = document.getElementById("profile-bio");
  const signatureInput = document.getElementById("profile-signature");
  const musicTitleInput = document.getElementById("music-title");
  const musicArtistInput = document.getElementById("music-artist");
  const musicUrlInput = document.getElementById("music-url");
  const statusLine = document.getElementById("home-content-status");
  if (
    !avatarInput ||
    !nameInput ||
    !bioInput ||
    !signatureInput ||
    !musicTitleInput ||
    !musicArtistInput ||
    !musicUrlInput
  ) return;

  const saved = getSavedHomeContent();
  const profile = { ...DEFAULT_HOME_PROFILE, ...saved.profile };
  const music = { ...DEFAULT_MUSIC, ...saved.music };

  avatarInput.value = profile.avatar;
  nameInput.value = profile.name;
  bioInput.value = profile.bio;
  signatureInput.value = profile.signature;
  musicTitleInput.value = music.title;
  musicArtistInput.value = music.artist;
  musicUrlInput.value = music.url;

  const saveButton = document.getElementById("save-home-content");
  if (saveButton) {
    saveButton.addEventListener("click", () => {
      const nextProfile = {
        avatar: avatarInput.value.trim() || DEFAULT_HOME_PROFILE.avatar,
        name: nameInput.value.trim() || DEFAULT_HOME_PROFILE.name,
        bio: bioInput.value.trim() || DEFAULT_HOME_PROFILE.bio,
        signature: signatureInput.value.trim() || DEFAULT_HOME_PROFILE.signature
      };
      const nextMusic = {
        title: musicTitleInput.value.trim() || DEFAULT_MUSIC.title,
        artist: musicArtistInput.value.trim(),
        url: musicUrlInput.value.trim()
      };

      try {
        localStorage.setItem(HOME_PROFILE_KEY, JSON.stringify(nextProfile));
        localStorage.setItem(MUSIC_KEY, JSON.stringify(nextMusic));
        if (statusLine) statusLine.textContent = "首页个人资料与音乐已保存";
      } catch (error) {
        if (statusLine) statusLine.textContent = "浏览器未允许保存";
      }
    });
  }

  const resetButton = document.getElementById("reset-home-content");
  if (resetButton) {
    resetButton.addEventListener("click", () => {
      try {
        localStorage.removeItem(HOME_PROFILE_KEY);
        localStorage.removeItem(MUSIC_KEY);
      } catch (error) {
        // Ignore unavailable storage.
      }
      avatarInput.value = DEFAULT_HOME_PROFILE.avatar;
      nameInput.value = DEFAULT_HOME_PROFILE.name;
      bioInput.value = DEFAULT_HOME_PROFILE.bio;
      signatureInput.value = DEFAULT_HOME_PROFILE.signature;
      musicTitleInput.value = DEFAULT_MUSIC.title;
      musicArtistInput.value = DEFAULT_MUSIC.artist;
      musicUrlInput.value = DEFAULT_MUSIC.url;
      if (statusLine) statusLine.textContent = "已恢复首页默认内容";
    });
  }
}

function initHomeBubbleBackgroundControls() {
  const essaysInput = document.getElementById("home-bubbles-essays-bg");
  const techInput = document.getElementById("home-bubbles-tech-bg");
  const booksInput = document.getElementById("home-bubbles-books-bg");
  const statusLine = document.getElementById("home-bubble-background-status");
  if (!essaysInput || !techInput || !booksInput) return;

  const saved = getSavedHomeBubbleBackgrounds();
  const backgrounds = {
    ...DEFAULT_HOME_BUBBLE_BACKGROUNDS,
    ...saved
  };
  essaysInput.value = backgrounds.essays || "";
  techInput.value = backgrounds.tech || "";
  booksInput.value = backgrounds.books || "";

  const saveButton = document.getElementById("save-home-bubble-backgrounds");
  if (saveButton) {
    saveButton.addEventListener("click", () => {
      const next = {
        essays: essaysInput.value.trim(),
        tech: techInput.value.trim(),
        books: booksInput.value.trim()
      };
      try {
        localStorage.setItem(HOME_BUBBLE_BACKGROUNDS_KEY, JSON.stringify(next));
        applyHomeBubbleBackgrounds();
        if (statusLine) statusLine.textContent = "首页板块背景图已保存";
      } catch (error) {
        if (statusLine) statusLine.textContent = "浏览器未允许保存";
      }
    });
  }

  const resetButton = document.getElementById("reset-home-bubble-backgrounds");
  if (resetButton) {
    resetButton.addEventListener("click", () => {
      try {
        localStorage.removeItem(HOME_BUBBLE_BACKGROUNDS_KEY);
      } catch (error) {
        // Ignore unavailable storage.
      }
      essaysInput.value = DEFAULT_HOME_BUBBLE_BACKGROUNDS.essays;
      techInput.value = DEFAULT_HOME_BUBBLE_BACKGROUNDS.tech;
      booksInput.value = DEFAULT_HOME_BUBBLE_BACKGROUNDS.books;
      applyHomeBubbleBackgrounds();
      if (statusLine) statusLine.textContent = "已恢复默认板块背景";
    });
  }
}

function initHomeBubbleSettingsControls() {
  const form = document.getElementById("home-bubble-settings-form");
  const statusLine = document.getElementById("home-bubble-settings-status");
  if (!form) return;

  const settings = getSavedHomeBubbleSettings();
  const keys = [
    { key: "essays", coverMode: false },
    { key: "tech", coverMode: false },
    { key: "books", coverMode: true }
  ];

  function getField(prefix, name) {
    return document.getElementById(`bubble-${prefix}-${name}`);
  }

  function setOutput(prefix, name, value) {
    const output = document.getElementById(`bubble-${prefix}-${name}-value`);
    if (output) output.textContent = `${value}px`;
  }

  keys.forEach(({ key, coverMode }) => {
    const values = settings[key];
    const eyebrow = getField(key, "eyebrow");
    const title = getField(key, "title");
    const description = getField(key, coverMode ? "subtitle" : "description");
    const coverImage = getField(key, "cover-image");
    const background = getField(key, "bg");
    const titleColor = getField(key, "title-color");
    const textColor = getField(key, "text-color");
    const titleSize = getField(key, "title-size");
    const textSize = getField(key, "text-size");
    const weight = getField(key, "weight");

    if (eyebrow) eyebrow.value = values.eyebrow;
    if (title) title.value = values.title;
    if (description) description.value = coverMode ? values.subtitle : values.description;
    if (coverImage) coverImage.value = values.coverImage || "";
    if (background) background.value = values.background || "";
    if (titleColor) titleColor.value = values.titleColor;
    if (textColor) textColor.value = values.textColor;
    if (titleSize) {
      titleSize.value = values.titleSize;
      setOutput(key, "title-size", values.titleSize);
    }
    if (textSize) {
      textSize.value = values.textSize;
      setOutput(key, "text-size", values.textSize);
    }
    if (weight) weight.value = String(values.fontWeight);

    if (titleSize) {
      titleSize.addEventListener("input", () => {
        setOutput(key, "title-size", titleSize.value);
      });
    }
    if (textSize) {
      textSize.addEventListener("input", () => {
        setOutput(key, "text-size", textSize.value);
      });
    }
  });

  function readBubble(key, coverMode) {
    const get = (name, fallback) => {
      const element = getField(key, name);
      return element ? element.value.trim() : fallback;
    };
    const getNumber = (name, fallback) => {
      const value = Number(get(name, fallback));
      return Number.isFinite(value) ? value : fallback;
    };

    return {
      eyebrow: get("eyebrow", DEFAULT_HOME_BUBBLE_SETTINGS[key].eyebrow),
      title: get("title", DEFAULT_HOME_BUBBLE_SETTINGS[key].title),
      description: coverMode
        ? undefined
        : get("description", DEFAULT_HOME_BUBBLE_SETTINGS[key].description),
      subtitle: coverMode
        ? get("subtitle", DEFAULT_HOME_BUBBLE_SETTINGS[key].subtitle)
        : undefined,
      coverImage: coverMode ? get("cover-image", "") : undefined,
      background: get("bg", ""),
      titleColor: get("title-color", DEFAULT_HOME_BUBBLE_SETTINGS[key].titleColor),
      textColor: get("text-color", DEFAULT_HOME_BUBBLE_SETTINGS[key].textColor),
      titleSize: getNumber("title-size", DEFAULT_HOME_BUBBLE_SETTINGS[key].titleSize),
      textSize: getNumber("text-size", DEFAULT_HOME_BUBBLE_SETTINGS[key].textSize),
      fontWeight: getNumber("weight", DEFAULT_HOME_BUBBLE_SETTINGS[key].fontWeight)
    };
  }

  function refreshBooks() {
    const books = getSavedHomeBubbleSettings().books;
    const title = getField("books", "title");
    const subtitle = getField("books", "subtitle");
    const image = getField("books", "cover-image");
    if (title) title.value = books.title;
    if (subtitle) subtitle.value = books.subtitle;
    if (image) image.value = books.coverImage || "";
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const next = {
      essays: readBubble("essays", false),
      tech: readBubble("tech", false),
      books: readBubble("books", true)
    };

    try {
      localStorage.setItem(HOME_BUBBLE_SETTINGS_KEY, JSON.stringify(next));
      localStorage.setItem(
        HOME_BUBBLE_BACKGROUNDS_KEY,
        JSON.stringify({
          essays: next.essays.background,
          tech: next.tech.background,
          books: next.books.background
        })
      );
      if (window.BlogLibrary) {
        window.BlogLibrary.saveWeeklyCover({
          image: next.books.coverImage,
          title: next.books.title,
          subtitle: next.books.subtitle
        });
      }
      applyHomeBubbleSettings(next);
      if (statusLine) statusLine.textContent = "首页气泡设置已保存";
    } catch (error) {
      if (statusLine) statusLine.textContent = "浏览器未允许保存";
    }
  });

  const resetButton = document.getElementById("reset-home-bubble-settings");
  if (resetButton) {
    resetButton.addEventListener("click", () => {
      try {
        localStorage.removeItem(HOME_BUBBLE_SETTINGS_KEY);
        localStorage.removeItem(HOME_BUBBLE_BACKGROUNDS_KEY);
      } catch (error) {
        // Ignore unavailable storage.
      }
      if (window.BlogLibrary) {
        window.BlogLibrary.saveWeeklyCover({
          image: DEFAULT_HOME_BUBBLE_SETTINGS.books.coverImage,
          title: DEFAULT_HOME_BUBBLE_SETTINGS.books.title,
          subtitle: DEFAULT_HOME_BUBBLE_SETTINGS.books.subtitle
        });
      }
      refreshBooks();
      applyHomeBubbleSettings(DEFAULT_HOME_BUBBLE_SETTINGS);
      if (statusLine) statusLine.textContent = "首页气泡设置已恢复默认";
    });
  }
}

document.addEventListener("DOMContentLoaded", function () {
  applyAppearance();
  applyHomeContent();
  applyHomeBubbleBackgrounds();
  applyHomeBubbleSettings();
  initRipple();
  initFilters();
  initAppearanceControls();
  initHomeContentControls();
  initHomeBubbleBackgroundControls();
  initHomeBubbleSettingsControls();

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
