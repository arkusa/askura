# Tree Shaking

本篇文章不介绍`rollup`以及`uglifyjs`是如何`tree shaking`的, 如果你想了解的是`AST`方面的内容, 能力不够 爱莫能助

本篇文章主要介绍`webpack`是如何利用`uglifyjs`实现`tree shaking`, 及其局限性, 能帮助我们更好的分析工程, 建立最优的构建流程

## Tree Shaking 以及 DCE 的关系

`DCE`全称`dead code elimination` 即: 消除那些`根本不会被用到的变量/函数`, `永远不会执行到的语句`, `纯函数的调用且其结果没有被使用`...

```javaScript {1-3,9,13-15,18,21-25,27-29}
function pureAdd(a, b) {
  return a + b;
}

function unusedFunc() {
  pureAdd(1, 2);
}

const unusedVar = 100;

function main() {

  if (false) {
    pureAdd(5, 6);
  }

  return 1;
  return 2;
}

const a = 1;
const b = 2;

pureAdd(3, 4);
const result = pureAdd(a, b);

function useunusedFunc() {
  unusedFunc();
}

console.log(main());
```

上面 🌰 中 高亮的部分都属于`dead code`, 需要被清除

---

想一下目前我们是如何处理这些`dead code`的呢?

Answer:

- **对项目管理而言借助于`git hooks`和`eslint`**

我们知道`elint`是一种检查代码格式的工具, 在`pre-commit`内执行`eslint`检查, 可以防止开发者将不符合工程规范的代码上传

- **对开发者而言借助于`eslint`, `ESLint(vscode 插件), vscode`(如果你使用 vscode 作为 IDE)**

对于使用`vscode`的开发者, 只要项目中安装了`eslint(node package)`依赖, 同时`vscode`安装了`ESLint(vscode 插件)`

就可以一边 code, 一边代码检查

给`vscode`增加如下配置, 还能在保存的时候自动修复一些可以修复的格式问题

```javaScript
// setting.json
"editor.codeActionsOnSave": {
  "source.fixAll.eslint": true
},
```

### ESLint(eslint pacakge 和 ESLint vscode 插件)在 DCE 方面的局限

`eslint`: node package

`ESLint`: vscode plugin

---

- **不能保存时自动 fix**

我们知道`ESLint`是在**开发时**进行代码检测, 而不是在开发完成后, 对于一些像`unused`这样的错误, 并不会自动修复(**因为不知道这类错误是单纯没用到, 还是开发者忘记用了**)

所以其只能设置保存时修复代码格式, 而不能修复`dead code`和其他不符合规范的代码(`重复变量名`, `not in camel case`...)

---

- **eslint 对于`dead code`的检测比较局限**

  - **没有使用到返回值的纯函数**

    看上面 🌰 中`line 24`的代码`pureAdd(3, 4)`, `eslint`并不会检测出它是一个需要处理的异常, 因为`eslint`不会分析函数`pureAdd(3, 4)`是不是有意义, 对于没有副作用的纯函数而言, 如果没用用到函数的返回值, 那么其就是没有意义的同样属于是一种`dead code`

  - **只对当前文件作用域进行检测** (这个总结不妥, 但是暂时没想好 TODO)

    另一方面`eslint`只会在当前文件作用域下进行检测, umm... 这么说可能不好理解, 这里举个实际开发中一定会遇到的例子

    你完成了一个需求, 发现有一些`eslint`检测出的异常, 但是伴随这你对这些异常的修复, 会有更多的异常出现...

    这就是我说的**只对当前文件作用域进行检测**(下面是用例子对其解释)

    可以看上面 🌰 中`line 5 - 7` `line 27 - 29`, 函数`unusedFunc`只在`useunusedFunc`内被调用, 而函数`useunusedFunc`是一个**未被使用的函数**, 所以`unusedFunc`和`useunusedFunc`都是`dead code`

    但是`eslint`却不能将他们一起检测出来, 只能先检测`useunusedFunc`, 在`fix useunusedFunc`后才能检测出`unusedFunc`

这里我提出的 2 点都是`eslint`没有实现, 但是`rollup`却实现了的

当然还有一些情况是`rollup`和`eslint`都做不到的`DCE`, 比如

```javaScript
const object = {};
object.a = 1;

// 但是却没有使用到object.a的地方
```

