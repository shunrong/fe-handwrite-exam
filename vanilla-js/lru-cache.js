/**
 * 手写 LRU (Least Recently Used) 缓存 - 前端面试高频题
 * 
 * LRU缓存：当缓存满时，优先删除最近最少使用的数据
 * 核心操作：get(key) 和 put(key, value) 都要在 O(1) 时间复杂度内完成
 */

// 1. 使用 Map 实现的简单版本
class LRUCache {
  constructor(capacity) {
    this.capacity = capacity;
    this.cache = new Map();
  }

  get(key) {
    if (this.cache.has(key)) {
      // 重新设置该键值对，使其成为最新使用的
      const value = this.cache.get(key);
      this.cache.delete(key);
      this.cache.set(key, value);
      return value;
    }
    return -1;
  }

  put(key, value) {
    if (this.cache.has(key)) {
      // 更新已存在的键
      this.cache.delete(key);
    } else if (this.cache.size >= this.capacity) {
      // 删除最旧的键（Map 中第一个键）
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    
    this.cache.set(key, value);
  }

  // 获取缓存大小
  size() {
    return this.cache.size;
  }

  // 清空缓存
  clear() {
    this.cache.clear();
  }
}

// 2. 使用双向链表 + 哈希表实现（手写版本）
class DoublyLinkedList {
  constructor(key = 0, value = 0) {
    this.key = key;
    this.value = value;
    this.prev = null;
    this.next = null;
  }
}

class LRUCacheAdvanced {
  constructor(capacity) {
    this.capacity = capacity;
    this.size = 0;
    this.cache = new Map(); // 哈希表存储 key -> node 映射
    
    // 创建哨兵节点（虚拟头尾节点）
    this.head = new DoublyLinkedList();
    this.tail = new DoublyLinkedList();
    this.head.next = this.tail;
    this.tail.prev = this.head;
  }

  // 添加节点到头部
  addToHead(node) {
    node.prev = this.head;
    node.next = this.head.next;
    
    this.head.next.prev = node;
    this.head.next = node;
  }

  // 删除节点
  removeNode(node) {
    node.prev.next = node.next;
    node.next.prev = node.prev;
  }

  // 移动节点到头部
  moveToHead(node) {
    this.removeNode(node);
    this.addToHead(node);
  }

  // 删除尾部节点
  removeTail() {
    const lastNode = this.tail.prev;
    this.removeNode(lastNode);
    return lastNode;
  }

  get(key) {
    const node = this.cache.get(key);
    
    if (!node) {
      return -1;
    }

    // 移动到头部（标记为最近使用）
    this.moveToHead(node);
    return node.value;
  }

  put(key, value) {
    const node = this.cache.get(key);

    if (!node) {
      const newNode = new DoublyLinkedList(key, value);

      // 检查容量
      if (this.size >= this.capacity) {
        // 删除尾部节点
        const tail = this.removeTail();
        this.cache.delete(tail.key);
        this.size--;
      }

      // 添加新节点
      this.addToHead(newNode);
      this.cache.set(key, newNode);
      this.size++;
    } else {
      // 更新已存在的节点
      node.value = value;
      this.moveToHead(node);
    }
  }

  // 获取所有键（从最新到最旧）
  keys() {
    const keys = [];
    let current = this.head.next;
    while (current !== this.tail) {
      keys.push(current.key);
      current = current.next;
    }
    return keys;
  }

  // 获取所有值（从最新到最旧）
  values() {
    const values = [];
    let current = this.head.next;
    while (current !== this.tail) {
      values.push(current.value);
      current = current.next;
    }
    return values;
  }
}

// 3. 支持过期时间的 LRU 缓存
class LRUCacheWithExpiry {
  constructor(capacity, defaultTTL = null) {
    this.capacity = capacity;
    this.defaultTTL = defaultTTL; // 默认过期时间（毫秒）
    this.cache = new Map();
    this.timers = new Map(); // 存储过期定时器
  }

  get(key) {
    if (!this.cache.has(key)) {
      return -1;
    }

    const item = this.cache.get(key);
    
    // 检查是否过期
    if (item.expiry && Date.now() > item.expiry) {
      this.delete(key);
      return -1;
    }

    // 重新设置为最新使用
    const value = item.value;
    this.cache.delete(key);
    this.cache.set(key, item);
    
    return value;
  }

