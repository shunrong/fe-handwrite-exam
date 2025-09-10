/**
 * 手写实现 instanceof 运算符 - 完整版
 * 
 * instanceof 原理：
 * 检查构造函数的 prototype 属性是否出现在对象的原型链上
 */

// 基础版本
function myInstanceof(obj, constructor) {
  // 1. 参数验证
  if (typeof constructor !== 'function') {
    throw new TypeError('Right-hand side of instanceof is not a constructor');
  }

  // 2. 处理基本数据类型
  if (obj === null || obj === undefined) {
    return false;
  }

  // 3. 获取对象的原型和构造函数的 prototype
  let proto = Object.getPrototypeOf(obj);
  const prototype = constructor.prototype;

  // 4. 遍历原型链
  while (proto !== null) {
    if (proto === prototype) {
      return true;
    }
    proto = Object.getPrototypeOf(proto);
  }

  return false;
}

// 处理边界情况的完整版本
function myInstanceofAdvanced(obj, constructor) {
  // 1. 严格的参数验证
  if (typeof constructor !== 'function') {
    throw new TypeError('Right-hand side of instanceof is not a constructor');
  }

  // 2. 检查构造函数是否有有效的 prototype
  if (constructor.prototype === null || constructor.prototype === undefined) {
    throw new TypeError('Function has non-object prototype in instanceof check');
  }

  // 3. 处理基本数据类型（null, undefined）
  if (obj === null || obj === undefined) {
    return false;
  }

  // 4. 处理基本数据类型包装
  // 注意：基本类型值在 instanceof 检查时会被自动装箱
  if (typeof obj !== 'object' && typeof obj !== 'function') {
    // 对于基本类型，只有对应的包装类型会返回 true
    // 例如：'hello' instanceof String 返回 false
    // 但 new String('hello') instanceof String 返回 true
    return false;
  }

  // 5. 遍历原型链
  let proto = Object.getPrototypeOf(obj);
  const prototype = constructor.prototype;

  while (proto !== null) {
    if (proto === prototype) {
      return true;
    }
    proto = Object.getPrototypeOf(proto);
  }

  return false;
}

// 支持 Symbol.hasInstance 的版本
function myInstanceofWithSymbol(obj, constructor) {
  // 1. 检查是否定义了 Symbol.hasInstance
  if (typeof constructor === 'function' && constructor[Symbol.hasInstance]) {
    return constructor[Symbol.hasInstance](obj);
  }

  // 2. 降级到普通实现
  return myInstanceofAdvanced(obj, constructor);
}

// 递归实现版本
function myInstanceofRecursive(obj, constructor) {
  if (typeof constructor !== 'function') {
    throw new TypeError('Right-hand side of instanceof is not a constructor');
  }

  if (obj === null || obj === undefined) {
    return false;
  }

  function checkPrototype(proto, target) {
    if (proto === null) {
      return false;
    }
    if (proto === target) {
      return true;
    }
    return checkPrototype(Object.getPrototypeOf(proto), target);
  }

  return checkPrototype(Object.getPrototypeOf(obj), constructor.prototype);
}

// test
let arr = [1, 2, 3];
console.log(myInstanceof(arr, Array));