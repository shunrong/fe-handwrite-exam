/**
 * 手写 throttle 节流函数 - 现代简化版
 * 
 * 核心原理：限制执行频率，固定时间间隔执行
 * - 立即模式：第一次调用立即执行
 * - 延迟模式：等待间隔后执行
 * - 有定时器时拒绝执行，无定时器时开启新轮次
 * 
 * @param {Function} fn 要节流的函数
 * @param {Object} options 配置选项
 * @param {number} options.wait 时间间隔，默认 500ms
 * @param {boolean} options.immediate 是否立即执行，默认 false
 * @returns {Function} 节流后的函数
 */
const throttle = (fn, options = {}) => {
  const { wait = 500, immediate = false } = options;
  let timer = null;
  
  // 返回的函数必须用 function，保持 this 绑定
  return function(...args) {
    // 核心：有定时器就拒绝执行
    if (timer) return;
    
    timer = setTimeout(() => {
      // 延迟模式：间隔结束时执行
      if (!immediate) {
        fn.apply(this, args);
      }
      timer = null;  // 重置状态，开放下次执行
    }, wait);
    
    // 立即模式：间隔开始时执行
    if (immediate) {
      return fn.apply(this, args);
    }
  };
};

// 带取消功能的节流 - 增强版
const throttleWithCancel = (fn, options = {}) => {
  const { wait = 500, immediate = false } = options;
  let timer = null;
  
  const throttled = function(...args) {
    if (timer) return;
    
    timer = setTimeout(() => {
      if (!immediate) {
        fn.apply(this, args);
      }
      timer = null;
    }, wait);
    
    if (immediate) {
      return fn.apply(this, args);
    }
  };
  
  // 取消节流
  throttled.cancel = () => {
    clearTimeout(timer);
    timer = null;
  };
  
  // 立即执行（跳过节流）
  throttled.flush = function(...args) {
    clearTimeout(timer);
    timer = null;
    return fn.apply(this, args);
  };
  
  return throttled;
};

// 时间戳版本（备选方案）- 适合需要精确时间控制的场景
const throttleTimestamp = (fn, wait) => {
  let previous = 0;
  
  return function(...args) {
    const now = Date.now();
    if (now - previous >= wait) {
      previous = now;
      return fn.apply(this, args);
    }
  };
};

// ===== 使用示例 =====

// 滚动性能优化
const handleScroll = function() {
  console.log('更新导航栏状态');
};
// 立即模式：滚动立即响应，每 100ms 最多执行一次
window.addEventListener('scroll', throttle(handleScroll, { wait: 100, immediate: true }));

// 鼠标移动事件
const handleMouseMove = function(e) {
  console.log('鼠标位置:', e.clientX, e.clientY);
};
// 延迟模式：每 50ms 最多执行一次
document.addEventListener('mousemove', throttle(handleMouseMove, { wait: 50 }));

// 按钮防抖点击
const handleButtonClick = function() {
  console.log('API 请求');
};
// 立即模式：第一次点击立即执行，1秒内忽略后续点击
document.getElementById('api-btn')?.addEventListener('click', 
  throttle(handleButtonClick, { wait: 1000, immediate: true }));

// 窗口缩放节流
const handleResize = function() {
  console.log('重新计算布局大小');
};
// 使用时间戳版本，精确控制间隔
window.addEventListener('resize', throttleTimestamp(handleResize, 200));