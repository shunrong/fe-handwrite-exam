/**
 * 手写实现 bind 方法
 */
Function.prototype.myBind = function(context, ...args) {
  if (typeof this !== 'function') {
    throw 'type error';
  }

  const fn = this;
  return function Fn() {
    return fn.apply(
      this instanceof Fn ? this : context,
      args.concat(...arguments)
    )
  };
}