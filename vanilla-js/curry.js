/**
 * 手写柯里化函数 (Curry) - 前端面试高频题
 * 
 * 柯里化：将接受多个参数的函数转换为接受单个参数的函数序列
 * 核心思想：参数复用、延迟执行、函数式编程
 */

// 1. 基础版本 - 固定参数个数
function curry(fn) {
  return function curried(...args) {
    // 如果参数个数足够，直接执行
    if (args.length >= fn.length) {
      return fn.apply(this, args);
    }
    
    // 否则返回新函数，继续收集参数
    return function(...nextArgs) {
      return curried.apply(this, args.concat(nextArgs));
    };
  };
}

// 2. 支持占位符的柯里化
function curryWithPlaceholder(fn, placeholder = '_') {
  return function curried(...args) {
    // 检查是否有足够的有效参数（非占位符）
    const validArgs = args.filter(arg => arg !== placeholder);
    
    if (validArgs.length >= fn.length && !args.includes(placeholder)) {
      return fn.apply(this, args);
    }
    
    return function(...nextArgs) {
      // 合并参数，用新参数替换占位符
      const mergedArgs = [];
      let nextArgIndex = 0;
      
      for (let i = 0; i < args.length; i++) {
        if (args[i] === placeholder && nextArgIndex < nextArgs.length) {
          mergedArgs[i] = nextArgs[nextArgIndex++];
        } else {
          mergedArgs[i] = args[i];
        }
      }
      
      // 添加剩余的新参数
      while (nextArgIndex < nextArgs.length) {
        mergedArgs.push(nextArgs[nextArgIndex++]);
      }
      
      return curried.apply(this, mergedArgs);
    };
  };
}

// 3. 支持任意参数个数的柯里化
function curryVariadic(fn, arity = fn.length) {
  return function curried(...args) {
    if (args.length >= arity) {
      return fn.apply(this, args);
    }
    
    return function(...nextArgs) {
      return curried.apply(this, args.concat(nextArgs));
    };
  };
}

// 4. 支持多种调用方式的柯里化
function curryAdvanced(fn, arity = fn.length) {
  return function curried(...args) {
    // 如果没有参数，返回原函数
    if (args.length === 0) {
      return curried;
    }
    
    // 如果参数足够，执行函数
    if (args.length >= arity) {
      return fn.apply(this, args);
    }
    
    // 返回继续柯里化的函数
    const partial = function(...nextArgs) {
      return curried.apply(this, args.concat(nextArgs));
    };
    
    // 保留原函数的一些属性
    partial.toString = () => `curried(${fn.name})`;
    partial.valueOf = () => fn;
    
    return partial;
  };
}

// 5. 无限柯里化（直到不传参数时执行）
function curryInfinite(fn) {
  const result = function(...args) {
    if (args.length === 0) {
      return fn.apply(this, result.args || []);
    }
    
    result.args = (result.args || []).concat(args);
    return result;
  };
  
  result.args = [];
  return result;
}

// 6. 支持默认值的柯里化
function curryWithDefaults(fn, defaults = {}) {
  return function curried(...args) {
    // 用默认值填充缺失的参数
    const fullArgs = [];
    for (let i = 0; i < fn.length; i++) {
      if (i < args.length) {
        fullArgs[i] = args[i];
      } else if (defaults.hasOwnProperty(i)) {
        fullArgs[i] = defaults[i];
      } else {
        // 参数不足，继续柯里化
        return function(...nextArgs) {
          return curried.apply(this, args.concat(nextArgs));
        };
      }
    }
    
    return fn.apply(this, fullArgs);
  };
}

// 测试用例
console.log('=== 柯里化函数测试 ===\n');

// 测试函数
function add(a, b, c, d) {
  return a + b + c + d;
}

function multiply(a, b, c) {
  return a * b * c;
}

