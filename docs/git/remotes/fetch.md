## 同步远端文件到本地

我们知道GIT是一个基于快照的版本控制系统, GIT同步远端的过程其实就是下载远端所有文件快照(所有的`SHA-1`, 除了blob-SHA-1外, 还包括tree-SHA-1和commit-SHA-1)的过程, 即: `.git/refs/objects/`下的文件

同时由于GIT`分支`的概念, 我们并不一定总是下载所有的SHA-1, 有时我们可能只需要某个分支上所有SHA-1

甚至于, 如果你的网络较差, 可以只下载某个分支下的几个SHA-1

::: warning 注意
在fetch`SHA-1`的时候需要提供一个`commit-SHA-1`, 相当于树的头节点, 通过这个节点GIT就可以得到基于其的所有文件内容
:::

```html
              mast
               |
1 -> 2 -> 3 -> 4
     | -> 5 -> 6
               |
              dev
```

上面是一个简略的commit-SHA-1的历史, 2是分支节点

- 我们可以将其全部同步到本地
- 也可以同步某个分支(dev)到本地

  1 -> 2 -> 5 -> 6

- 也可以同步5到本地

  1 -> 2 -> 5

- 甚至于只同步6到本地

  6

这样我们就能得到想到的文件历史

## 管理远端文件的同步

### FETCH_HEAD

这个文件记录了fetch的末端commit-SHA-1, 默认每次fetch 都会对其进行overwrite

同时`FETCH_HEAD`在GIT系统中也是作为关键字存在的

```shell
git merge FETCH_HEAD
# 将fetch的内容merge到当前分支上
```

### refspec

`refspec`是GIT定义的一种引用规范`+<src>:<dict>`, git push 也使用到了这个引用

其中:

`+`表示强制更新

`<src>`表示路径, 即: 发送SHA-1的GIT仓库下的路径

`<dict>`表示磁盘位置, 即: 存储SHA-1的GIT仓库下的磁盘位置

如果指定了`refspec`的话除了将末端SHA-1记录到`FETCH_HEAD`上, 还会根据`<dict>`创建文件并记录SHA-1

::: tip 提示

`<dict>`和`<src>`有缩略表示, 如何缩略请看[refspec](/git/refspec)

`git fetch origin master:dev`, 会被GIT解析为`git fetch origin refs/heads/master:refs/heads/dev`

意思是将远端refs/heads/master(master分支)索引到的SHA-1下载, 并且将末端SHA-1记录到本地refs/heads/dev(如果不存在相当于基于origin/master分支创建了本地dev分支)

:::

::: warning 注意

fetch 和 push 所指的`<dict>`和`<src>` 是相反的

fetch `<src>` -> 远端 `<dict>` -> 本地

push `<src>` -> 本地 `<dict>` -> 远端

---

同时如果`<src>`和`<dict>`一致的话 push可以合写, fetch不可以

`git push origin master` 相当于 `git push origin master:master`

`git fetch origin master` 只是表示下载远端master分支, 并存储到FETCH_HEAD上. 至于是否存储到其他文件, 比如远端分支的镜像上, 则要依据`config.remote.fetch`的配置

---
:::

### config.remote.fetch

执行
```shell
git remote add origin url
```

.git/config会被写入如下配置

```git
[remote "origin"]
  url = url
  fetch = +refs/heads/*:refs/remotes/origin/*
```

如果没有指定`refspec`, `git fetch`会尝试应用这个配置, 除了将`SHA-1`记录到`FETCH_HEAD`外还将所有的远端分支都同步到本地远端的镜像上

如果缺少这条配置

```git
[remote "origin"]
  url = url
#  fetch = +refs/heads/*:refs/remotes/origin/*
```
GIT会将远端的`default branch`(一般是master)下载下来, 然后将`SHA-1`记录到`FETCH_HEAD`上

::: warning 注意

`git fetch origin dev`

像前面提到的一样, 这里的`dev`不是`refspec`

如果配置有`fetch = + refs/heads/*:refs/remotes/origin/*`, 除了同步到`FETCH_HEAD`外, 还会同步到远程的镜像分支上
:::

### refs/remotes/remote_name/*

远程的镜像分支文件

我们是根据这个文件目录, 和分支间的上下游关系才能知道当前分支是`ahead/behind`远程分支

执行`git fetch`会根据`fetch = +refs/heads/*:refs/remotes/origin/*`将镜像更新

### 总结

`git fetch [<repo> [<refspec>]] [options]`

- 指定`refspec`则根据`refspec`下载和记录SHA-1

- `git fetch origin dev`中的`dev`不属于`refspec`

- 在没有指定`refspec`的情况下应用`config.remote.fetch`(一般是默认的refspec, +refs/heads/*:refs/remotes/origin/*)

- 没有`refspec`和`config.remote.fetch`的话只将SHA-1记录到`FETCH_HEAD`

## 一些比较常用的OPTIONS

### --all

有时候我们有多个远程库, `--all`可以一起下载.

相当于

```
git fetch origin
git fetch originDev
```

### --append

前面提到`FETCH_HEAD`随着每次`fetch`都被overwrite, 通过`--append`改变其写入方式

### --depth=depth

最上面我们提到过可以单独下载SHA-1(6)的内容, 而忽略`parent's commit-SHA-1`, 这样就减少了下载的内容

```
git fetch origin master --depth=1
```

只下载最近一次的提交

### --unshalldow

通过`--depth=depth`我们得到了一个不完整的GIT历史, 在`merge`, `rebase`...下会失败

`--unshalldow`是一个fix的方法, 可以重新让GIT变得完整
