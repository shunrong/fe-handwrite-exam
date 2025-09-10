/**
 * 场景题5: 拖拽排序功能实现
 * 
 * 业务场景：
 * - 后台管理系统需要支持表格行拖拽排序
 * - 看板应用需要在不同列之间拖拽卡片
 * - 文件管理器需要支持文件夹和文件的拖拽排序
 * 
 * 考察点：
 * - DOM事件处理（mousedown、mousemove、mouseup）
 * - 坐标计算和碰撞检测
 * - DOM操作和动画效果
 * - 数据结构操作
 * - 移动端touch事件兼容
 */

// 1. 基础拖拽排序实现
class DragSort {
  constructor(container, options = {}) {
    this.container = typeof container === 'string' 
      ? document.querySelector(container) 
      : container;
    
    this.options = {
      itemSelector: '.drag-item',    // 可拖拽项选择器
      handleSelector: null,          // 拖拽手柄选择器
      placeholder: true,             // 是否显示占位符
      animation: true,               // 是否启用动画
      animationDuration: 300,        // 动画持续时间
      threshold: 5,                  // 拖拽阈值
      axis: null,                    // 限制拖拽轴向 'x' | 'y'
      disabled: false,               // 是否禁用
      ...options
    };
    
    this.dragState = {
      isDragging: false,
      dragElement: null,
      placeholder: null,
      startX: 0,
      startY: 0,
      offsetX: 0,
      offsetY: 0,
      items: []
    };
    
    this.callbacks = {
      onStart: options.onStart || (() => {}),
      onMove: options.onMove || (() => {}),
      onEnd: options.onEnd || (() => {}),
      onChange: options.onChange || (() => {})
    };
    
    this.init();
  }
  
  init() {
    this.bindEvents();
    this.updateItems();
  }
  
  // 绑定事件
  bindEvents() {
    // 鼠标事件
    this.container.addEventListener('mousedown', this.handleMouseDown.bind(this));
    document.addEventListener('mousemove', this.handleMouseMove.bind(this));
    document.addEventListener('mouseup', this.handleMouseUp.bind(this));
    
    // 触摸事件（移动端支持）
    this.container.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
    document.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
    document.addEventListener('touchend', this.handleTouchEnd.bind(this));
    
    // 防止默认拖拽行为
    this.container.addEventListener('dragstart', (e) => e.preventDefault());
  }
  
  // 更新可拖拽项列表
  updateItems() {
    this.dragState.items = Array.from(
      this.container.querySelectorAll(this.options.itemSelector)
    );
  }
  
  // 鼠标按下
  handleMouseDown(e) {
    if (this.options.disabled) return;
    this.startDrag(e, e.clientX, e.clientY);
  }
  
  // 触摸开始
  handleTouchStart(e) {
    if (this.options.disabled) return;
    const touch = e.touches[0];
    this.startDrag(e, touch.clientX, touch.clientY);
  }
  
  // 开始拖拽
  startDrag(e, clientX, clientY) {
    const target = e.target.closest(this.options.itemSelector);
    if (!target) return;
    
    // 检查是否点击了拖拽手柄
    if (this.options.handleSelector) {
      const handle = e.target.closest(this.options.handleSelector);
      if (!handle || !target.contains(handle)) return;
    }
    
    e.preventDefault();
    
    this.updateItems();
    
    const rect = target.getBoundingClientRect();
    
    this.dragState = {
      isDragging: false, // 先不设为true，等达到阈值后再设置
      dragElement: target,
      placeholder: null,
      startX: clientX,
      startY: clientY,
      offsetX: clientX - rect.left,
      offsetY: clientY - rect.top,
      items: this.dragState.items,
      startIndex: this.dragState.items.indexOf(target)
    };
    
    // 添加拖拽中的样式
    target.style.userSelect = 'none';
    target.style.pointerEvents = 'none';
    
    this.callbacks.onStart(target, this.dragState.startIndex);
  }
  
  // 鼠标移动
  handleMouseMove(e) {
    this.moveDrag(e.clientX, e.clientY);
  }
  
