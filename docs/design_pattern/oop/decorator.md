# Decorator

> 动态地给一个对象添加一些额外的职责, 就增加功能来讲, 装饰模式相比生成子类更为灵活 ——《设计模式之禅》

可以理解为是**多继承**的一种替代实现

在**OOP**中, 继承最基本的逻辑复用方式, 但往往事情并不那么简单, 比如

我们有一个`Grandpa`的基类

```javascript
class Grandpa {
  constructor({
    age,
    name,
  }) {
    this.age = age;
    this.name = name; 
  }

  eat() {
    console.log('eat');
  }
}
```

这时候我们想有一些特殊的`Grandpa`的子类, 比如: 喜欢运动的, 戴眼镜的... 我们可以

```javascript
class SportGrandpa extends Grandpa {}

class GlassGrandpa extends Grandpa {}
```

在创建`SportGrandp`, `GlassGrandpa`这2个子类, 但是这些**属性/方法**并不是每一个`Grandpa`的派生类都具有的, 所以我们会组合**这些属性/方法**, 创造出特别多的子类(`GlassAndSportGrandpa`), 这会导致类爆照💥,显然对于维护这些**乱七八糟**的类是一个让人头痛的问题

(**一般在继承超过2层的时候, 我们就需要重新考量系统的设计**)

**Decorator Pattern**是为了帮助**OOP**解决这样的问题, 我们可以生命一个`Decorator`来继承`Grandpa`

```javascript
class Decorator extends Grandpa {
  constructor({
    instance,
  }) {
    super();
    this.instance = instance; 
  }

  // override
  eat() {
    this.instance.eat();
  }
}
```

然后分别实现`GlassGrandpa`和`SportGrandpa`

```javascript
class GlassGrandpa extends Decorator {
  glass() {
    console.log('glass');
  }
}

class SportGrandpa extends Decorator {
  sport() {
    console.log('sport');
  }
}
```

之后我们在使用的时候就可以

```javascript
grandpa = new SportGranpa(new GlassGranpa(new Grandpa()));
granpa.eat();
granpa.sport();
granpa.glass();
```