// 1. 基础柯里化测试
console.log('1. 基础柯里化测试：');
const curriedAdd = curry(add);
console.log('curriedAdd(1)(2)(3)(4):', curriedAdd(1)(2)(3)(4)); // 10
console.log('curriedAdd(1, 2)(3, 4):', curriedAdd(1, 2)(3, 4)); // 10
console.log('curriedAdd(1)(2, 3, 4):', curriedAdd(1)(2, 3, 4)); // 10

// 2. 占位符测试
console.log('\n2. 占位符柯里化测试：');
const curriedMul = curryWithPlaceholder(multiply);
console.log('curriedMul(2, _, 4)(3):', curriedMul(2, '_', 4)(3)); // 24
console.log('curriedMul(_, 3, _)(2)(4):', curriedMul('_', 3, '_')(2)(4)); // 24

// 3. 任意参数个数测试
console.log('\n3. 任意参数个数测试：');
const curriedSum = curryVariadic(add, 3); // 只需要3个参数
console.log('curriedSum(1)(2)(3):', curriedSum(1)(2)(3)); // 6

// 4. 无限柯里化测试
console.log('\n4. 无限柯里化测试：');
function sum(...args) {
  return args.reduce((a, b) => a + b, 0);
}

const infiniteSum = curryInfinite(sum);
infiniteSum(1)(2)(3);
infiniteSum(4)(5);
console.log('infiniteSum():', infiniteSum()); // 15

// 5. 实际应用场景
console.log('\n5. 实际应用场景：');

// 场景1：配置函数
function apiRequest(method, url, data) {
  return `${method.toUpperCase()} ${url} with data: ${JSON.stringify(data)}`;
}

const curriedApi = curry(apiRequest);
const get = curriedApi('GET');
const postToUsers = curriedApi('POST')('/api/users');

console.log('GET请求:', get('/api/posts')({ page: 1 }));
console.log('POST请求:', postToUsers({ name: 'John' }));

// 场景2：事件处理
function handleEvent(eventType, element, callback) {
  console.log(`绑定 ${eventType} 事件到`, element, '执行:', callback.name);
}

const curriedEvent = curry(handleEvent);
const onClick = curriedEvent('click');
const onClickButton = onClick('button');

onClickButton(function saveData() { return 'save'; });

// 场景3：数据处理管道
function filter(predicate, array) {
  return array.filter(predicate);
}

function map(transform, array) {
  return array.map(transform);
}

const curriedFilter = curry(filter);
const curriedMap = curry(map);

const isEven = x => x % 2 === 0;
const double = x => x * 2;

const filterEvens = curriedFilter(isEven);
const doubleValues = curriedMap(double);

const numbers = [1, 2, 3, 4, 5, 6];
console.log('\n数据处理管道：');
console.log('原数组:', numbers);
console.log('过滤偶数:', filterEvens(numbers));
console.log('双倍值:', doubleValues(filterEvens(numbers)));

// 性能对比
console.log('\n=== 性能测试 ===');
function performanceTest() {
  const iterations = 100000;
  
  // 原函数
  console.time('原函数调用');
  for (let i = 0; i < iterations; i++) {
    add(1, 2, 3, 4);
  }
  console.timeEnd('原函数调用');
  
  // 柯里化函数
  console.time('柯里化函数调用');
  for (let i = 0; i < iterations; i++) {
    curriedAdd(1, 2, 3, 4);
  }
  console.timeEnd('柯里化函数调用');
}

performanceTest();

// 总结
console.log('\n=== 柯里化总结 ===');
console.log('优点：');
console.log('1. 参数复用 - 可以预设部分参数');
console.log('2. 延迟执行 - 可以在合适时机执行');
console.log('3. 函数组合 - 便于函数式编程');
console.log('4. 代码复用 - 创建专用函数');
console.log('\n缺点：');
console.log('1. 性能开销 - 创建额外的闭包');
console.log('2. 调试困难 - 嵌套函数难以追踪');
console.log('3. 内存占用 - 保存中间状态');
