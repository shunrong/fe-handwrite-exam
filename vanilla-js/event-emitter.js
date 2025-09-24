/**
 * 手写发布订阅模式 (EventEmitter) - 现代优化版
 * 
 * 核心原理：事件总线（EventBus）模式
 * - 订阅：on/once - 向事件回调数组添加函数
 * - 发布：emit - 遍历执行事件回调数组
 * - 取消：off - 从事件回调数组移除函数（引用比较）
 * 
 * 关键技术点：
 * 1. 使用 Map 替代 Object - 更优雅的哈希表
 * 2. 引用比较 - 确保 off 时能正确移除
 * 3. 链式调用 - 提升 API 易用性
 * 4. 内存管理 - 自动清理空事件
 * 5. once 包装器 - 执行后自我销毁
 */

// 1. 现代版本 EventEmitter - 基于复习优化
class EventEmitter {
  constructor() {
    // 使用 Map 替代 Object：支持任意类型 key，迭代友好
    this.events = new Map();
  }

  // 订阅事件
  on(eventName, callback) {
    if (typeof callback !== 'function') {
      throw new TypeError('Callback must be a function');
    }

    // 懒初始化：事件不存在时创建数组
    if (!this.events.has(eventName)) {
      this.events.set(eventName, []);
    }

    // 关键：直接 push，利用数组引用可变性
    this.events.get(eventName).push(callback);
    
    // 检查监听器数量，防止内存泄漏
    this._checkMaxListeners(eventName);
    
    return this; // 支持链式调用
  }

  // 发布事件
  emit(eventName, ...args) {
    const callbacks = this.events.get(eventName);
    
    // 快速检查：没有监听器直接返回
    if (!callbacks || callbacks.length === 0) {
      return false;
    }

    // 执行所有回调函数，支持多参数传递
    callbacks.forEach(callback => {
      try {
        callback(...args); // 透传所有参数
      } catch (error) {
        console.error(`Error in ${eventName} listener:`, error);
      }
    });

    return true; // 返回执行结果，不支持链式（语义不同）
  }

  // 取消订阅
  off(eventName, callback) {
    if (!this.events.has(eventName)) {
      return this; // 事件不存在也返回 this
    }

    if (!callback) {
      // 模式1：移除事件的所有监听器
      this.events.delete(eventName);
    } else {
      // 模式2：移除指定监听器（关键：引用比较）
      const callbacks = this.events.get(eventName);
      const index = callbacks.indexOf(callback); // 使用 === 比较引用
      
      if (index > -1) {
        callbacks.splice(index, 1);
        
        // 内存管理：如果回调数组为空，删除整个事件
        if (callbacks.length === 0) {
          this.events.delete(eventName);
        }
      }
    }

    return this; // 支持链式调用
  }

  // 一次性订阅
  once(eventName, callback) {
    if (typeof callback !== 'function') {
      throw new TypeError('Callback must be a function');
    }

    // 包装器模式：执行后自我销毁
    const wrapper = (...args) => {
      callback(...args);           // 先执行原回调
      this.off(eventName, wrapper); // 再移除包装器（关键：引用相同）
    };

    this.on(eventName, wrapper);
    return this; // 支持链式调用
  }

  // 获取事件的监听器数量
  listenerCount(eventName) {
    const callbacks = this.events.get(eventName);
    return callbacks ? callbacks.length : 0;
  }

  // 获取所有事件名
  eventNames() {
    return Array.from(this.events.keys());
  }

  // 清空所有事件
  removeAllListeners(eventName) {
    if (eventName) {
      this.events.delete(eventName);
    } else {
      this.events.clear();
    }
    return this;
  }

  // 设置最大监听器数量（防止内存泄漏）
  setMaxListeners(n) {
    this.maxListeners = n;
    return this;
  }

  // 在 on 方法中添加监听器数量检查
  _checkMaxListeners(eventName) {
    if (this.maxListeners && this.listenerCount(eventName) >= this.maxListeners) {
      console.warn(`MaxListenersExceededWarning: Possible EventEmitter memory leak detected. ${this.listenerCount(eventName)} ${eventName} listeners added.`);
    }
  }
}

