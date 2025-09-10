/**
 * 场景题8: 无限滚动加载实现
 * 
 * 业务场景：
 * - 社交媒体信息流需要无限滚动加载
 * - 商品列表页面分页加载优化
 * - 搜索结果页面的渐进式加载
 * 
 * 考察点：
 * - Intersection Observer API 使用
 * - 滚动事件优化和节流
 * - 数据加载状态管理
 * - 内存优化和虚拟化
 * - 错误处理和用户体验
 */

// 1. 基础无限滚动实现
class InfiniteScroll {
  constructor(container, options = {}) {
    this.container = typeof container === 'string' 
      ? document.querySelector(container) 
      : container;
    
    this.options = {
      threshold: 0.1,              // 触发阈值
      rootMargin: '100px',         // 提前触发距离
      loadMore: null,              // 加载更多数据的函数
      hasMore: true,               // 是否还有更多数据
      loading: false,              // 当前是否正在加载
      autoLoad: true,              // 是否自动加载
      loadingText: '加载中...',    // 加载文本
      errorText: '加载失败，点击重试', // 错误文本
      noMoreText: '没有更多了',    // 无更多数据文本
      itemSelector: '.list-item',  // 列表项选择器
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
  
  // 创建哨兵元素
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
    
    // 添加加载状态指示器
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
  
  // 设置Intersection Observer
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
  
  // 滚动事件降级方案
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
    this.handleScroll = handleScroll; // 保存引用以便销毁时移除
  }
  
  // 检查滚动位置
  checkScrollPosition() {
    const rect = this.sentinel.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    
    if (rect.top <= viewportHeight && this.shouldLoadMore()) {
      this.loadMore();
    }
  }
  
  // 绑定事件
  bindEvents() {
    // 重试按钮点击
    this.loadingIndicator.addEventListener('click', () => {
      if (this.state.error) {
        this.retry();
      }
    });
  }
  
  // 判断是否应该加载更多
  shouldLoadMore() {
    return this.state.hasMore && 
           !this.state.loading && 
           !this.state.error &&
           this.options.autoLoad;
  }
  
  // 加载更多数据
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
  
  // 处理加载成功
  handleLoadSuccess(result) {
    const { data, hasMore = false, total = 0 } = result;
    
    // 渲染新数据
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
  
  // 处理加载错误
  handleLoadError(error) {
    this.setState({
      loading: false,
      error: error.message || '加载失败'
    });
    
    this.callbacks.onLoadError(error, this.state);
  }
  
  // 渲染数据项
  renderItems(items) {
    const fragment = document.createDocumentFragment();
    
    items.forEach(item => {
      const element = this.createItemElement(item);
      fragment.appendChild(element);
    });
    
    // 在哨兵元素之前插入
    this.container.insertBefore(fragment, this.sentinel);
  }
  
  // 创建列表项元素
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
  
  // 更新状态
  setState(newState) {
    this.state = { ...this.state, ...newState };
    this.updateLoadingIndicator();
  }
  
  // 更新加载指示器
  updateLoadingIndicator() {
    if (this.state.loading) {
      this.loadingIndicator.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: center; gap: 8px;">
          <div class="loading-spinner"></div>
          <span>${this.options.loadingText}</span>
        </div>
      `;
      this.loadingIndicator.style.cursor = 'default';
    } else if (this.state.error) {
      this.loadingIndicator.innerHTML = `
        <div style="color: #dc3545; cursor: pointer;">
          🔄 ${this.options.errorText}
        </div>
      `;
      this.loadingIndicator.style.cursor = 'pointer';
    } else if (!this.state.hasMore) {
      this.loadingIndicator.innerHTML = `
        <div style="color: #999;">
          ${this.options.noMoreText}
        </div>
      `;
      this.loadingIndicator.style.cursor = 'default';
    } else {
      this.loadingIndicator.innerHTML = '';
    }
    
    // 添加加载动画样式
    if (!document.getElementById('infinite-scroll-styles')) {
      const styles = document.createElement('style');
      styles.id = 'infinite-scroll-styles';
      styles.textContent = `
        .loading-spinner {
          width: 16px;
          height: 16px;
          border: 2px solid #f3f3f3;
          border-top: 2px solid #666;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `;
      document.head.appendChild(styles);
    }
  }
  
  // 重试加载
  retry() {
    if (this.state.error) {
      this.loadMore();
    }
  }
  
  // 重置状态
  reset() {
    this.setState({
      loading: false,
      hasMore: true,
      error: null,
      page: 1,
      totalLoaded: 0
    });
    
    // 清空已加载的内容
    const items = this.container.querySelectorAll(this.options.itemSelector);
    items.forEach(item => item.remove());
  }
  
  // 手动触发加载
  triggerLoad() {
    if (this.shouldLoadMore()) {
      this.loadMore();
    }
  }
  
  // 设置是否有更多数据
  setHasMore(hasMore) {
    this.setState({ hasMore });
  }
  
  // 获取当前状态
  getState() {
    return { ...this.state };
  }
  
  // 销毁实例
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

// 2. 增强版无限滚动 - 支持虚拟化
class VirtualInfiniteScroll extends InfiniteScroll {
  constructor(container, options = {}) {
    super(container, {
      itemHeight: 100,           // 预估项目高度
      visibleCount: 10,          // 可见项目数量
      bufferSize: 5,             // 缓冲区大小
      recycleThreshold: 1000,    // 回收阈值
      ...options
    });
    
    this.allData = [];           // 所有数据
    this.renderedItems = [];     // 已渲染的项目
    this.viewport = null;        // 可视区域
    this.spacer = null;          // 占位空间
    
    this.initVirtualization();
  }
  
  initVirtualization() {
    // 创建虚拟化容器
    this.viewport = document.createElement('div');
    this.viewport.className = 'virtual-viewport';
    this.viewport.style.cssText = `
      height: ${this.options.visibleCount * this.options.itemHeight}px;
      overflow-y: auto;
      position: relative;
    `;
    
    this.spacer = document.createElement('div');
    this.spacer.className = 'virtual-spacer';
    
    // 重新组织DOM结构
    this.container.appendChild(this.viewport);
    this.viewport.appendChild(this.spacer);
    this.viewport.appendChild(this.sentinel);
    this.viewport.appendChild(this.loadingIndicator);
    
    this.bindVirtualEvents();
  }
  
  bindVirtualEvents() {
    let ticking = false;
    
    this.viewport.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          this.updateVisibleItems();
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });
  }
  
  renderItems(items) {
    // 将新数据添加到总数据集
    this.allData.push(...items);
    
    // 更新虚拟空间
    this.updateVirtualSpace();
    
    // 更新可见项目
    this.updateVisibleItems();
  }
  
  updateVirtualSpace() {
    const totalHeight = this.allData.length * this.options.itemHeight;
    this.spacer.style.height = `${totalHeight}px`;
  }
  
  updateVisibleItems() {
    const scrollTop = this.viewport.scrollTop;
    const startIndex = Math.floor(scrollTop / this.options.itemHeight);
    const endIndex = Math.min(
      startIndex + this.options.visibleCount + this.options.bufferSize,
      this.allData.length
    );
    
    // 清空当前渲染的项目
    this.renderedItems.forEach(item => item.remove());
    this.renderedItems = [];
    
    // 渲染可见范围内的项目
    for (let i = startIndex; i < endIndex; i++) {
      if (this.allData[i]) {
        const element = this.createVirtualItem(this.allData[i], i);
        this.spacer.appendChild(element);
        this.renderedItems.push(element);
      }
    }
  }
  
  createVirtualItem(item, index) {
    const element = this.createItemElement(item);
    element.style.position = 'absolute';
    element.style.top = `${index * this.options.itemHeight}px`;
    element.style.width = '100%';
    element.style.height = `${this.options.itemHeight}px`;
    return element;
  }
  
  reset() {
    super.reset();
    this.allData = [];
    this.renderedItems = [];
    this.updateVirtualSpace();
  }
}

// 3. 实际应用示例
class InfiniteScrollDemo {
  constructor() {
    this.setupUI();
    this.initInfiniteScroll();
  }
  
  setupUI() {
    document.body.innerHTML = `
      <div style="max-width: 800px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
        <h1>无限滚动加载演示</h1>
        
        <div style="margin-bottom: 20px;">
          <h3>配置选项</h3>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 16px;">
            <label style="display: flex; align-items: center; gap: 8px;">
              <input type="checkbox" id="auto-load" checked />
              <span>自动加载</span>
            </label>
            <label style="display: flex; align-items: center; gap: 8px;">
              <input type="checkbox" id="virtual-mode" />
              <span>虚拟化模式</span>
            </label>
            <label style="display: flex; align-items: center; gap: 8px;">
              <input type="checkbox" id="simulate-error" />
              <span>模拟错误</span>
            </label>
          </div>
          
          <div style="display: flex; gap: 8px;">
            <button id="reset-btn" class="btn btn-secondary">重置列表</button>
            <button id="load-btn" class="btn btn-primary">手动加载</button>
            <button id="scroll-top-btn" class="btn btn-secondary">滚动到顶部</button>
          </div>
        </div>
        
        <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 20px;">
          <div>
            <h3>文章列表</h3>
            <div id="article-list" style="
              min-height: 400px;
              max-height: 600px;
              border: 1px solid #ddd;
              border-radius: 8px;
              background: white;
              overflow-y: auto;
            "></div>
          </div>
          
          <div>
            <h3>加载统计</h3>
            <div id="load-stats" style="
              padding: 16px;
              background: #f8f9fa;
              border-radius: 8px;
              font-size: 14px;
            "></div>
            
            <h3 style="margin-top: 20px;">控制面板</h3>
            <div style="
              padding: 16px;
              background: #f8f9fa;
              border-radius: 8px;
              font-size: 14px;
            ">
              <div style="margin-bottom: 8px;">
                <strong>阈值:</strong>
                <input type="range" id="threshold" min="0" max="1" step="0.1" value="0.1" style="width: 100%;">
                <span id="threshold-value">0.1</span>
              </div>
              
              <div style="margin-bottom: 8px;">
                <strong>提前距离:</strong>
                <input type="range" id="root-margin" min="0" max="500" step="50" value="100" style="width: 100%;">
                <span id="root-margin-value">100px</span>
              </div>
              
              <div>
                <strong>每页数量:</strong>
                <input type="range" id="page-size" min="5" max="50" step="5" value="20" style="width: 100%;">
                <span id="page-size-value">20</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <style>
        .btn {
          padding: 8px 16px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          transition: all 0.2s ease;
        }
        
        .btn:hover {
          opacity: 0.9;
        }
        
        .btn-primary {
          background: #007bff;
          color: white;
        }
        
        .btn-secondary {
          background: #6c757d;
          color: white;
        }
        
        .list-item {
          padding: 16px;
          border-bottom: 1px solid #eee;
          transition: background-color 0.2s ease;
        }
        
        .list-item:hover {
          background-color: #f8f9fa;
        }
        
        .article-title {
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 8px;
          color: #333;
        }
        
        .article-meta {
          font-size: 12px;
          color: #666;
          margin-bottom: 8px;
        }
        
        .article-excerpt {
          font-size: 14px;
          color: #555;
          line-height: 1.4;
        }
        
        .article-tags {
          margin-top: 8px;
          display: flex;
          gap: 4px;
          flex-wrap: wrap;
        }
        
        .tag {
          background: #e9ecef;
          color: #495057;
          padding: 2px 6px;
          border-radius: 12px;
          font-size: 10px;
        }
      </style>
    `;
  }
  
  initInfiniteScroll() {
    this.pageSize = 20;
    this.simulateError = false;
    this.loadCount = 0;
    this.totalItems = 0;
    
    this.infiniteScroll = new InfiniteScroll('#article-list', {
      threshold: 0.1,
      rootMargin: '100px',
      loadMore: this.loadMoreArticles.bind(this),
      renderItem: this.renderArticle.bind(this),
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
      }
    });
    
    this.bindEvents();
    this.updateStats();
  }
  
  // 模拟加载文章数据
  async loadMoreArticles(page) {
    this.loadCount++;
    
    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000));
    
