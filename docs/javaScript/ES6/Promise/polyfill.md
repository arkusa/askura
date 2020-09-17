# Promise Polyfill

[A+ 原文](https://promisesaplus.com/)

[明昊大佬的 A+译文](http://malcolmyu.github.io/malnote/2015/06/12/Promises-A-Plus/)

## 实践

::: warning - 注意

阅读分解的代码需要小心, 因为我将其复合成完整的代码后, 发现有一些拼写上的错误

已经对比日志修复了...

但是可能还有我未发现的

完整的代码是可以通过测试用例的 没问题

:::

### 开发 Promise Polyfill 的一些提前准备

首先我们要封闭作用域以及定义好一些常量...

```javaScript
const PromisePolyfill = (function() {
  /* promise 的 3种状态 */
  const PENDDING = 'pendding';
  const REJECTED = 'rejected';
  const FULFILLED = 'fulfilled';

  /* promise实例上暴露出的属性 */
  const PROMISEVALUE = 'promise_value';
  const PROMISESTATUS = 'promise_status';

  class MyPromise {}

  return MyPromise;
}());
```

### 做实例化的准备

```javaScript
class MyPromise {
  constructor() {
    this[PROMISEVALUE] = undefined;
    this[PROMISESTATUS] = PENDDING;
  }
}
```

### 实例化 Promise

```javaScript
const instance = new Promise(func);

function func(resolve, reject) {
  resolve();
  reject();
}
```

我们知道`Promise`接受一个函数作为参数, 所以`constructor`需要接受一个函数`func`, 同时这个函数会被传入`resolve`和`reject`2 个参数(类型为`function`)

并且因为`Promise`的状态一但非`PENDDING`则不可变, 所以`resolve`和`reject`应该是互斥的

同时`Promise`会捕获`func`中抛出的异常, 所以有

```javaScript
/* @desc 一个互斥函数, 用来处理resolve和reject互斥 */
function applyOnce(...funcs) {
  let called = false;

  return funcs.map(func => (...argvs) => {
    if (called) return;
    called = true;

    func(...argvs);
  });
}

class MyPromise {
  constructor(func) {

    const [resolve, reject] = applyOnce(
      // ...
    );

    try {
      func(resolve, reject);
    } catch(reason) {
      // ...
    }
  }
}
```

这样`resolve`和`reject`互斥了, func 的异常也被捕获了, 实力化的过程就基本完成

### 处理 Promise 的核心逻辑, 也就是 A+中提到的[[Resolve]](promise, x)的过程

```javaScript
function resolvePromise(context, x) {
  /* 这里的context是promise实例 */

  // 前面提到过promise的状态一旦非PENDDING其状态就不会改变, 所以
  if (context[PROMISESTATUS] !== PENDDING) return;

  // 接下来按照A+规范的步骤开始处理context和x的值

  if (x === conetxt) {
    throw new TypeError('Chaining cycle detected for promise #<PromisePolyfill>'');
  }

  // 这里就是透传x的状态和值给当前的context
  if (isPromise(x)) {
    x.then( // 当前context等待x的状态, 如果x fulfilled则用x.value 重新进行一次当前逻辑, 如果x rejected, 则用其reason, 执行拒绝promise的逻辑
      res => resolvePromise(context, res),
      reason => rejectPromise(context, reason)
    );

    return;
  }

  // 这里是A+ 中如果x是对象或函数, 如果有then方法, 则将这个thenable视为另类的实例化Promise时传入的函数
  // 以x作为then执行的上下文, 传入resolve和reject, 以resolve和reject在执行时传入的参数y, 作为当前的实例的结果或拒因
  if (isThenable(x)) {
    const { then } = x; // 这里是为了防止x.then有副作用, 定义了getter.

    // 所以上面只能使用isThenable来判断x是不是有then方法或then属性的引用值

    // 这里还要加上then是函数的判断
    if (isFunction(then)) {
      const [resolve, reject] = applyOnce(
        // ...
      );

      then.call(x, resolve, reject);

      // 这就结束了thenable的判断

      /*
       * 你会发现当前的context的状态并没有流转
       * 这是因为只有等到实际执行resolve的时候才要流转状态
       * 而状态的流转和resolvePromise息息相关
       * 上面的resolve函数要和resolvePromise有关系
       * 即:
       * resolve = partial(resolvePromise, context);
       * 用一个偏函数将当前实例预先传入到resolvePromise中得到新的函数
       */

      // 所以有
      const [resolve, reject] = applyOnce(
        partial(resolvePromise, context),
        partial(rejectPromise, context)
      );

      // 我之前的实现上有注释这里需要异步执行的...但是我现在找不到原因了...............😢..
      // 不需要异步.. 我就说嘛
      // 这里的异常需要单独处理, 这是因为resolve和reject需要互斥
      /*
       * @example
       * new Promise((resolve, reject) => {
       *   resolve({
       *     then(resolve, reject) {
       *       resolve(new Promise(resolve => setTimeout(resolve.bind(null, 1)))) // 这里是异步等待promise实例的状态
       *       throw 1;
       *     }
       *   });
       * })
       */
       // 仅仅依靠resovlePromise和rejectPromise的状态锁是不能fix这种情况的
       // 本来应该是fulfilled状态的promise被解决成rejected状态
      try {
        then.call(x, resolve, reject);
      } catch(reason) {
        reject(reason);
      }
      // 因为这里单独处理异常, 所以就可以return掉
      return;
    }
  }

  // 还没完, 这中间的异常需要被捕获 所以需要
  try {
    // ... 上面的一拖代码
  } catch(reason) {
    rejectPromise(context, reason);
  }

  // 特殊值的处理都完成了剩下需要更新状态和值，以及执行callback
  context[PROMISEVALUE] = x;
  context[PROMISESTATUS] = FULFILLED;

  applyCallbacks(context.fulfilledCallbacks, x);

  // 对于context.fulfilledCallbacks执行时也可能会有异常, 但是因为其异步执行这边不好处理
  // 只能是这里面的callback在then方法内被push前已经被封装好try...catch了
}
```

### 实现`rejectPromise`的逻辑

有了`resolvePromise(context, x)`的逻辑, 实现`rejectPromise(context, reason)`的逻辑就很简单了

```javaScript
function rejectPromise(context, reason) {
  if (context[PROMISESTATUS] !== PENDDING) return;

  context[PROMISEVALUE] = reason;
  context[PROMISESTATUS] = REJECTED;

  applyCallbacks(context.rejectedCallbacks, reason);
}
```

### 处理 then 方法的逻辑

```javaScript
class MyPromise {
  constructor(func) {
    // 这里根据thenable的处理流程可以被添加上了
    const [resolve, reject] = applyOnce(
      partial(resolvePromise, this),
      partial(rejectPromise, this),
    );

    try {
      func(resolve, reject);
    } catch(reason) {
      reject(reason);
    }
  }

  then(fulfilledCallback, rejectedCallback) {
    // 因为如果fulfilledCallback不是函数需要忽略即将返回值传给next fulfilledCallback

    let onFulfilled = isFunction(fulfilledCallback)
      ? fulfilledCallback
      : res => res;

    // rejectedCallback如果不是函数需要忽略，但是它不能透传值，因为透传值的话，promise的状态就变了
    // 其需要继续抛出reason

    let onRejected = isFunction(rejectedCallback)
      ? rejectedCallback
      : reason => throw reason;

    // 由于可以链式调用
    let resolve,
        reject
    const retPromise = new MyPromise((rs, re) => {
      resolve = rs;
      reject = re;
    });

    // 这个retPromise的状态由resolve和reject决定, 所以我们需要将其和毁掉函数封装

    onRejected = callbackFactory(onRejected, resolve, reject);
    onFulfilled = callbackFactory(onFulfilled, resolve, reject);

    return retPromise;
  }
}

function callbackFactory(callback, resolve, reject) {
  return function(value) {
    try {
      // 因为需要将返回值传给next callback
      // 所以
      const ret = callback(value);
      resolve(ret);
    } catch(reason) {
      reject(reason);
    }
  }
}
```

### 处理 callback 队列

我们知道`Promise`可以有很多个回调函数然后等待状态变更后一起执行

即:

```javaScript
const promise = new Promise();
promise.then(ret => console.log(1));
promise.then(ret => console.log(2));
promise.then(ret => console.log(3));

// 此时状态变更
// 1
// 2
// 3
```

同时如果实例的状态已经变化那么在这之后添加的`then callback`会立即执行

```javaScript
promise.then(() => console.log(4)); // 4
promise.then(() => console.log(5)); // 5
```

所以我们需要对这个队列进行特殊处理, 状态未改变则添加, 状态改变则立即执行

```javaScript
class CallbackQueue extends Array {
  constructor(context, status) {
    super();
    this.context = context;
    this.status = status;
  }

  // override
  forEach(func) {
    let callback = this.shift();
    while(callback) {
      func(callback);
      callback = this.shift();
    }
  }

  // override
  push(callback) {
    // 这里判断状态
    if (this.status === this.context[PROMISESTATUS]) {
      applyAsync(partial(callback, this.context[PROMISEVALUE]))
    } else {
      super.push(callback);
    }
  }
}

class FulfilledCallbackQueue extends CallbackQueue {
  constructor(context) {
    super(context, FULFILLED);
  }
}

class RejectedCallbackQueue extends CallbackQueue {
  constructor(context) {
    super(context, REJECTED);
  }
}

class MyPromise {
  constructor() {
    this.rejectedCallbacks = new RejectedCallbacks(this);
    this.fulfilledCallbacks = new FulfilledCallbackQueue(this);
  }

  then() {
    this.fulfilledCallbacks.push(onFulfilled);
    this.rejectedCallbacks.push(onRejected);
  }
}
```

### 剩下就是完善那些工具方法

```javaScript
/* @desc 是不是函数 */
function isFunction(func) {
  return typeof func === 'function';
}

/* @desc 是不是Promise */
function isPromise(x) {
  return (
    x instanceof Promise
    || x instanceof MyPromise
  );
}

/* @desc 是不是thenable */
function isThenable(x) {
  return (
    (typeof x === 'object' || typeof x === 'function')
    && 'then' in x // 这里要使用in运算符 不用使用x.then
  );
}

/* @desc 偏函数 */
function partial(func, ...argvs) {
  return function(...remainArgvs) {
    func(...argvs, ...remainArgvs);
  }
}

/* @desc 模拟micro task */
function applyAsync(callback) {
  setTimeout(() => callback());
}

/* @desc 执行回调函数队列 */
function applyCallbacks(callbacks, x) {
  callbacks
    .map(callback => partial(callback, x))
    .forEach(callback => applyAsync(callback))
}
```

## 完整代码

```javaScript
/* eslint-disable */
const PromisePolyfill = (function () {
  /* promise 的 3种状态 */
  const PENDDING = 'pendding';
  const REJECTED = 'rejected';
  const FULFILLED = 'fulfilled';

  /* promise实例上暴露出的属性 */
  const PROMISEVALUE = 'promise_value';
  const PROMISESTATUS = 'promise_status';

  /* @desc 是不是函数 */
  function isFunction(func) {
    return typeof func === 'function';
  }

  /* @desc 是不是Promise */
  function isPromise(x) {
    return x instanceof Promise || x instanceof MyPromise; // eslint-disable-line
  }

  /* @desc 是不是thenable */
  function isThenable(x) {
    return (
      (typeof x === 'object' || typeof x === 'function') && 'then' in x // 这里要使用in运算符 不用使用x.then
    );
  }

  /* @desc 偏函数 */
  function partial(func, ...argvs) {
    return function (...remainArgvs) { // eslint-disable-line
      func(...argvs, ...remainArgvs);
    };
  }

  /* @desc 模拟micro task */
  function applyAsync(callback) {
    setTimeout(() => callback());
  }

  /* @desc 执行回调函数队列 */
  function applyCallbacks(callbacks, x) {
    callbacks
      .map(callback => partial(callback, x)) // eslint-disable-line
      .forEach((callback) => applyAsync(callback)); // elsint-disable-line
  }

  /* @desc 一个互斥函数, 用来处理resolve和reject互斥 */
  function applyOnce(...funcs) {
    let called = false;

    return funcs.map((func) => (...argvs) => {
      if (called) return;
      called = true;

      func(...argvs);
    });
  }

  /* @desc 封装then传入的回调函数 */
  function callbackFactory(callback, resolve, reject) {
    return function (value) {
      try {
        const ret = callback(value);
        resolve(ret);
      } catch (reason) {
        reject(reason);
      }
    };
  }

  class CallbackQueue extends Array {
    constructor(context, status) {
      super();
      this.context = context;
      this.status = status;
    }

    // override
    forEach(func) {
      let callback = this.shift();
      while (callback) {
        func(callback);
        callback = this.shift();
      }
    }

    // override
    push(callback) {
      // 这里判断状态
      if (this.status === this.context[PROMISESTATUS]) {
        applyAsync(partial(callback, this.context[PROMISEVALUE]));
      } else {
        super.push(callback);
      }
    }
  }

  class FulfilledCallbackQueue extends CallbackQueue {
    constructor(context) {
      super(context, FULFILLED);
    }
  }

  class RejectedCallbackQueue extends CallbackQueue {
    constructor(context) {
      super(context, REJECTED);
    }
  }

  function rejectPromise(context, reason) {
    if (context[PROMISESTATUS] !== PENDDING) return; // eslint-disable-line

    context[PROMISEVALUE] = reason; // eslint-disable-line
    context[PROMISESTATUS] = REJECTED; // eslint-disable-line

    applyCallbacks(context.rejectedCallbacks, reason);
  }

  function resolvePromise(context, x) {
    if (context[PROMISESTATUS] !== PENDDING) return;

    try {
      if (x === context) {
        throw new TypeError('Chaining cycle detected for promise #<PromisePolyfill>'');
      }

      if (isPromise(x)) {
        x.then(
          (res) => resolvePromise(context, res),
          (reason) => rejectPromise(context, reason),
        );

        return;
      }

      if (isThenable(x)) {
        const { then } = x;

        if (isFunction(then)) {
          const [resolve, reject] = applyOnce(
            partial(resolvePromise, context),
            partial(rejectPromise, context),
          );

          try {
            then.call(x, resolve, reject);
          } catch (reason) {
            reject(reason);
          }

          return;
        }
      }
    } catch (reason) {
      rejectPromise(context, reason);
    }

    context[PROMISEVALUE] = x; // eslint-disable-line
    context[PROMISESTATUS] = FULFILLED; // eslint-diable-line

    applyCallbacks(context.fulfilledCallbacks, x);
  }

  class MyPromise {
    constructor(func) {
      this[PROMISEVALUE] = undefined;
      this[PROMISESTATUS] = PENDDING;
      this.rejectedCallbacks = new RejectedCallbackQueue(this);
      this.fulfilledCallbacks = new FulfilledCallbackQueue(this);

      const [resolve, reject] = applyOnce(
        partial(resolvePromise, this),
        partial(rejectPromise, this),
      );

      try {
        func(resolve, reject);
      } catch (reason) {
        reject(reason);
      }
    }

    then(fulfilledCallback, rejectedCallback) {
      let onFulfilled = isFunction(fulfilledCallback)
        ? fulfilledCallback
        : (res) => res;

      let onRejected = isFunction(rejectedCallback)
        ? rejectedCallback
        : (reason) => {
          throw reason;
        };

      let resolve;
      let reject;
      const retPromise = new MyPromise((rs, re) => {
        resolve = rs;
        reject = re;
      });

      onRejected = callbackFactory(onRejected, resolve, reject);
      onFulfilled = callbackFactory(onFulfilled, resolve, reject);

      this.rejectedCallbacks.push(onRejected);
      this.fulfilledCallbacks.push(onFulfilled);

      return retPromise;
    }
  }

  return MyPromise;
}());
```

## Test

```shell
npm install -D promises-aplus-tests
```

编写如下前置模块导出

```javaScript
// test.js
const MyPromise = require(filepath);

const deferred = () => {
  const dfd = {};
  dfd.promise = new MyPromise((resolve, reject) => {
    dfd.resolve = resolve;
    dfd.reject = reject;
  });

  return dfd;
};

MyPromise.deferred = deferred;
```

```shell
promises-aplus-test ./test.js
```
