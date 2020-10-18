# Function

## 什么是函数

函数能够表明一段逻辑, 主要是为了逻辑复用

```javascript
function sayHello() {
  console.log('sayHello');
}

sayHello();
// 打招呼
```

## 创建函数

创建函数有 3 种方式

### **函数声明**

```JavaScript
function sayHello() { ... } // 函数声明
```

**值得注意**的是函数声明是存在**Hosting**的, 即:

```javascript
sayHello();
function sayHello() { ... }

// 这是可以被执行的
```

为什么会这样, 可以阅读下面[执行期上下文](/javascript/function.html#执行期上下文)

### **函数表达式**

函数表达式分为匿名/具名函数表达式.

```JavaScript
var sayHello = function() { ... } // 匿名函数表达式
var sayHello = function say() { ... } // 具名函数表达式
```

意思是将`function`赋值给变量`sayHello`, 我们对这个`function`的索引只能够通过变量`sayHello`, 即使它是**具名**的

---

那具名函数的意义何在?

我们可以在函数内部访问这个**具名**, 即:

```javascript
var sayHello = function say() {  ... say(); }
// 在函数的内部可以通过sayHello, 和say2种方式访问自身

// 这是因为变量可能会更改, 所以使用具名调用自身可以防止错误的发生
// 比如下面
var sayHello = function say() { setTimeout(sayHello, 1000) }
sayHello();

sayHello = 'say hello';
// 这将在1s后抛出异常, 如果使用具名则不会有此问题

var sayHello = function say() { setTimeout(say, 1000) }
sayHello();

sayHello = 'say hello';
```

### **实例化 Function**

**javascript**中一切都是对象(Object), `function`也不例外, 它是一种具有`[[call]]`属性的可执行对象, 所以也可以通过实例化的方式创建一个`function`

API:

```javascript
new Function(...argvs, logic string)
```

```javascript
var add = new Function('a', 'b', 'console.log(a + b)');
add(1, 2);
```

这其实是执行了一段`string`是不安全的, 所以在开启了`CSP`的情况下其实不能被使用的

并且实例化的`function`和匿名表达式类似在函数内只能通过变量索引

## 函数的属性

### 形参

创建函数的时候定义的参数就是形参

```javascript
function add(a, b, c) {
  console.log(a + b + c);
}
// a, b, c都是形参
```

### 实参

函数实际执行时传入的参数就是实参

```javascript
function add(a, b, c) {
  console.log(a + b + c);
}
add(1, 2, 3);
// 1, 2, 3都是实参
```

### length

`length`指的是形参的数量

```javascript
function add(a, b, c) {
  console.log(a + b + c);
}
add.length; // 3(a, b, c)
```

### name

`name`指的是函数的名

- 函数声明, `name`是访问这个函数名
- 匿名函数表达式, `name`是这个函数创建时被赋值的变量名
- 具名函数表达式, `name`是具名
- 实例化`function`, `name`是 anonymous

```javascript
function add(a, b, c) {
  console.log(a + b + c);
} // add.name add
var add = function() {}; // add.name add
var ddd = add; // ddd.name add
var add = function dd() {}; // add.name dd
var add = new Function(); // add.name anonymous
```

### caller

`caller`支持了那个函数调用了它, 并将调用了它的函数的`toString()`, 如果在顶层作用域下被执行则是`null`

比如: `function parent`内调用了`function child`, 那么`child.caller`就是`parent.toString()`

```javascript
function grandpa() {
  parent();
}

function parent() {
  child();
}

function child() {
  console.log(arguments.name);
  console.log(child.caller);
}

child(); // null
grandpa(); // parent.toString()
```

### arguments

`arguments`是函数内置的一个对象, 在函数执行的时候它就会被创建

它是一个类数组, 其按照实参的顺序保存了实参的值

它还有一个`callee`属性, 是正在执行的函数的索引, 通过`callee`可以访问到当前执行的函数 (相当于匿名函数的具名)

```javascript
function add(a, b, c) {
  console.log(arguments);
  /*
   * {
   *   0: 1,
   *   1: 2,
   *   2: 3,
   *   length: 3,
   *   callee: add memory address
   * }
   */
}

add(1, 2, 3);
```

同时`arguments`是一个动态的对象, 这意味着如果在函数中改变形参的值, 对应的`arguments[index]`也会改变

```javascript
function add(a, b, c) {
  console.log(arguments[0]); // 1
  a = 2;
  console.log(arguments[0]); // 2
}

add(1, 2, 3);
```

::: warning 严格模式下的 arguments

严格模式下 arguments 不再是动态对象, 这意味着

```javascript
function add(a, b, c) {
  'use strict';
  console.log(arguments[0]); // 1
  a = 2;
  console.log(arguments[0]); // 1
}

add(1, 2, 3);
```

同时不允许访问 arguments.callee

这是因为函数的上下文是随着调用方而改变的

```javascript
const obj = {
  a: 1,
  add(b, c, flag) {
    console.log(this.a + b + c);

    if (flag) return;

    arguments.callee(2, 3, true); // 这里this指向了arguments
  },
};

obj.add(2, 3);
// 6
// NaN
```

---

同时`arguments.callee`不能被 javascript 引擎尾递归优化
:::

### prototype

Todo, 这里等完善对象的时候补充

## 执行期上下文

执行期上下文是函数运行的环境, 函数执行需要的信息都来自于执行期上下文, 比如:

函数执行需要使用到一些变量, 这些变量就是通过查找执行期上下文得到的

---

向字面一样, **执行期上下文**的生命周期只在函数执行的阶段, 一旦函数执行完其就会被垃圾回收机制 ♻️

通常是这样的, 除非这个**执行期上下文**成为了其他函数的`[[Scope Chain]]`的一部分

执行期上下文分为**初始化**/**执行**2 个阶段

### 初始化执行期上下文

1. 创建 VariableObject,函数中索引变量的时候会优先在 VariableObject 中查找.

```JavaScript
// 伪代码
VariableObject = {
	this: { 根据函数执行的方式动态设置 }, // 下文 上下文中的内容
	arguments: { callee: current function reference },

  // 如果是具名函数表达式, 会创建一个同名变量, 且其不可以被修改
  // var add = function a() {}
  a: current function reference
};
```

2. 连接`[[Scope Chain]]`

这里和下文[作用域链](/javascript/function.html#作用域和作用域链)有直接关系

如在某变量在当前函数创建的`VariableObject`中反问不到, 则会遍历其`[[Scope Chain]]`直到找到这个变量或者抛出异常

3.      初始化变量声明

- **ES5 声明**

如果是用 var 声明的变量将其挂载到`VariableObject`上, 其值为`undefined`

- **ES6 声明**

如果是用`let/const/class`声明的变量, 将其挂在到`VariableObject`上, 但是在声明前这个变量是不允许被访问的, 也就是类似于下面的伪代码

```javascript
function add() {
  console.log(a); // error
  const a = 1;
}
add();

// 执行期上下文的创建阶段
VariableObject = {
  this: window,
  arguments: { callee: add },
};

Object.definePrototype(VariableObject, 'a', {
  get() {
    throw 'error';
  },

  set() {
    throw 'error';
  },
});
```

这样的效果被称为暂时性死区(TDZ), 产生 TDZ 的变量声明前不允许访问

4. 初始化形参变量并且将实参赋值给形参, 挂载到 VariableObject 上, arguments 同步修改.

5. 初始化函数声明并且赋值为函数体. arguments 同步修改(如果这个函数声明的名称和形参重合的话).

上面 3 和 5 的过程就是常常提到的`Hositing`(变量提升), 即我们可以在函数声明前执行这个函数或者在变量声明前访问变量得到了`undefined`或者`throw`

---

有一种说法是`let/const/class`不存在`Hositing`, 所以不能在声明前被访问, 我不这么认为, 看下面的例子

```javascript
let a = 1;

function logA() {
  console.log(a);

  const a = 2;
}

logA(); // throw error
```

按照前面的说法, `const a = 2`没有`Hositing`所以`console.log(a)`应该访问的是顶层作用域下的`let a = 1`, 如果你说是由于`const a = 2`产生了 TDZ 的缘故, 我也可以接受, 但这不是我认为的逻辑

---

我是这样认为的, 就像前面初始化变量声明的时候提到的, `const a = 2`被提升, 但是它的值不是`undefined`, 而是一个异常

我认为这是 TDZ 的本质, TDZ 只是一种现象, 而并不是实际的一个区域/类

一个另外支持我的论点的原因在于, 这是一个运行时错误, 而不是编译时的错误。按照前面的理解这个错误更应该发生在浏览器解析代码时

---

面试官常常会出一些各种变量/函数名一样的问题来检验你对**初始化执行期上下文**的理解, 比如

```javascript
function add(a, b, c) {
  console.log(a); // function a() { console.log('a') }
  // 因为step4 函数声明, 所以VariableObject.a = function a() {}

  console.log(b); // 2
  // 下面的 var b = function() {} 还没有被执行到
  // step2 b = undefined
  // step3 b = 2 实参赋值

  console.log(c); // undefined
  // step2 c = undefined

  console.log(name); // ''
  // 这个东西比较特殊, 因为当前VariableObject上没有name
  // 所以会找[[Scope Chain]]
  // 恰巧globalThis(window).name = '' 这里指的是浏览器环境
  // 如果console.log(d); 则会抛出异常

  var b = function() {
    console.log('b');
  };

  function a() {
    console.log('a');
  }
}

add(1, 2);
```

### 函数执行, 执行期上下文动态变化

- 变量的索引优先查找`VariableObject`. 如果`VariableObject`上不存在的话则会顺着`[[Scope Chain]]`递归着索引 VariableObject 直到找到这个值

类似于对象索引属性的过程,不过不同的是

赋值的过程是直接在索引到的 VariableObject 上赋值,不是在当前执行期上下文的 VariableObject 上.

```JavaScript
console.log(window.name) // ''

function executionContextFunc() {
  name = 2;
  // 这里因为当前VO对象上不存在name
  // 所以在浏览器环境下找到了window
  // window.name = 2;
}

executionContextFunc();
console.log(window.name); // 2;

// 而对于对象的赋值过程确实这样的
const obj = { a: 1 }
const child = Object.create(obj);
child.a += 1;
child.a // 2
obj.a // 1
```

- 如果是由命名函数表达式方式创建的函数, 是不能修改其 current function reference 变量的.

```JavaScript
const executionContextFunc = function func() {
	func = 2;

	console.log(func); // output = exectionContextFunc.toString();
}

executionContextFunc();
// 严格模式下抛出错误.
// 非严格模式下静默失败.
```

- 若对变量的操作如何涉及到形参,那么 arguments 会同步更改(非严格模式下)

## 作用域和作用域链

### **作用域**

执行期上下文创建的 VariableObject 就是当前函数的作用域.

### **作用域链**

有的时候我们需要一些当前作用域不存在的变量,这个时候引擎会顺着作用域链索引到这个变量(类似于原型链)

---

JavaScript 的函数作用域是基于**词法分析**的.

即函数的作用域上下文是在函数被创建的时候确定的,而不是在函数执行的时候.

可以这样理解, 当前函数创建的时候会将**创建这个函数的函数**的执行期上下文和它的`[[Scope Chain]]`作为当前函数的`[[Scope Chain]]`

```JavaScript
function outer() {
	const outerA = 'outerA';
	const outerB = 'outerB';

	/*
	 * 此时outer的执行期上下文exectionContext(outer)
	 * {
	 *	 variableObject: {
	 *      outerA: 'outerA',
	 *      outerB: 'outerB,
	 *      this: window,
	 *      arguments: { callee: outer }
	 *   }
	 *	 [[Scope Chain]]: { outer['[[Scopes]]']: exectionContext(globalThis) }
	 * }
	 */

	// 在innter创建的时候会有一个属性[[Scopes]]指向了executionContext(outer)
  // 这是javascript函数静态作用域的原因
	const inner = function inner() {
	 	/*
	   * 此时inner的执行期上下文
	   * {
	   *	 variableObject: {
	   *      this: window,
		 *			inner,
	   *      arguments: { callee: inner }
	   *   }
	   *	 [[Scope Chain]]: inner['[[Scopes]]']
	   * }
	   */
		console.log(outerA);
		console.log(outerB);
	}

	return inner;
}

