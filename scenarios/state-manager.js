/**
 * 场景题3: 简单的状态管理器实现
 * 
 * 业务场景：
 * - 中小型项目需要全局状态管理，但不想引入Redux/Vuex等重量级库
 * - 需要支持状态订阅、异步action、中间件等基础功能
 * - 希望API简洁，学习成本低
 * 
 * 考察点：
 * - 设计模式应用（观察者、发布订阅）
 * - 函数式编程思想
 * - 异步处理能力
 * - API设计能力
 * - 性能优化意识
 */

// 1. 基础状态管理器
class SimpleStateManager {
  constructor(initialState = {}) {
    this.state = { ...initialState };
    this.listeners = new Set();
    this.isDispatching = false;
    this.actionHistory = [];
    this.maxHistorySize = 50;
  }
  
  // 获取当前状态
  getState() {
    return { ...this.state };
  }
  
  // 订阅状态变化
  subscribe(listener) {
    if (typeof listener !== 'function') {
      throw new Error('Listener must be a function');
    }
    
    this.listeners.add(listener);
    
    // 返回取消订阅函数
    return () => {
      this.listeners.delete(listener);
    };
  }
  
  // 派发action
  dispatch(action) {
    if (typeof action !== 'object' || action === null) {
      throw new Error('Action must be an object');
    }
    
    if (typeof action.type !== 'string') {
      throw new Error('Action must have a type property');
    }
    
    if (this.isDispatching) {
      throw new Error('Cannot dispatch while dispatching');
    }
    
    try {
      this.isDispatching = true;
      const prevState = this.state;
      
      // 记录action历史
      this.recordAction(action, prevState);
      
      // 执行reducer
      this.state = this.reducer(this.state, action);
      
      // 通知所有监听者
      this.notifyListeners(prevState, this.state, action);
      
    } finally {
      this.isDispatching = false;
    }
    
    return action;
  }
  
  // 默认reducer（子类需要重写）
  reducer(state, action) {
    return state;
  }
  
  // 通知监听者
  notifyListeners(prevState, currentState, action) {
    this.listeners.forEach(listener => {
      try {
        listener(currentState, prevState, action);
      } catch (error) {
        console.error('Error in state listener:', error);
      }
    });
  }
  
  // 记录action历史
  recordAction(action, prevState) {
    this.actionHistory.push({
      action,
      prevState: { ...prevState },
      timestamp: Date.now()
    });
    
    // 限制历史记录大小
    if (this.actionHistory.length > this.maxHistorySize) {
      this.actionHistory.shift();
    }
  }
  
  // 获取action历史
  getHistory() {
    return [...this.actionHistory];
  }
  
  // 清空历史
  clearHistory() {
    this.actionHistory = [];
  }
}

// 2. 支持reducer的状态管理器
class ReducerStateManager extends SimpleStateManager {
  constructor(reducer, initialState = {}) {
    super(initialState);
    this.reducerFunction = reducer;
  }
  
  reducer(state, action) {
    return this.reducerFunction(state, action);
  }
}

// 3. 支持中间件的状态管理器
class MiddlewareStateManager extends ReducerStateManager {
  constructor(reducer, initialState = {}, middlewares = []) {
    super(reducer, initialState);
    this.middlewares = middlewares;
    this.enhancedDispatch = this.applyMiddlewares();
  }
  
  // 应用中间件
  applyMiddlewares() {
    if (this.middlewares.length === 0) {
      return this.dispatch.bind(this);
    }
    
    const middlewareAPI = {
      getState: this.getState.bind(this),
      dispatch: (action) => this.enhancedDispatch(action)
    };
    
    const chain = this.middlewares.map(middleware => middleware(middlewareAPI));
    
    return chain.reduce((prev, next) => next(prev), this.dispatch.bind(this));
  }
  
  // 重写dispatch以使用增强版本
  dispatch(action) {
    return this.enhancedDispatch(action);
  }
}

