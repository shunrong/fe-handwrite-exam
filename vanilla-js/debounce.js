/**
 * 手写 debounce 防抖函数 - 完整版
 * @param {Function} fn 要防抖的函数
 * @param {number} wait 延迟时间
 * @param {boolean} immediate 是否立即执行
 */
function debounce(fn, wait, immediate = false) {
  let timer = null;
  return function debounced(...args) {
    const context = this;
    
    // 如果已有定时器，清除它
    if (timer) {
      clearTimeout(timer);
    }
    
    if (immediate) {
      // 立即执行模式：第一次调用立即执行，后续调用需要等待
      const callNow = !timer;
      timer = setTimeout(() => {
        timer = null;
      }, wait);
      
      if (callNow) {
        return fn.apply(context, args);
      }
    } else {
      // 延迟执行模式：每次调用都重新开始计时
      timer = setTimeout(() => {
        fn.apply(context, args);
      }, wait);
    }
  };
}

// 带取消功能的防抖
function debounceWithCancel(fn, wait, immediate = false) {
  let timer = null;
  
  function debounced(...args) {
    const context = this;
    
    if (timer) {
      clearTimeout(timer);
    }
    
    if (immediate) {
      const callNow = !timer;
      timer = setTimeout(() => {
        timer = null;
      }, wait);
      
      if (callNow) {
        return fn.apply(context, args);
      }
    } else {
      timer = setTimeout(() => {
        fn.apply(context, args);
      }, wait);
    }
  }
  
  // 取消防抖
  debounced.cancel = function() {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
  };
  
  return debounced;
}

// test
const resizeCb = function (event) {
  console.log(event);
}
// window.addEventListener('mousemove', resizeCb);
window.addEventListener('mousemove', debounce(resizeCb, 500));