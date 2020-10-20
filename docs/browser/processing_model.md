# Processing Model

我们知道`javascript`是单线程, 但是在实际应用中无法避免的要使用到异步操作

e.g: `xhr请求`, `click event`, `timout`...

既然`javascript`存在一些异步API, 那么**js引擎**如何调度同步脚本和异步脚本就成为了一个很重要的问题

**js引擎**对同步/异步脚本的调度过程就是本章要讲述的`Processing Model`, 也就是常说的`Event Loop`

::: warning - 注意

本篇如果没有特意提及都是指 浏览器引擎的`Event Loop`

对于Node环境下的`Event Loop`, 没有做过详细的学习, 目前暂不提及

:::

看一下下面的🌰 (这是大学的时候面试今日头条的一个面试题, 也是通过这个面试题才对`Event Loop`有了深入的学习)

```javascript
// 写出输出顺序
console.log('script start')

async function async1() {
  await async2()
  console.log('async1 end')
}

async function async2() {
  console.log('async2 end')
}

async1()

setTimeout(function() {
  console.log('setTimeout')
}, 0)

new Promise(resolve => {
  console.log('Promise')
  resolve()
})
  .then(function() {
    console.log('promise1')
  })
  .then(function() {
    console.log('promise2')
  })

console.log('script end')

// 这里直接给出答案
// script start
// async2 end
// Promise
// script end
// async1 end
// promise1
// promise2
// setTimeout
```

如果你能对上面的顺序给出合理的解释, 我相信你已经掌握`Event Loop`了, 但是我还是建议你看阅读一下