// 4. 异步action支持的状态管理器
class AsyncStateManager extends MiddlewareStateManager {
  constructor(reducer, initialState = {}) {
    // 内置异步中间件
    const thunkMiddleware = (store) => (next) => (action) => {
      if (typeof action === 'function') {
        return action(store.dispatch, store.getState);
      }
      return next(action);
    };
    
    super(reducer, initialState, [thunkMiddleware]);
  }
}

// 5. 完整功能的状态管理器
class AdvancedStateManager extends AsyncStateManager {
  constructor(config = {}) {
    const {
      reducer,
      initialState = {},
      middlewares = [],
      devtools = false,
      persist = false,
      persistKey = 'app_state'
    } = config;
    
    // 如果启用持久化，尝试从存储中恢复状态
    const restoredState = persist ? this.loadPersistedState(persistKey) : {};
    const finalInitialState = { ...initialState, ...restoredState };
    
    super(reducer, finalInitialState);
    
    this.devtools = devtools;
    this.persist = persist;
    this.persistKey = persistKey;
    
    // 添加自定义中间件
    this.middlewares = [
      ...this.middlewares,
      ...middlewares,
      ...(devtools ? [this.createDevtoolsMiddleware()] : []),
      ...(persist ? [this.createPersistMiddleware()] : [])
    ];
    
    this.enhancedDispatch = this.applyMiddlewares();
    
    // 初始化开发者工具
    if (devtools && window.__REDUX_DEVTOOLS_EXTENSION__) {
      this.initDevtools();
    }
  }
  
  // 创建开发者工具中间件
  createDevtoolsMiddleware() {
    return (store) => (next) => (action) => {
      const result = next(action);
      
      if (this.devtoolsConnection) {
        this.devtoolsConnection.send(action, store.getState());
      }
      
      return result;
    };
  }
  
  // 创建持久化中间件
  createPersistMiddleware() {
    return (store) => (next) => (action) => {
      const result = next(action);
      
      // 异步保存状态
      setTimeout(() => {
        this.persistState(this.persistKey, store.getState());
      }, 0);
      
      return result;
    };
  }
  
  // 初始化开发者工具
  initDevtools() {
    if (window.__REDUX_DEVTOOLS_EXTENSION__) {
      this.devtoolsConnection = window.__REDUX_DEVTOOLS_EXTENSION__.connect({
        name: 'SimpleStateManager'
      });
      
      this.devtoolsConnection.init(this.state);
    }
  }
  
  // 加载持久化状态
  loadPersistedState(key) {
    try {
      const serializedState = localStorage.getItem(key);
      if (serializedState === null) {
        return {};
      }
      return JSON.parse(serializedState);
    } catch (error) {
      console.warn('Failed to load persisted state:', error);
      return {};
    }
  }
  
  // 持久化状态
  persistState(key, state) {
    try {
      const serializedState = JSON.stringify(state);
      localStorage.setItem(key, serializedState);
    } catch (error) {
      console.warn('Failed to persist state:', error);
    }
  }
  
  // 时间旅行调试
  timeTravel(index) {
    if (index < 0 || index >= this.actionHistory.length) {
      throw new Error('Invalid history index');
    }
    
    const targetHistory = this.actionHistory[index];
    this.state = { ...targetHistory.prevState };
    this.notifyListeners({}, this.state, { type: '@@TIME_TRAVEL' });
  }
  
  // 重放actions
  replay(actions) {
    const initialState = this.state;
    
    try {
      actions.forEach(action => {
        this.dispatch(action);
      });
    } catch (error) {
      // 如果重放失败，恢复到初始状态
      this.state = initialState;
      throw error;
    }
  }
}

// 6. React Hook 支持
function useStateManager(stateManager, selector = state => state) {
  const [state, setState] = useState(() => selector(stateManager.getState()));
  
  useEffect(() => {
    const unsubscribe = stateManager.subscribe((newState) => {
      const selectedState = selector(newState);
      setState(selectedState);
    });
    
    return unsubscribe;
  }, [stateManager, selector]);
  
  const dispatch = useCallback(
    (action) => stateManager.dispatch(action),
    [stateManager]
  );
  
  return [state, dispatch];
}

