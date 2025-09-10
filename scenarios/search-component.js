/**
 * 场景题10: 实时搜索组件实现
 * 
 * 业务场景：
 * - 电商网站的商品搜索功能
 * - 用户管理系统的用户搜索
 * - 地址选择器的模糊搜索
 * 
 * 考察点：
 * - 防抖优化和性能控制
 * - 搜索算法和高亮显示
 * - 键盘导航和无障碍访问
 * - 缓存机制和数据管理
 * - 用户体验优化
 */

// 1. 基础实时搜索组件
class SearchComponent {
  constructor(container, options = {}) {
    this.container = typeof container === 'string' 
      ? document.querySelector(container) 
      : container;
    
    this.options = {
      placeholder: '请输入搜索关键词...',
      debounceTime: 300,           // 防抖时间
      minLength: 1,                // 最小搜索长度
      maxResults: 10,              // 最大结果数量
      searchKeys: ['title'],       // 搜索字段
      highlightMatch: true,        // 是否高亮匹配
      enableCache: true,           // 是否启用缓存
      enableHistory: true,         // 是否启用搜索历史
      enableKeyboard: true,        // 是否启用键盘导航
      caseSensitive: false,        // 是否区分大小写
      fuzzySearch: false,          // 是否启用模糊搜索
      showEmpty: true,             // 是否显示空状态
      ...options
    };
    
    this.state = {
      query: '',                   // 当前查询
      results: [],                 // 搜索结果
      selectedIndex: -1,           // 选中项索引
      isLoading: false,            // 是否加载中
      isOpen: false,               // 是否展开结果
      cache: new Map(),            // 搜索缓存
      history: []                  // 搜索历史
    };
    
    this.callbacks = {
      onSearch: options.onSearch || (() => []),
      onSelect: options.onSelect || (() => {}),
      onFocus: options.onFocus || (() => {}),
      onBlur: options.onBlur || (() => {}),
      onClear: options.onClear || (() => {})
    };
    
    this.debounceTimer = null;
    this.elements = {};
    
    this.init();
  }
  
  init() {
    this.createElements();
    this.bindEvents();
    this.loadHistory();
  }
  
  // 创建DOM元素
  createElements() {
    this.container.innerHTML = `
      <div class="search-component">
        <div class="search-input-wrapper">
          <input 
            type="text" 
            class="search-input" 
            placeholder="${this.options.placeholder}"
            autocomplete="off"
            spellcheck="false"
          />
          <div class="search-actions">
            <button class="search-loading" style="display: none;">
              <span class="loading-spinner"></span>
            </button>
            <button class="search-clear" style="display: none;">×</button>
          </div>
        </div>
        
        <div class="search-dropdown" style="display: none;">
          <div class="search-results"></div>
        </div>
      </div>
    `;
    
    // 缓存元素引用
    this.elements = {
      input: this.container.querySelector('.search-input'),
      dropdown: this.container.querySelector('.search-dropdown'),
      results: this.container.querySelector('.search-results'),
      loading: this.container.querySelector('.search-loading'),
      clear: this.container.querySelector('.search-clear')
    };
    
    this.addStyles();
  }
  
