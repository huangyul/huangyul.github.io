
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

```Go
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

```Go
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

### LeetCode 46. 全排列 (Permutations)

**📋 题目描述**

给定一个不含重复数字的整数数组 `nums`，返回其所有可能的全排列。可以按任意顺序返回答案。

**示例**

- 输入: `nums = [1, 2, 3]`
    
- 输出: `[[1,2,3],[1,3,2],[2,1,3],[2,3,1],[3,1,2],[3,2,1]]`
    
- 解释: 长度为 3 的数组无重排列共有 $3! = 6$ 种可能。
    

**重要约束 & 边界条件**

- $1 \le \text{nums.length} \le 6$
    
- $-10 \le \text{nums}[i] \le 10$
    
- `nums` 中的所有整数互不相同。
    

**核心思想 & 突破口**

- **核心思想**：DFS 回溯法（决策树深度遍历）。
    
- **突破口**：
    
    - **抽屉填空模型**：每个位置从所有未被选中的数字中挑一个。因为元素有顺序依赖（`[1, 2]` 和 `[2, 1]` 属于不同排列），每一层都需要面对整个 `nums` 数组，但不能重复选已经挑过的元素。
        
    - **状态剪枝**：使用 `visited` 布尔数组记录已被选中的元素，若 `visited[i] == true` 则直接 `continue` 剪枝。
        
    - **恢复现场（回溯）**：退回上一层时，必须将当前元素从 `path` 弹出，并重置 `visited[i] = false`，保证平行的兄弟分支能再次使用该元素。
        
- **收集结果时机**：当暂存路径长度满足 `len(path) == len(nums)` 时，说明一个全排列构造完成，拷贝加入结果集。
    

**复杂度分析**

- 时间复杂度: $\mathcal{O}(N \times N!)$，全排列共 $N!$ 个解，每个解生成与拷贝耗时 $\mathcal{O}(N)$。
    
- 空间复杂度: $\mathcal{O}(N)$，不计返回结果数组，递归调用栈深度为 $N$，`visited` 数组和 `path` 切片占用 $\mathcal{O}(N)$ 辅助空间。
    

**核心代码 (Go)**

```Go
package main

func permute(nums []int) [][]int {
	var res [][]int
	var path []int
	visited := make([]bool, len(nums))

	var backtrack func()
	backtrack = func() {
		// 终止条件：抽屉放满，收集结果
		if len(path) == len(nums) {
			temp := make([]int, len(path))
			copy(temp, path)
			res = append(res, temp)
			return
		}

		for i := 0; i < len(nums); i++ {
			// 剪枝：已使用的卡片跳过
			if visited[i] {
				continue
			}

			// 做选择
			visited[i] = true
			path = append(path, nums[i])

			// 深入下一层
			backtrack()

			// 撤销选择（恢复现场）
			path = path[:len(path)-1]
			visited[i] = false
		}
	}

	backtrack()
	return res
}
```

### LeetCode 78. 子集 (Subsets)

**📋 题目描述**

给你一个整数数组 `nums`，数组中的元素互不相同。返回该数组所有可能的子集（幂集）。解集不能包含重复的子集。可以按任意顺序返回解集。

**示例**

- 输入: `nums = [1, 2, 3]`
    
- 输出: `[[],[1],[2],[1,2],[3],[1,3],[2,3],[1,2,3]]`
    
- 解释: 长度为 3 的集合幂集大小为 $2^3 = 8$。
    

**重要约束 & 边界条件**

- $1 \le \text{nums.length} \le 10$
    
- $-10 \le \text{nums}[i] \le 10$
    
- `nums` 中的所有元素互不相同。
    
- 空集 `[]` 也是合法的子集。
    

**核心思想 & 突破口**

- **核心思想**：DFS 回溯法 + 组合不回头指针（`startIndex`）。
    
- **突破口**：
    
    - **组合去重（横向剪枝）**：子集不关心顺序（`[1, 2]` 与 `[2, 1]` 视为同一个子集）。为避免重复生成，遍历只从当前元素的后一位开始选取，即引入 `startIndex`，递归传入 `i + 1`，从而彻底省去 `visited` 数组。
        
    - **纵向回溯（不可或缺）**：纵向退栈时，`path` 是共享切片，仍然必须执行 `path = path[:len(path)-1]` 将当前元素弹出，否则后续平行分支会夹带上一条分支的残留元素。
        
- **收集结果时机**：树上的**每一个节点（包括根节点对应的空集）都是合法子集**。因此一进入递归函数，首件事就是将当前 `path` 拷贝并存入结果集，无需等待填满。
    

**复杂度分析**

- 时间复杂度: $\mathcal{O}(N \times 2^N)$，子集总数为 $2^N$ 个，每个子集的复制开销最坏为 $\mathcal{O}(N)$。
    
- 空间复杂度: $\mathcal{O}(N)$，递归栈深度最大为 $N$，暂存路径 `path` 占用 $\mathcal{O}(N)$ 空间。
    

**核心代码 (Go)**

```Go
package main

func subsets(nums []int) [][]int {
	var res [][]int
	var path []int

	var backtrack func(startIndex int)
	backtrack = func(startIndex int) {
		// 节点即解：每个递归状态的 path 都是一个合法子集
		temp := make([]int, len(path))
		copy(temp, path)
		res = append(res, temp)

		// 横向从 startIndex 开始向后探索
		for i := startIndex; i < len(nums); i++ {
			// 做选择
			path = append(path, nums[i])

			// 递归：下一个工位从 i + 1 开始，杜绝回头导致的重复
			backtrack(i + 1)

			// 撤销选择（恢复现场）
			path = path[:len(path)-1]
		}
	}

	backtrack(0)
	return res
}
```

### 做题时该选谁？

1. **求“最短/最少”**（如：迷宫最少走几步、单词接龙最少变换几次）：**必选 BFS**。因为 BFS 是逐层扩展的，第一次触碰到终点时的层数必然是全局最短路径。
    
2. **求“所有可能解”或全排列**（如：数独、N皇后、组合总和）：**必选 DFS（回溯）**。DFS 沿着单条路径探到底，状态恢复简单，不需要像 BFS 那样在队列里存储大量分支状态。
    
3. **图的连通性/染色**（如：岛屿数量、朋友圈问题）：**DFS 和 BFS 均可**，但 DFS 递归写起来往往更精炼。