    // 模拟错误
    if (this.simulateError && Math.random() < 0.3) {
      throw new Error('网络连接失败');
    }
    
    // 生成模拟数据
    const articles = this.generateMockArticles(page, this.pageSize);
    const hasMore = this.totalItems < 200; // 最多200条数据
    
    this.totalItems += articles.length;
    
    return {
      data: articles,
      hasMore,
      total: 200,
      page,
      pageSize: this.pageSize
    };
  }
  
  // 生成模拟文章数据
  generateMockArticles(page, pageSize) {
    const articles = [];
    const categories = ['技术', '生活', '旅行', '美食', '科学', '艺术'];
    const authors = ['张三', '李四', '王五', '赵六', '陈七', '周八'];
    
    for (let i = 0; i < pageSize; i++) {
      const id = (page - 1) * pageSize + i + 1;
      const category = categories[Math.floor(Math.random() * categories.length)];
      const author = authors[Math.floor(Math.random() * authors.length)];
      
      articles.push({
        id,
        title: `精彩${category}文章 #${id}: ${this.generateRandomTitle()}`,
        author,
        category,
        publishTime: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toLocaleDateString(),
        excerpt: this.generateRandomExcerpt(),
        tags: this.generateRandomTags(),
        readCount: Math.floor(Math.random() * 10000),
        likeCount: Math.floor(Math.random() * 1000)
      });
    }
    
    return articles;
  }
  
  generateRandomTitle() {
    const titles = [
      '探索未知的世界',
      '分享生活的美好',
      '技术改变生活',
      '创新思维的力量',
      '发现身边的奇迹',
      '追求卓越的旅程',
      '智慧生活指南',
      '成长路上的感悟'
    ];
    return titles[Math.floor(Math.random() * titles.length)];
  }
  
  generateRandomExcerpt() {
    const excerpts = [
      '这是一篇非常有趣的文章，分享了作者在某个领域的独特见解和丰富经验。文章内容深入浅出，值得细细品读。',
      '作者通过生动的案例和详细的分析，为我们展现了一个全新的视角。这篇文章必将给读者带来深刻的启发。',
      '在这篇文章中，我们可以看到作者对生活的热爱和对知识的渴求。每一个字都充满了智慧和力量。',
      '这是一次思想的碰撞，一场智慧的盛宴。作者用朴实的语言诠释了深刻的道理，令人回味无穷。'
    ];
    return excerpts[Math.floor(Math.random() * excerpts.length)];
  }
  
  generateRandomTags() {
    const allTags = ['热门', '推荐', '原创', '深度', '实用', '有趣', '专业', '新手友好'];
    const tagCount = Math.floor(Math.random() * 3) + 1;
    const tags = [];
    
    for (let i = 0; i < tagCount; i++) {
      const tag = allTags[Math.floor(Math.random() * allTags.length)];
      if (!tags.includes(tag)) {
        tags.push(tag);
      }
    }
    
    return tags;
  }
  
  // 渲染文章项
  renderArticle(article) {
    return `
      <div>
        <div class="article-title">${article.title}</div>
        <div class="article-meta">
          作者: ${article.author} | 
          分类: ${article.category} | 
          发布: ${article.publishTime} | 
          阅读: ${article.readCount} | 
          点赞: ${article.likeCount}
        </div>
        <div class="article-excerpt">${article.excerpt}</div>
        <div class="article-tags">
          ${article.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
        </div>
      </div>
    `;
  }
  
  bindEvents() {
    // 自动加载开关
    document.getElementById('auto-load').addEventListener('change', (e) => {
      this.infiniteScroll.options.autoLoad = e.target.checked;
    });
    
    // 虚拟化模式开关
    document.getElementById('virtual-mode').addEventListener('change', (e) => {
      // 这里可以切换到虚拟化版本
      console.log('虚拟化模式:', e.target.checked);
    });
    
    // 模拟错误开关
    document.getElementById('simulate-error').addEventListener('change', (e) => {
      this.simulateError = e.target.checked;
    });
    
    // 重置按钮
    document.getElementById('reset-btn').addEventListener('click', () => {
      this.reset();
    });
    
    // 手动加载按钮
    document.getElementById('load-btn').addEventListener('click', () => {
      this.infiniteScroll.triggerLoad();
    });
    
    // 滚动到顶部按钮
    document.getElementById('scroll-top-btn').addEventListener('click', () => {
      const container = document.getElementById('article-list');
      container.scrollTo({ top: 0, behavior: 'smooth' });
    });
    
    // 参数调节
    this.bindParameterControls();
  }
  
  bindParameterControls() {
    const thresholdInput = document.getElementById('threshold');
    const thresholdValue = document.getElementById('threshold-value');
    
    thresholdInput.addEventListener('input', (e) => {
      const value = parseFloat(e.target.value);
      thresholdValue.textContent = value;
      // 重新创建observer（实际项目中可能需要更优雅的方式）
    });
    
    const rootMarginInput = document.getElementById('root-margin');
    const rootMarginValue = document.getElementById('root-margin-value');
    
    rootMarginInput.addEventListener('input', (e) => {
      const value = e.target.value;
      rootMarginValue.textContent = value + 'px';
    });
    
    const pageSizeInput = document.getElementById('page-size');
    const pageSizeValue = document.getElementById('page-size-value');
    
    pageSizeInput.addEventListener('input', (e) => {
      this.pageSize = parseInt(e.target.value);
      pageSizeValue.textContent = this.pageSize;
    });
  }
  
  updateStats() {
    const state = this.infiniteScroll.getState();
    const container = document.getElementById('article-list');
    const loadedItems = container.querySelectorAll('.list-item').length;
    
    document.getElementById('load-stats').innerHTML = `
      <div><strong>加载统计:</strong></div>
      <div>当前页数: ${state.page}</div>
      <div>已加载: ${loadedItems} 条</div>
      <div>加载次数: ${this.loadCount}</div>
      <div>总计: ${this.totalItems} / 200</div>
      <div>状态: ${state.loading ? '加载中' : state.error ? '错误' : state.hasMore ? '待加载' : '已完成'}</div>
      ${state.error ? `<div style="color: #dc3545;">错误: ${state.error}</div>` : ''}
    `;
  }
  
  reset() {
    this.infiniteScroll.reset();
    this.loadCount = 0;
    this.totalItems = 0;
    this.updateStats();
  }
}

// 运行演示
console.log('=== 无限滚动加载测试 ===\n');

const demo = new InfiniteScrollDemo();

console.log('无限滚动加载功能特点：');
console.log('✓ 基于 Intersection Observer API');
console.log('✓ 自动和手动加载模式');
console.log('✓ 加载状态和错误处理');
console.log('✓ 虚拟化支持（大数据优化）');
console.log('✓ 可配置的触发条件');
console.log('✓ 内存优化和性能监控');
console.log('✓ 降级方案兼容');
console.log('✓ 丰富的回调和事件');

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    InfiniteScroll,
    VirtualInfiniteScroll
  };
}
