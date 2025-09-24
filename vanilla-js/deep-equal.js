/**
 * 手写深比较 - 现代实现版
 * 
 * 核心原理：递归比较所有层级，直到基本类型为止
 * - 基本类型：值比较
 * - 引用类型：递归比较内容
 * - 特殊处理：循环引用、Date、RegExp、Array、Function 等
 */

// 1. 基础版本 - 核心逻辑
const deepEqual = (a, b) => {
  // 严格相等检查
  if (a === b) {
    return true;
  }
  
  // 基本类型或 null 检查
  if (a === null || b === null || typeof a !== 'object' || typeof b !== 'object') {
    return false;
  }
  
  // 数组类型检查
  if (Array.isArray(a) !== Array.isArray(b)) {
    return false;
  }
  
  // 获取所有可枚举属性
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  
  // 属性数量不同
  if (keysA.length !== keysB.length) {
    return false;
  }
  
  // 递归比较每个属性值
  for (const key of keysA) {
    if (!keysB.includes(key) || !deepEqual(a[key], b[key])) {
      return false;
    }
  }
  
  return true;
};

// 2. 完整版本 - 处理循环引用和特殊类型
const deepEqualAdvanced = (a, b, map = new WeakMap()) => {
  // 严格相等检查
  if (a === b) {
    return true;
  }
  
  // 基本类型检查
  if (a === null || b === null || typeof a !== 'object' || typeof b !== 'object') {
    return false;
  }
  
  // 循环引用检查
  if (map.has(a)) {
    return map.get(a) === b;
  }
  map.set(a, b);
  
  // 获取对象类型
  const typeA = Object.prototype.toString.call(a);
  const typeB = Object.prototype.toString.call(b);
  
  if (typeA !== typeB) {
    return false;
  }
  
  // 根据类型进行比较
  switch (typeA) {
    case '[object Date]':
      return a.getTime() === b.getTime();
      
    case '[object RegExp]':
      return a.toString() === b.toString();
      
    case '[object Function]':
      return a.toString() === b.toString(); // 简单比较函数字符串
      
    case '[object Array]':
      if (a.length !== b.length) return false;
      for (let i = 0; i < a.length; i++) {
        if (!deepEqualAdvanced(a[i], b[i], map)) {
          return false;
        }
      }
      return true;
      
    case '[object Object]':
      const keysA = Object.keys(a);
      const keysB = Object.keys(b);
      
      if (keysA.length !== keysB.length) return false;
      
      for (const key of keysA) {
        if (!b.hasOwnProperty(key) || !deepEqualAdvanced(a[key], b[key], map)) {
          return false;
        }
      }
      return true;
      
    default:
      return a === b;
  }
};

// 3. 高性能版本 - 优化比较策略
const deepEqualOptimized = (a, b, map = new WeakMap()) => {
  if (a === b) return true;
  
  if (a == null || b == null) return a === b;
  
  if (typeof a !== 'object' || typeof b !== 'object') return false;
  
  // 快速类型检查
  if (a.constructor !== b.constructor) return false;
  
  // 循环引用处理
  if (map.has(a)) return map.get(a) === b;
  map.set(a, b);
  
  // 数组快速检查
  if (Array.isArray(a)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!deepEqualOptimized(a[i], b[i], map)) return false;
    }
    return true;
  }
  
  // 特殊对象处理
  if (a instanceof Date) return a.getTime() === b.getTime();
  if (a instanceof RegExp) return a.toString() === b.toString();
  
  // 普通对象比较
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  
  if (keysA.length !== keysB.length) return false;
  
  for (const key of keysA) {
    if (!b.hasOwnProperty(key) || !deepEqualOptimized(a[key], b[key], map)) {
      return false;
    }
  }
  
  return true;
};

// 4. 支持自定义比较函数的版本
const deepEqualWithCustom = (a, b, customCompare, map = new WeakMap()) => {
  // 如果提供了自定义比较函数，先尝试使用
  if (customCompare) {
    const customResult = customCompare(a, b);
    if (customResult !== undefined) {
      return customResult;
    }
  }
  
  // 降级到默认深比较
  return deepEqualAdvanced(a, b, map);
};

// 5. JSON 序列化比较（简单但有限制）
const deepEqualJSON = (a, b) => {
  try {
    return JSON.stringify(a) === JSON.stringify(b);
  } catch {
    return false; // 包含不可序列化内容时回退
  }
};

