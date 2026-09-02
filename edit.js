// 编辑器：实时预览、标签、草稿自动保存与发布模拟
(function () {
  "use strict";

  const DRAFT_KEY = "blogDraft";

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function safeUrl(value) {
    const url = String(value || "").trim();
    if (/^(https?:|mailto:|tel:|#|\/|\.\.?\/)/i.test(url)) return url;
    return "#";
  }

  function renderInline(text) {
    let html = escapeHtml(text);
    html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, function (match, alt, src) {
      return '<img src="' + safeUrl(src).replace(/"/g, "&quot;") +
        '" alt="' + alt.replace(/"/g, "&quot;") + '">';
    });
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, function (match, label, href) {
      return '<a href="' + safeUrl(href).replace(/"/g, "&quot;") +
        '">' + label + "</a>";
    });
    html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    html = html.replace(/`([^`]+)`/g, "<code>$1</code>");
    html = html.replace(/\*([^*\n]+)\*/g, "<em>$1</em>");
    return html;
  }

  function parseMarkdown(markdown) {
    const lines = String(markdown || "")
      .replace(/\r\n?/g, "\n")
      .split("\n");
    const html = [];
    let i = 0;
    let listType = "";
    let listItems = [];

    function flushList() {
      if (!listItems.length) return;
      const tag = listType === "ol" ? "ol" : "ul";
      html.push("<" + tag + ">" + listItems.join("") + "</" + tag + ">");
      listItems = [];
      listType = "";
    }

    while (i < lines.length) {
      const line = lines[i];
      if (!line.trim()) {
        flushList();
        html.push("");
        i += 1;
        continue;
      }

      if (/^```/.test(line.trim())) {
        flushList();
        i += 1;
        const codeLines = [];
        while (i < lines.length && !/^```/.test(lines[i].trim())) {
          codeLines.push(lines[i]);
          i += 1;
        }
        if (i < lines.length) i += 1;
        html.push("<pre><code>" + escapeHtml(codeLines.join("\n")) + "</code></pre>");
        continue;
      }

      const heading = line.match(/^(#{1,6})\s+(.*)$/);
      if (heading) {
        flushList();
        const level = heading[1].length;
        html.push("<h" + level + ">" + renderInline(heading[2]) + "</h" + level + ">");
        i += 1;
        continue;
      }

      if (/^(-{3,}|\*{3,})$/.test(line.trim())) {
        flushList();
        html.push("<hr>");
        i += 1;
        continue;
      }

      if (/^>\s?/.test(line)) {
        flushList();
        const quoteLines = [];
        while (i < lines.length && /^>\s?/.test(lines[i])) {
          quoteLines.push(lines[i].replace(/^>\s?/, ""));
          i += 1;
        }
        html.push("<blockquote>" + quoteLines.map(renderInline).join("<br>") + "</blockquote>");
        continue;
      }

      if (/^[-*+]\s+/.test(line)) {
        if (listType !== "ul") {
          flushList();
          listType = "ul";
        }
        listItems.push("<li>" + renderInline(line.replace(/^[-*+]\s+/, "")) + "</li>");
        i += 1;
        continue;
      }

      const ordered = line.match(/^\d+[.)]\s+(.*)$/);
      if (ordered) {
        if (listType !== "ol") {
          flushList();
          listType = "ol";
        }
        listItems.push("<li>" + renderInline(ordered[1]) + "</li>");
        i += 1;
        continue;
      }

      flushList();
      const paragraph = [line];
      i += 1;
      while (
        i < lines.length &&
        lines[i].trim() &&
        !/^(#{1,6})\s+/.test(lines[i]) &&
        !/^```/.test(lines[i].trim()) &&
        !/^>/.test(lines[i]) &&
        !/^[-*+]\s+/.test(lines[i]) &&
        !/^\d+[.)]\s+/.test(lines[i])
      ) {
        paragraph.push(lines[i]);
        i += 1;
      }
      html.push("<p>" + paragraph.map(renderInline).join("<br>") + "</p>");
    }

    flushList();
    return html.join("\n");
  }

  document.addEventListener("DOMContentLoaded", function () {
    const markdownEditor = document.getElementById("markdown-editor");
    const markdownPreview = document.getElementById("markdown-preview");
    const tagsInput = document.getElementById("tags-input");
    const tagsList = document.getElementById("tags-list");
    const saveBtn = document.getElementById("save-btn");
    const publishBtn = document.getElementById("publish-btn");
    const postTitle = document.getElementById("post-title");
    const postCategory = document.getElementById("post-category");

    if (!markdownEditor || !markdownPreview) return;

    const initialContent =
      "# 文章标题\n\n" +
      "开始你的创作...\n\n" +
      "## 章节一\n\n" +
      "这里是文章的主要内容。\n\n" +
      "## 章节二\n\n" +
      "你可以使用 Markdown 语法来格式化你的文章。\n\n" +
      "### 子章节\n\n" +
      "- 列表项一\n" +
      "- 列表项二\n" +
      "- 列表项三\n\n" +
      "> 这是一个引用\n\n" +
      "**加粗文字** 和 *斜体文字*。";

    function updatePreview() {
      markdownPreview.innerHTML = parseMarkdown(markdownEditor.value);
    }

    function collectTags() {
      return Array.from(tagsList.querySelectorAll(".tag")).map(function (tag) {
        return tag.textContent.replace("×", "").trim();
      });
    }

    function addTag(tag) {
      const tagElement = document.createElement("span");
      tagElement.className = "tag";
      tagElement.textContent = tag;

      const remove = document.createElement("span");
      remove.className = "remove";
      remove.textContent = "×";
      remove.setAttribute("aria-label", "删除标签");
      remove.addEventListener("click", function () {
        tagElement.remove();
        scheduleAutoSave();
      });

      tagElement.appendChild(remove);
      tagsList.appendChild(tagElement);
    }

    function addTagFromInput() {
      const value = tagsInput.value.trim();
      if (!value) return;
      const existing = collectTags().some(function (tag) {
        return tag.toLowerCase() === value.toLowerCase();
      });
      if (!existing) addTag(value);
      tagsInput.value = "";
    }

    function readDraftFromForm() {
      return {
        title: postTitle.value.trim(),
        category: postCategory.value,
        tags: collectTags(),
        content: markdownEditor.value,
        savedAt: new Date().toISOString()
      };
    }

    function scheduleAutoSave() {
      clearTimeout(scheduleAutoSave.timer);
      if (!postTitle.value.trim()) return;
      scheduleAutoSave.timer = setTimeout(function () {
        localStorage.setItem(DRAFT_KEY, JSON.stringify(readDraftFromForm()));
      }, 1800);
    }

    markdownEditor.value = initialContent;
    updatePreview();

    const savedDraft = localStorage.getItem(DRAFT_KEY);
    if (savedDraft) {
      try {
        const draft = JSON.parse(savedDraft);
        if (draft.title) postTitle.value = draft.title;
        if (draft.category) postCategory.value = draft.category;
        if (draft.content) markdownEditor.value = draft.content;
        (draft.tags || []).forEach(addTag);
        updatePreview();
      } catch (error) {
        localStorage.removeItem(DRAFT_KEY);
      }
    }

    markdownEditor.addEventListener("input", function () {
      updatePreview();
      scheduleAutoSave();
    });
    postTitle.addEventListener("input", scheduleAutoSave);
    postCategory.addEventListener("change", scheduleAutoSave);
    tagsInput.addEventListener("keydown", function (event) {
      if (event.key === "Enter") {
        event.preventDefault();
        addTagFromInput();
        scheduleAutoSave();
      }
    });

    window.formatText = function (type) {
      const start = markdownEditor.selectionStart;
      const end = markdownEditor.selectionEnd;
      const selected = markdownEditor.value.slice(start, end);
      let replacement = selected;

      if (type === "bold") {
        replacement = selected ? "**" + selected + "**" : "**加粗文字**";
      } else if (type === "italic") {
        replacement = selected ? "*" + selected + "*" : "*斜体文字*";
      } else if (type === "header") {
        replacement = "# " + selected;
      }

      markdownEditor.value =
        markdownEditor.value.slice(0, start) + replacement + markdownEditor.value.slice(end);
      markdownEditor.focus();
      markdownEditor.selectionStart = start;
      markdownEditor.selectionEnd = start + replacement.length;
      updatePreview();
    };

    window.insertImage = function () {
      const url = prompt("请输入图片 URL:");
      if (!url) return;
      const alt = prompt("请输入图片描述:", "图片描述");
      const markdown = "![" + (alt || "图片") + "](" + url + ")";
      const start = markdownEditor.selectionStart;
      markdownEditor.value =
        markdownEditor.value.slice(0, start) + markdown + markdownEditor.value.slice(start);
      updatePreview();
      scheduleAutoSave();
    };

    window.insertBlockquote = function () {
      const blockquote = "> \n\n";
      const start = markdownEditor.selectionStart;
      markdownEditor.value =
        markdownEditor.value.slice(0, start) + blockquote + markdownEditor.value.slice(start);
      markdownEditor.selectionStart = start + 2;
      markdownEditor.selectionEnd = start + 2;
      updatePreview();
      scheduleAutoSave();
    };

    window.insertList = function () {
      const list = "- 列表项\n\n";
      const start = markdownEditor.selectionStart;
      markdownEditor.value =
        markdownEditor.value.slice(0, start) + list + markdownEditor.value.slice(start);
      markdownEditor.selectionStart = start + 2;
      markdownEditor.selectionEnd = start + 2;
      updatePreview();
      scheduleAutoSave();
    };

    saveBtn.addEventListener("click", function () {
      if (!postTitle.value.trim()) {
        alert("请输入文章标题！");
        postTitle.focus();
        return;
      }
      localStorage.setItem(DRAFT_KEY, JSON.stringify(readDraftFromForm()));
      alert("草稿已保存！\n\n浏览器关闭后重新打开，草稿会自动恢复。");
    });

    publishBtn.addEventListener("click", function () {
      const title = postTitle.value.trim();
      if (!title) {
        alert("请输入文章标题！");
        postTitle.focus();
        return;
      }
      const category = postCategory.value;
      const tags = collectTags();
      const draft = readDraftFromForm();
      draft.status = "published";
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
      alert(
        "文章《" + title + "》已进入发布队列！\n\n" +
        "分类：" + category + "\n" +
        "标签：" + (tags.join("、") || "未设置") + "\n\n" +
        "当前为前端模拟，后续接入 GitHub Actions 与 Cloudflare Pages 后可真正上线。"
      );
    });
  });
})();