  // 触摸移动
  handleTouchMove(e) {
    e.preventDefault();
    const touch = e.touches[0];
    this.moveDrag(touch.clientX, touch.clientY);
  }
  
  // 移动拖拽
  moveDrag(clientX, clientY) {
    if (!this.dragState.dragElement) return;
    
    const deltaX = clientX - this.dragState.startX;
    const deltaY = clientY - this.dragState.startY;
    
    // 检查是否达到拖拽阈值
    if (!this.dragState.isDragging) {
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      if (distance < this.options.threshold) return;
      
      this.dragState.isDragging = true;
      this.createPlaceholder();
      this.startDragAnimation();
    }
    
    // 更新拖拽元素位置
    this.updateDragElementPosition(clientX, clientY);
    
    // 检查插入位置
    this.checkDropPosition(clientX, clientY);
    
    this.callbacks.onMove(this.dragState.dragElement, clientX, clientY);
  }
  
  // 创建占位符
  createPlaceholder() {
    if (!this.options.placeholder) return;
    
    const placeholder = this.dragState.dragElement.cloneNode(true);
    placeholder.style.opacity = '0.5';
    placeholder.style.transform = 'none';
    placeholder.classList.add('drag-placeholder');
    
    this.dragState.placeholder = placeholder;
    this.dragState.dragElement.parentNode.insertBefore(
      placeholder, 
      this.dragState.dragElement
    );
  }
  
  // 开始拖拽动画
  startDragAnimation() {
    const dragElement = this.dragState.dragElement;
    
    dragElement.style.position = 'fixed';
    dragElement.style.zIndex = '1000';
    dragElement.style.pointerEvents = 'none';
    dragElement.style.transform = 'rotate(5deg)';
    
    if (this.options.animation) {
      dragElement.style.transition = 'none';
      dragElement.classList.add('dragging');
    }
  }
  
  // 更新拖拽元素位置
  updateDragElementPosition(clientX, clientY) {
    const dragElement = this.dragState.dragElement;
    
    let x = clientX - this.dragState.offsetX;
    let y = clientY - this.dragState.offsetY;
    
    // 限制轴向移动
    if (this.options.axis === 'x') {
      const rect = dragElement.getBoundingClientRect();
      y = rect.top;
    } else if (this.options.axis === 'y') {
      const rect = dragElement.getBoundingClientRect();
      x = rect.left;
    }
    
    dragElement.style.left = `${x}px`;
    dragElement.style.top = `${y}px`;
  }
  
  // 检查放置位置
  checkDropPosition(clientX, clientY) {
    const items = this.dragState.items.filter(item => 
      item !== this.dragState.dragElement
    );
    
    let insertIndex = items.length;
    
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const rect = item.getBoundingClientRect();
      
      // 根据轴向判断插入位置
      if (this.options.axis === 'x') {
        if (clientX < rect.left + rect.width / 2) {
          insertIndex = i;
          break;
        }
      } else {
        if (clientY < rect.top + rect.height / 2) {
          insertIndex = i;
          break;
        }
      }
    }
    
