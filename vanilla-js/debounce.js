/**
 * 手写 debounce 防抖函数 - 现代简化版
 * 
 * 核心原理：延迟执行，频繁触发时重新计时
 * - 立即模式：wait 开始时执行
 * - 延迟模式：wait 结束时执行  
 * - 中间调用会不断推迟 wait 时间
 * 
 * @param {Function} fn 要防抖的函数
 * @param {Object} options 配置选项
 * @param {number} options.wait 延迟时间，默认 500ms
 * @param {boolean} options.immediate 是否立即执行，默认 false
 * @returns {Function} 防抖后的函数
 */
const debounce = (fn, options = {}) => {
  const { wait = 500, immediate = false } = options;
  let timer = null;
  
  // 返回的函数必须用 function，保持 this 绑定
  return function(...args) {
    const callNow = immediate && !timer;
    
    // 核心：每次调用都重置等待时间
    clearTimeout(timer);
    
    timer = setTimeout(() => {
      timer = null;
      // 延迟模式：wait 结束时执行
      if (!immediate) {
        fn.apply(this, args);
      }
    }, wait);
    
    // 立即模式：wait 开始时执行
    if (callNow) {
      return fn.apply(this, args);
    }
  };
};

// 带取消功能的防抖 - 增强版
const debounceWithCancel = (fn, options = {}) => {
  const { wait = 500, immediate = false } = options;
  let timer = null;
  
  const debounced = function(...args) {
    const callNow = immediate && !timer;
    
    clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      if (!immediate) {
        fn.apply(this, args);
      }
    }, wait);
    
    if (callNow) {
      return fn.apply(this, args);
    }
  };
  
  // 取消防抖
  debounced.cancel = () => {
    clearTimeout(timer);
    timer = null;
  };
  
  // 立即执行（跳过防抖）
  debounced.flush = function(...args) {
    clearTimeout(timer);
    timer = null;
    return fn.apply(this, args);
  };
  
  return debounced;
};

// ===== 使用示例 =====

// 搜索框防抖
const searchInput = document.getElementById('search');
const handleSearch = function(e) {
  console.log('搜索:', this.value);
};
// 延迟模式：停止输入 300ms 后搜索
searchInput?.addEventListener('input', debounce(handleSearch, { wait: 300 }));

// 按钮防重复点击
const submitBtn = document.getElementById('submit');
const handleSubmit = function() {
  console.log('提交表单');
};
// 立即模式：第一次点击立即执行，1秒内忽略后续点击
submitBtn?.addEventListener('click', debounce(handleSubmit, { wait: 1000, immediate: true }));

// 窗口缩放防抖
const handleResize = function() {
  console.log('重新计算布局');
};
window.addEventListener('resize', debounce(handleResize, { wait: 100 }));