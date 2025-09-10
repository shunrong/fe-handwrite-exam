/**
 * 场景题15: WebSocket聊天室实现
 * 
 * 业务场景：
 * - 实时聊天应用
 * - 在线客服系统
 * - 协作工具的实时通信
 * 
 * 考察点：
 * - WebSocket API 使用
 * - 实时通信协议设计
 * - 连接状态管理和重连机制
 * - 消息队列和本地存储
 * - 用户界面和交互设计
 */

// 1. WebSocket 聊天客户端
class WebSocketChat {
  constructor(container, options = {}) {
    this.container = typeof container === 'string' 
      ? document.querySelector(container) 
      : container;
    
    this.options = {
      serverUrl: 'ws://localhost:8080',
      reconnectInterval: 3000,
      maxReconnectAttempts: 5,
      heartbeatInterval: 30000,
      messageHistoryLimit: 1000,
      enableNotifications: true,
      enableSound: true,
      autoScroll: true,
      showTypingIndicator: true,
      maxMessageLength: 1000,
      ...options
    };
    
    this.state = {
      connected: false,
      connecting: false,
      user: null,
      room: null,
      messages: [],
      users: [],
      reconnectAttempts: 0,
      lastSeen: new Map(),
      typingUsers: new Set(),
      unreadCount: 0
    };
    
    this.callbacks = {
      onConnect: options.onConnect || (() => {}),
      onDisconnect: options.onDisconnect || (() => {}),
      onMessage: options.onMessage || (() => {}),
      onUserJoin: options.onUserJoin || (() => {}),
      onUserLeave: options.onUserLeave || (() => {}),
      onError: options.onError || (() => {})
    };
    
    this.ws = null;
    this.heartbeatTimer = null;
    this.reconnectTimer = null;
    this.typingTimer = null;
    this.elements = {};
    
    this.init();
  }
  
  init() {
    this.createElements();
    this.bindEvents();
    this.loadMessageHistory();
    this.requestNotificationPermission();
  }
  
  // 创建聊天界面
  createElements() {
    this.container.innerHTML = `
      <div class="chat-app">
        <!-- 连接状态栏 -->
        <div class="chat-status-bar">
          <div class="connection-status">
            <span class="status-indicator offline"></span>
            <span class="status-text">未连接</span>
          </div>
          <div class="chat-info">
            <span class="room-name"></span>
            <span class="user-count"></span>
          </div>
        </div>
        
        <!-- 主聊天区域 -->
        <div class="chat-main">
          <!-- 用户列表 -->
          <div class="chat-sidebar">
            <div class="sidebar-header">
              <h3>在线用户</h3>
              <span class="online-count">0</span>
            </div>
            <div class="user-list"></div>
          </div>
          
          <!-- 消息区域 -->
          <div class="chat-content">
            <div class="messages-container">
              <div class="messages-list"></div>
              <div class="typing-indicator" style="display: none;">
                <span class="typing-text"></span>
                <div class="typing-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
            
            <!-- 输入区域 -->
            <div class="chat-input-area">
              <div class="input-toolbar">
                <button class="toolbar-btn" id="emoji-btn" title="表情">😀</button>
                <button class="toolbar-btn" id="file-btn" title="文件">📎</button>
                <button class="toolbar-btn" id="image-btn" title="图片">🖼️</button>
              </div>
              
              <div class="input-container">
                <textarea 
                  class="message-input" 
                  placeholder="输入消息..."
                  maxlength="${this.options.maxMessageLength}"
                ></textarea>
                <button class="send-btn" disabled>
                  <span class="send-icon">➤</span>
                </button>
              </div>
              
              <div class="input-footer">
                <span class="char-count">0/${this.options.maxMessageLength}</span>
                <span class="input-hint">按 Enter 发送，Shift+Enter 换行</span>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 连接对话框 -->
        <div class="connection-dialog" id="connection-dialog">
          <div class="dialog-content">
            <h2>加入聊天室</h2>
            <form id="connection-form">
              <div class="form-group">
                <label>用户名:</label>
                <input type="text" id="username-input" required maxlength="20" placeholder="请输入用户名">
              </div>
              
              <div class="form-group">
                <label>房间:</label>
                <input type="text" id="room-input" required maxlength="20" placeholder="请输入房间名" value="general">
              </div>
              
              <div class="form-group">
                <label>服务器地址:</label>
                <input type="url" id="server-input" value="${this.options.serverUrl}" placeholder="ws://localhost:8080">
              </div>
              
              <div class="form-actions">
                <button type="submit" class="btn btn-primary">连接</button>
              </div>
            </form>
          </div>
        </div>
      </div>
      
      <!-- 表情选择器 -->
      <div class="emoji-picker" id="emoji-picker" style="display: none;">
        <div class="emoji-categories">
          <div class="emoji-category">
            ${this.getEmojiList().map(emoji => `<span class="emoji-item">${emoji}</span>`).join('')}
          </div>
        </div>
      </div>
    `;
    
    // 缓存DOM元素
    this.elements = {
      statusIndicator: this.container.querySelector('.status-indicator'),
      statusText: this.container.querySelector('.status-text'),
      roomName: this.container.querySelector('.room-name'),
      userCount: this.container.querySelector('.user-count'),
      onlineCount: this.container.querySelector('.online-count'),
      userList: this.container.querySelector('.user-list'),
      messagesList: this.container.querySelector('.messages-list'),
      typingIndicator: this.container.querySelector('.typing-indicator'),
      typingText: this.container.querySelector('.typing-text'),
      messageInput: this.container.querySelector('.message-input'),
      sendBtn: this.container.querySelector('.send-btn'),
      charCount: this.container.querySelector('.char-count'),
      connectionDialog: this.container.querySelector('#connection-dialog'),
      emojiPicker: this.container.querySelector('#emoji-picker')
    };
    
    this.addStyles();
  }
  
