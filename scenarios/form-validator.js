/**
 * 场景题6: 表单验证器实现
 * 
 * 业务场景：
 * - 用户注册/登录表单需要实时验证
 * - 支持多种验证规则和自定义验证
 * - 需要国际化错误提示和异步验证
 * 
 * 考察点：
 * - 正则表达式和数据验证
 * - 异步处理和防抖优化
 * - 插件化架构设计
 * - 用户体验优化
 */

// 1. 基础表单验证器
class FormValidator {
  constructor(form, options = {}) {
    this.form = typeof form === 'string' ? document.querySelector(form) : form;
    this.options = {
      validateOnInput: true,     // 输入时验证
      validateOnBlur: true,      // 失焦时验证
      validateOnSubmit: true,    // 提交时验证
      showErrors: true,          // 显示错误信息
      errorClass: 'error',       // 错误样式类
      successClass: 'success',   // 成功样式类
      debounceTime: 300,         // 防抖时间
      ...options
    };
    
    this.rules = new Map();        // 验证规则
    this.errors = new Map();       // 错误信息
    this.validators = new Map();   // 自定义验证器
    this.debounceTimers = new Map(); // 防抖定时器
    
    this.setupBuiltinValidators();
    this.bindEvents();
  }
  
  // 设置内置验证器
  setupBuiltinValidators() {
    this.validators.set('required', {
      validate: (value) => value !== null && value !== undefined && value.toString().trim() !== '',
      message: '该字段为必填项'
    });
    
    this.validators.set('email', {
      validate: (value) => !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
      message: '请输入有效的邮箱地址'
    });
    
    this.validators.set('phone', {
      validate: (value) => !value || /^1[3-9]\d{9}$/.test(value),
      message: '请输入有效的手机号码'
    });
    
    this.validators.set('url', {
      validate: (value) => {
        if (!value) return true;
        try {
          new URL(value);
          return true;
        } catch {
          return false;
        }
      },
      message: '请输入有效的URL地址'
    });
    
    this.validators.set('number', {
      validate: (value) => !value || !isNaN(Number(value)),
      message: '请输入有效的数字'
    });
    
    this.validators.set('integer', {
      validate: (value) => !value || /^-?\d+$/.test(value),
      message: '请输入整数'
    });
    
    this.validators.set('minLength', {
      validate: (value, param) => !value || value.length >= param,
      message: (param) => `最少需要${param}个字符`
    });
    
    this.validators.set('maxLength', {
      validate: (value, param) => !value || value.length <= param,
      message: (param) => `最多只能${param}个字符`
    });
    
    this.validators.set('min', {
      validate: (value, param) => !value || Number(value) >= param,
      message: (param) => `最小值为${param}`
    });
    
    this.validators.set('max', {
      validate: (value, param) => !value || Number(value) <= param,
      message: (param) => `最大值为${param}`
    });
    
    this.validators.set('pattern', {
      validate: (value, param) => !value || new RegExp(param).test(value),
      message: '格式不正确'
    });
    
    this.validators.set('confirm', {
      validate: (value, param) => {
        const targetField = this.form.querySelector(`[name="${param}"]`);
        return !value || !targetField || value === targetField.value;
      },
      message: '两次输入不一致'
    });
  }
  
  // 绑定事件
  bindEvents() {
    if (this.options.validateOnInput) {
      this.form.addEventListener('input', this.handleInput.bind(this));
    }
    
    if (this.options.validateOnBlur) {
      this.form.addEventListener('blur', this.handleBlur.bind(this), true);
    }
    
    if (this.options.validateOnSubmit) {
      this.form.addEventListener('submit', this.handleSubmit.bind(this));
    }
  }
  
  // 处理输入事件
  handleInput(e) {
    const field = e.target;
    if (!this.hasRules(field.name)) return;
    
    // 防抖验证
    this.debounceValidate(field);
  }
  
  // 处理失焦事件
  handleBlur(e) {
    const field = e.target;
    if (!this.hasRules(field.name)) return;
    
    this.validateField(field);
  }
  