    this.updatePlaceholderPosition(insertIndex);
  }
  
  // 更新占位符位置
  updatePlaceholderPosition(insertIndex) {
    if (!this.dragState.placeholder) return;
    
    const items = this.dragState.items.filter(item => 
      item !== this.dragState.dragElement
    );
    
    const targetItem = items[insertIndex];
    const container = this.container;
    
    if (targetItem) {
      container.insertBefore(this.dragState.placeholder, targetItem);
    } else {
      container.appendChild(this.dragState.placeholder);
    }
  }
  
  // 鼠标释放
  handleMouseUp(e) {
    this.endDrag();
  }
  
  // 触摸结束
  handleTouchEnd(e) {
    this.endDrag();
  }
  
  // 结束拖拽
  endDrag() {
    if (!this.dragState.dragElement) return;
    
    const dragElement = this.dragState.dragElement;
    const placeholder = this.dragState.placeholder;
    
    // 恢复元素样式
    dragElement.style.position = '';
    dragElement.style.zIndex = '';
    dragElement.style.left = '';
    dragElement.style.top = '';
    dragElement.style.userSelect = '';
    dragElement.style.pointerEvents = '';
    dragElement.style.transform = '';
    
    if (this.options.animation) {
      dragElement.style.transition = '';
      dragElement.classList.remove('dragging');
    }
    
    // 如果有占位符，替换为原元素
    if (placeholder && this.dragState.isDragging) {
      placeholder.parentNode.replaceChild(dragElement, placeholder);
      
      // 更新数据
      this.updateItems();
      const newIndex = this.dragState.items.indexOf(dragElement);
      
      if (newIndex !== this.dragState.startIndex) {
        this.callbacks.onChange(
          this.dragState.startIndex,
          newIndex,
          dragElement
        );
      }
    }
    
    this.callbacks.onEnd(dragElement, this.dragState.isDragging);
    
    // 重置状态
    this.dragState = {
      isDragging: false,
      dragElement: null,
      placeholder: null,
      startX: 0,
      startY: 0,
      offsetX: 0,
      offsetY: 0,
      items: []
    };
  }
  
  // 获取当前排序
  getOrder() {
    this.updateItems();
    return this.dragState.items.map((item, index) => ({
      element: item,
      index,
      id: item.dataset.id || index
    }));
  }
  
  // 设置排序
  setOrder(order) {
    const fragment = document.createDocumentFragment();
    
    order.forEach(id => {
      const element = this.container.querySelector(`[data-id="${id}"]`);
      if (element) {
        fragment.appendChild(element);
      }
    });
    
    this.container.appendChild(fragment);
    this.updateItems();
  }
  
  // 销毁
  destroy() {
    this.container.removeEventListener('mousedown', this.handleMouseDown);
    document.removeEventListener('mousemove', this.handleMouseMove);
    document.removeEventListener('mouseup', this.handleMouseUp);
    
    this.container.removeEventListener('touchstart', this.handleTouchStart);
    document.removeEventListener('touchmove', this.handleTouchMove);
    document.removeEventListener('touchend', this.handleTouchEnd);
  }
}

// 2. 多列拖拽排序（看板功能）
class KanbanDragSort {
  constructor(container, options = {}) {
    this.container = typeof container === 'string' 
      ? document.querySelector(container) 
      : container;
    
    this.options = {
      columnSelector: '.kanban-column',
      itemSelector: '.kanban-item',
      handleSelector: '.drag-handle',
      placeholder: true,
      animation: true,
      dropZoneClass: 'drop-zone-active',
      ...options
    };
    
    this.dragState = {
      isDragging: false,
      dragElement: null,
      sourceColumn: null,
      targetColumn: null,
      placeholder: null,
      startX: 0,
      startY: 0,
      offsetX: 0,
      offsetY: 0
    };
    
    this.callbacks = {
      onStart: options.onStart || (() => {}),
      onMove: options.onMove || (() => {}),
      onEnd: options.onEnd || (() => {}),
      onColumnChange: options.onColumnChange || (() => {})
    };
    
    this.init();
  }
  
  init() {
    this.bindEvents();
    this.updateColumns();
  }
  
  bindEvents() {
    this.container.addEventListener('mousedown', this.handleMouseDown.bind(this));
    document.addEventListener('mousemove', this.handleMouseMove.bind(this));
    document.addEventListener('mouseup', this.handleMouseUp.bind(this));
    
    this.container.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
    document.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
    document.addEventListener('touchend', this.handleTouchEnd.bind(this));
  }
  
  updateColumns() {
    this.columns = Array.from(
      this.container.querySelectorAll(this.options.columnSelector)
    );
  }
  
  handleMouseDown(e) {
    this.startDrag(e, e.clientX, e.clientY);
  }
  
  handleTouchStart(e) {
    const touch = e.touches[0];
    this.startDrag(e, touch.clientX, touch.clientY);
  }
  
