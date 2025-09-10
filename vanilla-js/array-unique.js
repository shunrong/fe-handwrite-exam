/**
 * 数组去重 - 前端面试必考题
 * 多种实现方法对比
 */

// 测试数据
const testArray = [1, 2, 2, 3, 4, 4, 5, '5', 'a', 'a', true, true, false, undefined, undefined, null, null, NaN, NaN];

console.log('原数组:', testArray);
console.log('=== 数组去重方法对比 ===\n');

// 1. ES6 Set 方法（最简洁，但 NaN 会被正确去重）
function uniqueBySet(arr) {
  return [...new Set(arr)];
}
console.log('1. Set方法:', uniqueBySet(testArray));

// 2. indexOf 方法（简单但对 NaN 处理有问题）
function uniqueByIndexOf(arr) {
  const result = [];
  for (let i = 0; i < arr.length; i++) {
    if (result.indexOf(arr[i]) === -1) {
      result.push(arr[i]);
    }
  }
  return result;
}
console.log('2. indexOf方法:', uniqueByIndexOf(testArray));

// 3. includes 方法（比 indexOf 稍好）
function uniqueByIncludes(arr) {
  const result = [];
  for (let i = 0; i < arr.length; i++) {
    if (!result.includes(arr[i])) {
      result.push(arr[i]);
    }
  }
  return result;
}
console.log('3. includes方法:', uniqueByIncludes(testArray));

// 4. filter + indexOf 方法
function uniqueByFilter(arr) {
  return arr.filter((item, index) => arr.indexOf(item) === index);
}
console.log('4. filter+indexOf方法:', uniqueByFilter(testArray));

// 5. reduce 方法
function uniqueByReduce(arr) {
  return arr.reduce((acc, current) => {
    if (!acc.includes(current)) {
      acc.push(current);
    }
    return acc;
  }, []);
}
console.log('5. reduce方法:', uniqueByReduce(testArray));

// 6. Map 方法（性能较好）
function uniqueByMap(arr) {
  const map = new Map();
  const result = [];
  
  for (let i = 0; i < arr.length; i++) {
    if (!map.has(arr[i])) {
      map.set(arr[i], true);
      result.push(arr[i]);
    }
  }
  return result;
}
console.log('6. Map方法:', uniqueByMap(testArray));

// 7. Object 键值方法（有类型转换问题）
function uniqueByObject(arr) {
  const obj = {};
  const result = [];
  
  for (let i = 0; i < arr.length; i++) {
    const key = typeof arr[i] + arr[i]; // 避免类型转换问题
    if (!obj[key]) {
      obj[key] = true;
      result.push(arr[i]);
    }
  }
  return result;
}
console.log('7. Object方法:', uniqueByObject(testArray));

// 8. 双重循环方法（最基础，性能最差）
function uniqueByLoop(arr) {
  const result = [];
  
  for (let i = 0; i < arr.length; i++) {
    let isDuplicate = false;
    for (let j = 0; j < result.length; j++) {
      // 使用 Object.is 处理 NaN
      if (Object.is(arr[i], result[j])) {
        isDuplicate = true;
        break;
      }
    }
    if (!isDuplicate) {
      result.push(arr[i]);
    }
  }
  return result;
}
console.log('8. 双重循环方法:', uniqueByLoop(testArray));

// 9. 对象数组去重（按指定字段）
function uniqueObjectArray(arr, key) {
  const seen = new Set();
  return arr.filter(item => {
    const keyValue = item[key];
    if (seen.has(keyValue)) {
      return false;
    }
    seen.add(keyValue);
    return true;
  });
}

// 测试对象数组去重
const objArray = [
  { id: 1, name: '张三' },
  { id: 2, name: '李四' },
  { id: 1, name: '张三' },
  { id: 3, name: '王五' },
  { id: 2, name: '李四' }
];
console.log('\n=== 对象数组去重（按id） ===');
console.log('原数组:', objArray);
console.log('去重后:', uniqueObjectArray(objArray, 'id'));

// 10. 多字段对象去重
function uniqueObjectArrayByMultipleFields(arr, fields) {
  const seen = new Set();
  return arr.filter(item => {
    const key = fields.map(field => item[field]).join('|');
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

const multiFieldArray = [
  { id: 1, name: '张三', age: 20 },
  { id: 1, name: '张三', age: 21 },
  { id: 1, name: '张三', age: 20 },
  { id: 2, name: '李四', age: 22 }
];
console.log('\n=== 对象数组去重（按id+name+age） ===');
console.log('原数组:', multiFieldArray);
console.log('去重后:', uniqueObjectArrayByMultipleFields(multiFieldArray, ['id', 'name', 'age']));

// 性能测试
console.log('\n=== 性能测试 ===');
const largeArray = Array.from({ length: 10000 }, () => Math.floor(Math.random() * 1000));

function performanceTest(fn, name, arr) {
  const start = performance.now();
  fn(arr);
  const end = performance.now();
  console.log(`${name}: ${(end - start).toFixed(2)}ms`);
}

performanceTest(uniqueBySet, 'Set方法', largeArray);
performanceTest(uniqueByMap, 'Map方法', largeArray);
performanceTest(uniqueByIncludes, 'includes方法', largeArray);
performanceTest(uniqueByFilter, 'filter方法', largeArray);

// 总结
console.log('\n=== 方法总结 ===');
console.log('1. Set方法: 最简洁，性能好，正确处理NaN');
console.log('2. Map方法: 性能好，逻辑清晰');
console.log('3. filter+indexOf: 简洁但对NaN处理有问题');
console.log('4. includes方法: 正确处理NaN但性能一般');
console.log('5. Object方法: 需要处理类型转换问题');
console.log('6. 双重循环: 最基础但性能最差');
console.log('推荐: 优先使用Set方法，对象数组用Map或Set处理');
