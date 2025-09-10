/**
 * 手写类型判断函数 - 完整版
 * 精确判断 JavaScript 中所有数据类型
 */

// 1. 基础版本 - 使用 Object.prototype.toString
function getType(val) {
  const type = Object.prototype.toString.call(val);
  return type.slice(8, -1).toLowerCase();
}

// 2. 增强版本 - 处理更多类型
function getTypeAdvanced(val) {
  // null 和 undefined 特殊处理
  if (val === null) return 'null';
  if (val === undefined) return 'undefined';
  
  // 基本类型
  const primitiveType = typeof val;
  if (primitiveType !== 'object') {
    return primitiveType;
  }

  // 对象类型，使用 toString 精确判断
  const objectType = Object.prototype.toString.call(val);
  const type = objectType.slice(8, -1).toLowerCase();
  
  // 特殊情况处理
  if (type === 'object') {
    // 判断是否为纯对象
    if (val.constructor === Object || val.constructor === undefined) {
      return 'object';
    }
    // 自定义构造函数创建的对象
    return 'instance';
  }
  
  return type;
}

// 3. 完整版本 - 包含所有可能的类型检测
function getTypeComplete(val) {
  // 特殊值处理
  if (val === null) return 'null';
  if (val === undefined) return 'undefined';
  if (Number.isNaN(val)) return 'nan';
  
  // 基本类型
  const primitiveType = typeof val;
  if (primitiveType !== 'object' && primitiveType !== 'function') {
    return primitiveType;
  }
  
  // 函数类型细分
  if (primitiveType === 'function') {
    if (val.constructor === Function) return 'function';
    if (val.constructor === GeneratorFunction) return 'generatorfunction';
    if (val.constructor === AsyncFunction) return 'asyncfunction';
    return 'function';
  }
  
  // 对象类型详细判断
  const tag = Object.prototype.toString.call(val);
  const type = tag.slice(8, -1).toLowerCase();
  
  // 特殊对象类型
  switch (type) {
    case 'object':
      // 判断是否为纯对象
      if (val.__proto__ === Object.prototype || val.__proto__ === null) {
        return 'object';
      }
      // 检查是否为类实例
      if (val.constructor && val.constructor !== Object) {
        return 'instance';
      }
      return 'object';
    case 'array':
      return 'array';
    case 'date':
      return 'date';
    case 'regexp':
      return 'regexp';
    case 'error':
      return 'error';
    case 'promise':
      return 'promise';
    default:
      return type;
  }
}

// 4. 类型检测工具集
const TypeChecker = {
  // 基础类型检测
  isString: (val) => typeof val === 'string',
  isNumber: (val) => typeof val === 'number' && !Number.isNaN(val),
  isBoolean: (val) => typeof val === 'boolean',
  isFunction: (val) => typeof val === 'function',
  isUndefined: (val) => typeof val === 'undefined',
  isSymbol: (val) => typeof val === 'symbol',
  isBigInt: (val) => typeof val === 'bigint',
  
  // 特殊值检测
  isNull: (val) => val === null,
  isNaN: (val) => Number.isNaN(val),
  isFinite: (val) => Number.isFinite(val),
  isInfinity: (val) => val === Infinity || val === -Infinity,
  
  // 对象类型检测
  isObject: (val) => val !== null && typeof val === 'object' && !Array.isArray(val),
  isPlainObject: (val) => {
    if (val === null || typeof val !== 'object') return false;
    if (Object.getPrototypeOf(val) === null) return true;
    let proto = val;
    while (Object.getPrototypeOf(proto) !== null) {
      proto = Object.getPrototypeOf(proto);
    }
    return Object.getPrototypeOf(val) === proto;
  },
  isArray: (val) => Array.isArray(val),
  isDate: (val) => val instanceof Date && !isNaN(val.getTime()),
  isRegExp: (val) => val instanceof RegExp,
  isError: (val) => val instanceof Error,
  
  // 高级类型检测
  isPromise: (val) => val && typeof val.then === 'function',
  isIterable: (val) => val != null && typeof val[Symbol.iterator] === 'function',
  isArrayLike: (val) => {
    if (val == null || typeof val === 'function') return false;
    const length = val.length;
    return typeof length === 'number' && length >= 0 && length <= Number.MAX_SAFE_INTEGER;
  },
  
  // DOM 相关检测
  isElement: (val) => {
    try {
      return val instanceof Element;
    } catch {
      return false;
    }
  },
  isNodeList: (val) => {
    try {
      return val instanceof NodeList;
    } catch {
      return false;
    }
  },
  
  // 空值检测
  isEmpty: (val) => {
    if (val == null) return true;
    if (typeof val === 'string' || Array.isArray(val)) return val.length === 0;
    if (val instanceof Map || val instanceof Set) return val.size === 0;
    if (TypeChecker.isObject(val)) return Object.keys(val).length === 0;
    return false;
  },
  
  // 深度相等检测
  isEqual: (a, b) => {
    if (a === b) return true;
    
    if (a == null || b == null) return a === b;
    
    const typeA = getType(a);
    const typeB = getType(b);
    
    if (typeA !== typeB) return false;
    
    if (typeA === 'object') {
      const keysA = Object.keys(a);
      const keysB = Object.keys(b);
      
      if (keysA.length !== keysB.length) return false;
      
      for (const key of keysA) {
        if (!keysB.includes(key)) return false;
        if (!TypeChecker.isEqual(a[key], b[key])) return false;
      }
      
      return true;
    }
    
    if (typeA === 'array') {
      if (a.length !== b.length) return false;
      for (let i = 0; i < a.length; i++) {
        if (!TypeChecker.isEqual(a[i], b[i])) return false;
      }
      return true;
    }
    
    if (typeA === 'date') {
      return a.getTime() === b.getTime();
    }
    
    if (typeA === 'regexp') {
      return a.toString() === b.toString();
    }
    
    return false;
  }
};