  // 添加样式
  addStyles() {
    if (document.getElementById('search-component-styles')) return;
    
    const styles = document.createElement('style');
    styles.id = 'search-component-styles';
    styles.textContent = `
      .search-component {
        position: relative;
        width: 100%;
        font-family: Arial, sans-serif;
      }
      
      .search-input-wrapper {
        position: relative;
        display: flex;
        align-items: center;
      }
      
      .search-input {
        width: 100%;
        padding: 12px 40px 12px 16px;
        border: 1px solid #ddd;
        border-radius: 8px;
        font-size: 16px;
        outline: none;
        transition: all 0.2s ease;
        box-sizing: border-box;
      }
      
      .search-input:focus {
        border-color: #007bff;
        box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
      }
      
      .search-actions {
        position: absolute;
        right: 8px;
        display: flex;
        align-items: center;
        gap: 4px;
      }
      
      .search-loading,
      .search-clear {
        background: none;
        border: none;
        padding: 6px;
        cursor: pointer;
        border-radius: 4px;
        transition: background-color 0.2s ease;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      .search-clear {
        font-size: 18px;
        color: #666;
      }
      
      .search-clear:hover {
        background-color: #f0f0f0;
        color: #333;
      }
      
      .loading-spinner {
        width: 16px;
        height: 16px;
        border: 2px solid #f3f3f3;
        border-top: 2px solid #007bff;
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }
      
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      
      .search-dropdown {
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        z-index: 1000;
        margin-top: 4px;
        background: white;
        border: 1px solid #ddd;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        max-height: 300px;
        overflow-y: auto;
      }
      
      .search-results {
        padding: 0;
      }
      
      .search-result-item {
        padding: 12px 16px;
        cursor: pointer;
        border-bottom: 1px solid #f0f0f0;
        transition: background-color 0.2s ease;
        display: flex;
        align-items: center;
        gap: 12px;
      }
      
      .search-result-item:last-child {
        border-bottom: none;
      }
      
      .search-result-item:hover,
      .search-result-item.selected {
        background-color: #f8f9fa;
      }
      
      .search-result-item.selected {
        background-color: #e3f2fd;
      }
      
      .result-icon {
        width: 20px;
        height: 20px;
        background: #f0f0f0;
        border-radius: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        flex-shrink: 0;
      }
      
      .result-content {
        flex: 1;
        min-width: 0;
      }
      
      .result-title {
        font-weight: 500;
        margin-bottom: 2px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      
      .result-description {
        font-size: 12px;
        color: #666;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      
      .result-highlight {
        background-color: #ffeb3b;
        color: #333;
        padding: 0 2px;
        border-radius: 2px;
      }
      
      .search-empty {
        padding: 20px;
        text-align: center;
        color: #666;
        font-size: 14px;
      }
      
      .search-history {
        border-bottom: 1px solid #f0f0f0;
        margin-bottom: 8px;
      }
      
      .search-history-title {
        padding: 8px 16px;
        font-size: 12px;
        color: #666;
        font-weight: 500;
        background: #f8f9fa;
      }
      
      .search-history-item {
        padding: 8px 16px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: space-between;
        transition: background-color 0.2s ease;
        font-size: 14px;
      }
      
      .search-history-item:hover {
        background-color: #f0f0f0;
      }
      
      .history-remove {
        background: none;
        border: none;
        color: #999;
        cursor: pointer;
        padding: 2px;
        border-radius: 2px;
        font-size: 12px;
      }
      
      .history-remove:hover {
        color: #666;
        background: #f0f0f0;
      }
    `;
    
    document.head.appendChild(styles);
  }
  
  // 绑定事件
  bindEvents() {
    const { input, clear, dropdown } = this.elements;
    
    // 输入事件
    input.addEventListener('input', (e) => {
      this.handleInput(e.target.value);
    });
    
    // 焦点事件
    input.addEventListener('focus', () => {
      this.handleFocus();
    });
    
    input.addEventListener('blur', (e) => {
      // 延迟处理，允许点击结果项
      setTimeout(() => this.handleBlur(e), 200);
    });
    
    // 键盘导航
    if (this.options.enableKeyboard) {
      input.addEventListener('keydown', (e) => {
        this.handleKeydown(e);
      });
    }
    
    // 清空按钮
    clear.addEventListener('click', () => {
      this.clear();
    });
    
    // 点击外部关闭
    document.addEventListener('click', (e) => {
      if (!this.container.contains(e.target)) {
        this.close();
      }
    });
    
    // 结果项点击
    dropdown.addEventListener('click', (e) => {
      const item = e.target.closest('.search-result-item, .search-history-item');
      if (item) {
        if (item.classList.contains('search-result-item')) {
          const index = parseInt(item.dataset.index);
          this.selectResult(index);
        } else if (item.classList.contains('search-history-item')) {
          const query = item.querySelector('.history-text').textContent;
          this.setQuery(query);
          this.search(query);
        }
      }
      
      // 删除历史记录
      const removeBtn = e.target.closest('.history-remove');
      if (removeBtn) {
        e.stopPropagation();
        const index = parseInt(removeBtn.dataset.index);
        this.removeFromHistory(index);
      }
    });
  }
  
