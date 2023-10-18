/**
 * 手写 debounce 防抖函数
 */
function debounce(fn, wait) {
  let timer = null;
  return function () {
    let context = this;
    let args = arguments;
    
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    timer = setTimeout(() => {
      fn.apply(context, args);
    }, wait);
  }
}

// test
const resizeCb = function (event) {
  console.log(event);
}
// window.addEventListener('mousemove', resizeCb);
window.addEventListener('mousemove', debounce(resizeCb, 500));