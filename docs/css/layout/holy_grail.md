# 圣杯布局揭秘

提到圣杯布局, 想必一定都不陌生.

圣杯布局是一种对三栏布局的优化手段, 其目的是让浏览器渲染引擎优先渲染中间的重要内容, 即:

```html
<div id="holy_grail_layout">
  <div id="middle"></div> <!-- 中间部分的结构放到最前面 -->
  <div id="left"></div>
  <div id="right"></div>
</div>
```
---

这篇文章的目的在于解释清楚下面的问题

Q: 为什么`left`元素`margin-left: -100%`会上移到`middle`的左边

如果你也对此困惑, 希望这篇文章能帮助到你

## 一个常见的错误理解 🙅‍♂️

`left`必须是浮动元素, 设置`margin-left: -100%`才会向上移动到`middle`的左边

::: warning 注意-很重要

任何具有`inline`性质的盒子在设置`maring-left: negative value`后, 如果可能的话都会向上移动, 并不是`float`元素特有的性质

:::

看一下下面的🌰

<div id="eg0">
  <div></div>
  <div></div>
</div>
<style>
  #eg0 {
    font-size: 0;
    width: 400px;
    height: 100px;
    background-color: burlywood;
  }
  #eg0 div:nth-of-type(1) {
    display: inline-block;
    width: 400px;
    height: 50px;
    background-color: darkorange;
  }
  #eg0 div:nth-of-type(2) {
    display: inline-block;
    width: 100px;
    height: 50px;
    background-color: aqua;
    margin-left: -100px;
  }
</style>

```html {7-13,29-36}
<div id="eg0">
  <div></div>
  <div></div>
</div>
<style>
  #eg0 {
    font-size: 0;
    /*
     * 这里是因为我们的布局不是紧凑的
     * eg0下的2个div有/r相当于空格, 这个东西收到了字体大小的影响
     * 如果不将字体设置为0
     * 会影响距离的计算
     * */
    width: 400px;
    height: 100px;
    background-color: burlywood;
  }
  #eg0 div:nth-of-type(1) {
    display: inline-block; /* 具有inline属性 */
    width: 400px;
    height: 50px;
    background-color: darkorange;
  }
  #eg0 div:nth-of-type(2) {
    display: inline-block; /* 具有inline属性 */
    width: 100px;
    height: 50px;
    background-color: aqua;
    margin-left: -100px;
    /*
     * 负margin-left相当于减少了元素的宽度
     * 在引擎计算的时候其参与计算的宽度为
     * width: 100px + margin-left: -100px = 0px
     * 而400px + 0px <= 400px 所以其会被绘制到上一行
     * 也就是上移动了
     * */
  }
</style>
```

既然不使用浮动元素也可以让元素上移, 那么为什么要用浮动元素呢? 都用`inline-block`不可以嘛

这里先给出结论, 是可以的但是要借助于`calc()`, 不要急先看一下下面的内容

---

## 文档流的inline布局和float流的布局区别

看一下下面inline布局和float流布局的对比

<div id="compared">
  <div id="inline">
    <h3>inline布局</h3>
    <div id="inline-layout">
      <div></div>
      <div></div>
      <div></div>
    </div>
  </div>
  <div id="float">
    <h3>float布局</h3>
    <div id="float-layout">
      <div></div>
      <div></div>
      <div></div>
    </div>
  </div>
</div>
<style>
#compared {
  display: flex;
  width: 740px;
}
#compared h3 {
  text-align: center;
  font-weight: 700;
}
#compared #inline {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  flex: 1;
  margin: 10px;
}
#compared #float {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  flex: 1;
  margin: 10px;
}
#compared #inline-layout, #compared #float-layout {
  font-size: 0;
  width: 300px;
  height: 200px;
  background-color: burlywood;
}
#compared #inline-layout div:nth-of-type(1) {
  display: inline-block;
  width: 250px;
  height: 50px;
  background-color: darkorange;
}
#compared #inline-layout div:nth-of-type(2) {
  display: inline-block;
  width: 100px;
  height: 50px;
  background-color: aqua;
  margin-left: -150px;
}
#compared #inline-layout div:nth-of-type(3) {
  display: inline-block;
  width: 100px;
  height: 50px;
  background-color: salmon;
}
#compared #float-layout div:nth-of-type(1) {
  float: left;
  width: 250px;
  height: 50px;
  background-color: darkorange;
}
#compared #float-layout div:nth-of-type(2) {
  float: left;
  width: 100px;
  height: 50px;
  background-color: aqua;
  margin-left: -150px;
}
#compared #float-layout div:nth-of-type(3) {
  float: left;
  width: 100px;
  height: 50px;
  background-color: salmon;
}
</style>

