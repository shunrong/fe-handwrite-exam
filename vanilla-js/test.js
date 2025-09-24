
// 手写 call/apply/bind

Function.prototype.myCall = function (context, ...args) {
  if (typeof this !== 'function') {
    throw 'type error'
  }

  context = context || window
  context.fn = this
  const result = context.fn(...args)
  delete context.fn
  return result
}

Function.prototype.myApply = function (context, args) {
  if (typeof this !== 'function') {
    throw 'type error'
  }

  context = context || window
  context.fn = this
  const result = context.fn(...args)
  delete context.fn
  return result
}

Function.prototype.myBind = function (context, args) {
  return function () {
    context = context || window
    context.fn = this
    const result = context.fn([...args, ...arguments])
    delete context.fn
    return result
  }
}

// 手写实现 new
// 创建空对象
// 执行函数，获得结果
function myNew(constructor,...args) {
  const obj = {}
  obj.__proto__ = constructor.prototype
  const result = constructor.call(obj,...args)
  if (result instanceof Object) return result
  return obj
}

// test
const obj1 = myNew(Person, age, name)

// 手写实现 instanceof
const myInstanceof = (obj, constructor) => {
  // 不是构造函数要报错
  if (typeof constructor !== 'function' || !constructor.prototype) {
    return new TypeError('构造函数错误')
  }

  // 同时处理 null 和 undefined
  if(obj == null) return false
  // let proto = obj.__proto__ // 下面是标准写法
  let proto = Object.getPrototypeOf(obj)
  
  const target = constructor.prototype
  while (proto) {
    if (proto === target) {
      return true
    }
    proto = Object.getPrototypeOf(proto)
  }
  return false
}

// 防抖和节流
const debounce = (fn,options = {}) => {
  const { wait = 500, immediate = false } = options

  let timer = null
  return function (...args) {
    const callNow = immediate && !timer

    clearTimeout(timer)

    timer = setTimeout(() => {
      if (!immediate) {
        fn.apply(this, args)
      }
    }, wait)

    if (callNow) {
      fn.apply(this, args)
    }
  }
}

const throttle = (fn, options = {}) => {
  const  { wait = 500, immediate = false} = options

  let timer = null
  return function(...args)  {
    if (timer) return
    timer = setTimeout(() => {
      if (!immediate) {
        fn.apply(this, args)
      }
      timer = null
    }, wait)

    if (immediate) {
      fn.apply(this, args)
    }
  }
}

class EventEmitter {
  constructor() {
    this.events = new Map()
  }

  on(event, callback) {
    if (typeof callback !== 'function') {
      throw TypeError('callback must be a function')
    }

    if (!this.events.has(this.events)) {
      this.events.set(event, [])
    }
    this.events.get(event).push(callback)
    return this
  }

  off(event, callback) {
    if (!this.events.get(event)) return
    
    // 取消全部
    if (!callback) {
      this.events.delete(event)
    } else {
      const callbacks = this.events.get(event)
      const index = callbacks.indexOf(callback)
      if (index > -1) {
        callbacks.splice(index, 1)
        if (callbacks.length === 0) {
          this.events.delete(event)
        }
      }
    }
    return this
  }

  once(event, callback) {
    const onceWrapper = (...args) => {
      callback(...args)
      this.off(event. onceWrapper)
    }
    this.on(event, onceWrapper)
    return this
  }

  emit(event, ...args) {
    if (!this.events.has(event)) return false
    const callbacks = this.events.get(event)
    callbacks.forEach(callback => {
      callback(...args)
    })
    return true
  }

  clear() {
    return this.events.clear()
  }

  size() {
    return this.events.size()
  }
}

//
const ee = new EventEmitter()


