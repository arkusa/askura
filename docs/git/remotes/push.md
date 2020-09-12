# git push

[fetch](/git/remotes/fetch)和[pull](/git/remotes/pull)分别介绍了如何从远端拉取和合并文件历史

那如何将本地的文件历史推送给远程呢?

`git push`命令就做了这样的事情

## git push都做了什么

`git push`做了3件事

- **将本地的objects/打包发送给远端**

- **远端更新其objects/refs, 同时更新refs/heads下的索引**

- **远端更新成功后, 跟新本地远端分支的镜像, 不存在则创建**

e.g.

```shell
git push origin master

# 更新object/*
# 更新refs/heads/master文件内存储的`SHA-1`值为本地refs/heads/master的值
```

::: warning 注意

更新索引的过程, GIT期望采用`Fast Forward`的方式

即本地的相应`commit-SHA-1`通过索引`parent chain`能够索引到远端`commit-SHA-1`

一般不要使用`--force`强制其更新`commit-SHA-1`, 这是有害的这会导致提交历史的丢失

:::

下面是我的发布脚本(根据`vuepress`提供的进行写更改)

```shell {6-8,21-23}
#!/usr/bin/env sh

# 确保脚本抛出遇到的错误
set -e

if [ -d "docs/.vuepress/dist/" ];then
  ls -a docs/.vuepress/dist/ | grep -vE '^(\.|\.\.|\.git)$' | xargs rm -rf
fi

# 生成静态文件
npm run build

# 进入生成的文件夹
cd docs/.vuepress/dist

time=$(date "+%Y-%m-%d %H:%M:%S")
msg="docs(${time})"

echo $msg

if [ ! -d ".git/" ];then
  git init
fi

git add -A
git commit -m "${msg}"

git push https://github.com/* master:release

cd -
```

因为在每次`run build`时`vuepress`都会删除`dist/`下的所有内容, 包括git仓库`.git`, 每次发布都丢掉了上次分布的提交信息, 使用`git push -f`来强制更改远程的提交历史

我希望记录下发布历史, 所以做了注释掉了`vuepress`中的`fs.emptyDir(this.outDir)`, 并对`shell`进行了更改, 从而保存了发布历史

## git push的参数

`git push [<repo=origin> [refspec]] [options]`

`git push`分为2种策略

1. **不指定refspec**

不指定**refspec** git基于默认配置进行推送, 详见: [git push的默认行为](/git/remotes/push.html#git-push的默认行为)

默认推送当前分支到其上游分支上, 且

2. **指定refspec**

[fetch](/git/remotes/fetch.html#refspec)内介绍了一些关于`refspec`的内容, 后面会单独有一篇文章介绍`refspec`: todo

只要知道`refspec`是一种引用格式, `+<src>:<dict>`

在push命令中

`<src>`表示本地GIT

`<dict>`表示远端

表示将本地`<src>`索引到的`commit-SHA-1`更新到远端`<dict>`上, 如果`<src>`和`<dict>`命令一致可以缩写

```shell
git push origin master
```

- **这里的master是master:master的缩写**
- **同时master:master又会被GIT展开为refs/heads/master(本地master的最新提交Hash):refs/heads/master(远端记录这个Hash的文件地址)**
- **如果远端refs/heads/master不存在则会被创建**

::: warning 注意 - 这样也是可以的

`git push origin commit-SHA-1:refs/heads/master`

随便找一个`commite-SHA-1`将其推送, 并将其内容写入到远端`refs/heads/master`下
:::

::: danger 警告

`git push origin commit-SHA-1:master`

这样是不可以的, 这是因为GIT无法根据`commit-SHA-1`将`master`推断为`refs/heads/master`

:::

::: tip 这样删除远程分支/创建本地分支

`git push origin :dev_1`

推送一个 空 的SHA-1到dev_1上相当于删除远端`dev_1`分支

`git fetch origin :dev_1`

根据当前分支创建了一个本地`dev_1`分支, 一种hack用法
:::

## git push的默认行为

如果单纯的使用`git push`不添加任何的`refspec`, 则其推送行为收到**push.default**的控制

**push.default**有以下5种可配置的行为

- **nothing**

除非显示的指定`refspec`否则拒绝推送

```shell
git push origin master

git push origin master:master
```

- **current**

推送当前分支到远端的同名分支, 如果不存在则创建

```shell
[push]
  default = current

# 当前分支dev
git push

# 相当于
git push origin dev
```

- **upstream**

推送当前分支到其上游分支上

```shell
[branch "dev_1"]
  remote = origin
  merge = refs/heads/upstream_dev_1

# 当前分支dev_1
git push 

# 等价于
git push origin dev_1:refs/heads/upstream_dev_1
```

- **simple(默认)**

和**upstream**类似, 但是要求上游分支和下游分支的名字必须是一样的, 否则拒绝推送

```shell
[branch "dev_1"]
  remote = origin
  merge = refs/heads/dev_1

# 当前分支dev_1
git push 

# 等价于
git push origin dev_1:refs/heads/dev_1

# 如果是upstream处的🌰 则 push fail
```

- **maching**

推送所有本地和远端都存在的同名分支

```shell
git branch -a
master
dev_1
dev_2
remotes/origin/master
remotes/origin/dev_1
remotes/origin/dev_3

git push
# 只会推送dev_1和master, 交集
```

## 一些常用的options

- **--all**

推送所有本地的分支, 采用**current**行为推送分支

- **--force|-f**

强制推送, 远端提交历史不能`Fast Forward`本地历史时使用

- **--delete|-d**

删除远端分支

```shell
git push -d origin dev

git push origin :dev
```

- **-set-upstream|-u**

建立分支的上下游关系

```shell
git push -u origin master

# 下次可以直接

git push
```
