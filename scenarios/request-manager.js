/**
 * 场景题4: 请求缓存和重试机制实现
 * 
 * 业务场景：
 * - 移动端应用需要优化网络请求，减少重复请求
 * - 弱网环境下需要自动重试失败的请求
 * - 需要支持请求去重、缓存、超时控制等功能
 * 
 * 考察点：
 * - 网络编程和异步处理
 * - 缓存策略设计
 * - 错误处理和重试算法
 * - Promise和fetch API的使用
 * - 性能优化思维
 */

// 1. 基础请求管理器
class RequestManager {
  constructor(options = {}) {
    this.options = {
      timeout: 10000,           // 默认超时时间(ms)
      maxRetries: 3,            // 最大重试次数
      retryDelay: 1000,         // 重试延迟(ms)
      retryDelayMultiplier: 2,  // 重试延迟倍数(指数退避)
      cacheTimeout: 300000,     // 缓存超时时间(5分钟)
      maxCacheSize: 100,        // 最大缓存数量
      enableCache: true,        // 是否启用缓存
      enableRetry: true,        // 是否启用重试
      enableDeduplication: true, // 是否启用请求去重
      ...options
    };
    
    this.cache = new Map();           // 请求缓存
    this.pendingRequests = new Map(); // 进行中的请求
    this.requestStats = {             // 请求统计
      total: 0,
      success: 0,
      failed: 0,
      cached: 0,
      retried: 0
    };
  }
  
  // 主要请求方法
  async request(url, options = {}) {
    const config = this.mergeConfig(url, options);
    const cacheKey = this.generateCacheKey(config);
    
    this.requestStats.total++;
    
    try {
      // 1. 检查缓存
      if (this.options.enableCache && config.method === 'GET') {
        const cachedResponse = this.getFromCache(cacheKey);
        if (cachedResponse) {
          this.requestStats.cached++;
          return this.cloneResponse(cachedResponse);
        }
      }
      
      // 2. 检查请求去重
      if (this.options.enableDeduplication) {
        const pendingRequest = this.pendingRequests.get(cacheKey);
        if (pendingRequest) {
          return await pendingRequest;
        }
      }
      
      // 3. 发起新请求
      const requestPromise = this.executeRequest(config);
      
      if (this.options.enableDeduplication) {
        this.pendingRequests.set(cacheKey, requestPromise);
      }
      
      const response = await requestPromise;
      
      // 4. 缓存响应
      if (this.options.enableCache && config.method === 'GET' && response.ok) {
        this.setToCache(cacheKey, response);
      }
      
      this.requestStats.success++;
      return response;
      
    } catch (error) {
      this.requestStats.failed++;
      throw error;
    } finally {
      this.pendingRequests.delete(cacheKey);
    }
  }
  
