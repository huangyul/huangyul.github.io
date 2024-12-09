# Git Rebase 操作教程：将多个提交合并为一个提交

## 场景描述

假设你在 `feature-branch` 上开发一个功能，已经提交了 5 次代码。你希望将这 5 次提交合并为一个提交，并将其合并到 `main` 分支上，以便保持提交历史的清晰和提交责任的归属。

---

## 步骤 1：创建一个模拟的 Git 仓库


如果你已经有项目，可以跳过这一步。

```bash
# 初始化一个新的 Git 仓库
git init demo-repos
cd demo-repo
```

## 步骤 2：创建 main 分支的初始提交

```bash
echo "Main branch initial commit" > README.md
git add README.md
git commit -m "Initial commit on main"
```

## 步骤 3：创建并切换到 feature-branch

```bash
git checkout -b feature-branch
```

## 步骤 4：模拟在 feature-branch 上做 5 次提交

在这一步，模拟在 5 天内完成的工作，每天做一次提交。

```bash
echo "Feature day 1" > feature.txt
git add feature.txt
git commit -m "Add feature day 1"

echo "Feature day 2" >> feature.txt
git add feature.txt
git commit -m "Add feature day 2"

echo "Feature day 3" >> feature.txt
git add feature.txt
git commit -m "Add feature day 3"

echo "Feature day 4" >> feature.txt
git add feature.txt
git commit -m "Add feature day 4"

echo "Feature day 5" >> feature.txt
git add feature.txt
git commit -m "Add feature day 5"
```

## 步骤 5：查看提交历史

使用 `git log` 查看 `feature-branch` 上的提交历史。

```bash
git log --oneline
```
你应该看到类似下面的输出：
```bash
abcdef5 Add feature day 5
abcdef4 Add feature day 4
abcdef3 Add feature day 3
abcdef2 Add feature day 2
abcdef1 Add feature day 1
```

## 步骤 6：执行交互式 `rebase`

### 1. 执行 rebase 命令，选择最近的 5 次提交：
   
```bash
git rebase -i HEAD~5s
```

### 2.修改提交策略：
将第二个到最后一个 pick 都改为 squash（或者简写 s），将所有提交合并为第一个提交：

```bash
pick abcdef1 Add feature day 1
squash abcdef2 Add feature day 2
squash abcdef3 Add feature day 3
squash abcdef4 Add feature day 4
squash abcdef5 Add feature day 5
```

### 3.保存并退出编辑器：
- 对于 `Vim`：按 `Esc`，输入 `:wq`，然后按回车。
- 对于 `Nano`：按 `Ctrl + X`，然后按 `Y` 保存。

## 步骤 7：编辑新的提交信息
Git 会提示你编辑新的提交信息。你可以选择保留原来的描述，或者写一个新的描述。