const inner = outer();
inner(); // 可以访问到outerA,outerB

// 执行期上下文会在函数执行后由于没有被其他引用导致被JS垃圾回收机制回收
// 但是上面代码中outer的执行期上下文成为了inner的一个属性
// 并且inner被挂到了全局上下文下

// 如果是按照计数引用的垃圾回收机制的还, inner的计数为1, inner不会被回收, 所以outer的执行期上下文的计数也是1不被回收

// 如果没有const inner = outer(); 只是outer(); 则inner的计数为0 先回收inner, 回收完inner之后outer的执行期上下文的计数也是0了, 也被回收
```

看下面的🌰 
```JavaScript
function outer() {
	const sameVariableName = 'outer';

	return function() {
		console.log(sameVariableName);
	}
}

const inner = outer();

function callInner() {
	const sameVariableName = 'call';

	inner();
}
// 输出outer

// 函数inner的执行期上下文的VO对象上不存在sameVariableName属性
// 所以访问执行期上下文的[[Scope Chain]]就是inner['[[Scopes]]']
// 而inner的[[Scopes]]是outer的执行期上下文,
// exectionContext(outer).VO.sameVariableName = 'outer'
// 所以是outer不是call
```

## 闭包

很难讲清楚闭包的定义.

有人认为每一个函数的创建过程都是闭包(我是这样认为的)

有人认为只有本应该销毁的执行期上下文被意外保存下来的行为才是闭包(👆 outer的执行期上下文就被inner保存了下来)

闭包的定义并不重要,你需要知道的是

- **闭包是如何产生的**

- **闭包是基于词法分析的语言的必然性质**

### 闭包的用处

- **变量私有化**

前面的例子`outer`的执行期上下文, 只能通过`inner`才能访问到, 这就意味着`exectionContext(outer).VO`上的变量只有`inner`能够访问, 这就提供了**变量私有化**的思路

我们知道`javascript`是没有提供私有化变量的机制的, 所以为了模块的健壮, 我们会使用`IIFE`让变量私有

```javascript
const add = (function() {
  const a = 1;
  const b = 2;
  return function(c) {
    return a + b + c;
  } 
}());