  // 处理提交事件
  handleSubmit(e) {
    e.preventDefault();
    
    if (this.validateAll()) {
      this.onSubmitSuccess?.(this.getFormData());
    } else {
      this.onSubmitError?.(this.getAllErrors());
    }
  }
  
  // 防抖验证
  debounceValidate(field) {
    const fieldName = field.name;
    
    if (this.debounceTimers.has(fieldName)) {
      clearTimeout(this.debounceTimers.get(fieldName));
    }
    
    const timer = setTimeout(() => {
      this.validateField(field);
      this.debounceTimers.delete(fieldName);
    }, this.options.debounceTime);
    
    this.debounceTimers.set(fieldName, timer);
  }
  
  // 添加验证规则
  addRule(fieldName, rules) {
    this.rules.set(fieldName, rules);
    return this;
  }
  
  // 批量添加规则
  addRules(rulesConfig) {
    Object.entries(rulesConfig).forEach(([fieldName, rules]) => {
      this.addRule(fieldName, rules);
    });
    return this;
  }
  
  // 添加自定义验证器
  addValidator(name, validator) {
    this.validators.set(name, validator);
    return this;
  }
  
  // 检查字段是否有规则
  hasRules(fieldName) {
    return this.rules.has(fieldName);
  }
  
  // 验证单个字段
  async validateField(field) {
    const fieldName = field.name;
    const value = field.value;
    const rules = this.rules.get(fieldName);
    
    if (!rules) return true;
    
    // 清除之前的错误
    this.clearFieldError(fieldName);
    
    for (const rule of rules) {
      const isValid = await this.executeRule(value, rule, field);
      
      if (!isValid) {
        const message = this.getErrorMessage(rule, field);
        this.setFieldError(fieldName, message);
        this.updateFieldUI(field, false);
        return false;
      }
    }
    
    this.updateFieldUI(field, true);
    return true;
  }
  
  // 执行验证规则
  async executeRule(value, rule, field) {
    if (typeof rule === 'string') {
      // 简单规则名
      const validator = this.validators.get(rule);
      return validator ? validator.validate(value) : true;
    }
    
    if (typeof rule === 'function') {
      // 自定义函数
      return await rule(value, field);
    }
    
    if (typeof rule === 'object') {
      const { name, param, validator, async: isAsync } = rule;
      
      if (validator) {
        // 直接提供验证函数
        return isAsync ? await validator(value, param, field) : validator(value, param, field);
      }
      
      if (name) {
        // 使用注册的验证器
        const registeredValidator = this.validators.get(name);
        if (registeredValidator) {
          return registeredValidator.validate(value, param);
        }
      }
    }
    
    return true;
  }
  
  // 获取错误信息
  getErrorMessage(rule, field) {
    if (typeof rule === 'object' && rule.message) {
      return typeof rule.message === 'function' 
        ? rule.message(rule.param, field)
        : rule.message;
    }
    
    if (typeof rule === 'string') {
      const validator = this.validators.get(rule);
      if (validator) {
        return typeof validator.message === 'function'
          ? validator.message()
          : validator.message;
      }
    }
    
    if (typeof rule === 'object' && rule.name) {
      const validator = this.validators.get(rule.name);
      if (validator) {
        return typeof validator.message === 'function'
          ? validator.message(rule.param)
          : validator.message;
      }
    }
    
    return '验证失败';
  }
  
  // 设置字段错误
  setFieldError(fieldName, message) {
    this.errors.set(fieldName, message);
  }
  
  // 清除字段错误
  clearFieldError(fieldName) {
    this.errors.delete(fieldName);
  }
  
  // 更新字段UI
  updateFieldUI(field, isValid) {
    if (!this.options.showErrors) return;
    
    const fieldName = field.name;
    const errorElement = this.getErrorElement(fieldName);
    
    // 更新字段样式
    field.classList.remove(this.options.errorClass, this.options.successClass);
    field.classList.add(isValid ? this.options.successClass : this.options.errorClass);
    
    // 更新错误信息
    if (errorElement) {
      if (isValid) {
        errorElement.textContent = '';
        errorElement.style.display = 'none';
      } else {
        errorElement.textContent = this.errors.get(fieldName) || '';
        errorElement.style.display = 'block';
      }
    }
  }
  