- [UI Render](/browser/processing_model.html#ui-render)

- [setTimeout...](/browser/processing_model.html#settimeout-setinterval-requsetanimationframe差异)

可能你会得到一些额外的收获

## Event Loop

### 什么是Event Loop

前面提到了`Event Loop`就是**js引擎**对同步/异步任务的调度算法

如果你的英文能力可以的话, 我推荐你阅读[event-loop-process-model-standard](https://html.spec.whatwg.org/multipage/webappapis.html#event-loop-processing-model)

或者你也可以看一下这篇文章[从event loop规范探究javaScript异步及浏览器更新渲染时机](https://github.com/aooy/blog/issues/5), 这篇文章内有对上述标准的翻译

对于**macrotask queue**和**microtask queue**这里不做过多赘述

---

这里介绍几个H5标准提到的一些名词

- **Task**

  **macrotask queue**中最先入队的回调函数

  ::: warning - 注意

  同步脚本也是一个**Task**

  :::

- **Job**

  **microtask queue**中最先入队的回调函数

- **Jobs**

  **microtask queue**中的所有回调函数

### Event Loop 流程

![event loop](/weblog/imgs/browser_event_loop/event_loop.png)

意思是, 浏览器在每一次的`Loop`中

1.  **Task**阶段: 先执行**Task**, 如果**Task**不存在的话就跳过**Task**阶段

2.  **Jobs**阶段: **Task**阶段完成后, 进入**Jobs**阶段, 这个时候会执行所有存在的**Job**, 没有则跳过

    在**Jobs**阶段还可能会产生新的**Job**

    e.g.

    ```javascript
    Promise.resolve()
      .then(() => console.log('job 0'))
      .then(() => console.log('job 1'));

    // job 1 就是在本次jobs阶段中产生的job
    ```

    新的**job**也会在当前**Jobs**阶段执行, **Jobs**阶段就是要清空所有的**microtask queue**

3.  **IndexDB**阶段: 清理所有的**IndexDB**事务

4.  **UI Render**阶段: `javascript引擎`被挂起, `GUI引擎`唤醒, CPU开始根据`RenderLayoutObject`制作纹理传入`GPU`

5.  等待下一个**Task**的响应，进行下一次的`Loop`

---

### Task和Job事件

#### Task

  - `setTimeout`
  - `setInterval`
  - `requestAnimationFrame`
  - `xhr`
  - `DOM Event`
  - `MessageChannel`

#### Job

  - `Promise.then`
  - `MutationObserver`

值得注意的是浏览器并不是只存在一个**macrotask queue**和一个**microtask queue**然后将回调函数推入队列中

而是对于不同类型的回调函数, 推入相应类型的队列中, 在`Event Loop`调度的时候从几个队列中选择`Task`和`Job`

即:

```
macrotask queue:
  timer queue(setTimeout):
  xhr queue(xhr):
  DOM Event:

microtask queue:
  Promise:
  MutationObserver:
```

### Event Loop的开始

当脚本开始执行的时候`Event Loop`就已经开始工作了

一个错误的理解是: **当同本脚本执行完毕后, 才开始`Event Loop`的调度** ❌  ❌ 

🌰 

```javascript
console.log('start');

setTimeout(() => console.log('timeout'), 1000);

const ts = new Date().getTime();
let te = new Date().getTime();

while(te - ts < 3000) {
  te = new Date().getTime();
}

Promise.resolve()
  .then(() => console.log('job 0'))
  .then(() => console.log('job 1'));

// 按照错误的理解, 当同步脚本执行完毕后，进入Event Loop调度
// 此时应该优先执行Task, 即: timeout
// 所以期望的输出应该是
// start
// timeout
// job 0
// job 1

// 但是实际却并不是如此
// start
// job 0
// job 1
// timeout
```

**这也就是前面提到的, 同步脚本是一个Task**

### 实践

采用最前面提到的🌰 

```javascript
console.log('script start')

async function async1() {
  await async2()
  console.log('async1 end')
}

async function async2() {
  console.log('async2 end')
}

async1()

setTimeout(function() {
  console.log('setTimeout')
}, 0)

new Promise(resolve => {
  console.log('Promise')
  resolve()
})
  .then(function() {
    console.log('promise1')
  })
  .then(function() {
    console.log('promise2')
  })

console.log('script end')

// 同步脚本的执行就已经开始Event Loop
// ---------------- Task 阶段 ------------------------
// 1. console.log(script start)
// 2. async1();
//    2.1. await async2();
//      2.1.1. async2(); console.log(async2 end);
//      2.1.2. async2()返回了一个resolve状态的promise
//    2.2. Promise queue 被推入了一个job(job 0 -> console.log(async1 end))
// 3. setTimeout(); 调起浏览器timer线程, 在0s后将console.log(setTimeout) 推入 Timeout queue (这里不考虑纳入标准的4ms, 因为经过我测试发现setTimeout(callback, 0)并不总是4ms, 还可能是1m..., 同时0s也更能说明问题)
// 4. new Promise(); -> console.log(Promise);
//    4.1 将console.log('promise1')作为job推入Promise queue(job 1 -> console.log('promise1'))
// 5. console.log('script end')
// 函数的伪调用栈为

// callback stack(实际的调用栈不是这样的, 这里只是为了更好的说明问题，需要注意, 这里更像是callback queue):
//    console.log(script start); // 1
//    console.log(async2 end);   // 2.1.1
//    console.log(Promise);      // 4
//    console.log(script end);   // 5

// macrotask queue:
//      timeout queue:
//          console.log(setTimeout); // 3

// microtask queue
//      promise queue:
//          job0 -> console.log(async1 end)  // 2.2
//          job1 -> console.log(promise1)    // 4.1

// 执行callback stack
// script start
// async2 end
// Promise
// script end

// ------------Task 阶段结束, 进入Jobs阶段-----------------
// 将microtask queue 按照依次出队，压入callback stack
// callback stack
//    job0 -> console.log(async1 end)  // 2.2
//    job1 -> console.log(promise1)    // 4.1

// macrotask queue:
//      timeout queue:
//          console.log(setTimeout); // 3

// microtask queue
//      promise queue:
//

// 执行callback stack
// async1 end
// promise1

// 但是需要注意的是 在执行job1结束后, promise queue 又入队了新的job(job 2 -> console.log(promise2))
// microtask queue
//      promise queue:
//          job 2 -> console.log(promise2)

// 推入callback stack 执行后得到

// microtask queue
//      promise queue:

// Jobs阶段结束

// -------------- IndexDB 事务 ---------------------
// -------------- UI Render 阶段 -------------------

// 此时macrotask Queue还存在一个Task
// macrotask queue:
//      timeout queue:
//          console.log(setTimeout); // 3

// 进入下一次 Loop 的 Task阶段

// 所以能得到
// script start
// async2 end
// Promise
// script end
// async1 end
// promise1
// promise2
// setTimeout
// 这样的输出结果
```

## UI Render

`UI Render`阶段, **GUI引擎**开始工作, **javascript引擎**被挂起, **CPU**开始绘制纹理输入**GPU**

`UI Render`是浏览器实现`batch render`的核心逻辑

看一下🌰 

```javascript
div.style.top = '200px';
div.style.top = '300px';

// 这样的代码浏览器只会制作一个纹理, 而不是制作2个纹理

// 可以这样理解
// GUI引擎维护了一个队列

// 在执行div.style.top = '200px'; 时 
// javascript 引擎 通知 GUI引擎 入队一个div.style.top = 200的回调函数

// 同理, 这个队列中维护了2个回调
// gui queue:
//    div.style.top = 200
//    div.style.top = 300

// 在UI Render阶段清空队列任务, 绘制纹理
```

### Transition动画

**UI Render** 一个具体的应用就是`transition`动画

🌰 

```html
<div id="div">
  <style>
    #div {
      position: absolute;
      width: 100px;
      height: 100px;
      background-color: red;
    }
  </style>
</div>

<!-- 想让这个div在文档加载完成后右200px的位置滚动到300px的位置 -->
<!-- 我们需要添加一些javascript代码 -->
```

```javascript
const div = document.getElementById('div');

// example 1
div.style.top = '200px';
div.style.transition = 'top linear 1s';
div.style.top = '300px';

// 如果你有经验的话，你知道它一定是不行的

// 你可能会这样
// example 2
setTimeout(() => {
  div.style.top = '300px';
});

// 不知道你没有想过为什么要么做
```

其实这也和`Event Loop`有关

我们知道过渡动画需要**start**和**end**2种状态, 这就意味着**GUI**需要相应的制作2个纹理

而在上面的例子中

- `example 1`

  由于发生了一次`Event Loop`, 所以有1个`UI Render`, 生成了1个纹理, 所以没有产生过渡

- `example 2`

  发生了2次`Event Loop`, 有2个`UI Render`, 并且2次的`UI Render`队列都不是空的, 所以产生了2个纹理, 对应了2个`top`状态, 所以过渡动画生效

你也可以这样

```javascript
const { port1, port 2} = new MessageChannel();
port1.onmessage = function() {
  div.style.top = '300px';
}
port2.postMessage('');
```

但是这样则不可以

```javascript
Promise.resolve()
  .then(() => div.style.top = '300px');

// 因为这是一个job 而不是一个新的task
```

### GUI引擎的唤醒

GUI引擎的唤醒有2种方式

- `UI Render`

  前面提到过, `UI Render`阶段会挂起`javascript 引擎`, 唤醒`GUI引擎`

- `回流`

  前面提到过, 浏览器具有`batch render`功能, 统一在`UI Render`阶段制作纹理

  但是在某些需要读取元素位置的回流操作上, 可以打破上述规则, 在非`UI Render`的阶段唤醒`GUI 引擎`制作纹理

  像前面提到的`transition`的 🌰 , 为了实现过渡效果我们还可以这样

  ```javascript
  div.style.top = '200px';
  div.style.transition = 'top linear 1s';
  document.body.getBoundingClientRect();
  // 唤醒GUI引擎, 根据维护的队列内容绘制纹理(top = 200)

  div.style.top = '300px';
  // 在本次 Event Loop 的 UI Render阶段 绘制纹理(top = 300)

  // 这也是可行的
  ```

## setTimeout, setInterval, requsetAnimationFrame差异

### 浏览器是如何渲染元素的

[TODO 这里是一个单独的内容]()

简单来说就是

1.  `GUI 引擎`不定时根据`javascript 引擎`维护的`RenderLayoutObject`绘制纹理

  - 这里就涉及到**GUI 引擎的唤醒**( `UI Render`, `回流`)

2.  将绘制出的纹理传入**GPU**

3.  **GPU**不定时将纹理**paint**到页面上(这个时间就是 1 / 浏览器刷新频率)

对于某些开始了**GPU 加速**的**layer**, 则跳过了**CPU绘制纹理的过程**

### 跳帧

跳帧是一种逻辑上的正确, 但是在UI表现上是错误的

🌰 

一个人以**1m/s** 的 速度跑了10s

你以**1hz**的频率眨眼

所以你能看到的这个人的位移过程是

```
1m -> 2m -> 3m -> 4m -> ... 10m
```

但是如果某次你突然迷眼了, 你可能用了5s来清理👀 , 等你再次看这个人的时候他可能已经跑完了

```
1m -> 2m -> 3m -> 4m -> 5m -> 10m
```

`5m -> 10m `的过程就是跳帧

### 卡顿

卡顿和跳帧相反, 是逻辑上的错误, UI正确

还是这个人在🏃‍

不过其速度是 0.00001m/s

这看起来好像是个没开发完的机器人🤖️ 

这还算是跑步么?

卡顿一般都是由于 渲染动画的时间设置不正确

### setInterval

用`setInterval`实现动画最大的弊病在于其很可能会出现跳帧的情况

```javascript
let offset = 10;
setInterval(() => {
  offset += 10;
  div.style.top = offset + 'px';
}, 1000 / 60);

```

这段代码期望CPU 每1000 / 60 ms 绘制一个纹理, 传给GPU

但是实际并不总是如此, 根据前面`Event Loop`的内容, 假如前一个**Task**发生了5 * 1000 / 60ms的阻塞

那么当前**macrotask queue**应该是这样的

```
macrotask queue:
    interval queue: 
        task 0 -> offset += 10;
        task 1 -> offset += 10;
        task 2 -> offset += 10;
        task 3 -> offset += 10;
        task 4 -> offset += 10;
```

这个时候对于`task 0, task 1, task 2, task 3, task 4`这些**Task**而言就失去了`1000 / 60`的时间间隔

**GPU**直接在下次**paint**的时候将最终结果`offset = 60` 绘制 到 页面上

即:

`setInterval`会发生跳帧

### setTimeout

使用`setTimeout`就不会出现跳帧的现象, 因为`setTimeout`实现的动画是在最后产生了下一个**Task**, 即使前一个**Loop**发生阻塞, **macrotask queue**也不会像`setInterval`一样堆积了很多的**Animation Task**

```javascript
let offest = 10;
function animation() {
  offset += 10;
  div.style.top = offset + 'px';
  setTimeout(animation, 1000 / 60);
}

animation();
```

---

看来多么的美好 !!!

但是`setTimout`设置的时间要足够合适

太大或者太小都会有其他问题

- 时间间隔很小, 可能会有性能问题

  浏览器**GPU**绘制1次, **CPU**绘制了多个纹理, 我们知道`GUI`和`JS`是互斥的

  **GPU**只使用到了最后一个纹理, 其他都被浪费, `javascript 引擎`被无意义的挂起

- 时间间隔很大, 可能会卡顿

---

所以这个时间间隔尽量和**GPU**每次绘制的时间间隔一致(浏览器刷新频率)

一般浏览器刷新是`60HZ`(平均)

这也是我们总设置`1000 / 60`的原因

但是毕竟浏览器的刷新频率是一个动态的值, 所以后面`H5`提出了`requestAnimationFrame`这个API

### requestAnimationFrame

`requestAnimationFrame`期望回调函数在浏览器刷新`frame`前执行

用它实现`js`动画就是一个动态设置时间的`setTimeout`, 并且这个时间总是最合适的

这就保证了, 在**GPU**绘制前, **CPU**总是输入给**GPU**一个纹理

世界美好了 ！！

## Node Event Loop

node event loop 是基于 `libuv`实现的, 挺乱的, 暂时没有整理

TODO 这里应该是一个链接
