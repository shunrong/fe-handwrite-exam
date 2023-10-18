/**
 * 手写 Promise
 */
const PENDING = 'pending';
const FULFILLED = 'fulfilled';
const REJECTED = 'rejected';

function resolvePromise(p, x, resolve, reject) {
  if (x instanceof MyPromise) {
    // 链式调用不允许返回当前 promise 本身，否则造成循环调用
    if (x === p) {
      return reject(new Error('Chaining cycle ...'))
    } else {
      return x.then(resolve, reject)
    }
  } else {
    return resolve(x);
  }
}

class MyPromise {
  #status = PENDING; // 状态机
  #value = undefined; // 成功的值
  #reason = undefined; // 失败的原因
  #resolvedCbs = []; // 成功回调，是个数组，因为 同一个 promise then 可以被调用多次(不是链式，链式返回的是另一个 promise 了)
  #rejectedCbs = []; // 失败回调
  #resolve = (value) => {
    if (this.#status === PENDING) {
      this.#status = FULFILLED;
      this.#value = value;
      while (this.#resolvedCbs.length) {
        const callback = this.#resolvedCbs.shift();
        callback && callback(this.#value);
      }
    }
  }

  #reject = (reason) => {
    if (this.#status === PENDING) {
      this.#status = REJECTED;
      this.#reason = reason;
      while (this.#rejectedCbs.length) {
        const callback = this.#rejectedCbs.shift();
        callback && callback(this.#reason);
      }
    }
  }

  constructor(executor) {
    if (typeof executor === 'function') {
      try {
        executor(this.#resolve, this.#reject);
      } catch (e) {
        this.#reject(e);
      }
    }
  }

  static resolve = (value) => {
    if (value instanceof MyPromise) {
      return value;
    }
    return new Promise((resolve) => {
      resolve(value);
    })
  }

  static reject = (reason) => {
    if (reason instanceof MyPromise) {
      return reason;
    }
    return new Promise((undefined, reject) => {
      reject(reason);
    })
  }

  static all(promises) {
    return new MyPromise((resolve, reject) => {
      let result = [];
      let count = 0;
      for (let i = 0; i < promises.length; i++) {
        const addData = (key, value) => {
          result[key] = value;
          count++;
          if (count === promises.length) {
            resolve(result);
          }
        }
        const current = promises[i];
        if (current instanceof MyPromise) {
          current.then((value) => {
            addData(i, value);
          }, reject);
        } else {
          addData(i, current);
        }
      }
    })
  }

  static allSettled(promises) {
    return new MyPromise((resolve, reject) => {
      let result = [];
      let count = 0;
      for (let i = 0; i < promises.length; i++) {
        const addData = (key, value) => {
          result[key] = value;
          count++;
          if (count === promises.length) {
            resolve(result);
          }
        }
        const current = promises[i];
        if (current instanceof MyPromise) {
          current.then((value) => {
            addData(i, { status: FULFILLED, value });
          }, (reason) => {
            addData(i, { status: REJECTED, reason });
          });
        } else {
          MyPromise.resolve(current).then((value) => {
            addData(i, { status: FULFILLED, value });
          })
        }
      }
    })
  }

  static race(promises) {
    return new MyPromise((resolve, reject) => {
      for (let i = 0; i < promises.length; i++) {
        promises[i].then(resolve, reject);
      }
    })
  }

  static any(promises) {
    return new MyPromise((resolve, reject) => {
      let result = [];
      let count = 0;
      for (let i = 0; i < promises.length; i++) {
        const addData = (key, reason) => {
          result[key] = reason;
          count++;
          if (count === promises.length) {
            reject(result);
          }
        }
        const current = promises[i];
        if (current instanceof MyPromise) {
          current.then(resolve, (reason) => {
            addData(i, reason);
          });
        } else {
          resolve(current);
        }
      }
    })
  }

  then(onResolved, onRejected) {
    onResolved = typeof onResolved === 'function' ? onResolved : value => value;
    onRejected = typeof onRejected === 'function' ? onRejected : reason => { throw reason };
  
    const p = new MyPromise((resolve, reject) => {
      const onResolvedCb = () => {
        setTimeout(() => {
          const x = onResolved(this.#value);
          resolvePromise(p, x, resolve, reject);
        }, 0);
      }
      const onRejectedCb = () => {
        setTimeout(() => {
          const x = onRejected(this.#reason);
          resolvePromise(p, x, resolve, reject);
        }, 0);
      }

      if (this.#status === FULFILLED) {
        onResolvedCb()
      } else if (this.#status === REJECTED) {
        onRejectedCb();
      } else if (this.#status === PENDING) {
        this.#resolvedCbs.push(onResolvedCb);
        this.#rejectedCbs.push(onRejectedCb);
      }
    });
    return p;
  }

  catch(onRejected) {
    return this.then(undefined, onRejected);
  }

  finally(onFinally) {
    return this.then((value) => {
      onFinally();
      return value;
    }, (reason) => {
      onFinally();
      throw reason;
    });
  }
}

let p1 = new MyPromise((resolve, reject) => {
  console.log('start MyPromise');
  setTimeout(() => {
    resolve('成功')
  }, 2000);
})

p1.then((value) => {
  console.log(`${value}111`);
  return new MyPromise((resolve) => {
    setTimeout(() => {
      resolve('wala');
    }, 2000);
  });
  // return 'haha';
}).then((value) => {
  console.log(`${value}222`);
  // return 'xixi'
  return p1;
}).then((value) => {
  console.log(`${value}333`)
  return new MyPromise((resolve) => {
    setTimeout(() => {
      resolve('kalawula');
    }, 2000);
  });
}).then((value) => {
  console.log(`${value}444`)

})

p1.then((value) => {
  console.log(`${value}1`);
})

p1.then((value) => {
  console.log(`${value}2`);
})

let p2 = new MyPromise((resolve, reject) => {
  setTimeout(() => {
    resolve('666');
    // reject('3311')
  }, 1500)
})

let p3 = new MyPromise((resolve, reject) => {
  setTimeout(() => {
    reject(true);
  }, 2300)
}).catch((error) => {
  console.log(error, 'catch');
}).finally(() => {
  console.log('finally');
});

MyPromise.all([p1, p2, p3]).then((result) => {
  console.log(result, 'all');
}, (reason) => {
  console.log(reason, '999');
})

MyPromise.race([p1, p2, p3]).then((result) => {
  console.log(result, 'race');
}, (reason) => {
  console.log(reason, '999');
})