/**
 * 手写实现 instanceof 运算符
 * 判断对象是否是构造函数的实例
 */
function myInstanceof(obj, constructor) {
  if (typeof constructor !== 'function') {
    throw 'type error'
  }
  let proto = Object.getPrototypeOf(obj);
  let prototype = constructor.prototype;
  while (true) {
    if (!proto) return false;
    if (proto === prototype) return true;
    proto = Object.getPrototypeOf(proto);
  }
}

// test
let arr = [1, 2, 3];
console.log(myInstanceof(arr, Array));