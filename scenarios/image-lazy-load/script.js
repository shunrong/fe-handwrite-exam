/**
 * 图片懒加载演示逻辑
 */

class ImageLazyLoadDemo {
    constructor() {
        this.lazyLoader = null;
        this.init();
    }
    
    init() {
        this.renderFeatures();
        this.initLazyLoader();
        this.loadInitialImages();
        this.bindEvents();
        this.showConsoleInfo();
    }
    
    renderFeatures() {
        const featureList = document.getElementById('feature-list');
        if (!featureList) return;
        
        featureList.innerHTML = features.map(feature => `
            <div class="feature-item">
                <div class="feature-icon">${feature.icon}</div>
                <span>${feature.text}</span>
            </div>
        `).join('');
    }
    
    initLazyLoader() {
        this.lazyLoader = new ImageLazyLoader({
            rootMargin: '100px',
            retryCount: 2,
            fadeInDuration: 500
        });
    }
    
    loadInitialImages() {
        const container = document.getElementById('image-container');
        if (!container) return;
        
        // 添加初始图片
        imageData.forEach(data => {
            const card = this.createImageCard(data);
            container.appendChild(card);
        });
        
        // 重新观察新添加的图片
        this.lazyLoader.observeImages();
    }
    
    createImageCard(data) {
        const card = document.createElement('div');
        card.className = 'image-card';
        
        card.innerHTML = `
            <div class="image-wrapper">
                <img data-src="${data.src}" alt="${data.title}" />
            </div>
            <div class="image-info">
                <h3>${data.title}</h3>
                <p>${data.description}</p>
                <p><strong>分类:</strong> ${data.category}</p>
            </div>
        `;
        
        return card;
    }
    
    addMoreImages() {
        const container = document.getElementById('image-container');
        if (!container) return;
        
        const currentCount = container.children.length;
        const moreImages = generateMoreImages(currentCount + 1, 6);
        
        moreImages.forEach(data => {
            const card = this.createImageCard(data);
            container.appendChild(card);
            
            // 观察新添加的图片
            const img = card.querySelector('img[data-src]');
            if (img) {
                img.classList.add('lazy-loading');
                this.lazyLoader.observe(img);
            }
        });
        
        console.log(`添加了 ${moreImages.length} 张新图片`);
    }
    
    scrollToBottom() {
        window.scrollTo({
            top: document.body.scrollHeight,
            behavior: 'smooth'
        });
    }
    
    refreshStats() {
        if (this.lazyLoader) {
            this.lazyLoader.updateStats();
        }
    }
    
    bindEvents() {
        // 监听图片加载事件
        document.addEventListener('lazyload:loaded', (e) => {
            console.log('图片加载成功:', e.detail.src);
        });
        
        document.addEventListener('lazyload:error', (e) => {
            console.error('图片加载失败:', e.detail.src);
        });
        
        // 定期更新统计
        setInterval(() => {
            if (this.lazyLoader) {
                this.lazyLoader.updateStats();
            }
        }, 2000);
    }
    
    showConsoleInfo() {
        console.log('🎯 图片懒加载演示已启动');
        console.log('📊 功能特点:');
        features.forEach(feature => {
            console.log(`${feature.icon} ${feature.text}`);
        });
    }
}

// 全局实例
let imageDemo;

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    imageDemo = new ImageLazyLoadDemo();
});
