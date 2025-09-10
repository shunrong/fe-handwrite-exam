/**
 * 虚拟滚动演示逻辑
 */

class VirtualScrollDemo {
    constructor() {
        this.basicList = null;
        this.tableList = null;
        this.updateIntervals = {};
        this.listData = [];
        
        this.init();
    }
    
    init() {
        this.renderFeatures();
        this.createTestData();
        this.showConsoleInfo();
        
        // 默认加载基础列表
        setTimeout(() => {
            this.testBasicList();
        }, 500);
    }
    
    renderFeatures() {
        const featuresContainer = document.getElementById('features-container');
        if (!featuresContainer) return;
        
        featuresContainer.innerHTML = features.map(feature => `
            <div class="feature-item">
                <div class="feature-icon">${feature.icon}</div>
                <span>${feature.text}</span>
            </div>
        `).join('');
    }
    
    createTestData() {
        this.listData = generateTestData(100000);
    }
    
    showLoading(type) {
        const loading = document.getElementById(`${type}-loading`);
        if (loading) {
            loading.style.display = 'flex';
        }
    }
    
    hideLoading(type) {
        const loading = document.getElementById(`${type}-loading`);
        if (loading) {
            loading.style.display = 'none';
        }
    }
    
    updateStats(type, list) {
        const statsContainer = document.getElementById(`${type}-stats`);
        if (!statsContainer || !list) return;
        
        const range = list.getVisibleRange();
        
        statsContainer.innerHTML = `
            <div class="stat-item">
                <div class="stat-value">${range.total.toLocaleString()}</div>
                <div class="stat-label">总数据量</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${(range.end - range.start).toLocaleString()}</div>
                <div class="stat-label">渲染项目</div>
            </div>
            <div class="stat-item">
                <div class="stat-value">${Math.round(range.scrollTop).toLocaleString()}px</div>
                <div class="stat-label">滚动位置</div>
            </div>
        `;
    }
    
    updatePerformance(type, time) {
        const performanceElement = document.getElementById(`${type}-performance`);
        if (!performanceElement) return;
        
        performanceElement.textContent = `${time.toFixed(2)}ms`;
        
        performanceElement.className = 'performance-value';
        if (time < 50) {
            performanceElement.classList.add('performance-good');
        } else if (time < 100) {
            performanceElement.classList.add('performance-ok');
        } else {
            performanceElement.classList.add('performance-bad');
        }
    }
    
    startStatsUpdate(type, list) {
        if (this.updateIntervals[type]) {
            clearInterval(this.updateIntervals[type]);
        }
        
        this.updateStats(type, list);
        
        this.updateIntervals[type] = setInterval(() => {
            this.updateStats(type, list);
        }, 100);
    }
    
    testBasicList() {
        console.log('开始测试基础虚拟列表...');
        
        this.showLoading('basic');
        
        setTimeout(() => {
            const startTime = performance.now();
            
            if (this.basicList) {
                this.basicList.destroy();
            }
            
            this.basicList = new VirtualScrollList(document.getElementById('basic-container'), {
                itemHeight: 60
            });
            
            this.basicList.setRenderFunction((item, index) => {
                const avatarColor = `hsl(${(index * 137.508) % 360}, 70%, 50%)`;
                return `
                    <div style="display: flex; align-items: center; padding: 0 16px; width: 100%;">
                        <div style="
                            width: 40px; 
                            height: 40px; 
                            background: ${avatarColor}; 
                            border-radius: 50%; 
                            display: flex; 
                            align-items: center; 
                            justify-content: center; 
                            color: white; 
                            font-weight: bold; 
                            margin-right: 16px;
                            font-size: 14px;
                        ">
                            ${(index + 1).toString().slice(-2)}
                        </div>
                        <div style="flex: 1; min-width: 0;">
                            <div style="font-weight: bold; margin-bottom: 4px; color: #333;">${item.name}</div>
                            <div style="color: #666; font-size: 12px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                                ${item.email} • ${item.department}
                            </div>
                        </div>
                        <div style="color: #28a745; font-weight: bold;">
                            ¥${item.salary.toLocaleString()}
                        </div>
                    </div>
                `;
            });
            
            this.basicList.setData(this.listData);
            
            const endTime = performance.now();
            this.hideLoading('basic');
            
            this.updatePerformance('basic', endTime - startTime);
            this.startStatsUpdate('basic', this.basicList);
            
            console.log(`基础列表渲染完成，耗时: ${(endTime - startTime).toFixed(2)}ms`);
        }, 50);
    }
    
    testTable() {
        console.log('开始测试虚拟表格...');
        
        this.showLoading('table');
        
        setTimeout(() => {
            const startTime = performance.now();
            
            if (this.tableList) {
                this.tableList.destroy();
            }
            
            this.tableList = new VirtualScrollTable(document.getElementById('table-container'), {
                itemHeight: 50,
                columns: tableColumns
            });
            
            this.tableList.setData(this.listData);
            
            const endTime = performance.now();
            this.hideLoading('table');
            
            this.updatePerformance('table', endTime - startTime);
            this.startStatsUpdate('table', this.tableList);
            
            console.log(`虚拟表格渲染完成，耗时: ${(endTime - startTime).toFixed(2)}ms`);
        }, 50);
    }
    
    scrollToIndex(type, index) {
        const list = type === 'basic' ? this.basicList : this.tableList;
        if (list) {
            list.scrollToIndex(index);
            console.log(`滚动到第 ${index} 项`);
        }
    }
    
    clearList(type) {
        const list = type === 'basic' ? this.basicList : this.tableList;
        if (list) {
            list.setData([]);
            this.updateStats(type, list);
            console.log(`${type} 列表已清空`);
        }
    }
    
    showConsoleInfo() {
        console.log('🎯 虚拟滚动列表演示已启动');
        console.log('📊 功能特点:');
        features.forEach(feature => {
            console.log(`${feature.icon} ${feature.text}`);
        });
    }
    
    destroy() {
        Object.values(this.updateIntervals).forEach(interval => {
            clearInterval(interval);
        });
        
        if (this.basicList) this.basicList.destroy();
        if (this.tableList) this.tableList.destroy();
    }
}

// 全局实例
let virtualDemo;

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    virtualDemo = new VirtualScrollDemo();
});

// 页面卸载时清理
window.addEventListener('beforeunload', function() {
    if (virtualDemo) {
        virtualDemo.destroy();
    }
});