  // 执行请求（带重试）
  async executeRequest(config, attempt = 1) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), config.timeout);
      
      const response = await fetch(config.url, {
        ...config,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return response;
      
    } catch (error) {
      // 判断是否需要重试
      if (this.shouldRetry(error, attempt, config)) {
        this.requestStats.retried++;
        
        const delay = this.calculateRetryDelay(attempt);
        await this.delay(delay);
        
        console.log(`Retrying request (attempt ${attempt + 1}):`, config.url);
        return this.executeRequest(config, attempt + 1);
      }
      
      throw this.createRequestError(error, config, attempt);
    }
  }
  
  // 判断是否应该重试
  shouldRetry(error, attempt, config) {
    if (!this.options.enableRetry) return false;
    if (attempt >= this.options.maxRetries) return false;
    
    // 网络错误或5xx错误才重试
    if (error.name === 'AbortError') return false; // 超时不重试
    if (error.message.includes('HTTP 4')) return false; // 客户端错误不重试
    
    return true;
  }
  
  // 计算重试延迟（指数退避）
  calculateRetryDelay(attempt) {
    const base = this.options.retryDelay;
    const multiplier = this.options.retryDelayMultiplier;
    const jitter = Math.random() * 0.1; // 10%的随机抖动
    
    return base * Math.pow(multiplier, attempt - 1) * (1 + jitter);
  }
  
  // 合并配置
  mergeConfig(url, options) {
    return {
      url,
      method: 'GET',
      timeout: this.options.timeout,
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    };
  }
  
  // 生成缓存键
  generateCacheKey(config) {
    const { url, method, body, headers } = config;
    const key = {
      url,
      method,
      body: body || null,
      headers: headers || {}
    };
    return JSON.stringify(key);
  }
  
  // 从缓存获取
  getFromCache(key) {
    const cached = this.cache.get(key);
    if (!cached) return null;
    
    // 检查是否过期
    if (Date.now() > cached.expireTime) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.response;
  }
  
  // 设置缓存
  setToCache(key, response) {
    // 控制缓存大小
    if (this.cache.size >= this.options.maxCacheSize) {
      // 删除最老的缓存
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    
    this.cache.set(key, {
      response: response.clone(),
      expireTime: Date.now() + this.options.cacheTimeout
    });
  }
  
  // 克隆响应
  cloneResponse(response) {
    return response.clone();
  }
  
  // 创建请求错误
  createRequestError(originalError, config, attempts) {
    const error = new Error(`Request failed after ${attempts} attempts: ${originalError.message}`);
    error.name = 'RequestError';
    error.config = config;
    error.attempts = attempts;
    error.originalError = originalError;
    return error;
  }
  
  // 延迟函数
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  // 获取统计信息
  getStats() {
    return {
      ...this.requestStats,
      cacheSize: this.cache.size,
      pendingRequests: this.pendingRequests.size
    };
  }
  
  // 清空缓存
  clearCache() {
    this.cache.clear();
  }
  
  // 便捷方法
  get(url, options = {}) {
    return this.request(url, { ...options, method: 'GET' });
  }
  
  post(url, data, options = {}) {
    return this.request(url, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data)
    });
  }
  
  put(url, data, options = {}) {
    return this.request(url, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }
  
  delete(url, options = {}) {
    return this.request(url, { ...options, method: 'DELETE' });
  }
}

// 2. 高级请求管理器 - 支持拦截器
class AdvancedRequestManager extends RequestManager {
  constructor(options = {}) {
    super(options);
    this.interceptors = {
      request: [],
      response: []
    };
  }
  
  // 添加请求拦截器
  addRequestInterceptor(interceptor) {
    this.interceptors.request.push(interceptor);
  }
  
  // 添加响应拦截器
  addResponseInterceptor(interceptor) {
    this.interceptors.response.push(interceptor);
  }
  
  // 执行请求拦截器
  async runRequestInterceptors(config) {
    let modifiedConfig = config;
    
    for (const interceptor of this.interceptors.request) {
      try {
        modifiedConfig = await interceptor(modifiedConfig);
      } catch (error) {
        console.error('Request interceptor error:', error);
      }
    }
    
    return modifiedConfig;
  }
  
  // 执行响应拦截器
  async runResponseInterceptors(response, config) {
    let modifiedResponse = response;
    
    for (const interceptor of this.interceptors.response) {
      try {
        modifiedResponse = await interceptor(modifiedResponse, config);
      } catch (error) {
        console.error('Response interceptor error:', error);
      }
    }
    
    return modifiedResponse;
  }
  
  // 重写执行请求方法
  async executeRequest(config, attempt = 1) {
    // 应用请求拦截器
    const finalConfig = await this.runRequestInterceptors(config);
    
    try {
      const response = await super.executeRequest(finalConfig, attempt);
      
      // 应用响应拦截器
      return await this.runResponseInterceptors(response, finalConfig);
      
    } catch (error) {
      // 响应拦截器也可以处理错误
      for (const interceptor of this.interceptors.response) {
        try {
          const result = await interceptor(null, finalConfig, error);
          if (result) return result; // 拦截器可以提供错误恢复
        } catch (interceptorError) {
          console.error('Response interceptor error handling:', interceptorError);
        }
      }
      
      throw error;
    }
  }
}

