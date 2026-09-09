
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


# BFS

**BFS（Breadth-First Search，广度优先搜索）** 是一种用于图或树结构中逐层遍历或搜索节点的算法。

它的核心思维是“按层推进”：从起点开始，先访问它的所有直接邻居（第一层），再依次访问邻居的邻居（第二层），以此类推，就像往平静的水面扔进一颗石子，水波从中心一层层向外扩展一样。

### 一、 BFS 与 DFS 的核心对比

|**特性**|**BFS（广度优先搜索）**|**DFS（深度优先搜索）**|
|---|---|---|
|**搜索策略**|齐头并进，逐层向外扩展|选定一条路走到底，撞墙后再回溯|
|**核心数据结构**|**队列（Queue，先进先出 FIFO）**|**栈（Stack，先进后出 FILO）** 或函数递归|
|**空间复杂度**|较高（需要存下一整层的所有节点）|较低（只需存从根到当前节点的路径）|
|**适用场景**|**寻找无权图中的最短路径 / 最少步数**|**路径探索、全排列、回溯、连通块判断**|
|**形象比喻**|水波扩散、雷达扫射|走迷宫（不撞南墙不回头）|

### 二、 BFS 的核心原理解析

要实现 BFS，必须依靠两个核心组件：

1. **队列（Queue）**：保存待访问的节点，保证“先发现的节点先被扩展”。
    
2. **访问记录（Visited 集合）**：标记已访问过的节点，防止因为图中有环而陷入死循环。
    

#### 算法通用步骤：

1. 将**起点**放入队列，并标记为已访问。
    
2. 当队列不为空时，循环执行以下操作：
    
    - 从队列头部弹出一个节点 `u`。
        
    - 处理节点 `u`（如判断是否为目标节点）。
        
    - 遍历 `u` 的所有邻接节点 `v`：
        
        - 如果 `v` 还没被访问过，将其标记为已访问，并**压入队列尾部**。


示例代码：

```go
package main

import "fmt"

type TreeNode struct {
	Val   int
	Left  *TreeNode
	Right *TreeNode
}

// LevelOrder 基础广度优先遍历
func LevelOrder(tree *TreeNode) {
	// 1. 边界检查：空树直接返回，防止 node.Val 报 nil panic
	if tree == nil {
		return
	}

	// 2. 初始化队列，将根节点放入队列
	queue := []*TreeNode{tree}
	fmt.Println("开始遍历二叉树")

	// 3. 队列非空时持续处理
	for len(queue) > 0 {
		// 弹出队头元素
		node := queue[0]
		queue = queue[1:]

		fmt.Println("当前节点：", node.Val)

		// 左右子节点非空则依次追加进队尾
		if node.Left != nil {
			queue = append(queue, node.Left)
		}
		if node.Right != nil {
			queue = append(queue, node.Right)
		}
	}
}

// LevelOrderGrouped 如果需要按“层”返回结果（例如 LeetCode 102 题）
func LevelOrderGrouped(root *TreeNode) [][]int {
	if root == nil {
		return nil
	}

	var result [][]int
	queue := []*TreeNode{root}

	for len(queue) > 0 {
		levelSize := len(queue) // 记录当前这一层一共有多少个节点
		currentLevel := make([]int, 0, levelSize)

		// 一次性只处理当前层的所有节点
		for i := 0; i < levelSize; i++ {
			node := queue[0]
			queue = queue[1:]
			currentLevel = append(currentLevel, node.Val)

			if node.Left != nil {
				queue = append(queue, node.Left)
			}
			if node.Right != nil {
				queue = append(queue, node.Right)
			}
		}
		result = append(result, currentLevel)
	}

	return result
}
```