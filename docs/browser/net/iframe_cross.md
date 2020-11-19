# IFrame Cross Domain

借助于**iframe**实现的跨域一般都是用来 共享**本地存储**的信息, 基本不涉及`HTTP`请求

比如B 想要获得 A 下面的`localStorage`

主要有以下几种方式

## document.domain

**document.domain**的方式适用于父/子域间共享信息, 通过设置`document.domain`, 可以让2个页面同源

这样页面A 就 可以直接操作 页面B(DOM, BOM...)

我们将需要共享的信息存放到页面 B 的`storage`中, 这样任何和B 是父/子域的页面, 只要设置了正确的`document.domain`就可以得到页面A 存放的信息

🌰 

`page A`: 需要共享信息的页面

`page B`: 需要共享信息的页面

`page C`: 存放共享信息的页面

### step

1.  A, B, C设置相同的`document.domain`
2.  A 和 B 通过 `iframe` 加载页面 C
3.  通过操作 C 的 API 存/取信息

### 实现

#### page C

```javascript
document.domain = 'domain.com';
```

#### page (A | B)

```javascript
document.domain = 'domain.com';

function iframeShare(url) {
  let w = null;

  return function(handler = v => v) {

    return new Promise((resolve, reject) => {
      if (w) { 
        resolve(handler(w));
        return;
      }

      const iframe = document.createElement('iframe');

      iframe.style.display = 'none';
      iframe.src = url;
      document.body.appendChild(iframe);

      iframe.onload = function() {
        w = this.contentWindow.window;
        resolve(handler(w));
      }

      iframe.onerror = function(e) {
        w = null;
        reject(e);
      }
    });
  } 
}

function getCookie(w) {
  return w.document.cookie;
}

iframeShare('http://b.domain.com:5001/domain/C.html')(getCookie)
  .then(cookie => {
    console.log(cookie)
  });
```

---

这里提到的都是父/子域名下的跨域本地信息共享, 下面的几种方法适用于所有域名

## window.name

利用`window.name` 传值

`window.name`是一个特殊的值，如字面: 窗口的名字

这个属性有一个特点, 他不会随着窗口的变化而改变

包括:

- `window.location.href ...`

- `iframe.src 改变`

只要还是同一个`tab | iframe`那么`window.name`就不会改变

所以, 我们可以在共享信息的页面将一些信息挂载到属于它的 `window.name` 上, 然后我们更改它的`src`, 让这个`iframe.src = 一个主站下面的页面`, 这样我们就实现了信息的跨站共享

### step

我们需要3个页面

`page A`, 主站
`page A/A1`, 主站下面的一个子路径
`page B`, 存放共享信息的页面

1.  B 中 映射了一些操作, 并且执行相应的操作, 将结果挂载到`window.name`上

2.  A 页面 通过 `iframe` 嵌入 B, 将操作 和 数据 通过拼接 url(queryString, hash)的方式传入 B

3.  B 加载完成后，解析url, 处理, 然后将 `iframe.src` 指向 `A/A1`, 这里需要是同步脚本, 如果是异步的话就需要特殊处理

    比如将`page A/A1`, 通过 url 传入 B, 由 B 控制 `window.location.href` 改变

    在 A 中 polling `window.name | window.src`

4.  此时`A`和`A1`是同源的, 并且改变`iframe.src` `window.name`没有改变

5.  通过`iframe.contentWindow.window.name`得到共享数据

### 实现

#### A
```javascript
function iframeShare(url, subUrl, operationString) {
  url += `#${operationString}`;

  return function(handler = v => v) {
    
    return new Promise((resolve, reject) => {
      const iframe = document.createElement('iframe');

      iframe.src = url;
      iframe.style.display = 'none';

      iframe.onload = function() {
        if (this.src === url) {
          iframe.src = subUrl;
          return;
        }
        
        resolve(handler(iframe.contentWindow.window.name));
        this.remove();
      }

      iframe.onerror = function(e) {
        
        reject(e);
        this.remove();
      }
    });
  }
}

iframeShare('http://c.csp.com:3006/', 'http://a.domain.com:3005/B', 'getCookie')()
  .then(res => {
    console.log(res, 'cookie');
  })
```

### C

```javascript
const operationMap = {
  getCookie() {
    return 123;
  }
}

const hash = window.location.hash.subString(1);

window.name = operationMap[hash] ? operationMap[hash] : '';
```

Tips: `window.name`挂载的数据不能超过2MB

## window.hash

`window.hash`的思路和`window.name`基本一样, 区别就是只是实现方式不一样而已

- `page A`获得信息是响应式的, 只能通过以下几点方式. 而 使用`window.name`可以主动控制逻辑的响应

  1.  通过`window.onhashchange`被动触发

  2.  polling某个值是否存在

- `window.name`将信息挂载到`window.name`上,  而`window.hash`一般通过更改`page A`的hash 实现

- `window.name`可以将`page A/A1`的url 在 `A` 下设置, 而`window.hash`只能通过url 传给 `page B` 由B 控制url 变化

总之流程都是是这样的

```shell
          (operation, data)               (data, url change | window.name)
page A -------------------------> page B --------------------------------------> page A/A1
       < ---------------------------------------------------------------------
                (data, window.name | polling | hashchange)
```

### 实现

TODO, 都是类似的，抽空实现吧

```javascript
window.onhashchange = function() {
  
}
function iframeShare(url, handler) {
  
}
```

Tips: url 太长可能会414的 哦

---

我比较推荐用`window.name`, 如果你一定要`window.name`和`window.hash`中选择一个的话

## postMessage

`postMessage`是H5 提出的 本地信息跨域共享的一个标准方法, 有了它, 前面的方法都是屁 ~ ..

当然还是了解一下他们的思路比较好

使用`postMessage`可以直接在2个不用源的站点间传递数据, 而不想`window.name/ hash `一样需要使用一个和主站同源的子页面帮助回传信息

### API

`postMessage`继承自`MessageChannel`

它又2个 API 配合一起完成工作

```javascript
// 响应发送的数据 API
window.onmessage = function(e: { data, source, origin }): void {
   
}

// 发送数据 API
window.postMessage(message: any, targetWindowOrigin: '*' | 'protocal://domain:port', transfers);
```

这里的window 指的是同一个页面, 即:

```javascript
// page A -> 嵌入 page B 的iframe
pageBWindow.postMessage(message, targetWindowOrigin, transfers);

// pageB
window.onmessage = function (e) {}
```

#### window.postMessage(message: any, targetWindowOrigin: '*' | 'protocal://domain:port', transfers);

- **message**

message 是发送给目标窗口的信息

- **targetWindowOrigin**

targetWindowOrigin 是对目标窗口的限制🚫 , 支持`* | protocal://domain:port`

一般我们不使用`*`(无限制), 因为这是一种安全策略

防止攻击者通过`XSS`改变了我们引入的`iframe`路径，将一些敏感信息传递给攻击者的页面

只有当目标窗口的`window.location.origin`和我们传入的**targetWindowOrigin**完全一致的时候才能发送数据

- **transfers**

一些通信的对象的集合..., 感觉没什么大能耐

```javascript
const [port1, port2] = new MessageChannel();

targetWindow.postMessage('message', '*', [port1]);

// 这样目标窗口就能接收到 port1 然后通过port1 和port2 进行通信...
```

#### window.onmessage = function(e: { data, source, origin }): void 
