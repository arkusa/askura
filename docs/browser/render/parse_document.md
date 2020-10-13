# Parse Document

---

`@time 2020/10/12`

`@env`

| browser | version         |
| ------- | --------------- |
| chrome  | v85.0.4183.121  |
| safari  | v14610.1.28.1.9 |
| firefox | v81.0.1         |

---

本文主要介绍浏览器是如何解析文档的(`DOMTree`, `CSSTree`, `RenderTree`)

本文从实践出发 (非浏览器UI引擎的原理(`RenderLayout`), 如果对其感兴趣可以👀《webkit技术内幕》), 期望用逻辑解释浏览器为什么要这么做

## Timeline

1.  TCP将排序好的字节流数据包转换成字符流输入浏览器(流)
2.  初始化`document`, 此时`document.readyState === 'loading'`
3.  解析字符流数据, 依据`<>`生成`Token`节点
4.  根据`Token`节点, 逐渐生成**DOMTree**
5.  某些引入外部资源的`Token`, 创建其他线程加载资源(与ui线程异步)
6.  某些特殊的`Token`会影响ui线程
    - `<link>`, 开始构建**CSSTree**, 继续解析`document`完善**DOMTree**, 阻塞页面**render**
    - `<script>`, 停止解析`document`的解析和**DOMTree**的构建, 阻塞页面**render**, 待`javascript`加载并且执行完后继续解析`document`, 构建**DOMTree**
    - `<script defer>`或`<script async>`, 即不阻塞解析`document`解析, 也不阻塞页面**render**, 异步加载`javascript`
7.  `document`解析完成, 此时`document.readyState === 'interactive'`
8.  如果存在`<script defer>`待其执行完毕后触发`DOMContentLoaded`事件, 此时进入事件驱动阶段, 可以响应用户操作
9.  当所有外部资源加载完成后(`<img>`, `<script async>`, `<video>`...)触发`window.onload`, 此时`document.readyState === 'complete'`
10. **parse document**完成

## 并发加载资源

浏览器在加载资源的时候采用的是并发策略, 但是其在**域名**维度限制了并发度

以**Chrome**为🌰, 对同一个域名的并发度为6, 即: 同一个域名最多存在6个TCP链接

![http1.1 tcp](/imgs/parse_document/http1.1_tcp.png)

### HTTP/1.1

所以在**HTTP/1.1**协议下, 我们需要做**域名切片**: 对于一些像图片等的资源使用另外的域名, 防止由于并发度的限制, 延迟了外部**javascript**脚本的加载, 页面打开变慢

---

虽然**HTTP/1.1**协议提出了`keep-alive`(多个HTTP复用一个TCP), 但是其不允许同时发送多个HTTP请求

即: 如果当前TCP套接字正在传输或接受数据时, 会重新创建一个新的TCP套接字, 只有当前TCP套接字空闲时才能发送新的HTTP, 可以理解为单个TCP套接字是串行的

这是由于HTTP报文依赖TCP数据包的顺序组装

---

虽然HTTP1.1有提出`pipelining`改变, 但是它并没有很好的被支持

### HTTP2

如果你的服务支持了**HTTP2**, 对于**HTTP2**的请求我们就不需要做**域名分片**, 这是由于其**多路复用**机制导致的, 在应用层对多个**stream**多了标识

![http2 tcp](/imgs/parse_document/http2_tcp.png)

可以看到这9个请求同时并发

### More

在**HTTP/1.1**下因为对同一个域名的请求是采用多个TCP并发的, 所以你无法确定你收到的响应顺序是否和发出请求的顺序是一致的(可能是服务端响应顺序乱序或者收到响应的顺序乱序)

**HTTP2**也存在这个问题, 但是其并不是由于多个并发TCP导致的, 而是在HTTP2协议上上并发的stream流导致的

🌰:

比如一些购物操作, 有的时候你会发现你明明点了6下, 但是却显示你买了5个, 甚至能👀 从6-5的过渡, 这很大可能是因为并发http导致的

这时候就需要**顺序执行异步操作**

::: warning 注意
HTTPS并不代表着是HTTP2
:::

--- 

为了解决这种问题, 你可能需要这样的实现

```javascript
// 这里只是一个思路，如果要应用到实际的项目中还需要加以完善
class RequestQueue {
  constructor(...argvs) {
    this.chain = Promise.resolve();
  }

  push(request) {
    this.handler(request);
  }

  handler(request) {
    const { queue = [], ret } = request;

    this.chain = this.chain
      .then(() => ret.then(value => value))
      .then(value => queue.reduce((prevRet, current) => current(prevRet), value));
  }
}

// 为了保证不更改请求API, 这里需要做Promise API的粘合剂
class RequestRet {
  constructor(ret, queue = []) {
    this.ret = ret;
    this.queue = [];
  }

  then(callback) {
    this.queue.push(callback);

    return this;
  } 
}

function requestFactory(request) {
  const queue = new RequestQueue();  

  return function(...argvs) {
    const ret = new RequestRet(request(...argvs));
    
    queue.push(ret);

    return ret;
  }
}

// test
function simulationRequest(responseTime, response) {
  let resolve,
    reject;

  const ret = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });

  setTimeout(resolve.bind(null, response), responseTime);

  return ret;
}

const clickRequest = requestFactory(simulationRequest);

// 模拟多次请求
clickRequest(3000, 3)
  .then((val) => {
    console.log(val);
    return 100;
  })
  .then(val => console.log(val));

clickRequest(4000, 4).then(val => console.log(val));
clickRequest(2000, 2).then(val => console.log(val));
clickRequest(1000, 1).then(val => console.log(val));

// 3s后 - 3, 100
// 4s后 - 4, 2, 1
```

可以看一下这个demo, [http_response_disorder](https://github.com/arkusa/demo/tree/main/http_response_disorder)

## Todo

### 2种不同的解析方式

浏览器采用2种策略对文档解析

- `init document`

- `innerHTML`

目前对`innerHTML`的解析方式不够了解, 不过能够确定的是

```javaScript
document.body.innerHTML += '<script src="a.js"></script>'

// 不会加载a.js
// 这是当然的
// 因为可能需要diff old(document.body.innerHTML)和new(document.body.innerHTML)
// 来判断那些是需要被执行的脚本
// 否则可能导致已经执行完的脚本重新执行
```

目前只了解到这点区别