  startDrag(e, clientX, clientY) {
    const item = e.target.closest(this.options.itemSelector);
    if (!item) return;
    
    if (this.options.handleSelector) {
      const handle = e.target.closest(this.options.handleSelector);
      if (!handle || !item.contains(handle)) return;
    }
    
    e.preventDefault();
    
    const rect = item.getBoundingClientRect();
    const column = item.closest(this.options.columnSelector);
    
    this.dragState = {
      isDragging: true,
      dragElement: item,
      sourceColumn: column,
      targetColumn: column,
      placeholder: null,
      startX: clientX,
      startY: clientY,
      offsetX: clientX - rect.left,
      offsetY: clientY - rect.top
    };
    
    this.createPlaceholder();
    this.startDragAnimation();
    
    this.callbacks.onStart(item, column);
  }
  
  createPlaceholder() {
    const placeholder = document.createElement('div');
    placeholder.className = 'kanban-placeholder';
    placeholder.style.cssText = `
      height: ${this.dragState.dragElement.offsetHeight}px;
      margin: ${getComputedStyle(this.dragState.dragElement).margin};
      background: #f0f0f0;
      border: 2px dashed #ccc;
      border-radius: 4px;
      opacity: 0.5;
    `;
    
    this.dragState.placeholder = placeholder;
    this.dragState.dragElement.parentNode.insertBefore(
      placeholder,
      this.dragState.dragElement
    );
  }
  
  startDragAnimation() {
    const item = this.dragState.dragElement;
    
    item.style.position = 'fixed';
    item.style.zIndex = '1000';
    item.style.pointerEvents = 'none';
    item.style.transform = 'rotate(3deg) scale(1.05)';
    item.style.boxShadow = '0 8px 24px rgba(0,0,0,0.15)';
    
    if (this.options.animation) {
      item.style.transition = 'transform 0.2s ease';
    }
  }
  
  handleMouseMove(e) {
    this.moveDrag(e.clientX, e.clientY);
  }
  
  handleTouchMove(e) {
    e.preventDefault();
    const touch = e.touches[0];
    this.moveDrag(touch.clientX, touch.clientY);
  }
  
  moveDrag(clientX, clientY) {
    if (!this.dragState.isDragging) return;
    
    // 更新拖拽元素位置
    const item = this.dragState.dragElement;
    item.style.left = `${clientX - this.dragState.offsetX}px`;
    item.style.top = `${clientY - this.dragState.offsetY}px`;
    
    // 检查目标列
    const targetColumn = this.getColumnAt(clientX, clientY);
    if (targetColumn !== this.dragState.targetColumn) {
      this.updateTargetColumn(targetColumn);
    }
    
    // 更新占位符位置
    if (targetColumn) {
      this.updatePlaceholderPosition(targetColumn, clientX, clientY);
    }
    
    this.callbacks.onMove(item, clientX, clientY, targetColumn);
  }
  
  getColumnAt(x, y) {
    for (const column of this.columns) {
      const rect = column.getBoundingClientRect();
      if (x >= rect.left && x <= rect.right && 
          y >= rect.top && y <= rect.bottom) {
        return column;
      }
    }
    return null;
  }
  
  updateTargetColumn(targetColumn) {
    // 移除之前列的激活状态
    if (this.dragState.targetColumn) {
      this.dragState.targetColumn.classList.remove(this.options.dropZoneClass);
    }
    
    // 添加新列的激活状态
    if (targetColumn) {
      targetColumn.classList.add(this.options.dropZoneClass);
    }
    
    this.dragState.targetColumn = targetColumn;
  }
  
  updatePlaceholderPosition(column, clientX, clientY) {
    const items = Array.from(column.querySelectorAll(this.options.itemSelector))
      .filter(item => item !== this.dragState.dragElement);
    
    let insertBefore = null;
    
    for (const item of items) {
      const rect = item.getBoundingClientRect();
      if (clientY < rect.top + rect.height / 2) {
        insertBefore = item;
        break;
      }
    }
    
    if (insertBefore) {
      column.insertBefore(this.dragState.placeholder, insertBefore);
    } else {
      column.appendChild(this.dragState.placeholder);
    }
  }
  
