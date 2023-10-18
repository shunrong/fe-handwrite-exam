/**
 * 手写实现 apply 方法
 * apply 也是函数原型上的方法，只能由函数来调用
 * 与 call 的唯一区别是函数入参不一样， apply 传入的是数组，call 是需要逐个参数传入
 */
Function.prototype.myApply = function(context, args) {
  if (typeof this !== 'function') {
    throw 'type error';
  }

  context = context || window;
  context.fn = this;
  const result = context.fn(...args);
  delete context.fn;
  return result;
}