难做到的原因在于, javaScript 是动态的脚本语言, 引用值具备什么属性只有在执行过程中才能被确定, 如果你想对这样的内容也进行检测, 欢迎迁移`TypeScript`

---

说了那么多, 有点跑题... 想让你知道的仅仅是我们在实际开发中, 已经使用`eslint`完成了大部分的`DCE`, 下面就介绍什么是我理解的`Tree Shaking`

### 什么是 Tree Shaking

`Tree Shaking`本质上来说还是`DCE`, 但是`DCE`是对单一文件做代码删除, 而`Tree Shaking`是不同文件间的`DCE`

换句话来说对于`file A`, 如果只分析`file A`内的代码就是`DCE`

如果在分析`file A`时, 除了要依靠其本身的代码外, 还需要`file B`对`file A`的依赖信息, 这就是`Tree Shaking`

看这个 🌰

```javaScript
// math.js
export const add = (a, b) => a + b;
export const reduce = (a, b) => a - b;
export const multiply = (a, b) => a * b;
export const except = (a, b) => a / b;
```

如果只使用`eslint`检测文件的话, 会发现是没有`dead code`的, 因为`export`就是对`const *`的一次使用

想一下如果我们只需要使用`add`方法呢, 其他方法也会被引入, 只凭借传统的`DCE`是无法处理这种情况的

`rollup`针对这种`case`做了特殊的逻辑, 能减少一个模块中从未被其他模块使用的代码

**`rollup`把传统`DCE`和`减少公共文件未引入部分`合起来称作`Tree Shaking`**

## Webpack 是如何 Tree Shaking

在 webpack4 之前, **可以说 webpack 是不具备 Tree Shaking 功能的**, 有的只是**借助于`uglifyjs`的`DCE`**

这是因为`webpack`只是一个简简单单的模块化打包工具和核心逻辑在于处理`import`和`export`关键字, 提供模块化处理(当然也正是因为其目的简单, 所以才能集成众多`loader`以及`plugin`, 提供丰富的额外功能)

其缺少对文件本身的分析, 只是将所有 js 文件经过插件处理后(`可能包含babel`)打包到一个**bundle**内(这里不考虑懒加载的情况)

```javaScript
(function webpack(modules) {
  function __webpack_require(moduleId) {

    return modules[moduleId](module, exports, __webpack_require);
  }
}([
  /* moduleA */
  function (module, exports, __webpack__require) {
    // ...
    const moduleB = __webpack__require(1);
  },
  /* moduleB */
  function (module, exports, __webpack__require) {
    // ...
  },
  /* moduleC */
  function (module, exports, __webpack__require) {
    // ...
  },
  /* moduleD */
  function (module, exports, __webpack__require) {
    // ...
  },
]));
```

将这个文件输入给`uglifyjs`, 由`uglifyjs`对其进行`DCE`

### Webpack4 之前令人尴尬的 Tree Shaking

`uglifyjs`对于上面**bundle**的`DCE`其实就是分别对`moduleA`, `moduleB`, `moduleC`, `moduleD`做`DCE`

**如果你项目使用了`eslint`, 在开发的时候就已经对各个模块做了`DCE`(虽然是手动的), 可以说`uglifyjs`没做什么和`DCE`有关的事情**

::: warning 😂

经由`eslint`手动`DCE` 和 `uglifyjs`自动`DCE` 得到的代码差不多

因为`uglifyjs`不具备流程分析, 采用了一种相当保守的策略

甚至于有的时候`uglifyjs`还会比`eslint`的`DCE`效果还查

这种情况大多发生在`babel`编译上

:::

由于`babel`需要编译出的代码需要符合`API`, 还要考虑浏览器兼容性, 编译出的代码可能会很奇怪

比如类就会被编译成立即执行函数的形式

```JavaScript
// icon.js

class WarningIcon {}

class DangerIcon {}

Layzer.appendChild(new DangerIcon())
```

这是如我们利用`eslint` 能够检测出`WarningIcon`没有被使用, 手动删除

但是如果经过`babel`编译由`webpack`输入到`uglifyjs`其就会是下面的结果

