# branch

`branch`是GIT多人合作并行开发的基础, 它就像是车间的一条条工作流, 每个人可以完成相应的工作, 最后在整合

但是对于GIT逻辑而言, `branch`只是对`commit-SHA-1`的一种特殊索引, **特殊在这个索引会随着每次提交自动更新**, 就形成了我们理解的`workflow`

举个🌰 :

(我们知道`branch`其实对应了`refs/heads/`下的文件)

```shell
# master
# current commit-sha-1=1
git add .
git commit -m 'initial'
```

`commit`时GIT通过`HEAD`索引到当前的分支`refs/heads/master`, `refs/heads/master`索引了当前的提交记录`1`

GIT将当前的提交记录`1`, 作为本次提交的`parent`属性, 同时根据文件内容生成其他`tree-object`... 这样一个完整的提交就形成了`2`

同时GIT会尝试更新`refs/heads/master`内的内容为这次的提交`2`, 这样`refs/heads/master`内记录了最新提交, 然后递归`parent`就能够得到完整的`workflow`

---

**有一种情况下, GIT会通过HEAD直接索引到当前的提交记录**, 这就是分离头指针状态`detach HEAD`

在`detach HEAD`下后面的提交无法被GIT`索引`, 相当于丢失, 导致`detach HEAD`的根本原因在于

`HEAD` -> `commit-SHA-1`, 而非

`HEAD` -> `refs/heads/branch_name` -> `commit-SHA-1`

这样GIT不会知道要将本次的提交记录在哪里

举个🌰 :

```shell
# master 1 -> 2 -> 3

git checkout 1
# 此时进入了detach HEAD, HEAD内记录了1, 而不是refs/heads/master

git add .
git commit -m '4'
# 这时由于HEAD内不是一个分支索引我们的提交历史变成了这样
# 1 -> 2 -> 3(master)
#   -> 4(没有索引)
```

::: warning - 注意

在`detach HEAD`状态下的提交只是丢失了索引, 而不是丢失了文件快照

你可以通过一些你能想到的其他方法找回

比如, 如果你没有切换分支的话, 可以通过`git log`找到最新的`SHA-1`, 然后基于其创建一个分支

如果你切换了分支的话, 你可能需要遍历`refs/objects`下的所有`SHA-1`, 然后通过`git cat-file`命令找到提交对象, 在通过其他属性来找到刚刚的提交对象了

当然, `detach HEAD`是一种相当危险的操作, GIT在进入`detach HEAD`和离开`detach HEAD`的时候会有相关提示, 注意GIT提示能帮助我们减少风险操作

:::

## 如何创建一个branch

### 手动创建

我们知道`branch`其实只是`refs/heads/`下的一个记录`SHA-1`的文件

```shell
git log -1 --pretty=format:"%H" > .git/refs/heads/xxx

# 新建了一个xxx分支

git branch | grep xxx
```

### git command

- `git branch [--track | --no-track(default)] <branch_name> <start-point=HEAD>`

满足上面格式的`git branch`命令则会创建一个`branch`

其中`<start-point=HEAD>`是一个`commit-SHA-1`或者是可以索引到`commit-SHA-1`关键字, 表示以`start-point`为参照创建一个分支, 默认是HEAD

```shell
git branch dev1 master

# 以master分支为参照创建dev1分支
# cp -f ./git/refs/heads/master ./git/refs/heads/dev1
```
---

其中`--track`表示以`<start-point>`为上游分支创建分支, 此时`start-point`必须是一个远端分支在本地的镜像(可以是别名)

```shell
git branch --track dev1 origin/dev1(refs/remotes/origin/dev1)

git branch -vv | grep dev1
# dev1   807c693 [origin/dev1] add

并且会增加如下配置.git/config
[branch "dev1"]
  remote = origin
  merge = refs/heads/dev1
```

- `git checkout [--track | --no-track(default)] -b <branch_name> <start-point=HEAD>`

这个命令是`git branch [--track | --no-track(default)] <branch_name> <start-point=HEAD>`和`git checkout <branch_name>`的复写

创建分支然后切换分支

但是其有一种特殊的逻辑

--- 

如果没有指定`start-point`并且存在和`branch_name`一样名字的远程分支的镜像 即: `refs/remotes/origin/branch_name`存在

它会以远程`branch_name`分支为上游分支创建本地`branch_name`分支

即: 