// ===== 现代化使用示例 =====

// 全局事件总线
const eventBus = new EventEmitter();

// React 组件通信示例
class ComponentCommunication {
  static setupExample() {
    console.log('=== React 组件通信示例 ===');
    
    // 组件A：数据提供者
    const ComponentA = {
      updateUserData(userData) {
        console.log('ComponentA: 用户数据更新');
        eventBus.emit('userDataChanged', userData);
      }
    };
    
    // 组件B：数据消费者
    const ComponentB = {
      init() {
        // 正确：保持函数引用稳定，便于后续移除
        this.handleUserChange = (userData) => {
          console.log('ComponentB: 收到用户数据', userData);
        };
        
        eventBus.on('userDataChanged', this.handleUserChange);
      },
      
      destroy() {
        // 关键：使用相同的引用才能正确移除
        eventBus.off('userDataChanged', this.handleUserChange);
      }
    };
    
    // 组件C：一次性监听
    const ComponentC = {
      init() {
        eventBus.once('userDataChanged', (userData) => {
          console.log('ComponentC: 只监听一次', userData);
        });
      }
    };
    
    // 模拟组件生命周期
    ComponentB.init();
    ComponentC.init();
    
    // 触发数据更新
    ComponentA.updateUserData({ name: 'Tom', age: 25 });
    ComponentA.updateUserData({ name: 'Jerry', age: 23 }); // C不会收到
    
    // 组件销毁
    ComponentB.destroy();
  }
}

// 链式调用示例
class ChainExample {
  static setupExample() {
    console.log('\n=== 链式调用示例 ===');
    
    const emitter = new EventEmitter()
      .on('login', (user) => console.log('用户登录:', user.name))
      .on('logout', () => console.log('用户登出'))
      .once('init', () => console.log('应用初始化'))
      .setMaxListeners(5);
    
    // 发布事件
    emitter.emit('init');
    emitter.emit('login', { name: 'Alice' });
    emitter.emit('logout');
    emitter.emit('init'); // once 只执行一次，不会输出
  }
}

// 内存管理示例
class MemoryManagementExample {
  static setupExample() {
    console.log('\n=== 内存管理示例 ===');
    
    const emitter = new EventEmitter();
    
    // 添加多个监听器
    const handler1 = () => console.log('handler1');
    const handler2 = () => console.log('handler2');
    const handler3 = () => console.log('handler3');
    
    emitter.on('test', handler1);
    emitter.on('test', handler2);
    emitter.on('test', handler3);
    
    console.log('监听器数量:', emitter.listenerCount('test')); // 3
    console.log('所有事件:', emitter.eventNames()); // ['test']
    
    // 移除指定监听器
    emitter.off('test', handler2);
    console.log('移除后数量:', emitter.listenerCount('test')); // 2
    
    // 移除所有监听器
    emitter.off('test');
    console.log('清空后数量:', emitter.listenerCount('test')); // 0
  }
}

// 执行示例
ComponentCommunication.setupExample();
ChainExample.setupExample();
MemoryManagementExample.setupExample();

// 2. 增强版本 - 支持更多特性
class AdvancedEventEmitter extends EventEmitter {
  constructor(options = {}) {
    super();
    this.maxListeners = options.maxListeners || 10;
    this.wildcardEvents = {}; // 支持通配符事件
  }

  // 重写 on 方法，添加最大监听器限制
  on(eventName, listener) {
    if (typeof listener !== 'function') {
      throw new TypeError('listener must be a function');
    }

    // 检查最大监听器数量
    if (this.listenerCount(eventName) >= this.maxListeners) {
      console.warn(`MaxListenersExceededWarning: ${eventName} has ${this.listenerCount(eventName)} listeners`);
    }

    return super.on(eventName, listener);
  }

  // 支持通配符监听
  onWildcard(pattern, listener) {
    if (!this.wildcardEvents[pattern]) {
      this.wildcardEvents[pattern] = [];
    }
    this.wildcardEvents[pattern].push(listener);
    return this;
  }

