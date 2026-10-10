
# 理论知识

BFS 和 DFS 就是两种截然不同的探险策略：

- **DFS（深度优先搜索，Depth-First Search）——“撞南墙”策略**：选定一条道走到黑，直到无路可走（撞了南墙），再退回一步换条路继续走。就像走迷宫，手扶着右侧墙壁一路往里钻。
    
- **BFS（广度优先搜索，Breadth-First Search）——“水波荡漾”策略**：像往水里扔石子，水波一层一层向外扩散。先看眼前能走的所有一步，再看所有两步能到的地方，逐层铺开。
    

# 核心机制对比

|**维度**|**DFS (深度优先)**|**BFS (广度优先)**|
|---|---|---|
|**形象比喻**|顺藤摸瓜、钻牛角尖|水波涟漪、地毯式搜查|
|**底层数据结构**|**栈（Stack）** / 递归调用栈|**队列（Queue）**（先进先出 FIFO）|
|**适用场景**|路径查找、全排列、连通块染色、回溯|**无权图的最短路径**、层序遍历、最少步数|
|**空间复杂度特点**|取决于树高/递归深度 $O(h)$|取决于最宽的一层节点数 $O(w)$|

# 经典例题

### LeetCode 200. 岛屿数量

**问题情境**：给你一个由 `'1'`（陆地）和 `'0'`（水）组成的二维网格，计算岛屿数量（水平或垂直相连的陆地算同一座岛）。

**通俗解法（沉岛战术）**：

遍历网格，一旦碰见一块陆地 `'1'`，说明找到了新岛屿，计数加 1。然后派一名工兵用 **DFS** 把这整座岛的相连陆地全部炸沉（变成 `'0'`），防止后续重复计数。DFS 会沿着上下左右一直“钻”到底。


```Go
package main

func numIslands(grid [][]byte) int {
	if len(grid) == 0 {
		return 0
	}
	count := 0

	for r := 0; r < len(grid); r++ {
		for c := 0; c < len(grid[0]); c++ {
			if grid[r][c] == '1' {
				count++
				dfs(grid, r, c) // 钻进去，把相连的陆地全部沉掉
			}
		}
	}
	return count
}

func dfs(grid [][]byte, r, c int) {
	// 越界或者遇到水，即“撞南墙”，直接回头
	if r < 0 || r >= len(grid) || c < 0 || c >= len(grid[0]) || grid[r][c] == '0' {
		return
	}

	// 标记为已访问（沉岛）
	grid[r][c] = '0'

	// 向四个方向继续钻
	dfs(grid, r+1, c) // 下
	dfs(grid, r-1, c) // 上
	dfs(grid, r, c+1) // 右
	dfs(grid, r, c-1) // 左
}
```

###  LeetCode 102. 二叉树的层序遍历

**问题情境**：按层从上到下、从左到右返回二叉树所有节点的值。

**通俗解法（排队报数）**：

用一个**队列（Queue）**。根节点先进队；每次处理一层时，先看当前队列里有几个人（`size`），然后把这批人依次请出来记下值，同时把他们各自的孩子请进队伍末尾排下一层。


```Go
package main

type TreeNode struct {
	Val   int
	Left  *TreeNode
	Right *TreeNode
}

func levelOrder(root *TreeNode) [][]int {
	var result [][]int
	if root == nil {
		return result
	}

	// 用切片模拟队列
	queue := []*TreeNode{root}

	for len(queue) > 0 {
		levelSize := len(queue) // 当前层的节点总数
		currentLevel := make([]int, 0, levelSize)

		// 严格把当前层这一波人全部处理完
		for i := 0; i < levelSize; i++ {
			node := queue[0]
			queue = queue[1:] // 出队

			currentLevel = append(currentLevel, node.Val)

			// 子节点排入下一层队列
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


###  LeetCode 104. 二叉树的最大深度 (Maximum Depth of Binary Tree)

**📋 题目描述**

给定一个二叉树的根节点 `root`，返回其最大深度。

二叉树的最大深度是指从根节点到最远叶子节点的最长路径上的节点数。

**示例**

- 输入: `root = [3,9,20,null,null,15,7]`
    
- 输出: `3`
    
- 解释: 最长路径为 `3 -> 20 -> 15` 或 `3 -> 20 -> 7`，共 3 个节点。
    

**重要约束 & 边界条件**

- 节点总数在 $[0, 10^4]$ 范围内。
    
- 节点值在 $[-100, 100]$ 之间。
    
- **边界情况**：`root == nil` 时，树为空，最大深度为 `0`。
    

**核心思想 & 突破口**

- **核心思想**：DFS（深度优先搜索）/ 分治法（Divide and Conquer）。
    
- **突破口**：
    
    - 一棵树的最大深度，本质上取决于左右子树中较深的那一个。
        
    - 状态转移关系：`maxDepth(root) = max(maxDepth(root.Left), maxDepth(root.Right)) + 1`。
        
    - 递归基（终止条件）：当遍历到空节点 `nil` 时，深度贡献为 `0`。
        
- **逻辑推导与写法对比**：
    
    - **自顶向下（携带深度向下传递）**：即你最初写的闭包传参法，通过参数累加计数。
        
    - **自底向上（分治回传）**：子节点向父节点交出答案，代码最凝练，单行完成递归归并。
        

**复杂度分析**

- 时间复杂度: $\mathcal{O}(N)$，其中 $N$ 为二叉树的节点数，每个节点恰好被访问一次。
    
- 空间复杂度: $\mathcal{O}(H)$，其中 $H$ 为树的高度（最好情况下平衡树为 $\mathcal{O}(\log N)$，最坏退化为链表时为 $\mathcal{O}(N)$），即递归调用栈占用的内存。
    

**核心代码 (Go)**

Go

```
package main