  handleMouseUp() {
    this.endDrag();
  }
  
  handleTouchEnd() {
    this.endDrag();
  }
  
  endDrag() {
    if (!this.dragState.isDragging) return;
    
    const item = this.dragState.dragElement;
    const sourceColumn = this.dragState.sourceColumn;
    const targetColumn = this.dragState.targetColumn;
    const placeholder = this.dragState.placeholder;
    
    // 恢复元素样式
    item.style.position = '';
    item.style.zIndex = '';
    item.style.left = '';
    item.style.top = '';
    item.style.pointerEvents = '';
    item.style.transform = '';
    item.style.boxShadow = '';
    item.style.transition = '';
    
    // 移除激活状态
    if (targetColumn) {
      targetColumn.classList.remove(this.options.dropZoneClass);
    }
    
    // 如果有目标位置，移动元素
    if (placeholder && targetColumn) {
      placeholder.parentNode.replaceChild(item, placeholder);
      
      // 触发列变更回调
      if (sourceColumn !== targetColumn) {
        this.callbacks.onColumnChange(
          item,
          sourceColumn,
          targetColumn
        );
      }
    }
    
    this.callbacks.onEnd(item, sourceColumn, targetColumn);
    
    // 重置状态
    this.dragState = {
      isDragging: false,
      dragElement: null,
      sourceColumn: null,
      targetColumn: null,
      placeholder: null,
      startX: 0,
      startY: 0,
      offsetX: 0,
      offsetY: 0
    };
  }
  
  // 获取所有列的数据
  getData() {
    return this.columns.map(column => ({
      id: column.dataset.id,
      items: Array.from(column.querySelectorAll(this.options.itemSelector))
        .map(item => ({
          id: item.dataset.id,
          element: item
        }))
    }));
  }
}

// 3. 演示应用
class DragSortDemo {
  constructor() {
    this.setupUI();
    this.initSimpleList();
    this.initKanbanBoard();
  }
  