// 3. 请求池管理器 - 控制并发数量
class RequestPoolManager extends AdvancedRequestManager {
  constructor(options = {}) {
    super({
      maxConcurrent: 6,         // 最大并发数
      queueTimeout: 30000,      // 队列超时时间
      ...options
    });
    
    this.activeRequests = 0;
    this.requestQueue = [];
  }
  
  async request(url, options = {}) {
    return new Promise((resolve, reject) => {
      const requestTask = {
        url,
        options,
        resolve,
        reject,
        timestamp: Date.now()
      };
      
      if (this.activeRequests < this.options.maxConcurrent) {
        this.executeRequestTask(requestTask);
      } else {
        this.requestQueue.push(requestTask);
        
        // 设置队列超时
        setTimeout(() => {
          const index = this.requestQueue.indexOf(requestTask);
          if (index !== -1) {
            this.requestQueue.splice(index, 1);
            reject(new Error('Request queue timeout'));
          }
        }, this.options.queueTimeout);
      }
    });
  }
  
  async executeRequestTask(task) {
    this.activeRequests++;
    
    try {
      const response = await super.request(task.url, task.options);
      task.resolve(response);
    } catch (error) {
      task.reject(error);
    } finally {
      this.activeRequests--;
      this.processQueue();
    }
  }
  
  processQueue() {
    if (this.requestQueue.length > 0 && this.activeRequests < this.options.maxConcurrent) {
      const nextTask = this.requestQueue.shift();
      this.executeRequestTask(nextTask);
    }
  }
  
  getStats() {
    return {
      ...super.getStats(),
      activeRequests: this.activeRequests,
      queueLength: this.requestQueue.length
    };
  }
}

// 4. 实际应用示例
class ApiService {
  constructor() {
    this.requestManager = new RequestPoolManager({
      timeout: 8000,
      maxRetries: 2,
      cacheTimeout: 600000, // 10分钟缓存
      maxConcurrent: 4
    });
    
    this.setupInterceptors();
    this.baseURL = 'https://jsonplaceholder.typicode.com';
  }
  
  setupInterceptors() {
    // 请求拦截器 - 添加认证token
    this.requestManager.addRequestInterceptor((config) => {
      const token = localStorage.getItem('auth_token');
      if (token) {
        config.headers = {
          ...config.headers,
          'Authorization': `Bearer ${token}`
        };
      }
      
      console.log('Request:', config.method, config.url);
      return config;
    });
    
    // 响应拦截器 - 统一错误处理
    this.requestManager.addResponseInterceptor(async (response, config, error) => {
      if (error) {
        // 处理401错误 - 自动刷新token
        if (error.message.includes('HTTP 401')) {
          console.log('Token expired, attempting refresh...');
          // 这里可以实现token刷新逻辑
        }
        return null;
      }
      
      if (response) {
        console.log('Response:', response.status, config.url);
        
        // 自动解析JSON
        if (response.headers.get('content-type')?.includes('application/json')) {
          const data = await response.json();
          response.data = data;
        }
      }
      
      return response;
    });
  }
  
  // API方法
  async getUsers() {
    const response = await this.requestManager.get(`${this.baseURL}/users`);
    return response.data;
  }
  
  async getUser(id) {
    const response = await this.requestManager.get(`${this.baseURL}/users/${id}`);
    return response.data;
  }
  
  async getPosts(userId = null) {
    const url = userId 
      ? `${this.baseURL}/posts?userId=${userId}`
      : `${this.baseURL}/posts`;
    const response = await this.requestManager.get(url);
    return response.data;
  }
  
  async createPost(post) {
    const response = await this.requestManager.post(`${this.baseURL}/posts`, post);
    return response.data;
  }
  
