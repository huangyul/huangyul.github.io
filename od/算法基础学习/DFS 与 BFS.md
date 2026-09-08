
# DFS

## 核心心智模型：DFS 与回溯的区别

- **DFS（深度优先搜索）** 是一种**执行手段 / 搜索策略**：依靠递归调用栈（LIFO），沿着一条路径一直钻到底，到底之后再退回上一层。
    
- **回溯（Backtracking）** 是一种**算法思想 / 解决策略**：在 DFS 的骨架下，动态构建“解空间决策树”，通过“做选择 $\rightarrow$ 递归深入 $\rightarrow$ 撤销选择（恢复现场）”来遍历或穷举所有的可能解。
    

> **一句话判别**：
> 
> - **纯 DFS**：状态单向流动（参数向下传、返回值向上报），函数返回后**不需要手动清理现场**。
>     
> - **回溯法**：多条分支共用全局变量，递归深入后**必须有对称的“撤销操作”**（如 `pop` 切片、`used = false`）。
>     

## 纯 DFS（树形/分治）万能 4 步模板

当题目要求求解树的某种全局属性（如深度、节点和、是否相同、翻转）时，**不考虑整棵树的规模，只把自己当成树中的普通节点**：

Go

```
func dfs(root *TreeNode) 目标返回类型 {
    // 1. 【基准条件 / 撞墙退出】：到底了（nil）该返回什么？
    if root == nil {
        return 空节点的默认值
    }

    // 2. 【当前层检查 / 异常前置】：当前节点是否非法？能否提前返回？
    // (例如：值不匹配、越界等，若无需检查可跳过)

    // 3. 【深入递归 / 分解子问题】：向左右子节点要各自的解
    leftResult := dfs(root.Left)
    rightResult := dfs(root.Right)

    // 4. 【整合结果 / 汇报上层】：汇总左右子节点结果 + 自身贡献，return 出去
    return 整合(leftResult, rightResult, root)
}
```

### 经典题型套用对照

|**题目**|**1. 到底了 (nil)**|**2. 当前层检查**|**3. 左右深入**|**4. 整合返回**|
|---|---|---|---|---|
|**二叉树最大深度**|`return 0`|无|`l := dfs(root.Left)`<br><br>  <br><br>`r := dfs(root.Right)`|`return max(l, r) + 1`|
|**相同二叉树**|`p == nil && q == nil`<br><br>  <br><br>$\rightarrow$ `return true`|`p == nil \| q == nil`<br><br>  <br><br>`p.Val != q.Val`<br><br>  <br><br>$>$\rightarr$ `return false`|`l := dfs(p.Left, q.Left)`<br><br>  <br><br>`r := dfs(p.Right, q.Right)`|`return l && r`|
|**翻转二叉树**|`return nil`|无|`l := dfs(root.Left)`<br><br>  <br><br>`r := dfs(root.Right)`|`root.Left = r`<br><br>  <br><br>`root.Right = l`<br><br>  <br><br>`return root`|
|**二叉树节点值之和**|`return 0`|无|`l := dfs(root.Left)`<br><br>  <br><br>`r := dfs(root.Right)`|`return l + r + root.Val`|

## 回溯法标准模板与避坑要点

回溯法解决的是“排列、组合、子集、棋盘搜索”等穷举决策问题。

### 回溯代码骨架

Go

```
func backtrack(候选列表, 当前状态) {
    if 触发收集条件 / 终止条件 {
        收集结果（注意 Slice 需要深拷贝 copy）
        return
    }

    for 遍历当前所有可能候选 {
        // 1. 剪枝 (Pruning)
        if 当前候选不合法 / 已经使用过 {
            continue
        }

        // 2. 做出选择
        path = append(path, 候选)
        used[i] = true

        // 3. 深入下一层 (DFS)
        backtrack(更新状态)

        // 4. 撤销选择 (恢复现场)
        used[i] = false
        path = path[:len(path)-1]
    }
}
```

## 易错警示：排列 vs 组合 / 子集

写回溯题最常见的逻辑混淆：

### 排列问题（顺序相关，如 `[1, 2]` 与 `[2, 1]` 都算有效解）

- 每次挑牌都要看**整个数组**，依靠 `used` 数组防止同一张牌重复进路径。
    
- 循环起点：`for i := 0; i < len(nums); i++`
    
- 深入调用：`dfs()`
    

### 组合 / 子集问题（顺序无关，`[1, 2]` 与 `[2, 1]` 算同一种）

- 选了后面的数字后，**不能回头选前面的数字**，需要维护一个下限游标 `startIndex`。
    
- 循环起点：`for i := startIndex; i < len(nums); i++`
    
- 深入调用：`dfs(i + 1)`
    

## 常见认知误区

1. **“DFS 一定要学了图论才能用”**
    
    - **错**。二叉树前中后序遍历、迷宫走格子、全排列决策树全是纯正的 DFS。图只是给 DFS 加了一个“带环检测（防止无限打转）”的应用场景。
        
2. **“树形递归不是 DFS”**
    
    - **错**。递归系统栈的调用行为本身就是深度优先。
        
3. **“Go 切片收集结果时直接 `append(res, path)`”**
    
    - **错**。切片底层共用数组，后续的“恢复现场”会篡改已收集的结果，必须 `make` 对应长度的临时切片并执行 `copy`。