/**
 * 手写类型判断函数
 */
function getType(val) {
  // null
  if (val === null) {
    return 'null';
  }

  // 引用类型 '[Object Array]'
  if (typeof val === 'object') {
    let typeStr = Object.prototype.toString.call(val);
    return typeStr.split(' ')[1].slice(0, -1).toLowerCase();
  }

  // 基本类型
  return typeof val;
}

console.log(getType([1, 2]));
console.log(getType(true));
console.log(getType(null));
console.log(getType(12));
