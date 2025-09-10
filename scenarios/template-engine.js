/**
 * 场景题9: 简单的模板引擎实现
 * 
 * 业务场景：
 * - 需要动态生成HTML内容而不依赖大型框架
 * - 邮件模板、报表模板的动态渲染
 * - 简单的前端模板系统
 * 
 * 考察点：
 * - 正则表达式和字符串处理
 * - 编译原理基础知识
 * - 递归和嵌套结构处理
 * - 安全性考虑（XSS防护）
 * - 性能优化（模板缓存）
 */

// 1. 基础模板引擎
class SimpleTemplateEngine {
  constructor(options = {}) {
    this.options = {
      openTag: '{{',           // 开始标签
      closeTag: '}}',          // 结束标签
      escapeHtml: true,        // 是否转义HTML
      cache: true,             // 是否缓存编译结果
      throwOnError: false,     // 是否抛出错误
      ...options
    };
    
    this.cache = new Map();      // 模板缓存
    this.helpers = new Map();    // 辅助函数
    this.filters = new Map();    // 过滤器
    
    this.setupBuiltinHelpers();
    this.setupBuiltinFilters();
  }
  
  // 设置内置辅助函数
  setupBuiltinHelpers() {
    this.helpers.set('if', (condition, truthy, falsy = '') => {
      return condition ? truthy : falsy;
    });
    
    this.helpers.set('unless', (condition, truthy, falsy = '') => {
      return !condition ? truthy : falsy;
    });
    
    this.helpers.set('each', (array, callback) => {
      if (!Array.isArray(array)) return '';
      return array.map((item, index) => callback(item, index)).join('');
    });
    
    this.helpers.set('with', (context, callback) => {
      return callback(context);
    });
  }
  
  // 设置内置过滤器
  setupBuiltinFilters() {
    this.filters.set('escape', (str) => this.escapeHtml(str));
    this.filters.set('unescape', (str) => str);
    this.filters.set('upper', (str) => String(str).toUpperCase());
    this.filters.set('lower', (str) => String(str).toLowerCase());
    this.filters.set('capitalize', (str) => {
      str = String(str);
      return str.charAt(0).toUpperCase() + str.slice(1);
    });
    this.filters.set('truncate', (str, length = 50) => {
      str = String(str);
      return str.length > length ? str.slice(0, length) + '...' : str;
    });
    this.filters.set('date', (date, format = 'YYYY-MM-DD') => {
      if (!date) return '';
      const d = new Date(date);
      return format
        .replace('YYYY', d.getFullYear())
        .replace('MM', String(d.getMonth() + 1).padStart(2, '0'))
        .replace('DD', String(d.getDate()).padStart(2, '0'))
        .replace('HH', String(d.getHours()).padStart(2, '0'))
        .replace('mm', String(d.getMinutes()).padStart(2, '0'))
        .replace('ss', String(d.getSeconds()).padStart(2, '0'));
    });
    this.filters.set('json', (obj) => JSON.stringify(obj));
    this.filters.set('default', (value, defaultValue) => value || defaultValue);
  }
  
  // 渲染模板
  render(template, data = {}) {
    try {
      const compiled = this.compile(template);
      return compiled(data);
    } catch (error) {
      if (this.options.throwOnError) {
        throw error;
      }
      console.error('Template render error:', error);
      return '';
    }
  }
  
  // 编译模板
  compile(template) {
    if (this.options.cache && this.cache.has(template)) {
      return this.cache.get(template);
    }
    
    try {
      const compiled = this.compileTemplate(template);
      
      if (this.options.cache) {
        this.cache.set(template, compiled);
      }
      
      return compiled;
    } catch (error) {
      throw new Error(`Template compilation error: ${error.message}`);
    }
  }
  