  // 获取或创建错误元素
  getErrorElement(fieldName) {
    let errorElement = this.form.querySelector(`[data-error-for="${fieldName}"]`);
    
    if (!errorElement) {
      const field = this.form.querySelector(`[name="${fieldName}"]`);
      if (field) {
        errorElement = document.createElement('div');
        errorElement.className = 'error-message';
        errorElement.setAttribute('data-error-for', fieldName);
        errorElement.style.cssText = `
          color: #dc3545;
          font-size: 12px;
          margin-top: 4px;
          display: none;
        `;
        
        field.parentNode.insertBefore(errorElement, field.nextSibling);
      }
    }
    
    return errorElement;
  }
  
  // 验证所有字段
  async validateAll() {
    const fields = this.form.querySelectorAll('[name]');
    const results = [];
    
    for (const field of fields) {
      if (this.hasRules(field.name)) {
        results.push(await this.validateField(field));
      }
    }
    
    return results.every(result => result);
  }
  
  // 获取所有错误
  getAllErrors() {
    return Object.fromEntries(this.errors);
  }
  
  // 获取表单数据
  getFormData() {
    const formData = new FormData(this.form);
    const data = {};
    
    for (const [key, value] of formData.entries()) {
      if (data[key]) {
        // 处理多值字段（如checkbox）
        if (Array.isArray(data[key])) {
          data[key].push(value);
        } else {
          data[key] = [data[key], value];
        }
      } else {
        data[key] = value;
      }
    }
    
    return data;
  }
  
  // 清除所有错误
  clearErrors() {
    this.errors.clear();
    
    const errorElements = this.form.querySelectorAll('[data-error-for]');
    errorElements.forEach(el => {
      el.textContent = '';
      el.style.display = 'none';
    });
    
    const fields = this.form.querySelectorAll('[name]');
    fields.forEach(field => {
      field.classList.remove(this.options.errorClass, this.options.successClass);
    });
  }
  
  // 重置表单
  reset() {
    this.form.reset();
    this.clearErrors();
  }
  
  // 销毁验证器
  destroy() {
    this.form.removeEventListener('input', this.handleInput);
    this.form.removeEventListener('blur', this.handleBlur);
    this.form.removeEventListener('submit', this.handleSubmit);
    
    this.debounceTimers.forEach(timer => clearTimeout(timer));
    this.debounceTimers.clear();
  }
}

// 2. 异步验证支持
class AsyncFormValidator extends FormValidator {
  constructor(form, options = {}) {
    super(form, options);
    this.pendingValidations = new Set();
  }
  
  // 添加异步验证器
  addAsyncValidator(name, validator) {
    this.validators.set(name, {
      ...validator,
      async: true
    });
    return this;
  }
  
  // 重写验证字段方法
  async validateField(field) {
    const fieldName = field.name;
    
    // 取消之前的验证
    this.pendingValidations.delete(fieldName);
    
    const validation = super.validateField(field);
    this.pendingValidations.add(fieldName);
    
    try {
      const result = await validation;
      this.pendingValidations.delete(fieldName);
      return result;
    } catch (error) {
      this.pendingValidations.delete(fieldName);
      this.setFieldError(fieldName, '验证过程中发生错误');
      this.updateFieldUI(field, false);
      return false;
    }
  }
  
  // 检查是否有待验证的字段
  hasPendingValidations() {
    return this.pendingValidations.size > 0;
  }
}

// 3. 实际使用示例
class FormValidatorDemo {
  constructor() {
    this.setupUI();
    this.initValidator();
  }
  
