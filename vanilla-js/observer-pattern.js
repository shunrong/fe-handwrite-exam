/**
 * 手写观察者模式 (Observer Pattern) - 前端面试经典题
 * 
 * 观察者模式 vs 发布订阅模式的区别：
 * - 观察者模式：观察者直接订阅主题，主题直接通知观察者（耦合度较高）
 * - 发布订阅模式：通过事件中心解耦，发布者和订阅者不直接接触（耦合度较低）
 */

// 1. 基础观察者模式实现
class Observer {
  constructor(name) {
    this.name = name;
  }
  
  // 接收通知的方法
  update(data) {
    console.log(`${this.name} 收到通知:`, data);
  }
}

class Subject {
  constructor() {
    this.observers = []; // 观察者列表
    this.state = null;   // 主题状态
  }
  
  // 添加观察者
  addObserver(observer) {
    if (observer && typeof observer.update === 'function') {
      this.observers.push(observer);
    } else {
      throw new Error('Observer must have an update method');
    }
  }
  
  // 移除观察者
  removeObserver(observer) {
    this.observers = this.observers.filter(obs => obs !== observer);
  }
  
  // 通知所有观察者
  notify(data) {
    this.observers.forEach(observer => {
      try {
        observer.update(data);
      } catch (error) {
        console.error(`Error notifying observer ${observer.name}:`, error);
      }
    });
  }
  
  // 设置状态并通知观察者
  setState(newState) {
    this.state = newState;
    this.notify(newState);
  }
  
  // 获取观察者数量
  getObserverCount() {
    return this.observers.length;
  }
}

// 2. 增强版观察者模式 - 支持优先级和条件通知
class AdvancedObserver {
  constructor(name, priority = 0, condition = null) {
    this.name = name;
    this.priority = priority; // 优先级，数字越大优先级越高
    this.condition = condition; // 条件函数，返回 true 才接收通知
  }
  
  update(data) {
    if (this.condition && !this.condition(data)) {
      return; // 不满足条件，不处理通知
    }
    console.log(`[优先级${this.priority}] ${this.name} 收到通知:`, data);
  }
  
  // 检查是否应该接收通知
  shouldUpdate(data) {
    return !this.condition || this.condition(data);
  }
}

class AdvancedSubject {
  constructor() {
    this.observers = [];
    this.state = null;
    this.history = []; // 状态历史
  }
  
  addObserver(observer) {
    if (observer && typeof observer.update === 'function') {
      this.observers.push(observer);
      // 按优先级排序
      this.observers.sort((a, b) => (b.priority || 0) - (a.priority || 0));
    } else {
      throw new Error('Observer must have an update method');
    }
  }
  
  removeObserver(observer) {
    this.observers = this.observers.filter(obs => obs !== observer);
  }
  
  // 条件通知 - 只通知满足条件的观察者
  notify(data, condition = null) {
    let notifiedCount = 0;
    
    this.observers.forEach(observer => {
      try {
        // 检查全局条件和观察者自身条件
        const shouldNotify = (!condition || condition(observer, data)) && 
                           observer.shouldUpdate(data);
        
        if (shouldNotify) {
          observer.update(data);
          notifiedCount++;
        }
      } catch (error) {
        console.error(`Error notifying observer ${observer.name}:`, error);
      }
    });
    
    return notifiedCount;
  }
  
  setState(newState) {
    const oldState = this.state;
    this.state = newState;
    
    // 记录状态历史
    this.history.push({
      oldState,
      newState,
      timestamp: new Date()
    });
    
    // 限制历史记录数量
    if (this.history.length > 100) {
      this.history.shift();
    }
    
    this.notify({
      current: newState,
      previous: oldState,
      timestamp: new Date()
    });
  }
  
  // 获取状态历史
  getHistory() {
    return [...this.history];
  }
  
  // 回滚到上一个状态
  rollback() {
    if (this.history.length > 1) {
      const previousState = this.history[this.history.length - 2];
      this.setState(previousState.newState);
    }
  }
}

// 3. 响应式观察者 - 类似 Vue 的响应式系统
class ReactiveObserver {
  constructor() {
    this.deps = new Set(); // 依赖的响应式属性
    this.active = true;
  }
  
