# JSONP

## JSONP跨域原理

- **src属性可以加载外域资源**

- **script标签会自动执行加载完成的脚本**

这里有一个前提条件是

**script**需要作为`NodeElement`插入到`document`中, 不能通过`innerHTML = <script>`的方式

原因在这里: [script 脚本不被执行](/browser/render/parse_document.html#2种不同的解析方式)

---

基于此, 我们有了实现**JSONP**的技术支持

## 实现步骤

1.  与后端约定回调函数的名称, 或者通过一个queryString传递
2.  声明一个全局(在当前上下文环境中可以访问到的)函数
3.  访问jsonp 接口
4.  后端将函数名和数据一起以`callback(data)`的形式返回
5.  得到结果后, 这个`callback`会自动执行

## 应用场景

1.  **Cookie追踪/Cookie跨域**

## 只支持GET请求

## 实现

没有什么需要特别处理的地方, 按照步骤就好了.

```javascript
// step1 声明回调函数
function handlerUserInfo() {
  ... 处理UserInfo
}

function jsonp(url, callbackString) {
  const queryUrl = url += `?callback=${callbackString}`

  return function() {
    const script = document.createElement('script');

    script.onload = function() {
      this.remove();
    }

    script.onerror = function() {
      this.remove();
    }

    script.src = url;
    document.body.appendChild(script);
  }
}

const getUserInfo = jsonp('/userInfo/jsonp', 'handlerUserInfo');

getUserInfo();
```