  // 添加样式
  addStyles() {
    if (document.getElementById('websocket-chat-styles')) return;
    
    const styles = document.createElement('style');
    styles.id = 'websocket-chat-styles';
    styles.textContent = `
      .chat-app {
        display: flex;
        flex-direction: column;
        height: 600px;
        background: white;
        border: 1px solid #ddd;
        border-radius: 8px;
        overflow: hidden;
        font-family: Arial, sans-serif;
        position: relative;
      }
      
      .chat-status-bar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px 16px;
        background: #f8f9fa;
        border-bottom: 1px solid #ddd;
        font-size: 14px;
      }
      
      .connection-status {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      
      .status-indicator {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #dc3545;
      }
      
      .status-indicator.online {
        background: #28a745;
      }
      
      .status-indicator.connecting {
        background: #ffc107;
        animation: pulse 1s infinite;
      }
      
      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
      }
      
      .chat-main {
        display: flex;
        flex: 1;
        overflow: hidden;
      }
      
      .chat-sidebar {
        width: 200px;
        background: #f8f9fa;
        border-right: 1px solid #ddd;
        display: flex;
        flex-direction: column;
      }
      
      .sidebar-header {
        padding: 12px 16px;
        border-bottom: 1px solid #ddd;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      
      .sidebar-header h3 {
        margin: 0;
        font-size: 14px;
        font-weight: 600;
      }
      
      .online-count {
        background: #007bff;
        color: white;
        padding: 2px 6px;
        border-radius: 10px;
        font-size: 12px;
      }
      
      .user-list {
        flex: 1;
        overflow-y: auto;
        padding: 8px;
      }
      
      .user-item {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 6px 8px;
        border-radius: 4px;
        margin-bottom: 2px;
        font-size: 14px;
      }
      
      .user-item:hover {
        background: rgba(0, 123, 255, 0.1);
      }
      
      .user-avatar {
        width: 24px;
        height: 24px;
        border-radius: 50%;
        background: #007bff;
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 10px;
        font-weight: bold;
      }
      
      .user-status {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: #28a745;
        margin-left: auto;
      }
      
      .chat-content {
        flex: 1;
        display: flex;
        flex-direction: column;
      }
      
      .messages-container {
        flex: 1;
        overflow-y: auto;
        padding: 16px;
        background: #fff;
      }
      
      .message {
        margin-bottom: 16px;
        display: flex;
        align-items: flex-start;
        gap: 8px;
      }
      
      .message.own {
        flex-direction: row-reverse;
      }
      
      .message-avatar {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background: #007bff;
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        font-weight: bold;
        flex-shrink: 0;
      }
      
      .message-content {
        flex: 1;
        max-width: 70%;
      }
      
      .message-header {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 2px;
        font-size: 12px;
        color: #666;
      }
      
      .message.own .message-header {
        flex-direction: row-reverse;
      }
      
      .message-sender {
        font-weight: 600;
      }
      
      .message-time {
        font-size: 11px;
      }
      
      .message-body {
        background: #f8f9fa;
        padding: 8px 12px;
        border-radius: 12px;
        word-wrap: break-word;
        white-space: pre-wrap;
        font-size: 14px;
        line-height: 1.4;
      }
      
      .message.own .message-body {
        background: #007bff;
        color: white;
      }
      
      .message.system .message-body {
        background: #fff3cd;
        color: #856404;
        border: 1px solid #ffeaa7;
        text-align: center;
        font-style: italic;
      }
      
      .typing-indicator {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 16px;
        color: #666;
        font-size: 12px;
        font-style: italic;
      }
      
      .typing-dots {
        display: flex;
        gap: 2px;
      }
      
      .typing-dots span {
        width: 4px;
        height: 4px;
        background: #666;
        border-radius: 50%;
        animation: typing 1.4s infinite ease-in-out;
      }
      
      .typing-dots span:nth-child(1) { animation-delay: -0.32s; }
      .typing-dots span:nth-child(2) { animation-delay: -0.16s; }
      
      @keyframes typing {
        0%, 80%, 100% { transform: scale(0); }
        40% { transform: scale(1); }
      }
      
      .chat-input-area {
        border-top: 1px solid #ddd;
        background: white;
      }
      
      .input-toolbar {
        display: flex;
        gap: 4px;
        padding: 8px 16px;
        border-bottom: 1px solid #eee;
      }
      
      .toolbar-btn {
        background: none;
        border: none;
        padding: 6px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 16px;
        transition: background-color 0.2s;
      }
      
      .toolbar-btn:hover {
        background: #f0f0f0;
      }
      
      .input-container {
        display: flex;
        align-items: flex-end;
        gap: 8px;
        padding: 12px 16px;
      }
      
      .message-input {
        flex: 1;
        min-height: 20px;
        max-height: 120px;
        padding: 8px 12px;
        border: 1px solid #ddd;
        border-radius: 20px;
        resize: none;
        outline: none;
        font-family: inherit;
        font-size: 14px;
        line-height: 1.4;
      }
      
      .message-input:focus {
        border-color: #007bff;
      }
      
      .send-btn {
        width: 36px;
        height: 36px;
        border: none;
        border-radius: 50%;
        background: #007bff;
        color: white;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s;
      }
      
      .send-btn:disabled {
        background: #ccc;
        cursor: not-allowed;
      }
      
      .send-btn:not(:disabled):hover {
        background: #0056b3;
        transform: scale(1.05);
      }
      
      .input-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 4px 16px 8px;
        font-size: 12px;
        color: #666;
      }
      
      .connection-dialog {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
      }
      
      .dialog-content {
        background: white;
        padding: 24px;
        border-radius: 8px;
        width: 90%;
        max-width: 400px;
      }
      
      .dialog-content h2 {
        margin: 0 0 20px 0;
        text-align: center;
      }
      
      .form-group {
        margin-bottom: 16px;
      }
      
      .form-group label {
        display: block;
        margin-bottom: 4px;
        font-weight: 500;
      }
      
      .form-group input {
        width: 100%;
        padding: 8px 12px;
        border: 1px solid #ddd;
        border-radius: 4px;
        font-size: 14px;
        box-sizing: border-box;
      }
      
      .form-actions {
        text-align: center;
      }
      
      .btn {
        padding: 10px 20px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
        transition: all 0.2s;
      }
      
      .btn-primary {
        background: #007bff;
        color: white;
      }
      
      .btn-primary:hover {
        background: #0056b3;
      }
      
      .emoji-picker {
        position: absolute;
        bottom: 60px;
        left: 16px;
        background: white;
        border: 1px solid #ddd;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        padding: 16px;
        z-index: 1000;
        max-width: 300px;
      }
      
      .emoji-category {
        display: grid;
        grid-template-columns: repeat(8, 1fr);
        gap: 4px;
      }
      
      .emoji-item {
        padding: 4px;
        border-radius: 4px;
        cursor: pointer;
        text-align: center;
        font-size: 18px;
        transition: background-color 0.2s;
      }
      
      .emoji-item:hover {
        background: #f0f0f0;
      }
      
      /* 滚动条样式 */
      .messages-container::-webkit-scrollbar,
      .user-list::-webkit-scrollbar {
        width: 6px;
      }
      
      .messages-container::-webkit-scrollbar-track,
      .user-list::-webkit-scrollbar-track {
        background: #f1f1f1;
      }
      
      .messages-container::-webkit-scrollbar-thumb,
      .user-list::-webkit-scrollbar-thumb {
        background: #c1c1c1;
        border-radius: 3px;
      }
      
      .messages-container::-webkit-scrollbar-thumb:hover,
      .user-list::-webkit-scrollbar-thumb:hover {
        background: #a8a8a8;
      }
      
      /* 响应式设计 */
      @media (max-width: 768px) {
        .chat-sidebar {
          display: none;
        }
        
        .message-content {
          max-width: 85%;
        }
      }
    `;
    
    document.head.appendChild(styles);
  }
  