  async updatePost(id, post) {
    const response = await this.requestManager.put(`${this.baseURL}/posts/${id}`, post);
    return response.data;
  }
  
  async deletePost(id) {
    const response = await this.requestManager.delete(`${this.baseURL}/posts/${id}`);
    return response.ok;
  }
  
  // 批量请求
  async getBatchData() {
    try {
      const [users, posts] = await Promise.all([
        this.getUsers(),
        this.getPosts()
      ]);
      
      return { users, posts };
    } catch (error) {
      console.error('Batch request failed:', error);
      throw error;
    }
  }
  
  // 获取统计信息
  getRequestStats() {
    return this.requestManager.getStats();
  }
  
  // 清空缓存
  clearCache() {
    this.requestManager.clearCache();
  }
}

// 5. React Hook 封装
function useApi() {
  const [apiService] = useState(() => new ApiService());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const request = useCallback(async (apiCall) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await apiCall(apiService);
      return result;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiService]);
  
  return {
    api: apiService,
    request,
    loading,
    error,
    stats: apiService.getRequestStats()
  };
}

// 6. 演示应用
class RequestManagerDemo {
  constructor() {
    this.apiService = new ApiService();
    this.setupUI();
    this.bindEvents();
    this.updateStats();
  }
  
  setupUI() {
    document.body.innerHTML = `
      <div style="max-width: 800px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
        <h1>请求管理器演示</h1>
        
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px; margin: 20px 0;">
          <button id="get-users">获取用户列表</button>
          <button id="get-posts">获取文章列表</button>
          <button id="batch-request">批量请求</button>
          <button id="stress-test">压力测试</button>
          <button id="clear-cache">清空缓存</button>
          <button id="simulate-error">模拟错误</button>
        </div>
        
        <div id="stats" style="
          display: grid; 
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); 
          gap: 10px; 
          margin: 20px 0;
        "></div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
          <div>
            <h3>请求日志</h3>
            <div id="request-log" style="
              height: 300px; 
              overflow-y: auto; 
              background: #f5f5f5; 
              padding: 10px; 
              border-radius: 4px; 
              font-family: monospace; 
              font-size: 12px;
            "></div>
          </div>
          
          <div>
            <h3>响应数据</h3>
            <pre id="response-data" style="
              height: 300px; 
              overflow-y: auto; 
              background: #f5f5f5; 
              padding: 10px; 
              border-radius: 4px; 
              font-size: 12px;
            "></pre>
          </div>
        </div>
      </div>
    `;
  }
  
  bindEvents() {
    document.getElementById('get-users').onclick = () => this.testGetUsers();
    document.getElementById('get-posts').onclick = () => this.testGetPosts();
    document.getElementById('batch-request').onclick = () => this.testBatchRequest();
    document.getElementById('stress-test').onclick = () => this.testStressTest();
    document.getElementById('clear-cache').onclick = () => this.clearCache();
    document.getElementById('simulate-error').onclick = () => this.simulateError();
  }
  
  async testGetUsers() {
    this.log('发起请求: 获取用户列表');
    try {
      const users = await this.apiService.getUsers();
      this.showResponse('Users', users.slice(0, 3)); // 只显示前3个
      this.log('✓ 用户列表获取成功');
    } catch (error) {
      this.log(`✗ 用户列表获取失败: ${error.message}`);
    }
    this.updateStats();
  }
  
  async testGetPosts() {
    this.log('发起请求: 获取文章列表');
    try {
      const posts = await this.apiService.getPosts();
      this.showResponse('Posts', posts.slice(0, 3)); // 只显示前3个
      this.log('✓ 文章列表获取成功');
    } catch (error) {
      this.log(`✗ 文章列表获取失败: ${error.message}`);
    }
    this.updateStats();
  }
  
