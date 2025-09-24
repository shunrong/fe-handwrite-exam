/**
 * 手写实现 new 操作符 - 深度解析版
 * 
 * 核心理解：new 是语法糖，我们用函数来模拟
 * 语法对比：new Constructor(args) ↔ myNew(Constructor, args)
 * 
 * new 操作符的完整执行步骤：
 * 1. 参数校验：确保传入正确的构造函数
 * 2. 创建新对象：一个全新的空对象
 * 3. 设置原型链：obj.__proto__ = Constructor.prototype（继承的灵魂）
 * 4. 执行构造函数：将 this 绑定到新对象并执行
 * 5. 返回值判断：只有对象类型的返回值才会覆盖默认实例
 * 
 * 原型链查找机制：
 * obj.method() → obj自身 → obj.__proto__ → Constructor.prototype → Object.prototype → null
 */

// 基础版本 - 核心实现
function myNew(constructor, ...args) {
  // 1. 参数校验：确保传入的是构造函数
  if (typeof constructor !== 'function') {
    throw new TypeError(`${constructor} is not a constructor`);
  }

  // 2. 创建新对象并设置原型链 - 继承的灵魂
  // Object.create() 等价于：obj.__proto__ = constructor.prototype
  const obj = Object.create(constructor.prototype);
  
  // 3. 执行构造函数，将 this 绑定到新对象
  const result = constructor.apply(obj, args);
  
  // 4. 返回值判断 - 只有对象类型才会覆盖实例
  // 优雅写法：利用 ?? 操作符和对象判断函数
  return isObjectType(result) ? result : obj;
}

// 更优雅的对象类型判断函数
function isObjectType(value) {
  // null 虽然 typeof 为 'object'，但不是真正的对象
  // 函数也是对象类型，应该被包含
  return (typeof value === 'object' && value !== null) || typeof value === 'function';
}

// 教学版本 - 展示原型设置的多种方式
function myNewEducational(constructor, ...args) {
  // 1. 类型检查
  if (typeof constructor !== 'function') {
    throw new TypeError(`${constructor} is not a constructor`);
  }

  // 2. 创建新对象的三种方式对比（性能从高到低）
  console.log('=== 原型设置方式对比 ===');
  
  // 方式1: Object.create() - 推荐，性能最佳
  const obj1 = Object.create(constructor.prototype);
  console.log('Object.create():', obj1.__proto__ === constructor.prototype);
  
  // 方式2: 手动设置 __proto__ - 等价但不推荐
  const obj2 = {};
  obj2.__proto__ = constructor.prototype;
  console.log('__proto__ 赋值:', obj2.__proto__ === constructor.prototype);
  
  // 方式3: setPrototypeOf() - 性能最差
  const obj3 = {};
  Object.setPrototypeOf(obj3, constructor.prototype);
  console.log('setPrototypeOf():', obj3.__proto__ === constructor.prototype);
  
  // 使用推荐方式
  const obj = obj1;

  // 3. 执行构造函数 - 异常处理
  let result;
  try {
    result = constructor.apply(obj, args);
  } catch (error) {
    // 构造函数异常应该正确传播，不返回半成品对象
    console.log('构造函数执行异常:', error.message);
    throw error;
  }

  // 4. 返回值判断 - 使用专门的判断函数
  console.log('构造函数返回值:', result, '类型:', typeof result);
  return isObjectType(result) ? result : obj;
}

// 高级版本 - 支持箭头函数检测和边界情况处理
function myNewAdvanced(constructor, ...args) {
  if (typeof constructor !== 'function') {
    throw new TypeError(`${constructor} is not a constructor`);
  }

  // 核心判断：函数必须有 prototype 属性才能作为构造函数
  // 这个判断会自动排除：箭头函数、Method简写、Class方法、bind函数、async函数等
  // 不是因为它们的类型，而是因为它们没有构造能力（无 prototype）
  if (!('prototype' in constructor)) {
    throw new TypeError(`${constructor.name || 'Anonymous'} is not a constructor`);
  }

  // 注意：不需要排除内置构造函数！
  // String, Number, Array 等都是合法的构造函数
  // 只有 Math, JSON, Symbol, BigInt 等没有 prototype 或有特殊行为

  const obj = Object.create(constructor.prototype);
  const result = constructor.apply(obj, args);
  
  // 使用统一的对象类型判断
  return isObjectType(result) ? result : obj;
}