  // 绑定事件
  bindEvents() {
    // 连接表单
    document.getElementById('connection-form').addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleConnect();
    });
    
    // 消息输入
    const messageInput = this.elements.messageInput;
    messageInput.addEventListener('input', (e) => {
      this.handleInputChange(e);
    });
    
    messageInput.addEventListener('keydown', (e) => {
      this.handleKeyDown(e);
    });
    
    // 发送按钮
    this.elements.sendBtn.addEventListener('click', () => {
      this.sendMessage();
    });
    
    // 工具栏按钮
    document.getElementById('emoji-btn').addEventListener('click', () => {
      this.toggleEmojiPicker();
    });
    
    document.getElementById('file-btn').addEventListener('click', () => {
      this.selectFile();
    });
    
    document.getElementById('image-btn').addEventListener('click', () => {
      this.selectImage();
    });
    
    // 表情选择
    this.elements.emojiPicker.addEventListener('click', (e) => {
      if (e.target.classList.contains('emoji-item')) {
        this.insertEmoji(e.target.textContent);
      }
    });
    
    // 点击外部关闭表情选择器
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.emoji-picker') && !e.target.closest('#emoji-btn')) {
        this.elements.emojiPicker.style.display = 'none';
      }
    });
  }
  
  // 处理连接
  handleConnect() {
    const username = document.getElementById('username-input').value.trim();
    const room = document.getElementById('room-input').value.trim();
    const serverUrl = document.getElementById('server-input').value.trim();
    
    if (!username || !room) {
      alert('请填写用户名和房间名');
      return;
    }
    
    this.state.user = { name: username };
    this.state.room = room;
    this.options.serverUrl = serverUrl;
    
    this.connect();
  }
  
  // 连接WebSocket
  connect() {
    if (this.state.connected || this.state.connecting) return;
    
    this.state.connecting = true;
    this.updateConnectionStatus('connecting', '连接中...');
    
    try {
      this.ws = new WebSocket(this.options.serverUrl);
      
      this.ws.onopen = () => {
        this.handleOpen();
      };
      
      this.ws.onmessage = (event) => {
        this.handleMessage(event);
      };
      
      this.ws.onclose = (event) => {
        this.handleClose(event);
      };
      
      this.ws.onerror = (error) => {
        this.handleError(error);
      };
      
    } catch (error) {
      this.handleError(error);
    }
  }
  
  // 处理连接打开
  handleOpen() {
    this.state.connected = true;
    this.state.connecting = false;
    this.state.reconnectAttempts = 0;
    
    this.updateConnectionStatus('online', '已连接');
    this.elements.connectionDialog.style.display = 'none';
    
    // 发送加入房间消息
    this.sendSystemMessage({
      type: 'join',
      user: this.state.user,
      room: this.state.room
    });
    
    // 启动心跳
    this.startHeartbeat();
    
    this.callbacks.onConnect();
  }
  
  // 处理消息接收
  handleMessage(event) {
    try {
      const message = JSON.parse(event.data);
      this.processMessage(message);
    } catch (error) {
      console.error('Failed to parse message:', error);
    }
  }
  
  // 处理连接关闭
  handleClose(event) {
    this.state.connected = false;
    this.state.connecting = false;
    
    this.updateConnectionStatus('offline', '连接断开');
    this.stopHeartbeat();
    
    this.callbacks.onDisconnect(event);
    
    // 自动重连
    if (event.code !== 1000 && this.state.reconnectAttempts < this.options.maxReconnectAttempts) {
      this.scheduleReconnect();
    }
  }
  
  // 处理错误
  handleError(error) {
    console.error('WebSocket error:', error);
    this.state.connecting = false;
    this.updateConnectionStatus('offline', '连接失败');
    this.callbacks.onError(error);
  }
  
  // 处理消息
  processMessage(message) {
    switch (message.type) {
      case 'message':
        this.addMessage(message);
        break;
      case 'userJoin':
        this.handleUserJoin(message);
        break;
      case 'userLeave':
        this.handleUserLeave(message);
        break;
      case 'userList':
        this.updateUserList(message.users);
        break;
      case 'typing':
        this.handleTyping(message);
        break;
      case 'stopTyping':
        this.handleStopTyping(message);
        break;
      case 'pong':
        // 心跳响应
        break;
      default:
        console.log('Unknown message type:', message);
    }
  }
  
  // 发送消息
  sendMessage(content = null) {
    const text = content || this.elements.messageInput.value.trim();
    
    if (!text || !this.state.connected) return;
    
    const message = {
      type: 'message',
      content: text,
      user: this.state.user,
      room: this.state.room,
      timestamp: Date.now()
    };
    
    this.sendSystemMessage(message);
    
    if (!content) {
      this.elements.messageInput.value = '';
      this.updateCharCount();
      this.updateSendButton();
    }
  }
  
  // 发送系统消息
  sendSystemMessage(message) {
    if (this.state.connected && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }
  
  // 添加消息到界面
  addMessage(message) {
    const messageElement = this.createMessageElement(message);
    this.elements.messagesList.appendChild(messageElement);
    
    // 限制消息历史数量
    const messages = this.elements.messagesList.children;
    if (messages.length > this.options.messageHistoryLimit) {
      messages[0].remove();
    }
    
    // 自动滚动
    if (this.options.autoScroll) {
      this.scrollToBottom();
    }
    
    // 保存到本地存储
    this.saveMessage(message);
    
    // 通知和声音
    if (message.user.name !== this.state.user.name) {
      this.showNotification(message);
      this.playSound();
    }
    
    this.callbacks.onMessage(message);
  }
  
  // 创建消息元素
  createMessageElement(message) {
    const div = document.createElement('div');
    const isOwn = message.user.name === this.state.user.name;
    const isSystem = message.type === 'system';
    
    div.className = `message ${isOwn ? 'own' : ''} ${isSystem ? 'system' : ''}`;
    
    if (isSystem) {
      div.innerHTML = `
        <div class="message-content">
          <div class="message-body">${message.content}</div>
        </div>
      `;
    } else {
      const avatar = this.createAvatar(message.user.name);
      const time = this.formatTime(message.timestamp);
      
      div.innerHTML = `
        <div class="message-avatar">${avatar}</div>
        <div class="message-content">
          <div class="message-header">
            <span class="message-sender">${message.user.name}</span>
            <span class="message-time">${time}</span>
          </div>
          <div class="message-body">${this.formatMessageContent(message.content)}</div>
        </div>
      `;
    }
    
    return div;
  }
  
  // 创建头像
  createAvatar(name) {
    return name.charAt(0).toUpperCase();
  }
  
  // 格式化消息内容
  formatMessageContent(content) {
    // 转义HTML
    const escaped = content
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    
    // 处理链接
    const withLinks = escaped.replace(
      /(https?:\/\/[^\s]+)/g,
      '<a href="$1" target="_blank" rel="noopener">$1</a>'
    );
    
    return withLinks;
  }
  
  // 格式化时间
  formatTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  
  // 处理用户加入
  handleUserJoin(message) {
    this.addMessage({
      type: 'system',
      content: `${message.user.name} 加入了聊天室`,
      timestamp: Date.now()
    });
    
    this.callbacks.onUserJoin(message.user);
  }
  
  // 处理用户离开
  handleUserLeave(message) {
    this.addMessage({
      type: 'system',
      content: `${message.user.name} 离开了聊天室`,
      timestamp: Date.now()
    });
    
    this.callbacks.onUserLeave(message.user);
  }
  
  // 更新用户列表
  updateUserList(users) {
    this.state.users = users;
    
    const userList = this.elements.userList;
    userList.innerHTML = users.map(user => `
      <div class="user-item">
        <div class="user-avatar">${this.createAvatar(user.name)}</div>
        <span class="user-name">${user.name}</span>
        <div class="user-status"></div>
      </div>
    `).join('');
    
    this.elements.onlineCount.textContent = users.length;
    this.elements.userCount.textContent = `${users.length} 人在线`;
  }
  
  // 处理正在输入
  handleTyping(message) {
    if (message.user.name === this.state.user.name) return;
    
    this.state.typingUsers.add(message.user.name);
    this.updateTypingIndicator();
  }
  
  // 处理停止输入
  handleStopTyping(message) {
    this.state.typingUsers.delete(message.user.name);
    this.updateTypingIndicator();
  }
  
  // 更新输入指示器
  updateTypingIndicator() {
    const typingArray = Array.from(this.state.typingUsers);
    
    if (typingArray.length === 0) {
      this.elements.typingIndicator.style.display = 'none';
    } else {
      let text = '';
      if (typingArray.length === 1) {
        text = `${typingArray[0]} 正在输入...`;
      } else if (typingArray.length === 2) {
        text = `${typingArray[0]} 和 ${typingArray[1]} 正在输入...`;
      } else {
        text = `${typingArray.length} 人正在输入...`;
      }
      
      this.elements.typingText.textContent = text;
      this.elements.typingIndicator.style.display = 'flex';
    }
  }
  
  // 处理输入变化
  handleInputChange(e) {
    this.updateCharCount();
    this.updateSendButton();
    
    // 发送正在输入指示
    if (this.options.showTypingIndicator) {
      this.sendTypingIndicator();
    }
    
    // 自动调整高度
    this.autoResizeTextarea(e.target);
  }
  
  // 处理键盘事件
  handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      this.sendMessage();
    }
  }
  
  // 发送正在输入指示
  sendTypingIndicator() {
    if (this.typingTimer) {
      clearTimeout(this.typingTimer);
    } else {
      // 发送开始输入
      this.sendSystemMessage({
        type: 'typing',
        user: this.state.user,
        room: this.state.room
      });
    }
    
    // 3秒后发送停止输入
    this.typingTimer = setTimeout(() => {
      this.sendSystemMessage({
        type: 'stopTyping',
        user: this.state.user,
        room: this.state.room
      });
      this.typingTimer = null;
    }, 3000);
  }
  
  // 自动调整文本域高度
  autoResizeTextarea(textarea) {
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
  }
  
  // 更新字符计数
  updateCharCount() {
    const length = this.elements.messageInput.value.length;
    this.elements.charCount.textContent = `${length}/${this.options.maxMessageLength}`;
  }
  
  // 更新发送按钮状态
  updateSendButton() {
    const hasContent = this.elements.messageInput.value.trim().length > 0;
    this.elements.sendBtn.disabled = !hasContent || !this.state.connected;
  }
  
  // 更新连接状态
  updateConnectionStatus(status, text) {
    this.elements.statusIndicator.className = `status-indicator ${status}`;
    this.elements.statusText.textContent = text;
    this.elements.roomName.textContent = this.state.room || '';
    
    this.updateSendButton();
  }
  
  // 滚动到底部
  scrollToBottom() {
    const container = this.elements.messagesList.parentElement;
    container.scrollTop = container.scrollHeight;
  }
  
  // 启动心跳
  startHeartbeat() {
    this.heartbeatTimer = setInterval(() => {
      if (this.state.connected) {
        this.sendSystemMessage({ type: 'ping' });
      }
    }, this.options.heartbeatInterval);
  }
  
  // 停止心跳
  stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }
  
  // 计划重连
  scheduleReconnect() {
    this.state.reconnectAttempts++;
    
    this.updateConnectionStatus('connecting', `重连中... (${this.state.reconnectAttempts}/${this.options.maxReconnectAttempts})`);
    
    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, this.options.reconnectInterval);
  }
  
  // 切换表情选择器
  toggleEmojiPicker() {
    const picker = this.elements.emojiPicker;
    picker.style.display = picker.style.display === 'none' ? 'block' : 'none';
  }
  
  // 插入表情
  insertEmoji(emoji) {
    const input = this.elements.messageInput;
    const start = input.selectionStart;
    const end = input.selectionEnd;
    const value = input.value;
    
    input.value = value.slice(0, start) + emoji + value.slice(end);
    input.selectionStart = input.selectionEnd = start + emoji.length;
    input.focus();
    
    this.updateCharCount();
    this.updateSendButton();
    this.elements.emojiPicker.style.display = 'none';
  }
  
  // 选择文件
  selectFile() {
    const input = document.createElement('input');
    input.type = 'file';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        this.uploadFile(file);
      }
    };
    input.click();
  }
  
  // 选择图片
  selectImage() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        this.uploadImage(file);
      }
    };
    input.click();
  }
  
  // 上传文件
  uploadFile(file) {
    // 模拟文件上传
    console.log('Uploading file:', file.name);
    this.sendMessage(`📎 ${file.name} (${this.formatFileSize(file.size)})`);
  }
  
  // 上传图片
  uploadImage(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      // 模拟图片上传
      console.log('Uploading image:', file.name);
      this.sendMessage(`🖼️ ${file.name}`);
    };
    reader.readAsDataURL(file);
  }
  
  // 格式化文件大小
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
  
  // 显示通知
  showNotification(message) {
    if (!this.options.enableNotifications || !('Notification' in window)) return;
    
    if (Notification.permission === 'granted') {
      new Notification(`${message.user.name} 说:`, {
        body: message.content,
        icon: '/favicon.ico'
      });
    }
  }
  
  // 播放声音
  playSound() {
    if (!this.options.enableSound) return;
    
    // 创建音频提示
    const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmUfCjiS2e3EeyUFJHfJ8N5/PwgQXrPq7a1XFQt' );
    audio.play().catch(() => {
      // 忽略自动播放错误
    });
  }
  
  // 请求通知权限
  requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }
  
  // 获取表情列表
  getEmojiList() {
    return [
      '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣',
      '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰',
      '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜',
      '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏',
      '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣',
      '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠',
      '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨',
      '😰', '😥', '😓', '🤗', '🤔', '🤭', '🤫', '🤥',
      '😶', '😐', '😑', '😬', '🙄', '😯', '😦', '😧',
      '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐',
      '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕', '🤑',
      '🤠', '😈', '👿', '👹', '👺', '🤡', '💩', '👻',
      '💀', '☠️', '👽', '👾', '🤖', '🎃', '😺', '😸',
      '😹', '😻', '😼', '😽', '🙀', '😿', '😾', '👋',
      '🤚', '🖐️', '✋', '🖖', '👌', '🤏', '✌️', '🤞',
      '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇',
      '☝️', '👍', '👎', '👊', '✊', '🤛', '🤜', '👏',
      '🙌', '👐', '🤲', '🤝', '🙏', '✍️', '💅', '🤳',
      '💪', '🦾', '🦿', '🦵', '🦶', '👂', '🦻', '👃',
      '🧠', '🦷', '🦴', '👀', '👁️', '👅', '👄', '💋'
    ];
  }
  
  // 保存消息到本地存储
  saveMessage(message) {
    try {
      const key = `chat_${this.state.room}`;
      const messages = JSON.parse(localStorage.getItem(key) || '[]');
      messages.push(message);
      
      // 限制本地存储的消息数量
      if (messages.length > this.options.messageHistoryLimit) {
        messages.splice(0, messages.length - this.options.messageHistoryLimit);
      }
      
      localStorage.setItem(key, JSON.stringify(messages));
    } catch (error) {
      console.error('Failed to save message:', error);
    }
  }
  
  // 加载消息历史
  loadMessageHistory() {
    try {
      const key = `chat_${this.state.room}`;
      const messages = JSON.parse(localStorage.getItem(key) || '[]');
      
      messages.forEach(message => {
        const messageElement = this.createMessageElement(message);
        this.elements.messagesList.appendChild(messageElement);
      });
      
      if (messages.length > 0) {
        this.scrollToBottom();
      }
    } catch (error) {
      console.error('Failed to load message history:', error);
    }
  }
  
  // 断开连接
  disconnect() {
    if (this.ws) {
      this.ws.close(1000, 'User disconnected');
    }
    
    this.stopHeartbeat();
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }
  
  // 销毁聊天室
  destroy() {
    this.disconnect();
    this.container.innerHTML = '';
  }
}

