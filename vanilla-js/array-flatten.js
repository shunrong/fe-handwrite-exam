/**
 * 手写数组扁平化 (Array Flatten) 函数 - 前端面试高频题
 * 
 * 将多维数组转换为一维数组
 * 考察递归、栈、ES6语法等多种实现方式
 */

// 1. 递归实现 - 基础版本
function flattenRecursive(arr) {
  const result = [];
  
  for (let i = 0; i < arr.length; i++) {
    if (Array.isArray(arr[i])) {
      result.push(...flattenRecursive(arr[i]));
    } else {
      result.push(arr[i]);
    }
  }
  
  return result;
}

// 2. 递归实现 - 支持指定深度
function flattenRecursiveWithDepth(arr, depth = 1) {
  const result = [];
  
  for (let i = 0; i < arr.length; i++) {
    if (Array.isArray(arr[i]) && depth > 0) {
      result.push(...flattenRecursiveWithDepth(arr[i], depth - 1));
    } else {
      result.push(arr[i]);
    }
  }
  
  return result;
}

// 3. 迭代实现 - 使用栈
function flattenIterative(arr) {
  const stack = [...arr]; // 复制原数组作为栈
  const result = [];
  
  while (stack.length) {
    const next = stack.pop();
    
    if (Array.isArray(next)) {
      stack.push(...next); // 将数组元素展开后推入栈
    } else {
      result.push(next);
    }
  }
  
  return result.reverse(); // 因为用的是栈，需要反转结果
}

// 4. 使用 reduce 实现
function flattenReduce(arr) {
  return arr.reduce((acc, val) => {
    return acc.concat(Array.isArray(val) ? flattenReduce(val) : val);
  }, []);
}

// 5. 使用 toString + split 实现（仅适用于数字和字符串）
function flattenToString(arr) {
  return arr.toString().split(',').map(item => {
    // 尝试转换为数字，如果失败则保持字符串
    const num = Number(item);
    return isNaN(num) ? item : num;
  });
}

// 6. 使用 JSON 序列化实现
function flattenJSON(arr) {
  const str = JSON.stringify(arr);
  // 移除所有的 [ 和 ]
  const flatStr = str.replace(/\[|\]/g, '');
  
  try {
    // 重新构造数组
    return JSON.parse(`[${flatStr}]`);
  } catch (error) {
    throw new Error('Cannot flatten array containing non-JSON-serializable values');
  }
}

// 7. 使用生成器实现
function* flattenGenerator(arr) {
  for (const item of arr) {
    if (Array.isArray(item)) {
      yield* flattenGenerator(item);
    } else {
      yield item;
    }
  }
}

function flattenWithGenerator(arr) {
  return [...flattenGenerator(arr)];
}

// 8. 完整版本 - 支持多种选项
function flattenAdvanced(arr, options = {}) {
  const {
    depth = Infinity,           // 扁平化深度
    filterEmpty = false,        // 是否过滤空值
    unique = false,             // 是否去重
    transform = null            // 转换函数
  } = options;
  
  function flatten(array, currentDepth) {
    const result = [];
    
    for (let i = 0; i < array.length; i++) {
      let item = array[i];
      
      // 应用转换函数
      if (transform && typeof transform === 'function') {
        item = transform(item);
      }
      
      // 过滤空值
      if (filterEmpty && (item === null || item === undefined || item === '')) {
        continue;
      }
      
      if (Array.isArray(item) && currentDepth > 0) {
        result.push(...flatten(item, currentDepth - 1));
      } else {
        result.push(item);
      }
    }
    
    return result;
  }
  
  let result = flatten(arr, depth);
  
  // 去重
  if (unique) {
    result = [...new Set(result)];
  }
  
  return result;
}

// 9. 异步扁平化 - 处理包含 Promise 的数组
async function flattenAsync(arr) {
  const result = [];
  
  for (const item of arr) {
    if (Array.isArray(item)) {
      const flattened = await flattenAsync(item);
      result.push(...flattened);
    } else if (item && typeof item.then === 'function') {
      // 处理 Promise
      const resolved = await item;
      result.push(resolved);
    } else {
      result.push(item);
    }
  }
  
  return result;
}