// 7. 实用工具函数
const StateUtils = {
  // 创建action creator
  createAction: (type, payloadCreator) => {
    return (...args) => {
      const action = { type };
      
      if (payloadCreator) {
        action.payload = payloadCreator(...args);
      } else if (args.length === 1) {
        action.payload = args[0];
      } else if (args.length > 1) {
        action.payload = args;
      }
      
      return action;
    };
  },
  
  // 创建异步action creator
  createAsyncAction: (type) => {
    return {
      request: StateUtils.createAction(`${type}_REQUEST`),
      success: StateUtils.createAction(`${type}_SUCCESS`),
      failure: StateUtils.createAction(`${type}_FAILURE`)
    };
  },
  
  // 组合reducer
  combineReducers: (reducers) => {
    return (state = {}, action) => {
      const nextState = {};
      let hasChanged = false;
      
      for (const key in reducers) {
        const reducer = reducers[key];
        const prevStateForKey = state[key];
        const nextStateForKey = reducer(prevStateForKey, action);
        
        nextState[key] = nextStateForKey;
        hasChanged = hasChanged || nextStateForKey !== prevStateForKey;
      }
      
      return hasChanged ? nextState : state;
    };
  },
  
  // 创建reducer
  createReducer: (initialState, handlers) => {
    return (state = initialState, action) => {
      if (handlers.hasOwnProperty(action.type)) {
        return handlers[action.type](state, action);
      }
      return state;
    };
  }
};

// 8. 常用中间件
const CommonMiddlewares = {
  // 日志中间件
  logger: (store) => (next) => (action) => {
    console.group(`Action: ${action.type}`);
    console.log('Previous State:', store.getState());
    console.log('Action:', action);
    
    const result = next(action);
    
    console.log('Next State:', store.getState());
    console.groupEnd();
    
    return result;
  },
  
  // 性能监控中间件
  performance: (store) => (next) => (action) => {
    const startTime = performance.now();
    const result = next(action);
    const endTime = performance.now();
    
    if (endTime - startTime > 10) { // 超过10ms的action记录警告
      console.warn(`Slow action detected: ${action.type} took ${(endTime - startTime).toFixed(2)}ms`);
    }
    
    return result;
  },
  
  // 错误处理中间件
  errorHandler: (store) => (next) => (action) => {
    try {
      return next(action);
    } catch (error) {
      console.error('Error in action:', action.type, error);
      
      // 派发错误action
      store.dispatch({
        type: '@@ERROR',
        payload: {
          originalAction: action,
          error: error.message
        }
      });
      
      throw error;
    }
  }
};

// 9. 实际使用示例
class TodoApp {
  constructor() {
    this.setupStore();
    this.setupUI();
    this.bindEvents();
  }
  
