# COOKIE

## Cookie解决了什么问题

我们知道**HTTP**协议是**无状态**的

**Cookie**是为了解决某些场景(由于**无状态**特性, 导致不能满足需求)而诞生

比如: **免密登陆**

### 什么是无状态?

举个🌰

**ClientA**向**Server**发送了2个**HTTP**请求, **Server**只能收到2个请求, 但却不知道这2个请求来自于**ClientA**. 这就是**无状态**的含义

比如打开同一个网址, 任何人获得的结果都是一样的, 没有状态的区分

### 为什么HTTP被设计为无状态?

这么设计的目的在于缓解**server**压力

由于`web`请求具有突发性, 如果要让**HTTP**协议是有状态的, 那就要让**clinet**和**server**保持会话状态. 就像打电话一样, 如果多个人同时给你打📱, 那一定会有人处于忙线状态

**server**也是一样

为了处理高并发, **HTTP**协议被设计为**无状态**

### Cookie的诞生

在`web`初期还好, 但是随着`web`的高速发展, 越来越多的场景需要**server**知道请求发送方的状态

比如: **用户的登陆态**

实现这种**case**不一定要依赖于协议维度的扩展. 在系统维度, 也满足实现条件

e.g.

可以在登陆接口下发一些`userId`等的信息, 然后在后续接口中都将这些信息传给**server**, 这样就在系统维度让`web`变得有状态

但是这种方案有一个不可忽视的问题, 下发下来的信息只在当前会话中能获取到, 缺少**本地存储**, 每次用户访问页面都需要登陆, 不能做到**登陆态的持久化**(`web storage`是`h5`提出的概念)

---

为了彻底解决这类**case**, **HTTP**协议扩展了**Cookie**这一概念

**Cookie**被设计为, 可以由**server**通过**headers**直接设置, 在**client**持久化存储, 并随着**HTTP请求**自动发送

你有没有想过为什么不直接设计一个本地存储的API呢?(`storage`)

这是一个设计上的问题

**Cookie**是**HTTP**协议的补充, 没有**Cookie**, **HTTP**协议就不能覆盖到需要状态持久化的**case**

**storage**是可以解决**HTTP**状态持久化的手段. 但他能解决的问题远远超过了**状态持久化**, 未免杀鸡用牛刀, 而且使用**storage**我们需要还需要手动在某些接口将信息存入**storage**, 在某些接口取出**storage**

::: tip
小程序, 快应用都不支持`cookie`, 只能通过`storage`做用户状态的持久化

快应用还没有同步获得`storage`的API, 如果不引入`async/awiat`的polyfill, 就会陷入深深的`callback hell`
:::

---

同时**Cookie**的设计还有以下优势

- **可以由服务端配置**

服务端配置`set-cookie`header, 浏览器根据`set-cookie`的值直接存储在本地, 不需要脚本参与存储

- **自动发送**

在发送请求时, 会将当前域下的**Cookie**一并发送, 不需要脚本参与发送

**Cookie**是浏览器和**server**间的约定, 不用前端脚本变更, 就可以满足**HTTP**有状态

**Storage**需要浏览器, **server**和**javaScript**共同作用, 才可以满足**HTTP**有状态

---

当然这种设计也导致了隐私的泄漏

你是否遇到过这类的场景: 你在某站搜索了一些商品. 在访问其他站的时候, 有时这类商品就处于推荐位上.

这可不仅仅是巧合, 而是基于**Cookie**追踪了用户行为

## Cookie的特性

像上面提到的**Cookie**具有如下特性

- **本地持久化(4kb)**

- **可以由服务端配置, 浏览器自动生效**

- **伴随当前域名的HTTP请求自动发送**

- **受同源策略保护**

  只能当前域名下的请求和脚本才能获得当前域名的**Cookie**

## Cookie的属性

- `Expires/Max-Age`

设置**Cookie**的有效期, 默认是`Session`. 当浏览器彻底关闭(进程被杀死), 这个**Cookie**就从该域名下被删除

::: warning 注意

关闭当前tab页, 关闭当前窗口, 都不会将`Session`状态的**Cookie**删除, 除非彻底杀死Chrome进程

:::

---

**Expires**的值是`UTC 世界标准时间`格式的时间点

我国使用的是**东八区**时间, 比**UTC 世界标准时间**提前了8个小时

直接使用`new Date().toString()`得到的时间是中国标准时间(**东八区时间**)

如果我们直接

```javaScript
res.setHeader('Set-Cookie', [
  `cookie_expires=expires; Expires=${new Date()}`
]);
```

这个**Cookie**将会在8个小时后过期

所以我们应该使用`new Date().toUTCString()`

```javaScript
res.setHeader('Set-Cookie', [
  `cookie_expires=expires; Expires=${new Date().toUTCString()}`
]);
// 这相当于没设置Cookie, 因为设置了一个错误时间点的Cookie, 当前时间的UTC格式，已经过去了

res.setHeader('Set-Cookie', [
  `cookie_expires=expires; Expires=${new Date(new Date().getTime() + 24 * 60 * 60 * 1000).toUTCString()}`
]);
// 一天后过期

res.setHeader('Set-Cookie', [
  `cookie_expires=expires; Expires=${new Date(new Date().getTime() + 24 * 60 * 60 * 1000)}`
]);
// 32小时后过期
```
::: warning 注意