// 2. 演示应用
class WebSocketChatDemo {
  constructor() {
    this.setupUI();
    this.initChat();
  }
  
  setupUI() {
    document.body.innerHTML = `
      <div style="max-width: 1000px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
        <h1>WebSocket 聊天室演示</h1>
        
        <div style="margin-bottom: 20px;">
          <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 12px; border-radius: 4px; margin-bottom: 16px;">
            <strong>注意:</strong> 这是一个前端演示版本。实际使用需要配合 WebSocket 服务器。
            你可以在浏览器的开发者工具中看到模拟的连接和消息处理。
          </div>
          
          <div style="display: flex; gap: 12px; align-items: center; flex-wrap: wrap;">
            <button id="simulate-user" class="demo-btn">模拟其他用户</button>
            <button id="simulate-message" class="demo-btn">模拟接收消息</button>
            <button id="clear-history" class="demo-btn">清空历史</button>
            <label>
              <input type="checkbox" id="notifications-toggle" checked>
              启用通知
            </label>
            <label>
              <input type="checkbox" id="sound-toggle" checked>
              启用声音
            </label>
          </div>
        </div>
        
        <div id="chat-container" style="height: 600px;"></div>
        
        <div style="margin-top: 20px;">
          <h3>功能特点</h3>
          <div style="
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 12px;
            font-size: 14px;
          ">
            <div>✓ 实时消息发送和接收</div>
            <div>✓ 用户在线状态显示</div>
            <div>✓ 正在输入指示器</div>
            <div>✓ 表情和文件支持</div>
            <div>✓ 消息历史本地存储</div>
            <div>✓ 自动重连机制</div>
            <div>✓ 桌面通知提醒</div>
            <div>✓ 响应式界面设计</div>
          </div>
        </div>
        
        <div style="margin-top: 20px;">
          <h3>技术实现</h3>
          <div style="background: #f8f9fa; padding: 16px; border-radius: 8px; font-size: 14px;">
            <div style="margin-bottom: 8px;"><strong>前端技术:</strong></div>
            <ul style="margin: 8px 0; padding-left: 20px;">
              <li>WebSocket API 进行实时通信</li>
              <li>本地存储保存聊天历史</li>
              <li>Notification API 桌面通知</li>
              <li>文件上传和图片预览</li>
              <li>响应式 CSS 设计</li>
            </ul>
            
            <div style="margin: 16px 0 8px 0;"><strong>服务器要求:</strong></div>
            <ul style="margin: 8px 0; padding-left: 20px;">
              <li>WebSocket 服务器 (Node.js/Python/Java等)</li>
              <li>用户认证和房间管理</li>
              <li>消息广播和私聊</li>
              <li>在线用户列表维护</li>
              <li>消息持久化存储</li>
            </ul>
          </div>
        </div>
      </div>
      
      <style>
        .demo-btn {
          padding: 8px 16px;
          border: 1px solid #ddd;
          border-radius: 4px;
          background: white;
          cursor: pointer;
          font-size: 14px;
          transition: all 0.2s;
        }
        
        .demo-btn:hover {
          background: #f0f0f0;
          border-color: #007bff;
        }
        
        label {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 14px;
        }
      </style>
    `;
  }
  
