(function () {
  "use strict";

  const WEEKLY_BOOKS_KEY = "blogWeeklyBooks";
  const BOOK_REVIEWS_KEY = "blogBookReviews";

  const DEFAULT_WEEKLY_BOOKS = [
    {
      id: "weekly-default-1",
      title: "置身事内",
      author: "兰小欢",
      reason: "补一补中国经济运行与制度脉络",
      progress: "进行中"
    },
    {
      id: "weekly-default-2",
      title: "写作这回事",
      author: "斯蒂芬·金",
      reason: "从作者的写作经验里重新理解表达",
      progress: "未开始"
    }
  ];

  const DEFAULT_BOOK_REVIEWS = [
    {
      id: "book-default-1",
      title: "百年孤独",
      author: "加西亚·马尔克斯",
      cover: "",
      quotes: [
        {
          id: "quote-default-1",
          text: "过去都是假的，回忆没有归路，春天总是一去不返。",
          note: "第一次读到这里时，感到时间被折叠成了一张薄纸。"
        },
        {
          id: "quote-default-2",
          text: "世界新生伊始，许多事物还没有名字，提到的时候尚需用手指指点点。",
          note: "像重新学习语言，也像重新命名自己的经验。"
        }
      ]
    }
  ];

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function makeId(prefix) {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
      return `${prefix}-${window.crypto.randomUUID()}`;
    }
    return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function readList(key) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : null;
    } catch (error) {
      return null;
    }
  }

  function writeList(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function getWeeklyBooks() {
    return readList(WEEKLY_BOOKS_KEY) || clone(DEFAULT_WEEKLY_BOOKS);
  }

  function getBookReviews() {
    return readList(BOOK_REVIEWS_KEY) || clone(DEFAULT_BOOK_REVIEWS);
  }

  function saveWeeklyBooks(books) {
    writeList(WEEKLY_BOOKS_KEY, books);
  }

  function saveBookReviews(reviews) {
    writeList(BOOK_REVIEWS_KEY, reviews);
  }

  function fallbackCover(review) {
    return review.cover || "";
  }

  function renderWeeklyBooks(container, books, limit) {
    if (!container) return;
    const visible = limit ? books.slice(0, limit) : books;

    if (!visible.length) {
      container.innerHTML = '<div class="library-empty">这周还没有放进书单</div>';
      return;
    }

    container.innerHTML = visible
      .map((book) => {
        return `
          <article class="weekly-book-item">
            <div class="weekly-book-title">${escapeHtml(book.title)}</div>
            <div class="weekly-book-author">${escapeHtml(book.author || "未知作者")}</div>
            <div class="weekly-book-reason">${escapeHtml(book.reason || "还在想为什么读它")}</div>
            <span class="tag ${book.progress === "已读完" ? "tag-warm" : ""}">${escapeHtml(book.progress || "未开始")}</span>
          </article>
        `;
      })
      .join("");
  }

  function renderBookReviews(container, reviews, limit) {
    if (!container) return;
    const visible = limit ? reviews.slice(0, limit) : reviews;

    if (!visible.length) {
      container.innerHTML = '<div class="library-empty">还没有创建书评分区</div>';
      return;
    }

    container.innerHTML = visible
      .map((review) => {
        const coverImage = fallbackCover(review)
          ? `<img class="review-cover" src="${escapeHtml(review.cover)}" alt="${escapeHtml(review.title)}封面">`
          : `<div class="review-cover review-cover-placeholder">书</div>`;
        const quotes = (review.quotes || [])
          .slice(0, limit ? 1 : 99)
          .map((quote) => {
            return `
              <div class="review-quote">
                <blockquote>${escapeHtml(quote.text)}</blockquote>
                <p>${escapeHtml(quote.note || "")}</p>
              </div>
            `;
          })
          .join("");

        return `
          <article class="book-review-card">
            <div class="review-book-head">
              ${coverImage}
              <div>
                <h3>${escapeHtml(review.title)}</h3>
                <p>${escapeHtml(review.author || "未知作者")}</p>
              </div>
            </div>
            <div class="review-quote-list">${quotes || '<div class="library-empty">还没有摘录</div>'}</div>
          </article>
        `;
      })
      .join("");
  }

  function renderHome() {
    renderWeeklyBooks(
      document.getElementById("home-weekly-books"),
      getWeeklyBooks(),
      3
    );
    renderBookReviews(
      document.getElementById("home-recent-review"),
      getBookReviews(),
      1
    );
  }

  function renderBooksPage() {
    renderWeeklyBooks(
      document.getElementById("weekly-book-list"),
      getWeeklyBooks()
    );
    renderBookReviews(
      document.getElementById("book-review-shelf"),
      getBookReviews()
    );
  }

  function renderAdminWeekly() {
    const container = document.getElementById("weekly-book-list");
    if (!container) return;
    const books = getWeeklyBooks();

    if (!books.length) {
      container.innerHTML = '<div class="library-empty">本周书单还是空的</div>';
      return;
    }

    container.innerHTML = books
      .map((book) => {
        return `
          <article class="admin-library-item">
            <div>
              <strong>${escapeHtml(book.title)}</strong>
              <span>${escapeHtml(book.author || "未知作者")}</span>
              <small>${escapeHtml(book.reason || "")}</small>
            </div>
            <div class="admin-library-controls">
              <select data-action="update-weekly-progress" data-id="${escapeHtml(book.id)}" aria-label="阅读进度">
                <option value="未开始" ${book.progress === "未开始" ? "selected" : ""}>未开始</option>
                <option value="进行中" ${book.progress === "进行中" ? "selected" : ""}>进行中</option>
                <option value="已读完" ${book.progress === "已读完" ? "selected" : ""}>已读完</option>
              </select>
              <button class="btn btn-danger" type="button" data-action="remove-weekly" data-id="${escapeHtml(book.id)}">移除</button>
            </div>
          </article>
        `;
      })
      .join("");
  }

  function renderAdminReviews() {
    const container = document.getElementById("book-review-list");
    const select = document.getElementById("quote-book-select");
    if (!container) return;
    const reviews = getBookReviews();

    if (select) {
      const selected = select.value;
      select.innerHTML = reviews
        .map((review) => `<option value="${escapeHtml(review.id)}">${escapeHtml(review.title)}</option>`)
        .join("");
      if (reviews.some((review) => review.id === selected)) {
        select.value = selected;
      }
    }

    if (!reviews.length) {
      container.innerHTML = '<div class="library-empty">还没有创建任何书评分区</div>';
      return;
    }

    container.innerHTML = reviews
      .map((review) => {
        const cover = fallbackCover(review)
          ? `<img class="review-cover" src="${escapeHtml(review.cover)}" alt="">`
          : `<div class="review-cover review-cover-placeholder">书</div>`;
        const quotes = (review.quotes || [])
          .map((quote) => {
            return `
              <article class="admin-quote-item">
                <blockquote>${escapeHtml(quote.text)}</blockquote>
                <p>${escapeHtml(quote.note || "")}</p>
                <button class="btn btn-secondary" type="button" data-action="remove-quote" data-book-id="${escapeHtml(review.id)}" data-quote-id="${escapeHtml(quote.id)}">删除摘录</button>
              </article>
            `;
          })
          .join("");

        return `
          <article class="admin-book-review" data-review-id="${escapeHtml(review.id)}">
            <div class="admin-book-review-head">
              <div class="review-book-head">
                ${cover}
                <div>
                  <h3>${escapeHtml(review.title)}</h3>
                  <p>${escapeHtml(review.author || "未知作者")}</p>
                </div>
              </div>
              <button class="btn btn-danger" type="button" data-action="remove-book" data-id="${escapeHtml(review.id)}">删除分区</button>
            </div>
            <div class="admin-quote-list">${quotes || '<div class="library-empty">这本书还没有摘录</div>'}</div>
          </article>
        `;
      })
      .join("");
  }

  function resetAdminForms() {
    const weeklyForm = document.getElementById("weekly-book-form");
    const bookForm = document.getElementById("book-form");
    const quoteForm = document.getElementById("quote-form");
    if (weeklyForm) weeklyForm.reset();
    if (bookForm) bookForm.reset();
    if (quoteForm) quoteForm.reset();
  }

  function saveWeeklyProgress(id, value) {
    const books = getWeeklyBooks();
    const book = books.find((item) => item.id === id);
    if (book) book.progress = value;
    saveWeeklyBooks(books);
    renderAdminWeekly();
  }

  function removeWeeklyBook(id) {
    saveWeeklyBooks(getWeeklyBooks().filter((book) => book.id !== id));
    renderAdminWeekly();
  }

  function addWeeklyBook(data) {
    const books = getWeeklyBooks();
    books.push({
      id: makeId("weekly"),
      title: data.title,
      author: data.author,
      reason: data.reason,
      progress: data.progress
    });
    saveWeeklyBooks(books);
    renderAdminWeekly();
  }

  function addReviewBook(data) {
    const reviews = getBookReviews();
    reviews.push({
      id: makeId("book"),
      title: data.title,
      author: data.author,
      cover: data.cover || "",
      quotes: []
    });
    saveBookReviews(reviews);
    renderAdminReviews();
  }

  function removeReviewBook(id) {
    saveBookReviews(getBookReviews().filter((review) => review.id !== id));
    renderAdminReviews();
  }

  function addReviewQuote(bookId, text, note) {
    const reviews = getBookReviews();
    const review = reviews.find((item) => item.id === bookId);
    if (!review) return;
    review.quotes = review.quotes || [];
    review.quotes.push({
      id: makeId("quote"),
      text,
      note
    });
    saveBookReviews(reviews);
    renderAdminReviews();
  }

  function removeReviewQuote(bookId, quoteId) {
    const reviews = getBookReviews();
    const review = reviews.find((item) => item.id === bookId);
    if (!review) return;
    review.quotes = (review.quotes || []).filter((quote) => quote.id !== quoteId);
    saveBookReviews(reviews);
    renderAdminReviews();
  }

  let adminBound = false;

  function initAdminLibrary() {
    const root = document.getElementById("library");
    if (!root || adminBound) return;
    adminBound = true;

    renderAdminWeekly();
    renderAdminReviews();

    const weeklyForm = document.getElementById("weekly-book-form");
    if (weeklyForm) {
      weeklyForm.addEventListener("submit", (event) => {
        event.preventDefault();
        const title = document.getElementById("weekly-title").value.trim();
        if (!title) return;
        addWeeklyBook({
          title,
          author: document.getElementById("weekly-author").value.trim(),
          reason: document.getElementById("weekly-reason").value.trim(),
          progress: document.getElementById("weekly-progress").value
        });
        resetAdminForms();
      });
    }

    const bookForm = document.getElementById("book-form");
    if (bookForm) {
      bookForm.addEventListener("submit", (event) => {
        event.preventDefault();
        const title = document.getElementById("review-book-title").value.trim();
        if (!title) return;
        addReviewBook({
          title,
          author: document.getElementById("review-book-author").value.trim(),
          cover: document.getElementById("review-book-cover").value.trim()
        });
        resetAdminForms();
      });
    }

    const quoteForm = document.getElementById("quote-form");
    if (quoteForm) {
      quoteForm.addEventListener("submit", (event) => {
        event.preventDefault();
        const bookId = document.getElementById("quote-book-select").value;
        const text = document.getElementById("quote-text").value.trim();
        if (!bookId || !text) return;
        addReviewQuote(
          bookId,
          text,
          document.getElementById("quote-note").value.trim()
        );
        document.getElementById("quote-text").value = "";
        document.getElementById("quote-note").value = "";
      });
    }

    root.addEventListener("click", (event) => {
      const actionButton = event.target.closest("[data-action]");
      if (!actionButton) return;
      const action = actionButton.dataset.action;

      if (action === "remove-weekly") {
        removeWeeklyBook(actionButton.dataset.id);
      } else if (action === "remove-book") {
        removeReviewBook(actionButton.dataset.id);
      } else if (action === "remove-quote") {
        removeReviewQuote(actionButton.dataset.bookId, actionButton.dataset.quoteId);
      }
    });

    root.addEventListener("change", (event) => {
      const select = event.target.closest('[data-action="update-weekly-progress"]');
      if (select) {
        saveWeeklyProgress(select.dataset.id, select.value);
      }
    });
  }

  window.BlogLibrary = {
    getWeeklyBooks,
    getBookReviews,
    saveWeeklyBooks,
    saveBookReviews,
    renderHome,
    renderBooksPage,
    renderAdminWeekly,
    renderAdminReviews,
    initAdminLibrary,
    addWeeklyBook,
    removeWeeklyBook,
    addReviewBook,
    removeReviewBook,
    addReviewQuote,
    removeReviewQuote
  };

  document.addEventListener("DOMContentLoaded", () => {
    renderHome();
    renderBooksPage();
    initAdminLibrary();
  });
})();
