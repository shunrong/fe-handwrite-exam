/**
 * 图片懒加载核心功能
 * 基于 Intersection Observer API
 */

class ImageLazyLoader {
    constructor(options = {}) {
        this.options = {
            rootMargin: '50px',
            threshold: 0.01,
            placeholder: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjhmOWZhIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzY2NiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkxvYWRpbmcuLi48L3RleHQ+PC9zdmc+',
            errorImage: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjVmNWY1IiBzdHJva2U9IiNkZGQiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmaWxsPSIjOTk5IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+SW1hZ2UgRmFpbGVkPC90ZXh0Pjwvc3ZnPg==',
            retryCount: 3,
            retryDelay: 1000,
            fadeInDuration: 300,
            ...options
        };
        
        this.observer = null;
        this.imageCache = new Map();
        this.loadingImages = new Set();
        this.loadedCount = 0;
        this.totalCount = 0;
        this.init();
    }
    
    init() {
        if (!('IntersectionObserver' in window)) {
            console.warn('IntersectionObserver not supported, falling back to immediate loading');
            this.fallbackLoad();
            return;
        }
        
        this.observer = new IntersectionObserver(
            this.handleIntersection.bind(this),
            {
                rootMargin: this.options.rootMargin,
                threshold: this.options.threshold
            }
        );
        
        this.observeImages();
    }
    
    handleIntersection(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                this.loadImage(img);
                this.observer.unobserve(img);
            }
        });
    }
    
    observeImages() {
        const images = document.querySelectorAll('img[data-src]');
        this.totalCount = images.length;
        
        images.forEach(img => {
            if (!img.src && this.options.placeholder) {
                img.src = this.options.placeholder;
            }
            
            img.classList.add('lazy-loading');
            this.addLoadingIndicator(img);
            this.observer.observe(img);
        });
        
        this.updateStats();
    }
    
    addLoadingIndicator(img) {
        const wrapper = img.closest('.image-wrapper');
        if (wrapper) {
            const indicator = document.createElement('div');
            indicator.className = 'loading-indicator';
            indicator.innerHTML = '<div class="spinner"></div><span>加载中...</span>';
            wrapper.appendChild(indicator);
            
            const badge = document.createElement('div');
            badge.className = 'status-badge status-loading';
            badge.textContent = '加载中';
            wrapper.appendChild(badge);
        }
    }
    
    async loadImage(img) {
        const src = img.dataset.src;
        if (!src || this.loadingImages.has(src)) return;
        
        this.loadingImages.add(src);
        
        try {
            if (this.imageCache.has(src)) {
                this.setImageSrc(img, src);
                return;
            }
            
            const loadedImage = await this.preloadImage(src);
            this.imageCache.set(src, loadedImage);
            this.setImageSrc(img, src);
            
        } catch (error) {
            console.error('Image load failed:', error);
            this.handleImageError(img, src);
        } finally {
            this.loadingImages.delete(src);
        }
    }
    
    preloadImage(src, retryCount = this.options.retryCount) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            
            const onLoad = () => {
                cleanup();
                resolve(img);
            };
            
            const onError = () => {
                cleanup();
                if (retryCount > 0) {
                    console.log(`Image load failed, retrying... (${retryCount} attempts left)`);
                    setTimeout(() => {
                        this.preloadImage(src, retryCount - 1)
                            .then(resolve)
                            .catch(reject);
                    }, this.options.retryDelay);
                } else {
                    reject(new Error(`Failed to load image: ${src}`));
                }
            };
            
            const cleanup = () => {
                img.removeEventListener('load', onLoad);
                img.removeEventListener('error', onError);
            };
            
            img.addEventListener('load', onLoad);
            img.addEventListener('error', onError);
            img.src = src;
        });
    }
    
    setImageSrc(img, src) {
        const wrapper = img.closest('.image-wrapper');
        
        img.style.opacity = '0';
        img.style.transition = `opacity ${this.options.fadeInDuration}ms ease-in-out`;
        
        img.onload = () => {
            img.style.opacity = '1';
            img.classList.remove('lazy-loading');
            img.classList.add('lazy-loaded');
            
            // 更新状态指示器
            if (wrapper) {
                const indicator = wrapper.querySelector('.loading-indicator');
                const badge = wrapper.querySelector('.status-badge');
                
                if (indicator) indicator.remove();
                if (badge) {
                    badge.className = 'status-badge status-loaded';
                    badge.textContent = '已加载';
                }
            }
            
            this.loadedCount++;
            this.updateStats();
            
            img.dispatchEvent(new CustomEvent('lazyload:loaded', {
                detail: { src, img }
            }));
        };
        
        img.src = src;
    }
    
    handleImageError(img, src) {
        if (this.options.errorImage) {
            img.src = this.options.errorImage;
        }
        
        img.classList.remove('lazy-loading');
        img.classList.add('lazy-error');
        
        const wrapper = img.closest('.image-wrapper');
        if (wrapper) {
            const indicator = wrapper.querySelector('.loading-indicator');
            const badge = wrapper.querySelector('.status-badge');
            
            if (indicator) indicator.remove();
            if (badge) {
                badge.className = 'status-badge status-error';
                badge.textContent = '加载失败';
            }
        }
        
        this.updateStats();
        
        img.dispatchEvent(new CustomEvent('lazyload:error', {
            detail: { src, img }
        }));
    }
    
    updateStats() {
        const stats = this.getStats();
        const progressFill = document.getElementById('progress-fill');
        const progressText = document.getElementById('progress-text');
        const statsContent = document.getElementById('stats-content');
        
        const percentage = stats.total > 0 ? Math.round((stats.loaded / stats.total) * 100) : 0;
        
        if (progressFill) {
            progressFill.style.width = `${percentage}%`;
        }
        
        if (progressText) {
            progressText.textContent = `${percentage}% 已加载`;
        }
        
        if (statsContent) {
            statsContent.innerHTML = `
                <p><strong>缓存图片:</strong> ${stats.cached}</p>
                <p><strong>正在加载:</strong> ${stats.loading}</p>
                <p><strong>已完成:</strong> ${stats.loaded}</p>
                <p><strong>总计:</strong> ${stats.total}</p>
                <p><strong>完成率:</strong> ${percentage}%</p>
            `;
        }
    }
    
    fallbackLoad() {
        const images = document.querySelectorAll('img[data-src]');
        images.forEach(img => {
            this.loadImage(img);
        });
    }
    
    observe(img) {
        this.totalCount++;
        if (this.observer) {
            this.observer.observe(img);
        } else {
            this.loadImage(img);
        }
        this.updateStats();
    }
    
    getStats() {
        return {
            cached: this.imageCache.size,
            loading: this.loadingImages.size,
            loaded: this.loadedCount,
            total: this.totalCount
        };
    }
    
    destroy() {
        if (this.observer) {
            this.observer.disconnect();
        }
        this.imageCache.clear();
        this.loadingImages.clear();
    }
}