  put(key, value, ttl = this.defaultTTL) {
    // 删除已存在的键
    if (this.cache.has(key)) {
      this.delete(key);
    } else if (this.cache.size >= this.capacity) {
      // 删除最旧的键
      const oldestKey = this.cache.keys().next().value;
      this.delete(oldestKey);
    }

    // 计算过期时间
    const expiry = ttl ? Date.now() + ttl : null;
    const item = { value, expiry };

    this.cache.set(key, item);

    // 设置过期定时器
    if (ttl) {
      const timer = setTimeout(() => {
        this.delete(key);
      }, ttl);
      this.timers.set(key, timer);
    }
  }

  delete(key) {
    this.cache.delete(key);
    
    // 清除定时器
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key));
      this.timers.delete(key);
    }
  }

  // 清理过期项
  cleanup() {
    const now = Date.now();
    const expiredKeys = [];

    for (const [key, item] of this.cache) {
      if (item.expiry && now > item.expiry) {
        expiredKeys.push(key);
      }
    }

    expiredKeys.forEach(key => this.delete(key));
    return expiredKeys.length;
  }
}

// 4. 带统计信息的 LRU 缓存
class LRUCacheWithStats {
  constructor(capacity) {
    this.capacity = capacity;
    this.cache = new Map();
    this.stats = {
      hits: 0,
      misses: 0,
      puts: 0,
      evictions: 0
    };
  }

  get(key) {
    if (this.cache.has(key)) {
      this.stats.hits++;
      const value = this.cache.get(key);
      // 重新设置为最新使用
      this.cache.delete(key);
      this.cache.set(key, value);
      return value;
    }
    
    this.stats.misses++;
    return -1;
  }

  put(key, value) {
    this.stats.puts++;

    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.capacity) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
      this.stats.evictions++;
    }
    
    this.cache.set(key, value);
  }

  // 获取命中率
  getHitRate() {
    const total = this.stats.hits + this.stats.misses;
    return total === 0 ? 0 : (this.stats.hits / total * 100).toFixed(2) + '%';
  }

  // 获取统计信息
  getStats() {
    return {
      ...this.stats,
      hitRate: this.getHitRate(),
      size: this.cache.size,
      capacity: this.capacity
    };
  }

  // 重置统计信息
  resetStats() {
    this.stats = {
      hits: 0,
      misses: 0,
      puts: 0,
      evictions: 0
    };
  }
}

// 5. 线程安全的 LRU 缓存（模拟）
class ThreadSafeLRUCache {
  constructor(capacity) {
    this.capacity = capacity;
    this.cache = new Map();
    this.lock = false; // 简单的锁机制
  }

  async acquireLock() {
    while (this.lock) {
      await new Promise(resolve => setTimeout(resolve, 1));
    }
    this.lock = true;
  }

  releaseLock() {
    this.lock = false;
  }

  async get(key) {
    await this.acquireLock();
    try {
      if (this.cache.has(key)) {
        const value = this.cache.get(key);
        this.cache.delete(key);
        this.cache.set(key, value);
        return value;
      }
      return -1;
    } finally {
      this.releaseLock();
    }
  }

  async put(key, value) {
    await this.acquireLock();
    try {
      if (this.cache.has(key)) {
        this.cache.delete(key);
      } else if (this.cache.size >= this.capacity) {
        const firstKey = this.cache.keys().next().value;
        this.cache.delete(firstKey);
      }
      this.cache.set(key, value);
    } finally {
      this.releaseLock();
    }
  }
}

// 测试用例
console.log('=== LRU Cache 测试 ===\n');

// 1. 基本功能测试
console.log('1. 基本功能测试：');
const lru = new LRUCache(3);

lru.put(1, 'one');
lru.put(2, 'two');
lru.put(3, 'three');

console.log('get(1):', lru.get(1)); // 'one'
console.log('get(2):', lru.get(2)); // 'two'

lru.put(4, 'four'); // 应该删除 key=3

console.log('get(3):', lru.get(3)); // -1 (被删除了)
console.log('get(4):', lru.get(4)); // 'four'

// 2. 双向链表版本测试
console.log('\n2. 双向链表版本测试：');
const advancedLru = new LRUCacheAdvanced(3);

advancedLru.put('a', 1);
advancedLru.put('b', 2);
advancedLru.put('c', 3);

console.log('keys:', advancedLru.keys()); // ['c', 'b', 'a']
console.log('get(a):', advancedLru.get('a')); // 1
console.log('keys after get(a):', advancedLru.keys()); // ['a', 'c', 'b']

advancedLru.put('d', 4);
console.log('keys after put(d, 4):', advancedLru.keys()); // ['d', 'a', 'c']

// 3. 带过期时间的测试
console.log('\n3. 带过期时间的测试：');
const expiryLru = new LRUCacheWithExpiry(3, 2000); // 默认2秒过期

