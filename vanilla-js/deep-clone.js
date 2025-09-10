/**
 * 手写深拷贝 - 完整版
 * 处理循环引用、各种数据类型、特殊对象等
 */

// 1. 基础版本
function simpleDeepClone(source) {
  if (typeof source !== 'object' || source === null) return source;
  
  const result = Array.isArray(source) ? [] : {};
  
  for (let key in source) {
    if (source.hasOwnProperty(key)) {
      result[key] = simpleDeepClone(source[key]);
    }
  }
  
  return result;
}

// 2. 完整版深拷贝
function deepClone(source, map = new WeakMap()) {
  // 处理基本数据类型和 null
  if (typeof source !== 'object' || source === null) {
    return source;
  }
  
  // 处理循环引用
  if (map.has(source)) {
    return map.get(source);
  }
  
  // 处理日期对象
  if (source instanceof Date) {
    return new Date(source);
  }
  
  // 处理正则对象
  if (source instanceof RegExp) {
    return new RegExp(source);
  }
  
  // 处理函数
  if (typeof source === 'function') {
    return source; // 函数一般不需要深拷贝
  }
  
  // 处理数组
  if (Array.isArray(source)) {
    const result = [];
    map.set(source, result); // 先设置映射，防止循环引用
    for (let i = 0; i < source.length; i++) {
      result[i] = deepClone(source[i], map);
    }
    return result;
  }
  
  // 处理普通对象
  const result = {};
  map.set(source, result); // 先设置映射，防止循环引用
  
  // 拷贝可枚举属性
  for (let key in source) {
    if (source.hasOwnProperty(key)) {
      result[key] = deepClone(source[key], map);
    }
  }
  
  // 拷贝不可枚举属性
  const symbols = Object.getOwnPropertySymbols(source);
  for (let symbol of symbols) {
    result[symbol] = deepClone(source[symbol], map);
  }
  
  return result;
}

// 3. 更完善的深拷贝（处理更多类型）
function advancedDeepClone(source, map = new WeakMap()) {
  if (typeof source !== 'object' || source === null) {
    return source;
  }
  
  if (map.has(source)) {
    return map.get(source);
  }
  
  // 获取对象的具体类型
  const type = Object.prototype.toString.call(source);
  let result;
  
  switch (type) {
    case '[object Date]':
      result = new Date(source);
      break;
    case '[object RegExp]':
      result = new RegExp(source);
      break;
    case '[object Array]':
      result = [];
      break;
    case '[object Set]':
      result = new Set();
      map.set(source, result);
      source.forEach(value => {
        result.add(advancedDeepClone(value, map));
      });
      return result;
    case '[object Map]':
      result = new Map();
      map.set(source, result);
      source.forEach((value, key) => {
        result.set(advancedDeepClone(key, map), advancedDeepClone(value, map));
      });
      return result;
    case '[object Object]':
      result = {};
      break;
    default:
      return source; // 其他类型直接返回
  }
  
  map.set(source, result);
  
  // 处理数组和对象
  if (type === '[object Array]') {
    for (let i = 0; i < source.length; i++) {
      result[i] = advancedDeepClone(source[i], map);
    }
  } else if (type === '[object Object]') {
    // 处理对象的所有属性（包括 Symbol）
    Reflect.ownKeys(source).forEach(key => {
      result[key] = advancedDeepClone(source[key], map);
    });
  }
  
  return result;
}

// 测试用例
console.log('=== 深拷贝测试 ===');

// 基础测试
let arr = [1, 2, 3, 4, 5];
let arr1 = deepClone(arr);
console.log('数组拷贝:', arr1);

let obj = { name: 'tom', age: 13, male: true };
let obj1 = deepClone(obj);
console.log('对象拷贝:', obj1);

// 循环引用测试
let circular = { a: 1 };
circular.self = circular;
let circular1 = deepClone(circular);
console.log('循环引用测试:', circular1.self === circular1);

// 复杂对象测试
let complex = {
  date: new Date(),
  reg: /abc/g,
  arr: [1, 2, { nested: 'value' }],
  set: new Set([1, 2, 3]),
  map: new Map([['key', 'value']]),
  symbol: Symbol('test')
};

let complex1 = advancedDeepClone(complex);
console.log('复杂对象测试:', complex1);