  // 实际编译逻辑
  compileTemplate(template) {
    const { openTag, closeTag } = this.options;
    const regex = new RegExp(`${this.escapeRegex(openTag)}([\\s\\S]*?)${this.escapeRegex(closeTag)}`, 'g');
    
    let code = 'let __output = "";\n';
    let lastIndex = 0;
    let match;
    
    while ((match = regex.exec(template)) !== null) {
      const beforeMatch = template.slice(lastIndex, match.index);
      if (beforeMatch) {
        code += `__output += ${JSON.stringify(beforeMatch)};\n`;
      }
      
      const expression = match[1].trim();
      code += this.compileExpression(expression);
      
      lastIndex = regex.lastIndex;
    }
    
    // 添加剩余内容
    const remaining = template.slice(lastIndex);
    if (remaining) {
      code += `__output += ${JSON.stringify(remaining)};\n`;
    }
    
    code += 'return __output;';
    
    // 创建函数
    return new Function('data', 'helpers', 'filters', 'escapeHtml', 
      'with(data) { ' + code + ' }'
    ).bind(this, undefined, this.helpers, this.filters, this.escapeHtml.bind(this));
  }
  
  // 编译表达式
  compileExpression(expression) {
    // 处理注释
    if (expression.startsWith('!')) {
      return ''; // 注释，不输出
    }
    
    // 处理原始输出（不转义）
    if (expression.startsWith('{') && expression.endsWith('}')) {
      const rawExpr = expression.slice(1, -1).trim();
      return `__output += String(${this.processExpression(rawExpr)}) || '';\n`;
    }
    
    // 处理条件语句
    if (expression.startsWith('#if ')) {
      const condition = expression.slice(4).trim();
      return `if (${this.processExpression(condition)}) {\n`;
    }
    
    if (expression === '/if') {
      return '}\n';
    }
    
    if (expression.startsWith('#unless ')) {
      const condition = expression.slice(8).trim();
      return `if (!(${this.processExpression(condition)})) {\n`;
    }
    
    if (expression === '/unless') {
      return '}\n';
    }
    
    // 处理循环
    if (expression.startsWith('#each ')) {
      const arrayExpr = expression.slice(6).trim();
      return `(${this.processExpression(arrayExpr)} || []).forEach((item, index) => {\n` +
             `  const __prevData = data;\n` +
             `  data = { ...data, this: item, '@index': index, '@first': index === 0, '@last': index === (${this.processExpression(arrayExpr)} || []).length - 1 };\n`;
    }
    
    if (expression === '/each') {
      return `  data = __prevData;\n});\n`;
    }
    
    // 处理 with 语句
    if (expression.startsWith('#with ')) {
      const contextExpr = expression.slice(6).trim();
      return `(() => {\n` +
             `  const __prevData = data;\n` +
             `  data = { ...data, ...(${this.processExpression(contextExpr)}) };\n`;
    }
    
    if (expression === '/with') {
      return `  data = __prevData;\n})();\n`;
    }
    
    // 处理 else
    if (expression === 'else') {
      return '} else {\n';
    }
    
    // 普通表达式输出
    const processedExpr = this.processExpression(expression);
    const outputExpr = this.options.escapeHtml 
      ? `escapeHtml(String(${processedExpr}) || '')` 
      : `String(${processedExpr}) || ''`;
    
    return `__output += ${outputExpr};\n`;
  }
  
  // 处理表达式（支持过滤器和辅助函数）
  processExpression(expression) {
    // 处理过滤器 value | filter:arg1:arg2
    if (expression.includes('|')) {
      const parts = expression.split('|');
      let result = parts[0].trim();
      
      for (let i = 1; i < parts.length; i++) {
        const filterPart = parts[i].trim();
        const [filterName, ...args] = filterPart.split(':');
        
        const argsList = args.length > 0 
          ? ', ' + args.map(arg => arg.trim()).join(', ')
          : '';
        
        result = `(filters.get('${filterName}') || ((x) => x))(${result}${argsList})`;
      }
      
      return result;
    }
    
    // 处理辅助函数调用 helper(arg1, arg2)
    const helperMatch = expression.match(/^(\w+)\s*\((.*)\)$/);
    if (helperMatch) {
      const [, helperName, argsStr] = helperMatch;
      if (this.helpers.has(helperName)) {
        return `(helpers.get('${helperName}'))(${argsStr})`;
      }
    }
    
    return expression;
  }
  
  // 转义正则特殊字符
  escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
  
  // HTML转义
  escapeHtml(str) {
    if (typeof str !== 'string') return str;
    
    const htmlEscapeMap = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '/': '&#x2F;'
    };
    
