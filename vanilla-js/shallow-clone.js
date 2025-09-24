/**
 * 手写浅拷贝 - 现代实现版
 * 
 * 核心原理：只拷贝第一层，引用类型直接赋值引用
 * - 基本类型：值拷贝
 * - 引用类型：引用拷贝（共享同一个对象）
 * - 应用场景：React props、spread 操作符的底层逻辑
 */

// 1. 基础版本 - 核心逻辑
const shallowClone = (obj) => {
  // 基本类型直接返回
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  // 处理数组
  if (Array.isArray(obj)) {
    return [...obj]; // 等价于 obj.slice()
  }
  
  // 处理普通对象
  return { ...obj }; // 等价于 Object.assign({}, obj)
};

// 2. 完整版本 - 处理更多类型
const shallowCloneAdvanced = (obj) => {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  // 处理特殊对象类型
  if (obj instanceof Date) return new Date(obj);
  if (obj instanceof RegExp) return new RegExp(obj);
  if (typeof obj === 'function') return obj;
  
  // 处理数组
  if (Array.isArray(obj)) {
    const result = [];
    for (let i = 0; i < obj.length; i++) {
      result[i] = obj[i]; // 浅拷贝：直接赋值
    }
    return result;
  }
  
  // 处理普通对象
  const result = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      result[key] = obj[key]; // 浅拷贝：直接赋值
    }
  }
  
  return result;
};

// 3. 手写实现 Object.assign 
const myObjectAssign = (target, ...sources) => {
  if (target === null || target === undefined) {
    throw new TypeError('Cannot convert undefined or null to object');
  }
  
  const result = Object(target);
  
  sources.forEach(source => {
    if (source !== null && source !== undefined) {
      for (const key in source) {
        if (source.hasOwnProperty(key)) {
          result[key] = source[key]; // 浅拷贝赋值
        }
      }
    }
  });
  
  return result;
};

// 4. 手写实现 Array.from (浅拷贝数组)
const myArrayFrom = (arrayLike, mapFn) => {
  if (arrayLike === null || arrayLike === undefined) {
    throw new TypeError('Array.from requires an array-like object');
  }
  
  const result = [];
  const length = arrayLike.length || 0;
  
  for (let i = 0; i < length; i++) {
    const value = arrayLike[i];
    result[i] = mapFn ? mapFn(value, i) : value; // 浅拷贝元素
  }
  
  return result;
};

// ===== 使用示例 =====

// 基本使用
const original = {
  name: 'Tom',
  age: 25,
  hobbies: ['reading', 'swimming'],
  address: { city: 'Beijing', street: 'Main St' }
};

const shallow = shallowClone(original);

console.log('=== 浅拷贝测试 ===');
console.log('基本类型独立:', shallow.name !== original.name); // false - 值相同但独立
console.log('数组引用相同:', shallow.hobbies === original.hobbies); // true - 共享引用
console.log('对象引用相同:', shallow.address === original.address); // true - 共享引用

// 修改测试
shallow.name = 'Jerry';
shallow.hobbies.push('coding');
shallow.address.city = 'Shanghai';

console.log('\n=== 修改影响测试 ===');
console.log('原对象 name:', original.name); // 'Tom' - 不受影响
console.log('原对象 hobbies:', original.hobbies); // ['reading', 'swimming', 'coding'] - 受影响
console.log('原对象 address:', original.address.city); // 'Shanghai' - 受影响

// React 中的典型场景
const ReactExample = () => {
  const props = { user: { name: 'Tom' }, settings: { theme: 'dark' } };
  
  // 浅拷贝 props（React 内部行为）
  const newProps = { ...props, loading: true };
  
  console.log('\n=== React 场景 ===');
  console.log('props 对象不同:', props !== newProps); // true
  console.log('user 对象相同:', props.user === newProps.user); // true - 浅拷贝
  console.log('settings 对象相同:', props.settings === newProps.settings); // true - 浅拷贝
};

ReactExample();

// 数组浅拷贝示例
const numbers = [1, 2, { value: 3 }];
const shallowNumbers = shallowClone(numbers);

shallowNumbers[2].value = 99;
console.log('\n=== 数组浅拷贝 ===');
console.log('原数组受影响:', numbers[2].value); // 99 - 对象引用共享

// Object.assign 示例
const obj1 = { a: 1, b: { nested: 'value' } };
const obj2 = { c: 3 };
const merged = myObjectAssign({}, obj1, obj2);

console.log('\n=== Object.assign 测试 ===');
console.log('合并结果:', merged); // { a: 1, b: { nested: 'value' }, c: 3 }
console.log('嵌套对象共享:', merged.b === obj1.b); // true - 浅拷贝

export { shallowClone, shallowCloneAdvanced, myObjectAssign, myArrayFrom };