// a 和 b 就是只有add能够访问的变量, 不会被其他函数/语句改变
```

- **缓存**

**缓存**其实只是**变量私有化**的一种应用

React文档《派生State》提到了对复杂的计算可以使用一些可记忆的`lib`, 减少计算次数

[memoize-one](https://github.com/alexreardon/memoize-one)

[reselector](https://github.com/reduxjs/reselect)


这里是类似的实现

```javascript
function equalsArgvsDefault(prevArgvs, nextArgvs) {
	const prevLen = prevArgvs.length - 1;
	const nextLen = nextArgvs.length - 1;

	if (prevLen !== nextLen) return false;

	return prevArgvs.every((preArgv, index) => preArgv === nextArgvs[index]);
}

function equalsContextDefault(prevContext, nextContext) {
	return prevContext === nextContext;
}

function comparedEquals(equalsMethod) {
	let called = false;

	return function(...values) {

    // 第一次执行的时候不需要比较上下文, 参数...
    // 直接返回false 不相等, 让函数可以执行
		if (!called) {
			called = true;
			return false;
		}

		return equalsMethod(...values);
	}
}

function memoizeOne(func, equalsArgvs = equalsArgvsDefault, equalsContext = equalsContextDefault) {
	let prevResult = null;
	let prevArgvs = [];
	let prevContext = null;

	const compare = comparedEquals(function({
		prevContext,
		nextContext,
		prevArgvs,
		nextArgvs
	}) {
		return equalsContext(prevContext, nextContext) && equalsArgvs(prevArgvs, nextArgvs);
	});

	return function(...nextArgvs) {
		if (!compare({
			prevContext,
			nextContext: this,
			prevArgvs,
			nextArgvs,
		})) {
				prevResult = func.call(this, ...nextArgvs);
				prevArgvs = nextArgvs;
				prevContext = this;
		}

		return prevResult;
	}
}
```

### 闭包的问题

由于闭包会引用已经执行完的函数的执行期上下文, 所以会导致内存泄漏

## 上下文

函数的上下文指的是函数的`this`

因为`javascript`的函数是基于词法分析的,但是有的时候我们又需要使用一些和运行时有关的状态.

`this`就是为了解决这样的问题而诞生

`this`会随着函数的调用情况而改变, 动态性

---

`this`在以及几种情况下具有不同的值(按照优先级高到低排序)

### new 运算符

`new`让`this`指向了以当前构造函数的原型为原型对象的对象

😂 😂 😂 😂 😂 太绕了, 看下面的🌰

```javascript
function Person() {
  // this -> Object.create(Person.prototype)
  // Person.prototype 构造函数的原型
  // Object.create(Person.prototype) 以构造函数的原型为原型对象创建了一个对象
  this.name = 'askura';
}