  async testBatchRequest() {
    this.log('发起批量请求...');
    try {
      const data = await this.apiService.getBatchData();
      this.showResponse('Batch Data', {
        usersCount: data.users.length,
        postsCount: data.posts.length
      });
      this.log('✓ 批量请求成功');
    } catch (error) {
      this.log(`✗ 批量请求失败: ${error.message}`);
    }
    this.updateStats();
  }
  
  async testStressTest() {
    this.log('开始压力测试: 发起20个并发请求...');
    const startTime = Date.now();
    
    try {
      const promises = Array.from({ length: 20 }, (_, i) => 
        this.apiService.getUser(i + 1)
      );
      
      await Promise.all(promises);
      const duration = Date.now() - startTime;
      this.log(`✓ 压力测试完成，耗时: ${duration}ms`);
    } catch (error) {
      this.log(`✗ 压力测试失败: ${error.message}`);
    }
    this.updateStats();
  }
  
  clearCache() {
    this.apiService.clearCache();
    this.log('缓存已清空');
    this.updateStats();
  }
  
  async simulateError() {
    this.log('模拟错误请求...');
    try {
      await this.apiService.requestManager.get('https://invalid-url/api/data');
    } catch (error) {
      this.log(`✓ 错误处理正常: ${error.message}`);
    }
    this.updateStats();
  }
  
  updateStats() {
    const stats = this.apiService.getRequestStats();
    document.getElementById('stats').innerHTML = `
      <div style="background: #e3f2fd; padding: 10px; border-radius: 4px; text-align: center;">
        <div style="font-weight: bold;">总请求</div>
        <div style="font-size: 24px; color: #1976d2;">${stats.total}</div>
      </div>
      <div style="background: #e8f5e8; padding: 10px; border-radius: 4px; text-align: center;">
        <div style="font-weight: bold;">成功</div>
        <div style="font-size: 24px; color: #388e3c;">${stats.success}</div>
      </div>
      <div style="background: #ffebee; padding: 10px; border-radius: 4px; text-align: center;">
        <div style="font-weight: bold;">失败</div>
        <div style="font-size: 24px; color: #d32f2f;">${stats.failed}</div>
      </div>
      <div style="background: #fff3e0; padding: 10px; border-radius: 4px; text-align: center;">
        <div style="font-weight: bold;">缓存命中</div>
        <div style="font-size: 24px; color: #f57c00;">${stats.cached}</div>
      </div>
      <div style="background: #f3e5f5; padding: 10px; border-radius: 4px; text-align: center;">
        <div style="font-weight: bold;">重试次数</div>
        <div style="font-size: 24px; color: #7b1fa2;">${stats.retried}</div>
      </div>
      <div style="background: #e0f2f1; padding: 10px; border-radius: 4px; text-align: center;">
        <div style="font-weight: bold;">活跃请求</div>
        <div style="font-size: 24px; color: #00695c;">${stats.activeRequests || 0}</div>
      </div>
    `;
  }
  
  log(message) {
    const logEl = document.getElementById('request-log');
    const timestamp = new Date().toLocaleTimeString();
    logEl.innerHTML += `[${timestamp}] ${message}\n`;
    logEl.scrollTop = logEl.scrollHeight;
  }
  
  showResponse(title, data) {
    const responseEl = document.getElementById('response-data');
    responseEl.textContent = `${title}:\n${JSON.stringify(data, null, 2)}`;
  }
}

// 运行演示
console.log('=== 请求缓存和重试机制测试 ===\n');

const demo = new RequestManagerDemo();

console.log('请求管理器功能特点：');
console.log('✓ 自动重试机制（指数退避）');
console.log('✓ 智能缓存策略');
console.log('✓ 请求去重');
console.log('✓ 并发控制');
console.log('✓ 超时处理');
console.log('✓ 拦截器支持');
console.log('✓ 统计和监控');
console.log('✓ 错误处理');

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    RequestManager,
    AdvancedRequestManager,
    RequestPoolManager,
    ApiService,
    useApi
  };
}
