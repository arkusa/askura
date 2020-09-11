## 小明的故事

某天小明正在浏览B站主站, 不经意间看到一条广告: `10元充年费大会员`, '这可是好事情呀', 小明这么想着就点了进去. 结果只看到了一个空白页面... 日常吐槽后, 小明继续随便逛着.

第二天, 小明在B站直播看到一个可爱的萌妹子, 就想上船支持一下:rose:, 然后小明就发现自己背包内的'金瓜子'不翼而飞了... 

可怜的妹子. :smirk:

--- 

tips: 上面的内容纯属杜撰, 小破站这么优秀是不会有问题的

---

**小明的金瓜子是如何消失的呢?**

问题发生在小明打开的空白页面上(`10元充年费大会员`), 攻击者小黑通过流量劫持将这个页面注入到小明访问的主站上, 在这个空白页面上向主播小红送了礼物

```js
request(https://xx.xxx.com/send/gift/)
```
或
```html
<img src="https://xx.xxx.com/send/gift" />
```

因为小明的用户信息在登陆主站的时候被种到了`cookie`中, 而`cookie`会随着http自动发送, 所以上面的请求成功的发送到了服务端, 服务端经过验证确定是小明在向小红送礼物, 正确效应, 就这样小明的金瓜子就消失掉了

总结一下就是: 小黑冒充了小明给小红送了礼物

## CSRF

上面小明的故事就是一次`CSRF攻击`

> cross-site request forgery 跨站请求伪造, 是一种冒充用户发送请求的攻击方式

### CSRF的攻击思路

1.  受害者访问页面A, 成功登陆, 并且用户凭证是保存在`cookie`中
2.  受害者受攻击者引导访问了攻击者准备好的页面B(A, B不同源)
3.  攻击者在页面B提交了页面A的某个请求(A.com/xxx), 由于`cookie`自动发送的关系, A的用户凭证被发送
4.  服务端验证A的用户凭证, 确认是A发送过来的请求(实际是B发送的), 正确响应
5.  攻击完成, A :pout:

### CSRF的特点

- 请求发送自第三方网站

一般攻击都是来自第三方网站, 所以像简书, 知乎...论坛对于访问外链的url会进行风险提示

- 针对cookie攻击

利用cookie自动发送 且 在cookie中保存用户信息来达到对用户的冒充(这里只是冒充用户, 并不能得到cookie内容)

如果某站将用户信息存储在`localStorage`中, 则其不会存在CSRF攻击的潜在风险, 这是因为受同源策略限制, 在第三方页面中(这里排除了父子域的情况)无法通过脚本得到主站的内容

### 什么样的网站存在CSRF风险

- 使用`cookie`存储一些可以通过服务端请求的必要信息(用户信息...)

- 具有父/子域名的网站(e.g. image.baidu.com, zhidao.baidu.com)

这是由`cookie`的应用场景决定的

一般我们使用`cookie`来保持会话状态, 达到免密登陆的效果

对于单一域名的网站, 使用`cookie`免密的好处只是在发送请求的时候少些一些代码而已. 将一些需要持久化的信息放到`localStorage`中, 同样可以做到免密登陆

但是对于父/子域名的网站, 使用`cookie`是必要的, 由于同源策略的限制, `a.xx.com`和`b.xx.com`的`localStorage`不是通用的, 但是通过配置`cookie`的`domain=xx.com`, `a.xx.com`和`b.xx.com`会共用相同的`cookie`

这样使用`cookie`可以实现从`https://www.bilibili.com`跳转到`https://live.bilibili.com`下不需要继续登陆, 使用`localStorage`则不能

---

tips: 父/子域名不使用`cookie`, 在技术上也是可以实现跳转免密的, 这需要使用一个另外的`c.xx.com`: 用来存储信息, 然后分别在`a.xx.com`和`b.xx.com`内嵌入这样`iframe`

```html
<iframe src="c.xx.com" />
```

### CSRF的防御