// 更多优雅的返回值判断方式
const isObjectTypeAlternatives = {
  // 方式1: 基础版本（当前使用）
  basic: (value) => (typeof value === 'object' && value !== null) || typeof value === 'function',
  
  // 方式2: 使用 instanceof（但无法判断 null）
  instanceof: (value) => value instanceof Object,
  
  // 方式3: 使用 Object() 构造函数
  objectConstructor: (value) => Object(value) === value && value !== null,
  
  // 方式4: 使用 toString 判断（最精确但性能差）
  toString: (value) => {
    const type = Object.prototype.toString.call(value);
    return type === '[object Object]' || 
           type === '[object Array]' || 
           type === '[object Function]' || 
           type.startsWith('[object ') && !type.includes('Null');
  }
};

// 推荐使用：基础版本，性能好且逻辑清晰
const isObjectType = isObjectTypeAlternatives.basic;

// ===== 面试测试用例 =====

// 测试用构造函数
function Person(name, age) {
  this.name = name;
  this.age = age;
}

// 在原型上添加方法
Person.prototype.sayHello = function() {
  return `Hello, I'm ${this.name}`;
};

// 返回对象的构造函数
function PersonWithObjectReturn(name) {
  this.name = name;
  return { customName: name, type: 'custom' };
}

// 返回基本类型的构造函数
function PersonWithPrimitiveReturn(name) {
  this.name = name;
  return 'ignored string';
}

// 箭头函数（应该报错）
const ArrowFunction = (name) => {
  this.name = name;
};

// bind 返回的函数（应该报错）
const BoundFunction = function(name) {
  this.name = name;
}.bind({});

// 不能作为构造函数的内置对象
const NonConstructors = [Math, JSON];

console.log('=== myNew 测试 ===');

// 1. 基本功能测试
console.log('\n1. 基本功能测试:');
const p1 = myNew(Person, 'Alice', 25);
console.log('实例:', p1);
console.log('原型方法:', p1.sayHello());
console.log('instanceof:', p1 instanceof Person);

// 2. 对象返回值测试
console.log('\n2. 对象返回值测试:');
const p2 = myNew(PersonWithObjectReturn, 'Bob');
console.log('返回自定义对象:', p2);
console.log('不是 Person 实例:', p2 instanceof Person);

// 3. 基本类型返回值测试
console.log('\n3. 基本类型返回值测试:');
const p3 = myNew(PersonWithPrimitiveReturn, 'Charlie');
console.log('忽略基本类型返回值:', p3);
console.log('是 Person 实例:', p3 instanceof Person);

// 4. 错误处理测试
console.log('\n4. 错误处理测试:');
try {
  myNew('not a function');
} catch (e) {
  console.log('类型错误:', e.message);
}

try {
  myNew(ArrowFunction, 'David');
} catch (e) {
  console.log('箭头函数错误:', e.message);
}

try {
  myNew(BoundFunction, 'Eve');
} catch (e) {
  console.log('bind函数错误:', e.message);
}

// 测试内置构造函数（应该成功）
console.log('\n6. 内置构造函数测试（应该成功）:');
const str = myNew(String, 'hello');
const num = myNew(Number, 42);
const arr = myNew(Array, 1, 2, 3);
console.log('String实例:', str, typeof str);
console.log('Number实例:', num, typeof num);
console.log('Array实例:', arr, Array.isArray(arr));

// 5. 对比原生 new
console.log('\n5. 与原生 new 对比:');
const native = new Person('Native', 30);
const custom = myNew(Person, 'Custom', 30);
console.log('原生 new:', native);
console.log('自定义 myNew:', custom);
console.log('结构相同:', JSON.stringify(native) === JSON.stringify(custom));