const p = new Person();
```

`new`的优先级是最高的, 没什么逻辑, 就是这么规定的

从逻辑上来讲应该是bind的优先级最高, 所以为了达到`new`最🐂🍺的情况, 在实现`bind`的时候需要注意如果当前函数被`new`运算符执行的化, `bind`失效

### Function.prototype.bind

函数签名
```javascript
(context, ...argvs): wrap(this)
```

`context`就是当前函数的`this`指向, argvs是函数的参数, 返回了一个函数

是一个`partial`函数

```javascript
function add(c, d) {
  console.log(this.a + this.b + c + d);
}

const context = {
  a: 1,
  b: 2,
}
add.bind(context, 3)(4); // 10
add.bind(context)(3, 4); // 10
add.bind(context, 3, 4)(); // 10
```

### Function.prototype.call/apply

函数签名

```javascript
call -> (context, ...argvs): this(...argvs)
apply -> (context, [...argvs]): this(...argvs)
```

`context`就是当前函数的`this`指向, argvs是函数的参数

`call`和`apply`的区别在于`apply`是将参数以数组的形式传入

```javascript
function add(c, d) {
  console.log(this.a + this.b + c + d);
}

const context = {
  a: 1,
  b: 2,
}
add.call(context, 3, 4); // 10
add.apply(context, [3, 4]); // 10
```

`bind`高于`call/apply`很好理解, 因为`bind`返回了一个函数, `call/apply`改变的是`bind`返回的函数的`this`而不是需要执行的函数的`this`

```javascript
function add(c, d) {
  console.log(this.a + this.b + c + d);
}