    return str.replace(/[&<>"'\/]/g, (char) => htmlEscapeMap[char]);
  }
  
  // 添加辅助函数
  addHelper(name, fn) {
    this.helpers.set(name, fn);
    return this;
  }
  
  // 添加过滤器
  addFilter(name, fn) {
    this.filters.set(name, fn);
    return this;
  }
  
  // 清空缓存
  clearCache() {
    this.cache.clear();
  }
}

// 2. 增强版模板引擎 - 支持模板继承
class AdvancedTemplateEngine extends SimpleTemplateEngine {
  constructor(options = {}) {
    super(options);
    this.layouts = new Map();       // 布局模板
    this.partials = new Map();      // 部分模板
    this.blocks = new Map();        // 块定义
  }
  
  // 注册布局模板
  registerLayout(name, template) {
    this.layouts.set(name, template);
    return this;
  }
  
  // 注册部分模板
  registerPartial(name, template) {
    this.partials.set(name, template);
    return this;
  }
  
  // 渲染带布局的模板
  renderWithLayout(template, data = {}, layoutName = null) {
    // 解析模板中的布局声明
    const layoutMatch = template.match(/^{{\s*extends\s+['"]([^'"]+)['"]\s*}}/);
    if (layoutMatch) {
      layoutName = layoutMatch[1];
      template = template.replace(layoutMatch[0], '');
    }
    
    if (layoutName && this.layouts.has(layoutName)) {
      // 解析块内容
      const blocks = this.parseBlocks(template);
      
      // 渲染布局
      const layout = this.layouts.get(layoutName);
      return this.renderLayoutWithBlocks(layout, data, blocks);
    }
    
    return this.render(template, data);
  }
  
  // 解析块内容
  parseBlocks(template) {
    const blocks = new Map();
    const blockRegex = /{{\s*block\s+(\w+)\s*}}([\s\S]*?){{\s*\/block\s*}}/g;
    
    let match;
    while ((match = blockRegex.exec(template)) !== null) {
      const [, blockName, blockContent] = match;
      blocks.set(blockName, blockContent.trim());
    }
    
    return blocks;
  }
  
  // 渲染带块的布局
  renderLayoutWithBlocks(layout, data, blocks) {
    // 替换布局中的块
    const processedLayout = layout.replace(
      /{{\s*yield\s+(\w+)\s*}}/g,
      (match, blockName) => {
        return blocks.get(blockName) || '';
      }
    );
    
    return this.render(processedLayout, data);
  }
  
  // 重写表达式编译以支持 partial 和 include
  compileExpression(expression) {
    // 处理 partial 包含
    const partialMatch = expression.match(/^partial\s+['"]([^'"]+)['"](?:\s+with\s+(.+))?$/);
    if (partialMatch) {
      const [, partialName, contextExpr] = partialMatch;
      if (this.partials.has(partialName)) {
        const partialTemplate = this.partials.get(partialName);
        const compiled = this.compile(partialTemplate);
        
        if (contextExpr) {
          return `__output += (${compiled})(${this.processExpression(contextExpr)});\n`;
        } else {
          return `__output += (${compiled})(data);\n`;
        }
      }
      return '';
    }
    
    // 处理 include
    const includeMatch = expression.match(/^include\s+['"]([^'"]+)['"]$/);
    if (includeMatch) {
      const [, partialName] = includeMatch;
      if (this.partials.has(partialName)) {
        return `__output += ${JSON.stringify(this.partials.get(partialName))};\n`;
      }
      return '';
    }
    
    return super.compileExpression(expression);
  }
}

// 3. 实际应用示例
class TemplateEngineDemo {
  constructor() {
    this.setupUI();
    this.initTemplateEngine();
    this.setupExamples();
  }
  
