/**
 * 手写浅比较 - 现代实现版
 * 
 * 核心原理：只比较第一层，引用类型直接比较引用地址
 * - 基本类型：值比较
 * - 引用类型：引用比较（===）
 * - 应用场景：React.memo、useMemo、useCallback 的依赖比较
 */

// 1. 基础版本 - 核心逻辑
const shallowEqual = (a, b) => {
  // 严格相等检查（包括基本类型和引用类型）
  if (a === b) {
    return true;
  }
  
  // null/undefined 处理
  if (a === null || b === null || a === undefined || b === undefined) {
    return false;
  }
  
  // 类型不同直接返回 false
  if (typeof a !== 'object' || typeof b !== 'object') {
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
  
  // 逐个比较属性值（浅比较：直接用 ===）
  for (const key of keysA) {
    if (!keysB.includes(key) || a[key] !== b[key]) {
      return false;
    }
  }
  
  return true;
};

// 2. 优化版本 - 性能优化
const shallowEqualOptimized = (a, b) => {
  if (a === b) return true;
  
  if (a == null || b == null) return a === b;
  
  if (typeof a !== 'object' || typeof b !== 'object') return false;
  
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  
  if (keysA.length !== keysB.length) return false;
  
  // 优化：直接用 hasOwnProperty 检查，避免 includes 的 O(n) 查找
  for (const key of keysA) {
    if (!b.hasOwnProperty(key) || a[key] !== b[key]) {
      return false;
    }
  }
  
  return true;
};

// 3. React 风格的浅比较（模拟 React.memo 内部实现）
const reactShallowEqual = (prevProps, nextProps) => {
  if (prevProps === nextProps) {
    return true;
  }
  
  if (typeof prevProps !== 'object' || prevProps === null ||
      typeof nextProps !== 'object' || nextProps === null) {
    return false;
  }
  
  const keysA = Object.keys(prevProps);
  const keysB = Object.keys(nextProps);
  
  if (keysA.length !== keysB.length) {
    return false;
  }
  
  for (let i = 0; i < keysA.length; i++) {
    const key = keysA[i];
    if (!nextProps.hasOwnProperty(key) || prevProps[key] !== nextProps[key]) {
      return false;
    }
  }
  
  return true;
};

// 4. 专门用于数组的浅比较
const shallowEqualArray = (a, b) => {
  if (a === b) return true;
  if (!Array.isArray(a) || !Array.isArray(b)) return false;
  if (a.length !== b.length) return false;
  
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false; // 浅比较：直接用 ===
  }
  
  return true;
};

// 5. 手写实现 Object.is（用于更精确的基本类型比较）
const myObjectIs = (a, b) => {
  // 处理 NaN 的特殊情况
  if (a !== a && b !== b) {
    return true; // NaN === NaN
  }
  
  // 处理 +0 和 -0 的区别
  if (a === 0 && b === 0) {
    return 1 / a === 1 / b; // +0 和 -0 的倒数符号不同
  }
  
  // 其他情况用严格相等
  return a === b;
};

// 6. 使用 Object.is 的浅比较版本
const shallowEqualWithObjectIs = (a, b) => {
  if (myObjectIs(a, b)) return true;
  
  if (a == null || b == null) return false;
  if (typeof a !== 'object' || typeof b !== 'object') return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  
  if (keysA.length !== keysB.length) return false;
  
  for (const key of keysA) {
    if (!b.hasOwnProperty(key) || !myObjectIs(a[key], b[key])) {
      return false;
    }
  }
  
  return true;
};

// ===== 使用示例 =====

console.log('=== 浅比较测试 ===');

// 基本类型比较
console.log('数字比较:', shallowEqual(1, 1)); // true
console.log('字符串比较:', shallowEqual('hello', 'hello')); // true
console.log('布尔比较:', shallowEqual(true, false)); // false

// 引用类型比较
const obj1 = { name: 'Tom', age: 25 };
const obj2 = { name: 'Tom', age: 25 };
const obj3 = obj1;

console.log('\n=== 对象引用比较 ===');
console.log('不同对象相同内容:', shallowEqual(obj1, obj2)); // true - 浅比较内容
console.log('相同对象引用:', shallowEqual(obj1, obj3)); // true - 引用相同

// 嵌套对象比较
const nested1 = { user: { name: 'Tom' }, count: 1 };
const nested2 = { user: { name: 'Tom' }, count: 1 };

console.log('\n=== 嵌套对象比较 ===');
console.log('嵌套对象浅比较:', shallowEqual(nested1, nested2)); // false - user 对象引用不同

// 数组比较
const arr1 = [1, 2, 3];
const arr2 = [1, 2, 3];
const arr3 = [1, 2, { value: 3 }];
const arr4 = [1, 2, { value: 3 }];

console.log('\n=== 数组比较 ===');
console.log('基本类型数组:', shallowEqualArray(arr1, arr2)); // true
console.log('含对象的数组:', shallowEqualArray(arr3, arr4)); // false - 对象引用不同

// React 典型使用场景
const ReactExample = () => {
  // 模拟 React 组件 props 比较
  const prevProps = { 
    user: { name: 'Tom' }, 
    count: 1,
    onClick: () => {} 
  };
  
  const nextProps = { 
    user: { name: 'Tom' }, 
    count: 1,
    onClick: () => {} 
  };
  
  console.log('\n=== React 场景模拟 ===');
  console.log('Props 浅比较:', reactShallowEqual(prevProps, nextProps)); // false
  
  // 优化后的 props（复用引用）
  const onClick = () => {};
  const user = { name: 'Tom' };
  
  const optimizedPrevProps = { user, count: 1, onClick };
  const optimizedNextProps = { user, count: 1, onClick };
  
  console.log('优化后 Props 比较:', reactShallowEqual(optimizedPrevProps, optimizedNextProps)); // true
};

ReactExample();

// 特殊值比较测试
console.log('\n=== 特殊值比较 ===');
console.log('NaN 比较:', shallowEqualWithObjectIs(NaN, NaN)); // true
console.log('+0 和 -0 比较:', shallowEqualWithObjectIs(+0, -0)); // false
console.log('null 比较:', shallowEqual(null, null)); // true
console.log('undefined 比较:', shallowEqual(undefined, undefined)); // true

export { 
  shallowEqual, 
  shallowEqualOptimized, 
  reactShallowEqual, 
  shallowEqualArray,
  shallowEqualWithObjectIs,
  myObjectIs 
};
