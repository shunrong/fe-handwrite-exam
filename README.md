# 🚀 前端面试手写题演示 - 完整题库

> 30道精选手写题，从基础理论到实战应用，助你面试成功！

## 📖 项目介绍

这是一个完整的前端面试手写题库，包含 **30道精选题目**，涵盖：

- **15道基础手写题**：语言核心特性和常用工具函数
- **15道场景应用题**：结合实际业务的综合应用

每道题都有完整的实现代码、详细注释和可运行的演示页面。

## 🎯 快速开始

### 方法一：直接打开HTML文件

1. **克隆或下载项目**
   ```bash
   git clone [项目地址]
   cd fe-handwrite-exam
   ```

2. **打开主页面**
   - 双击 `index.html` 文件
   - 或者在浏览器中打开 `file:///你的路径/fe-handwrite-exam/index.html`

3. **浏览演示**
   - 主页面展示所有题目列表
   - 点击任意题目进入具体演示页面

### 方法二：使用本地服务器（推荐）

1. **使用 Python 启动服务器**
   ```bash
   # Python 3
   python -m http.server 8000
   
   # Python 2
   python -m SimpleHTTPServer 8000
   ```

2. **使用 Node.js 启动服务器**
   ```bash
   # 安装全局工具
   npm install -g http-server
   
   # 启动服务器
   http-server -p 8000
   ```

3. **访问页面**
   ```
   http://localhost:8000
   ```

### 方法三：使用 VS Code Live Server

1. 安装 VS Code 的 "Live Server" 扩展
2. 右键点击 `index.html`
3. 选择 "Open with Live Server"

## 📂 项目结构

```
fe-handwrite-exam/
├── index.html                 # 主演示页面
├── README.md                 # 项目说明
├── INTERVIEW-SUMMARY.md      # 面试题总结
├── vanilla-js/              # 基础手写题实现
│   ├── call.js              # call/apply/bind
│   ├── debounce.js          # 防抖函数
│   ├── throttle.js          # 节流函数
│   ├── deep-clone.js        # 深拷贝
│   ├── promise.js           # Promise实现
│   ├── new.js               # new操作符
│   ├── instanceof.js        # instanceof
│   ├── array-unique.js      # 数组去重
│   ├── array-flatten.js     # 数组扁平化
│   ├── curry.js             # 函数柯里化
│   ├── event-emitter.js     # 发布订阅
│   ├── lru-cache.js         # LRU缓存
│   ├── object-create.js     # Object.create
│   ├── type-check.js        # 类型检测
│   ├── json-parser.js       # JSON解析
│   └── observer-pattern.js  # 观察者模式
├── scenarios/               # 场景应用题实现
│   ├── image-lazy-load.js   # 图片懒加载
│   ├── virtual-scroll.js    # 虚拟滚动
│   ├── state-manager.js     # 状态管理器
│   ├── request-manager.js   # 请求管理
│   ├── drag-sort.js         # 拖拽排序
│   ├── form-validator.js    # 表单验证
│   ├── file-upload.js       # 文件上传
│   ├── infinite-scroll.js   # 无限滚动
│   ├── template-engine.js   # 模板引擎
│   ├── search-component.js  # 搜索组件
│   ├── code-editor.js       # 代码编辑器
│   ├── rich-text-editor.js  # 富文本编辑器
│   ├── image-cropper.js     # 图片裁剪
│   ├── data-visualization.js # 数据可视化
│   └── websocket-chat.js    # WebSocket聊天室
└── demos/                   # HTML演示页面
    ├── call-apply-bind.html
    ├── debounce-throttle.html
    ├── websocket-chat.html
    └── ... (更多演示页面)
```

## 🏆 题目列表

### 📚 基础手写题 (15道)

