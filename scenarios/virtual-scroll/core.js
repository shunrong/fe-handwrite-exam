/**
 * 虚拟滚动列表核心功能
 */

// 基础虚拟滚动实现
class VirtualScrollList {
    constructor(container, options = {}) {
        this.container = typeof container === 'string' 
            ? document.querySelector(container) 
            : container;
        
        this.options = {
            itemHeight: 50,
            bufferSize: 5,
            scrollThrottle: 16,
            overscan: 3,
            ...options
        };
        
        this.data = [];
        this.startIndex = 0;
        this.endIndex = 0;
        this.scrollTop = 0;
        this.containerHeight = 0;
        this.visibleCount = 0;
        
        this.renderFunction = null;
        this.scrollElement = null;
        this.contentElement = null;
        this.viewportElement = null;
        
        this.init();
    }
    
    init() {
        this.createElements();
        this.bindEvents();
        this.calculateSizes();
    }
    
    createElements() {
        this.container.innerHTML = '';
        this.container.style.cssText = `
            position: relative;
            width: 100%;
            overflow: hidden;
        `;
        
        this.scrollElement = document.createElement('div');
        this.scrollElement.style.cssText = `
            width: 100%;
            height: 100%;
            overflow-y: auto;
            overflow-x: hidden;
            box-sizing: border-box;
        `;
        
        this.contentElement = document.createElement('div');
        this.contentElement.style.cssText = `
            position: relative;
            width: 100%;
            min-height: 100%;
        `;
        
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
        window.addEventListener('resize', this.handleResize.bind(this));
    }
    
    handleScroll() {
        const scrollTop = this.scrollElement.scrollTop;
        
        if (Math.abs(scrollTop - this.scrollTop) < 1) {
            return;
        }
        
        this.scrollTop = scrollTop;
        this.updateVisibleRange();
        this.renderItems();
        
        if (this.onScroll) {
            this.onScroll(this.getVisibleRange());
        }
    }
    
    handleResize() {
        this.calculateSizes();
        this.updateVisibleRange();
        this.renderItems();
    }
    
    calculateSizes() {
        const rect = this.container.getBoundingClientRect();
        this.containerHeight = rect.height;
        this.visibleCount = Math.ceil(this.containerHeight / this.options.itemHeight);
        
        const totalHeight = this.data.length * this.options.itemHeight;
        this.contentElement.style.height = `${totalHeight}px`;
        
        // 调试信息
        console.log('Virtual Scroll Debug:', {
            containerHeight: this.containerHeight,
            visibleCount: this.visibleCount,
            totalHeight: totalHeight,
            dataLength: this.data.length,
            itemHeight: this.options.itemHeight
        });
    }
    
    updateVisibleRange() {
        const { itemHeight, bufferSize } = this.options;
        
        const startIndex = Math.floor(this.scrollTop / itemHeight);
        const endIndex = Math.min(
            startIndex + this.visibleCount + 1,
            this.data.length
        );
        
        this.startIndex = Math.max(0, startIndex - bufferSize);
        this.endIndex = Math.min(this.data.length, endIndex + bufferSize);
    }
    
    renderItems() {
        if (!this.renderFunction) {
            console.warn('Render function not provided');
            return;
        }
        
        const fragment = document.createDocumentFragment();
        const items = [];
        
        for (let i = this.startIndex; i < this.endIndex; i++) {
            const item = this.createItemElement(i);
            items.push(item);
            fragment.appendChild(item);
        }
        
        this.viewportElement.innerHTML = '';
        this.viewportElement.appendChild(fragment);
        
        const offsetY = this.startIndex * this.options.itemHeight;
        this.viewportElement.style.transform = `translateY(${offsetY}px)`;
        
        this.onRenderComplete?.(items, this.startIndex, this.endIndex);
    }
    
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
        
        const content = this.renderFunction(this.data[index], index);
        
        if (typeof content === 'string') {
            item.innerHTML = content;
        } else if (content instanceof HTMLElement) {
            item.appendChild(content);
        }
        
        return item;
    }
    
    setData(data) {
        this.data = data || [];
        this.calculateSizes();
        this.updateVisibleRange();
        this.renderItems();
    }
    
    setRenderFunction(fn) {
        this.renderFunction = fn;
    }
    
    scrollToIndex(index) {
        if (index < 0 || index >= this.data.length) return;
        
        const targetScrollTop = index * this.options.itemHeight;
        this.scrollElement.scrollTop = targetScrollTop;
    }
    
    getVisibleRange() {
        return {
            start: this.startIndex,
            end: this.endIndex,
            data: this.data.slice(this.startIndex, this.endIndex),
            scrollTop: this.scrollTop,
            total: this.data.length
        };
    }
    
    refresh() {
        this.calculateSizes();
        this.updateVisibleRange();
        this.renderItems();
    }
    
    destroy() {
        this.scrollElement?.removeEventListener('scroll', this.handleScroll);
        window.removeEventListener('resize', this.handleResize);
        this.container.innerHTML = '';
    }
}

// 虚拟表格类
class VirtualScrollTable extends VirtualScrollList {
    constructor(container, options = {}) {
        super(container, options);
        this.columns = options.columns || [];
        this.sortColumn = null;
        this.sortDirection = 'asc';
    }
    
    createElements() {
        super.createElements();
        
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
        
        this.scrollElement.style.height = `calc(100% - ${this.options.itemHeight}px)`;
    }
    
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
                transition: background 0.3s;
            `;
            
            header.textContent = column.title;
            
            if (column.sortable) {
                header.addEventListener('click', () => this.handleSort(column.key));
                header.addEventListener('mouseenter', () => {
                    header.style.background = '#e9ecef';
                });
                header.addEventListener('mouseleave', () => {
                    header.style.background = '';
                });
                
                if (this.sortColumn === column.key) {
                    const icon = document.createElement('span');
                    icon.textContent = this.sortDirection === 'asc' ? ' ↑' : ' ↓';
                    icon.style.color = '#007bff';
                    header.appendChild(icon);
                }
            }
            
            this.headerElement.appendChild(header);
        });
    }
    
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
    
    sortData() {
        const column = this.columns.find(col => col.key === this.sortColumn);
        if (!column) return;
        
        this.data.sort((a, b) => {
            let aVal = a[this.sortColumn];
            let bVal = b[this.sortColumn];
            
            if (column.sorter) {
                return column.sorter(a, b) * (this.sortDirection === 'asc' ? 1 : -1);
            }
            
            if (aVal < bVal) return this.sortDirection === 'asc' ? -1 : 1;
            if (aVal > bVal) return this.sortDirection === 'asc' ? 1 : -1;
            return 0;
        });
    }
    
    createItemElement(index) {
        const item = document.createElement('div');
        item.style.cssText = `
            height: ${this.options.itemHeight}px;
            display: flex;
            border-bottom: 1px solid #eee;
            box-sizing: border-box;
            transition: background 0.2s;
        `;
        
        item.addEventListener('mouseenter', () => {
            item.style.background = '#f8f9fa';
        });
        item.addEventListener('mouseleave', () => {
            item.style.background = '';
        });
        
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
