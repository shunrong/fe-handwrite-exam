/**
 * 手写实现 call 方法
 * 
 * 核心原理：利用对象方法调用时 this 的绑定规律
 * 当函数作为对象的方法被调用时，函数内的 this 会指向那个对象
 * 
 * 实现步骤：
 * 1. 把要执行的函数临时添加为 context 的属性
 * 2. 通过对象方法调用的方式执行函数
 * 3. 删除临时属性，避免污染原对象
 * 
 * @param {Object} context 指定的 this 上下文
 * @param {...any} args 函数执行时的参数
 * @returns {any} 函数执行结果
 */
Function.prototype.myCall = function(context, ...args) {
  // 类型检查：确保调用者是函数
  // 防止通过 call/apply 等方式调用时 this 不是函数的情况
  if (typeof this !== 'function') {
    throw new TypeError('Function.prototype.myCall called on non-function');
  }

  // 处理 context：null/undefined 时指向全局对象
  // 注意：严格模式下应该保持 null/undefined，这里简化处理
  context = context || globalThis;
  
  // 使用 Symbol 作为属性名，避免与原对象属性冲突
  const fnKey = Symbol('fn');
  context[fnKey] = this;
  
  // 通过对象方法调用，此时函数内 this 指向 context
  const result = context[fnKey](...args);
  
  // 清理临时属性，不污染原对象
  delete context[fnKey];
  
  return result;
}