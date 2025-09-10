/**
 * 图片懒加载演示数据
 */

// 功能特点数据
const features = [
    { icon: '✓', text: 'Intersection Observer API' },
    { icon: '✓', text: '响应式图片支持' },
    { icon: '✓', text: '失败重试机制' },
    { icon: '✓', text: '图片缓存优化' },
    { icon: '✓', text: '淡入动画效果' },
    { icon: '✓', text: '加载状态指示' },
    { icon: '✓', text: '错误处理机制' },
    { icon: '✓', text: '性能监控统计' }
];

// 图片数据
const imageData = [
    {
        id: 1,
        title: '美丽风景',
        description: '高清自然风景图片，展示大自然的美丽景色',
        src: 'https://picsum.photos/400/300?random=1',
        category: '风景'
    },
    {
        id: 2,
        title: '城市建筑',
        description: '现代城市建筑摄影，展现都市风貌',
        src: 'https://picsum.photos/400/300?random=2',
        category: '建筑'
    },
    {
        id: 3,
        title: '动物世界',
        description: '可爱的动物摄影作品',
        src: 'https://picsum.photos/400/300?random=3',
        category: '动物'
    },
    {
        id: 4,
        title: '美食诱惑',
        description: '精美的美食摄影，令人垂涎欲滴',
        src: 'https://picsum.photos/400/300?random=4',
        category: '美食'
    },
    {
        id: 5,
        title: '人物肖像',
        description: '专业人物肖像摄影',
        src: 'https://picsum.photos/400/300?random=5',
        category: '人物'
    },
    {
        id: 6,
        title: '抽象艺术',
        description: '创意抽象艺术作品',
        src: 'https://picsum.photos/400/300?random=6',
        category: '艺术'
    },
    {
        id: 7,
        title: '科技产品',
        description: '最新科技产品展示',
        src: 'https://picsum.photos/400/300?random=7',
        category: '科技'
    },
    {
        id: 8,
        title: '运动瞬间',
        description: '精彩的运动摄影瞬间',
        src: 'https://picsum.photos/400/300?random=8',
        category: '运动'
    },
    {
        id: 9,
        title: '失败案例',
        description: '这是一个故意失败的图片，用于测试错误处理',
        src: 'https://invalid-domain-for-testing.example/image.jpg',
        category: '测试'
    }
];

// 生成更多图片数据的函数
function generateMoreImages(startId, count = 20) {
    const categories = ['风景', '建筑', '动物', '美食', '人物', '艺术', '科技', '运动'];
    const moreImages = [];
    
    for (let i = 0; i < count; i++) {
        const id = startId + i;
        const category = categories[Math.floor(Math.random() * categories.length)];
        
        moreImages.push({
            id,
            title: `图片 ${id}`,
            description: `这是第 ${id} 张测试图片，用于演示懒加载效果`,
            src: `https://picsum.photos/400/300?random=${id}`,
            category
        });
    }
    
    return moreImages;
}
