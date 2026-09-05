const APPEARANCE_KEY = "blogAppearance";
const HOME_PROFILE_KEY = "blogHomeProfile";
const MUSIC_KEY = "blogMusic";

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

document.addEventListener("DOMContentLoaded", function () {
  applyAppearance();
  applyHomeContent();
  initRipple();
  initFilters();
  initAppearanceControls();
  initHomeContentControls();

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