  // 处理输入
  handleInput(value) {
    this.state.query = value;
    this.updateClearButton();
    
    if (value.length >= this.options.minLength) {
      this.debounceSearch(value);
    } else {
      this.close();
    }
  }
  
  // 防抖搜索
  debounceSearch(query) {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    
    this.debounceTimer = setTimeout(() => {
      this.search(query);
    }, this.options.debounceTime);
  }
  
  // 执行搜索
  async search(query) {
    if (!query || query.length < this.options.minLength) return;
    
    // 检查缓存
    if (this.options.enableCache && this.state.cache.has(query)) {
      const cachedResults = this.state.cache.get(query);
      this.displayResults(cachedResults, query);
      return;
    }
    
    this.setLoading(true);
    
    try {
      const results = await this.callbacks.onSearch(query);
      const processedResults = this.processResults(results, query);
      
      // 缓存结果
      if (this.options.enableCache) {
        this.state.cache.set(query, processedResults);
      }
      
      this.displayResults(processedResults, query);
      
    } catch (error) {
      console.error('Search error:', error);
      this.displayResults([], query);
    } finally {
      this.setLoading(false);
    }
  }
  
  // 处理搜索结果
  processResults(results, query) {
    if (!Array.isArray(results)) return [];
    
    let processed = results;
    
    // 限制结果数量
    if (this.options.maxResults > 0) {
      processed = processed.slice(0, this.options.maxResults);
    }
    
    // 添加高亮信息
    if (this.options.highlightMatch) {
      processed = processed.map(item => ({
        ...item,
        _highlighted: this.highlightText(item, query)
      }));
    }
    
    return processed;
  }
  
  // 高亮匹配文本
  highlightText(item, query) {
    const highlighted = { ...item };
    const regex = new RegExp(`(${this.escapeRegex(query)})`, 
      this.options.caseSensitive ? 'g' : 'gi');
    
    this.options.searchKeys.forEach(key => {
      if (highlighted[key]) {
        highlighted[key] = String(highlighted[key]).replace(regex, 
          '<span class="result-highlight">$1</span>');
      }
    });
    
    return highlighted;
  }
  
  // 显示搜索结果
  displayResults(results, query) {
    this.state.results = results;
    this.state.selectedIndex = -1;
    
    if (results.length === 0 && this.options.showEmpty) {
      this.renderEmptyState(query);
    } else {
      this.renderResults(results);
    }
    
    this.open();
  }
  
  // 渲染搜索结果
  renderResults(results) {
    const html = results.map((item, index) => {
      const highlighted = this.options.highlightMatch ? item._highlighted : item;
      const icon = this.getResultIcon(item);
      
      return `
        <div class="search-result-item" data-index="${index}">
          <div class="result-icon">${icon}</div>
          <div class="result-content">
            <div class="result-title">${highlighted.title || highlighted.name || 'Untitled'}</div>
            ${highlighted.description ? `<div class="result-description">${highlighted.description}</div>` : ''}
          </div>
        </div>
      `;
    }).join('');
    
    this.elements.results.innerHTML = html;
  }
  
  // 渲染空状态
  renderEmptyState(query) {
    this.elements.results.innerHTML = `
      <div class="search-empty">
        ${query ? `未找到 "${query}" 的相关结果` : '开始输入以搜索'}
      </div>
    `;
  }
  
  // 渲染搜索历史
  renderHistory() {
    if (!this.options.enableHistory || this.state.history.length === 0) {
      this.elements.results.innerHTML = '';
      return;
    }
    
    const historyHtml = this.state.history.map((item, index) => `
      <div class="search-history-item" data-index="${index}">
        <span class="history-text">${item}</span>
        <button class="history-remove" data-index="${index}">×</button>
      </div>
    `).join('');
    
    this.elements.results.innerHTML = `
      <div class="search-history">
        <div class="search-history-title">搜索历史</div>
        ${historyHtml}
      </div>
    `;
  }
  
