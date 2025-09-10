
/**
 * 手写实现 Object.create() 方法 - 完整版
 * 
 * Object.create() 创建一个新对象，使用现有的对象来作为新创建对象的原型
 * 可选的第二个参数是属性描述符对象
 */

// 1. 基础版本
function myCreate(proto) {
  // 参数验证
  if (typeof proto !== 'object' && typeof proto !== 'function') {
    throw new TypeError('Object prototype may only be an Object or null');
  }

  // 创建临时构造函数
  function Temp() {}
  Temp.prototype = proto;
  return new Temp();
}

// 2. 支持属性描述符的完整版本
function myCreateAdvanced(proto, propertiesObject) {
  // 参数验证
  if (proto !== null && typeof proto !== 'object' && typeof proto !== 'function') {
    throw new TypeError('Object prototype may only be an Object or null');
  }

  // 创建新对象
  function Temp() {}
  Temp.prototype = proto;
  const obj = new Temp();

  // 处理属性描述符
  if (propertiesObject !== undefined) {
    if (propertiesObject === null || typeof propertiesObject !== 'object') {
      throw new TypeError('Properties object must be an object');
    }

    // 添加属性
    Object.keys(propertiesObject).forEach(key => {
      const descriptor = propertiesObject[key];
      
      // 验证描述符
      if (typeof descriptor !== 'object' || descriptor === null) {
        throw new TypeError('Property descriptors must be objects');
      }

      Object.defineProperty(obj, key, descriptor);
    });
  }

  return obj;
}

// 3. 更安全的实现（避免污染构造函数原型）
function myCreateSafe(proto, propertiesObject) {
  if (proto !== null && typeof proto !== 'object' && typeof proto !== 'function') {
    throw new TypeError('Object prototype may only be an Object or null');
  }

  // 使用 Object.setPrototypeOf 或 __proto__
  const obj = {};
  
  if (Object.setPrototypeOf) {
    Object.setPrototypeOf(obj, proto);
  } else {
    // 降级方案
    obj.__proto__ = proto;
  }

  // 添加属性描述符
  if (propertiesObject !== undefined) {
    Object.defineProperties(obj, propertiesObject);
  }

  return obj;
}

// 4. Polyfill 版本（兼容老浏览器）
function myCreatePolyfill(proto, propertiesObject) {
  if (proto !== null && typeof proto !== 'object' && typeof proto !== 'function') {
    throw new TypeError('Object prototype may only be an Object or null');
  }

  function F() {}
  F.prototype = proto;
  const obj = new F();

  // 清除构造函数引用
  if (proto) {
    obj.constructor = F;
  }

  // 添加属性
  if (propertiesObject !== undefined) {
    for (const key in propertiesObject) {
      if (propertiesObject.hasOwnProperty(key)) {
        const descriptor = propertiesObject[key];
        
        if ('value' in descriptor || 'writable' in descriptor ||
            'get' in descriptor || 'set' in descriptor ||
            'enumerable' in descriptor || 'configurable' in descriptor) {
          Object.defineProperty(obj, key, descriptor);
        }
      }
    }
  }

  return obj;
}

// test
function Person(name, age) {
  this.name = name;
  this.age = age;
}

const obj1 = Object.create(Person.prototype);
const obj2 = myCreate(Person.prototype);

console.log(obj1, obj2);