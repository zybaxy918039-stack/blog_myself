function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function safeUrl(value) {
  const url = String(value || "").trim();
  if (/^(https?:|mailto:|tel:|data:|#|\/|\.\.?\/)/i.test(url)) return url;
  return "#";
}

function renderInline(text) {
  let html = escapeHtml(text);

  html = html.replace(
    /!\[([^\]]*)\]\(([^)]+)\)/g,
    (match, alt, src) =>
      `<img src="${safeUrl(src).replace(/"/g, "&quot;")}" alt="${escapeHtml(alt).replace(/"/g, "&quot;")}">`
  );
  html = html.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    (match, label, href) =>
      `<a href="${safeUrl(href).replace(/"/g, "&quot;")}">${label}</a>`
  );
  html = html.replace(/`([^`]+)`/g, "<code>$1</code>");
  html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/~~([^~]+)~~/g, "<del>$1</del>");
  html = html.replace(/\*([^*\n]+)\*/g, "<em>$1</em>");
  return html;
}

function splitTableRow(line) {
  let value = line.trim();
  if (value.startsWith("|")) value = value.slice(1);
  if (value.endsWith("|")) value = value.slice(0, -1);
  const cells = [];
  let buffer = "";
  let escaped = false;
  for (const char of value) {
    if (escaped) {
      buffer += char;
      escaped = false;
      continue;
    }
    if (char === "\\") {
      escaped = true;
      continue;
    }
    if (char === "|") {
      cells.push(buffer.trim());
      buffer = "";
      continue;
    }
    buffer += char;
  }
  cells.push(buffer.trim());
  return cells;
}

export function renderMarkdown(markdown) {
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
    html.push(`<${tag}>${listItems.join("")}</${tag}>`);
    listItems = [];
    listType = "";
  }

  function flushTable(cells) {
    if (!cells.length) return;
    html.push("<table><thead><tr>");
    for (const cell of cells[0] || []) {
      html.push(`<th>${renderInline(cell)}</th>`);
    }
    html.push("</tr></thead><tbody>");
    for (const row of cells.slice(2)) {
      html.push("<tr>");
      for (const cell of row) {
        html.push(`<td>${renderInline(cell)}</td>`);
      }
      html.push("</tr>");
    }
    html.push("</tbody></table>");
  }

  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) {
      flushList();
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
      html.push(`<pre><code>${escapeHtml(codeLines.join("\n"))}</code></pre>`);
      continue;
    }

    const heading = line.match(/^(#{1,6})\s+(.*)$/);
    if (heading) {
      flushList();
      const level = heading[1].length;
      html.push(`<h${level}>${renderInline(heading[2])}</h${level}>`);
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
      html.push(`<blockquote>${quoteLines.map(renderInline).join("<br>")}</blockquote>`);
      continue;
    }

    if (/^[-*+]\s+/.test(line)) {
      if (listType !== "ul") {
        flushList();
        listType = "ul";
      }
      listItems.push(`<li>${renderInline(line.replace(/^[-*+]\s+/, ""))}</li>`);
      i += 1;
      continue;
    }

    const ordered = line.match(/^\d+[.)]\s+(.*)$/);
    if (ordered) {
      if (listType !== "ol") {
        flushList();
        listType = "ol";
      }
      listItems.push(`<li>${renderInline(ordered[1])}</li>`);
      i += 1;
      continue;
    }

    if (line.includes("|") && i + 1 < lines.length && /^\s*\|?[\s:|-]+\|?\s*$/.test(lines[i + 1].trim())) {
      flushList();
      const rows = [];
      while (i < lines.length && lines[i].includes("|")) {
        rows.push(splitTableRow(lines[i]));
        i += 1;
      }
      flushTable(rows);
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
      !/^\d+[.)]\s+/.test(lines[i]) &&
      !lines[i].includes("|")
    ) {
      paragraph.push(lines[i]);
      i += 1;
    }
    html.push(`<p>${paragraph.map(renderInline).join("<br>")}</p>`);
  }

  flushList();
  return html.join("\n");
}