  // 依赖收集
  depend(dep) {
    if (this.active) {
      this.deps.add(dep);
      dep.addSub(this);
    }
  }
  
  // 更新函数
  update() {
    if (this.active) {
      this.run();
    }
  }
  
  // 执行观察者函数
  run() {
    // 子类实现
  }
  
  // 清理依赖
  teardown() {
    this.deps.forEach(dep => dep.removeSub(this));
    this.deps.clear();
    this.active = false;
  }
}

class Dep {
  constructor() {
    this.subs = []; // 订阅者列表
  }
  
  addSub(sub) {
    this.subs.push(sub);
  }
  
  removeSub(sub) {
    this.subs = this.subs.filter(s => s !== sub);
  }
  
  depend() {
    if (Dep.target) {
      Dep.target.depend(this);
    }
  }
  
  notify() {
    this.subs.forEach(sub => {
      sub.update();
    });
  }
}

// 全局目标观察者
Dep.target = null;

// 响应式数据
function reactive(obj) {
  const deps = new Map();
  
  return new Proxy(obj, {
    get(target, key) {
      // 依赖收集
      if (!deps.has(key)) {
        deps.set(key, new Dep());
      }
      deps.get(key).depend();
      return target[key];
    },
    
    set(target, key, value) {
      const oldValue = target[key];
      target[key] = value;
      
      // 通知更新
      if (oldValue !== value) {
        if (!deps.has(key)) {
          deps.set(key, new Dep());
        }
        deps.get(key).notify();
      }
      
      return true;
    }
  });
}

// 计算属性观察者
class ComputedObserver extends ReactiveObserver {
  constructor(getter, setter) {
    super();
    this.getter = getter;
    this.setter = setter;
    this.value = undefined;
    this.dirty = true; // 是否需要重新计算
  }
  
  evaluate() {
    if (this.dirty) {
      this.value = this.get();
      this.dirty = false;
    }
    return this.value;
  }
  
  get() {
    Dep.target = this;
    const value = this.getter();
    Dep.target = null;
    return value;
  }
  
  update() {
    this.dirty = true;
  }
  
  run() {
    this.get();
  }
}

// 4. 实际应用场景示例

// 场景1：用户界面状态管理
class UIStateManager extends AdvancedSubject {
  constructor() {
    super();
    this.state = {
      user: null,
      theme: 'light',
      language: 'zh',
      loading: false
    };
  }
  
  // 登录用户
  login(user) {
    this.setState({
      ...this.state,
      user,
      loading: false
    });
  }
  
  // 切换主题
  toggleTheme() {
    const newTheme = this.state.theme === 'light' ? 'dark' : 'light';
    this.setState({
      ...this.state,
      theme: newTheme
    });
  }
  
  // 设置加载状态
  setLoading(loading) {
    this.setState({
      ...this.state,
      loading
    });
  }
}

// UI 组件观察者
class UIComponent extends AdvancedObserver {
  constructor(name, elementSelector) {
    super(name);
    this.element = elementSelector;
  }
  
  update(data) {
    console.log(`${this.name} 组件更新:`, data);
    this.render(data.current);
  }
  
  render(state) {
    // 模拟 DOM 更新
    console.log(`更新 ${this.element} 的内容`);
  }
}

// 场景2：模型-视图同步
class Model extends Subject {
  constructor(data = {}) {
    super();
    this.data = { ...data };
  }
  
  get(key) {
    return this.data[key];
  }
  
  set(key, value) {
    const oldValue = this.data[key];
    this.data[key] = value;
    
    this.notify({
      type: 'change',
      key,
      oldValue,
      newValue: value,
      data: { ...this.data }
    });
  }
  
  getData() {
    return { ...this.data };
  }
}

class View extends Observer {
  constructor(name, model) {
    super(name);
    this.model = model;
    this.model.addObserver(this);
  }
  
  update(changeData) {
    console.log(`${this.name} 视图更新:`, changeData);
    this.render(changeData.data);
  }
  
  render(data) {
    console.log(`渲染视图 ${this.name}:`, data);
  }
  
  destroy() {
    this.model.removeObserver(this);
  }
}

