// 编辑器脚本
document.addEventListener('DOMContentLoaded', function() {
    const markdownEditor = document.getElementById('markdown-editor');
    const markdownPreview = document.getElementById('markdown-preview');
    const tagsInput = document.getElementById('tags-input');
    const tagsList = document.getElementById('tags-list');
    const saveBtn = document.getElementById('save-btn');
    const publishBtn = document.getElementById('publish-btn');
    
    // 初始化编辑器内容
    const initialContent = `# 欢迎来到我的博客

这是我的第一个博客文章！

在这里，我会记录技术文章、生活随笔和小说草稿。

## 关于这个博客

这个博客是用静态网站技术构建的，具有以下特点：

- 简洁优雅的设计
- Markdown 编辑支持
- 响应式布局
- Cloudflare Pages 部署

## 未来计划

我计划在这个博客上分享：

- 技术文章（编程、工具使用等）
- 生活随笔（日常点滴）
- 小说创作（故事和想法）
- 项目展示（个人作品）

> 写作是一种表达，分享是一种快乐。
`;
    
    markdownEditor.value = initialContent;
    updatePreview();
    
    // 实时预览
    markdownEditor.addEventListener('input', updatePreview);
    
    // 标签输入
    tagsInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            const tag = this.value.trim();
            if (tag && !tagsList.innerHTML.includes(tag)) {
                addTag(tag);
                this.value = '';
            }
        }
    });
    
    // 更新预览
    function updatePreview() {
        const markdown = markdownEditor.value;
        markdownPreview.innerHTML = parseMarkdown(markdown);
    }
    
    // 简单的 Markdown 解析
    function parseMarkdown(markdown) {
        let html = markdown
            // 标题
            .replace(/^### (.*$)/gim, '<h3>$1</h3>')
            .replace(/^## (.*$)/gim, '<h2>$1</h2>')
            .replace(/^# (.*$)/gim, '<h1>$1</h1>')
            // 引用
            .replace(/^> (.*$)/gim, '<blockquote>$1</blockquote>')
            // 粗体
            .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
            // 斜体
            .replace(/\*(.*)\*/gim, '<em>$1</em>')
            // 列表
            .replace(/^\* (.*$)/gim, '<li>$1</li>')
            .replace(/^(.+)\n/gim, '<p>$1</p>')
            .replace(/(<li>.*<\/li>\n?)+/gim, '<ul>$&</ul>');
        
        return html;
    }
    
    // 添加标签
    function addTag(tag) {
        const tagElement = document.createElement('span');
        tagElement.className = 'tag';
        tagElement.innerHTML = `${tag} <span class="remove">×</span>`;
        tagElement.querySelector('.remove').addEventListener('click', function() {
            tagElement.remove();
        });
        tagsList.appendChild(tagElement);
    }
    
    // 格式化文本
    window.formatText = function(type) {
        const start = markdownEditor.selectionStart;
        const end = markdownEditor.selectionEnd;
        const text = markdownEditor.value;
        const selectedText = text.substring(start, end);
        
        let formattedText;
        switch(type) {
            case 'bold':
                formattedText = `**${selectedText}**`;
                break;
            case 'italic':
                formattedText = `*${selectedText}*`;
                break;
            case 'header':
                formattedText = `# ${selectedText}`;
                break;
            default:
                formattedText = selectedText;
        }
        
        markdownEditor.value = text.substring(0, start) + formattedText + text.substring(end);
        markdownEditor.selectionStart = markdownEditor.selectionEnd = start + formattedText.length - (selectedText.length);
        updatePreview();
    };
    
    // 插入图片
    window.insertImage = function() {
        const url = prompt('请输入图片 URL:');
        if (url) {
            const alt = prompt('请输入图片描述:', '图片描述');
            const imageMarkdown = `![${alt}](${url})`;
            const start = markdownEditor.selectionStart;
            markdownEditor.value = markdownEditor.value.substring(0, start) + imageMarkdown + markdownEditor.value.substring(start);
            updatePreview();
        }
    };
    
    // 保存草稿
    saveBtn.addEventListener('click', function() {
        const title = document.getElementById('post-title').value;
        const category = document.getElementById('post-category').value;
        const tags = Array.from(tagsList.querySelectorAll('.tag')).map(t => t.textContent.replace('×', '').trim());
        const content = markdownEditor.value;
        
        const draft = {
            title,
            category,
            tags,
            content,
            savedAt: new Date().toISOString()
        };
        
        localStorage.setItem('blogDraft', JSON.stringify(draft));
        alert('草稿已保存！');
    });
    
    // 发布文章
    publishBtn.addEventListener('click', function() {
        const title = document.getElementById('post-title').value;
        if (!title.trim()) {
            alert('请输入文章标题！');
            return;
        }
        
        const category = document.getElementById('post-category').value;
        const tags = Array.from(tagsList.querySelectorAll('.tag')).map(t => t.textContent.replace('×', '').trim());
        const content = markdownEditor.value;
        
        const post = {
            id: 'post_' + Date.now(),
            title,
            category,
            tags,
            content,
            createdAt: new Date().toISOString(),
            status: 'published'
        };
        
        // 这里可以添加发布逻辑
        alert(`文章 "${title}" 发布成功！\n\n分类: ${category}\n标签: ${tags.join(', ')}`);
    });
    
    // 加载草稿
    const savedDraft = localStorage.getItem('blogDraft');
    if (savedDraft) {
        const draft = JSON.parse(savedDraft);
        document.getElementById('post-title').value = draft.title || '';
        document.getElementById('post-category').value = draft.category || '随笔';
        markdownEditor.value = draft.content || '';
        updatePreview();
    }
});
// 编辑器脚本
document.addEventListener('DOMContentLoaded', function() {
    const markdownEditor = document.getElementById('markdown-editor');
    const markdownPreview = document.getElementById('markdown-preview');
    const tagsInput = document.getElementById('tags-input');
    const tagsList = document.getElementById('tags-list');
    const saveBtn = document.getElementById('save-btn');
    const publishBtn = document.getElementById('publish-btn');
    const postTitle = document.getElementById('post-title');
    const postCategory = document.getElementById('post-category');
    
    // 初始化编辑器内容
    const initialContent = `# 文章标题

开始你的创作...

## 章节一

这里是文章的主要内容。

## 章节二

你可以使用 Markdown 语法来格式化你的文章。

### 子章节

- 列表项一
- 列表项二
- 列表项三

> 这是一个引用

**加粗文字** 和 *斜体文字*。
`;
    
    markdownEditor.value = initialContent;
    updatePreview();
    
    // 实时预览
    markdownEditor.addEventListener('input', updatePreview);
    
    // 标签输入
    tagsInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            const tag = this.value.trim();
            if (tag && !tagsList.innerHTML.includes(tag)) {
                addTag(tag);
                this.value = '';
            }
        }
    });
    
    // 更新预览
    function updatePreview() {
        const markdown = markdownEditor.value;
        markdownPreview.innerHTML = parseMarkdown(markdown);
    }
    
    // 简单的 Markdown 解析
    function parseMarkdown(markdown) {
        let html = markdown
            // 标题
            .replace(/^### (.*$)/gim, '<h3>$1</h3>')
            .replace(/^## (.*$)/gim, '<h2>$1</h2>')
            .replace(/^# (.*$)/gim, '<h1>$1</h1>')
            // 引用
            .replace(/^> (.*$)/gim, '<blockquote><p>$1</p></blockquote>')
            // 粗体
            .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
            // 斜体
            .replace(/\*(.*)\*/gim, '<em>$1</em>')
            // 无序列表
            .replace(/^\- (.*$)/gim, '<li>$1</li>')
            .replace(/^\* (.*$)/gim, '<li>$1</li>')
            // 有序列表
            .replace(/^\d+\. (.*$)/gim, '<li>$1</li>')
            // 段落
            .replace(/^(?!<h|<b|<i|<l|<q|<u)(.+)\n/gim, '<p>$1</p>')
            // 列表包装
            .replace(/(<li>.*<\/li>\n?)+/gim, '<ul>$&</ul>');
        
        return html;
    }
    
    // 添加标签
    function addTag(tag) {
        const tagElement = document.createElement('span');
        tagElement.className = 'tag';
        tagElement.innerHTML = `${tag} <span class="remove">×</span>`;
        tagElement.querySelector('.remove').addEventListener('click', function() {
            tagElement.remove();
        });
        tagsList.appendChild(tagElement);
    }
    
    // 格式化文本
    window.formatText = function(type) {
        const start = markdownEditor.selectionStart;
        const end = markdownEditor.selectionEnd;
        const text = markdownEditor.value;
        const selectedText = text.substring(start, end);
        
        let formattedText;
        switch(type) {
            case 'bold':
                formattedText = `**${selectedText}**`;
                break;
            case 'italic':
                formattedText = `*${selectedText}*`;
                break;
            case 'header':
                formattedText = `# ${selectedText}`;
                break;
            default:
                formattedText = selectedText;
        }
        
        markdownEditor.value = text.substring(0, start) + formattedText + text.substring(end);
        markdownEditor.selectionStart = markdownEditor.selectionEnd = start + formattedText.length - (selectedText.length);
        updatePreview();
    };
    
    // 插入图片
    window.insertImage = function() {
        const url = prompt('请输入图片 URL:');
        if (url) {
            const alt = prompt('请输入图片描述:', '图片描述');
            const imageMarkdown = `![${alt}](${url})`;
            const start = markdownEditor.selectionStart;
            markdownEditor.value = markdownEditor.value.substring(0, start) + imageMarkdown + markdownEditor.value.substring(start);
            updatePreview();
        }
    };
    
    // 插入引用
    window.insertBlockquote = function() {
        const start = markdownEditor.selectionStart;
        const blockquote = '> \n\n';
        markdownEditor.value = markdownEditor.value.substring(0, start) + blockquote + markdownEditor.value.substring(start);
        markdownEditor.selectionStart = markdownEditor.selectionEnd = start + blockquote.length - 2;
        updatePreview();
    };
    
    // 插入列表
    window.insertList = function() {
        const start = markdownEditor.selectionStart;
        const list = '- 列表项\n\n';
        markdownEditor.value = markdownEditor.value.substring(0, start) + list + markdownEditor.value.substring(start);
        markdownEditor.selectionStart = markdownEditor.selectionEnd = start + list.length - 1;
        updatePreview();
    };
    
    // 保存草稿
    saveBtn.addEventListener('click', function() {
        const title = postTitle.value.trim();
        const category = postCategory.value;
        const tags = Array.from(tagsList.querySelectorAll('.tag')).map(t => t.textContent.replace('×', '').trim());
        const content = markdownEditor.value;
        
        if (!title) {
            alert('请输入文章标题！');
            return;
        }
        
        const draft = {
            title,
            category,
            tags,
            content,
            savedAt: new Date().toISOString()
        };
        
        localStorage.setItem('blogDraft', JSON.stringify(draft));
        alert('草稿已保存！\n\n你可以在浏览器关闭后重新打开，草稿会自动恢复。');
    });
    
    // 发布文章
    publishBtn.addEventListener('click', function() {
        const title = postTitle.value.trim();
        if (!title) {
            alert('请输入文章标题！');
            return;
        }
        
        const category = postCategory.value;
        const tags = Array.from(tagsList.querySelectorAll('.tag')).map(t => t.textContent.replace('×', '').trim());
        const content = markdownEditor.value;
        
        const post = {
            id: 'post_' + Date.now(),
            title,
            category,
            tags,
            content,
            createdAt: new Date().toISOString(),
            status: 'published'
        };
        
        // 这里可以添加发布逻辑
        alert(`文章 "${title}" 发布成功！\n\n分类: ${category}\n标签: ${tags.join(', ')}\n\n你可以通过部署页面将博客部署到 Cloudflare Pages。`);
    });
    
    // 加载草稿
    const savedDraft = localStorage.getItem('blogDraft');
    if (savedDraft) {
        const draft = JSON.parse(savedDraft);
        postTitle.value = draft.title || '';
        postCategory.value = draft.category || '随笔';
        markdownEditor.value = draft.content || '';
        updatePreview();
    }
    
    // 添加自动保存功能
    let autoSaveInterval;
    markdownEditor.addEventListener('input', function() {
        clearTimeout(autoSaveInterval);
        autoSaveInterval = setTimeout(function() {
            if (postTitle.value.trim()) {
                const draft = {
                    title: postTitle.value.trim(),
                    category: postCategory.value,
                    tags: Array.from(tagsList.querySelectorAll('.tag')).map(t => t.textContent.replace('×', '').trim()),
                    content: markdownEditor.value,
                    savedAt: new Date().toISOString()
                };
                localStorage.setItem('blogDraft', JSON.stringify(draft));
            }
        }, 2000);
    });
});