  setupUI() {
    document.body.innerHTML = `
      <div style="max-width: 1200px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
        <h1>模板引擎演示</h1>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
          <div>
            <h3>模板代码</h3>
            <textarea id="template-input" style="
              width: 100%;
              height: 300px;
              padding: 12px;
              border: 1px solid #ddd;
              border-radius: 4px;
              font-family: 'Courier New', monospace;
              font-size: 14px;
              resize: vertical;
            " placeholder="在这里输入模板代码..."></textarea>
          </div>
          
          <div>
            <h3>数据 (JSON)</h3>
            <textarea id="data-input" style="
              width: 100%;
              height: 300px;
              padding: 12px;
              border: 1px solid #ddd;
              border-radius: 4px;
              font-family: 'Courier New', monospace;
              font-size: 14px;
              resize: vertical;
            " placeholder="在这里输入JSON数据..."></textarea>
          </div>
        </div>
        
        <div style="margin-bottom: 20px;">
          <button id="render-btn" class="btn btn-primary">渲染模板</button>
          <button id="clear-btn" class="btn btn-secondary">清空</button>
          
          <label style="margin-left: 20px;">
            <input type="checkbox" id="escape-html" checked>
            HTML转义
          </label>
          
          <label style="margin-left: 10px;">
            <input type="checkbox" id="enable-cache" checked>
            启用缓存
          </label>
        </div>
        
        <div style="margin-bottom: 20px;">
          <h3>示例模板</h3>
          <div style="display: flex; gap: 8px; flex-wrap: wrap;">
            <button class="btn btn-outline example-btn" data-example="basic">基础语法</button>
            <button class="btn btn-outline example-btn" data-example="conditions">条件判断</button>
            <button class="btn btn-outline example-btn" data-example="loops">循环遍历</button>
            <button class="btn btn-outline example-btn" data-example="filters">过滤器</button>
            <button class="btn btn-outline example-btn" data-example="helpers">辅助函数</button>
            <button class="btn btn-outline example-btn" data-example="card">用户卡片</button>
            <button class="btn btn-outline example-btn" data-example="table">数据表格</button>
          </div>
        </div>
        
        <div>
          <h3>渲染结果</h3>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
            <div>
              <h4>HTML预览</h4>
              <div id="preview-html" style="
                min-height: 200px;
                padding: 16px;
                border: 1px solid #ddd;
                border-radius: 4px;
                background: white;
                overflow: auto;
              "></div>
            </div>
            
            <div>
              <h4>源代码</h4>
              <pre id="preview-source" style="
                min-height: 200px;
                padding: 16px;
                border: 1px solid #ddd;
                border-radius: 4px;
                background: #f8f9fa;
                overflow: auto;
                font-family: 'Courier New', monospace;
                font-size: 12px;
                white-space: pre-wrap;
                margin: 0;
              "></pre>
            </div>
          </div>
        </div>
        
        <div style="margin-top: 20px;">
          <h3>模板语法说明</h3>
          <div style="background: #f8f9fa; padding: 16px; border-radius: 4px; font-size: 14px;">
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 16px;">
              <div>
                <strong>基础语法:</strong>
                <ul style="margin: 8px 0; padding-left: 20px;">
                  <li><code>{{variable}}</code> - 变量输出</li>
                  <li><code>{{{raw}}}</code> - 原始输出（不转义）</li>
                  <li><code>{{! 注释 }}</code> - 注释</li>
                </ul>
              </div>
              
              <div>
                <strong>条件语句:</strong>
                <ul style="margin: 8px 0; padding-left: 20px;">
                  <li><code>{{#if condition}}</code></li>
                  <li><code>{{else}}</code></li>
                  <li><code>{{/if}}</code></li>
                  <li><code>{{#unless condition}}</code></li>
                </ul>
              </div>
              
              <div>
                <strong>循环语句:</strong>
                <ul style="margin: 8px 0; padding-left: 20px;">
                  <li><code>{{#each array}}</code></li>
                  <li><code>{{this}}</code> - 当前项</li>
                  <li><code>{{@index}}</code> - 索引</li>
                  <li><code>{{/each}}</code></li>
                </ul>
              </div>
              
              <div>
                <strong>过滤器:</strong>
                <ul style="margin: 8px 0; padding-left: 20px;">
                  <li><code>{{value | upper}}</code></li>
                  <li><code>{{date | date:'YYYY-MM-DD'}}</code></li>
                  <li><code>{{text | truncate:50}}</code></li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <style>
        .btn {
          padding: 8px 16px;
          border: 1px solid #ddd;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          transition: all 0.2s ease;
          background: white;
        }
        
        .btn:hover {
          background: #f8f9fa;
        }
        
        .btn-primary {
          background: #007bff;
          color: white;
          border-color: #007bff;
        }
        
        .btn-primary:hover {
          background: #0056b3;
        }
        
        .btn-secondary {
          background: #6c757d;
          color: white;
          border-color: #6c757d;
        }
        
        .btn-outline {
          background: white;
          color: #007bff;
          border-color: #007bff;
        }
        
        .btn-outline:hover {
          background: #007bff;
          color: white;
        }
        
        code {
          background: #e9ecef;
          padding: 2px 4px;
          border-radius: 2px;
          font-family: 'Courier New', monospace;
          font-size: 12px;
        }
      </style>
    `;
  }
  