const context = { a: 1, b: 2, };
const context2 = { a: 3, b: 4, };

add.bind(context).call(context2, 3, 4); // 10
// call 改变的是add.bind(context)这个函数的this, 不是add的this
```

### 通过对象索引

通过对象索引访问`this`指向了直接索引到函数的对象

```javascript
const math = {
  a: 1, 
  b: 2,
  add() {
    return this.a + this.b;
  },
  math: {
    a: 3, 
    b: 4,
    add() {
      return this.a + this.b;
    },
  }
}

math.add(); // 3
// 这里的this指向了math


math.math.add(); // 7
// 这里的this指向了math.math

var add = math.math.add
add(); // NaN
// 这里的this指向了globalThis, 因为其不是通过对象索引到的
```

### 直接执行

非严格模式下, 直接执行`this`指向了`globalThis`

严格模式下, 直接执行`this`指向了`undefined`

```javascript
function add() {
  console.log(this);
}

add(); // window

function add() {
  'use strict'
  console.log(this);
}

add(); // undefined
```

### 箭头函数

ES6 提出了一种新的函数(箭头函数), 它可太🐂🍺 了

其最大的特点就是: **它的执行期上下文的VO对象中没有`this`属性**

前面提到的`new/bind/call/apply/对象索引`都是作用于函数执行期上下文的VO对象中的`this`, 而箭头函数没有这个`this`, 所以它们都不会对箭头函数生效

虽然箭头函数没有`this`, 但是它是可以操作`this`的, 那么这个`this`是哪里得到的呢? 

当然是通过遍历`[[Scope Chain]]`得到的

所以也有一种说法是, 箭头函数的`this`是创建这个箭头函数的函数的上下文, 且箭头函数的`this`不可变

我比较推荐上面那种没有`this`的逻辑

---

```javascript
var a = 1;
var b = 2;
var add = () => this.a + this.b;
var obj = { a: 2, b: 3 };
obj.add = add;
obj.add(); // 3

// !exectionContext(add).VO.this
// obj.add 改变this没有生效
// 通过访问[[Scopes]]得到exectionContext(window).VO.this = window
```

同时箭头函数不能够被实例化, 有以下2个原因

1.  其不存在自身的`this`
2.  其不存在`prototype`属性

## IIFE

`IIFE`: 立即执行函数, 它的主要作用就是**闭包/变量私有化**

---

有的时候它也用来解决这样的问题

```javascript
for (var i = 0; i < 10; i += 1) {
  setTimeout(function() {
    console.log(i);
  });
}
// 10 个 10
```

因为`setTimeout`是异步函数, 等待同步队列都没有其他任务后才会执行(这里不谈最小4ms 这种东西)

上面的代码就是这样的

```javascript
var i = 0;

