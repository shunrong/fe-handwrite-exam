/**
 * 无限滚动演示数据
 */

// 控制面板配置
const controlsConfig = {
    checkboxes: [
        { id: 'auto-load', label: '自动加载', checked: true },
        { id: 'simulate-error', label: '模拟错误', checked: false },
        { id: 'show-progress', label: '显示进度', checked: false },
        { id: 'animate-items', label: '项目动画', checked: true }
    ],
    sliders: [
        { 
            id: 'threshold', 
            label: '触发阈值', 
            min: 0, 
            max: 1, 
            step: 0.1, 
            value: 0.1,
            format: (value) => value
        },
        { 
            id: 'root-margin', 
            label: '提前距离', 
            min: 0, 
            max: 500, 
            step: 50, 
            value: 100,
            format: (value) => value + 'px'
        },
        { 
            id: 'page-size', 
            label: '每页数量', 
            min: 6, 
            max: 30, 
            step: 3, 
            value: 12,
            format: (value) => value
        }
    ]
};

// 统计项配置
const statsConfig = [
    { id: 'current-page', label: '当前页数' },
    { id: 'loaded-items', label: '已加载' },
    { id: 'load-count', label: '加载次数' },
    { id: 'total-items', label: '总计' }
];

// 生成测试数据
function generateMockArticles(page, pageSize) {
    const articles = [];
    const categories = ['技术', '生活', '旅行', '美食', '科学', '艺术', '体育', '音乐'];
    const authors = ['张三', '李四', '王五', '赵六', '陈七', '周八', '吴九', '郑十'];
    const titleTemplates = [
        '探索未知的世界',
        '分享生活的美好',
        '技术改变生活',
        '创新思维的力量',
        '发现身边的奇迹',
        '追求卓越的旅程',
        '智慧生活指南',
        '成长路上的感悟',
        '科技前沿趋势',
        '人文艺术魅力'
    ];
    
    const excerptTemplates = [
        '这是一篇非常有趣的文章，分享了作者在某个领域的独特见解和丰富经验。文章内容深入浅出，值得细细品读。',
        '作者通过生动的案例和详细的分析，为我们展现了一个全新的视角。这篇文章必将给读者带来深刻的启发。',
        '在这篇文章中，我们可以看到作者对生活的热爱和对知识的渴求。每一个字都充满了智慧和力量。',
        '这是一次思想的碰撞，一场智慧的盛宴。作者用朴实的语言诠释了深刻的道理，令人回味无穷。',
        '文章以独特的视角探讨了当前热门话题，观点新颖，论述有力，是一篇不可多得的佳作。'
    ];
    
    for (let i = 0; i < pageSize; i++) {
        const id = (page - 1) * pageSize + i + 1;
        const category = categories[Math.floor(Math.random() * categories.length)];
        const author = authors[Math.floor(Math.random() * authors.length)];
        const title = titleTemplates[Math.floor(Math.random() * titleTemplates.length)];
        const excerpt = excerptTemplates[Math.floor(Math.random() * excerptTemplates.length)];
        
        articles.push({
            id,
            title: `${title} #${id}`,
            author,
            category,
            publishTime: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toLocaleDateString(),
            excerpt,
            tags: generateRandomTags(),
            readCount: Math.floor(Math.random() * 10000),
            likeCount: Math.floor(Math.random() * 1000),
            commentCount: Math.floor(Math.random() * 100)
        });
    }
    
    return articles;
}

function generateRandomTags() {
    const allTags = ['热门', '推荐', '原创', '深度', '实用', '有趣', '专业', '新手友好', '干货', '精选'];
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