// 手写 promise
class MyPromise {
  constructor(executor) {
    this.status = 'pending'
    this.value = undefined
    this.reason = undefined
    this.fulfillCallbacks = []
    this.rejectCallbacks = []

    const resolve = (value) => {
      if (this.status !== 'pending') return
      this.status = 'fulfilled'
      this.value = value
      this.fulfillCallbacks.forEach(callback => callback(value))
      this.fulfillCallbacks = []
    }

    const reject = (reason) => {
      if (this.status !== 'pending') {
        this.status = 'rejected'
        this.reason = reason
        this.rejectCallbacks.forEach(callback => callback(value))
        this.rejectCallbacks = []
      }
    }

    try {
      executor(resolve, reject)
    } catch (error) {
      reject(error)
    }
  }

  _resolvePromise(p, x, resolve, reject) {
    if (x instanceof MyPromise) {
      if (x === p) {
        reject(new Error('cycle chain ...'))
      } else {
        x.then(resolve, reject)
      }
      return
    }
    //thenable
    if (x?.then && typeof x.then === 'function') {
      try {
        x.then(resolve, reject)
      } catch (error) {
        reject9erro
      }
    } else {
      resolve(x)
    }
  }

  then(onFulfiled, onRejected) {
    onFulfiled = typeof onFulfiled === 'function' ? onFulfiled : value => value
    onRejected = typeof onRejected === 'function' ? onRejected : reason => { throw reason }
    
    const p = new MyPromise((resolve, reject) => {
      const handleFulfilled = (value) => {
        try {
          const result = onFulfiled(value)
          this._resolvePromise(p, result, resolve, reject)
        } catch (error) {
          reject(error)
        }
      }

      const handleRejected = (value) => {
        try {
          const result = onRejected(value)
          this._resolvePromise(p, result, resolve, reject)
        } catch (error) {
          reject(error)
        }
      }

      if (this.status === 'pending') {
        this.fulfillCallbacks.push(handleFulfilled)
        this.rejectCallbacks.push(handleRejected)
      } else if (this.status === 'fuffilled') {
        setTimeout(() => handleFulfilled(this.value), 0)
      } else if (this.status === 'rejected') {
        setTimeout(() => handleRejected(this.reason), 0)
      }
    })

    return p
  }

  catch(reject) {
    return this.then(null, reject)
  }

  finally(resolve, reject) {
    return this.then((value) => {
      resolve(value)
      return value
    }, (reason) => {
      reject(reason)
      throw reason
    })
  }

  static resolve(value) {
    if (value instanceof MyPromise) {
      return value
    }
    return new MyPromise((resolve) => resolve(value))
  }

  static reject(reason) {
    if (value instanceof MyPromise) {
      return value
    }
    return new MyPromise((_, reject) => reject(reason))
  }

  // 只要有一个处理完成，不论成功失败结果就是它
  static race(promises) {
    return new MyPromise((resolve, reject) => {
      promises.forEach(promise => {
        MyPromise.resolve(promise).then(resolve, reject)
      })
    })
  }

  // 全部成功才是 resolve，但凡一个失败就是 reject
  all(promises) {
    return new MyPromise((resolve, reject) => {
      const result = []
      let count = 0
      promises.forEach((promise, index) => {
        MyPromise.resolve(promise).then((value) => {
          result[index] = value
          count++
          if (count === promises.length) { 
            resolve(result)
          }
        }, reject)
      })
    })
  }

  // 有一个成功就是成功，全部失败才是失败，和 all 刚好相反
  any(promises) {
    return new MyPromise((resolve, reject) => {
      const result = []
      let count = 0
      promises.forEach((promise, index) => {
        MyPromise.resolve(promise).then(resolve, (reason) => {
          result[index] = reason
          count++
          if (count === promises.length) {
            reject(result)
          }
        })
      })
    })
  }

  // 没有失败，不论成功失败都算成功，收集全部结果
  allSettled(promises) {
    return new MyPromise((resolve, reject) => {
      const result = []
      let count = 0
      promises.forEach((promise, index) => {
        MyPromise.resolve(promise).then((value) => {
          result[index] = { status: 'fulfilled', value }
          count++
          if (count === promises.length) {
            resolve(result)
          }
        }, (reason) => {
          result[index] = { status: 'rejected', reason }
          count++
          if (count === promises.length) {
            resolve(result)
          }
        })
      })
    })
  }
}


//
const p = new MyPromise((resolve, reject) => {

})