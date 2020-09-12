# git pull 

在[fetch]('/git/remotes/fetch')中, 讲了GIT是如何将远端文件历史同步到本地, 但大部分情况下我们除了同步远端文件历史外, 还希望其和当前分支合并

`git pull`是一个这样的命令, 是`git fetch` + `git merge`的复合命令

---

## pull的参数

`git pull [<repo> [refspec | branch_name]] [options]`

参数中 `<repo>`, `<refspec>`, `<branch_name>`作用于`git fetch`

`<options>`则是`git merge`和`git fetch`的optins的并集

## pull合并的2种策略

git pull 基于提供的参数的不同有2种合并策略

- **merge FETCH_HEAD**

指定了`refspec`或`branch_name`, git 在将各种`SHA-1`文件下载下来后, 会讲`FETCH_HEAD`内记录的`commiet-SHA-1`合并进当前分支

::: tip 提示

`FETCH_HEAD`会记录当前fetch分支的末端commit-SHA-1

:::

```shell
git pull origin dev
# 当前分支是master, 下载dev的代码, 然后合并进本地master分支

# 等价于

git fetch origin dev
git merge FETCH_HEAD
```

因为采用这种参数只会下载远端一个分支的`SHA-1`文件, 即`FETCH_HEAD`内只有一条记录, 所以能直接将其合并

::: warning 注意

有的时候`FETCH_HEAD`内不会只有一条记录, 这个时候`git merge FETCH_HEAD`会尝试将所有的记录都合并进当前的分支内

`git fetch origin dev_1`

FETCH_HEAD内记录了一条dev_1索引的`SHA-1`

`git pull origin dev_2 --append`

FETCH_HEAD内追加了一条dev_2索引的`SHA-1`

merge FETCH_HEAD就是将当前分支, dev_1, dev_2三者进行合并

`--append`指定FETCH_HEAD写入方式变为追加

:::

- **merge upstream branch**

如果不指定`refspec`或`branch_name`, git 在将各种`SHA-1`文件下载下来后, 会尝试将当前分支所对应的`upstream branch`合并进当前分支

```shell
git pull 

# 等价于下面

git fetch  # 下载object/refs/*

git merge refs/remotes/origin/<current_upstream_branch>
```

这是因为在默认的情况下(`+refs/heads/*:refs/remotes/heads/*`) `FETCH_HEAD(.git/FETCH_HEAD)`内有远端全部分支末端`commit-SHA-1`, 不可能都将他们合并进当前分支, 所以GIT采用了`merge upstream branch`的策略

## --rebase

我们知道git有2种合并分支的策略

- **merge**

完整的提交历史

- **rebase**

流水线式的提交历史

区别就在于`rebase`对提交历史做了更改, 增加其可读性

`git pull`默认使用`merge`合并代码, 但是可以通过`--rebase`让其采用`git rebase`