// 测试用例
console.log('=== 观察者模式测试 ===\n');

// 1. 基础观察者模式测试
console.log('1. 基础观察者模式测试：');
const subject = new Subject();
const observer1 = new Observer('观察者1');
const observer2 = new Observer('观察者2');

subject.addObserver(observer1);
subject.addObserver(observer2);

subject.setState('新状态数据');

// 2. 优先级观察者测试
console.log('\n2. 优先级观察者测试：');
const advancedSubject = new AdvancedSubject();

const highPriorityObs = new AdvancedObserver('高优先级', 10);
const lowPriorityObs = new AdvancedObserver('低优先级', 1);
const conditionalObs = new AdvancedObserver('条件观察者', 5, 
  data => data.current && data.current.includes('重要')
);

advancedSubject.addObserver(highPriorityObs);
advancedSubject.addObserver(lowPriorityObs);
advancedSubject.addObserver(conditionalObs);

advancedSubject.setState('普通消息');
advancedSubject.setState('重要消息');

// 3. UI 状态管理测试
console.log('\n3. UI 状态管理测试：');
const uiManager = new UIStateManager();

const header = new UIComponent('Header', '#header');
const sidebar = new UIComponent('Sidebar', '#sidebar');
const themeObserver = new AdvancedObserver('主题组件', 8, 
  data => data.current.theme !== data.previous.theme
);

uiManager.addObserver(header);
uiManager.addObserver(sidebar);
uiManager.addObserver(themeObserver);

uiManager.login({ name: 'John', id: 1 });
uiManager.toggleTheme();

// 4. 模型-视图同步测试
console.log('\n4. 模型-视图同步测试：');
const userModel = new Model({ name: 'Alice', age: 25 });
const userView = new View('用户视图', userModel);

userModel.set('name', 'Bob');
userModel.set('age', 30);

// 5. 响应式系统测试
console.log('\n5. 响应式系统测试：');
const reactiveData = reactive({
  count: 0,
  message: 'Hello'
});

const computedDouble = new ComputedObserver(() => {
  console.log('计算 double 值');
  return reactiveData.count * 2;
});

const computedMessage = new ComputedObserver(() => {
  console.log('计算 message 长度');
  return `${reactiveData.message} (长度: ${reactiveData.message.length})`;
});

console.log('初始 double:', computedDouble.evaluate());
console.log('初始 message:', computedMessage.evaluate());

reactiveData.count = 5;
console.log('更新后 double:', computedDouble.evaluate());

reactiveData.message = 'World';
console.log('更新后 message:', computedMessage.evaluate());

// 性能测试
console.log('\n=== 性能测试 ===');
const perfSubject = new Subject();

// 添加大量观察者
const observers = [];
for (let i = 0; i < 1000; i++) {
  const obs = new Observer(`Observer${i}`);
  obs.update = () => {}; // 空函数避免打印
  observers.push(obs);
  perfSubject.addObserver(obs);
}

console.time('通知1000个观察者');
perfSubject.setState('性能测试数据');
console.timeEnd('通知1000个观察者');

// 内存清理
observers.forEach(obs => perfSubject.removeObserver(obs));

// 总结
console.log('\n=== 观察者模式总结 ===');
console.log('核心概念：');
console.log('• Subject (主题) - 维护观察者列表，状态变化时通知观察者');
console.log('• Observer (观察者) - 实现 update 方法接收通知');
console.log('• 一对多依赖关系 - 一个主题可以有多个观察者');
console.log('');
console.log('应用场景：');
console.log('• 模型-视图架构 (MVC/MVP/MVVM)');
console.log('• 状态管理 (Redux/Vuex 的简化版)');
console.log('• 响应式编程 (Vue/React 的响应式系统)');
console.log('• 事件驱动架构');
console.log('');
console.log('优缺点：');
console.log('✓ 松散耦合 - 主题和观察者相互独立');
console.log('✓ 动态关系 - 运行时添加/删除观察者');
console.log('✓ 广播通信 - 一次通知多个对象');
console.log('✗ 可能引起性能问题 - 观察者过多时');
console.log('✗ 内存泄漏风险 - 忘记移除观察者');
console.log('✗ 调试困难 - 间接调用关系复杂');