  // 处理焦点
  handleFocus() {
    this.callbacks.onFocus();
    
    if (this.state.query) {
      this.open();
    } else if (this.options.enableHistory) {
      this.renderHistory();
      this.open();
    }
  }
  
  // 处理失焦
  handleBlur(e) {
    this.callbacks.onBlur(e);
    // this.close(); // 注释掉，因为需要支持点击结果
  }
  
  // 处理键盘事件
  handleKeydown(e) {
    const { results, selectedIndex } = this.state;
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (results.length > 0) {
          this.state.selectedIndex = Math.min(selectedIndex + 1, results.length - 1);
          this.updateSelection();
        }
        break;
        
      case 'ArrowUp':
        e.preventDefault();
        if (results.length > 0) {
          this.state.selectedIndex = Math.max(selectedIndex - 1, -1);
          this.updateSelection();
        }
        break;
        
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && results[selectedIndex]) {
          this.selectResult(selectedIndex);
        }
        break;
        
      case 'Escape':
        this.close();
        this.elements.input.blur();
        break;
    }
  }
  
  // 更新选中状态
  updateSelection() {
    const items = this.elements.results.querySelectorAll('.search-result-item');
    items.forEach((item, index) => {
      item.classList.toggle('selected', index === this.state.selectedIndex);
    });
    
    // 滚动到选中项
    if (this.state.selectedIndex >= 0) {
      const selectedItem = items[this.state.selectedIndex];
      if (selectedItem) {
        selectedItem.scrollIntoView({ block: 'nearest' });
      }
    }
  }
  
  // 选择结果
  selectResult(index) {
    const result = this.state.results[index];
    if (result) {
      this.setQuery(result.title || result.name || '');
      this.addToHistory(this.state.query);
      this.close();
      this.callbacks.onSelect(result, index);
    }
  }
  
  // 设置查询值
  setQuery(query) {
    this.state.query = query;
    this.elements.input.value = query;
    this.updateClearButton();
  }
  
  // 清空搜索
  clear() {
    this.setQuery('');
    this.close();
    this.elements.input.focus();
    this.callbacks.onClear();
  }
  
  // 打开下拉框
  open() {
    this.state.isOpen = true;
    this.elements.dropdown.style.display = 'block';
  }
  
  // 关闭下拉框
  close() {
    this.state.isOpen = false;
    this.elements.dropdown.style.display = 'none';
    this.state.selectedIndex = -1;
  }
  
  // 设置加载状态
  setLoading(loading) {
    this.state.isLoading = loading;
    this.elements.loading.style.display = loading ? 'block' : 'none';
  }
  
  // 更新清空按钮
  updateClearButton() {
    this.elements.clear.style.display = this.state.query ? 'block' : 'none';
  }
  
  // 添加到搜索历史
  addToHistory(query) {
    if (!this.options.enableHistory || !query.trim()) return;
    
    // 移除重复项
    const index = this.state.history.indexOf(query);
    if (index > -1) {
      this.state.history.splice(index, 1);
    }
    
    // 添加到开头
    this.state.history.unshift(query);
    
    // 限制历史数量
    if (this.state.history.length > 10) {
      this.state.history = this.state.history.slice(0, 10);
    }
    
    this.saveHistory();
  }
  
  // 从历史记录移除
  removeFromHistory(index) {
    this.state.history.splice(index, 1);
    this.saveHistory();
    this.renderHistory();
  }
  
  // 保存搜索历史
  saveHistory() {
    if (this.options.enableHistory) {
      try {
        localStorage.setItem('search-history', JSON.stringify(this.state.history));
      } catch (e) {
        console.warn('Failed to save search history:', e);
      }
    }
  }
  
  // 加载搜索历史
  loadHistory() {
    if (this.options.enableHistory) {
      try {
        const saved = localStorage.getItem('search-history');
        if (saved) {
          this.state.history = JSON.parse(saved);
        }
      } catch (e) {
        console.warn('Failed to load search history:', e);
      }
    }
  }
  
  // 获取结果图标
  getResultIcon(item) {
    if (item.icon) return item.icon;
    if (item.type) {
      const typeIcons = {
        user: '👤',
        product: '📦',
        article: '📄',
        file: '📁',
        link: '🔗'
      };
      return typeIcons[item.type] || '📄';
    }
    return '📄';
  }
  
  // 转义正则特殊字符
  escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
  
  // 获取当前状态
  getState() {
    return { ...this.state };
  }
  
  // 销毁组件
  destroy() {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    this.container.innerHTML = '';
  }
}

