// 部署辅助脚本：生成首次部署清单，并提供可复制的本地部署命令。
// 真正的部署由 GitHub Actions 完成，浏览器不接触 Cloudflare 令牌。
document.addEventListener("DOMContentLoaded", function () {
  const repoInput = document.getElementById("github-repo");
  const branchInput = document.getElementById("branch-name");
  const accountInput = document.getElementById("cloudflare-account");
  const checklistBtn = document.getElementById("checklist-btn");
  const copyCommandBtn = document.getElementById("copy-command-btn");
  const statusSection = document.getElementById("status");
  const progress = document.getElementById("progress");
  const statusText = document.getElementById("status-text");
  const checklist = document.getElementById("checklist");

  function parseRepo(value) {
    const text = String(value || "").trim().replace(/^https?:\/\//, "").replace(/^www\./, "");
    const match = text.match(/^github\.com\/([^/#?]+)\/([^/#?]+)/i);
    if (!match) return null;
    return {
      owner: match[1],
      repo: match[2],
      full: `${match[1]}/${match[2]}`
    };
  }

  function setProgress(value) {
    progress.style.width = value + "%";
  }

  function buildChecklist() {
    const repo = parseRepo(repoInput.value);
    const branch = String(branchInput.value || "main").trim();
    const account = String(accountInput.value || "").trim();
    const items = [];

    items.push({
      label: "在 Cloudflare 创建 API Token",
      detail: "权限：Account 下 D1、R2、Workers Scripts、Pages 的编辑权限。",
      ok: true
    });
    items.push({
      label: "添加 GitHub Secrets",
      detail: "仓库 Settings > Secrets and variables > Actions，添加 CLOUDFLARE_API_TOKEN 和 CLOUDFLARE_ACCOUNT_ID。",
      ok: true
    });
    items.push({
      label: "填写仓库地址",
      detail: repo ? `将推送 ${repo.full} 的 ${branch} 分支。` : "需要先填写 GitHub 仓库地址。",
      ok: Boolean(repo)
    });
    items.push({
      label: "推送触发自动部署",
      detail: "推送后到 GitHub Actions 查看 Deploy Blog to Cloudflare Pages 运行状态。",
      ok: Boolean(repo)
    });
    items.push({
      label: "绑定自定义域名（仅首次）",
      detail: account ? `Cloudflare 账户 ID：${account}` : "在 Actions 部署成功后，到 Pages 项目设置绑定你的 Cloudflare 域名。",
      ok: true
    });

    return items;
  }

  checklistBtn.addEventListener("click", function () {
    const repo = parseRepo(repoInput.value);
    const account = String(accountInput.value || "").trim();
    if (account) {
      try {
        localStorage.setItem("blogDeployAccountId", account);
      } catch (error) {
        // 忽略存储失败。
      }
    }

    const items = buildChecklist();
    const completed = items.filter((item) => item.ok).length;
    statusSection.classList.remove("hidden");
    setProgress(Math.round((completed / items.length) * 100));
    statusText.textContent = repo
      ? `清单已生成：${completed} / ${items.length} 项已确认，其余步骤见下方。`
      : "请先填写 GitHub 仓库地址，其余步骤仍会展示。";
    checklist.innerHTML = items
      .map((item) => {
        const mark = item.ok ? "&#10003;" : "&#9888;";
        const cls = item.ok ? "status-item" : "status-item status-warn";
        return `<div class="${cls}"><span class="status-label">${mark} ${item.label}</span><span class="status-value">${item.detail}</span></div>`;
      })
      .join("");
  });

  copyCommandBtn.addEventListener("click", function () {
    const account = String(accountInput.value || "").trim();
    const repo = parseRepo(repoInput.value);
    const accountLine = account || "<你的 Cloudflare Account ID>";
    const bash = `export CLOUDFLARE_API_TOKEN="<你的 API Token>"
export CLOUDFLARE_ACCOUNT_ID="${accountLine}"
export CLOUDFLARE_PAGES_PROJECT="${repo ? repo.repo : "blog"}"
npm run deploy`;
    const powershell = `$env:CLOUDFLARE_API_TOKEN = "<你的 API Token>"
$env:CLOUDFLARE_ACCOUNT_ID = "${accountLine}"
$env:CLOUDFLARE_PAGES_PROJECT = "${repo ? repo.repo : "blog"}"
npm run deploy`;
    const text = `Bash:\n${bash}\n\nPowerShell:\n${powershell}`;

    function fallbackCopy() {
      const hidden = document.createElement("textarea");
      hidden.value = text;
      hidden.style.position = "fixed";
      hidden.style.opacity = "0";
      document.body.appendChild(hidden);
      hidden.select();
      try {
        document.execCommand("copy");
      } catch (error) {
        window.prompt("请手动复制以下命令：", text);
      }
      document.body.removeChild(hidden);
    }

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(
        function () {
          statusSection.classList.remove("hidden");
          setProgress(100);
          statusText.textContent = "本地部署命令已复制到剪贴板。";
        },
        fallbackCopy
      );
    } else {
      fallbackCopy();
    }
  });

  repoInput.addEventListener("input", function () {
    const valid = parseRepo(repoInput.value);
    repoInput.style.borderColor = repoInput.value.trim() && !valid ? "#e94560" : "#4a5568";
  });

  try {
    const savedAccount = localStorage.getItem("blogDeployAccountId");
    if (savedAccount && !accountInput.value) {
      accountInput.value = savedAccount;
    }
  } catch (error) {
    // 忽略存储失败。
  }
});
