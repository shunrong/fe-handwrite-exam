/**
 * 手写 throttle 节流函数
 */
// 时间戳方案
function throttle(fn, wait) {
  let currTime = Date.now();
  return function () {
    let context = this;
    let args = arguments;
    let nowTime = Date.now();

    if (nowTime - currTime >= wait) {
      currTime = Date.now();
      return fn.apply(context, args);
    }
  }
}

// 计时器方案
function throttle2(fn, wait) {
  let timer = null;
  return function () {
    let context = this;
    let args = arguments;
    if(!timer) {
      timer = setTimeout(function() {
        fn.apply(context, args);
        clearTimeout(timer);
        timer = null;
      }, wait)
    }
  }
}

// test
const resizeCb = function (event) {
  console.log(event);
}
// window.addEventListener('mousemove', resizeCb);
window.addEventListener('mousemove', throttle(resizeCb, 500));