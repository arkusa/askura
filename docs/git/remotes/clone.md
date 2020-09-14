# git clone

如果本地GIT仓库不存在, 只有远程GIT仓库, 使用`git clone`命令将远程仓库下载到本地

## 命令介绍

`git clone repo-url [local_dir] [options]`

`git clone`会将远程`repo-url`链接到的GIT仓库下载到本地`local_dir`路径下

如果本地不能存在`local_dir`文件夹, 则创建

如果不指定`local_dir`, 相当于在当前`pwd`下远端仓库的同名

## 一些常用到的options

### n | no-checkout

只下载`.git`, 不将当前分支的最新提交内容牵出到工作区

```shell
ls -a
# . .. .git 只有他们

```
### o | origin name

给远端GIT仓库命名, 不指定的话是`origin`

```shell
git clone https://github.com/xxx/xxx.git --origin dev1

git remote

dev1
```

### b | branch branch_name

默认情况下, GIT会在本地仓库内容下载完后, 创建一个远端master分支的下游分支`master`作为本地存在的唯一分支

即: 

```
HEAD = refs/heads/master

[branch "master"]
  remote origin
  merge refs/heads/master
```

这个`options`会用我们指定的`远端分支`来代替master

```shell
git clone https://github.com/xxx/xxx.git --branch dev1

HEAD = refs/heads/dev1

[branch "dev1"]
  remote origin
  merge refs/heads/dev1
```

::: warning - 注意

这个`<branch_name>`要是远程仓库存在的分支
:::

### single-branch branch_name

默认`git clone`会下载`.git/`下的所有内容

`single-branch`会下载`<branch_name>`分支的那些`blob objects`, `tree objects`和`commit objects`, 不会下载其他分支的内容

```shell
git clone git@github.com:thalo1212/node.git -b v3
Cloning into 'node'...
remote: Enumerating objects: 170, done.
remote: Counting objects: 100% (170/170), done.
remote: Compressing objects: 100% (75/75), done.
remote: Total 170 (delta 18), reused 165 (delta 13), pack-reused 0
Receiving objects: 100% (170/170), 11.95 KiB | 29.00 KiB/s, done.
Resolving deltas: 100% (18/18), done.

remote: Enumerating objects: 170, done. 注意这里下载了170个objects

git clone git@github.com:thalo1212/node.git -b v3 --single-branch
Cloning into 'node'...
remote: Enumerating objects: 56, done.
remote: Counting objects: 100% (56/56), done.
remote: Compressing objects: 100% (25/25), done.
remote: Total 56 (delta 6), reused 54 (delta 4), pack-reused 0
Receiving objects: 100% (56/56), done.
Resolving deltas: 100% (6/6), done.

remote: Enumerating objects: 170, done. 注意这里就只下载了56个objects
```

### depth=depth

根据`<depth>`指定的数字, 获取最近的几个提交记录, 获得的GIT库并不是完整的

::: warning - 注意

`depth=<depth>`是在`single-branch`的基础上选择提交记录下载

即 它只会下载指定分支的几个最新提交, 不会下载未指定的分支
:::

```shell
git clone https://github.com/xxx/xxx.git depth=2

假如远程xxx库是有3个提交记录
1 -> 2 -> 3(master)
  -> 4(dev)

指定depth=2
只会下载2 -> 3的提交记录
和1, 4相关的blob object tree object 都不会被下载
```