  // 重写 emit，支持通配符
  emit(eventName, ...args) {
    // 先触发普通事件
    const normalResult = super.emit(eventName, args);

    // 再触发通配符事件
    let wildcardResult = false;
    Object.keys(this.wildcardEvents).forEach(pattern => {
      if (this.matchPattern(eventName, pattern)) {
        this.wildcardEvents[pattern].forEach(listener => {
          listener.apply(this, args);
          wildcardResult = true;
        });
      }
    });

    return normalResult || wildcardResult;
  }

  // 简单的通配符匹配
  matchPattern(eventName, pattern) {
    if (pattern === '*') return true;
    if (pattern.endsWith('*')) {
      return eventName.startsWith(pattern.slice(0, -1));
    }
    return eventName === pattern;
  }

  // 设置最大监听器数量
  setMaxListeners(max) {
    this.maxListeners = max;
    return this;
  }

  // 预添加监听器（在现有监听器之前执行）
  prependListener(eventName, listener) {
    if (!this.events[eventName]) {
      this.events[eventName] = [];
    }
    this.events[eventName].unshift(listener);
    return this;
  }

  // 异步事件发射
  async emitAsync(eventName, ...args) {
    const listeners = this.events[eventName];
    
    if (!listeners || listeners.length === 0) {
      return false;
    }

    // 并行执行所有监听器
    await Promise.all(
      listeners.map(listener => 
        Promise.resolve(listener.apply(this, args))
      )
    );

    return true;
  }
}

// 3. 支持命名空间的版本
class NamespacedEventEmitter extends AdvancedEventEmitter {
  constructor() {
    super();
    this.namespaces = new Map();
  }

  // 创建命名空间
  namespace(name) {
    if (!this.namespaces.has(name)) {
      this.namespaces.set(name, new AdvancedEventEmitter());
    }
    return this.namespaces.get(name);
  }

  // 跨命名空间广播
  broadcast(eventName, ...args) {
    // 在主空间发射
    this.emit(eventName, ...args);
    
    // 在所有命名空间发射
    this.namespaces.forEach(emitter => {
      emitter.emit(eventName, ...args);
    });
  }
}

// 4. 单例模式的全局事件总线
class GlobalEventBus extends AdvancedEventEmitter {
  constructor() {
    if (GlobalEventBus.instance) {
      return GlobalEventBus.instance;
    }
    super();
    GlobalEventBus.instance = this;
  }

  static getInstance() {
    if (!GlobalEventBus.instance) {
      GlobalEventBus.instance = new GlobalEventBus();
    }
    return GlobalEventBus.instance;
  }
}

// 测试用例
console.log('=== EventEmitter 测试 ===\n');

// 1. 基础功能测试
console.log('1. 基础功能测试：');
const emitter = new EventEmitter();

const listener1 = (data) => console.log('Listener 1:', data);
const listener2 = (data) => console.log('Listener 2:', data);

emitter.on('test', listener1);
emitter.on('test', listener2);

emitter.emit('test', 'Hello World!');

// 测试 once
emitter.once('onceEvent', (data) => console.log('Once listener:', data));
emitter.emit('onceEvent', 'First call');
emitter.emit('onceEvent', 'Second call'); // 不会触发

// 2. 链式调用测试
console.log('\n2. 链式调用测试：');
emitter
  .on('chain1', () => console.log('Chain 1'))
  .on('chain2', () => console.log('Chain 2'))
  .emit('chain1')
  .emit('chain2');

// 3. 增强版本测试
console.log('\n3. 增强版本测试：');
const advancedEmitter = new AdvancedEventEmitter();

// 通配符测试
advancedEmitter.onWildcard('user.*', (action) => {
  console.log('User action:', action);
});

advancedEmitter.emit('user.login', 'login');
advancedEmitter.emit('user.logout', 'logout');

// 异步事件测试
console.log('\n4. 异步事件测试：');
advancedEmitter.on('asyncEvent', async (data) => {
  await new Promise(resolve => setTimeout(resolve, 100));
  console.log('Async listener 1:', data);
});