在服务端设置Cookie实际上是用服务端的的时间和客户端的时间对比, 存在误差

:::

---

**Max-Age**的值是一段时间, 以`s`为单位, `cookie_max-age=max-age; Max-Age=10`意思是`cookie_max-age`将在10秒后过期, 与`Expires`相比, 其只用客户端时间做比较, 没有误差

```javaScript
res.setHeader('Set-Cookie', [
  'cookie_max-age=max-age; Max-Age=10'
]);
```

::: warning 注意

`Max-Age`也可以是一个负值

---

给已经存在的**Cookie**

设置负的`Max-Age`相当于删除这个**Cookie**

设置过期(客户端根据本地时间判断是不是过期)的`Expires`相当于设置了`Session`状态的**Cookie**(这里我只测试了chrome)

---

给不存在的**Cookie**

设置负的`Max-Age`和过期的`Expires`都相当于没有设置这个**Cookie**

---

如果你想删除某个**Cookie**, 请使用`Max-Age`

:::

- `Domain`
 
**Domain**表明了当前**Cookie**被存放到那个域名下, 默认是当前域名`window.location.host`

他的值不能随便设置，只能是以下2种

1. **当前域名**

2. **当前域名的一级域名**

如果是**当前域名** 则只能在当前域下被发送, 如果是**当前域名的一级域名**则在其子域下也会发送这个**Cookie**

🌰

```javaScript
'set-cookie': 'cookie_domain=domain; Domain=a.cookie.com';
// 只在a.cookie.com下的请求会发送这个cookie

'set-cookie': 'cookie_domain=domain; Domain=.(可省略)cookie.com';
// 在a.cookie.com, b.cookie.com, c.cookie.com下都会发送这个cookie
```

**当前域名的一级域名**一般应用在父/子域名间用户登陆共享. 在`a.cookie.com`下登陆, 在`b.cookie.com`下就不需要额外登陆了

- `Path`

**Domain**表示的是**Cookie**的存放域名, **Path**则表示**Cookie**的存放路径, 默认是**当前网页的路径**

```javaScript
// https://a.cookie.com/weblog/net/http/cookie.html

get('/cookie/get')
res.setHeader('set-cookie', 'cookie_path=path')

// 此时Cookie的Path为 /weblog/net/http
```

**Path**的匹配规则不是完全匹配, 即不是这样的`/^Path$/`, 而是`/^Path/`

🌰

```javaScript
// 当前主站a.cookie.com

'set-cookie': 'cookie_path=path; Path=/';
// 当前域名下的所有路径都能获得这个cookie

'set-cookie': 'cookie_path1=path1; Path=/path1';
// a.cookie.com/path1 下的所有路径(包括自己)都能获得这个cookie a.cookie.com/path1/1
// 但是a.cookie.com/path2 则不能获得这个cookie
```

- `HttpOnly`

后面会提到通过`javaScript`脚本我们也能读取到**Cookie**, 如果遭受到`XSS`攻击, 我们的**Cookie**就可能会泄漏

**HttpOnly**可以让当前**Cookie**不能通过脚本获得到, 只能通过**HTTP**请求发送

```javaScript
'set-cookie': 'cookie_httpOnly=httpOnly; HttpOnly';
```

- `Secure`

**Secure**让当前**Cookie**只能通过**HTTPS**协议被发送

```javaScript
'set-cookie': 'cookie_secure=secure; Secure';
```

- `SameSite`

这个属性来源于**Chrome**, 因为**Chrome**正处于全面禁用第三方**Cookie**的过渡阶段

我们前面提到的**针对于Cookie的用户追踪**, 其大概逻辑是将用户行为存储到第三方域名的**Cookie**下, 然后在其他站点, 获得这个**第三方域名下的Cookie**, 就得到了用户的行为

::: warning - 注意

我们知道**Cookie**受同源策略保护, 那要如何存/取第三方域名下的**Cookie**呢?

前面我们也提到过, **Cookie**可以由服务端设置

这意味着

如果我们在`a.cookie.com`下，请求了`b.cors.com`下的某个资源/接口, 并且这个接口配置了相应的**Cookie**, 那么这个**Cookie**就会被种到`b.cors.com`下, 即使我们没有访问过`b.cors.com`

基于此, 我们可以在点击商品(a.cookie.com下)的时候像b.cors.com的某个接口发送请求的时候带上这个商品的hash, 然后这个接口又将这个hash设置到`set-cookie`上, 这样这个hash就被存放到`b.cors.com`的**Cookie**上了

```javaScript
// a.cookie.com
function clickProduct(productCode) {
  const hash = md5(productCode);

  const img = new Image();
  img.src = 'http://b.cors.com/user/product?product=' + hash;
}

// b.cors.com/user/product
function handlerProduct(hash) {
  res.setHeader('set-cookie', `__product_hash=${hash}`);
}
```

