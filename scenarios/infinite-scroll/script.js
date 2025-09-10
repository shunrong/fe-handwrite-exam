/**
 * 无限滚动演示逻辑
 */

class InfiniteScrollDemo {
    constructor() {
        this.infiniteScroll = null;
        this.pageSize = 12;
        this.simulateError = false;
        this.loadCount = 0;
        this.totalItems = 0;
        this.showProgress = false;
        this.animateItems = true;
        
        this.init();
    }
    
    init() {
        this.renderControls();
        this.renderStats();
        this.initInfiniteScroll();
        this.bindEvents();
        this.showConsoleInfo();
        
        // 自动加载第一页
        setTimeout(() => {
            if (this.infiniteScroll) {
                this.infiniteScroll.triggerLoad();
            }
        }, 500);
    }
    
    renderControls() {
        // 渲染复选框
        const checkboxGroup = document.getElementById('checkbox-group');
        if (checkboxGroup) {
            checkboxGroup.innerHTML = controlsConfig.checkboxes.map(checkbox => `
                <label class="checkbox-item">
                    <input type="checkbox" id="${checkbox.id}" ${checkbox.checked ? 'checked' : ''}>
                    <span>${checkbox.label}</span>
                </label>
            `).join('');
        }
        
        // 渲染滑块控件
        const sliderControls = document.getElementById('slider-controls');
        if (sliderControls) {
            sliderControls.innerHTML = controlsConfig.sliders.map(slider => `
                <div class="slider-control">
                    <div class="slider-label">
                        <span>${slider.label}</span>
                        <span id="${slider.id}-value">${slider.format(slider.value)}</span>
                    </div>
                    <input type="range" id="${slider.id}" class="slider" 
                           min="${slider.min}" max="${slider.max}" step="${slider.step}" value="${slider.value}">
                </div>
            `).join('');
        }
    }
    
    renderStats() {
        const statGrid = document.getElementById('stat-grid');
        if (statGrid) {
            statGrid.innerHTML = statsConfig.map(stat => `
                <div class="stat-item">
                    <div class="stat-value" id="${stat.id}">0</div>
                    <div class="stat-label">${stat.label}</div>
                </div>
            `).join('');
        }
    }
    
    initInfiniteScroll() {
        if (this.infiniteScroll) {
            this.infiniteScroll.destroy();
        }
        
        this.infiniteScroll = new InfiniteScroll('#article-list', {
            threshold: parseFloat(document.getElementById('threshold')?.value || 0.1),
            rootMargin: (document.getElementById('root-margin')?.value || 100) + 'px',
            loadMore: this.loadMoreArticles.bind(this),
            renderItem: this.renderArticle.bind(this),
            animateItems: this.animateItems,
            onLoadStart: (page) => {
                console.log(`开始加载第 ${page} 页`);
                this.updateStats();
            },
            onLoadSuccess: (data, state) => {
                console.log(`第 ${state.page - 1} 页加载成功，加载 ${data.length} 条数据`);
                this.updateStats();
            },
            onLoadError: (error, state) => {
                console.error(`第 ${state.page} 页加载失败:`, error.message);
                this.updateStats();
            },
            onLoadComplete: () => {
                this.updateStats();
            }
        });
        
        this.updateStats();
    }
    
