/**
 * 手写实现 apply 方法
 * 
 * 核心原理：与 call 相同，利用对象方法调用时 this 的绑定规律
 * 唯一区别：参数传递方式不同，apply 接收参数数组，call 接收参数列表
 * 
 * 实现步骤：
 * 1. 把要执行的函数临时添加为 context 的属性
 * 2. 将参数数组展开后通过对象方法调用的方式执行函数
 * 3. 删除临时属性，避免污染原对象
 * 
 * @param {Object} context 指定的 this 上下文
 * @param {Array} args 函数执行时的参数数组
 * @returns {any} 函数执行结果
 */
Function.prototype.myApply = function(context, args) {
  // 类型检查：确保调用者是函数
  if (typeof this !== 'function') {
    throw new TypeError('Function.prototype.myApply called on non-function');
  }

  // 处理 context：null/undefined 时指向全局对象
  context = context || globalThis;
  
  // 参数检查：args 必须是数组或类数组对象
  // 如果没有传参数或传入 null/undefined，则为空数组
  args = args || [];
  
  // 使用 Symbol 作为属性名，避免与原对象属性冲突
  const fnKey = Symbol('fn');
  context[fnKey] = this;
  
  // 关键步骤：展开参数数组传入函数
  // apply 和 call 的唯一区别就在这里
  const result = context[fnKey](...args);
  
  // 清理临时属性，不污染原对象
  delete context[fnKey];
  
  return result;
}