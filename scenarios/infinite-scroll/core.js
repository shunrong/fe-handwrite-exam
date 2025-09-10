/**
 * 无限滚动加载核心功能
 */

class InfiniteScroll {
    constructor(container, options = {}) {
        this.container = typeof container === 'string' 
            ? document.querySelector(container) 
            : container;
        
        this.options = {
            threshold: 0.1,
            rootMargin: '100px',
            loadMore: null,
            hasMore: true,
            loading: false,
            autoLoad: true,
            loadingText: '加载中...',
            errorText: '加载失败，点击重试',
            noMoreText: '没有更多了',
            itemSelector: '.list-item',
            ...options
        };
        
        this.state = {
            loading: false,
            hasMore: true,
            error: null,
            page: 1,
            totalLoaded: 0
        };
        
        this.callbacks = {
            onLoadStart: options.onLoadStart || (() => {}),
            onLoadSuccess: options.onLoadSuccess || (() => {}),
            onLoadError: options.onLoadError || (() => {}),
            onLoadComplete: options.onLoadComplete || (() => {})
        };
        
        this.observer = null;
        this.sentinel = null;
        
        this.init();
    }
    
    init() {
        this.createSentinel();
        this.setupObserver();
        this.bindEvents();
    }
    
    createSentinel() {
        this.sentinel = document.createElement('div');
        this.sentinel.className = 'infinite-scroll-sentinel';
        this.sentinel.style.cssText = `
            height: 1px;
            margin: 0;
            padding: 0;
            border: none;
            background: transparent;
        `;
        
        this.loadingIndicator = document.createElement('div');
        this.loadingIndicator.className = 'infinite-scroll-loading';
        this.loadingIndicator.style.cssText = `
            text-align: center;
            padding: 20px;
            color: #666;
            font-size: 14px;
        `;
        
        this.container.appendChild(this.sentinel);
        this.container.appendChild(this.loadingIndicator);
        
        this.updateLoadingIndicator();
    }
    
    setupObserver() {
        if (!('IntersectionObserver' in window)) {
            console.warn('IntersectionObserver not supported, falling back to scroll events');
            this.setupScrollFallback();
            return;
        }
        
        this.observer = new IntersectionObserver(
            (entries) => {
                const entry = entries[0];
                if (entry.isIntersecting && this.shouldLoadMore()) {
                    this.loadMore();
                }
            },
            {
                root: null,
                rootMargin: this.options.rootMargin,
                threshold: this.options.threshold
            }
        );
        
        this.observer.observe(this.sentinel);
    }
    
    setupScrollFallback() {
        let ticking = false;
        
        const handleScroll = () => {
            if (!ticking) {
                requestAnimationFrame(() => {
                    this.checkScrollPosition();
                    ticking = false;
                });
                ticking = true;
            }
        };
        
        window.addEventListener('scroll', handleScroll, { passive: true });
        this.handleScroll = handleScroll;
    }
    
    checkScrollPosition() {
        const rect = this.sentinel.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        
        if (rect.top <= viewportHeight && this.shouldLoadMore()) {
            this.loadMore();
        }
    }
    
    bindEvents() {
        this.loadingIndicator.addEventListener('click', () => {
            if (this.state.error) {
                this.retry();
            }
        });
    }
    
    shouldLoadMore() {
        return this.state.hasMore && 
               !this.state.loading && 
               !this.state.error &&
               this.options.autoLoad;
    }
    
    async loadMore() {
        if (!this.shouldLoadMore()) return;
        
        this.setState({
            loading: true,
            error: null
        });
        
        this.callbacks.onLoadStart(this.state.page);
        
        try {
            const result = await this.options.loadMore(this.state.page);
            
            if (result && result.data) {
                this.handleLoadSuccess(result);
            } else {
                throw new Error('Invalid response format');
            }
            
        } catch (error) {
            this.handleLoadError(error);
        } finally {
            this.callbacks.onLoadComplete(this.state.page);
        }
    }
    
    handleLoadSuccess(result) {
        const { data, hasMore = false, total = 0 } = result;
        
        if (Array.isArray(data) && data.length > 0) {
            this.renderItems(data);
            this.state.totalLoaded += data.length;
            this.state.page++;
        }
        
        this.setState({
            loading: false,
            hasMore: hasMore && (total === 0 || this.state.totalLoaded < total),
            error: null
        });
        
        this.callbacks.onLoadSuccess(data, this.state);
    }
    
    handleLoadError(error) {
        this.setState({
            loading: false,
            error: error.message || '加载失败'
        });
        
        this.callbacks.onLoadError(error, this.state);
    }
    
    renderItems(items) {
        const fragment = document.createDocumentFragment();
        
        items.forEach((item, index) => {
            const element = this.createItemElement(item);
            
            if (this.options.animateItems) {
                element.style.opacity = '0';
                element.style.transform = 'translateY(20px)';
                element.style.transition = 'all 0.3s ease';
                
                setTimeout(() => {
                    element.style.opacity = '1';
                    element.style.transform = 'translateY(0)';
                }, index * 100);
            }
            
            fragment.appendChild(element);
        });
        
        this.container.insertBefore(fragment, this.sentinel);
    }
    
    createItemElement(item) {
        const element = document.createElement('div');
        element.className = 'list-item';
        
        if (this.options.renderItem) {
            const content = this.options.renderItem(item);
            if (typeof content === 'string') {
                element.innerHTML = content;
            } else if (content instanceof HTMLElement) {
                element.appendChild(content);
            }
        } else {
            element.textContent = JSON.stringify(item);
        }
        
        return element;
    }
    
    setState(newState) {
        this.state = { ...this.state, ...newState };
        this.updateLoadingIndicator();
    }
    
    updateLoadingIndicator() {
        if (this.state.loading) {
            this.loadingIndicator.innerHTML = `
                <div class="loading-indicator">
                    <div class="loading-spinner"></div>
                    ${this.options.loadingText}
                </div>
            `;
            this.loadingIndicator.style.cursor = 'default';
        } else if (this.state.error) {
            this.loadingIndicator.innerHTML = `
                <div class="error-retry">
                    🔄 ${this.options.errorText}
                </div>
            `;
            this.loadingIndicator.style.cursor = 'pointer';
        } else if (!this.state.hasMore) {
            this.loadingIndicator.innerHTML = `
                <div class="no-more">
                    ${this.options.noMoreText}
                </div>
            `;
            this.loadingIndicator.style.cursor = 'default';
        } else {
            this.loadingIndicator.innerHTML = '';
        }
    }
    
    retry() {
        if (this.state.error) {
            this.loadMore();
        }
    }
    
    reset() {
        this.setState({
            loading: false,
            hasMore: true,
            error: null,
            page: 1,
            totalLoaded: 0
        });
        
        const items = this.container.querySelectorAll(this.options.itemSelector);
        items.forEach(item => item.remove());
    }
    
    triggerLoad() {
        if (this.shouldLoadMore()) {
            this.loadMore();
        }
    }
    
    setHasMore(hasMore) {
        this.setState({ hasMore });
    }
    
    getState() {
        return { ...this.state };
    }
    
    destroy() {
        if (this.observer) {
            this.observer.disconnect();
        }
        
        if (this.handleScroll) {
            window.removeEventListener('scroll', this.handleScroll);
        }
        
        if (this.sentinel) {
            this.sentinel.remove();
        }
        
        if (this.loadingIndicator) {
            this.loadingIndicator.remove();
        }
    }
}
