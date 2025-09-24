/**
 * 手写实现 bind 方法
 * 
 * 核心原理：返回一个绑定了 this 和预设参数的新函数
 * bind 比 call/apply 复杂的原因：
 * 1. 延迟执行 - 不立即调用，而是返回新函数
 * 2. 参数预设 - 支持分步传参（柯里化）
 * 3. 构造函数调用 - 作为构造函数时忽略 this 绑定
 * 
 * 实现要点：
 * 1. 保存原函数引用，避免 this 指向混乱
 * 2. 判断是否作为构造函数调用（new 操作符）
 * 3. 合并预设参数和调用时参数
 * 4. 不依赖原生 apply，使用自己的实现逻辑
 * 
 * @param {Object} context 绑定的 this 上下文
 * @param {...any} args 预设的参数
 * @returns {Function} 绑定后的新函数
 */
Function.prototype.myBind = function(context, ...args) {
  // 类型检查：确保调用者是函数
  if (typeof this !== 'function') {
    throw new TypeError('Function.prototype.myBind called on non-function');
  }

  // 保存原函数引用 - 关键步骤！
  // 在返回的函数中，this 的指向会改变，所以必须提前保存
  const fn = this;
  
  // 返回绑定后的新函数
  return function Fn() {
    // 判断调用方式：构造函数调用 vs 普通调用
    // new Fn() 时：this instanceof Fn 为 true，应该忽略绑定的 context
    // 普通调用时：this instanceof Fn 为 false，使用绑定的 context
    const targetContext = this instanceof Fn ? this : context;
    
    // 合并参数：预设参数 + 调用时参数
    const allArgs = args.concat(...arguments);
    
    // 不使用原生 apply，手动实现调用逻辑
    // 处理 context
    const finalContext = targetContext || globalThis;
    
    // 使用 Symbol 避免属性名冲突
    const fnKey = Symbol('fn');
    finalContext[fnKey] = fn;
    
    // 执行函数
    const result = finalContext[fnKey](...allArgs);
    
    // 清理临时属性
    delete finalContext[fnKey];
    
    return result;
  };
}