```javaScript {6-9}
(function webpack() {

}(
  // icon
  function (module, exports, __webpack__require) {
    const WarningIcon = (function() { // 函数执行可能会有副作用, 虽然没用到但是不能删除
      // ... 一些babel编译出的烂七八糟的代码, 都可能有副作用, 更加不能删除
      return function() {}
    }());


    const DangerIcon = (function() {
      // ...
      return function() {}
    }());

    Layzer.appendChild(new DangerIcon())

    // 这里也会有副作用, 也是导致WarningIcon不能删除的原因
    __webpack_require.d(exports, 'WarningIcon', function() { return WarningIcon })

    __webpack_require.d(exports, 'DangerIcon', function() { return DangerIcon })
  }
));
```

看!! 这个没用到的`WarningIcon`根本没被用到, 我们知道可以删除, `uglifyjs`采用的策略不认为其能被删除, 这时就没有`eslint`灵活

所以在**webpack4**之前根本没有**Tree Shaking**, 只有**DCE**, 但是这个**DCE**也在开发过程中做完了, 想我在**webpack2**的时候就听说过**webpack Tree Shaking**, 当时以为是一个多 🐂🍺 的东西 现在想来着实尴尬 😅

### rollup 和 uglifyjs 的不同 DCE 策略

**`uglifyjs`采用保守策略对于一些可能影响程序运行的结果都保留, 即使他们未被使用到**

**`rollup`具有程序流分析, 可以很好的判断出函数... 是否具有能影响程序运行的副作用**

还记得最上面的代码嘛? 我将上面的代码分别用`webpack uglifyjs`和`rollup`打包, 以及借助`eslint`手动fix得到如下结果

- **rollup**

```javaScript
function main() {

  return 1;
}

console.log(main())

```

- **webpack(uglifyjs)**

```javaScript
function(module, exports, __webpack_require__) {
  function pureAdd(a, b) {
    return a + b;
  }

  pureAdd(3, 4);
  pureAdd(1, 2);

  console.log(function() {
    0;
    return 1;
  }());
}
```

可以看到`pureAdd`函数以及相应的执行被**uglifyjs**保留了下来

因为`uglifyjs`不能判断`pureAdd`是否具有副作用所以将其保留

- **借助eslint提示手动DCE**

```javaScript
function pureAdd(a, b) {
  return a + b;
}

function main() {
  return 1;
}

const a = 1;
const b = 2;

pureAdd(3, 4);
const result = pureAdd(a, b); /* 可能被保留pureAdd(a, b) */ /* 也可能删除 */

console.log(main());
```

---

#### 什么是副作用

如果你用过`redux`或者`redux-saga`, 相信你能明确知道什么是副作用.

副作用就是在预期外的影响全局的一些语句, 下面我只举几个例子

```javaScript
// example 1
(function() {
  var a = b = 1; // 如果是在浏览器环境下, 这会在全局声明一个变量b
}())

console.log(b); // 1

// example 2
const obj = {};
Object.definePrototype(obj, 'a', {
  setter() {
    console.log('setter');
  },

  getter() {
    console.log('getter');
  }
});

obj.a = 1; // 这也是副作用
```

对于这些副作用, `uglifyjs`会将他们保留