根据[CSRF的特点](#csrf的特点)我们可以从以下3个方面对CSRF进行防御

- **攻击发生自第三方网站, 接口要判断是否同源(在可发送请求的白名单内)**

- **请求附加额外的信息(这个额外的信息要在本站内通过脚本得到)**

- **不使用cookie**

#### 攻击发生自第三方网站, 接口要判断是否同源(在可发送请求的白名单内)

这种防御方式是根据用户代理(浏览器)在访问第三方链接会在`request headers`内添加一些额外字段

- referer

- origin

用户代理在`<a />`, `<iframe />`, `<img />`, `跨域xhr`...时, 如果源地址是不是当前主站的地址, 则会增加一个`referer: 主站地址`

对于`CORS`请求(`<img />`, `跨域xhr`), 除了referer还会增加一个`origin: window.location.origin`, 用来做`CORS`验证

将**referer**和**origin**作为判断是否是CSRF攻击的依据, 如果存在referer或origin 且 referer或origin不在白名单内则认为是攻击, 拒绝请求 ❌

---

这种请求是否来自第三方网站的判断依赖于用户代理, 同时用户代理提供了`Referrer-Policy: <value>`来控制referer的表现行为

```html
<meta name="referrer" content="no-referrer" />
```

这样用户代理就不会添加referer请求头字段, 可能你会说: '不是还有origin么, 这个字段不会消失, 对referer和origin做与逻辑不就好了'

但是**origin**只会被添加在`跨域xhr`, `<img />`中, 对于GET请求, 攻击者可以通过`<a />`诱导点击和`<script />`的方式

这种情况下**referer**和**origin**都不存在, 会被认为是主站下的请求

---

综上: 判断请求是不是发生自第三方网站来预防并不能过滤掉所有的CSRF攻击

#### 附加额外的信息

- **Token**

在用户的登陆接口, 和验证是否登陆的接口, 服务端生成一个Hash并存储到Session中, 同时将这个Hash返回, 后续的请求发送需要将这个Hash一同发送给服务端(一般是负载在request headers内 token: hash, **这个Token一定不能随着cookie发送**), 这样服务端通过headrs的hash和Session中的hash进行验证,  就可以知道这个请求是否是在主站下发送的

---

这是因为这个hash是通过脚本得到的, 受同源策略保护

---

⚠️   : 上面提到的策略不适用于分布式系统, 一般企业都存在很多机房, 分布在不同的地方, 所以使用随机生成Hash的方式会造成不同机器Session内存储的Hash不一样...

**所以, 在分布式系统中, 不使用随机生成Hash的策略, 而是通过用户的userId, 有效时间... 生成的计算值**, 这样每次计较计算结果就可以验证请求是否来自第三方

- **双重Cookie**

[美团: CSRF](https://tech.meituan.com/2018/10/11/fe-security-csrf.html#%E5%8F%8C%E9%87%8Dcookie%E9%AA%8C%E8%AF%81)

对于**双重Cookie**有一些情况我不是很理解

1.  为什么要将额外的负载信息通过种Cookie的方式下发给页面

因为在访问页面的时候, 我们都会访问一个登陆接口, 为什么不在登陆接口返回

按照我的理解**双重Cookie**只是相对于**Token**缺少一个鲜度校验的过程, 只比较负载信息是否正确, 而没有校验负载信息是否过期

- **验证码**

对于一些特别敏感的操作使用验证码来避免CSRF, 比如支付

#### 不使用Cookie

CSRF是针对cookie进行的攻击手段, 找到一种满足需求且不使用cookie的代替手段就好了, 比如上面提到的使用`localStorage`实现父/子域跳转免密

### 浏览器的CSRF防御

针对CSRF浏览器提供了`SameSite Cookie`来设置什么情况下可以发送第三方的cookie

- None

发送第三方Cookie, 只在Secure下才可以使用

- Lax (默认)

在某些情况下才可以发送第三方Cookie, 比如`<a />`

- Strict

永远不发送第三方Cookie

```javaScript
res.setHeader(
  'Set-Cookie',
  'userId=AxsEZmec; SameSite=Lax'
);
res.setHeader(
  'Set-Cookie',
  'userId=AxsEZmec; SameSite=None; Secure;'
);
```

## 参考文章

[前端安全系列（二）：如何防止CSRF攻击？ - 美团技术团队](https://tech.meituan.com/2018/10/11/fe-security-csrf.html)