  initChat() {
    // 创建模拟的 WebSocket 服务器
    this.createMockWebSocketServer();
    
    this.chat = new WebSocketChat('#chat-container', {
      serverUrl: 'ws://localhost:3000',  // 模拟地址
      enableNotifications: true,
      enableSound: true,
      onConnect: () => {
        console.log('聊天室已连接');
        this.simulateInitialData();
      },
      onDisconnect: () => {
        console.log('聊天室已断开');
      },
      onMessage: (message) => {
        console.log('收到消息:', message);
      },
      onError: (error) => {
        console.error('聊天室错误:', error);
      }
    });
    
    this.bindEvents();
  }
  
  // 创建模拟 WebSocket 服务器
  createMockWebSocketServer() {
    // 重写 WebSocket 构造函数进行模拟
    const originalWebSocket = window.WebSocket;
    
    window.WebSocket = class MockWebSocket {
      constructor(url) {
        this.url = url;
        this.readyState = WebSocket.CONNECTING;
        
        // 模拟连接延迟
        setTimeout(() => {
          this.readyState = WebSocket.OPEN;
          this.onopen?.();
        }, 1000);
      }
      
      send(data) {
        console.log('发送数据:', JSON.parse(data));
        
        // 模拟服务器响应
        const message = JSON.parse(data);
        if (message.type === 'join') {
          // 模拟用户列表
          setTimeout(() => {
            this.onmessage?.({
              data: JSON.stringify({
                type: 'userList',
                users: [
                  { name: message.user.name },
                  { name: 'Alice' },
                  { name: 'Bob' }
                ]
              })
            });
          }, 100);
        }
      }
      
      close() {
        this.readyState = WebSocket.CLOSED;
        this.onclose?.({ code: 1000 });
      }
    };
    
    // 保留常量
    window.WebSocket.CONNECTING = originalWebSocket.CONNECTING;
    window.WebSocket.OPEN = originalWebSocket.OPEN;
    window.WebSocket.CLOSING = originalWebSocket.CLOSING;
    window.WebSocket.CLOSED = originalWebSocket.CLOSED;
  }
  
