
/**
 * 手写实现 Object.create() 方法（ES6 新增）
 * 传入一个对象，以这个对象作为原型创建一个新对象
 * 创建后的对象获得传入对象的属性和方法
 * @param {*} obj 
 * @returns 
 */
function myCreate(obj) {
  function Fn() { };
  Fn.prototype = obj;
  return new Fn();
}

// test
function Person(name, age) {
  this.name = name;
  this.age = age;
}

const obj1 = Object.create(Person.prototype);
const obj2 = myCreate(Person.prototype);

console.log(obj1, obj2);