    async loadMoreArticles(page) {
        this.loadCount++;
        
        // 模拟网络延迟
        await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));
        
        // 模拟错误
        if (this.simulateError && Math.random() < 0.3) {
            throw new Error('网络连接失败');
        }
        
        // 生成模拟数据
        const articles = generateMockArticles(page, this.pageSize);
        const hasMore = this.totalItems < 300; // 最多300条数据
        
        this.totalItems += articles.length;
        
        return {
            data: articles,
            hasMore,
            total: 300,
            page,
            pageSize: this.pageSize
        };
    }
    
    renderArticle(article) {
        return `
            <div>
                <div class="article-title">${article.title}</div>
                <div class="article-meta">
                    <div class="meta-item">
                        <span>👤</span>
                        <span>${article.author}</span>
                    </div>
                    <div class="meta-item">
                        <span>📂</span>
                        <span>${article.category}</span>
                    </div>
                    <div class="meta-item">
                        <span>📅</span>
                        <span>${article.publishTime}</span>
                    </div>
                    <div class="meta-item">
                        <span>👁️</span>
                        <span>${article.readCount}</span>
                    </div>
                    <div class="meta-item">
                        <span>❤️</span>
                        <span>${article.likeCount}</span>
                    </div>
                    <div class="meta-item">
                        <span>💬</span>
                        <span>${article.commentCount}</span>
                    </div>
                </div>
                <div class="article-excerpt">${article.excerpt}</div>
                <div class="article-tags">
                    ${article.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                </div>
            </div>
        `;
    }
    
    updateStats() {
        const state = this.infiniteScroll.getState();
        const loadedItems = document.querySelectorAll('.list-item').length;
        
        // 更新统计数字
        const currentPageEl = document.getElementById('current-page');
        const loadedItemsEl = document.getElementById('loaded-items');
        const loadCountEl = document.getElementById('load-count');
        const totalItemsEl = document.getElementById('total-items');
        const articleCountEl = document.getElementById('article-count');
        
        if (currentPageEl) currentPageEl.textContent = state.page;
        if (loadedItemsEl) loadedItemsEl.textContent = loadedItems;
        if (loadCountEl) loadCountEl.textContent = this.loadCount;
        if (totalItemsEl) totalItemsEl.textContent = `${this.totalItems}/300`;
        if (articleCountEl) articleCountEl.textContent = `${loadedItems} 篇文章`;
        
        // 更新状态指示器
        const statusIndicator = document.getElementById('status-indicator');
        const errorInfo = document.getElementById('error-info');
        
        if (statusIndicator && errorInfo) {
            if (state.loading) {
                statusIndicator.className = 'status-indicator status-loading';
                statusIndicator.textContent = '正在加载...';
                errorInfo.style.display = 'none';
            } else if (state.error) {
                statusIndicator.className = 'status-indicator status-error';
                statusIndicator.textContent = '加载出错';
                errorInfo.style.display = 'block';
                errorInfo.textContent = `错误: ${state.error}`;
            } else if (!state.hasMore) {
                statusIndicator.className = 'status-indicator status-complete';
                statusIndicator.textContent = '加载完成';
                errorInfo.style.display = 'none';
            } else {
                statusIndicator.className = 'status-indicator status-idle';
                statusIndicator.textContent = '等待加载';
                errorInfo.style.display = 'none';
            }
        }
        
        // 更新进度条
        if (this.showProgress) {
            const progress = Math.min((this.totalItems / 300) * 100, 100);
            const progressFill = document.getElementById('progress-fill');
            const progressContainer = document.getElementById('progress-container');
            
            if (progressFill) progressFill.style.width = `${progress}%`;
            if (progressContainer) progressContainer.style.display = 'block';
        } else {
            const progressContainer = document.getElementById('progress-container');
            if (progressContainer) progressContainer.style.display = 'none';
        }
    }
    
    bindEvents() {
        // 复选框事件
        controlsConfig.checkboxes.forEach(checkbox => {
            const element = document.getElementById(checkbox.id);
            if (element) {
                element.addEventListener('change', (e) => {
                    this.handleCheckboxChange(checkbox.id, e.target.checked);
                });
            }
        });
        
        // 滑块事件
        controlsConfig.sliders.forEach(slider => {
            const element = document.getElementById(slider.id);
            const valueElement = document.getElementById(`${slider.id}-value`);
            
            if (element && valueElement) {
                element.addEventListener('input', (e) => {
                    const value = slider.id === 'threshold' ? 
                        parseFloat(e.target.value) : 
                        parseInt(e.target.value);
                    
                    valueElement.textContent = slider.format(value);
                    this.handleSliderChange(slider.id, value);
                });
            }
        });
        
        // 按钮事件
        const loadBtn = document.getElementById('load-btn');
        const resetBtn = document.getElementById('reset-btn');
        const scrollTopBtn = document.getElementById('scroll-top-btn');
        const scrollBottomBtn = document.getElementById('scroll-bottom-btn');
        
        if (loadBtn) {
            loadBtn.addEventListener('click', () => {
                this.infiniteScroll.triggerLoad();
            });
        }
        
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                this.reset();
            });
        }
        
        if (scrollTopBtn) {
            scrollTopBtn.addEventListener('click', () => {
                document.getElementById('article-list').scrollTo({ top: 0, behavior: 'smooth' });
            });
        }
        
        if (scrollBottomBtn) {
            scrollBottomBtn.addEventListener('click', () => {
                const container = document.getElementById('article-list');
                container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
            });
        }
    }
    
    handleCheckboxChange(id, checked) {
        switch (id) {
            case 'auto-load':
                this.infiniteScroll.options.autoLoad = checked;
                break;
            case 'simulate-error':
                this.simulateError = checked;
                break;
            case 'show-progress':
                this.showProgress = checked;
                this.updateStats();
                break;
            case 'animate-items':
                this.animateItems = checked;
                this.infiniteScroll.options.animateItems = checked;
                break;
        }
    }
    
    handleSliderChange(id, value) {
        switch (id) {
            case 'threshold':
                // 阈值变化需要重新初始化
                break;
            case 'root-margin':
                // 边距变化需要重新初始化
                break;
            case 'page-size':
                this.pageSize = value;
                break;
        }
    }
    
    reset() {
        this.infiniteScroll.reset();
        this.loadCount = 0;
        this.totalItems = 0;
        this.updateStats();
    }
    
    showConsoleInfo() {
        console.log('🎯 无限滚动加载演示已启动');
        console.log('📊 功能特点:');
        console.log('✓ 基于 Intersection Observer API');
        console.log('✓ 自动和手动加载模式');
        console.log('✓ 加载状态和错误处理');
        console.log('✓ 可配置的触发条件');
        console.log('✓ 性能优化和内存管理');
        console.log('✓ 丰富的回调和事件');
        console.log('✓ 降级方案兼容');
        console.log('✓ 实时状态监控');
    }
    
    destroy() {
        if (this.infiniteScroll) {
            this.infiniteScroll.destroy();
        }
    }
}

// 全局实例
let infiniteDemo;

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    infiniteDemo = new InfiniteScrollDemo();
});

// 页面卸载时清理
window.addEventListener('beforeunload', function() {
    if (infiniteDemo) {
        infiniteDemo.destroy();
    }
});