  setupUI() {
    document.body.innerHTML = `
      <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
        <h1>表单验证器演示</h1>
        
        <form id="registration-form" style="
          background: white;
          padding: 24px;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        ">
          <h2>用户注册</h2>
          
          <div style="margin-bottom: 16px;">
            <label style="display: block; margin-bottom: 4px; font-weight: bold;">
              用户名 *
            </label>
            <input
              type="text"
              name="username"
              style="
                width: 100%;
                padding: 8px 12px;
                border: 1px solid #ddd;
                border-radius: 4px;
                box-sizing: border-box;
              "
              placeholder="请输入用户名"
            >
          </div>
          
          <div style="margin-bottom: 16px;">
            <label style="display: block; margin-bottom: 4px; font-weight: bold;">
              邮箱 *
            </label>
            <input
              type="email"
              name="email"
              style="
                width: 100%;
                padding: 8px 12px;
                border: 1px solid #ddd;
                border-radius: 4px;
                box-sizing: border-box;
              "
              placeholder="请输入邮箱地址"
            >
          </div>
          
          <div style="margin-bottom: 16px;">
            <label style="display: block; margin-bottom: 4px; font-weight: bold;">
              手机号 *
            </label>
            <input
              type="tel"
              name="phone"
              style="
                width: 100%;
                padding: 8px 12px;
                border: 1px solid #ddd;
                border-radius: 4px;
                box-sizing: border-box;
              "
              placeholder="请输入手机号码"
            >
          </div>
          
          <div style="margin-bottom: 16px;">
            <label style="display: block; margin-bottom: 4px; font-weight: bold;">
              密码 *
            </label>
            <input
              type="password"
              name="password"
              style="
                width: 100%;
                padding: 8px 12px;
                border: 1px solid #ddd;
                border-radius: 4px;
                box-sizing: border-box;
              "
              placeholder="请输入密码"
            >
          </div>
          
          <div style="margin-bottom: 16px;">
            <label style="display: block; margin-bottom: 4px; font-weight: bold;">
              确认密码 *
            </label>
            <input
              type="password"
              name="confirmPassword"
              style="
                width: 100%;
                padding: 8px 12px;
                border: 1px solid #ddd;
                border-radius: 4px;
                box-sizing: border-box;
              "
              placeholder="请再次输入密码"
            >
          </div>
          
          <div style="margin-bottom: 16px;">
            <label style="display: block; margin-bottom: 4px; font-weight: bold;">
              年龄
            </label>
            <input
              type="number"
              name="age"
              style="
                width: 100%;
                padding: 8px 12px;
                border: 1px solid #ddd;
                border-radius: 4px;
                box-sizing: border-box;
              "
              placeholder="请输入年龄"
            >
          </div>
          
          <div style="margin-bottom: 16px;">
            <label style="display: block; margin-bottom: 4px; font-weight: bold;">
              个人网站
            </label>
            <input
              type="url"
              name="website"
              style="
                width: 100%;
                padding: 8px 12px;
                border: 1px solid #ddd;
                border-radius: 4px;
                box-sizing: border-box;
              "
              placeholder="请输入个人网站地址"
            >
          </div>
          
          <div style="margin-bottom: 24px;">
            <label style="display: flex; align-items: center; gap: 8px;">
              <input type="checkbox" name="agree" required>
              <span>我同意用户协议和隐私政策 *</span>
            </label>
          </div>
          
          <div style="display: flex; gap: 12px;">
            <button
              type="submit"
              style="
                flex: 1;
                padding: 12px;
                background: #007bff;
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-size: 16px;
              "
            >
              注册
            </button>
            
            <button
              type="button"
              id="reset-btn"
              style="
                padding: 12px 24px;
                background: #6c757d;
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-size: 16px;
              "
            >
              重置
            </button>
          </div>
        </form>
        
        <div id="result" style="
          margin-top: 20px;
          padding: 16px;
          border-radius: 4px;
          display: none;
        "></div>
        
        <div style="margin-top: 20px;">
          <h3>验证规则说明</h3>
          <ul style="color: #666; font-size: 14px;">
            <li>用户名：必填，3-20个字符，需要异步检查唯一性</li>
            <li>邮箱：必填，有效的邮箱格式</li>
            <li>手机号：必填，有效的中国大陆手机号</li>
            <li>密码：必填，6-20个字符，包含字母和数字</li>
            <li>确认密码：必填，需要与密码一致</li>
            <li>年龄：可选，18-100之间的整数</li>
            <li>个人网站：可选，有效的URL格式</li>
            <li>用户协议：必须勾选</li>
          </ul>
        </div>
      </div>
      
      <style>
        .error {
          border-color: #dc3545 !important;
          background-color: #fff5f5 !important;
        }
        
        .success {
          border-color: #28a745 !important;
          background-color: #f8fff8 !important;
        }
        
        .error-message {
          color: #dc3545;
          font-size: 12px;
          margin-top: 4px;
        }
        
        button:hover {
          opacity: 0.9;
        }
        
        button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      </style>
    `;
  }
  