关于`uglifyjs`对副作用的看法可以看一下这条[issue](https://github.com/mishoo/UglifyJS/issues/1261)

大概就是说

1.  `uglifyjs`没有程序流分析, 采用保守策略保留任何可能有副作用的操作(函数执行, 引用属性的赋值和读取)
2.  `rollup`做了, 可以考虑迁移
3.  **可以用`/*@__PURE__*/`表明这个函数的执行是没有副作用的**

还是最上面的例子, 如果我们给`line 24`和`line 25`加上`/*@__PURE__*/`就会得到如下的输出

```javaScript
// uglifyjs
function(module, exports, __webpack_require__) {
  console.log(function() {
    0;
    return 1;
  }());
}
```

### Webpack4的Tree Shaking

**webpack4**本质上还是借助于`uglifyjs`的`DCE`功能

但是**webpack4**为其**DCE**提供了额外信息(是否引入了某些方法)

**webpack4**在解析模块时(`import`)能后得到所有的依赖信息, 然后会将他们汇总将和某个模块有关的信息注入到这个模块

--- 

看一下下面的例子🌰

```javaScript
// math.js
export const add = (a, b) => a + b;
export const reduce = (a, b) => a - b;
export const multiply = (a, b) => a * b;
export const except = (a, b) => a / b;

// entry.js
import { add } from './math';
console.log(add(1, 2));
```

被编译为如下的**bundle**(伪码, 输入到uglifyjs前)

```javaScript
(function webpack() {

}([
  // entry.js
  function(module, exports, __webpack_require) {
    const { add } = __webpack_require(1);
    console.log(add(1, 2));
  },
  // math.js
  function(module, exports, __webpack_require) {
    const add = (a, b) => a + b;
    const reduce = (a, b) => a - b;
    const multiply = (a, b) => a * b;
    const except = (a, b) => a / b;

    // __webpack_require.d是一个setter函数, 会讲函数挂在到exports[moduleId]上
    __webpack_require.d(exports, 'add', function() { return add });
    __webpack_require.d(exports, 'reduce', function() { return reduce });
    __webpack_require.d(exports, 'multiply', function() { return multiply });
    __webpack_require.d(exports, 'except', function() { return except });
  }
]));
```

对于上面的**bundle**如果**webpack**能够删除`__webpack_require.d(exports, 'reduce|myltiply|except', function() { return reduce|multiply|except });`, 在输入到`uglifyjs`中, `uglifyjs`就可以删除掉除了`add`外的其他函数

---

#### usedExports

`optimization.usedExports(boolean: false)` 就做了这样的事情

开启了**optimization.usedExports**, **webpack4**会收集模块相互引入的信息, 最终将与该模块有关的信息汇总, 发现`math`模块的`reduce | multiply | except`方法没有被引入, 在生成**bundle**的时候就只是这样的

```javaScript
// math.js
function(module, exports, __webpack_require) {
  const add = (a, b) => a + b;
  const reduce = (a, b) => a - b;
  const multiply = (a, b) => a * b;
  const except = (a, b) => a / b;

  __webpack_require.d(exports, 'add', function() { return add });
}
```

这样经过`uglifyjs`处理就只剩下了`add`函数

```javaScript
function(module, exports, __webpack_require) {
  const add = (a, b) => a + b;

  __webpack_require.d(exports, 'add', function() { return add });
}
```

#### webpack-deep-scope-analysis-plugin

**webpack4**的依赖收集机制是存在问题的, 他认为只要被`import`过而且在文件中又出现过就算是被依赖

这是错误的 🙅‍♂️

看一下下面的具体 🌰
```javaScript {14-18}
// math/add.js
export const add = (a, b) => a + b;
// math/reduce.js
export const reduce = (a, b) => a - b;
// math/multiply.js
export const multiply = (a, b) => a * b;
// math/except.js
export const except = (a, b) => a / b;

// math/index.js
export { add } from './add';
export { reduce } from './reduce';
export { except } from  './except';
import { multiply as multi } from './multiply';

export function multiply(...argvs) {
  return multi(...argvs);
}

// entry.js
import { add } from './math';
console.log(add(1,2));
```

在上面的代码中我们实际用到的方法方法只有`add`, 其他都应该被删除

虽然我们知道我们没有引入`multiply`, 也就不应该打包`multi`, 但是由于**webpack**缺少程序流分析, 他只是简单的认为只要`multi`在当前文件中再次出现, 就是需要被引入了

::: warning  注意
```javaScript
export { reduce } from './reduce';

import { except } from './except';
export { except }

// 上面这样的都不算在文件中再次出现, 因为它们都只起到了透传的作用

```
:::

下面让我们看一下, **webpack**对这种情况打包后的**bundle**(关闭了uglifyjs)
```javaScript
// 这里就只写模块了
[
  // entry.js
  function(module, exports, __webpack_require) {
    const { add } = __webpack_require(1); 
    console.log(add(1,2));
  },
  // math/index.js
  function(module, exports, __webpack_require) {
    const { add } = __webpack_require(2); 
    __webpack_require(3); 
    const { multi } = __webpack_require(4); 
    __webpack_require(5); 

    function multiply(...argvs) {
      multi(...argvs);
    }

    __webpack_require.d(exports, 'add', function() { return add });
    // __webpack_require.d(exports, 'mulitply', function() { return mulitply });
    // 因为multiply没有被用到, 所以上面没有上面那条输出的代码, 我写出并注释只是为了解释
  },
  // add
  function(module, exports, __webpack_require) {
    const add = (a, b) => a + b;
  
    __webpack_require.d(exports, 'add', function() { return add });
  },
  // reduce
  function(module, exports, __webpack_require) {
    const reduce = (a, b) => a - b;

    // 没被引用
  },
  // multi
  function(module, exports, __webpack_require) {
    const multiply = (a, b) => a * b;
  
    // 被math/index模块的multiply函数引用了, 所以被保留, 即使: multiply没有被引用
    __webpack_require.d(exports, 'mulitply', function() { return muliply });
  },
  // except
  function(module, exports, __webpack_require) {
    const except = (a, b) => a / b;

    // 没被引用
  },
]
```

**webpack-deep-scope-analysis-plugin**就可以解决部分这类问题

**webpack-deep-scope-anylysis-plugin**通过他提出的作用域分析, 能够得到那些方法没有被使用

其依赖于**webpack**的**usedExports**逻辑, 又反馈给**usedExports**

怎么理解上面的话, 还需要用上面的🌰 来解释

1.  **webpack**告诉**webpack-deep-scope-analysis-plugin**, `entry.js` 用到了`math/index.js`的`add`方法

2.  **webpack-deep-scope-analysis-plugin**在得到上述信息的情况下, 执行他的逻辑(分析作用域), 告诉**webpack**在`math/index.js`中实际只引用了`./add.js`(**`multify`方法内调用的`multi`方法也没有被引用**)

    相当于对`math/index.js`进行了2次分析

3.  最终**webpack**得到了这些信息生成了这样的**bundle**(关闭了uglifyjs)

```javaScript {32-35}
// 这里就只写模块了
[
  // entry.js
  function(module, exports, __webpack_require) {
    const { add } = __webpack_require(1); 
    console.log(add(1,2));
  },
  // math/index.js
  function(module, exports, __webpack_require) {
    const { add } = __webpack_require(2); 
    __webpack_require(3); 
    const { multi } = __webpack_require(4); 
    __webpack_require(5); 

    function multify(...argvs) {
      multi(...argvs);
    }

    __webpack_require.d(exports, 'add', function() { return add });
  },
  // add
  function(module, exports, __webpack_require) {
    const add = (a, b) => a + b;
  
    __webpack_require.d(exports, 'add', function() { return add });
  },
  // reduce
  function(module, exports, __webpack_require) {
    const reduce = (a, b) => a - b;
  },
  // multi
  function(module, exports, __webpack_require) {
    const multiply = (a, b) => a * b;
    // 这里没有了之前的 __webpack_require.d(exports, 'mulitply', function() { return muliply });
  },
  // except
  function(module, exports, __webpack_require) {
    const except = (a, b) => a / b;
  },
]
```

再经过`uglifyjs`就得到了
```javaScript {24-29,11-13}
// 这里就只写模块了
[
  // entry.js
  function(module, exports, __webpack_require) {
    const { add } = __webpack_require(1); 
    console.log(add(1,2));
  },
  // math/index.js
  function(module, exports, __webpack_require) {
    const { add } = __webpack_require(2); 
    __webpack_require(3); 
    __webpack_require(4); 
    __webpack_require(5); 

    __webpack_require.d(exports, 'add', function() { return add });
  },
  // add
  function(module, exports, __webpack_require) {
    const add = (a, b) => a + b;
  
    __webpack_require.d(exports, 'add', function() { return add });
  },
  // reduce
  function(module, exports, __webpack_require) {
  },
  function(module, exports, __webpack_require) {
  },
  function(module, exports, __webpack_require) {
  },
]
```

##### 欢迎回来

::: warning - 注意

如果你足够细心的话，你会发现上面代码中高亮的地方都可以删除

Really?

当然不能, 因为这和我们下个小节要说的`sideEffects`相关

:::

::: tip - 提示

同样的事情也会发生在那些只`import`不`export`的文件上, 比如上面的`entry.js`
```javaScript
import { add } from './math';

function main() {
  add(1, 2);
}

// 这里由于main没有执行, 所以我们也不希望引入add方法

// 这个地方的处理就不能使用webpack-deep-scope-analysis-plugin了, 因为这个plugin只有接受到usedExports的相关信息才会执行

// 这里是入口文件, 没有别人引用, 所以没有usedExports信息, plugin不会工作

// 那我们怎么处理呢? ? ?

// 很简单直接根据eslint提示信息 删除main或者执行main

// 为什么上面会使用webpack-deep-scope-analysis-plugin呢？是因为eslint在那种有export 的文件中无法知道那些被没被引用，只能借助webpack的usedExports功能
```
:::

**在前面说过`webpack-deep-scope-analysis-plugin`只能解决部分这类问题** 不知道你是否忘记没有

这是因为`webpack-deep-scope-analysis-plugin`是基于其作用域的逻辑找到未使用的方法的, 没有程序流控制, 对于下面一些情况不能正常工作

- **赋值**

```javaScript
// math.js
export { add } from './add';
export { reduce } from './reduce';
export { except } from  './except';
import { multiply } from './multiply';

const multiplyAlias = multiply  // 这种情况会认为multiply方法也被使用了, 会被打包
```

- **函数执行**

```javaScript {7-13}
// math.js
export { add } from './add';
export { reduce } from './reduce';
export { except } from  './except';
import { multiply } from './multiply';

export const number = multiply(1, 2);
// 这种直接执行的函数无法分析情况无法分析
// 会打包multiply

// 但是如果你的函数是一个纯函数可以像uglifyjs一样加/*@__PURE__*/注释
// 这样就不会打包multiply
export const number = /*@__PURE__*/multiply(1, 2);

// entry.js
import { add } from './math';
console.log(add(1,2));
```

- **根域下的函数执行/或语句**

还是上面的🌰 

```javaScript
export const number = /*@__PURE__*/multiply(1, 2); // 1. 这种会不打包multiply

multiply(1, 2); // 2. 这种就会打包multiply
/*@__PURE__*/multiply(1, 2); // 3.  这种也会打包multiply
console.log(multiply(1, 2)); // 4.  这种当然更会打包multiply
```

OMG ! ! 这里我就不太懂了(对于`3`)

按照我的理解

1.  `1`可以进行作用域分析

2.  那么`2`也是可以的, 所以我认为`2`会打包`multiply`的原因在于`multiply(1, 2)`可能是有副作用的

3.  所以我尝试了`3`, 发现也被打包了(**这就让我费解了, 应该是忽略了这种case吧**)

4.  这种明显的副作用显然应该打包`multiply`

如果你对`webpack-deep-scope-analysis-plugin`感兴趣的话, 👀 👇

[webpack-deep-scope-analysis-plugin 中文文档](https://diverse.space/2018/05/better-tree-shaking-with-scope-analysis)

----

#### sideEffects

还记得我们前面过[点这里](/engineering/tree_shaking.html#欢迎回来), **webpack4**对于某些空包依然保留了

```javaScript {29-36}
// math/add.js
export const add = (a, b) => a + b;
// math/reduce.js
export const reduce = (a, b) => a - b;
// math/multiply.js
export const multiply = (a, b) => a * b;
// math/except.js
export const except = (a, b) => a / b;

// math/index.js
export { add } from './add';
export { reduce } from './reduce';
export { except } from  './except';
import { multiply as multi } from './multiply';

export function multiply(...argvs) {
  return multi(...argvs);
}

// entry.js
import { add } from './math';
console.log(add(1,2));

// 打包后
(function() {

}([
  ...
  // reduce
  function(module, exports, __webpack_require) { // 这里
    'use strict';
  },
  // except
  function(module, exports, __webpack_require) { // 这里
    'use strict';
  },
]))
```

为什么呢?

这是因为虽然对于`reduce.js`而言, 里面只有`export const reduce = (a, b) => a - b;`这一行代码且我们没有引入`reduce`函数

但是我们还是引入了`reduce.js`文件的, 如果里面还有一些其他的函数呢?

```javaScript
export const reduce = (a, b) => a - b;

function log(val) {
  console.log(val);
}

log(2); // 这是副作用
```

这时候就要讲其放入到**bundle**中的**reduce**模块里

```javaScript
[
  // reduce
  function(module, exports, __webpack_require) { // 这里
    'use strict';
    function log(val) {
      console.log(val);
    }
    
    log(2);
  },
]
```

如果我们想删除这些代码, 怎么办呢? 又要使用`/*@__PURE__*/`(因为最终其都是通过uglifyjs进行`DCE`)

```javaScript
export const reduce = (a, b) => a - b;

function log(val) {
  console.log(val);
}

/*@__PURE__*/log(2); // 虽然有副作用, 但是我就不认为他有
// 这样最终就不会打包进去了
```

::: warning 注意

需要指定`uglifyjs`的`compress.side_effects: true`

否则 `/*@__PURE__*/` 只对 `const a = /*@__PURE__*/log()` 起作用

对`/*@__PURE__*/log()` 不起作用

:::

你会发现上面的东西和标题**sideEffects**无关, 别急 下面就要进入正体了

---

前面提到对于🔧包中的 在引入包的时候就执行的函数或者语句能使用**uglifyjs**特性`/*@__PURE__*/`来删除, 但是在最前面也提过了

`uglifyjs`不会删除可能有副作用的操作, `/*@__PURE__*/`只能应用在函数上

看下面的🌰 

```javaScript
// math.js
import { multiply } from './multiply';
import { add } from './add';
import { reduce } from './reduce';
import { except } from './except';

export default {
  add,
  reduce,
  except,
  multiply,
};

// entry.js
import { add } from './math';
console.log(add(1,2));
```

将`math.js`变成这样, 再进行打包, 你会发现`reduce`, `except`, `multiply`都在**bundle**内

更可恶的是你找不到办法来删除他们

##### 真的找不到方法么?

1.  **uglifyjs**肯定不行了

因为`export default { ... }`就是

```javaScript
const obj = {};
obj.add = add;
obj.reduce = reduce;
// ...
```

多么明显的副作用操作

2.  **webpack-deep-scope-analysis-plugin**

也不行...

跟域下的语句...

3. **口吐芬芳**

---

所以**webpack4**为了**fix**这种**case**, 提供了`optimization.sideEffects: true`

同时还要将`math.js`变成一个`npm package`

并且还要对其`package.json`增加`"slideEffects": boolean | (glob file)[]`

- `sideEffects: true`

  整个项目有副作用

- `sideEffects: false`

  整个项目没有副作用

- `sideEffects: (glob file)[]`

  整个项目只有数组内的符合`glob`格式的文件有副作用, 其余没有

所以
```javaScript
import { add } from 'math';
console.log(add(1, 2));

// math
import { add } from './add';
import { reduce } from './reduce';
import { multiply } from './multiply';
import { except } from './except';

export default {
  add,
  reduce,
  except,
  multiply,
};
```

如果`math package`的`package.json.slideEffects === false`, 那么**webpack**在最后输出**bundle**(未输入uglifyjs)时就会将除了`import { add } from './add'`的内容一刀切

下面是2个**bundle**的对比

```javaScript
// 从模块引入开始

// 未配置slideEffects
[
  // entry
  function(module, exports, __webpack_require) {
    const { add } = __webpack_require(1); 
    console.log(add(1,2)); 
  },
  // math/index.js
  function(module, exports, __webpack_require) {
    const { add } = __webpack_require(2);
    const { reduce } = __webpack_require(3);
    const { multiply } = __webpack_require(4);
    const { except } = __webpack_require(5);

    __webpack_require.d(exports, 'add', function() { return add });
    __webpack_require.d(exports, 'reduce', function() { return reduce });
    __webpack_require.d(exports, 'multiply', function() { return multiply });
    __webpack_require.d(exports, 'except', function() { return except });
  },
  // add
  function(module, exports, __webpack_require) {
    const add = (a, b) => a + b;
    __webpack_require.d(exports, 'add', function() { return add });
  },
  // reduce
  function(module, exports, __webpack_require) {
    const reduce = (a, b) => a - b;
    __webpack_require.d(exports, 'reduce', function() { return reduce });
  },
  // multiply
  function(module, exports, __webpack_require) {
    const multiply = (a, b) => a * b;
    __webpack_require.d(exports, 'multiply', function() { return multiply });
  },
  // except
  function(module, exports, __webpack_require) {
    const except = (a, b) => a / b;
    __webpack_require.d(exports, 'except', function() { return except });
  },
]

// 配置了正确的sideEffects

[
  // entry
  function(module, exports, __webpack_require) {
    const { add } = __webpack_require(1); 
    console.log(add(1,2)); 
  },
  // math/index.js
  function(module, exports, __webpack_require) {
    const { add } = __webpack_require(2);
    __webpack_require.d(exports, 'add', function() { return add });
  },
  // add
  function(module, exports, __webpack_require) {
    const add = (a, b) => a + b;
    __webpack_require.d(exports, 'add', function() { return add });
  },
]
```

---

综上, 我们在实际开发中可能虽然只引入了某个🔧 lib中的几个方法, 但是打包的时候会将整个🔧 lib 都打入**bundle**

就是因为`🔧 lib`中存在一些副作用

比如`lodash-es`, 如果你👀 他的源码的话, 就会发现其就有像我们上面提到的`export default { ... }`, 一样的写法

这是其API决定的`import { _ } from 'lodash_es'`, `import { isNull } from 'lodash-es'`

---

其实[上面](/engineering/tree_shaking.html#真的找不到方法么)提到的除了使用`sideEffects`找不到其他方法只是为了引出`slideEffects`内容

在这里需要补充一下其他方法

1.  **直接引入文件路径, 不需要透传**

```javaScript
import { add } from './math';

// 使用下面的写法
import { add } from './math/add.js'; // 这样就越过了对math/index.js的Tree Shaking处理
```

2.  **开发脚本或babel插件**

将
```javaScript
import { add } from './add';
```
编译成
```javaScript
import { add } from './math/add.js'
```

本质是一样的

`Antd`就是开发的`babel plugin`

## 一些其他注意点

### Tree Shaking只有使用ES6模块化才可以

**为什么?**

老实说我不清楚, 这个东西是怎么传出来的, 好像大家都在这么说... 😢😢😢

**静态分析?**

但是这只是`ES6`对浏览器`import/export`的要求, 实际`webpack`只是提供了他的`polyfill`

底层依旧是动态引入的

唯一可能的是在`webpack`动态引入的时候会分析模块的依赖关系

但是同样的, 这对`commonJS(require)`也应该是可行的

---

**我能想到的唯一原因在于**

`import`只能出现在顶层, 不能出现在函数或者条件语句中

```javaScript
import { add } from './math'; 

// 但是对于require则可以
// ...
if (obj.flag) {
  const add = require('./math');
}
// 这样obj.flag是动态决定的


function main() {
  const add = require('./math');
}
// webpack不会对程序流进行分析
```

但是可以无论怎样, 只要出现了就引入呀...

---

所以, 目前我认为**Tree Shaking只有使用ES6模块化才能做到**是错误的🙅‍♂️, 找不到必然原因证明其不可行, 单纯是`webpack`和`rollup`没做而已

## 为了更好的Tree Shaking我们应该注意那些事情

1.  如果可能的话rollup > webpack

2.  对一些没有副作用的函数执行添加`/*@__PURE__*/`注释

3.  如果你使用的webpack版本低于v4.0.0, 可以认为webpack是不具备Tree Shaking功能的, 只能按需引入, 或者像Antd那样开发`babel-plugin`处理`import { Icon } from 'antd'`这种case

4.  如果你的webpack版本大于v4.0.0, 可以使用`webpack-deep-scope-analysis-plugin`插件增强其判断某方法是否被引入的逻辑

5.  如果你`import { isNull } from 'lodash'`, 需要注意配置sideEffects.

6.  剩下的就需要具体问题具体分析了, 通过分析**bundle**找出原因

    主要从**webpack对于方法的依赖判断是否正确**, **代码是否产生副作用导致uglifyjs无法DCE**2方面分析

## 总结

- **什么是Tree Shaking 什么是DCE**

- **uglifyjs不能对可能有副作用的代码进行DCE**

- **可以使用`/*@__PURE__*/`来告诉uglifyjs这是一个纯函数执行**

- **wepback4之前不存在Tree Shaking 有的只是uglifyjs的DCE**

- **webpack4 usedExports是如何辅助uglifyjs完成Tree Shaking的, 以及usedExports的缺陷**

- **webpack-deep-scope-analysis-plugin是怎么增强usedExports逻辑的**

- **什么时候应该使用sideEffects**

- **为了更好的Tree Shaking我们应该做些什么**

- **出现了不期望的Tree Shaking我们要从那写方面排查问题**