`git checkout -b branch_name`

- 如果`refs/remotes/origin/branch_name`存在, 则是`git branch --track branch_name origin/branch_name`的另外一种写法

- 如果`refs/remotes/origin/branch_name`不存在, 则是`git branch (--no-track) branch_name (HEAD)`的另外一种写法

--- 

- `git branch [-c | -C] <old_branch> <new_branch>`

严格意义来说它不是一个创建分支的命令, 他是`copy`了一个分支

`-C`表示强制`copy` 意味着`new_branch`已经存在

## branch的upstream/downstream关系

分支的上下游关系在使用`git push`命令的时候起作用, `git push`的默认行为是`simple`其要求当前分支要存在上游分支, 且上游分支和当前分支的名字应该一致

- `git branch [--set-upstream-to=<origin_branch> | -u <origin_branch>] <branch_name=HEAD>`

给`branch_name`建立上游分支`<origin_branch>`, 如果不指定`branch_name`则是当前分支

::: warning - 注意

`branch_name` 需 已经被创建

它和`--track`的区别在于

`--track`是创建一个有上游分支的本地分支

`-u`是给当前存在的本地分支建立上游关系

:::

我们也可以在推送的时候建立上游关系

`git push (-u | --set-upstream) origin branch_name`

将本地branch_name和远程branch_name分支建立上下游关系

--- 

- `git branch [--unset-upstream] <branch_name=HEAD>`

给`branch_name`取消上游分支, 不指定则是当前分支

```shell
git branch --set-upstream-to=origin/master dev1
# 给dev1建立上游分支master
git branch --unset-upstream dev1
# 取消dev1的上游分支
```

## 给分支重命名

`git branch [-m | -M] <old_branch> <new_branch>`

`-M`表示强制重命名, 即存在和`new_branch`同名的分支, 覆盖则会发生提交记录的索引丢失

## 查看分支

### 查看远程分支

`git branch -r`可以查看本地的所有远程分支的镜像, 同时其指明了远程HEAD所记录的分支

### 查看本地分支

`git branch [--list]`, 查看本地分支, 当前分支会用`*`标注

### 查看本地分支的最后提交

`git branch -v`, 可以查看本地分支的最后一次提交信息, 以及和远程镜像分支的对比

```shell
git branch -v

master                   807c693 add
master1                  807c693 [ahead 5, behind 2] add
master_1                 7f3c1a9 add
```

### 查看本地分支的upstream关系

`git branch -vv`, 在`git branch -v`的基础上还标注了分支的上游分支

```shell
git branch -vv

master1                  807c693 [origin/master_2: ahead 5, behind 2] add
master_1                 7f3c1a9 add
master_2                 f99f3b8 add  
```

另外一种查看方法是看`config`文件的branch配置

### 查看合并/未合并的分支

`git branch (--merged=SHA-1(HEAD) | --merged SHA-1(HEAD))`

查看已经合并到`SHA-1(HEAD)`上的分支

`SHA-1(HEAD)`可以是一个具体的`SHA-1`也可以是能够索引到`SHA-1`的关键字, 不指定是`HEAD`

其逻辑就是递归`SHA-1(HEAD)`的`parent`属性, 看这条`parent chain`上有那些分支索引的最新提交

`git branch (--no-merged=SHA-1(HEAD) | --no-merged SHA-1(HEAD))`

查看未合并到`SHA-1(HEAD)`上的分支

### 删除分支

- `删除远程分支的镜像`

`git branch -d -r origin/<branch_name>`

会删除`refs/remotes/origin/branch_name`

::: warning - 注意

`git branch -d -r refs/remotes/origin/branch_name` 不能删除镜像

这让我很困惑

因为`origin/branch_name`实际上是`refs/remotes/origin/branch_name`的缩写

但是这里就是只能用缩写 😢

:::

- `删除本地分支`

`git branch (-d | -D) <not_current_branch_name>`

删除非当前分支的本地分支

`-D`表示强制删除, 如果待删除的分支没有合并到当前分支上需要指定

```shell
# master
git checkout -b dev_1
echo 1 > 1
git add .
git commit -m '1'
git checkout master
git branch -d dev1
# error dev1还未合并到当前分支
git branch -D dev1
# success
```
检测是否合并的逻辑就是递归`commit-SHA-1`的`parent chain`看是否存在`refs/heads/dev1`索引的`commit-SHA-1`
