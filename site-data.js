/* 构建产物会把 content/data/site-data.json 内联到站点页面，
   这里只在浏览器还没有本地设置时，把仓库里的默认配置写入 localStorage。 */
(function () {
  "use strict";

  const script = document.getElementById("site-data-json");
  if (!script) return;

  let data;
  try {
    data = JSON.parse(script.textContent || "{}");
  } catch (error) {
    return;
  }

  const keyMap = {
    appearance: "blogAppearance",
    homeProfile: "blogHomeProfile",
    music: "blogMusic",
    homeBubbleBackgrounds: "blogHomeBubbleBackgrounds",
    homeBubbles: "blogHomeBubbleSettings",
    weeklyCover: "blogWeeklyCover",
    weeklyBooks: "blogWeeklyBooks",
    bookReviews: "blogBookReviews"
  };

  Object.keys(keyMap).forEach(function (sourceKey) {
    if (data[sourceKey] === undefined || data[sourceKey] === null) return;
    try {
      const storageKey = keyMap[sourceKey];
      if (localStorage.getItem(storageKey) === null) {
        localStorage.setItem(storageKey, JSON.stringify(data[sourceKey]));
      }
    } catch (error) {
      // 忽略无法访问的浏览器存储。
    }
  });
})();
