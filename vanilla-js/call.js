/**
 * 手写实现 call 方法
 * call 是函数原型上的方法，只能由函数来调用
 * call 的第一个参数是需要指定的上下文
 * call 的后面参数是调用函数时需要传入的参数
 */
Function.prototype.myCall = function(context, ...args) {
  if (typeof this !== 'function') {
    throw 'type error';
  }

  context = context || window;
  context.fn = this;
  const result = context.fn(...args);
  delete context.fn;
  return result;
}