// 6. 专门用于比较 React 状态的版本
const deepEqualReactState = (prevState, nextState) => {
  // React 状态通常是普通对象和数组，可以简化比较
  const compare = (a, b, depth = 0) => {
    if (depth > 10) return a === b; // 防止过深递归
    
    if (a === b) return true;
    if (a == null || b == null) return a === b;
    if (typeof a !== 'object' || typeof b !== 'object') return false;
    
    if (Array.isArray(a) !== Array.isArray(b)) return false;
    
    if (Array.isArray(a)) {
      if (a.length !== b.length) return false;
      return a.every((item, index) => compare(item, b[index], depth + 1));
    }
    
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    
    if (keysA.length !== keysB.length) return false;
    
    return keysA.every(key => 
      keysB.includes(key) && compare(a[key], b[key], depth + 1)
    );
  };
  
  return compare(prevState, nextState);
};

// ===== 使用示例 =====

console.log('=== 深比较测试 ===');

// 基本比较
const obj1 = { 
  name: 'Tom', 
  age: 25, 
  hobbies: ['reading', 'swimming'],
  address: { city: 'Beijing', street: 'Main St' }
};

const obj2 = { 
  name: 'Tom', 
  age: 25, 
  hobbies: ['reading', 'swimming'],
  address: { city: 'Beijing', street: 'Main St' }
};

const obj3 = { 
  name: 'Tom', 
  age: 25, 
  hobbies: ['reading', 'swimming'],
  address: { city: 'Shanghai', street: 'Main St' } // 不同的城市
};

console.log('相同内容对象:', deepEqual(obj1, obj2)); // true
console.log('不同内容对象:', deepEqual(obj1, obj3)); // false

// 数组深比较
const arr1 = [1, 2, { value: 3, nested: { deep: 'value' } }];
const arr2 = [1, 2, { value: 3, nested: { deep: 'value' } }];
const arr3 = [1, 2, { value: 3, nested: { deep: 'different' } }];

console.log('\n=== 数组深比较 ===');
console.log('相同内容数组:', deepEqual(arr1, arr2)); // true
console.log('不同内容数组:', deepEqual(arr1, arr3)); // false

// 特殊对象比较
const special1 = {
  date: new Date('2023-01-01'),
  regex: /abc/g,
  func: function() { return 'hello'; }
};

const special2 = {
  date: new Date('2023-01-01'),
  regex: /abc/g,
  func: function() { return 'hello'; }
};

console.log('\n=== 特殊对象比较 ===');
console.log('特殊对象深比较:', deepEqualAdvanced(special1, special2)); // true

// 循环引用测试
const circular1 = { name: 'circular' };
circular1.self = circular1;

const circular2 = { name: 'circular' };
circular2.self = circular2;

console.log('\n=== 循环引用测试 ===');
console.log('循环引用对象:', deepEqualAdvanced(circular1, circular2)); // true

// 性能对比测试
const performanceTest = () => {
  const largeObj = {
    users: Array.from({ length: 1000 }, (_, i) => ({
      id: i,
      name: `User${i}`,
      details: { age: 20 + i % 50, active: i % 2 === 0 }
    }))
  };
  
  const largeObj2 = JSON.parse(JSON.stringify(largeObj)); // 深拷贝
  
  console.log('\n=== 性能测试 ===');
  
  console.time('基础深比较');
  const result1 = deepEqual(largeObj, largeObj2);
  console.timeEnd('基础深比较');
  
  console.time('优化深比较');
  const result2 = deepEqualOptimized(largeObj, largeObj2);
  console.timeEnd('优化深比较');
  
  console.time('JSON 比较');
  const result3 = deepEqualJSON(largeObj, largeObj2);
  console.timeEnd('JSON 比较');
  
  console.log('结果一致性:', result1 === result2 && result2 === result3);
};

performanceTest();

// React 状态比较示例
const ReactStateExample = () => {
  const prevState = {
    user: { name: 'Tom', profile: { age: 25, city: 'Beijing' } },
    items: [{ id: 1, name: 'item1' }, { id: 2, name: 'item2' }],
    settings: { theme: 'dark', notifications: true }
  };
  
  const nextState = {
    user: { name: 'Tom', profile: { age: 25, city: 'Beijing' } },
    items: [{ id: 1, name: 'item1' }, { id: 2, name: 'item2' }],
    settings: { theme: 'dark', notifications: true }
  };
  
  console.log('\n=== React 状态比较 ===');
  console.log('状态深比较:', deepEqualReactState(prevState, nextState)); // true
};

ReactStateExample();

export { 
  deepEqual, 
  deepEqualAdvanced, 
  deepEqualOptimized,
  deepEqualWithCustom,
  deepEqualJSON,
  deepEqualReactState
};