// 10. 类型安全的扁平化（TypeScript风格）
function flattenTypeSafe(arr, typeCheck = null) {
  function isValidType(item) {
    if (!typeCheck) return true;
    
    switch (typeCheck) {
      case 'number':
        return typeof item === 'number' && !isNaN(item);
      case 'string':
        return typeof item === 'string';
      case 'boolean':
        return typeof item === 'boolean';
      case 'object':
        return typeof item === 'object' && item !== null;
      default:
        return typeof item === typeCheck;
    }
  }
  
  function flatten(array) {
    const result = [];
    
    for (const item of array) {
      if (Array.isArray(item)) {
        result.push(...flatten(item));
      } else if (isValidType(item)) {
        result.push(item);
      } else {
        console.warn(`Type mismatch: expected ${typeCheck}, got ${typeof item}`, item);
      }
    }
    
    return result;
  }
  
  return flatten(arr);
}

// 11. 性能优化版本 - 大数组处理
function flattenOptimized(arr, maxDepth = 100) {
  if (maxDepth <= 0) {
    throw new Error('Maximum flattening depth exceeded');
  }
  
  let result = arr;
  let depth = 0;
  
  while (depth < maxDepth) {
    let hasNestedArray = false;
    const newResult = [];
    
    for (let i = 0; i < result.length; i++) {
      if (Array.isArray(result[i])) {
        newResult.push(...result[i]);
        hasNestedArray = true;
      } else {
        newResult.push(result[i]);
      }
    }
    
    result = newResult;
    depth++;
    
    if (!hasNestedArray) {
      break; // 没有嵌套数组了，提前退出
    }
  }
  
  return result;
}

// 12. 自定义 Array.prototype.flat 实现
Array.prototype.myFlat = function(depth = 1) {
  const flatten = (arr, currentDepth) => {
    const result = [];
    
    for (const item of arr) {
      if (Array.isArray(item) && currentDepth > 0) {
        result.push(...flatten(item, currentDepth - 1));
      } else {
        result.push(item);
      }
    }
    
    return result;
  };
  
  return flatten(this, depth);
};

// 测试用例
console.log('=== 数组扁平化测试 ===\n');

// 测试数据
const testArrays = {
  simple: [1, [2, 3], [4, [5, 6]]],
  deep: [1, [2, [3, [4, [5]]]]],
  mixed: [1, 'a', [2, 'b', [3, 'c', [4, 'd']]]],
  empty: [1, [], [2, []], [3, [4, []]]],
  complex: [1, [2, 3], [4, [5, [6, 7]]], 8, [9, [10, [11, 12]]]],
  withNulls: [1, null, [2, undefined, [3, '', [4, false]]]],
  duplicates: [1, [1, 2], [2, [3, 3]], 1]
};

// 1. 基础递归测试
console.log('1. 基础递归测试：');
Object.entries(testArrays).forEach(([name, arr]) => {
  console.log(`${name}:`, flattenRecursive(arr));
});

// 2. 深度控制测试
console.log('\n2. 深度控制测试：');
console.log('深度1:', flattenRecursiveWithDepth(testArrays.deep, 1));
console.log('深度2:', flattenRecursiveWithDepth(testArrays.deep, 2));
console.log('深度3:', flattenRecursiveWithDepth(testArrays.deep, 3));

// 3. 不同实现方法对比
console.log('\n3. 不同实现方法对比：');
const testArray = [1, [2, 3], [4, [5, 6]]];

console.log('递归:', flattenRecursive(testArray));
console.log('迭代:', flattenIterative(testArray));
console.log('reduce:', flattenReduce(testArray));
console.log('生成器:', flattenWithGenerator(testArray));
console.log('toString:', flattenToString([1, [2, 3], [4, [5, 6]]])); // 只适用于数字

// 4. 高级选项测试
console.log('\n4. 高级选项测试：');
const advancedTest = [1, null, [2, '', [3, 1, [4, undefined]]], 1];