那如何取呢?

前面我们也提过**Cookie**会随着HTTP自动发送

所以我们可以在`c.co.com`下跨域访问`b.cors.com/user/product/parse`, 又**server**帮我们解析出**Cookie**

```javaScript
// c.co.com
function jsonpCallback(info) {
  // ...
  // 这里处理第三方的cookie
}

function getUserProduct() {
  const img = new Image();

  img.src = `https://b.cors.com/user/product/parse?jsonp=jsonpCallback`
}

// b.cors.com/user/product/parse
function parseProduct() {
  const { url, headers: { cookie } } = req;

  const reg = /(?<=jsonp=)[^&]+/;

  const [jsonp] = url.math(reg);

  const ret = `
    ${jsonp}(${cookie})
  `

  res.setHeader('Content-Type', 'application/javascript');

  res.end(ret);
}
```
这样我们就打破了**Cookie**的同源策略, 可以进行**Cookie**追踪
:::

这是由于这种泄漏隐私的**case**, **firefox**, **safari**已经禁用了第三方的**Cookie**

即在当前域名下，只能设置和上传当前域名的**Cookie**, 即使你在文档中请求了第三方资源, 浏览器也不会为你上传和存储第三方的**Cookie**

**Chrome**于2019年宣布将在2年内完全禁用**第三方Cookie**

在这期间可以使用**SameSite**属性, 由网站配置是否禁用**第三方Cookie**

它有3个值

1.  **None**

和正常一样, 可以自由设置**Cookie**, 需要注意其必须和**Secure**一起使用, 否则无效

2. **Lax**(默认)

**Chrome**将默认值由**None**更新为**Lax**

其只在某些时候发送/设置第三方Cookie, `<a href="" />`跳转, `<link ref="preload" >`预加载和`get`表单(要注意这里不是get请求)

3. **Strict**

不发送/设置**第三方Cookie**

所以如果现在需要做**Cookie追踪**, 我们针对在**Chrome**并且设置`SameSite=None; Secure`


- `__Secure- 和 __Host- 前缀`

如果你的**Cookie**值是`__Secure-`或者`__Host-`, 那么当前**Cookie**必须具有某些属性

`__Secure-`: 这个**Cookie**必须配置`Secure`

`__Host-`: 这个**Cookie**必须配置`Secure`, 并且**Domain**必须为`window.location.host`, **Path**必须为`/`

---

同时**SameSite**还能够预防**CSRF**攻击

我们知道**CSRF**就是在第三方网站上通过冒用用户**Cookie**🐓 的, 如果目标网站的关键**Cookie**的**SameSite=!None**, 那么这些**Cookie**就不会在攻击者的第三方网站上被发送, 从根本上杜绝了**CSRF**🐓

## 如何设置Cookie

- **前端**

在前端可以通过脚本读取/设置**Cookie**, `document.cookie`

`document.cookie`是一个属性存取器(`getter setter`), 而不是一个属性

我们可以使用`Object.definePrototype`更改它

作为**getter**时, 其能够获得当前域名下的所有**Cookie**(不包括属性), 并且以`<key>=<value>`的形式以`; `连接到一起

作为**setter**时, 其能够设置当前域名下的**Cookie**, 但是不能配置**HttpOnly**, 只有在**https**协议下, 才能够配置**Secure**

🌰

```javaScript
// a.cookie.com
document.cookie = 'a=1; HttpOnly'; // 无效
document.cookie = 'b=1;'; // 无效
document.cookie = 'c=1; Domain=cookie.com'; // 无效

document.cookie // 'b=1; c=1'
```

- **服务端**

**server**只需要将**Cookie**设置到响应头的`headers.Set-Cookie`上就好了

如果要获取发送来的**Cookie**也从请求头中获得就好了

```javaScript
const { headers: { cookie } } = req;

res.setHeader('Set-Cookie', 'a=1');
```

::: warning - 注意

同一个位置同名的**Cookie**会发生覆盖

```javaScript
// a.cookie.com
document.cookie = 'a=1';
document.cookie = 'a=2';
document.cookie // 'a=2'
```

需要注意**同一个位置**, 如果我们将同名的**Cookie**存放到了不同的Path下，那么我们就会的到2个同名的**Cookie**

```javaScript
// a.cookie.com/path

document.cookie = 'path=1';
document.cookie = 'path=2; Path=/';
document.cookie // 'path=1; path=2'
```
:::

## Cookie危害

- **CSRF 🐓**

关于**CSRF**的内容请看这里[CSRF](/safety/web/csrf.html)

- **Cookie用户追踪**

前面提到过**Cookie**可能被用来追踪用户行为

## 其他Cookie问题

- **流量损失**

我们知道**Cookie**是自动随着域名下的请求发送的, 这就可能造成损失，可能我们并不需要**Cookie**, 但是其自动发送给**server**了

比如: 静态资源...

所以对图片等静态资源, 我们一般将其放到专门的域名(**这里指的是域名, 不是机器哦**)下, 不过一般企业都会建立专门的静态资源服务器