  bindEvents() {
    // 模拟其他用户
    document.getElementById('simulate-user').addEventListener('click', () => {
      this.simulateUser();
    });
    
    // 模拟接收消息
    document.getElementById('simulate-message').addEventListener('click', () => {
      this.simulateMessage();
    });
    
    // 清空历史
    document.getElementById('clear-history').addEventListener('click', () => {
      localStorage.clear();
      location.reload();
    });
    
    // 通知开关
    document.getElementById('notifications-toggle').addEventListener('change', (e) => {
      this.chat.options.enableNotifications = e.target.checked;
    });
    
    // 声音开关
    document.getElementById('sound-toggle').addEventListener('change', (e) => {
      this.chat.options.enableSound = e.target.checked;
    });
  }
  
  simulateInitialData() {
    // 模拟初始消息
    setTimeout(() => {
      this.chat.processMessage({
        type: 'message',
        content: '欢迎来到聊天室！这是一个演示消息。',
        user: { name: 'System' },
        timestamp: Date.now() - 60000
      });
    }, 500);
  }
  
  simulateUser() {
    const users = ['Charlie', 'Diana', 'Eve', 'Frank'];
    const randomUser = users[Math.floor(Math.random() * users.length)];
    
    this.chat.processMessage({
      type: 'userJoin',
      user: { name: randomUser }
    });
    
    // 更新用户列表
    setTimeout(() => {
      this.chat.processMessage({
        type: 'userList',
        users: [
          { name: this.chat.state.user?.name || 'You' },
          { name: 'Alice' },
          { name: 'Bob' },
          { name: randomUser }
        ]
      });
    }, 100);
  }
  