console.log('原数组:', advancedTest);
console.log('过滤空值:', flattenAdvanced(advancedTest, { filterEmpty: true }));
console.log('去重:', flattenAdvanced(advancedTest, { unique: true }));
console.log('深度2:', flattenAdvanced(advancedTest, { depth: 2 }));
console.log('转换+去重:', flattenAdvanced(advancedTest, {
  unique: true,
  filterEmpty: true,
  transform: (item) => typeof item === 'number' ? item * 2 : item
}));

// 5. 类型安全测试
console.log('\n5. 类型安全测试：');
const mixedArray = [1, 'a', [2, 'b', [3, true, [4.5, null]]]];
console.log('只保留数字:', flattenTypeSafe(mixedArray, 'number'));
console.log('只保留字符串:', flattenTypeSafe(mixedArray, 'string'));

// 6. 异步扁平化测试
console.log('\n6. 异步扁平化测试：');
async function testAsyncFlatten() {
  const asyncArray = [
    1,
    [Promise.resolve(2), 3],
    [4, [Promise.resolve(5), 6]]
  ];
  
  const result = await flattenAsync(asyncArray);
  console.log('异步扁平化结果:', result);
}

testAsyncFlatten();

// 7. 自定义 flat 方法测试
console.log('\n7. 自定义 flat 方法测试：');
const arr = [1, [2, [3, [4]]]];
console.log('myFlat():', arr.myFlat());
console.log('myFlat(2):', arr.myFlat(2));
console.log('myFlat(Infinity):', arr.myFlat(Infinity));

// 8. 边界情况测试
console.log('\n8. 边界情况测试：');
console.log('空数组:', flattenRecursive([]));
console.log('单元素:', flattenRecursive([1]));
console.log('嵌套空数组:', flattenRecursive([[], [[], []], []]));
console.log('深度嵌套:', flattenRecursive([[[[[1]]]]]));

// 性能测试
console.log('\n=== 性能测试 ===');
function generateNestedArray(depth, width) {
  if (depth === 0) return Math.floor(Math.random() * 100);
  
  const arr = [];
  for (let i = 0; i < width; i++) {
    arr.push(generateNestedArray(depth - 1, width));
  }
  return arr;
}

const largeNestedArray = generateNestedArray(5, 3); // 深度5，每层3个元素

console.log('测试大数组扁平化性能...');

console.time('递归方法');
flattenRecursive(largeNestedArray);
console.timeEnd('递归方法');

console.time('迭代方法');
flattenIterative(largeNestedArray);
console.timeEnd('迭代方法');

console.time('reduce方法');
flattenReduce(largeNestedArray);
console.timeEnd('reduce方法');

console.time('优化方法');
flattenOptimized(largeNestedArray);
console.timeEnd('优化方法');

// 与原生方法对比
if (Array.prototype.flat) {
  console.time('原生flat方法');
  largeNestedArray.flat(Infinity);
  console.timeEnd('原生flat方法');
}

// 总结
console.log('\n=== 数组扁平化总结 ===');
console.log('实现方法：');
console.log('1. 递归 - 最直观，易理解，但可能栈溢出');
console.log('2. 迭代 - 使用栈避免递归，性能较好');
console.log('3. reduce - 函数式编程风格，代码简洁');
console.log('4. toString - 简单但有类型限制');
console.log('5. 生成器 - 惰性求值，内存友好');
console.log('');
console.log('考虑因素：');
console.log('• 深度控制 - 是否需要限制扁平化深度');
console.log('• 类型处理 - 如何处理非数组元素');
console.log('• 性能优化 - 大数组的处理策略');
console.log('• 异常处理 - 循环引用、栈溢出等');
console.log('• 扩展功能 - 去重、过滤、转换等');
console.log('');
console.log('应用场景：');
console.log('• 数据处理 - 将嵌套的 API 响应扁平化');
console.log('• 配置合并 - 合并多层配置对象');
console.log('• 路由处理 - 扁平化路由配置');
console.log('• 权限树 - 将权限树扁平化为列表');
