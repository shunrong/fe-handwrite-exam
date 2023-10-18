let obj = new Object();

/**
 * 手写实现 new 操作符
 * 1. 首先理解 new 操作符做了什么：
 * 1.1 创建一个新的空对象
 * 1.2 将对象的原型对象指向构造函数的原型
 * 1.3 传入参数执行构造函数
 * 1.4 如果执行结果是对象，返回结果，如果不是对象，返回这个对象
 * @returns 
 */
function myNew(constructor, ...args) {
  if (typeof constructor !== 'function') {
    throw 'constructor must be a function';
  }

  let obj = Object.create(constructor.prototype);
  const result = constructor.apply(obj, args);
  return result instanceof Object ? result : obj;
}

// test
function Person(name, age) {
  this.name = name;
  this.age = age;
}

const obj1 = new Person('Tom', 12);
const obj2 = myNew(Person, 'Tom', 12);

console.log(obj1, obj2);