  initTemplateEngine() {
    this.engine = new AdvancedTemplateEngine({
      escapeHtml: true,
      cache: true
    });
    
    // 添加自定义过滤器
    this.engine.addFilter('reverse', (str) => String(str).split('').reverse().join(''));
    this.engine.addFilter('repeat', (str, times) => String(str).repeat(times || 1));
    this.engine.addFilter('currency', (amount) => {
      return new Intl.NumberFormat('zh-CN', {
        style: 'currency',
        currency: 'CNY'
      }).format(amount || 0);
    });
    
    // 添加自定义辅助函数
    this.engine.addHelper('math', (a, operator, b) => {
      switch (operator) {
        case '+': return a + b;
        case '-': return a - b;
        case '*': return a * b;
        case '/': return a / b;
        case '%': return a % b;
        default: return a;
      }
    });
    
    this.bindEvents();
  }
  
  setupExamples() {
    this.examples = {
      basic: {
        template: `<h1>{{title}}</h1>
<p>欢迎, {{user.name}}!</p>
<p>今天是 {{today | date:'YYYY年MM月DD日'}}</p>
<p>你的邮箱: {{user.email}}</p>`,
        data: {
          title: '欢迎页面',
          user: {
            name: '张三',
            email: 'zhangsan@example.com'
          },
          today: new Date()
        }
      },
      
      conditions: {
        template: `<div class="user-status">
  {{#if user.isVip}}
    <span class="vip-badge">VIP用户</span>
  {{else}}
    <span class="normal-badge">普通用户</span>
  {{/if}}
  
  {{#unless user.isActive}}
    <span class="inactive">账户已停用</span>
  {{/unless}}
</div>`,
        data: {
          user: {
            isVip: true,
            isActive: true
          }
        }
      },
      
      loops: {
        template: `<ul class="todo-list">
  {{#each todos}}
    <li class="todo-item {{#if this.completed}}completed{{/if}}">
      <span class="index">[{{@index}}]</span>
      <span class="title">{{this.title}}</span>
      <span class="status">{{#if this.completed}}✓{{else}}○{{/if}}</span>
    </li>
  {{/each}}
</ul>`,
        data: {
          todos: [
            { title: '学习模板引擎', completed: true },
            { title: '完成项目文档', completed: false },
            { title: '代码审查', completed: false }
          ]
        }
      },
      
      filters: {
        template: `<div class="filters-demo">
  <p>原文: {{text}}</p>
  <p>大写: {{text | upper}}</p>
  <p>首字母大写: {{text | capitalize}}</p>
  <p>截断: {{text | truncate:10}}</p>
  <p>价格: {{price | currency}}</p>
  <p>默认值: {{empty | default:'暂无数据'}}</p>
</div>`,
        data: {
          text: 'hello world',
          price: 299.99,
          empty: null
        }
      },
      
      helpers: {
        template: `<div class="helpers-demo">
  <p>计算: 5 + 3 = {{math(5, '+', 3)}}</p>
  <p>计算: 10 * 2 = {{math(10, '*', 2)}}</p>
  
  {{#each numbers}}
    <p>{{this}} 的平方是 {{math(this, '*', this)}}</p>
  {{/each}}
</div>`,
        data: {
          numbers: [1, 2, 3, 4, 5]
        }
      },
      
      card: {
        template: `<div class="user-card">
  <div class="avatar">
    <img src="{{user.avatar || 'default-avatar.png'}}" alt="{{user.name}}">
  </div>
  <div class="info">
    <h3>{{user.name}}</h3>
    <p>{{user.title}}</p>
    <p>{{user.email}}</p>
    
    {{#if user.skills}}
      <div class="skills">
        {{#each user.skills}}
          <span class="skill-tag">{{this}}</span>
        {{/each}}
      </div>
    {{/if}}
    
    <div class="stats">
      <span>项目: {{user.projects || 0}}</span>
      <span>经验: {{user.experience || 0}} 年</span>
    </div>
  </div>
</div>`,
        data: {
          user: {
            name: '李开发',
            title: '前端工程师',
            email: 'li.dev@company.com',
            avatar: null,
            skills: ['JavaScript', 'React', 'Vue', 'Node.js'],
            projects: 12,
            experience: 3
          }
        }
      },
      
      table: {
        template: `<table class="data-table">
  <thead>
    <tr>
      <th>#</th>
      <th>姓名</th>
      <th>部门</th>
      <th>薪资</th>
      <th>状态</th>
    </tr>
  </thead>
  <tbody>
    {{#each employees}}
      <tr class="{{#unless this.active}}inactive{{/unless}}">
        <td>{{@index | math('+', 1)}}</td>
        <td>{{this.name}}</td>
        <td>{{this.department}}</td>
        <td>{{this.salary | currency}}</td>
        <td>
          {{#if this.active}}
            <span class="status-active">在职</span>
          {{else}}
            <span class="status-inactive">离职</span>
          {{/if}}
        </td>
      </tr>
    {{/each}}
  </tbody>
</table>`,
        data: {
          employees: [
            { name: '张三', department: '技术部', salary: 15000, active: true },
            { name: '李四', department: '产品部', salary: 12000, active: true },
            { name: '王五', department: '设计部', salary: 10000, active: false },
            { name: '赵六', department: '技术部', salary: 18000, active: true }
          ]
        }
      }
    };
  }
  
