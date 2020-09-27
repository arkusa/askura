# credential.helper=osxkeychain

是这样的, 我有几个github账户, 有一天我将其中一个`A`的账户和密码存储到了`mac os`的钥匙串中

但是这样就造成了一个问题

每次我用`https`向远端推送代码的时候, 都会弹出一个访问钥匙串内存储`github`信息的弹窗

如果我正好推送的是`A`还好, 如果是`B github`的话就进入了循环

并且即使在`credential.helper=cache`的有效期内还是一直弹 弹 弹

很难受, 所以我要找到这个配置干掉它

```shell
git config --show-origin --get-all credential.helper

--show-origin 可以找到对应的配置的文件路径
--get-all 因为我有几个credential.helper的配置, 这个命令能找到所有的

找到credential.helper=osxkeychain对应的文件
/Library/Developer/CommandLineTools/usr/share/git-core/gitconfig

罪魁祸首果然是xcode安装的command helper

注释掉相应的配置
```

舒服😌 umm.....

## @date 2020/09/28

最近使用tmux保持工作现场, 发现这个问题在tmux下又出现了

还是通过`git config --show-origin --get-all credential.helper`查看配置所处的文件

```shell
git config --show-origin --get-all credential.helper

file: /Applications/Xcode.app/Contents/Developer/usr/share/git-core/gitconfig      credential.helper=osxkenchain

# 注释掉对应的配置
```