// 2. 实际应用示例
class SearchDemo {
  constructor() {
    this.setupUI();
    this.initSearch();
    this.setupMockData();
  }
  
  setupUI() {
    document.body.innerHTML = `
      <div style="max-width: 800px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
        <h1>实时搜索组件演示</h1>
        
        <div style="margin-bottom: 20px;">
          <h3>全局搜索</h3>
          <div id="global-search" style="width: 100%;"></div>
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
          <div>
            <h3>用户搜索</h3>
            <div id="user-search"></div>
          </div>
          
          <div>
            <h3>商品搜索</h3>
            <div id="product-search"></div>
          </div>
        </div>
        
        <div style="margin-bottom: 20px;">
          <h3>配置选项</h3>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px;">
            <label style="display: flex; align-items: center; gap: 8px;">
              <input type="checkbox" id="enable-cache" checked />
              <span>启用缓存</span>
            </label>
            <label style="display: flex; align-items: center; gap: 8px;">
              <input type="checkbox" id="enable-history" checked />
              <span>搜索历史</span>
            </label>
            <label style="display: flex; align-items: center; gap: 8px;">
              <input type="checkbox" id="highlight-match" checked />
              <span>高亮匹配</span>
            </label>
            <label style="display: flex; align-items: center; gap: 8px;">
              <input type="checkbox" id="fuzzy-search" />
              <span>模糊搜索</span>
            </label>
          </div>
          
          <div style="margin-top: 16px; display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px;">
            <div>
              <label>防抖时间 (ms):</label>
              <input type="range" id="debounce-time" min="100" max="1000" step="100" value="300" style="width: 100%;">
              <span id="debounce-value">300</span>
            </div>
            
            <div>
              <label>最大结果数:</label>
              <input type="range" id="max-results" min="5" max="20" step="1" value="10" style="width: 100%;">
              <span id="max-results-value">10</span>
            </div>
          </div>
        </div>
        
        <div>
          <h3>搜索统计</h3>
          <div id="search-stats" style="
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 12px;
            padding: 16px;
            background: #f8f9fa;
            border-radius: 8px;
          "></div>
        </div>
        
        <div style="margin-top: 20px;">
          <h3>最近选择</h3>
          <div id="recent-selections" style="
            min-height: 100px;
            padding: 16px;
            background: #f8f9fa;
            border-radius: 8px;
            font-size: 14px;
          ">暂无选择记录</div>
        </div>
      </div>
    `;
  }
  
  setupMockData() {
    // 模拟用户数据
    this.users = Array.from({ length: 100 }, (_, i) => ({
      id: i + 1,
      name: `用户${i + 1}`,
      title: ['前端工程师', '后端工程师', '产品经理', '设计师', 'UI设计师'][i % 5],
      department: ['技术部', '产品部', '设计部', '市场部'][i % 4],
      email: `user${i + 1}@company.com`,
      type: 'user',
      description: `${['技术部', '产品部', '设计部', '市场部'][i % 4]} - ${['前端工程师', '后端工程师', '产品经理', '设计师', 'UI设计师'][i % 5]}`
    }));
    
    // 模拟商品数据
    this.products = Array.from({ length: 200 }, (_, i) => ({
      id: i + 1,
      title: `商品${i + 1}`,
      category: ['电子产品', '服装', '家居', '图书', '运动'][i % 5],
      brand: ['苹果', '三星', '华为', '小米', '联想'][i % 5],
      price: Math.floor(Math.random() * 10000) + 100,
      type: 'product',
      description: `${['电子产品', '服装', '家居', '图书', '运动'][i % 5]} - ${['苹果', '三星', '华为', '小米', '联想'][i % 5]}品牌`
    }));
    
    // 合并所有数据
    this.allData = [...this.users, ...this.products];
    
    this.searchStats = {
      totalSearches: 0,
      cacheHits: 0,
      avgResponseTime: 0,
      responseTime: []
    };
    
    this.recentSelections = [];
  }
  