  simulateMessage() {
    const messages = [
      '大家好！',
      '今天天气真不错 ☀️',
      '有人在吗？',
      '这个聊天室界面很棒！',
      '我正在测试消息功能',
      '😄 表情符号测试',
      '链接测试: https://github.com',
      '这是一条比较长的消息，用来测试消息显示的换行和布局效果，看看是否能够正常显示。'
    ];
    
    const users = ['Alice', 'Bob', 'Charlie'];
    const randomMessage = messages[Math.floor(Math.random() * messages.length)];
    const randomUser = users[Math.floor(Math.random() * users.length)];
    
    this.chat.processMessage({
      type: 'message',
      content: randomMessage,
      user: { name: randomUser },
      timestamp: Date.now()
    });
  }
}

// 运行演示
console.log('=== WebSocket聊天室测试 ===\n');

const demo = new WebSocketChatDemo();

console.log('WebSocket聊天室功能特点：');
console.log('✓ 实时双向通信');
console.log('✓ 用户在线状态管理');
console.log('✓ 消息历史本地存储');
console.log('✓ 表情和文件上传支持');
console.log('✓ 正在输入指示器');
console.log('✓ 自动重连机制');
console.log('✓ 桌面通知和声音提醒');
console.log('✓ 响应式聊天界面');

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    WebSocketChat
  };
}