  setupStore() {
    // 定义action types
    this.actionTypes = {
      ADD_TODO: 'ADD_TODO',
      TOGGLE_TODO: 'TOGGLE_TODO',
      DELETE_TODO: 'DELETE_TODO',
      SET_FILTER: 'SET_FILTER',
      LOAD_TODOS: 'LOAD_TODOS'
    };
    
    // 创建action creators
    this.actions = {
      addTodo: StateUtils.createAction(this.actionTypes.ADD_TODO),
      toggleTodo: StateUtils.createAction(this.actionTypes.TOGGLE_TODO),
      deleteTodo: StateUtils.createAction(this.actionTypes.DELETE_TODO),
      setFilter: StateUtils.createAction(this.actionTypes.SET_FILTER),
      
      // 异步action
      loadTodos: () => async (dispatch, getState) => {
        dispatch({ type: 'LOADING_START' });
        
        try {
          // 模拟API调用
          await new Promise(resolve => setTimeout(resolve, 1000));
          const todos = [
            { id: 1, text: '学习状态管理', completed: false },
            { id: 2, text: '实现Todo应用', completed: true }
          ];
          
          dispatch({
            type: this.actionTypes.LOAD_TODOS,
            payload: todos
          });
        } catch (error) {
          dispatch({
            type: 'LOADING_ERROR',
            payload: error.message
          });
        } finally {
          dispatch({ type: 'LOADING_END' });
        }
      }
    };
    
    // 创建reducer
    const todoReducer = StateUtils.createReducer(
      {
        todos: [],
        filter: 'all',
        loading: false,
        error: null
      },
      {
        [this.actionTypes.ADD_TODO]: (state, action) => ({
          ...state,
          todos: [
            ...state.todos,
            {
              id: Date.now(),
              text: action.payload,
              completed: false
            }
          ]
        }),
        
        [this.actionTypes.TOGGLE_TODO]: (state, action) => ({
          ...state,
          todos: state.todos.map(todo =>
            todo.id === action.payload
              ? { ...todo, completed: !todo.completed }
              : todo
          )
        }),
        
        [this.actionTypes.DELETE_TODO]: (state, action) => ({
          ...state,
          todos: state.todos.filter(todo => todo.id !== action.payload)
        }),
        
        [this.actionTypes.SET_FILTER]: (state, action) => ({
          ...state,
          filter: action.payload
        }),
        
        [this.actionTypes.LOAD_TODOS]: (state, action) => ({
          ...state,
          todos: action.payload
        }),
        
        LOADING_START: (state) => ({ ...state, loading: true, error: null }),
        LOADING_END: (state) => ({ ...state, loading: false }),
        LOADING_ERROR: (state, action) => ({
          ...state,
          loading: false,
          error: action.payload
        })
      }
    );
    
    // 创建store
    this.store = new AdvancedStateManager({
      reducer: todoReducer,
      middlewares: [
        CommonMiddlewares.logger,
        CommonMiddlewares.performance,
        CommonMiddlewares.errorHandler
      ],
      persist: true,
      persistKey: 'todo_app_state'
    });
    
    // 订阅状态变化
    this.store.subscribe((state, prevState) => {
      this.render(state);
      this.updateStats(state);
    });
  }
  
  setupUI() {
    document.body.innerHTML = `
      <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
        <h1>Todo应用 - 状态管理演示</h1>
        
        <div style="margin: 20px 0;">
          <input id="todo-input" type="text" placeholder="添加新任务..." 
                 style="padding: 8px; margin-right: 8px; width: 300px;">
          <button id="add-btn">添加</button>
          <button id="load-btn">加载数据</button>
        </div>
        
        <div style="margin: 20px 0;">
          <label>过滤器: </label>
          <select id="filter-select">
            <option value="all">全部</option>
            <option value="active">未完成</option>
            <option value="completed">已完成</option>
          </select>
        </div>
        
        <div id="loading" style="display: none; color: #666;">加载中...</div>
        <div id="error" style="display: none; color: red;"></div>
        
        <ul id="todo-list" style="list-style: none; padding: 0;"></ul>
        
        <div id="stats" style="margin-top: 20px; padding: 10px; background: #f5f5f5; border-radius: 4px;"></div>
        
        <div style="margin-top: 20px;">
          <h3>开发者工具</h3>
          <button id="show-state">显示状态</button>
          <button id="show-history">显示历史</button>
          <button id="clear-history">清空历史</button>
        </div>
        
        <pre id="debug-info" style="background: #f0f0f0; padding: 10px; border-radius: 4px; font-size: 12px; max-height: 200px; overflow-y: auto;"></pre>
      </div>
    `;
  }
  
