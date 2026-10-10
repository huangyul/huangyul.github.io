
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

### DFS LeetCode 200. 岛屿数量

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

### BFS  LeetCode 102. 二叉树的层序遍历

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

# 做题时该选谁？

1. **求“最短/最少”**（如：迷宫最少走几步、单词接龙最少变换几次）：**必选 BFS**。因为 BFS 是逐层扩展的，第一次触碰到终点时的层数必然是全局最短路径。
    
2. **求“所有可能解”或全排列**（如：数独、N皇后、组合总和）：**必选 DFS（回溯）**。DFS 沿着单条路径探到底，状态恢复简单，不需要像 BFS 那样在队列里存储大量分支状态。
    
3. **图的连通性/染色**（如：岛屿数量、朋友圈问题）：**DFS 和 BFS 均可**，但 DFS 递归写起来往往更精炼。