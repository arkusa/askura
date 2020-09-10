#!/usr/bin/env sh

# 确保脚本抛出遇到的错误
set -e

if (-d "docs/.vuepress/dist/");then
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
git commit -m $msg

git push git@github.com:askura/weblog.git master:release

cd -