function a1() {
  console.log(i);
}
i += 1;
function a2() {
  console.log(i);
}
i += 1;
...
// 这时同步任务都已经执行此时 i = 10

// 然后执行异步任务
a1(); // 10
a2(); // 10
```

我们可以利用`IIFE` fix 它

```javascript
for (var i = 0; i < 10; i += 1) {
  (function(j) {
    // IIFE不是异步执行的
    // 所以它的j分别是0, 1, 2, ... 9
    setTimeout(function() {
      // 函数没有j
      // 访问的是IIFE的j
      console.log(j);
    });
  }(i));
}
```

## 常用的高阶函数

> 高阶函数: 接受一个函数, 返回一个新的函数

### curry

`curry`函数是将多参数函数变成多个单参数函数的一种方法

它是函数式编程的一种思想

比如下面的🌰 :

```javascript
function com(a, b) {
  return a * a + b * b;
}

// 函数式思想
const pow = v => v * v;
const com = (a, b) => pow(a) + pow(b);
```

假如我们的语言不支持多参数函数, 那么怎么解决上面的`function com`呢? 这时候就要使用到`curry`

```javascript
const com = curry((a, b) => pow(a) + pow(b));
com(1)(2);
```

---

因为`javascript`本身支持多参数函数, 可以将其理解为将多参数函数变成多个单/多参数函数的一种方法

由于`javascript`并不是一门单纯的函数式语言, 所以`curry`在实际应用中并不常用( 你所接触的大部分`curry`函数 实际上 只是`partial`函数 ), 并且由于面向对象的性质在实际封装`curry`的时候还要多做一些思考💭

下面是我📦 的 `curry`实现, 完整代码可以看这里[curry](https://github.com/arkusa/javascript_utils/tree/main/curry)

```javascript
function curry(func, ...argvs) {
  let context = null;
  
  function acceptNextArgvs(...nextArgvs) {
    context = (this === undefined || this === globalThis)
      ? context
      : this;
  
    argvs = argvs.concat(nextArgvs);

    const ret = execRule({ func, argvs, nextArgvs })
      ? func.call(context, ...argvs)
      : acceptNextArgvs;
  
    return ret;
  }
  
  function F() {}
  
  F.prototype = func.prototype;
  acceptNextArgvs.prototype = new F();
  acceptNextArgvs.prototype.constructor = acceptNextArgvs;
  acceptNextArgvs.toString = () => func.toString();
  
  return acceptNextArgvs;
}
```
#### 一个常见的面试题是:

提供一个方法可以支持`add(1)(2) // 3`和`add(1)(2)(3) // 6`, 其实这就是在考察`curry`函数

但是这个问题的关键点在于参数是不定数量的, 而在`javascript`中需要一个条件让函数执行, (可能在像`Haskell`这样的强类型函数式编程语言可以通过函数的声明来确定条件, 但是`javascript`不行)

所以上面的问题在`javascript`中并不能✅ , 如果是`add(1)(2)()`或者`add(1)(2)(3)()` 或者 定参数都可以

但是很多面试官都直接抛出这个东西来让候选人完成, 其实大部分的面试官都忘记了一个很重要的前提条件, 即: **`add(1)(2)`是在控制台执行的**

在控制台执行`add(1)(2)` 等价于 `console.log(add(1)(2))`, 这会发生隐式类型转换, 调用函数的`toString`方法, 这就是一个可执行条件

(我之前面试的时候就是这样, 面试官条件都没说全就让实现, 🤮 )

```javascript
// 这里我就用我的curry封装来实现了, 目前还没有发布npm
import {
  curryFactory,
  extraCallExecRule,
} from 'my_curry';

const curry = curryFactory(extraCallExecRule);

add = curry(add);

const toString = add.toString;
add.toString = function() {
  add();
  return toString();
}
```

### partial

偏函数就是预先传入一些参数, 之后在传入剩下的参数, 在`javascript`中一般我们认为的`curry`其实都是`partial`

```C
// C
int foo(int a, int b, int c) {
  return a + b + c;
}

int foo23(int a, int c) {
  return foo(a, 23, c);
}

// foo23 就是 foo的偏函数
// 很常见吧
```

用`curry`可以很简单的实现大部分的`partial`