// 5. 类型验证器
class TypeValidator {
  constructor() {
    this.rules = new Map();
  }
  
  // 注册类型规则
  addRule(name, validator) {
    this.rules.set(name, validator);
    return this;
  }
  
  // 验证值
  validate(value, typeName) {
    if (!this.rules.has(typeName)) {
      throw new Error(`Unknown type: ${typeName}`);
    }
    
    const validator = this.rules.get(typeName);
    return validator(value);
  }
  
  // 批量验证
  validateObject(obj, schema) {
    const errors = [];
    
    for (const [key, expectedType] of Object.entries(schema)) {
      if (!(key in obj)) {
        errors.push(`Missing property: ${key}`);
        continue;
      }
      
      if (!this.validate(obj[key], expectedType)) {
        errors.push(`Invalid type for ${key}: expected ${expectedType}, got ${getType(obj[key])}`);
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

// 预定义验证器
const validator = new TypeValidator()
  .addRule('string', TypeChecker.isString)
  .addRule('number', TypeChecker.isNumber)
  .addRule('boolean', TypeChecker.isBoolean)
  .addRule('array', TypeChecker.isArray)
  .addRule('object', TypeChecker.isPlainObject)
  .addRule('function', TypeChecker.isFunction)
  .addRule('date', TypeChecker.isDate)
  .addRule('email', val => TypeChecker.isString(val) && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val))
  .addRule('url', val => {
    try {
      new URL(val);
      return true;
    } catch {
      return false;
    }
  });

// 测试用例
console.log('=== 类型检测测试 ===\n');

const testValues = [
  1,
  'hello',
  true,
  null,
  undefined,
  {},
  [],
  new Date(),
  /regex/,
  () => {},
  Symbol('test'),
  new Map(),
  new Set(),
  new Error('test'),
  Promise.resolve(),
  NaN,
  Infinity
];

console.log('基础类型检测：');
testValues.forEach(val => {
  console.log(`${JSON.stringify(val)} -> ${getType(val)}`);
});

console.log('\n高级类型检测：');
console.log('isPlainObject({}):', TypeChecker.isPlainObject({}));
console.log('isPlainObject(new Date()):', TypeChecker.isPlainObject(new Date()));
console.log('isEmpty([]):', TypeChecker.isEmpty([]));
console.log('isEmpty({}):', TypeChecker.isEmpty({}));
console.log('isArrayLike("hello"):', TypeChecker.isArrayLike("hello"));
console.log('isPromise(Promise.resolve()):', TypeChecker.isPromise(Promise.resolve()));

console.log('\n对象验证：');
const user = {
  name: 'John',
  age: 30,
  email: 'john@example.com'
};

const schema = {
  name: 'string',
  age: 'number',
  email: 'email'
};

const validation = validator.validateObject(user, schema);
console.log('验证结果:', validation);

console.log('\n相等性检测：');
console.log('isEqual([1,2], [1,2]):', TypeChecker.isEqual([1,2], [1,2]));
console.log('isEqual({a:1}, {a:1}):', TypeChecker.isEqual({a:1}, {a:1}));
console.log('isEqual({a:1}, {a:2}):', TypeChecker.isEqual({a:1}, {a:2}));
