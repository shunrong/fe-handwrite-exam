/**
 * 手写发布订阅模式 (EventEmitter) - 前端面试必考
 * 
 * 发布订阅模式：定义对象间一对多的依赖关系，当一个对象状态改变时，
 * 所有依赖它的对象都会收到通知并自动更新
 */

// 1. 基础版本 EventEmitter
class EventEmitter {
  constructor() {
    // 存储事件和对应的监听器
    this.events = {};
  }

  // 订阅事件
  on(eventName, listener) {
    if (typeof listener !== 'function') {
      throw new TypeError('listener must be a function');
    }

    if (!this.events[eventName]) {
      this.events[eventName] = [];
    }

    this.events[eventName].push(listener);
    return this; // 支持链式调用
  }

  // 发布事件
  emit(eventName, ...args) {
    const listeners = this.events[eventName];
    
    if (!listeners || listeners.length === 0) {
      return false;
    }

    // 执行所有监听器
    listeners.forEach(listener => {
      try {
        listener.apply(this, args);
      } catch (error) {
        console.error('Error in event listener:', error);
      }
    });

    return true;
  }

  // 取消订阅
  off(eventName, listener) {
    if (!this.events[eventName]) {
      return this;
    }

    if (!listener) {
      // 如果没有指定监听器，删除所有
      delete this.events[eventName];
    } else {
      // 删除指定监听器
      this.events[eventName] = this.events[eventName].filter(l => l !== listener);
      
      // 如果没有监听器了，删除事件
      if (this.events[eventName].length === 0) {
        delete this.events[eventName];
      }
    }

    return this;
  }

  // 只订阅一次
  once(eventName, listener) {
    if (typeof listener !== 'function') {
      throw new TypeError('listener must be a function');
    }

    const onceWrapper = (...args) => {
      listener.apply(this, args);
      this.off(eventName, onceWrapper);
    };

    this.on(eventName, onceWrapper);
    return this;
  }

  // 获取事件的监听器数量
  listenerCount(eventName) {
    return this.events[eventName] ? this.events[eventName].length : 0;
  }

  // 获取所有事件名称
  eventNames() {
    return Object.keys(this.events);
  }
}

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
