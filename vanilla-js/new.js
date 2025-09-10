/**
 * 手写实现 new 操作符 - 完整版
 * 
 * new 操作符的执行步骤：
 * 1. 创建一个新的空对象
 * 2. 将新对象的 __proto__ 指向构造函数的 prototype
 * 3. 将构造函数的 this 指向新对象，并执行构造函数
 * 4. 如果构造函数返回对象，则返回该对象；否则返回新创建的对象
 */

// 基础版本
function myNew(constructor, ...args) {
  // 1. 参数验证
  if (typeof constructor !== 'function') {
    throw new TypeError('constructor must be a function');
  }

  // 2. 创建新对象，设置原型链
  const obj = Object.create(constructor.prototype);
  
  // 3. 执行构造函数，绑定 this
  const result = constructor.apply(obj, args);
  
  // 4. 判断返回值类型
  return (typeof result === 'object' && result !== null) || typeof result === 'function' 
    ? result 
    : obj;
}

// 更详细的实现版本
function myNewDetailed(constructor, ...args) {
  // 1. 类型检查
  if (typeof constructor !== 'function') {
    throw new TypeError(`${constructor} is not a constructor`);
  }

  // 2. 创建新对象的几种方式对比
  // 方式1: Object.create (推荐)
  const obj1 = Object.create(constructor.prototype);
  
  // 方式2: 手动设置原型 (等价实现)
  const obj2 = {};
  obj2.__proto__ = constructor.prototype;
  
  // 方式3: setPrototypeOf (性能较差)
  const obj3 = {};
  Object.setPrototypeOf(obj3, constructor.prototype);
  
  // 使用推荐方式
  const obj = obj1;

  // 3. 调用构造函数
  let result;
  try {
    result = constructor.apply(obj, args);
  } catch (error) {
    // 如果构造函数抛出异常，应该抛出而不是返回对象
    throw error;
  }

  // 4. 判断构造函数返回值
  // 只有返回对象类型（包括函数）才会替换默认的返回值
  const isObject = typeof result === 'object' && result !== null;
  const isFunction = typeof result === 'function';
  
  return (isObject || isFunction) ? result : obj;
}

// 支持箭头函数检测的版本
function myNewAdvanced(constructor, ...args) {
  if (typeof constructor !== 'function') {
    throw new TypeError(`${constructor} is not a constructor`);
  }

  // 检测是否为箭头函数（箭头函数没有 prototype 属性）
  if (!constructor.prototype) {
    throw new TypeError(`${constructor.name} is not a constructor`);
  }

  const obj = Object.create(constructor.prototype);
  const result = constructor.apply(obj, args);
  
  return (result !== null && (typeof result === 'object' || typeof result === 'function')) 
    ? result 
    : obj;
}

// test
function Person(name, age) {
  this.name = name;
  this.age = age;
}

const obj1 = new Person('Tom', 12);
const obj2 = myNew(Person, 'Tom', 12);

console.log(obj1, obj2);
