# XSS

前篇提到的[CSRF](/safety/web/csrf)是一种发生在**第三方网站且针对COOKIE**的攻击方式

本篇介绍一种攻击范围更广, 危害更大的`Web`端攻击方式`XSS`

**XSS**全称**cross site script**跨站脚本攻击, 为了和**CSS**区分开, 所以被简写为**XSS**

---

**CSRF**只是在第三方网站上对用户的冒名顶替

**XSS**确是在你的网站下植入脚本, 能做到什么完全看攻击者的想象力

## 那些地方容易被XSS🐓

一般来讲渲染**用户输入**的地方都可能发生**XSS**🐓

比如:

- 评论区

- 富文本

- ...

::: warning 注意

输入和渲染并不一定是发生在同一个网站下

比如那种教学网站/问卷调查..., 用户A在系统A输入内容, 用户B在系统B显示内容

用户B也有被**XSS**攻击的风险

:::

那我们应该如何预防**XSS**呢? 别急, 在**XSS**的攻/防战中, 我们要先弄清楚**XSS**是如何🐓网站的, 这样我们才能找到合适的防御方法

## XSS的攻击原理

**XSS**攻击就是攻击者在系统可输入区域输入一些字符串, 这些字符串被渲染到页面的时候被浏览器识别为**javascript代码**而被执行

攻击会发生在那些能执行**javaScript**代码的地方

- `<script></script> 脚本`

- `onclick, onload, onerror 内联事件`

- `<a href="javascript:console.log(1);">点我, 你就上当了</a> 标签的属性`

- `href和src 属性外链了一个链接, 且其Content-Type为application/javascript`

所以当我们向上述内容中插入**字符串**的时候一定要小心

---

**XSS**攻击主要分为2个思路

1.  **创造新的包含攻击脚本的元素**

```pug
// pug 模版引擎
// localhost:3003
  ?author=<script>alert('script XSS')</script>
  &description=<img src="" onerror="alert('内联事件 XSS')">
  &href=javascript:alert('href XSS')
doctype html
html(lang='en')
head
  meta(charset='utf-8')
  meta(
    name='viewport'
    content='width=device-width, initial-scale=1.0'
  )
body
  h2 作者: !{author}
  h3 描述: !{description}
  a(href=href) 点我，你能看到href xss
  
// <script>alert('script XSS')</script> 生效
// <img src="" onerror="alert('内联事件 XSS')"> 生效
// href=javascript:alert('href XSS') 生效
```
2.  **提前闭合元素的属性, 将攻击脚本插入到元素的可攻击区域内**

🌰