| 序号 | 题目 | 核心考点 | 演示页面 |
|-----|------|---------|----------|
| 1 | Call/Apply/Bind | this绑定、函数调用 | ✅ |
| 2 | 防抖和节流 | 性能优化、时间控制 | ✅ |
| 3 | 深拷贝实现 | 对象克隆、递归处理 | ✅ |
| 4 | Promise实现 | 异步编程、状态机 | ✅ |
| 5 | New操作符 | 原型链、对象创建 | ✅ |
| 6 | Instanceof | 原型链检测 | ✅ |
| 7 | 数组去重 | 数据处理、算法优化 | ✅ |
| 8 | 数组扁平化 | 递归、函数式编程 | ✅ |
| 9 | 函数柯里化 | 闭包、函数式编程 | ✅ |
| 10 | 发布订阅模式 | 设计模式、事件系统 | ✅ |
| 11 | LRU缓存 | 数据结构、缓存策略 | ✅ |
| 12 | Object.create | 原型继承 | ✅ |
| 13 | 类型检测 | 类型系统、工具函数 | ✅ |
| 14 | JSON解析 | 字符串处理、递归解析 | ✅ |
| 15 | 观察者模式 | 设计模式、响应式编程 | ✅ |

### 🎯 场景应用题 (15道)

| 序号 | 题目 | 应用场景 | 演示页面 |
|-----|------|----------|----------|
| 16 | 图片懒加载 | 性能优化、用户体验 | ✅ |
| 17 | 虚拟滚动 | 大数据渲染优化 | ✅ |
| 18 | 状态管理器 | 应用架构、数据流 | ✅ |
| 19 | 请求管理 | 网络优化、缓存策略 | ✅ |
| 20 | 拖拽排序 | 交互体验、事件处理 | ✅ |
| 21 | 表单验证器 | 数据校验、用户反馈 | ✅ |
| 22 | 文件上传 | 文件处理、进度控制 | ✅ |
| 23 | 无限滚动 | 分页加载、性能优化 | ✅ |
| 24 | 模板引擎 | 动态内容、安全处理 | ✅ |
| 25 | 搜索组件 | 实时搜索、结果优化 | ✅ |
| 26 | 代码编辑器 | 文本处理、语法高亮 | ✅ |
| 27 | 富文本编辑器 | 内容编辑、格式化 | ✅ |
| 28 | 图片裁剪器 | Canvas操作、图像处理 | ✅ |
| 29 | 数据可视化 | SVG绘图、图表展示 | ✅ |
| 30 | WebSocket聊天室 | 实时通信、状态管理 | ✅ |

## 🌟 特色功能

### 🎮 交互式演示
- **可视化效果**：每道题都有直观的演示界面
- **实时测试**：可以直接在浏览器中测试代码效果
- **性能对比**：展示优化前后的性能差异
- **边界案例**：包含各种边界情况的测试

### 📝 详细文档
- **实现原理**：详细解释每个函数的实现思路
- **面试考点**：标注面试中的常见问题
- **最佳实践**：提供生产环境的优化建议
- **扩展思考**：引导深入思考相关问题

### 🔧 代码质量
- **TypeScript 友好**：代码可轻松转换为 TypeScript
- **ESLint 规范**：遵循现代 JavaScript 最佳实践
- **模块化设计**：便于理解和维护
- **注释完整**：每个关键步骤都有详细注释

## 💡 使用建议

### 学习路径
1. **基础题目**：先掌握语言核心特性
2. **场景应用**：结合实际项目需求学习
3. **原理理解**：深入理解底层实现原理
4. **实践应用**：在项目中应用学到的知识

### 面试准备
1. **核心原理**：重点掌握 this绑定、原型链、异步编程
2. **性能优化**：熟悉防抖节流、虚拟滚动等优化技术
3. **架构设计**：理解状态管理、设计模式等架构思想
4. **实战经验**：能够结合具体业务场景说明应用

### 项目应用
1. **工具函数库**：可以直接在项目中使用这些工具函数
2. **组件封装**：参考场景题的实现方式封装业务组件
3. **性能优化**：应用学到的优化技术提升项目性能
4. **架构设计**：使用合适的设计模式和架构方案

## 🚀 技术栈

**核心技术**：
- JavaScript ES6+
- DOM 操作和事件处理
- Web APIs (Intersection Observer, File API, Canvas, SVG, WebSocket)
- 异步编程 (Promise, async/await)

**架构模式**：
- 观察者模式、发布订阅模式
- 状态管理和数据流
- 组件化和插件化架构
- 中间件和拦截器模式

**性能优化**：
- 防抖节流和事件优化
- 虚拟化和懒加载
- 缓存策略和内存管理
- 分片处理和并发控制

## 📄 开源协议

MIT License - 可自由使用、修改和分发

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📧 联系方式

如有问题或建议，欢迎交流讨论。

---

**祝你面试成功！加油！** 💪🎉