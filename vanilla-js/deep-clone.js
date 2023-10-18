/**
 * 手写深拷贝
 */
function deepClone(source) {
  if (typeof source !== 'object' || source === null) return source;
  let result;
  if (Array.isArray(source)) {
    result = [];
    for (let i = 0; i < source.length; i++) {
      result[i] = deepClone(source[i]);
    }
    return result;
  } else {
    result = {};
    for (let prop in source) {
      result[prop] = deepClone(source[prop])
    }
    return result;
  }

}

let arr = [1, 2, 3, 4, 5];
let arr1 = deepClone(arr);

let obj = { name: 'tom', age: 13, male: true }
let obj1 = deepClone(obj);
