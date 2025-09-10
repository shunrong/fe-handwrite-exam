/**
 * 手写 throttle 节流函数 - 完整版
 */

// 1. 时间戳方案（第一次立即执行，最后一次可能不执行）
function throttleTimestamp(fn, wait) {
  let previous = 0;
  return function throttled(...args) {
    const context = this;
    const now = Date.now();
    
    if (now - previous >= wait) {
      previous = now;
      return fn.apply(context, args);
    }
  };
}

// 2. 定时器方案（第一次延迟执行，最后一次一定执行）
function throttleTimer(fn, wait) {
  let timer = null;
  return function throttled(...args) {
    const context = this;
    
    if (!timer) {
      timer = setTimeout(() => {
        fn.apply(context, args);
        timer = null;
      }, wait);
    }
  };
}

// 3. 完整版节流（结合时间戳和定时器，首次和末次都执行）
function throttle(fn, wait, options = {}) {
  let timer = null;
  let previous = 0;
  
  const { leading = true, trailing = true } = options;
  
  return function throttled(...args) {
    const context = this;
    const now = Date.now();
    
    // 如果不需要首次执行，重置 previous
    if (!previous && !leading) {
      previous = now;
    }
    
    // 距离下次执行的剩余时间
    const remaining = wait - (now - previous);
    
    if (remaining <= 0 || remaining > wait) {
      // 可以执行
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
      previous = now;
      fn.apply(context, args);
    } else if (!timer && trailing) {
      // 设置定时器，保证最后一次执行
      timer = setTimeout(() => {
        previous = leading ? Date.now() : 0;
        timer = null;
        fn.apply(context, args);
      }, remaining);
    }
  };
}

// 4. 带取消功能的节流
function throttleWithCancel(fn, wait, options = {}) {
  let timer = null;
  let previous = 0;
  
  const { leading = true, trailing = true } = options;
  
  function throttled(...args) {
    const context = this;
    const now = Date.now();
    
    if (!previous && !leading) {
      previous = now;
    }
    
    const remaining = wait - (now - previous);
    
    if (remaining <= 0 || remaining > wait) {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
      previous = now;
      fn.apply(context, args);
    } else if (!timer && trailing) {
      timer = setTimeout(() => {
        previous = leading ? Date.now() : 0;
        timer = null;
        fn.apply(context, args);
      }, remaining);
    }
  }
  
  // 取消节流
  throttled.cancel = function() {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    previous = 0;
  };
  
  return throttled;
}

// test
const resizeCb = function (event) {
  console.log(event);
}
// window.addEventListener('mousemove', resizeCb);
window.addEventListener('mousemove', throttle(resizeCb, 500));