  setupUI() {
    document.body.innerHTML = `
      <div style="max-width: 1200px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
        <h1>拖拽排序功能演示</h1>
        
        <div style="display: grid; grid-template-columns: 1fr 2fr; gap: 40px;">
          <!-- 简单列表拖拽 -->
          <div>
            <h2>简单列表拖拽</h2>
            <div id="simple-list" style="
              border: 1px solid #ddd;
              border-radius: 8px;
              background: white;
              min-height: 400px;
              padding: 16px;
            ">
              <div class="drag-item" data-id="1" style="
                padding: 12px;
                margin: 8px 0;
                background: #f8f9fa;
                border: 1px solid #e9ecef;
                border-radius: 4px;
                cursor: move;
                user-select: none;
                display: flex;
                align-items: center;
                gap: 8px;
              ">
                <span class="drag-handle" style="
                  background: #6c757d;
                  color: white;
                  padding: 4px 8px;
                  border-radius: 4px;
                  font-size: 12px;
                  cursor: grab;
                ">⋮⋮</span>
                <span>任务 1: 完成项目文档</span>
              </div>
              
              <div class="drag-item" data-id="2" style="
                padding: 12px;
                margin: 8px 0;
                background: #f8f9fa;
                border: 1px solid #e9ecef;
                border-radius: 4px;
                cursor: move;
                user-select: none;
                display: flex;
                align-items: center;
                gap: 8px;
              ">
                <span class="drag-handle" style="
                  background: #6c757d;
                  color: white;
                  padding: 4px 8px;
                  border-radius: 4px;
                  font-size: 12px;
                  cursor: grab;
                ">⋮⋮</span>
                <span>任务 2: 代码审查</span>
              </div>
              
              <div class="drag-item" data-id="3" style="
                padding: 12px;
                margin: 8px 0;
                background: #f8f9fa;
                border: 1px solid #e9ecef;
                border-radius: 4px;
                cursor: move;
                user-select: none;
                display: flex;
                align-items: center;
                gap: 8px;
              ">
                <span class="drag-handle" style="
                  background: #6c757d;
                  color: white;
                  padding: 4px 8px;
                  border-radius: 4px;
                  font-size: 12px;
                  cursor: grab;
                ">⋮⋮</span>
                <span>任务 3: 部署测试</span>
              </div>
              
              <div class="drag-item" data-id="4" style="
                padding: 12px;
                margin: 8px 0;
                background: #f8f9fa;
                border: 1px solid #e9ecef;
                border-radius: 4px;
                cursor: move;
                user-select: none;
                display: flex;
                align-items: center;
                gap: 8px;
              ">
                <span class="drag-handle" style="
                  background: #6c757d;
                  color: white;
                  padding: 4px 8px;
                  border-radius: 4px;
                  font-size: 12px;
                  cursor: grab;
                ">⋮⋮</span>
                <span>任务 4: 用户培训</span>
              </div>
            </div>
            
            <div id="list-log" style="
              margin-top: 16px;
              padding: 12px;
              background: #f8f9fa;
              border-radius: 4px;
              font-size: 14px;
              max-height: 150px;
              overflow-y: auto;
            "></div>
          </div>
          
          <!-- 看板拖拽 -->
          <div>
            <h2>看板拖拽</h2>
            <div id="kanban-board" style="
              display: grid;
              grid-template-columns: 1fr 1fr 1fr;
              gap: 16px;
              min-height: 400px;
            ">
              <div class="kanban-column" data-id="todo" style="
                background: #fff3cd;
                border: 1px solid #ffeaa7;
                border-radius: 8px;
                padding: 16px;
              ">
                <h3 style="margin: 0 0 16px 0; text-align: center; color: #856404;">待办</h3>
                
                <div class="kanban-item" data-id="item1" style="
                  background: white;
                  padding: 12px;
                  margin: 8px 0;
                  border-radius: 4px;
                  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                  cursor: move;
                ">
                  <div class="drag-handle" style="
                    width: 100%;
                    height: 4px;
                    background: #ddd;
                    border-radius: 2px;
                    margin-bottom: 8px;
                    cursor: grab;
                  "></div>
                  <div>设计用户界面</div>
                  <small style="color: #666;">预计 2 天</small>
                </div>
                
                <div class="kanban-item" data-id="item2" style="
                  background: white;
                  padding: 12px;
                  margin: 8px 0;
                  border-radius: 4px;
                  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                  cursor: move;
                ">
                  <div class="drag-handle" style="
                    width: 100%;
                    height: 4px;
                    background: #ddd;
                    border-radius: 2px;
                    margin-bottom: 8px;
                    cursor: grab;
                  "></div>
                  <div>编写API文档</div>
                  <small style="color: #666;">预计 1 天</small>
                </div>
              </div>
              
              <div class="kanban-column" data-id="doing" style="
                background: #d1ecf1;
                border: 1px solid #7dd3fc;
                border-radius: 8px;
                padding: 16px;
              ">
                <h3 style="margin: 0 0 16px 0; text-align: center; color: #0c5460;">进行中</h3>
                
                <div class="kanban-item" data-id="item3" style="
                  background: white;
                  padding: 12px;
                  margin: 8px 0;
                  border-radius: 4px;
                  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                  cursor: move;
                ">
                  <div class="drag-handle" style="
                    width: 100%;
                    height: 4px;
                    background: #ddd;
                    border-radius: 2px;
                    margin-bottom: 8px;
                    cursor: grab;
                  "></div>
                  <div>实现登录功能</div>
                  <small style="color: #666;">进度 70%</small>
                </div>
              </div>
              
              <div class="kanban-column" data-id="done" style="
                background: #d4edda;
                border: 1px solid #a3e9a4;
                border-radius: 8px;
                padding: 16px;
              ">
                <h3 style="margin: 0 0 16px 0; text-align: center; color: #155724;">已完成</h3>
                
                <div class="kanban-item" data-id="item4" style="
                  background: white;
                  padding: 12px;
                  margin: 8px 0;
                  border-radius: 4px;
                  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                  cursor: move;
                ">
                  <div class="drag-handle" style="
                    width: 100%;
                    height: 4px;
                    background: #ddd;
                    border-radius: 2px;
                    margin-bottom: 8px;
                    cursor: grab;
                  "></div>
                  <div>项目初始化</div>
                  <small style="color: #666;">✓ 已完成</small>
                </div>
                
                <div class="kanban-item" data-id="item5" style="
                  background: white;
                  padding: 12px;
                  margin: 8px 0;
                  border-radius: 4px;
                  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                  cursor: move;
                ">
                  <div class="drag-handle" style="
                    width: 100%;
                    height: 4px;
                    background: #ddd;
                    border-radius: 2px;
                    margin-bottom: 8px;
                    cursor: grab;
                  "></div>
                  <div>环境搭建</div>
                  <small style="color: #666;">✓ 已完成</small>
                </div>
              </div>
            </div>
            
            <div id="kanban-log" style="
              margin-top: 16px;
              padding: 12px;
              background: #f8f9fa;
              border-radius: 4px;
              font-size: 14px;
              max-height: 150px;
              overflow-y: auto;
            "></div>
          </div>
        </div>
      </div>
      
      <style>
        .dragging {
          opacity: 0.8;
          transform: rotate(5deg) scale(1.05) !important;
          box-shadow: 0 8px 24px rgba(0,0,0,0.15) !important;
        }
        
        .drop-zone-active {
          background-color: rgba(0, 123, 255, 0.1) !important;
          border-color: #007bff !important;
        }
        
        .drag-handle:active {
          cursor: grabbing;
        }
      </style>
    `;
  }
  