在下面高亮处可以看到2种布局除了布局方式外其他都一样, 但是`inline布局`的浅红色块上移了, 而`float布局`的浅红色块没有上移

这里是代码

```html {48-85}
<div id="compared">
  <div id="inline">
    <h3>inline布局</h3>
    <div id="inline-layout">
      <div></div>
      <div></div>
      <div></div>
    </div>
  </div>
  <div id="float">
    <h3>float布局</h3>
    <div id="float-layout">
      <div></div>
      <div></div>
      <div></div>
    </div>
  </div>
</div>
<style>
#compared {
  display: flex;
  width: 740px;
}
#compared h3 {
  text-align: center;
  font-weight: 700;
}
#compared #inline {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  flex: 1;
  margin: 10px;
}
#compared #float {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  flex: 1;
  margin: 10px;
}
#compared #inline-layout, #compared #float-layout {
  font-size: 0;
  width: 300px;
  height: 200px;
  background-color: burlywood;
}
#compared #inline-layout div:nth-of-type(1) {
  display: inline-block;
  width: 250px;
  height: 50px;
  background-color: darkorange;
}
#compared #float-layout div:nth-of-type(1) {
  float: left;
  width: 250px;
  height: 50px;
  background-color: darkorange;
}
#compared #float-layout div:nth-of-type(2) {
  float: left;
  width: 100px;
  height: 50px;
  background-color: aqua;
  margin-left: -150px;
}
#compared #inline-layout div:nth-of-type(2) {
  display: inline-block;
  width: 100px;
  height: 50px;
  background-color: aqua;
  margin-left: -150px;
}
#compared #inline-layout div:nth-of-type(3) {
  display: inline-block;
  width: 100px;
  height: 50px;
  background-color: salmon;
}
#compared #float-layout div:nth-of-type(3) {
  float: left;
  width: 100px;
  height: 50px;
  background-color: salmon;
}
</style>
```

**为什么2种方式的表示差异这么大呢**

产生区别的根本原因在于2种布局的算法不一样, 或者说2种布局采用的相对参照物不一样

我们知道inline元素和float元素是否换行 决定于当前行是否有足够的剩余空间

但是浏览器肯定是基于某种算法来判断剩余空间是否足够的, 当然不能像我们用眼睛看的一样, 这也是为什么`margin-left: negative value`会上移的原因

- **inline布局是相对于前一个兄弟元素计算剩余空间**

- **float布局是相对于视觉行计算剩余空间**

如果没有理解的话, 看一下下面的伪代码能帮助你理解

### inline是如何在文档流种布局的

```js
/*
 * @desc 计算剩余空间
 * @param prevReaminingSpace - 上次计算后的剩余空间
 * @param nodeWidth - 当前node节点经过计算后的实际宽度(和视觉上看到的并不总是一致的, 因为存在-margin)
 * @return currentReaminingSpace - 经过计算后的剩余空间由于nodeWidth可能存在负值的情况, 导致引擎认为的剩余空间可能会变大
 */
function computedReaminingSpace(
  prevReaminingSpace,
  nodeWidth,
) {
  return prevReaminingSpace - nodeWidth;
}

/*
 * @desc 计算剩余空间
 * @param currentNode - 当前要渲染的node节点
 * @return nodeWidth - 引擎理解的元素的宽度, 可能是负值 
 */
function computedNodeWidth(currentNode) {
  const { width, marginLeft, marginRight, paddingLeft, paddingRight, borderLeft, borderRight } = currentNode;

  return width + paddingLeft + paddingRight + borderLeft + borderRight + marginRight + marginLeft;
}

let prevReaminingSpace = parentNode.containWidth;

function paint(currentNode) {
  const nodeWidth = computedNodeWidth(currentNode);

  const remainingSpace = computedReaminingSpace(prevReaminingSpace, nodeWidth);

  if (remainingSpace >= 0) prevReaminingSpace = remainingSpace;
  else { prevReaminingSpace = parentNode.containWidth; paintNext(); } // 另起一行绘制
}
```

配合上面`inline layout demo`的话就是

1. 引擎在绘制完橘色部分, 剩下有`50px`的空间

2. 如果你将淡蓝色部分的margin-left设置为0 `控制台调整`, 由于其引擎认为的宽度是`100px`, 剩余空间不足，会在下一行绘制

3. 慢慢调小`margin-left`的值 直到`-50px`, 此时引擎理解的宽度为 `100px - 50px` 剩余空间足够绘制淡蓝色部分了, 所以将其上移