type TreeNode struct {
	Val   int
	Left  *TreeNode
	Right *TreeNode
}

// maxDepth 自底向上 DFS
func maxDepth(root *TreeNode) int {
	if root == nil {
		return 0
	}
	// 递归求出左右子树最大深度，取较大值加 1（当前节点本身）
	return max(maxDepth(root.Left), maxDepth(root.Right)) + 1
}
```

###  LeetCode 111. 二叉树的最小深度 (Minimum Depth of Binary Tree)

**📋 题目描述**

给定一个二叉树，找出其最小深度。

最小深度是指从根节点到最近**叶子节点**的最短路径上的节点数。

_注意：叶子节点是指左右两个子节点都为空的节点。_

**示例**

- 输入: `root = [3,9,20,null,null,15,7]`
    
- 输出: `2`
    
- 解释: 节点 `9` 是叶子节点，路径 `3 -> 9` 长度为 2，是最短路径。
    

**重要约束 & 边界条件**

- 节点总数在 $[0, 10^5]$ 范围内。
    
- **易错边界（单支树陷阱）**：如果根节点只有右孩子没有左孩子（如 `1 -> 2`），根节点并不是叶子节点，最小深度必须算到叶子节点，因此深度为 `2` 而不是 `1`。
    
- **空树边界**：`root == nil` 时直接返回 `0`。
    

**核心思想 & 突破口**

- **核心思想**：BFS（广度优先搜索 / 水波荡漾策略）。
    
- **突破口**：
    
    - BFS 按层向外遍历。由于所有边权均为 1，**第一次在某一层遇到的叶子节点，必然对应全局最短路径**。
        
    - 命中第一个 `node.Left == nil && node.Right == nil` 的节点时直接 `return deep`，提前终止（Short-circuit），无需遍历整棵树。
        
- **逻辑推导**：
    
    - 使用队列保存当前层节点。
        
    - 每次循环外层递增步数 `deep++`。
        
    - 使用 `size := len(queue)` 锁定当前层的节点数量，一次性弹空当前层，并将下一层非空子节点追加到队列末尾。
        

**复杂度分析**

- 时间复杂度: $\mathcal{O}(N)$，最坏情况下（所有叶子都在最底层）遍历所有节点；最优情况下（浅层就有叶子）可在远少于 $N$ 次操作内提前结束。
    
- 空间复杂度: $\mathcal{O}(N)$，最坏情况下队列需要存储最后一层的节点（完全二叉树最后一层最多有 $\lceil N / 2 \rceil$ 个节点）。
    

**核心代码 (Go)**

Go

```
package main

type TreeNode struct {
	Val   int
	Left  *TreeNode
	Right *TreeNode
}

// minDepth BFS 层序遍历 + 提前终止
func minDepth(root *TreeNode) int {
	if root == nil {
		return 0
	}

	queue := []*TreeNode{root}
	deep := 0

	for len(queue) > 0 {
		size := len(queue)
		deep++

		// 处理当前层的所有节点
		for range size {
			cur := queue[0]
			queue = queue[1:]

			// 遇到首个叶子节点，立即返回全局最短深度
			if cur.Left == nil && cur.Right == nil {
				return deep
			}

			if cur.Left != nil {
				queue = append(queue, cur.Left)
			}
			if cur.Right != nil {
				queue = append(queue, cur.Right)
			}
		}
	}

	return deep
}
```

### 做题时该选谁？

1. **求“最短/最少”**（如：迷宫最少走几步、单词接龙最少变换几次）：**必选 BFS**。因为 BFS 是逐层扩展的，第一次触碰到终点时的层数必然是全局最短路径。
    
2. **求“所有可能解”或全排列**（如：数独、N皇后、组合总和）：**必选 DFS（回溯）**。DFS 沿着单条路径探到底，状态恢复简单，不需要像 BFS 那样在队列里存储大量分支状态。
    
3. **图的连通性/染色**（如：岛屿数量、朋友圈问题）：**DFS 和 BFS 均可**，但 DFS 递归写起来往往更精炼。