/**
 * 场景题2: 虚拟滚动列表实现
 * 
 * 业务场景：
 * - 后台管理系统需要展示10万条数据记录
 * - 普通列表会导致DOM节点过多，页面卡顿
 * - 需要实现虚拟滚动，只渲染可视区域的项目
 * 
 * 考察点：
 * - 大数据渲染性能优化
 * - 滚动事件处理和节流
 * - DOM操作优化
 * - 数学计算能力（可视区域计算）
 * - 内存管理
 */

// 1. 基础虚拟滚动实现
class VirtualScrollList {
  constructor(container, options = {}) {
    this.container = typeof container === 'string' 
      ? document.querySelector(container) 
      : container;
    
    this.options = {
      itemHeight: 50,           // 每个项目的高度
      bufferSize: 5,            // 缓冲区大小（上下各保留几个项目）
      scrollThrottle: 16,       // 滚动节流时间(ms)
      overscan: 3,              // 预渲染项目数量
      ...options
    };
    
    this.data = [];             // 数据源
    this.startIndex = 0;        // 可视区域开始索引
    this.endIndex = 0;          // 可视区域结束索引
    this.scrollTop = 0;         // 当前滚动位置
    this.containerHeight = 0;   // 容器高度
    this.visibleCount = 0;      // 可视项目数量
    
    this.renderFunction = null; // 渲染函数
    this.scrollElement = null;  // 滚动容器
    this.contentElement = null; // 内容容器
    this.viewportElement = null; // 可视区域
    
    this.init();
  }
  
  init() {
    this.createElements();
    this.bindEvents();
    this.calculateSizes();
  }
  