expiryLru.put('temp1', 'value1', 1000); // 1秒后过期
expiryLru.put('temp2', 'value2'); // 使用默认过期时间
expiryLru.put('permanent', 'value3'); // 永不过期

console.log('get temp1:', expiryLru.get('temp1')); // 'value1'

setTimeout(() => {
  console.log('1.5秒后 get temp1:', expiryLru.get('temp1')); // -1 (已过期)
  console.log('1.5秒后 get temp2:', expiryLru.get('temp2')); // 'value2'
}, 1500);

// 4. 带统计信息的测试
console.log('\n4. 带统计信息的测试：');
const statsLru = new LRUCacheWithStats(3);

statsLru.put('key1', 'value1');
statsLru.put('key2', 'value2');
statsLru.put('key3', 'value3');

// 产生一些命中和未命中
statsLru.get('key1'); // 命中
statsLru.get('key1'); // 命中
statsLru.get('nonexistent'); // 未命中
statsLru.get('key2'); // 命中

console.log('统计信息:', statsLru.getStats());

// 5. 实际应用场景
console.log('\n5. 实际应用场景：');

// 场景1：API 响应缓存
class ApiCache {
  constructor(capacity = 100, ttl = 300000) { // 5分钟过期
    this.cache = new LRUCacheWithExpiry(capacity, ttl);
  }

  async get(url) {
    const cached = this.cache.get(url);
    if (cached !== -1) {
      console.log('缓存命中:', url);
      return cached;
    }

    console.log('缓存未命中，请求API:', url);
    // 模拟 API 调用
    const response = await this.fetchFromApi(url);
    this.cache.put(url, response);
    return response;
  }

  async fetchFromApi(url) {
    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, 100));
    return { data: `response for ${url}`, timestamp: Date.now() };
  }
}

const apiCache = new ApiCache(5, 3000); // 5个条目，3秒过期

// 模拟API调用
async function testApiCache() {
  await apiCache.get('/api/users');
  await apiCache.get('/api/posts');
  await apiCache.get('/api/users'); // 应该从缓存返回
}

testApiCache();

// 场景2：组件渲染缓存
class ComponentCache {
  constructor(capacity = 50) {
    this.cache = new LRUCacheWithStats(capacity);
  }

  render(componentId, props) {
    const cacheKey = `${componentId}:${JSON.stringify(props)}`;
    
    let rendered = this.cache.get(cacheKey);
    if (rendered !== -1) {
      console.log(`组件 ${componentId} 从缓存渲染`);
      return rendered;
    }

    // 模拟组件渲染
    console.log(`组件 ${componentId} 重新渲染`);
    rendered = `<div>Rendered ${componentId} with ${JSON.stringify(props)}</div>`;
    this.cache.put(cacheKey, rendered);
    
    return rendered;
  }

  getStats() {
    return this.cache.getStats();
  }
}

const componentCache = new ComponentCache(10);

// 模拟组件渲染
componentCache.render('UserCard', { id: 1, name: 'John' });
componentCache.render('UserCard', { id: 2, name: 'Jane' });
componentCache.render('UserCard', { id: 1, name: 'John' }); // 缓存命中

console.log('组件缓存统计:', componentCache.getStats());

// 性能测试
console.log('\n=== 性能测试 ===');
function performanceTest() {
  const iterations = 10000;
  const cache = new LRUCache(1000);

  // 写入测试
  console.time('LRU写入测试');
  for (let i = 0; i < iterations; i++) {
    cache.put(`key${i}`, `value${i}`);
  }
  console.timeEnd('LRU写入测试');

  // 读取测试
  console.time('LRU读取测试');
  for (let i = 0; i < iterations; i++) {
    cache.get(`key${i % 1000}`);
  }
  console.timeEnd('LRU读取测试');
}

performanceTest();

// 总结
console.log('\n=== LRU Cache 总结 ===');
console.log('实现方案：');
console.log('1. Map + 重新插入 - 简单但有性能损耗');
console.log('2. 双向链表 + 哈希表 - 真正的 O(1) 操作');
console.log('3. 带过期时间 - 支持TTL功能');
console.log('4. 带统计信息 - 监控缓存效果');
console.log('\n应用场景：');
console.log('• API响应缓存');
console.log('• 组件渲染缓存');
console.log('• 图片资源缓存');
console.log('• 计算结果缓存');
console.log('\n关键点：');
console.log('• 时间复杂度：get/put 都是 O(1)');
console.log('• 空间复杂度：O(capacity)');
console.log('• 淘汰策略：最近最少使用优先删除');
console.log('• 线程安全：多线程环境需要加锁');
