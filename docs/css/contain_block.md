# Contain_Block

这天, 小明参加了某公司的面试, 面试官问到了这样的一个问题

Q: 请介绍一下`position`的值以及他们是如何定位的

A: `position`具有以下几个值`static`, `relative`, `absolute`, `fixed`, `sticky`

- static

默认

- relative

相对于自身定位

- absolute

相对于最近有定位的父级元素定位, 如果没有有定位的父级的话则相对于文档

- fixed

相对于`viewport`定位

- sticky

粘性布局, 是`relative + fixed`, 当满足`top|right|bottom|left`的值后是`fixed`

面试官又问

Q: `relative`和`absolute`是相对于元素的哪里进行定位的? `padding` 还是 `border` 或者 `内容区`

A: ...布吉岛:cow:

面试官再问

Q: 
```html
<div id="relative">
  <div id="transform">
    <div id="content"></div>
  </div>
</div>

<style>
.relative {
  position: relative;
}

.transform {
  will-change: transform;

  margin-left: 10px;
  margin-top: 10px;
}

.content {
  position: absolute;

  top: 10px;
  left: 10px;
}
</style>
```
还是相对于id为`relative`的元素定位么? 

A: 

小明想: 你都这么问了, 那肯定不是啊, 可为啥不是啊, 在向下面问我咋办...

应该不是, 小明含糊的回答到

---

## position到底是怎么定位的

umm...实际元素在创建的时候会产生属于他们的`Contain Block`包含块, 元素会基于这个包含块进行定位

不同的`position: value`其`Contain Block`是不一样的

## 如何确定元素的Contain Block

- **static, relative, sticky**

其`Contain Block`是父级元素的内容区

这也就是👆小明说, `relative`是相对于自身定位的根本原因

::: warning 注意

`position: sticky`的是相对于最近的产生滑动区域的元素`padding`定位, 但是元素的粘性效果, 不能超过其内容区

```html
<div id="wrap">
  <div id="sticky" style="position: sticky; top: 0"></div>
</div>
```

当`wrap` 的底部和`sticky`的底部重合的时候, 继续向上滑动时, `sticky`就会失去粘性效果, 随着`wrap`向上滚动

[Contain Block限制sticky区域的Demo](https://arkusa.github.io/Demo/HTML_CSS/Sticky/sticky.html)

:::

- **fixed**

其`Contain Block`是`viewport`区域

- **absolute**

其`Contain Block`是有定位的父级元素(递归的文档)的`padding`区域

- **如果 fixed 和 absolute 其父级(可以向上递归)存在某些css属性**

其`Contain Block`是存在这些属性的`padding`区域

## 影响absolute和fixed包含块的CSS3属性

- `transform`

- `perspective`

没用过, 3d变换相关

- `will-change: transform | perspective`

- `filter: !none`

- `contain: paint`

## Contain Block的其他用处

除了和定位相关外, 我们对元素设置的百分比都是基于包含块的大小计算的

## 总结

- `position`会产生`Contain Block`

- 不同`position: value`产生的`Contain Block`不同

- `position`元素会相对于其`Contain Block`定位(`position: sticky`除外)

- `position: sticky`相对于最近的有`overflow: value`属性的元素定位, `overflow: hidden`也包括, 但是因为其没有产生实际的滑动区域, 所以看起来`position: sticky`就失效了

- `Contain Block`虽然不是`position: sticky`的定位参照, 但`sticky`元素只有在`Contain Block`内才有粘性效果

- 常用的`transform | filter | contain: paint | will-change: transform`会影响`fixed`和`absolute`的包含块, 如果发现某个元素的`fixed | absolute`的位置不符合预期, 记得检查以下其父级(递归)是否有这些属性