  // 创建DOM结构
  createElements() {
    this.container.innerHTML = '';
    this.container.style.cssText = `
      position: relative;
      height: 100%;
      overflow: hidden;
    `;
    
    // 滚动容器
    this.scrollElement = document.createElement('div');
    this.scrollElement.style.cssText = `
      height: 100%;
      overflow-y: auto;
      overflow-x: hidden;
    `;
    
    // 内容容器（用于撑开滚动条）
    this.contentElement = document.createElement('div');
    this.contentElement.style.cssText = `
      position: relative;
      width: 100%;
    `;
    
    // 可视区域
    this.viewportElement = document.createElement('div');
    this.viewportElement.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      will-change: transform;
    `;
    
    this.contentElement.appendChild(this.viewportElement);
    this.scrollElement.appendChild(this.contentElement);
    this.container.appendChild(this.scrollElement);
  }
  
  // 绑定事件
  bindEvents() {
    let ticking = false;
    
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          this.handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };
    
    this.scrollElement.addEventListener('scroll', handleScroll, { passive: true });
    
    // 监听窗口大小变化
    window.addEventListener('resize', this.handleResize.bind(this));
  }
  
  // 处理滚动事件
  handleScroll() {
    const scrollTop = this.scrollElement.scrollTop;
    
    if (Math.abs(scrollTop - this.scrollTop) < 1) {
      return; // 滚动距离太小，忽略
    }
    
    this.scrollTop = scrollTop;
    this.updateVisibleRange();
    this.renderItems();
  }
  
  // 处理窗口大小变化
  handleResize() {
    this.calculateSizes();
    this.updateVisibleRange();
    this.renderItems();
  }
  
  // 计算尺寸
  calculateSizes() {
    const rect = this.container.getBoundingClientRect();
    this.containerHeight = rect.height;
    this.visibleCount = Math.ceil(this.containerHeight / this.options.itemHeight);
    
    // 更新内容高度
    const totalHeight = this.data.length * this.options.itemHeight;
    this.contentElement.style.height = `${totalHeight}px`;
  }
  
  // 更新可视范围
  updateVisibleRange() {
    const { itemHeight, bufferSize } = this.options;
    
    // 计算可视区域的起始和结束索引
    const startIndex = Math.floor(this.scrollTop / itemHeight);
    const endIndex = Math.min(
      startIndex + this.visibleCount + 1,
      this.data.length
    );
    
    // 添加缓冲区
    this.startIndex = Math.max(0, startIndex - bufferSize);
    this.endIndex = Math.min(this.data.length, endIndex + bufferSize);
  }
  
  // 渲染项目
  renderItems() {
    if (!this.renderFunction) {
      console.warn('Render function not provided');
      return;
    }
    
    const fragment = document.createDocumentFragment();
    const items = [];
    
    // 渲染可视范围内的项目
    for (let i = this.startIndex; i < this.endIndex; i++) {
      const item = this.createItemElement(i);
      items.push(item);
      fragment.appendChild(item);
    }
    
    // 批量更新DOM
    this.viewportElement.innerHTML = '';
    this.viewportElement.appendChild(fragment);
    
    // 设置偏移量
    const offsetY = this.startIndex * this.options.itemHeight;
    this.viewportElement.style.transform = `translateY(${offsetY}px)`;
    
    // 触发渲染完成事件
    this.onRenderComplete?.(items, this.startIndex, this.endIndex);
  }
  
  // 创建单个项目元素
  createItemElement(index) {
    const item = document.createElement('div');
    item.style.cssText = `
      height: ${this.options.itemHeight}px;
      display: flex;
      align-items: center;
      border-bottom: 1px solid #eee;
      padding: 0 16px;
      box-sizing: border-box;
    `;
    
    item.dataset.index = index;
    
    // 调用用户提供的渲染函数
    const content = this.renderFunction(this.data[index], index);
    
    if (typeof content === 'string') {
      item.innerHTML = content;
    } else if (content instanceof HTMLElement) {
      item.appendChild(content);
    }
    
    return item;
  }
  
  // 设置数据源
  setData(data) {
    this.data = data || [];
    this.calculateSizes();
    this.updateVisibleRange();
    this.renderItems();
  }
  
  // 设置渲染函数
  setRenderFunction(fn) {
    this.renderFunction = fn;
  }
  
  // 滚动到指定索引
  scrollToIndex(index) {
    if (index < 0 || index >= this.data.length) return;
    
    const targetScrollTop = index * this.options.itemHeight;
    this.scrollElement.scrollTop = targetScrollTop;
  }
  
  // 获取当前可视范围
  getVisibleRange() {
    return {
      start: this.startIndex,
      end: this.endIndex,
      data: this.data.slice(this.startIndex, this.endIndex)
    };
  }
  
  // 刷新列表
  refresh() {
    this.calculateSizes();
    this.updateVisibleRange();
    this.renderItems();
  }
  
  // 销毁
  destroy() {
    this.scrollElement?.removeEventListener('scroll', this.handleScroll);
    window.removeEventListener('resize', this.handleResize);
    this.container.innerHTML = '';
  }
}

// 2. 动态高度虚拟滚动（高级版本）
class DynamicVirtualScrollList extends VirtualScrollList {
  constructor(container, options = {}) {
    super(container, {
      estimatedItemHeight: 50,  // 预估高度
      ...options
    });
    
    this.itemHeights = new Map();     // 存储每个项目的实际高度
    this.itemPositions = new Map();   // 存储每个项目的位置
    this.measuredItems = new Set();   // 已测量的项目
    this.totalHeight = 0;             // 总高度
    
    this.resizeObserver = new ResizeObserver(this.handleItemResize.bind(this));
  }
  
  // 处理项目高度变化
  handleItemResize(entries) {
    let hasChange = false;
    
    entries.forEach(entry => {
      const element = entry.target;
      const index = parseInt(element.dataset.index);
      const height = entry.contentRect.height;
      
      if (this.itemHeights.get(index) !== height) {
        this.itemHeights.set(index, height);
        this.measuredItems.add(index);
        hasChange = true;
      }
    });
    
    if (hasChange) {
      this.recalculatePositions();
      this.updateContentHeight();
    }
  }
  
  // 重新计算位置
  recalculatePositions() {
    let offset = 0;
    
    for (let i = 0; i < this.data.length; i++) {
      this.itemPositions.set(i, offset);
      
      const height = this.itemHeights.get(i) || this.options.estimatedItemHeight;
      offset += height;
    }
    
    this.totalHeight = offset;
  }
  
  // 更新内容高度
  updateContentHeight() {
    this.contentElement.style.height = `${this.totalHeight}px`;
  }
  
  // 根据滚动位置查找起始索引
  findStartIndex(scrollTop) {
    let start = 0;
    let end = this.data.length - 1;
    
    while (start <= end) {
      const mid = Math.floor((start + end) / 2);
      const position = this.itemPositions.get(mid) || 0;
      
      if (position === scrollTop) {
        return mid;
      } else if (position < scrollTop) {
        start = mid + 1;
      } else {
        end = mid - 1;
      }
    }
    
    return Math.max(0, end);
  }
  
  // 重写更新可视范围
  updateVisibleRange() {
    this.startIndex = this.findStartIndex(this.scrollTop);
    
    let endIndex = this.startIndex;
    let height = 0;
    
    // 找到填满可视区域需要的项目数量
    while (endIndex < this.data.length && height < this.containerHeight) {
      const itemHeight = this.itemHeights.get(endIndex) || this.options.estimatedItemHeight;
      height += itemHeight;
      endIndex++;
    }
    
    this.endIndex = Math.min(endIndex + this.options.bufferSize, this.data.length);
    this.startIndex = Math.max(0, this.startIndex - this.options.bufferSize);
  }
  
  // 重写渲染项目
  renderItems() {
    super.renderItems();
    
    // 观察新渲染的项目
    const items = this.viewportElement.children;
    for (const item of items) {
      const index = parseInt(item.dataset.index);
      if (!this.measuredItems.has(index)) {
        this.resizeObserver.observe(item);
      }
    }
    
    // 计算正确的偏移量
    const offsetY = this.itemPositions.get(this.startIndex) || 0;
    this.viewportElement.style.transform = `translateY(${offsetY}px)`;
  }
  
  // 重写设置数据
  setData(data) {
    this.data = data || [];
    this.itemHeights.clear();
    this.itemPositions.clear();
    this.measuredItems.clear();
    
    this.recalculatePositions();
    this.updateContentHeight();
    this.updateVisibleRange();
    this.renderItems();
  }
  
  destroy() {
    super.destroy();
    this.resizeObserver?.disconnect();
  }
}

// 3. 虚拟滚动表格
class VirtualScrollTable extends VirtualScrollList {
  constructor(container, options = {}) {
    super(container, options);
    this.columns = options.columns || [];
    this.sortColumn = null;
    this.sortDirection = 'asc';
  }
  
  // 创建表格结构
  createElements() {
    super.createElements();
    
    // 创建表头
    this.headerElement = document.createElement('div');
    this.headerElement.style.cssText = `
      position: sticky;
      top: 0;
      background: #f5f5f5;
      border-bottom: 2px solid #ddd;
      z-index: 1;
      height: ${this.options.itemHeight}px;
      display: flex;
    `;
    
    this.container.insertBefore(this.headerElement, this.scrollElement);
    this.renderHeader();
    
    // 调整滚动容器高度
    this.scrollElement.style.height = `calc(100% - ${this.options.itemHeight}px)`;
  }
  
  // 渲染表头
  renderHeader() {
    this.headerElement.innerHTML = '';
    
    this.columns.forEach(column => {
      const header = document.createElement('div');
      header.style.cssText = `
        flex: ${column.flex || 1};
        padding: 0 16px;
        display: flex;
        align-items: center;
        font-weight: bold;
        cursor: ${column.sortable ? 'pointer' : 'default'};
        user-select: none;
      `;
      
      header.textContent = column.title;
      
      // 添加排序功能
      if (column.sortable) {
        header.addEventListener('click', () => this.handleSort(column.key));
        
        if (this.sortColumn === column.key) {
          const icon = document.createElement('span');
          icon.textContent = this.sortDirection === 'asc' ? ' ↑' : ' ↓';
          header.appendChild(icon);
        }
      }
      
      this.headerElement.appendChild(header);
    });
  }
  
  // 处理排序
  handleSort(columnKey) {
    if (this.sortColumn === columnKey) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = columnKey;
      this.sortDirection = 'asc';
    }
    
    this.sortData();
    this.renderHeader();
    this.renderItems();
  }
  
  // 排序数据
  sortData() {
    const column = this.columns.find(col => col.key === this.sortColumn);
    if (!column) return;
    
    this.data.sort((a, b) => {
      let aVal = a[this.sortColumn];
      let bVal = b[this.sortColumn];
      
      // 应用自定义排序函数
      if (column.sorter) {
        return column.sorter(a, b) * (this.sortDirection === 'asc' ? 1 : -1);
      }
      
      // 默认排序
      if (aVal < bVal) return this.sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return this.sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }
  
  // 重写创建项目元素
  createItemElement(index) {
    const item = document.createElement('div');
    item.style.cssText = `
      height: ${this.options.itemHeight}px;
      display: flex;
      border-bottom: 1px solid #eee;
      box-sizing: border-box;
    `;
    
    item.dataset.index = index;
    
    const rowData = this.data[index];
    
    this.columns.forEach(column => {
      const cell = document.createElement('div');
      cell.style.cssText = `
        flex: ${column.flex || 1};
        padding: 0 16px;
        display: flex;
        align-items: center;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      `;
      
      let content = rowData[column.key];
      
      // 应用自定义渲染函数
      if (column.render) {
        content = column.render(content, rowData, index);
      }
      
      if (typeof content === 'string') {
        cell.innerHTML = content;
      } else if (content instanceof HTMLElement) {
        cell.appendChild(content);
      }
      
      item.appendChild(cell);
    });
    
    return item;
  }
}

// 4. 使用示例和测试
class VirtualScrollDemo {
  constructor() {
    this.createTestData();
    this.setupUI();
    this.runTests();
  }
  
  createTestData() {
    // 生成大量测试数据
    this.listData = Array.from({ length: 100000 }, (_, index) => ({
      id: index + 1,
      name: `用户 ${index + 1}`,
      email: `user${index + 1}@example.com`,
      age: Math.floor(Math.random() * 50) + 18,
      department: ['技术部', '市场部', '人事部', '财务部'][Math.floor(Math.random() * 4)],
      salary: Math.floor(Math.random() * 50000) + 30000,
      joinDate: new Date(2020 + Math.floor(Math.random() * 4), 
                        Math.floor(Math.random() * 12), 
                        Math.floor(Math.random() * 28)).toLocaleDateString()
    }));
    
    this.tableColumns = [
      { key: 'id', title: 'ID', flex: 0.5, sortable: true },
      { key: 'name', title: '姓名', flex: 1, sortable: true },
      { key: 'email', title: '邮箱', flex: 1.5 },
      { key: 'age', title: '年龄', flex: 0.5, sortable: true },
      { key: 'department', title: '部门', flex: 1, sortable: true },
      { 
        key: 'salary', 
        title: '薪资', 
        flex: 1, 
        sortable: true,
        render: (value) => `¥${value.toLocaleString()}`
      },
      { key: 'joinDate', title: '入职日期', flex: 1 }
    ];
  }
  
  setupUI() {
    document.body.innerHTML = `
      <div style="padding: 20px; font-family: Arial, sans-serif;">
        <h1>虚拟滚动列表演示</h1>
        
        <div style="margin: 20px 0;">
          <button id="test-basic">基础列表测试</button>
          <button id="test-dynamic">动态高度测试</button>
          <button id="test-table">表格测试</button>
          <button id="scroll-to">滚动到50000</button>
          <span id="performance" style="margin-left: 20px; color: #666;"></span>
        </div>
        
        <div id="virtual-container" style="
          border: 1px solid #ddd;
          border-radius: 4px;
          background: white;
        "></div>
        
        <div id="info" style="
          margin-top: 10px;
          padding: 10px;
          background: #f9f9f9;
          border-radius: 4px;
          font-size: 14px;
        "></div>
      </div>
    `;
    
    this.container = document.getElementById('virtual-container');
    this.infoElement = document.getElementById('info');
    this.performanceElement = document.getElementById('performance');
    
    // 绑定按钮事件
    document.getElementById('test-basic').onclick = () => this.testBasicList();
    document.getElementById('test-dynamic').onclick = () => this.testDynamicList();
    document.getElementById('test-table').onclick = () => this.testTable();
    document.getElementById('scroll-to').onclick = () => this.currentList?.scrollToIndex(50000);
  }
  
  testBasicList() {
    console.log('测试基础虚拟列表...');
    const startTime = performance.now();
    
    this.currentList?.destroy();
    this.currentList = new VirtualScrollList(this.container, {
      itemHeight: 60
    });
    
    this.currentList.setRenderFunction((item, index) => {
      return `
        <div style="display: flex; align-items: center; padding: 0 16px;">
          <div style="width: 40px; height: 40px; background: #4CAF50; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; margin-right: 16px;">
            ${index + 1}
          </div>
          <div>
            <div style="font-weight: bold; margin-bottom: 4px;">${item.name}</div>
            <div style="color: #666; font-size: 12px;">${item.email}</div>
          </div>
        </div>
      `;
    });
    
    this.currentList.setData(this.listData);
    
    const endTime = performance.now();
    this.showPerformance('基础列表', endTime - startTime);
    this.updateInfo();
  }
  
  testDynamicList() {
    console.log('测试动态高度列表...');
    const startTime = performance.now();
    
    this.currentList?.destroy();
    this.currentList = new DynamicVirtualScrollList(this.container, {
      estimatedItemHeight: 80
    });
    
    this.currentList.setRenderFunction((item, index) => {
      const content = Math.random() > 0.7 ? 
        `${item.name} - 这是一段比较长的描述文字，用来测试动态高度功能。${item.email}` :
        `${item.name} - ${item.department}`;
      
      return `
        <div style="padding: 16px; line-height: 1.5;">
          <div style="font-weight: bold; margin-bottom: 8px;">${item.name}</div>
          <div style="color: #666; word-wrap: break-word;">${content}</div>
        </div>
      `;
    });
    
    this.currentList.setData(this.listData.slice(0, 10000)); // 减少数据量以便测试
    
    const endTime = performance.now();
    this.showPerformance('动态高度列表', endTime - startTime);
    this.updateInfo();
  }
  
  testTable() {
    console.log('测试虚拟表格...');
    const startTime = performance.now();
    
    this.currentList?.destroy();
    this.currentList = new VirtualScrollTable(this.container, {
      itemHeight: 50,
      columns: this.tableColumns
    });
    
    this.currentList.setData(this.listData);
    
    const endTime = performance.now();
    this.showPerformance('虚拟表格', endTime - startTime);
    this.updateInfo();
  }
  
  showPerformance(testName, time) {
    this.performanceElement.textContent = `${testName} 渲染耗时: ${time.toFixed(2)}ms`;
  }
  
  updateInfo() {
    if (!this.currentList) return;
    
    const range = this.currentList.getVisibleRange();
    this.infoElement.innerHTML = `
      <strong>当前状态:</strong><br>
      数据总量: ${this.listData.length.toLocaleString()} 条<br>
      可视范围: ${range.start} - ${range.end}<br>
      渲染项目: ${range.end - range.start} 个<br>
      滚动位置: ${Math.round(this.currentList.scrollTop)}px
    `;
    
    // 定期更新信息
    if (this.updateInterval) clearInterval(this.updateInterval);
    this.updateInterval = setInterval(() => {
      if (this.currentList) {
        const newRange = this.currentList.getVisibleRange();
        this.infoElement.innerHTML = `
          <strong>当前状态:</strong><br>
          数据总量: ${this.listData.length.toLocaleString()} 条<br>
          可视范围: ${newRange.start} - ${newRange.end}<br>
          渲染项目: ${newRange.end - newRange.start} 个<br>
          滚动位置: ${Math.round(this.currentList.scrollTop)}px
        `;
      }
    }, 100);
  }
  
  runTests() {
    // 默认运行基础列表测试
    this.testBasicList();
  }
}

// 运行演示
console.log('=== 虚拟滚动列表测试 ===\n');

const demo = new VirtualScrollDemo();

console.log('虚拟滚动功能特点：');
console.log('✓ 支持大数据量渲染（10万+条记录）');
console.log('✓ 动态高度支持');
console.log('✓ 表格虚拟化');
console.log('✓ 滚动性能优化');
console.log('✓ 内存占用优化');
console.log('✓ 支持排序功能');
console.log('✓ 自定义渲染函数');
console.log('✓ 缓冲区机制');

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    VirtualScrollList,
    DynamicVirtualScrollList,
    VirtualScrollTable
  };
}