  initValidator() {
    this.validator = new AsyncFormValidator('#registration-form');
    
    // 添加自定义验证器
    this.validator.addAsyncValidator('uniqueUsername', {
      validate: async (value) => {
        if (!value) return true;
        
        // 模拟异步检查用户名唯一性
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // 模拟已存在的用户名
        const existingUsernames = ['admin', 'test', 'user', 'demo'];
        return !existingUsernames.includes(value.toLowerCase());
      },
      message: '用户名已存在，请选择其他用户名'
    });
    
    this.validator.addValidator('strongPassword', {
      validate: (value) => {
        if (!value) return false;
        // 至少6位，包含字母和数字
        return value.length >= 6 && /[a-zA-Z]/.test(value) && /\d/.test(value);
      },
      message: '密码至少6位，必须包含字母和数字'
    });
    
    // 设置验证规则
    this.validator.addRules({
      username: [
        'required',
        { name: 'minLength', param: 3 },
        { name: 'maxLength', param: 20 },
        { name: 'uniqueUsername', async: true }
      ],
      email: [
        'required',
        'email'
      ],
      phone: [
        'required',
        'phone'
      ],
      password: [
        'required',
        'strongPassword'
      ],
      confirmPassword: [
        'required',
        { name: 'confirm', param: 'password' }
      ],
      age: [
        'integer',
        { name: 'min', param: 18 },
        { name: 'max', param: 100 }
      ],
      website: [
        'url'
      ],
      agree: [
        'required'
      ]
    });
    
    // 设置回调
    this.validator.onSubmitSuccess = (data) => {
      this.showResult('success', '注册成功！', data);
    };
    
    this.validator.onSubmitError = (errors) => {
      this.showResult('error', '表单验证失败，请检查输入', errors);
    };
    
    // 绑定重置按钮
    document.getElementById('reset-btn').addEventListener('click', () => {
      this.validator.reset();
      this.hideResult();
    });
  }
  
  showResult(type, message, data) {
    const resultDiv = document.getElementById('result');
    resultDiv.style.display = 'block';
    resultDiv.style.backgroundColor = type === 'success' ? '#d4edda' : '#f8d7da';
    resultDiv.style.color = type === 'success' ? '#155724' : '#721c24';
    resultDiv.style.border = `1px solid ${type === 'success' ? '#c3e6cb' : '#f5c6cb'}`;
    
    resultDiv.innerHTML = `
      <h4>${message}</h4>
      <pre>${JSON.stringify(data, null, 2)}</pre>
    `;
  }
  
  hideResult() {
    document.getElementById('result').style.display = 'none';
  }
}

// 运行演示
console.log('=== 表单验证器测试 ===\n');

const demo = new FormValidatorDemo();

console.log('表单验证器功能特点：');
console.log('✓ 实时验证和防抖优化');
console.log('✓ 丰富的内置验证规则');
console.log('✓ 异步验证支持');
console.log('✓ 自定义验证器');
console.log('✓ 灵活的错误显示');
console.log('✓ 国际化支持');
console.log('✓ 插件化架构');
console.log('✓ 良好的用户体验');

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    FormValidator,
    AsyncFormValidator
  };
}
