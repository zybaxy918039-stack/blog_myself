/* Cloudflare Pages Functions 会在页面内联当前 D1 配置。
   公开页面只读取这份服务端数据，不向 localStorage 写入任何覆盖值。 */
(function () {
  "use strict";

  const script = document.getElementById("site-data-json");
  if (!script) return;

  try {
    window.BlogSiteData = JSON.parse(script.textContent || "{}");
  } catch (error) {
    window.BlogSiteData = {};
  }
})();