  initSearch() {
    // 全局搜索
    this.globalSearch = new SearchComponent('#global-search', {
      placeholder: '搜索用户、商品...',
      searchKeys: ['name', 'title', 'category', 'brand'],
      maxResults: 8,
      onSearch: this.handleGlobalSearch.bind(this),
      onSelect: this.handleSelection.bind(this)
    });
    
    // 用户搜索
    this.userSearch = new SearchComponent('#user-search', {
      placeholder: '搜索用户...',
      searchKeys: ['name', 'title', 'department'],
      maxResults: 6,
      onSearch: this.handleUserSearch.bind(this),
      onSelect: this.handleSelection.bind(this)
    });
    
    // 商品搜索
    this.productSearch = new SearchComponent('#product-search', {
      placeholder: '搜索商品...',
      searchKeys: ['title', 'category', 'brand'],
      maxResults: 6,
      onSearch: this.handleProductSearch.bind(this),
      onSelect: this.handleSelection.bind(this)
    });
    
    this.bindConfigEvents();
    this.updateStats();
  }
  
  // 处理全局搜索
  async handleGlobalSearch(query) {
    const startTime = performance.now();
    
    // 模拟网络延迟
    await this.delay(100 + Math.random() * 200);
    
    const results = this.searchData(this.allData, query, ['name', 'title', 'category', 'brand']);
    
    this.updateSearchStats(startTime);
    return results;
  }
  
  // 处理用户搜索
  async handleUserSearch(query) {
    const startTime = performance.now();
    await this.delay(50 + Math.random() * 100);
    
    const results = this.searchData(this.users, query, ['name', 'title', 'department']);
    
    this.updateSearchStats(startTime);
    return results;
  }
  
  // 处理商品搜索
  async handleProductSearch(query) {
    const startTime = performance.now();
    await this.delay(80 + Math.random() * 150);
    
    const results = this.searchData(this.products, query, ['title', 'category', 'brand']);
    
    this.updateSearchStats(startTime);
    return results;
  }
  
  // 搜索数据
  searchData(data, query, searchKeys) {
    const lowerQuery = query.toLowerCase();
    
    return data.filter(item => {
      return searchKeys.some(key => {
        const value = String(item[key] || '').toLowerCase();
        return value.includes(lowerQuery);
      });
    });
  }
  
  // 处理选择
  handleSelection(item) {
    this.recentSelections.unshift({
      ...item,
      selectedAt: new Date().toLocaleTimeString()
    });
    
    // 限制最近选择数量
    if (this.recentSelections.length > 10) {
      this.recentSelections = this.recentSelections.slice(0, 10);
    }
    
    this.updateRecentSelections();
  }
  
