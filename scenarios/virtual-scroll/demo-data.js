/**
 * 虚拟滚动演示数据
 */

// 功能特点数据
const features = [
    { icon: '📊', text: '支持 10万+ 数据渲染' },
    { icon: '⚡', text: '毫秒级渲染性能' },
    { icon: '🔄', text: '智能回收DOM节点' },
    { icon: '📱', text: '响应式设计支持' },
    { icon: '🎯', text: '精确滚动定位' },
    { icon: '⚙️', text: '可自定义渲染函数' },
    { icon: '📈', text: '实时性能监控' },
    { icon: '🔍', text: '表格排序功能' }
];

// 表格列配置
const tableColumns = [
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
    { 
        key: 'status', 
        title: '状态', 
        flex: 0.8,
        render: (value) => {
            const colors = {
                '在职': '#28a745',
                '离职': '#dc3545',
                '休假': '#ffc107'
            };
            return `<span style="color: ${colors[value]}; font-weight: bold;">${value}</span>`;
        }
    }
];

// 生成测试数据
function generateTestData(count = 100000) {
    return Array.from({ length: count }, (_, index) => ({
        id: index + 1,
        name: `用户 ${index + 1}`,
        email: `user${index + 1}@example.com`,
        age: Math.floor(Math.random() * 50) + 18,
        department: ['技术部', '市场部', '人事部', '财务部'][Math.floor(Math.random() * 4)],
        salary: Math.floor(Math.random() * 50000) + 30000,
        joinDate: new Date(2020 + Math.floor(Math.random() * 4), 
                  Math.floor(Math.random() * 12), 
                  Math.floor(Math.random() * 28)).toLocaleDateString(),
        status: ['在职', '离职', '休假'][Math.floor(Math.random() * 3)]
    }));
}