advancedEmitter.on('asyncEvent', async (data) => {
  await new Promise(resolve => setTimeout(resolve, 50));
  console.log('Async listener 2:', data);
});

advancedEmitter.emitAsync('asyncEvent', 'async data').then(() => {
  console.log('All async listeners completed');
});

// 5. 实际应用场景
console.log('\n5. 实际应用场景：');

// 场景1：模拟用户行为跟踪
class UserTracker extends EventEmitter {
  constructor() {
    super();
    this.setupListeners();
  }

  setupListeners() {
    this.on('user:login', (user) => {
      console.log(`🔐 用户登录: ${user.name}`);
    });

    this.on('user:logout', (user) => {
      console.log(`👋 用户登出: ${user.name}`);
    });

    this.on('user:purchase', (data) => {
      console.log(`💰 用户购买: ${data.user.name} 购买了 ${data.product}`);
    });
  }

  login(user) {
    this.emit('user:login', user);
  }

  logout(user) {
    this.emit('user:logout', user);
  }

  purchase(user, product) {
    this.emit('user:purchase', { user, product });
  }
}

const tracker = new UserTracker();
tracker.login({ name: '张三' });
tracker.purchase({ name: '张三' }, 'iPhone');
tracker.logout({ name: '张三' });

// 场景2：状态管理
console.log('\n状态管理示例：');
class StateManager extends EventEmitter {
  constructor() {
    super();
    this.state = {};
  }

  setState(key, value) {
    const oldValue = this.state[key];
    this.state[key] = value;
    
    this.emit('stateChange', { key, oldValue, newValue: value });
    this.emit(`stateChange:${key}`, { oldValue, newValue: value });
  }

  getState(key) {
    return this.state[key];
  }
}

const stateManager = new StateManager();

stateManager.on('stateChange', ({ key, oldValue, newValue }) => {
  console.log(`状态变化: ${key} 从 ${oldValue} 变为 ${newValue}`);
});

stateManager.on('stateChange:username', ({ newValue }) => {
  console.log(`用户名更新为: ${newValue}`);
});

stateManager.setState('username', 'john_doe');
stateManager.setState('theme', 'dark');

// 6. 内存泄漏防护
console.log('\n6. 内存泄漏防护：');
class SafeEventEmitter extends EventEmitter {
  constructor() {
    super();
    this.listenerRefs = new WeakMap(); // 用于跟踪监听器
  }

  on(eventName, listener) {
    super.on(eventName, listener);
    
    // 记录监听器，便于清理
    if (!this.listenerRefs.has(listener)) {
      this.listenerRefs.set(listener, { events: [] });
    }
    this.listenerRefs.get(listener).events.push(eventName);
    
    return this;
  }

  // 自动清理功能
  cleanup() {
    Object.keys(this.events).forEach(eventName => {
      delete this.events[eventName];
    });
    console.log('EventEmitter cleaned up');
  }
}

// 性能测试
console.log('\n=== 性能测试 ===');
function performanceTest() {
  const emitter = new EventEmitter();
  const iterations = 10000;

  // 添加监听器
  console.time('添加监听器');
  for (let i = 0; i < iterations; i++) {
    emitter.on('test', () => {});
  }
  console.timeEnd('添加监听器');

  // 触发事件
  console.time('触发事件');
  for (let i = 0; i < 1000; i++) {
    emitter.emit('test', 'data');
  }
  console.timeEnd('触发事件');

  console.log(`监听器数量: ${emitter.listenerCount('test')}`);
}

performanceTest();

// 总结
console.log('\n=== EventEmitter 总结 ===');
console.log('核心方法：');
console.log('• on(event, listener) - 订阅事件');
console.log('• emit(event, ...args) - 发布事件');
console.log('• off(event, listener) - 取消订阅');
console.log('• once(event, listener) - 一次性订阅');
console.log('\n应用场景：');
console.log('• 组件间通信');
console.log('• 状态管理');
console.log('• 模块解耦');
console.log('• 事件驱动架构');
console.log('\n注意事项：');
console.log('• 防止内存泄漏');
console.log('• 异常处理');
console.log('• 性能优化');
console.log('• 监听器数量限制');
