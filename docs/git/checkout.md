# CHECKOUT

`checkout`意思是牵出, 涉及到文件变更, 更新索引...操作一般都涉及到`checkout`

`checkout`主要做了以下3个方面的事情

- **更新工作区的文件**
- **单纯切换分支**
- **创建并切换分支**

## 更新工作区的文件

`git checkout <commit-SHA-1 = HEAD> (--) <glob filepath>`

使用`commit-SHA-1`(默认是HEAD索引的`SHA-1`)索引的`glob filepath`的文件快照覆盖当前工作区的`glob filepath`文件

有时需要在`glob filepath`前加入`--`, 这时为了将`glob filepath`和`branchname`做区分

---

举个🌰

可能我们会遇到文件名和分支名重合的情况(release), 这时的`git checkout release`会被GIT理解为切换到`release`分支

而不是将`HEAD`索引的`commit-SHA-1`中的`release快照`覆盖当前`release文件`

所以要用`git checkout -- release`

---

::: warning - 注意

如果我们指定`SHA-1`，其应该是`commit`类型

即:

`git cat-file -t <SHA-1>`

commit

:::

## 切换分支

`git checkout [options] <branchname | commit-SHA-1>`

使用当前命令可以切换到`branchname`分支上, 或者切换到`commit-SHA-1`

实际上它就是更新`HEAD`文件的内容(更新为`refs/heads/branchname`或者`commit-SHA-1`)

如果切换为`commit-SHA-1`, 则会进入`detach HEAD`状态([branch](/git/branch.html)中有提到)

在`detach HEAD`中由于`HEAD`内存储的不是一个`branch`文件, 导致后续提交无法被索引, 相当于丢失

::: tip - 提示

切换分支时, 除了更新`HEAD`外

如果满足以下情况, 也期望将暂存区和工作区的内容带入新分支

- 暂存区/工作区的文件在当前分支和目标分支的最后一次的提交树对象中的`SHA-1`一致, 期望将暂存区和工作区的内容带入新分支

```shell
# 当前分支v1
echo 'a' >> v1
git add .
git checkout -b v2

# v2分支是基于当前v1分支创建的, 所以他们当前最新的提交记录中索引的`v1`的文件快照是一样的
# 这个时候v1的缓存区内容'a' >> v1, 也会被带入v2
# 否则GIT会提示需要提交当前暂存区的文件
```

如果不满足, 可以使用`-m | --merged`由GIT基于合并算法, 对其合并 **可能会有冲突需要fix**

:::

### detach

`git checkout --detach master`会以`master`分支的最后一次提交`SHA-1`进入`detach HEAD`模式

相当于

`git checkout master@{0}`

### merged

`git checkout (-m | --merged) dev1`, 如果暂存区或工作区存在文件变更, 且不能自动带入到`dev1`分支时适情况使用该命令

会将`currentbranch@{0}.commit-object.file`和`targetbranch@{0}.commit-object.file`以及`file`进行3路合并

::: danger - TODO

具体的合并策略, 目前还在学习中

有的文章说是简单的3路合并, 显然是不可能的

待具体阅读`git merge`时补充

:::

## 创建并切换分支

`git checkout [options] newbranch <start-point=HEAD>`

上面的命令会创建并且切换到新的分支, 同👆切换分支的提示内容, 有的时候也会检出当前分支的暂存区和工作区的内容

值得一提的是根据`options`的不同, `newbranch`并不只是一个本地的`branchname`, 有时候也会是一个远程分支的镜像`origin/branchname`(`-t`)

### orphan

这里我很推荐使用`orphan`参数在实际工作中, (看到那些乱七八糟的提交记录是真的烦...)

这个参数可以创建一个干净的`branch`(这里的干净是指没有任何的提交记录), 然后将指定分支的缓存区内容牵出到这个`branch`内

```shell
# master
git checkout --orphan dev1
git add -A
git commit -m '4'

1 -> 2 -> 3(master)
4 -> 5(dev1)
可以发现master和dev1没有公共祖先, 这意味着他们不能相互merge
```

在实际开发需求的时候, 肯定不是一气呵成的! 比如突然插别的需求, 参加需求评审, WC, 下楼放风都会中断开发过程

这个时候我都会将当前工作的代码提交, 这是由于(某次参加需求排期的时候, 同学将我开发了一点的代码删除了, 仅开玩笑也没实际写了多少. 以及该同学某次刚到公司不知道为啥执行了`git checkout .`把昨天晚上开发的内容扔了)所导致, 但是这样会导致提交历史混乱, 尤其当它被`merged`到master时, 污染了master的提交历史

这个时候就需要使用`orphan`参数了

```shell
# JIRA-123, master

git checkout -orphan JIRA-123-orphan # 基于master创建了一个新分支
...                                  # 一些文件变更和提交
git checkout -b JIRA-123 master      # 基于master创建分支
git checkout JIRA-123-orphah@{0} .   # 检出JIRA-123-orphan的最新提交
git add .
git commit -m 'feat(xx): xxxx'       # 完成开发

# 这样JIRA-123是给QA的提测分支, QA将JIRA-123merge到master上, 这样开发过程中那些无意义的提交历史就消失了
# 完成这个效果不一定需要使用orphan, 但是使用orphan有一个好处是 JIRA-123-orphan这个分支是无法合并到master上的
# 这会减少一些误操作
```
### track

`git checkout --track <remote_branch_mirror>`

会创建并切换到一个和远程分支镜像同名的分支, 并建立上下游关系

`git checkout --track origin/dev1` 将`origin/dev1`作为upstream branch创建新分支`dev1`, 并切换

---

如果需要建立不同名字的上下游关系, 需要使用`-b`

`git checkout --track -b dev1 origin/master`

### b | B

`git checkout -b dev1 <start-point=HEAD>`

基于`start-point`创建`dev1`分支, 如果使用`-B`表示强制行为, 如果`dev1`已经存在则会覆盖

### ''

`git checkout branchname`

在前面(`更新文件`, `创建分支`)2个部分, 我们都提到过形同格式的命令, 这里介绍的是它创建且切换分支的功能

`git checkout dev1`会进行如下操作

如果存在`refs/remotes/origin/dev1`GIT会以`origin/dev1`作为upstream branch 创建`dev1`分支并切换


## `git checkout dev1`

这里介绍一些`git checkout dev1`的执行逻辑

1.  如果本地`dev1`分支存在, 那么其会切换到本地`dev1`分支
2.  如果本地`dev1`分支不存在, 但是`refs/remotes/origin/dev1`存在, 其会创建`origin/dev1`的下游分支`dev1`并切换
3.  如果`1`和`2`都满足, 其会将`dev1`理解为文件, 尝试从`HEAD`检出`dev1`的快照覆盖工作区的`dev1`