4. 继续调小`margin-left`, 引擎理解的剩余空间就慢慢变大

5. 直到`margin-left = -150px`时剩余空间为`100px`, 可以在当前行渲染桔红色部分了

### float流是如何布局的

float流的布局和上面类似, 只不过其剩余空间不会变大

```js {4}
/*
 * @desc 计算剩余空间
 * @param prevReaminingSpace - 上次计算后的剩余空间
 * @param nodeWidth - 当前node节点经过计算后的实际宽度(和视觉上看到的并不总是一致的, 因为存在-margin)
 * @return currentReaminingSpace - 经过计算后的剩余空间 会忽略nodeWidth可能存在负值的情况
 */
function computedReaminingSpace(
  prevReaminingSpace,
  nodeWidth,
) {
  if (nodeWidth < 0) return prevReaminingSpcae;
  return prevReaminingSpace - nodeWidth;
}
```

配合上面`float layout demo`的话就是

1. 引擎在绘制完橘色部分, 剩下有`50px`的空间

2. 如果你将淡蓝色部分的margin-left设置为0 `控制台调整`, 由于其引擎认为的宽度是`100px`, 剩余空间不足，会在下一行绘制

3. 慢慢调小`margin-left`的值 直到`-50px`, 此时引擎理解的宽度为 `100px - 50px` 剩余空间足够绘制淡蓝色部分了, 所以将其上移, 此时剩余空间为0

4. 继续调小蓝色的`margin-left`, 直到`-100px`, 此时引擎理解的宽度在变小, 剩余空间就在慢慢变大

5. 当`margin-left < -100px`, 此时引擎理解的宽度小于0, 在计算剩余空间的时候其就被忽略, 所以剩余空间又回到了`50px`

6. 调整桔红色块的`margin-left = -50px`, 发现其上移了, 因为剩余空间`50px` 等于 `100px - 50px`

### 小结

- **前面提到的`inline布局是相对于前一个兄弟元素计算剩余空间`, 你看到的当前行的剩余空间不一定是引擎认为的当前行的剩余空间**

- **前面提到的`float布局是相对于视觉行计算剩余空间`, 就是你能用👀看到的当前行的剩余空间**

## 使用`display: inline-block`完成圣杯布局

了解完`inline`布局的方式, 让我们试着用`inline-block`实现`圣杯布局`

```html
<div id="inline-block">
  <div id="middle">MIDDLE</div>
  <div id="left">LEFT</div>
  <div id="right">RIGHT</div>
</div>

<!-- 中间200px, 左右2边100px -->
<style>
/* 一些和圣杯无关的CSS */
#middle,
#left,
#right {
  display: inline-block;
  text-align: center;
  line-height: 100%;

  height: 50%;

  font-size: 25px;
  color: #FFF;
}

#middle {
  width: 100%;
  background-color: aqua;
}

#left {
  width: 100px;
  background-color: darkorange;
}

#right {
  width: 100px;
  background-color: salmon;
}

/* 容器需要为左右2边留100px的空间, 见step1 */
#inline-block {
  width: 400px;
  height: 200px;

  font-size: 0;

  padding: 0 100px;
}

/* -100px的话, 同时移动到middle的最右边, 见step2 */
#inline-block #left,
#inline-block #right {
  margin-left: -100px;
  /*
   * 由于left元素本身的宽度为100px
   * 设置margin-left: -100px 浏览器计算其宽度为0
   * 可以渲染在middle行
   * 同理right也可以渲染在middle行
   */
}

/* 让left, right分别向左，右移动到相应的位置, 见step3 */
#inline-block #left {
  position: relative;
  left: -100%;
}

#inline-block #right {
  position: relative;
  right: -100px;
}
</style>
```

<style>
#middle,
#left,
#right {
  display: inline-block;
  text-align: center;

  height: 50%;

  font-size: 25px;
  color: #FFF;
}

#middle {
  width: 100%;
  background-color: aqua;
}

#left {
  width: 100px;
  background-color: darkorange;
}

#right {
  width: 100px;
  background-color: salmon;
}
</style>

### step1 设置容器

<div id="inline-block-1">
  <div id="middle">MIDDLE</div>
  <div id="left">LEFT</div>
  <div id="right">RIGHT</div>
</div>

<style>
#inline-block-1 {
  width: 400px;
  height: 200px;

  font-size: 0;

  padding: 0 100px;
  margin-top: 30px;
}
</style>

### step2 left, right元素都在移动到middle的右边