  bindEvents() {
    const todoInput = document.getElementById('todo-input');
    const addBtn = document.getElementById('add-btn');
    const loadBtn = document.getElementById('load-btn');
    const filterSelect = document.getElementById('filter-select');
    
    // 添加todo
    const addTodo = () => {
      const text = todoInput.value.trim();
      if (text) {
        this.store.dispatch(this.actions.addTodo(text));
        todoInput.value = '';
      }
    };
    
    addBtn.addEventListener('click', addTodo);
    todoInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') addTodo();
    });
    
    // 加载数据
    loadBtn.addEventListener('click', () => {
      this.store.dispatch(this.actions.loadTodos());
    });
    
    // 过滤器
    filterSelect.addEventListener('change', (e) => {
      this.store.dispatch(this.actions.setFilter(e.target.value));
    });
    
    // 开发者工具
    document.getElementById('show-state').addEventListener('click', () => {
      this.showDebugInfo('当前状态', this.store.getState());
    });
    
    document.getElementById('show-history').addEventListener('click', () => {
      this.showDebugInfo('Action历史', this.store.getHistory());
    });
    
    document.getElementById('clear-history').addEventListener('click', () => {
      this.store.clearHistory();
      this.showDebugInfo('历史已清空', {});
    });
  }
  
  render(state) {
    const { todos, filter, loading, error } = state;
    
    // 显示/隐藏加载状态
    document.getElementById('loading').style.display = loading ? 'block' : 'none';
    
    // 显示错误
    const errorEl = document.getElementById('error');
    if (error) {
      errorEl.textContent = error;
      errorEl.style.display = 'block';
    } else {
      errorEl.style.display = 'none';
    }
    
    // 过滤todos
    const filteredTodos = todos.filter(todo => {
      switch (filter) {
        case 'active': return !todo.completed;
        case 'completed': return todo.completed;
        default: return true;
      }
    });
    
    // 渲染todo列表
    const todoList = document.getElementById('todo-list');
    todoList.innerHTML = '';
    
    filteredTodos.forEach(todo => {
      const li = document.createElement('li');
      li.style.cssText = `
        padding: 8px 0;
        border-bottom: 1px solid #eee;
        display: flex;
        align-items: center;
        gap: 8px;
      `;
      
      li.innerHTML = `
        <input type="checkbox" ${todo.completed ? 'checked' : ''} 
               onchange="todoApp.store.dispatch(todoApp.actions.toggleTodo(${todo.id}))">
        <span style="flex: 1; ${todo.completed ? 'text-decoration: line-through; color: #999;' : ''}">${todo.text}</span>
        <button onclick="todoApp.store.dispatch(todoApp.actions.deleteTodo(${todo.id}))"
                style="background: #ff4444; color: white; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer;">
          删除
        </button>
      `;
      
      todoList.appendChild(li);
    });
    
    // 更新过滤器选择
    document.getElementById('filter-select').value = filter;
  }
  
  updateStats(state) {
    const { todos } = state;
    const total = todos.length;
    const completed = todos.filter(todo => todo.completed).length;
    const active = total - completed;
    
    document.getElementById('stats').innerHTML = `
      <strong>统计信息:</strong><br>
      总计: ${total} | 已完成: ${completed} | 未完成: ${active}
    `;
  }
  
  showDebugInfo(title, data) {
    const debugEl = document.getElementById('debug-info');
    debugEl.innerHTML = `<strong>${title}:</strong>\n${JSON.stringify(data, null, 2)}`;
  }
}

// 运行演示
console.log('=== 状态管理器测试 ===\n');

// 创建Todo应用实例
window.todoApp = new TodoApp();

console.log('状态管理器功能特点：');
console.log('✓ 基础状态管理功能');
console.log('✓ 中间件支持');
console.log('✓ 异步action支持');
console.log('✓ 状态持久化');
console.log('✓ 开发者工具集成');
console.log('✓ 时间旅行调试');
console.log('✓ 性能监控');
console.log('✓ 错误处理');

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    SimpleStateManager,
    ReducerStateManager,
    MiddlewareStateManager,
    AsyncStateManager,
    AdvancedStateManager,
    StateUtils,
    CommonMiddlewares,
    useStateManager
  };
}
