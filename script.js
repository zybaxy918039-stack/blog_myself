// 主要脚本
document.addEventListener('DOMContentLoaded', function() {
    // 平滑滚动
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });
    
    // 文章过滤
    const filterButtons = document.querySelectorAll('.filter-btn');
    const postCards = document.querySelectorAll('.post-card:not(.add-new-post-card)');
    
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            // 更新按钮状态
            filterButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            const filter = this.dataset.filter;
            
            // 过滤文章
            postCards.forEach(card => {
                const categories = card.dataset.categories || '';
                if (filter === 'all' || categories.includes(filter)) {
                    card.style.display = 'block';
                    setTimeout(() => card.style.opacity = '1', 10);
                } else {
                    card.style.opacity = '0';
                    setTimeout(() => card.style.display = 'none', 300);
                }
            });
        });
    });
    
    // 添加分类数据到文章卡片
    postCards.forEach(card => {
        const link = card.querySelector('.post-link');
        if (link) {
            const href = link.getAttribute('href');
            if (href.includes('post1')) {
                card.dataset.categories = '随笔';
            } else if (href.includes('post2')) {
                card.dataset.categories = '技术';
            }
        }
    });
    
    // 页面加载动画
    window.addEventListener('load', function() {
        document.body.classList.add('loaded');
    });
});