但是`curry`是严格定义顺序的, 即: 只能按照函数参数的顺序传入。但是`partial`则没有这种要求, 我们可以使用`placehoder`占位

#### partial实现

```javascript
function concat(argvs, nextArgvs, placeholder) {
  const result = [];
  let nextArgvsPointer = 0;

  for (let i = 0; i < argvs.length; i += 1) {
    const argv = argvs[i];

    if (argv !== placeholder) result.push(argv);
    else {
      result.push(nextArgvs[nextArgvsPointer]);
      nextArgvsPointer += 1;
    }
  }

  while(nextArgvsPointer < nextArgvs.length) {
    result.push(nextArgvs[nextArgvsPointer]);
    nextArgvsPointer += 1;
  }

  return result;
}

function partial(func, ...argvs) {
  function acceptNextArgvs(...nextArgvs) {
    return func.call(this, ...concat(argvs, nextArgvs, placeholder));
  }

  function F() {}
  
  F.prototype = func.prototype;
  acceptNextArgvs.prototype = new F();
  acceptNextArgvs.prototype.constructor = acceptNextArgvs;
  acceptNextArgvs.toString = () => func.toString();

  return acceptNextArgvs;
}
```

完整实现[partial](https://github.com/arkusa/javascript_utils/blob/main/partial/src/index.js)

### thunk

关于`thunk`的解释请移步[什么是thunk函数](https://es6.ruanyifeng.com/#docs/generator-async#Thunk-%E5%87%BD%E6%95%B0)

简单来说就是`thunk`是函数惰性使用参数的一种方案, 在`javascript`中 主要的应用是自动控制`generator`函数流程

`thunk`函数是`curry`或者`partial`函数的子集(具体看怎么实现), 是接受回调函数的异步函数的特殊`partial | curry`实现(特殊在 **最后一个传入的参数必须是函数**)

即:

```javascript
const read = thunk(fs.readFile);
read(filename)(callback);

// 只能是thunk(func)()()...(callback)这样的形式
```

不过一般都是`thunk(func)(argvs)(callback)` 这样的形式, 因为这样的形式最符合`generator`的流程控制

生产环境的`thunk`可以引入**tj**的`thunkify`

下面是我的实现, 其中`applyOnce`这个方法很重要, 下面注释中有说明, 是我阅读过**tj**大神的`thunkify`中得到的启发

```javascript
function thunkify(func) {
  function acceptNextArgvs(...argvs) {
    const context = this;

    function acceptCallback(callback) {
      try {
        return func.call(context, ...argvs, applyOnce(callback));
      } catch (err) {
        return callback(err);
      }
    }

    return acceptCallback;
  }

  function F() {}

  F.prototype = func.prototype;
  acceptNextArgvs.prototype = new F();
  acceptNextArgvs.prototype.constructor = acceptNextArgvs;
  acceptNextArgvs.toString = () => func.toString();

  return acceptNextArgvs;
}

// 对回调函数需要加🔒, 保证只执行一次
// 这是由于thunkify往往和co一起使用
// 即：其总是和generatory 函数的自动执行息息相关
// 看一下下面的🌰
/*
 * function asyncLog(l, callback) {
 *   try {
 *     console.log(l);
 *     callback(null, l);
 *     callback(null, l);
 *   } catch(err) {
 *     callback(null, l);
 *     callback(null, l);
 *   }
 * }
 */
// 上面的🌰 会导致自动流程控制的yieldResult.value(next) 中的next被执行了2次
// 从而导致generator流程⏩了1个流程
function applyOnce(func) {
  let called = false;

  return function (...argvs) {
    if (called) return;

    called = true;
    func.call(this, ...argvs);
  };
}
```

### compose

`compose`用来复合这样的函数`A(B(C(D(F()))))`, 这样的代码很容易缺少`)`, 也不方便阅读

`compose`可以让`A(B(C(D(F(argvs)))))`变成`compose(A, B, C, D, F)(argvs)`这样看起来就舒服多了

将函数嵌套变成像右偏移的参数, 是一种代码视觉上的优化

在`redux(applyMiddle)`中有使用到这种技巧

#### 实现

```javascript
const compose = (...funcs) =>
  funcs.reduce(
    (prev, func) =>
      (...argvs) =>
        prev(func.call(this, ...argvs))
  );
```

## 函数扩展

Todo 这里应该是一个跳转到ES6函数的超链接