<div id="inline-block-2">
  <div id="middle">MIDDLE</div>
  <div id="left">LEFT</div>
  <div id="right">RIGHT</div>
</div>

<style>
#inline-block-2 {
  width: 400px;
  height: 200px;

  font-size: 0;

  padding: 0 100px;
  margin-top: 30px;
}

#inline-block-2 #left,
#inline-block-2 #right {
  margin-left: -100px;
}
</style>

### step3 left,right移动到相应的位置

<div id="inline-block-3">
  <div id="middle">MIDDLE</div>
  <div id="left">LEFT</div>
  <div id="right">RIGHT</div>
</div>

<style>
#inline-block-3 {
  width: 400px;
  height: 200px;

  font-size: 0;

  padding: 0 100px;
  margin-top: 30px;
}

#inline-block-3 #left,
#inline-block-3 #right {
  margin-left: -100px;
}

#inline-block-3 #left {
  position: relative;
  left: -100%;
}

#inline-block-3 #right {
  position: relative;
  right: -100px;
}
</style>

## 传统的圣杯布局

**请重点看一下代码中高亮的地方, 注释掉的CSS代码是网络上流传的，取而代之的是我优化的版本, 很简单但是效果很好(可以取代双飞翼布局, fix布局异常的问题)**

::: warning 注意 - 双飞翼布局其实是一种hack优化

如果你完全理解了本篇所讲述的内容, 相信你就会理解为什么我认为双飞翼是一种hack优化了

因为其并没有解释清楚为什么圣杯布局会产生异常

:::

```html {53-77}
<div id="float">
  <div id="middle">MIDDLE</div>
  <div id="left">LEFT</div>
  <div id="right">RIGHT</div>
</div>

<!-- 中间200px, 左右2边100px -->
<style>
/* 一些和圣杯无关的CSS */
#middle,
#left,
#right {
  display: inline-block;
  text-align: center;
  line-height: 100%;

  height: 50%;

  font-size: 25px;
  color: #FFF;
}

#middle {
  width: 100%;
  background-color: aqua;
}

#left {
  width: 100px;
  background-color: darkorange;
}

#right {
  width: 100px;
  background-color: salmon;
}

#float {
  width: 400px;
  height: 200px;

  padding: 0 100px;
}

#float #middle {
  float: left; 
}

#float #left {
  float: left;
  position: relative;

  /* margin-left: -100%; */
  /* left: -100px; */
  left: -100%;
  margin-left: -100px;
  /*
   * 虽然只是值的对换, 但是其中的道理很重要
   * 我们知道网络上流传的圣杯布局有一个问题
   * 当left.width > main.width 时 left和right会掉下来
   * 为什么会这样呢？
   * 本编文章的内容可以很好的解释这一现象
   * 我们知道 left: -100% 是基于它的包含块计算的, 而在当前的布局中包含块的宽度就是main的宽度
   * 所以有 left: -100% * main.width = -main.width
   * 浏览器渲染引擎所认为的left元素的宽度left.virtualWidth = left.width + (-main.width)
   * 而已知 left.width > main.width
   * 则left.virtualWidth > 0, 但是当前剩余空间为0
   * 在当前行绘制不了, 于是就换行导致了布局异常
   *
   * 而经过值的对换后, margin-left: -left.width,
   * 浏览器渲染引擎所冉魏的left元素的宽度left.virtualWidth = left.width + (-left.width) = 0;
   * 当前行能够绘制, 所以无论怎么缩小，布局都不会异常
   * 
   * 当然就不需要双飞翼布局啦.......
   *
   * 很重要, 要看哦
   */
}

#float #right {
  float: left;
  position: relative;

  right: -100px;
  margin-left: -100px;
}
</style>
```

<div id="float">
  <div id="middle">MIDDLE</div>
  <div id="left">LEFT</div>
  <div id="right">RIGHT</div>
</div>

<style>
#float {
  width: 400px;
  height: 200px;

  padding: 0 100px;
}

#float #middle {
  float: left; 
}

#float #left {
  float: left;
  position: relative;

  left: -100%;
  margin-left: -100px;
}

#float #right {
  float: left;
  position: relative;

  right: -100px;
  margin-left: -100px;
}
</style>

## 总结

这篇文章通过揭秘圣杯布局，希望能够让你了解到如下内容

- `负margin的应用, 负值的maring-left相当于减少了元素的宽度`

- `文档流的布局方式`

- `float流的布局方式`

- `传统的圣杯布局为什么异常，以及应该如何优化`

- `双飞翼布局实际上是一种hack优化`