  initSimpleList() {
    this.simpleDragSort = new DragSort('#simple-list', {
      handleSelector: '.drag-handle',
      onStart: (element, index) => {
        this.log('list-log', `开始拖拽: ${element.textContent.trim()} (位置 ${index})`);
      },
      onChange: (oldIndex, newIndex, element) => {
        this.log('list-log', `排序变更: ${element.textContent.trim()} 从位置 ${oldIndex} 移动到 ${newIndex}`);
      },
      onEnd: (element, wasDragging) => {
        if (wasDragging) {
          this.log('list-log', `拖拽结束: ${element.textContent.trim()}`);
        }
      }
    });
  }
  
  initKanbanBoard() {
    this.kanbanDragSort = new KanbanDragSort('#kanban-board', {
      onStart: (item, column) => {
        this.log('kanban-log', `开始拖拽: ${item.textContent.trim()} 从 ${column.dataset.id} 列`);
      },
      onColumnChange: (item, sourceColumn, targetColumn) => {
        this.log('kanban-log', `列变更: ${item.textContent.trim()} 从 ${sourceColumn.dataset.id} 移动到 ${targetColumn.dataset.id}`);
      },
      onEnd: (item, sourceColumn, targetColumn) => {
        this.log('kanban-log', `拖拽结束: ${item.textContent.trim()}`);
      }
    });
  }
  
  log(containerId, message) {
    const logContainer = document.getElementById(containerId);
    const timestamp = new Date().toLocaleTimeString();
    logContainer.innerHTML += `[${timestamp}] ${message}<br>`;
    logContainer.scrollTop = logContainer.scrollHeight;
  }
}

// 运行演示
console.log('=== 拖拽排序功能测试 ===\n');

const demo = new DragSortDemo();

console.log('拖拽排序功能特点：');
console.log('✓ 支持鼠标和触摸事件');
console.log('✓ 可配置拖拽手柄');
console.log('✓ 占位符视觉反馈');
console.log('✓ 平滑的拖拽动画');
console.log('✓ 多列拖拽支持');
console.log('✓ 轴向限制');
console.log('✓ 完整的事件回调');
console.log('✓ 移动端兼容');

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    DragSort,
    KanbanDragSort
  };
}
