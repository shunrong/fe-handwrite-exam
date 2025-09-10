/**
 * 手写 JSON.stringify 和 JSON.parse - 前端面试重要题目
 * 
 * 理解 JSON 序列化和反序列化的核心原理
 */

// 1. 手写 JSON.stringify
function myJSONStringify(value, replacer, space) {
  // 处理循环引用
  const seen = new WeakSet();
  
  function stringify(val, key) {
    // 处理 null
    if (val === null) {
      return 'null';
    }
    
    // 处理基本类型
    switch (typeof val) {
      case 'boolean':
      case 'number':
        return String(val);
      case 'string':
        return `"${escapeString(val)}"`;
      case 'undefined':
      case 'function':
      case 'symbol':
        return undefined; // 这些类型会被忽略
    }
    
    // 处理对象类型
    if (typeof val === 'object') {
      // 检查循环引用
      if (seen.has(val)) {
        throw new TypeError('Converting circular structure to JSON');
      }
      seen.add(val);
      
      let result;
      
      // 处理数组
      if (Array.isArray(val)) {
        result = '[';
        const items = [];
        
        for (let i = 0; i < val.length; i++) {
          const item = stringify(val[i], i);
          items.push(item === undefined ? 'null' : item);
        }
        
        result += items.join(',');
        result += ']';
      } else {
        // 处理普通对象
        result = '{';
        const pairs = [];
        
        for (const objKey in val) {
          if (val.hasOwnProperty(objKey)) {
            const objVal = stringify(val[objKey], objKey);
            if (objVal !== undefined) {
              pairs.push(`"${escapeString(objKey)}":${objVal}`);
            }
          }
        }
        
        result += pairs.join(',');
        result += '}';
      }
      
      seen.delete(val);
      return result;
    }
    
    return undefined;
  }
  
  // 转义字符串中的特殊字符
  function escapeString(str) {
    return str.replace(/\\/g, '\\\\')
              .replace(/"/g, '\\"')
              .replace(/\n/g, '\\n')
              .replace(/\r/g, '\\r')
              .replace(/\t/g, '\\t')
              .replace(/\b/g, '\\b')
              .replace(/\f/g, '\\f');
  }
  
  // 处理 replacer 参数
  if (typeof replacer === 'function') {
    // 函数形式的 replacer
    function transform(key, val) {
      val = replacer(key, val);
      return stringify(val, key);
    }
    return transform('', value);
  } else if (Array.isArray(replacer)) {
    // 数组形式的 replacer（过滤属性）
    const allowedKeys = new Set(replacer);
    const originalStringify = stringify;
    
    stringify = function(val, key) {
      if (typeof val === 'object' && val !== null && !Array.isArray(val)) {
        const filtered = {};
        for (const objKey in val) {
          if (val.hasOwnProperty(objKey) && allowedKeys.has(objKey)) {
            filtered[objKey] = val[objKey];
          }
        }
        return originalStringify(filtered, key);
      }
      return originalStringify(val, key);
    };
  }
  
  let result = stringify(value, '');
  
  // 处理 space 参数（格式化输出）
  if (space && result) {
    return formatJSON(result, space);
  }
  
  return result;
}

// JSON 格式化函数
function formatJSON(jsonString, space) {
  if (typeof space === 'number') {
    space = ' '.repeat(Math.min(space, 10));
  } else if (typeof space === 'string') {
    space = space.slice(0, 10);
  } else {
    return jsonString;
  }
  
  let formatted = '';
  let indent = 0;
  let inString = false;
  let escape = false;
  
  for (let i = 0; i < jsonString.length; i++) {
    const char = jsonString[i];
    
    if (!inString) {
      switch (char) {
        case '{':
        case '[':
          formatted += char + '\n' + space.repeat(++indent);
          break;
        case '}':
        case ']':
          formatted += '\n' + space.repeat(--indent) + char;
          break;
        case ',':
          formatted += char + '\n' + space.repeat(indent);
          break;
        case ':':
          formatted += char + ' ';
          break;
        case '"':
          inString = true;
          formatted += char;
          break;
        default:
          formatted += char;
      }
    } else {
      formatted += char;
      if (!escape) {
        if (char === '"') {
          inString = false;
        } else if (char === '\\') {
          escape = true;
        }
      } else {
        escape = false;
      }
    }
  }
  
  return formatted;
}

// 2. 手写 JSON.parse
function myJSONParse(text, reviver) {
  let index = 0;
  
  function parseValue() {
    skipWhitespace();
    
    const char = text[index];
    
    switch (char) {
      case '"':
        return parseString();
      case '{':
        return parseObject();
      case '[':
        return parseArray();
      case 't':
        return parseTrue();
      case 'f':
        return parseFalse();
      case 'n':
        return parseNull();
      default:
        if (char === '-' || (char >= '0' && char <= '9')) {
          return parseNumber();
        }
        throw new SyntaxError(`Unexpected character '${char}' at position ${index}`);
    }
  }
  
  function parseString() {
    if (text[index] !== '"') {
      throw new SyntaxError('Expected "');
    }
    
    index++; // 跳过开始的引号
    let result = '';
    
    while (index < text.length && text[index] !== '"') {
      if (text[index] === '\\') {
        index++; // 跳过反斜杠
        const escapeChar = text[index];
        
        switch (escapeChar) {
          case '"':
          case '\\':
          case '/':
            result += escapeChar;
            break;
          case 'n':
            result += '\n';
            break;
          case 'r':
            result += '\r';
            break;
          case 't':
            result += '\t';
            break;
          case 'b':
            result += '\b';
            break;
          case 'f':
            result += '\f';
            break;
          case 'u':
            // Unicode 转义
            index++;
            const hex = text.substr(index, 4);
            if (hex.length !== 4 || !/^[0-9a-fA-F]{4}$/.test(hex)) {
              throw new SyntaxError('Invalid Unicode escape');
            }
            result += String.fromCharCode(parseInt(hex, 16));
            index += 3; // 已经读取了4个字符，这里再前进3个
            break;
          default:
            throw new SyntaxError(`Invalid escape character '\\${escapeChar}'`);
        }
      } else {
        result += text[index];
      }
      index++;
    }
    
    if (text[index] !== '"') {
      throw new SyntaxError('Unterminated string');
    }
    
    index++; // 跳过结束的引号
    return result;
  }
  
  function parseObject() {
    if (text[index] !== '{') {
      throw new SyntaxError('Expected {');
    }
    
    index++; // 跳过 {
    skipWhitespace();
    
    const obj = {};
    
    // 处理空对象
    if (text[index] === '}') {
      index++;
      return obj;
    }
    
    while (true) {
      skipWhitespace();
      
      // 解析键
      const key = parseString();
      
      skipWhitespace();
      
      if (text[index] !== ':') {
        throw new SyntaxError('Expected :');
      }
      
      index++; // 跳过 :
      
      // 解析值
      const value = parseValue();
      obj[key] = value;
      
      skipWhitespace();
      
      if (text[index] === '}') {
        index++;
        break;
      }
      
      if (text[index] === ',') {
        index++;
        continue;
      }
      
      throw new SyntaxError('Expected , or }');
    }
    
    return obj;
  }
  
  function parseArray() {
    if (text[index] !== '[') {
      throw new SyntaxError('Expected [');
    }
    
    index++; // 跳过 [
    skipWhitespace();
    
    const arr = [];
    
    // 处理空数组
    if (text[index] === ']') {
      index++;
      return arr;
    }
    
    while (true) {
      const value = parseValue();
      arr.push(value);
      
      skipWhitespace();
      
      if (text[index] === ']') {
        index++;
        break;
      }
      
      if (text[index] === ',') {
        index++;
        skipWhitespace();
        continue;
      }
      
      throw new SyntaxError('Expected , or ]');
    }
    
    return arr;
  }
  
  function parseNumber() {
    const start = index;
    
    if (text[index] === '-') {
      index++;
    }
    
    if (text[index] === '0') {
      index++;
    } else if (text[index] >= '1' && text[index] <= '9') {
      while (text[index] >= '0' && text[index] <= '9') {
        index++;
      }
    } else {
      throw new SyntaxError('Invalid number');
    }
    
    // 处理小数部分
    if (text[index] === '.') {
      index++;
      if (!(text[index] >= '0' && text[index] <= '9')) {
        throw new SyntaxError('Invalid number');
      }
      while (text[index] >= '0' && text[index] <= '9') {
        index++;
      }
    }
    
    // 处理指数部分
    if (text[index] === 'e' || text[index] === 'E') {
      index++;
      if (text[index] === '+' || text[index] === '-') {
        index++;
      }
      if (!(text[index] >= '0' && text[index] <= '9')) {
        throw new SyntaxError('Invalid number');
      }
      while (text[index] >= '0' && text[index] <= '9') {
        index++;
      }
    }
    
    return Number(text.slice(start, index));
  }
  
  function parseTrue() {
    if (text.substr(index, 4) === 'true') {
      index += 4;
      return true;
    }
    throw new SyntaxError('Invalid literal');
  }
  
  function parseFalse() {
    if (text.substr(index, 5) === 'false') {
      index += 5;
      return false;
    }
    throw new SyntaxError('Invalid literal');
  }
  
  function parseNull() {
    if (text.substr(index, 4) === 'null') {
      index += 4;
      return null;
    }
    throw new SyntaxError('Invalid literal');
  }
  
  function skipWhitespace() {
    while (index < text.length && /\s/.test(text[index])) {
      index++;
    }
  }
  
  // 解析主逻辑
  const result = parseValue();
  skipWhitespace();
  
  if (index < text.length) {
    throw new SyntaxError('Unexpected content after JSON');
  }
  
  // 处理 reviver 函数
  if (typeof reviver === 'function') {
    return reviveValue('', result);
  }
  
  function reviveValue(key, value) {
    if (value && typeof value === 'object') {
      if (Array.isArray(value)) {
        for (let i = 0; i < value.length; i++) {
          value[i] = reviveValue(String(i), value[i]);
        }
      } else {
        for (const objKey in value) {
          if (value.hasOwnProperty(objKey)) {
            value[objKey] = reviveValue(objKey, value[objKey]);
          }
        }
      }
    }
    return reviver(key, value);
  }
  
  return result;
}

// 3. 增强版本 - 支持更多类型
function myJSONStringifyAdvanced(value, replacer, space) {
  const seen = new WeakMap();
  let path = '';
  
  function stringify(val, key, currentPath) {
    const fullPath = currentPath ? `${currentPath}.${key}` : key;
    
    // 处理特殊值
    if (val === null) return 'null';
    if (val === undefined) return undefined;
    if (typeof val === 'function') return undefined;
    if (typeof val === 'symbol') return undefined;
    
    // 处理基本类型
    if (typeof val === 'boolean' || typeof val === 'number') {
      return String(val);
    }
    
    if (typeof val === 'string') {
      return `"${escapeString(val)}"`;
    }
    
    // 处理 BigInt
    if (typeof val === 'bigint') {
      throw new TypeError('BigInt value cannot be serialized in JSON');
    }
    
    // 处理对象类型
    if (typeof val === 'object') {
      // 循环引用检测
      if (seen.has(val)) {
        throw new TypeError(`Converting circular structure to JSON (path: ${fullPath})`);
      }
      
      // 处理 Date
      if (val instanceof Date) {
        return `"${val.toISOString()}"`;
      }
      
      // 处理 RegExp
      if (val instanceof RegExp) {
        return '{}';
      }
      
      // 处理数组
      if (Array.isArray(val)) {
        seen.set(val, fullPath);
        
        const items = [];
        for (let i = 0; i < val.length; i++) {
          const item = stringify(val[i], i, fullPath);
          items.push(item === undefined ? 'null' : item);
        }
        
        seen.delete(val);
        return `[${items.join(',')}]`;
      }
      
      // 处理普通对象
      seen.set(val, fullPath);
      
      const pairs = [];
      for (const objKey in val) {
        if (val.hasOwnProperty(objKey)) {
          const objVal = stringify(val[objKey], objKey, fullPath);
          if (objVal !== undefined) {
            pairs.push(`"${escapeString(objKey)}":${objVal}`);
          }
        }
      }
      
      seen.delete(val);
      return `{${pairs.join(',')}}`;
    }
    
    return undefined;
  }
  
  function escapeString(str) {
    return str.replace(/\\/g, '\\\\')
              .replace(/"/g, '\\"')
              .replace(/\n/g, '\\n')
              .replace(/\r/g, '\\r')
              .replace(/\t/g, '\\t')
              .replace(/\b/g, '\\b')
              .replace(/\f/g, '\\f');
  }
  
  return stringify(value, '', '');
}

// 测试用例
console.log('=== JSON 序列化和反序列化测试 ===\n');

// 1. 基本功能测试
console.log('1. 基本功能测试：');
const testObj = {
  name: 'John',
  age: 30,
  city: 'New York',
  hobbies: ['reading', 'coding'],
  address: {
    street: '123 Main St',
    zip: '10001'
  },
  active: true,
  score: null
};

const serialized = myJSONStringify(testObj);
console.log('序列化结果:', serialized);

const deserialized = myJSONParse(serialized);
console.log('反序列化结果:', deserialized);

// 2. 循环引用测试
console.log('\n2. 循环引用测试：');
const circularObj = { a: 1 };
circularObj.self = circularObj;

try {
  myJSONStringify(circularObj);
} catch (error) {
  console.log('捕获循环引用错误:', error.message);
}

// 3. 特殊值测试
console.log('\n3. 特殊值测试：');
const specialValues = {
  undef: undefined,
  func: function() { return 1; },
  sym: Symbol('test'),
  date: new Date(),
  regex: /test/g,
  nan: NaN,
  infinity: Infinity
};

console.log('特殊值序列化:', myJSONStringify(specialValues));

// 4. 数组测试
console.log('\n4. 数组测试：');
const testArray = [1, 'hello', true, null, undefined, { nested: 'object' }];
console.log('数组序列化:', myJSONStringify(testArray));

// 5. 格式化输出测试
console.log('\n5. 格式化输出测试：');
console.log('格式化JSON:');
console.log(myJSONStringify(testObj, null, 2));

// 6. replacer 函数测试
console.log('\n6. replacer 函数测试：');
const withReplacer = myJSONStringify(testObj, (key, value) => {
  if (key === 'age') return undefined; // 排除 age 字段
  if (typeof value === 'string') return value.toUpperCase(); // 字符串转大写
  return value;
});
console.log('使用 replacer:', withReplacer);

// 7. 解析错误测试
console.log('\n7. 解析错误测试：');
const invalidJSONs = [
  '{"name": "John"', // 缺少结束括号
  '{"name": John}', // 键值没有引号
  '[1, 2, 3,]', // 多余的逗号
  '{"a": undefined}' // 不支持的值
];

invalidJSONs.forEach((invalid, index) => {
  try {
    myJSONParse(invalid);
  } catch (error) {
    console.log(`无效JSON ${index + 1}:`, error.message);
  }
});

// 8. reviver 函数测试
console.log('\n8. reviver 函数测试：');
const jsonString = '{"date":"2023-01-01T00:00:00.000Z","numbers":["1","2","3"]}';
const revived = myJSONParse(jsonString, (key, value) => {
  if (key === 'date') return new Date(value);
  if (key === 'numbers') return value.map(Number);
  return value;
});
console.log('使用 reviver:', revived);

// 性能测试
console.log('\n=== 性能测试 ===');
const largeObj = {
  users: Array.from({ length: 1000 }, (_, i) => ({
    id: i,
    name: `User ${i}`,
    email: `user${i}@example.com`
  }))
};

console.time('原生 JSON.stringify');
JSON.stringify(largeObj);
console.timeEnd('原生 JSON.stringify');

console.time('自定义 myJSONStringify');
myJSONStringify(largeObj);
console.timeEnd('自定义 myJSONStringify');

// 总结
console.log('\n=== JSON 处理总结 ===');
console.log('实现要点：');
console.log('1. 循环引用检测 - 使用 WeakSet/WeakMap');
console.log('2. 特殊值处理 - undefined/function/symbol 会被忽略');
console.log('3. 转义字符 - 正确处理字符串中的特殊字符');
console.log('4. 数字解析 - 支持整数、小数、科学计数法');
console.log('5. 错误处理 - 提供详细的错误信息');
console.log('6. 扩展功能 - replacer 和 reviver 函数支持');
