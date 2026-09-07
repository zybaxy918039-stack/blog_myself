(function () {
  "use strict";

  var DEFAULTS = {
    appearance: {
      siteTitle: "雾中书桌",
      siteSubtitle: "个人网络日志",
      image: 'url("assets/bg-mist-morning.jpg")',
      backdropOpacity: 0.78,
      backdropBlur: 18,
      panelOpacity: 0.82,
      panelBlur: 12,
      contentWidth: 1100
    },
    homeProfile: {
      avatar: "书",
      name: "博主",
      bio: "热爱技术和创作，用这个博客记录生活点滴、技术分享和未完的故事。",
      signature: "把想法留在纸上。"
    },
    music: {
      title: "未设置音乐",
      artist: "",
      url: ""
    },
    homeBubbles: {
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
    },
    weeklyCover: {
      image: "",
      title: "本周书单",
      subtitle: "在读书与摘录之间，留下一小块慢下来的地方。"
    },
    weeklyBooks: [],
    bookReviews: []
  };

  var state = {
    siteData: JSON.parse(JSON.stringify(DEFAULTS)),
    articles: [],
    editingArticleId: "",
    editingWeeklyId: "",
    editingReviewId: "",
    currentTags: []
  };

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function makeId(prefix) {
    var random = "";
    if (typeof crypto !== "undefined" && crypto.randomUUID) {
      random = crypto.randomUUID();
    } else {
      random = Date.now() + "-" + Math.random().toString(16).slice(2);
    }
    return (prefix || "item") + "-" + random;
  }

  function showStatus(element, message, ok) {
    if (!element) return;
    element.textContent = message;
    element.classList.toggle("status-ok", ok !== false);
    element.classList.toggle("status-error", ok === false);
  }

  function field(id) {
    return document.getElementById(id);
  }

  async function requestJson(path, options) {
    var opts = options || {};
    var headers = Object.assign({}, opts.headers || {});
    if (opts.method && opts.method !== "GET") {
      headers["Content-Type"] = "application/json";
    }

    var response = await fetch(path, {
      credentials: "same-origin",
      method: opts.method || "GET",
      headers: headers,
      body: opts.body
    });

    if (response.status === 401) {
      window.location.replace("index.html");
      throw new Error("登录已过期");
    }

    var data = await response.json().catch(function () {
      return {};
    });
    if (!response.ok) {
      throw new Error(data.error || ("请求失败（" + response.status + "）"));
    }
    return data;
  }

  async function loadSiteData() {
    var result = await requestJson("/api/admin/site-data");
    state.siteData = mergeSiteData(result.data || {});
  }

  async function loadArticles() {
    var result = await requestJson("/api/admin/articles");
    state.articles = Array.isArray(result.articles) ? result.articles : [];
  }

  function mergeSiteData(data) {
    var merged = clone(DEFAULTS);
    Object.keys(data || {}).forEach(function (key) {
      if (!Object.prototype.hasOwnProperty.call(merged, key)) return;
      if (Array.isArray(merged[key])) {
        merged[key] = Array.isArray(data[key]) ? clone(data[key]) : clone(merged[key]);
        return;
      }
      if (merged[key] && typeof merged[key] === "object") {
        merged[key] = Object.assign({}, merged[key], data[key] || {});
        if (key === "homeBubbles") {
          ["essays", "tech", "books"].forEach(function (bubbleKey) {
            merged.homeBubbles[bubbleKey] = Object.assign(
              {},
              DEFAULTS.homeBubbles[bubbleKey],
              data.homeBubbles && data.homeBubbles[bubbleKey] ? data.homeBubbles[bubbleKey] : {}
            );
          });
        }
      } else {
        merged[key] = data[key];
      }
    });
    return merged;
  }

  function activateSection(targetId) {
    document.querySelectorAll(".admin-nav-item").forEach(function (item) {
      item.classList.toggle("active", item.getAttribute("href").slice(1) === targetId);
    });
    document.querySelectorAll(".admin-section").forEach(function (section) {
      section.classList.toggle("active", section.id === targetId);
    });
    var target = document.getElementById(targetId);
    if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function initNavigation() {
    document.querySelectorAll(".admin-nav-item").forEach(function (item) {
      item.addEventListener("click", function (event) {
        event.preventDefault();
        activateSection(item.getAttribute("href").slice(1));
      });
    });
  }

  document.addEventListener("DOMContentLoaded", async function () {
    if (!window.AdminAuth) return;
    if (!(await window.AdminAuth.requireAuth())) return;

    var logoutButton = field("logout-btn");
    if (logoutButton) {
      logoutButton.addEventListener("click", function (event) {
        event.preventDefault();
        window.AdminAuth.logout();
      });
    }

    try {
      await loadSiteData();
      await loadArticles();
      initNavigation();
      initAppearanceControls();
      initHomeContentControls();
      initHomeBubbleControls();
      initArticleControls();
      initLibraryControls();
      renderAll();
      updateSaveModeLabels();
    } catch (error) {
      var status = field("status-line");
      showStatus(status, error.message || "后台数据加载失败", false);
    }
  });

  function initArticleControls() {
    var editor = field("markdown-editor");
    var tagsInput = field("tags-input");
    var saveButton = field("save-btn");
    var publishButton = field("publish-btn");

    if (editor) editor.addEventListener("input", updateMarkdownPreview);

    if (tagsInput) {
      tagsInput.addEventListener("keydown", function (event) {
        if (event.key === "Enter" || event.key === ",") {
          event.preventDefault();
          addTagInput();
        }
      });
    }

    if (saveButton) {
      saveButton.addEventListener("click", function () {
        saveCurrentArticle("draft");
      });
    }

    if (publishButton) {
      publishButton.addEventListener("click", function () {
        saveCurrentArticle("published");
      });
    }

    window.formatText = formatText;
    window.insertImage = insertImage;
    window.insertBlockquote = insertBlockquote;
    window.insertList = insertList;
  }

  function replaceEditorSelection(prefix, suffix, fallback) {
    var editor = field("markdown-editor");
    if (!editor) return;
    var start = editor.selectionStart;
    var end = editor.selectionEnd;
    var selected = editor.value.slice(start, end);
    var value = selected || fallback;
    editor.value = editor.value.slice(0, start) + prefix + value + suffix + editor.value.slice(end);
    editor.focus();
    var selectionStart = start + prefix.length;
    editor.setSelectionRange(selectionStart, selectionStart + value.length);
    updateMarkdownPreview();
  }

  function formatText(type) {
    if (type === "bold") {
      replaceEditorSelection("**", "**", "加粗文本");
    } else if (type === "italic") {
      replaceEditorSelection("*", "*", "斜体文本");
    } else if (type === "header") {
      replaceEditorSelection("# ", "", "标题");
    }
  }

  function insertImage() {
    var src = window.prompt("请输入图片链接");
    if (!src) return;
    replaceEditorSelection("[", "](" + src + ")", "图片描述");
  }

  function insertBlockquote() {
    replaceEditorSelection("> ", "", "引用内容");
  }

  function insertList() {
    replaceEditorSelection("- ", "", "列表项");
  }

  function renderArticleControls() {
    var list = field("article-admin-list");
    var count = field("article-count");
    if (count) count.textContent = state.articles.length + " 篇";
    if (!list) return;
    if (!state.articles.length) {
      list.innerHTML = '<div class="library-empty">还没有文章，可以先在上方写一篇。</div>';
      return;
    }
    list.innerHTML = state.articles
      .map(function (article) {
        var status = article.status === "published" ? "已发布" : "草稿";
        var origin = article.origin === "repo" ? "仓库文章" : "后台文章";
        return (
          '<article class="admin-library-item" data-article="' +
          escapeHtml(article.id || article.slug || "") +
          '">' +
          '<div><strong>' + escapeHtml(article.title) + '</strong>' +
          '<span>' + escapeHtml(article.categoryName || article.category || "") + ' · ' + status + ' · ' + origin + '</span></div>' +
          '<div class="admin-library-controls">' +
          '<button class="btn btn-secondary" type="button" data-action="edit">编辑</button>' +
          '<button class="btn btn-primary" type="button" data-action="publish">发布</button>' +
          '<button class="btn btn-danger" type="button" data-action="delete">删除</button>' +
          '</div></article>'
        );
      })
      .join("");

    list.querySelectorAll("[data-article]").forEach(function (item) {
      var id = item.dataset.article;
      item.querySelector('[data-action="edit"]').addEventListener("click", function () {
        var article = state.articles.find(function (entry) {
          return (entry.id || entry.slug) === id;
        });
        if (article) editArticle(article);
      });
      item.querySelector('[data-action="publish"]').addEventListener("click", function () {
        var article = state.articles.find(function (entry) {
          return (entry.id || entry.slug) === id;
        });
        if (article) publishExisting(article);
      });
      item.querySelector('[data-action="delete"]').addEventListener("click", function () {
        deleteExistingArticle(id);
      });
    });
  }

  function weeklyBooks() {
    return Array.isArray(state.siteData.weeklyBooks) ? state.siteData.weeklyBooks : [];
  }

  function bookReviews() {
    return Array.isArray(state.siteData.bookReviews) ? state.siteData.bookReviews : [];
  }

  function resetWeeklyForm() {
    state.editingWeeklyId = "";
    field("weekly-title").value = "";
    field("weekly-author").value = "";
    field("weekly-progress").value = "进行中";
    field("weekly-reason").value = "";
  }

  function resetReviewForm() {
    state.editingReviewId = "";
    field("review-book-title").value = "";
    field("review-book-author").value = "";
    field("review-book-cover").value = "";
  }

  function resetQuoteForm() {
    field("quote-text").value = "";
    field("quote-note").value = "";
  }

  function setLibrarySubmitLabels() {
    var weeklyButton = document.querySelector("#weekly-book-form button[type='submit']");
    var reviewButton = document.querySelector("#book-form button[type='submit']");
    if (weeklyButton) weeklyButton.textContent = state.editingWeeklyId ? "保存本周书单修改" : "加入本周书单";
    if (reviewButton) reviewButton.textContent = state.editingReviewId ? "保存书评分区修改" : "创建书评分区";
  }

  function showLibraryStatus(message, ok) {
    showStatus(field("library-status"), message, ok);
  }

  async function saveLibraryData(updates) {
    var result = await requestJson("/api/admin/site-data", {
      method: "PUT",
      body: JSON.stringify(updates)
    });
    state.siteData.weeklyBooks = Array.isArray(result.data.weeklyBooks)
      ? result.data.weeklyBooks
      : [];
    state.siteData.bookReviews = Array.isArray(result.data.bookReviews)
      ? result.data.bookReviews
      : [];
    renderLibraryControls();
    return result;
  }

  function findWeeklyBook(id) {
    return weeklyBooks().find(function (book) {
      return String(book.id || "") === String(id || "");
    });
  }

  function findBookReview(id) {
    return bookReviews().find(function (book) {
      return String(book.id || "") === String(id || "");
    });
  }

  function readWeeklyBook() {
    var title = field("weekly-title").value.trim();
    if (!title) {
      showLibraryStatus("请先填写书名", false);
      return null;
    }
    return {
      id: state.editingWeeklyId || makeId("weekly"),
      title: title,
      author: field("weekly-author").value.trim(),
      progress: field("weekly-progress").value,
      reason: field("weekly-reason").value.trim()
    };
  }

  function readReviewBook() {
    var title = field("review-book-title").value.trim();
    if (!title) {
      showLibraryStatus("请先填写书名", false);
      return null;
    }
    var existing = state.editingReviewId ? findBookReview(state.editingReviewId) : null;
    return {
      id: state.editingReviewId || makeId("book"),
      title: title,
      author: field("review-book-author").value.trim(),
      cover: field("review-book-cover").value.trim(),
      quotes: Array.isArray(existing && existing.quotes) ? clone(existing.quotes) : []
    };
  }

  async function submitWeeklyBook(event) {
    event.preventDefault();
    var book = readWeeklyBook();
    if (!book) return;
    var next = weeklyBooks().slice();
    if (state.editingWeeklyId) {
      next = next.map(function (item) {
        return String(item.id || "") === String(state.editingWeeklyId) ? book : item;
      });
      if (!next.some(function (item) { return String(item.id || "") === String(book.id); })) {
        next.push(book);
      }
    } else {
      next.push(book);
    }
    try {
      await saveLibraryData({ weeklyBooks: next });
      resetWeeklyForm();
      renderLibraryControls();
      showLibraryStatus("本周书单已保存");
    } catch (error) {
      showLibraryStatus(error.message, false);
    }
  }

  async function submitReviewBook(event) {
    event.preventDefault();
    var book = readReviewBook();
    if (!book) return;
    var next = bookReviews().slice();
    if (state.editingReviewId) {
      next = next.map(function (item) {
        return String(item.id || "") === String(state.editingReviewId) ? book : item;
      });
      if (!next.some(function (item) { return String(item.id || "") === String(book.id); })) {
        next.push(book);
      }
    } else {
      next.push(book);
    }
    try {
      await saveLibraryData({ bookReviews: next });
      resetReviewForm();
      renderLibraryControls();
      showLibraryStatus("书评分区已保存");
    } catch (error) {
      showLibraryStatus(error.message, false);
    }
  }

  async function submitQuote(event) {
    event.preventDefault();
    var select = field("quote-book-select");
    var reviewId = select.value;
    var text = field("quote-text").value.trim();
    if (!reviewId) {
      showLibraryStatus("请先选择一本书", false);
      return;
    }
    if (!text) {
      showLibraryStatus("请输入要记录的句子", false);
      return;
    }
    var next = bookReviews().slice();
    var review = next.find(function (item) {
      return String(item.id || "") === String(reviewId);
    });
    if (!review) {
      showLibraryStatus("没有找到对应的书评分区", false);
      return;
    }
    review.quotes = Array.isArray(review.quotes) ? review.quotes.slice() : [];
    review.quotes.push({
      id: makeId("quote"),
      text: text,
      note: field("quote-note").value.trim()
    });
    try {
      await saveLibraryData({ bookReviews: next });
      resetQuoteForm();
      select.value = reviewId;
      renderLibraryControls();
      showLibraryStatus("句子与短评已保存");
    } catch (error) {
      showLibraryStatus(error.message, false);
    }
  }

  async function deleteWeeklyBook(id) {
    if (!window.confirm("确定要从本周书单中移除这本书吗？")) return;
    try {
      await saveLibraryData({
        weeklyBooks: weeklyBooks().filter(function (book) {
          return String(book.id || "") !== String(id || "");
        })
      });
      if (String(state.editingWeeklyId || "") === String(id || "")) resetWeeklyForm();
      renderLibraryControls();
      showLibraryStatus("已从本周书单移除");
    } catch (error) {
      showLibraryStatus(error.message, false);
    }
  }

  async function deleteReviewBook(id) {
    if (!window.confirm("确定要删除这个书评分区及其句子记录吗？")) return;
    try {
      await saveLibraryData({
        bookReviews: bookReviews().filter(function (book) {
          return String(book.id || "") !== String(id || "");
        })
      });
      if (String(state.editingReviewId || "") === String(id || "")) resetReviewForm();
      renderLibraryControls();
      showLibraryStatus("书评分区已删除");
    } catch (error) {
      showLibraryStatus(error.message, false);
    }
  }

  async function deleteQuote(reviewId, quoteId) {
    if (!window.confirm("确定要删除这条句子与短评吗？")) return;
    var next = bookReviews().slice();
    var review = next.find(function (item) {
      return String(item.id || "") === String(reviewId || "");
    });
    if (!review) return;
    review.quotes = Array.isArray(review.quotes)
      ? review.quotes.filter(function (quote) {
          return String(quote.id || "") !== String(quoteId || "");
        })
      : [];
    try {
      await saveLibraryData({ bookReviews: next });
      renderLibraryControls();
      showLibraryStatus("句子与短评已删除");
    } catch (error) {
      showLibraryStatus(error.message, false);
    }
  }

  function editWeeklyBook(id) {
    var book = findWeeklyBook(id);
    if (!book) return;
    state.editingWeeklyId = book.id || "";
    field("weekly-title").value = book.title || "";
    field("weekly-author").value = book.author || "";
    field("weekly-progress").value = book.progress || "进行中";
    field("weekly-reason").value = book.reason || "";
    setLibrarySubmitLabels();
    var section = document.getElementById("weekly-book-form");
    if (section) section.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function editReviewBook(id) {
    var book = findBookReview(id);
    if (!book) return;
    state.editingReviewId = book.id || "";
    field("review-book-title").value = book.title || "";
    field("review-book-author").value = book.author || "";
    field("review-book-cover").value = book.cover || "";
    setLibrarySubmitLabels();
    var section = document.getElementById("book-form");
    if (section) section.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function renderWeeklyBookList() {
    var list = field("weekly-book-list");
    if (!list) return;
    var books = weeklyBooks();
    if (!books.length) {
      list.innerHTML = '<div class="library-empty">还没有本周书单，可以先在上方添加一本。</div>';
      return;
    }
    list.innerHTML = books
      .map(function (book) {
        var id = book.id || "";
        return (
          '<article class="admin-library-item" data-weekly-id="' + escapeHtml(id) + '">' +
          '<div><strong>' + escapeHtml(book.title) + '</strong>' +
          '<span>' + escapeHtml(book.author || "未知作者") + ' · ' + escapeHtml(book.progress || "进行中") +
          (book.reason ? ' · ' + escapeHtml(book.reason) : "") + '</span></div>' +
          '<div class="admin-library-controls">' +
          '<button class="btn btn-secondary" type="button" data-action="edit">编辑</button>' +
          '<button class="btn btn-danger" type="button" data-action="delete">删除</button>' +
          '</div></article>'
        );
      })
      .join("");

    list.querySelectorAll("[data-weekly-id]").forEach(function (item) {
      var id = item.dataset.weeklyId;
      item.querySelector('[data-action="edit"]').addEventListener("click", function () {
        editWeeklyBook(id);
      });
      item.querySelector('[data-action="delete"]').addEventListener("click", function () {
        deleteWeeklyBook(id);
      });
    });
  }

  function renderBookReviewList() {
    var list = field("book-review-list");
    var select = field("quote-book-select");
    if (!list) return;
    var reviews = bookReviews();
    if (!reviews.length) {
      list.innerHTML = '<div class="library-empty">还没有书评分区，可以先在上方创建一本。</div>';
    } else {
      list.innerHTML = reviews
        .map(function (book) {
          var id = book.id || "";
          var quotes = Array.isArray(book.quotes) ? book.quotes : [];
          var cover = String(book.cover || "").trim();
          var coverHtml = cover
            ? '<img class="review-cover" src="' + escapeHtml(cover) + '" alt="' + escapeHtml(book.title) + '">'
            : '<div class="review-cover review-cover-fallback">' + escapeHtml(book.title.slice(0, 1) || "书") + '</div>';
          var quoteHtml = quotes.length
            ? quotes
                .map(function (quote) {
                  return (
                    '<article class="admin-quote-item" data-quote-id="' + escapeHtml(quote.id || "") + '">' +
                    '<blockquote>' + escapeHtml(quote.text) + '</blockquote>' +
                    (quote.note ? '<p>' + escapeHtml(quote.note) + '</p>' : "") +
                    '<button class="btn btn-secondary" type="button" data-action="delete-quote">删除</button>' +
                    '</article>'
                  );
                })
                .join("")
            : '<div class="library-empty">这个分区还没有句子，可以在上方添加。</div>';
          return (
            '<article class="admin-book-review" data-review-id="' + escapeHtml(id) + '">' +
            '<div class="admin-book-review-head">' +
            '<div class="review-book-head"><h3>' + escapeHtml(book.title) + '</h3>' +
            '<span>' + escapeHtml(book.author || "未知作者") + '</span></div>' +
            coverHtml +
            '<div class="admin-library-controls">' +
            '<button class="btn btn-secondary" type="button" data-action="edit">编辑</button>' +
            '<button class="btn btn-danger" type="button" data-action="delete">删除</button>' +
            '</div></div>' +
            '<div class="admin-quote-list">' + quoteHtml + '</div>' +
            '</article>'
          );
        })
        .join("");

      list.querySelectorAll("[data-review-id]").forEach(function (item) {
        var id = item.dataset.reviewId;
        item.querySelector('[data-action="edit"]').addEventListener("click", function () {
          editReviewBook(id);
        });
        item.querySelector('[data-action="delete"]').addEventListener("click", function () {
          deleteReviewBook(id);
        });
        item.querySelectorAll("[data-quote-id]").forEach(function (quoteItem) {
          quoteItem.querySelector('[data-action="delete-quote"]').addEventListener("click", function () {
            deleteQuote(id, quoteItem.dataset.quoteId);
          });
        });
      });
    }

    if (select) {
      var selected = select.value;
      select.innerHTML = reviews
        .map(function (book) {
          return '<option value="' + escapeHtml(book.id || "") + '">' + escapeHtml(book.title) + '</option>';
        })
        .join("");
      if (reviews.some(function (book) { return String(book.id || "") === String(selected); })) {
        select.value = selected;
      } else if (reviews.length) {
        select.value = reviews[0].id || "";
      }
    }
    setLibrarySubmitLabels();
  }

  function initLibraryControls() {
    var weeklyForm = field("weekly-book-form");
    var bookForm = field("book-form");
    var quoteForm = field("quote-form");

    if (weeklyForm) weeklyForm.addEventListener("submit", submitWeeklyBook);
    if (bookForm) bookForm.addEventListener("submit", submitReviewBook);
    if (quoteForm) quoteForm.addEventListener("submit", submitQuote);
  }

  function renderLibraryControls() {
    renderWeeklyBookList();
    renderBookReviewList();
  }

  function renderTags() {
    var list = field("tags-list");
    if (!list) return;
    list.innerHTML = state.currentTags
      .map(function (tag) {
        return (
          '<button class="tag tag-removable" type="button" data-tag="' +
          escapeHtml(tag) +
          '">' +
          escapeHtml(tag) +
          '<span aria-hidden="true">×</span></button>'
        );
      })
      .join("");
    list.querySelectorAll("[data-tag]").forEach(function (button) {
      button.addEventListener("click", function () {
        state.currentTags = state.currentTags.filter(function (tag) {
          return tag !== button.dataset.tag;
        });
        renderTags();
      });
    });
  }

  function addTagInput() {
    var input = field("tags-input");
    var value = (input.value || "").trim();
    if (!value) return;
    if (state.currentTags.indexOf(value) < 0) {
      state.currentTags.push(value);
      renderTags();
    }
    input.value = "";
  }

  function resetArticleEditor() {
    state.editingArticleId = "";
    state.currentTags = [];
    field("post-title").value = "";
    field("post-category").value = "随笔";
    field("markdown-editor").value = "";
    renderTags();
    updateMarkdownPreview();
  }

  function updateMarkdownPreview() {
    var preview = field("markdown-preview");
    if (preview) preview.innerHTML = markdownPreview(field("markdown-editor").value);
  }

  function editArticle(article) {
    state.editingArticleId = article.id || article.slug || "";
    state.currentTags = Array.isArray(article.tags) ? article.tags.slice() : [];
    field("post-title").value = article.title || "";
    field("post-category").value = article.category === "fiction" ? "小说" : article.category === "tech" ? "技术" : article.category === "essays" ? "随笔" : "项目";
    field("markdown-editor").value = article.markdown || "";
    renderTags();
    updateMarkdownPreview();
    var section = document.getElementById("writing");
    if (section) section.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function formatDate(date) {
    var value = String(date || "").trim();
    if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
      var parts = value.slice(0, 10).split("-");
      return parts[0] + "年" + Number(parts[1]) + "月" + Number(parts[2]) + "日";
    }
    return value || "未设置日期";
  }

  function markdownPreview(markdown) {
    var text = String(markdown || "");
    var html = escapeHtml(text);
    html = html.replace(/^######\s+(.+)$/gm, "<h6>$1</h6>");
    html = html.replace(/^#####\s+(.+)$/gm, "<h5>$1</h5>");
    html = html.replace(/^####\s+(.+)$/gm, "<h4>$1</h4>");
    html = html.replace(/^###\s+(.+)$/gm, "<h3>$1</h3>");
    html = html.replace(/^##\s+(.+)$/gm, "<h2>$1</h2>");
    html = html.replace(/^#\s+(.+)$/gm, "<h1>$1</h1>");
    html = html.replace(/^>\s?(.+)$/gm, "<blockquote>$1</blockquote>");
    html = html.replace(/^[-*]\s+(.+)$/gm, "<li>$1</li>");
    html = html.replace(/(<li>[\s\S]*?<\/li>)(?!\s*<li>)/g, "<ul>$1</ul>");
    html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
    html = html.replace(/__(.+?)__/g, "<strong>$1</strong>");
    html = html.replace(/\*(.+?)\*/g, "<em>$1</em>");
    html = html.replace(/_(.+?)_/g, "<em>$1</em>");
    html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img alt="$1" src="$2">');
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
    html = html.replace(/\n{2,}/g, "</p><p>");
    return "<p>" + html + "</p>";
  }

  function initHomeBubbleControls() {
    var form = field("home-bubble-settings-form");
    ["essays", "tech", "books"].forEach(function (key) {
      ["title-size", "text-size"].forEach(function (name) {
        var element = bubbleField(key, name);
        var output = field("bubble-" + key + "-" + name + "-value");
        if (!element) return;
        element.addEventListener("input", function () {
          if (output) output.textContent = element.value + "px";
        });
      });
    });

    if (form) {
      form.addEventListener("submit", async function (event) {
        event.preventDefault();
        var homeBubbles = {
          essays: readBubble("essays", false),
          tech: readBubble("tech", false),
          books: readBubble("books", true)
        };
        try {
          await requestJson("/api/admin/site-data", {
            method: "PUT",
            body: JSON.stringify({
              homeBubbles: homeBubbles,
              weeklyCover: {
                image: homeBubbles.books.coverImage,
                title: homeBubbles.books.title,
                subtitle: homeBubbles.books.subtitle
              }
            })
          });
          state.siteData.homeBubbles = homeBubbles;
          state.siteData.weeklyCover.image = homeBubbles.books.coverImage;
          state.siteData.weeklyCover.title = homeBubbles.books.title;
          state.siteData.weeklyCover.subtitle = homeBubbles.books.subtitle;
          showStatus(field("home-bubble-settings-status"), "首页气泡设置已保存");
        } catch (error) {
          showStatus(field("home-bubble-settings-status"), error.message, false);
        }
      });
    }

    var resetButton = field("reset-home-bubble-settings");
    if (resetButton) {
      resetButton.addEventListener("click", async function () {
        state.siteData.homeBubbles = JSON.parse(JSON.stringify(DEFAULTS.homeBubbles));
        state.siteData.weeklyCover = JSON.parse(JSON.stringify(DEFAULTS.weeklyCover));
        renderHomeBubbleControls();
        try {
          await requestJson("/api/admin/site-data", {
            method: "PUT",
            body: JSON.stringify({
              homeBubbles: state.siteData.homeBubbles,
              weeklyCover: state.siteData.weeklyCover
            })
          });
          showStatus(field("home-bubble-settings-status"), "首页气泡设置已恢复默认");
        } catch (error) {
          showStatus(field("home-bubble-settings-status"), error.message, false);
        }
      });
    }
  }

  function bubbleField(key, name) {
    return field("bubble-" + key + "-" + name);
  }

  function readBubble(key, coverMode) {
    var fallback = DEFAULTS.homeBubbles[key];
    var value = function (name, fallbackValue) {
      var element = bubbleField(key, name);
      return element ? element.value.trim() : fallbackValue;
    };
    var number = function (name, fallbackValue) {
      var parsed = Number(value(name, fallbackValue));
      return Number.isFinite(parsed) ? parsed : fallbackValue;
    };
    var result = {
      eyebrow: value("eyebrow", fallback.eyebrow),
      title: value("title", fallback.title),
      background: value("bg", fallback.background || ""),
      titleColor: value("title-color", fallback.titleColor),
      textColor: value("text-color", fallback.textColor),
      titleSize: number("title-size", fallback.titleSize),
      textSize: number("text-size", fallback.textSize),
      fontWeight: number("weight", fallback.fontWeight)
    };
    if (coverMode) {
      result.subtitle = value("subtitle", fallback.subtitle);
      result.coverImage = value("cover-image", fallback.coverImage || "");
    } else {
      result.description = value("description", fallback.description);
    }
    return result;
  }

  function writeBubble(key, coverMode) {
    var settings = state.siteData.homeBubbles[key];
    var set = function (name, value) {
      var element = bubbleField(key, name);
      if (element) element.value = value == null ? "" : value;
    };
    set("eyebrow", settings.eyebrow);
    set("title", settings.title);
    set("bg", settings.background);
    set("title-color", settings.titleColor);
    set("text-color", settings.textColor);
    set("title-size", settings.titleSize);
    set("text-size", settings.textSize);
    set("weight", String(settings.fontWeight || 700));
    if (coverMode) {
      set("subtitle", settings.subtitle);
      set("cover-image", settings.coverImage);
    } else {
      set("description", settings.description);
    }
    var output;
    output = field("bubble-" + key + "-title-size-value");
    if (output) output.textContent = settings.titleSize + "px";
    output = field("bubble-" + key + "-text-size-value");
    if (output) output.textContent = settings.textSize + "px";
  }

  function renderHomeBubbleControls() {
    writeBubble("essays", false);
    writeBubble("tech", false);
    writeBubble("books", true);
  }

  function initHomeContentControls() {
    var saveButton = field("save-home-content");
    var resetButton = field("reset-home-content");
    if (saveButton) {
      saveButton.addEventListener("click", async function () {
        var homeProfile = {
          avatar: field("profile-avatar-text").value.trim() || DEFAULTS.homeProfile.avatar,
          name: field("profile-name").value.trim() || DEFAULTS.homeProfile.name,
          bio: field("profile-bio").value.trim() || DEFAULTS.homeProfile.bio,
          signature: field("profile-signature").value.trim()
        };
        var music = {
          title: field("music-title").value.trim() || DEFAULTS.music.title,
          artist: field("music-artist").value.trim(),
          url: field("music-url").value.trim()
        };
        try {
          await requestJson("/api/admin/site-data", {
            method: "PUT",
            body: JSON.stringify({ homeProfile: homeProfile, music: music })
          });
          state.siteData.homeProfile = homeProfile;
          state.siteData.music = music;
          showStatus(field("home-content-status"), "首页个人资料与音乐已保存");
        } catch (error) {
          showStatus(field("home-content-status"), error.message, false);
        }
      });
    }
    if (resetButton) {
      resetButton.addEventListener("click", async function () {
        state.siteData.homeProfile = JSON.parse(JSON.stringify(DEFAULTS.homeProfile));
        state.siteData.music = JSON.parse(JSON.stringify(DEFAULTS.music));
        renderHomeContentControls();
        try {
          await requestJson("/api/admin/site-data", {
            method: "PUT",
            body: JSON.stringify({
              homeProfile: state.siteData.homeProfile,
              music: state.siteData.music
            })
          });
          showStatus(field("home-content-status"), "首页内容已恢复默认");
        } catch (error) {
          showStatus(field("home-content-status"), error.message, false);
        }
      });
    }
  }

  function renderHomeContentControls() {
    var profile = state.siteData.homeProfile;
    var music = state.siteData.music;
    field("profile-avatar-text").value = profile.avatar;
    field("profile-name").value = profile.name;
    field("profile-bio").value = profile.bio;
    field("profile-signature").value = profile.signature;
    field("music-title").value = music.title;
    field("music-artist").value = music.artist || "";
    field("music-url").value = music.url || "";
  }

  function initAppearanceControls() {
    var ids = [
      "site-title",
      "site-subtitle",
      "bg-url",
      "backdrop-opacity-range",
      "backdrop-blur-range",
      "panel-opacity-range",
      "panel-blur-range",
      "content-width-range"
    ];
    ids.forEach(function (id) {
      var element = field(id);
      if (element) element.addEventListener("input", previewAppearanceFromInputs);
    });

    document.querySelectorAll(".preset-card[data-image]").forEach(function (card) {
      card.addEventListener("click", function () {
        field("bg-url").value = card.dataset.image || "";
        document.querySelectorAll(".preset-card[data-image]").forEach(function (item) {
          item.classList.toggle("active", item === card);
        });
        previewAppearanceFromInputs();
      });
    });

    var saveButton = field("save-appearance");
    if (saveButton) {
      saveButton.addEventListener("click", async function () {
        var appearance = {
          siteTitle: field("site-title").value.trim() || DEFAULTS.appearance.siteTitle,
          siteSubtitle: field("site-subtitle").value.trim() || DEFAULTS.appearance.siteSubtitle,
          image: field("bg-url").value.trim()
            ? backgroundFromInput(field("bg-url").value)
            : DEFAULTS.appearance.image,
          backdropOpacity: Number(field("backdrop-opacity-range").value),
          backdropBlur: Number(field("backdrop-blur-range").value),
          panelOpacity: Number(field("panel-opacity-range").value),
          panelBlur: Number(field("panel-blur-range").value),
          contentWidth: Number(field("content-width-range").value)
        };
        try {
          await requestJson("/api/admin/site-data", {
            method: "PUT",
            body: JSON.stringify({ appearance: appearance })
          });
          state.siteData.appearance = appearance;
          showStatus(field("status-line"), "外观已保存到 Cloudflare D1");
        } catch (error) {
          showStatus(field("status-line"), error.message, false);
        }
      });
    }

    var resetButton = field("reset-appearance");
    if (resetButton) {
      resetButton.addEventListener("click", async function () {
        state.siteData.appearance = JSON.parse(JSON.stringify(DEFAULTS.appearance));
        renderAppearanceControls();
        try {
          await requestJson("/api/admin/site-data", {
            method: "PUT",
            body: JSON.stringify({ appearance: state.siteData.appearance })
          });
          showStatus(field("status-line"), "外观已恢复默认");
        } catch (error) {
          showStatus(field("status-line"), error.message, false);
        }
      });
    }
  }

  function renderAppearanceControls() {
    var appearance = state.siteData.appearance;
    field("site-title").value = appearance.siteTitle;
    field("site-subtitle").value = appearance.siteSubtitle;
    field("bg-url").value = inputFromBackground(appearance.image);
    field("backdrop-opacity-range").value = appearance.backdropOpacity;
    field("backdrop-blur-range").value = appearance.backdropBlur;
    field("panel-opacity-range").value = appearance.panelOpacity;
    field("panel-blur-range").value = appearance.panelBlur;
    field("content-width-range").value = appearance.contentWidth;

    var currentImage = inputFromBackground(appearance.image);
    document.querySelectorAll(".preset-card[data-image]").forEach(function (card) {
      var preset = String(card.dataset.image || "").replace(/^\.\.?\//, "").replace(/^\/+/, "");
      card.classList.toggle("active", preset === currentImage || card.dataset.image === currentImage);
    });

    syncAppearanceOutputs();
    previewAppearanceFromInputs();
  }

  function previewAppearanceFromInputs() {
    var root = document.documentElement;
    var nextImage = field("bg-url").value.trim()
      ? backgroundFromInput(field("bg-url").value)
      : DEFAULTS.appearance.image;
    root.style.setProperty("--bg-image", nextImage);
    root.style.setProperty("--backdrop-opacity", field("backdrop-opacity-range").value);
    root.style.setProperty("--backdrop-blur", field("backdrop-blur-range").value + "px");
    root.style.setProperty("--panel-opacity", field("panel-opacity-range").value);
    root.style.setProperty("--panel-blur", field("panel-blur-range").value + "px");
    root.style.setProperty("--content-width", field("content-width-range").value + "px");
    syncAppearanceOutputs();
  }

  function syncAppearanceOutputs() {
    var mappings = [
      ["backdrop-opacity-range", "backdrop-opacity-value", function (v) { return Math.round(Number(v) * 100) + "%"; }],
      ["backdrop-blur-range", "backdrop-blur-value", function (v) { return v + "px"; }],
      ["panel-opacity-range", "panel-opacity-value", function (v) { return Math.round(Number(v) * 100) + "%"; }],
      ["panel-blur-range", "panel-blur-value", function (v) { return v + "px"; }],
      ["content-width-range", "content-width-value", function (v) { return v + "px"; }]
    ];
    mappings.forEach(function (item) {
      syncRangeOutput(field(item[0]), field(item[1]), item[2]);
    });
  }

  function backgroundFromInput(value) {
    var text = String(value || "").trim();
    if (!text) return "";
    if (/^url\(/i.test(text)) return text;
    return 'url("' + text.replace(/["\\\r\n]/g, function (char) {
      if (char === '"') return '\\"';
      if (char === "\\") return "\\\\";
      return " ";
    }) + '")';
  }

  function inputFromBackground(value) {
    var text = String(value || "").trim();
    var match = text.match(/^url\(["']?(.*?)["']?\)$/i);
    return match ? match[1] : text;
  }

  function syncRangeOutput(range, output, format) {
    if (range && output) output.textContent = format(range.value);
  }

  function updateSaveModeLabels() {
    var labels = [
      ["status-line", "修改会永久保存到 Cloudflare D1"],
      ["home-content-status", "修改会永久保存到 Cloudflare D1"],
      ["home-bubble-settings-status", "修改会永久保存到 Cloudflare D1"]
    ];
    labels.forEach(function (item) {
      var element = field(item[0]);
      if (element) element.textContent = "当前保存方式：" + item[1];
    });
  }

  function showArticleStatus(message, ok) {
    showStatus(field("article-status"), message, ok);
  }

  function articlePayload(status) {
    var article = state.articles.find(function (entry) {
      return (entry.id || entry.slug || "") === state.editingArticleId;
    }) || {};
    var categoryValue = field("post-category").value;
    var category =
      categoryValue === "小说" ? "fiction" :
      categoryValue === "技术" ? "tech" :
      categoryValue === "项目" ? "tech" :
      "essays";
    var date = article.date || "";
    if (status === "published" && !date) {
      date = new Date().toISOString().slice(0, 10);
    }
    return {
      id: state.editingArticleId || article.id || "",
      title: field("post-title").value.trim() || "未命名文章",
      category: category,
      tags: state.currentTags.slice(),
      markdown: field("markdown-editor").value,
      summary: article.summary || "",
      cover: article.cover || "",
      date: date,
      status: status
    };
  }

  async function saveCurrentArticle(status) {
    var payload = articlePayload(status);
    var path = state.editingArticleId
      ? "/api/admin/articles/" + encodeURIComponent(state.editingArticleId)
      : "/api/admin/articles";
    try {
      var result = await requestJson(path, {
        method: state.editingArticleId ? "PUT" : "POST",
        body: JSON.stringify(payload)
      });
      if (result.article) {
        state.editingArticleId = result.article.id || result.article.slug || "";
      }
      await loadArticles();
      renderArticleControls();
      showArticleStatus(status === "published" ? "文章已发布并保存" : "草稿已保存到 D1");
    } catch (error) {
      showArticleStatus(error.message, false);
    }
  }

  function publishExisting(article) {
    editArticle(article);
    saveCurrentArticle("published");
  }

  async function deleteExistingArticle(id) {
    if (!window.confirm("确定要删除这篇后台文章吗？")) return;
    try {
      await requestJson("/api/admin/articles/" + encodeURIComponent(id), {
        method: "DELETE"
      });
      if (state.editingArticleId === id) resetArticleEditor();
      await loadArticles();
      renderArticleControls();
      showArticleStatus("文章已删除");
    } catch (error) {
      showArticleStatus(error.message, false);
    }
  }

  function renderAll() {
    renderAppearanceControls();
    renderHomeContentControls();
    renderHomeBubbleControls();
    renderArticleControls();
    renderLibraryControls();
  }
})();