  bindEvents() {
    // 渲染按钮
    document.getElementById('render-btn').addEventListener('click', () => {
      this.renderTemplate();
    });
    
    // 清空按钮
    document.getElementById('clear-btn').addEventListener('click', () => {
      document.getElementById('template-input').value = '';
      document.getElementById('data-input').value = '';
      document.getElementById('preview-html').innerHTML = '';
      document.getElementById('preview-source').textContent = '';
    });
    
    // 配置选项
    document.getElementById('escape-html').addEventListener('change', (e) => {
      this.engine.options.escapeHtml = e.target.checked;
    });
    
    document.getElementById('enable-cache').addEventListener('change', (e) => {
      this.engine.options.cache = e.target.checked;
      if (!e.target.checked) {
        this.engine.clearCache();
      }
    });
    
    // 示例按钮
    document.querySelectorAll('.example-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const exampleName = btn.dataset.example;
        this.loadExample(exampleName);
      });
    });
  }
  
  loadExample(exampleName) {
    const example = this.examples[exampleName];
    if (example) {
      document.getElementById('template-input').value = example.template;
      document.getElementById('data-input').value = JSON.stringify(example.data, null, 2);
      this.renderTemplate();
    }
  }
  
  renderTemplate() {
    const template = document.getElementById('template-input').value;
    const dataInput = document.getElementById('data-input').value;
    
    if (!template.trim()) {
      alert('请输入模板代码');
      return;
    }
    
    try {
      let data = {};
      if (dataInput.trim()) {
        data = JSON.parse(dataInput);
      }
      
      const startTime = performance.now();
      const result = this.engine.render(template, data);
      const endTime = performance.now();
      
      // 显示结果
      document.getElementById('preview-html').innerHTML = result;
      document.getElementById('preview-source').textContent = result;
      
      console.log(`模板渲染耗时: ${(endTime - startTime).toFixed(2)}ms`);
      
    } catch (error) {
      alert(`渲染错误: ${error.message}`);
      console.error('Template render error:', error);
    }
  }
}

// 运行演示
console.log('=== 模板引擎测试 ===\n');

const demo = new TemplateEngineDemo();

console.log('模板引擎功能特点：');
console.log('✓ 基础变量插值和HTML转义');
console.log('✓ 条件判断和循环遍历');
console.log('✓ 过滤器和辅助函数');
console.log('✓ 模板缓存和性能优化');
console.log('✓ 安全性防护（XSS）');
console.log('✓ 错误处理和调试支持');
console.log('✓ 可扩展的插件系统');
console.log('✓ 模板继承和包含');

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    SimpleTemplateEngine,
    AdvancedTemplateEngine
  };
}
