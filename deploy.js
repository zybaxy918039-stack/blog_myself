// 部署脚本
document.addEventListener('DOMContentLoaded', function() {
    const deployBtn = document.getElementById('deploy-btn');
    const statusSection = document.getElementById('status');
    const progress = document.getElementById('progress');
    const statusText = document.getElementById('status-text');
    const btnText = deployBtn.querySelector('.btn-text');
    const btnLoading = deployBtn.querySelector('.btn-loading');
    
    deployBtn.addEventListener('click', function() {
        const repo = document.getElementById('github-repo').value;
        const branch = document.getElementById('branch-name').value;
        const autoDeploy = document.getElementById('auto-deploy').checked;
        
        // 表单验证
        if (!repo) {
            alert('请填写 GitHub 仓库地址');
            return;
        }
        
        // 显示部署状态
        deployBtn.disabled = true;
        statusSection.classList.remove('hidden');
        btnText.classList.add('hidden');
        btnLoading.classList.remove('hidden');
        
        // 模拟部署进度
        let progressValue = 0;
        const interval = setInterval(() => {
            progressValue += 10;
            progress.style.width = progressValue + '%';
            
            if (progressValue === 20) {
                statusText.textContent = '正在连接 GitHub 仓库...';
            } else if (progressValue === 50) {
                statusText.textContent = '正在配置 Cloudflare Pages...';
            } else if (progressValue === 80) {
                statusText.textContent = '正在初始化部署环境...';
            } else if (progressValue >= 100) {
                clearInterval(interval);
                statusText.textContent = '部署完成！';
                
                setTimeout(() => {
                    deployBtn.disabled = false;
                    btnText.classList.remove('hidden');
                    btnLoading.classList.add('hidden');
                    progress.style.width = '0%';
                    
                    // 显示成功消息
                    alert('部署成功！\n\n你的博客将很快部署到 Cloudflare Pages。\n访问您的站点: https://your-blog.pages.dev');
                }, 800);
            }
        }, 300);
    });
    
    // GitHub 仓库输入验证
    document.getElementById('github-repo').addEventListener('input', function(e) {
        const value = e.target.value.trim();
        if (value && !value.includes('github.com')) {
            e.target.style.borderColor = '#e94560';
        } else {
            e.target.style.borderColor = '#4a5568';
        }
    });
});
// 部署脚本
document.addEventListener('DOMContentLoaded', function() {
    const deployBtn = document.getElementById('deploy-btn');
    const statusSection = document.getElementById('status');
    const statusDetails = document.getElementById('status-details');
    const progress = document.getElementById('progress');
    const statusText = document.getElementById('status-text');
    const btnText = deployBtn.querySelector('.btn-text');
    const btnLoading = deployBtn.querySelector('.btn-loading');
    const btnIcon = deployBtn.querySelector('.btn-icon');
    
    deployBtn.addEventListener('click', function() {
        const repo = document.getElementById('github-repo').value;
        const branch = document.getElementById('branch-name').value;
        const autoDeploy = document.getElementById('auto-deploy').checked;
        const httpsOnly = document.getElementById('https-only').checked;
        
        // 表单验证
        if (!repo) {
            alert('请填写 GitHub 仓库地址');
            return;
        }
        
        if (!repo.includes('github.com')) {
            alert('请输入有效的 GitHub 仓库地址');
            return;
        }
        
        // 显示部署状态
        deployBtn.disabled = true;
        statusSection.classList.remove('hidden');
        statusDetails.classList.remove('hidden');
        btnText.classList.add('hidden');
        btnLoading.classList.remove('hidden');
        btnIcon.classList.add('hidden');
        
        // 模拟部署进度
        let progressValue = 0;
        const interval = setInterval(() => {
            progressValue += Math.random() * 15;
            if (progressValue > 100) progressValue = 100;
            progress.style.width = progressValue + '%';
            
            if (progressValue < 30) {
                statusText.textContent = '正在连接 GitHub 仓库...';
            } else if (progressValue < 60) {
                statusText.textContent = '正在配置 Cloudflare Pages 项目...';
            } else if (progressValue < 85) {
                statusText.textContent = '正在初始化部署环境...';
            } else if (progressValue < 95) {
                statusText.textContent = '正在上传项目文件...';
            } else if (progressValue >= 100) {
                clearInterval(interval);
                statusText.textContent = '部署完成！';
                statusDetails.style.opacity = '1';
+                 
                setTimeout(() => {
                    deployBtn.disabled = false;
                    btnText.classList.remove('hidden');
                    btnLoading.classList.add('hidden');
                    btnIcon.classList.remove('hidden');
                    progress.style.width = '0%';
                    
                    // 显示成功消息
                    const deployUrl = repo.replace('https://github.com/', 'https://').replace('/blob/main', '');
                    const alertMessage = `🎉 部署成功！

✅ GitHub 仓库: ${repo}
📁 部署分支: ${branch}
🔒 HTTPS 强制: ${httpsOnly ? '是' : '否'}

🌐 你的站点将在几分钟后上线
访问地址: ${deployUrl}

💡 提示: 你可以在 Cloudflare Dashboard 中管理部署和绑定自定义域名`;
                    
                    alert(alertMessage);
                }, 800);
            }
        }, 400);
    });
    
    // GitHub 仓库输入验证
    document.getElementById('github-repo').addEventListener('input', function(e) {
        const value = e.target.value.trim();
        if (value && !value.includes('github.com')) {
            e.target.style.borderColor = '#e94560';
        } else {
            e.target.style.borderColor = '#4a5568';
        }
    });
    
    // 表单提交处理
    deployBtn.addEventListener('click', function(e) {
        e.preventDefault();
    });
});