  bindConfigEvents() {
    // 防抖时间
    const debounceInput = document.getElementById('debounce-time');
    const debounceValue = document.getElementById('debounce-value');
    
    debounceInput.addEventListener('input', (e) => {
      const value = e.target.value;
      debounceValue.textContent = value;
      this.updateSearchOptions({ debounceTime: parseInt(value) });
    });
    
    // 最大结果数
    const maxResultsInput = document.getElementById('max-results');
    const maxResultsValue = document.getElementById('max-results-value');
    
    maxResultsInput.addEventListener('input', (e) => {
      const value = e.target.value;
      maxResultsValue.textContent = value;
      this.updateSearchOptions({ maxResults: parseInt(value) });
    });
    
    // 其他选项
    ['enable-cache', 'enable-history', 'highlight-match', 'fuzzy-search'].forEach(id => {
      document.getElementById(id).addEventListener('change', (e) => {
        const option = id.replace(/-([a-z])/g, (g) => g[1].toUpperCase()).replace('enable', '');
        const key = option === 'Cache' ? 'enableCache' :
                   option === 'History' ? 'enableHistory' :
                   option === 'Match' ? 'highlightMatch' :
                   'fuzzySearch';
        
        this.updateSearchOptions({ [key]: e.target.checked });
      });
    });
  }
  
  updateSearchOptions(options) {
    [this.globalSearch, this.userSearch, this.productSearch].forEach(search => {
      Object.assign(search.options, options);
      if (options.hasOwnProperty('enableCache') && !options.enableCache) {
        search.state.cache.clear();
      }
    });
  }
  
  updateSearchStats(startTime) {
    const responseTime = performance.now() - startTime;
    this.searchStats.totalSearches++;
    this.searchStats.responseTime.push(responseTime);
    
    // 计算平均响应时间
    this.searchStats.avgResponseTime = 
      this.searchStats.responseTime.reduce((a, b) => a + b, 0) / 
      this.searchStats.responseTime.length;
    
    // 只保留最近100次的响应时间
    if (this.searchStats.responseTime.length > 100) {
      this.searchStats.responseTime = this.searchStats.responseTime.slice(-100);
    }
    
    this.updateStats();
  }
  
  updateStats() {
    const stats = this.searchStats;
    
    document.getElementById('search-stats').innerHTML = `
      <div style="background: white; padding: 12px; border-radius: 4px; text-align: center;">
        <div style="font-size: 18px; font-weight: bold; color: #007bff;">${stats.totalSearches}</div>
        <div style="font-size: 12px; color: #666;">总搜索次数</div>
      </div>
      <div style="background: white; padding: 12px; border-radius: 4px; text-align: center;">
        <div style="font-size: 18px; font-weight: bold; color: #28a745;">${stats.cacheHits}</div>
        <div style="font-size: 12px; color: #666;">缓存命中</div>
      </div>
      <div style="background: white; padding: 12px; border-radius: 4px; text-align: center;">
        <div style="font-size: 18px; font-weight: bold; color: #ffc107;">${stats.avgResponseTime.toFixed(0)}ms</div>
        <div style="font-size: 12px; color: #666;">平均响应时间</div>
      </div>
      <div style="background: white; padding: 12px; border-radius: 4px; text-align: center;">
        <div style="font-size: 18px; font-weight: bold; color: #17a2b8;">${this.recentSelections.length}</div>
        <div style="font-size: 12px; color: #666;">最近选择</div>
      </div>
    `;
  }
  
  updateRecentSelections() {
    const container = document.getElementById('recent-selections');
    
    if (this.recentSelections.length === 0) {
      container.innerHTML = '暂无选择记录';
      return;
    }
    
    container.innerHTML = this.recentSelections.map(item => `
      <div style="
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px 0;
        border-bottom: 1px solid #dee2e6;
      ">
        <div>
          <strong>${item.name || item.title}</strong>
          <span style="color: #666; margin-left: 8px;">${item.description || ''}</span>
        </div>
        <span style="color: #999; font-size: 12px;">${item.selectedAt}</span>
      </div>
    `).join('');
  }
  
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// 运行演示
console.log('=== 实时搜索组件测试 ===\n');

const demo = new SearchDemo();

console.log('实时搜索组件功能特点：');
console.log('✓ 防抖优化和性能控制');
console.log('✓ 智能搜索和结果高亮');
console.log('✓ 键盘导航和无障碍访问');
console.log('✓ 搜索缓存和历史记录');
console.log('✓ 多数据源支持');
console.log('✓ 可配置的搜索选项');
console.log('✓ 实时统计和监控');
console.log('✓ 响应式设计');

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    SearchComponent
  };
}
