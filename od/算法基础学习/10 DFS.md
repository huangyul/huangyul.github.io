DFS（Depth-First Search，深度优先搜索）是算法面试与机考中出现频率最高的搜索策略之一。它的核心本质可以用一句话总结：**不撞南墙不回头，撞了南墙就回溯**。

### 1. 核心本质与通俗直觉

想象你在走迷宫：

- 面对岔路口时，你**随机挑一条路一直往前走**；
    
- 走到死胡同（无法继续或者不符合条件）时，**退回上一个岔路口**（这就是“回溯”）；
    
- 换另一条没走过的分支继续尝试，直到找到出口或遍历完所有可能。
    


DFS 优先深探再逐步回退. 来源：| Java 全栈知识体系

> **题型识别信号**：
> 
> - 出现**“遍历所有路径 / 寻找所有组合 / 排列 / 分割”** →\rightarrow→ **回溯型 DFS**；
>     
> - 出现**“连通块 / 岛屿面积 / 染色染色”** →\rightarrow→ **泛洪填充（Flood Fill）DFS**；
>     
> - 出现**“网格求可行性或拓扑依赖”** →\rightarrow→ **图/树遍历 DFS**。


### 2. 常见考查形态与分值分布

DFS 考题难度分层非常明确，通常分为两大类题型：

|**子模型类别**|**典型问题特征**|**常见考查场景**|**核心技巧**|
|---|---|---|---|
|**网格连通块（Flood Fill）**|二维地图上的区域划分、岛屿、连通性|连通区域统计、封闭区域填充|原地修改标记、四/八方向数组|
|**排列组合 / 状态搜索（回溯）**|在有限候选中寻找符合约束的子集或路径|密码破解、任务分配、背包选择|剪枝策略、递归状态复原|
|**树与图的拓扑/路径遍历**|寻找两点间路径、环检测、依赖分析|依赖解析、最长路径|`visited` 状态（三色标记法）|
|**记忆化搜索（DFS + Memo）**|有重叠子问题的爆搜优化（实质为递归版 DP）|滑雪最长路径、矩阵路径最大和|哈希表/二维数组缓存中间解|

### 3. Go 语言通用解题模板

在 Go 中实现 DFS 时，最推荐使用 **闭包函数（Closure）**。这样可以直接访问外层函数的局部变量（如切片、全局答案、网格尺寸），无需每次在递归参数中层层传递指针或长参数列表。

#### 模板一：网格连通块（Flood Fill，只遍历不撤销）

```Go
var dirs = [][2]int{{-1, 0}, {1, 0}, {0, -1}, {0, 1}}

func solveGrid(grid [][]byte) int {
    m, n := len(grid), len(grid[0])
    var dfs func(r, c int)
    dfs = func(r, c int) {
        // 1. 越界检查与停止条件
        if r < 0 || r >= m || c < 0 || c >= n || grid[r][c] != '1' {
            return
        }
        // 2. 访问标记（原地修改或 visited 数组）
        grid[r][c] = '0'
        
        // 3. 向相邻节点扩散
        for _, d := range dirs {
            dfs(r+d[0], c+d[1])
        }
    }
    
    ans := 0
    for i := 0; i < m; i++ {
        for j := 0; j < n; j++ {
            if grid[i][j] == '1' {
                ans++
                dfs(i, j)
            }
        }
    }
    return ans
}
```

#### 模板二：回溯搜索（排列组合/子集，需要撤销现场）

```Go
func backtrackFramework(nums []int) [][]int {
    var res [][]int
    var path []int
    
    var dfs func(start int)
    dfs = func(start int) {
        // 1. 递归终止条件
        if len(path) == len(nums) {
            // 注意：Go 切片底层是引用，必须深拷贝保存
            tmp := make([]int, len(path))
            copy(tmp, path)
            res = append(res, tmp)
            return
        }
        
        // 2. 遍历候选集
        for i := start; i < len(nums); i++ {
            // 剪枝判断
            // if shouldPrune(nums[i]) { continue }
            
            // 做选择
            path = append(path, nums[i])
            // 递归下一层
            dfs(i + 1)
            // 撤销选择（回溯）
            path = path[:len(path)-1]
        }
    }
    dfs(0)
    return res
}
```

# 4. 经典实战精讲

## LeetCode 200. 岛屿数量

### 核心考点

- 核心算法：图论连通分量遍历（DFS / BFS 洪水填充算法）
    
- 空间优化技巧：原地修改标记（沉岛策略），消除额外 `visited` 数组开销
    
- 边界控制：网格图四联通越界拦截与递归基设计
    

### 核心直觉与模型

网格连通分量统计的核心痛点是“如何防止遍历同一岛屿的相邻格子时重复计数与死循环”。

- **沉岛机制（原地消除）**：遍历网格，一旦遇到 `'1'`（陆地），岛屿计数器累加 1；随即以此为源点向四周扩散，将所有联通的 `'1'` 强制置为 `'0'`（将陆地击沉为水），实现天然的状态标记与去重。
    
- **撞墙即停（递归边界不变量）**：
    
    - 越界判断（行索引小于 0 或超出行上限、列索引小于 0 或超出列上限）立即终止。
        
    - 遇到水域（`grid[r][c] != '1'`）立即终止。
        
- **空间平替（Zero-Allocation 优化）**：直接在原网格上修改数值，将辅助空间从 $O(M \times N)$ 降至 $O(1)$（仅占用系统递归栈）。
    

### 算法步骤

1. 特判边界：若网格为空或尺寸为 0，直接返回 `0`；初始化行数 `m`、列数 `n`、统计计数 `count := 0`，以及四方向偏移切片 `dirs`。
    
2. 构造 DFS 闭包函数：入参为坐标 `(r, c)`。首先校验越界及当前单元格是否为 `'1'`，不满足则直接 `return`；满足则先执行沉岛 `grid[r][c] = '0'`，再向上下左右四个方向递归调用。
    
3. 遍历二维网格：双重循环扫描每个坐标 `(i, j)`。
    
4. 触发沉岛并计数：当扫描到 `grid[i][j] == '1'` 时，执行 `count++`，并立即调用 `dfs(i, j)` 淹没整座相连岛屿。
    
5. 返回累计结果 `count`。
    

### Go 标杆代码


```Go
// numIslands 计算二维网格中的独立岛屿数量
func numIslands(grid [][]byte) int {
	// 1. 边界特判
	if len(grid) == 0 || len(grid[0]) == 0 {
		return 0
	}

	m, n := len(grid), len(grid[0])
	count := 0

	// 2. 预定义四方向偏移向量（上、下、左、右）
	dirs := [4][2]int{{-1, 0}, {1, 0}, {0, -1}, {0, 1}}

	// 3. 构造 DFS 闭包函数执行沉岛（Flood Fill）
	var dfs func(r, c int)
	dfs = func(r, c int) {
		// 递归基：越界或当前格子不是陆地，撞墙即停
		if r < 0 || r >= m || c < 0 || c >= n || grid[r][c] != '1' {
			return
		}

		// 沉岛操作：就地标记为水，阻断后续重复访问
		grid[r][c] = '0'

		// 扩散搜索相邻陆地
		for _, d := range dirs {
			dfs(r+d[0], c+d[1])
		}
	}

	// 4. 双重扫描整个网格
	for i := 0; i < m; i++ {
		for j := 0; j < n; j++ {
			if grid[i][j] == '1' {
				count++   // 发现新岛屿
				dfs(i, j) // 淹没当前连通块
			}
		}
	}

	// 5. 返回最终岛屿总数
	return count
}
```

## LeetCode 46. 全排列

### 核心考点

- **核心算法**：回溯算法（排队填坑模型 / 排列型递归搜索树）
    
- **时空复杂度**：时间复杂度 $O(n \times n!)$，空间复杂度 $O(n)$（递归栈与辅助状态）
    
- **关键编码技巧**：全局 `used` 访问标记数组维护可用候选集；Go 切片存入结果集时的**深拷贝防御**
    

### 核心直觉与模型

排列问题要求顺序敏感（`[1, 2] != [2, 1]`），无法通过单向递增的指针（`startIndex`）消除重复，必须每次从头扫描全局候选，依靠访问标记实现排队填坑与即时反悔。

- **排队填坑模型**：将求解全排列看作向 $n$ 个空槽位依次填入未使用的数字。当前层任选一个可用元素填入，下一层继续填剩余槽位；当填满一整条路径后，沿原路返回并拔出数字（撤销选择），尝试下一种填法。
    
- **排列 vs 组合不变量**：
    
    - 组合/子集问题：集合无序，递归携带单向移动的 `startIndex`，保证“只往前看，不回头”，天然去重。
        
    - 排列问题：元素有序，每次选择均从下标 `0` 开始全盘扫描，依靠全局 `used []bool`（或位掩码）保证同一个数字在一趟 DFS 路径中不被重复填入。
        
- **工程技巧（切片深拷贝陷阱）**：Go 的切片是共享底层数组的引用头。回溯过程中 `path` 切片会被持续复用与修改，存入答案时必须执行深拷贝（`copy` 或 `append([]int(nil), path...)`），杜绝全盘被篡改为空或覆盖。
    

### 算法步骤

1. **初始化**：定义长度为 $n$ 的布尔切片 `used := make([]bool, n)`、当前路径 `path := make([]int, 0, n)`，以及答案切片 `res := make([][]int, 0)`。
    
2. **递归基（终止条件）**：当 `len(path) == n` 时，说明当前排列已填满全部槽位，开辟新切片并拷贝 `path` 内容存入 `res`，然后 `return`。
    
3. **单层循环推进**：遍历下标 $i \in [0, n-1]$，若 `used[i] == true` 则直接 `continue` 跳过。
    
4. **决策与回溯**：
    
    - 做选择：标记 `used[i] = true`，并 `path = append(path, nums[i])`。
        
    - 深入下一层：调用 `dfs()`。
        
    - 撤销选择：`path = path[:len(path)-1]`，并将 `used[i] = false` 恢复现场。
        
5. **返回最终结果**：返回收集完所有分支排列的 `res`。
    

### Go 标杆代码

```Go
package main

// permute 返回不含重复数字的数组的所有全排列
func permute(nums []int) [][]int {
	n := len(nums)
	res := make([][]int, 0)
	path := make([]int, 0, n)
	used := make([]bool, n)

	var dfs func()
	dfs = func() {
		// 1. 终止条件：路径长度已填满 n 个槽位
		if len(path) == n {
			// 必须做深拷贝，防止回溯修改影响已收集的结果
			temp := make([]int, n)
			copy(temp, path)
			res = append(res, temp)
			return
		}

		// 2. 排列搜索：每一层均从 0 开始重新审视全量元素
		for i := 0; i < n; i++ {
			if used[i] {
				continue
			}

			// 做选择
			used[i] = true
			path = append(path, nums[i])

			// 推进到下一个槽位
			dfs()

			// 撤销选择（回溯恢复现场）
			path = path[:len(path)-1]
			used[i] = false
		}
	}

	// 3. 触发递归
	dfs()
	return res
}
```

### 复杂度分析

- **时间复杂度 $O(n \times n!)$**：从根到叶子的完整排列共有 $n!$ 种方案，每到达一个叶子节点需要 $O(n)$ 时间复制 `path` 存入结果，因此总时间复杂度为 $O(n \times n!)$。
    
- **空间复杂度 $O(n)$**：递归调用栈深度最大为 $n$，辅助标记数组 `used` 和临时路径 `path` 长度均为 $n$（不计存储最终答案的空间）。
    

### 易错点与边界避坑

1. **切片直接追加导致答案全空或错乱**： 切记不可写成 `res = append(res, path)`。在 Go 中这只会浅拷贝切片结构体本身，随着后续回溯 `path = path[:len(path)-1]`，已经存入 `res` 的子切片内容全会被底层数组修改，最终全变为空或错误数据。
    
2. **误用 `startIndex`**： 排列问题千万不要习惯性加上 `startIndex`，否则会退化成单向组合搜索，遗漏所有逆序排列（例如能搜出 `[1, 2, 3]` 但永远搜不出 `[2, 1, 3]`）。


## LeetCode 39. 组合总和

### 核心考点

- **回溯搜索与剪枝（Backtracking with Pruning）**：利用数组有序性，在递归树横向遍历时提前阻断无效分支。
    
- **元素复选控制（Index Invariant）**：通过控制递归入口索引（保持传入 `i`），允许单元素无限次复选的同时杜绝排列逆序重复。
    
- **切片内存隔离（Slice Deep Copy）**：Go 语言中回溯路径复用底层数组时的深拷贝技巧。
    

### 核心直觉与模型

题目要求找出所有和为目标值的唯一组合且元素可无限复用。由于必须穷举所有具体解，核心机制是 DFS 递归树遍历，关键在于**如何避免生成排列重复**并**在超额时立即止损**。

- **单向递增防重（不走回头路）**：每次只允许从当前元素及之后的元素中挑选，强制所有解集保持升序排列，自然消除类似 `[2, 3, 2]` 和 `[2, 2, 3]` 的组合重复。
    
- **物理参照（撞墙即停）**：
    
    - 先将候选数组升序排序。
        
    - 递归推进时，一旦发现当前数字已大于剩余目标值（`candidates[i] > remain`），后续更大数值必然全部溢出，直接 `break` 打断横向遍历，截断整棵子树。
        
- **切片副本隔离**：通过 `append([]int(nil), path...)` 快速拷贝当前有效路径，避免回溯弹出元素时篡改已存入结果集的切片底层数组。
    

### 算法步骤

1. **预排序**：对 `candidates` 执行升序排序，为后续提前退出循环建立单调性前提。
    
2. **初始化容器**：声明解集切片 `res` 以及当前递归路径 `path`。
    
3. **回溯闭包定义**：定义 `backtrack(remain, start)`，维护剩余目标值与本层挑选起始索引。
    
4. **递归基判断**：若 `remain == 0`，说明成功凑齐目标值，深拷贝 `path` 并追加至 `res` 后返回。
    
5. **横向展开与剪枝**：遍历下标从 `start` 开始：
    
    - 若 `candidates[i] > remain`，直接 `break` 结束本层遍历（剪枝）。
        
    - 将 `candidates[i]` 追加至 `path`。
        
    - 纵向递归进入 `backtrack(remain - candidates[i], i)`（传入 `i` 以允许重复挑选自身）。
        
    - 回溯撤销：执行 `path = path[:len(path)-1]`。
        
6. **启动搜索**：调用 `backtrack(target, 0)` 并返回 `res`。
    

### Go 标杆代码



```Go
func combinationSum(candidates []int, target int) [][]int {
    // 1. 预处理：升序排序，为后续提前 break 剪枝创造单调性条件
    sort.Ints(candidates)

    var res [][]int
    var path []int

    // 2. 定义回溯闭包
    // remain: 距离 target 的剩余差额
    // start: 当前层可选元素的起始下标，防止选回前面的元素导致重复组合
    var backtrack func(remain int, start int)
    backtrack = func(remain int, start int) {
        // 3. 递归出口：恰好凑齐
        if remain == 0 {
            // 易错避坑：切片共享底层数组，必须执行深拷贝
            res = append(res, append([]int(nil), path...))
            return
        }

        // 4. 横向遍历分支
        for i := start; i < len(candidates); i++ {
            // 核心剪枝：当前数值已超额，后续数字更大必然超额，直接撞墙退出
            if candidates[i] > remain {
                break
            }

            // 做选择
            path = append(path, candidates[i])

            // 纵向递归：可重复选自身，因此下一层递归起始依然传 i，而不是 i + 1
            backtrack(remain-candidates[i], i)

            // 撤销选择（回溯）
            path = path[:len(path)-1]
        }
    }

    // 5. 从起始下标 0 开始搜寻
    backtrack(target, 0)
    return res
}
```

### 复杂度分析

- **时间复杂度**：$O(S)$，其中 $S$ 为所有可行解的长度之和。松弛上界为 $O(2^n \times n)$，但在排序剪枝和正整数限制（$candidates[i] \ge 2, target \le 40$）下，实际递归树极度收敛，执行时间在毫秒级别。
    
- **空间复杂度**：$O(target)$。最坏情况下由最小元素 2 连续构成，递归栈深度最大为 $target / 2$；临时路径切片 `path` 的最大长度同样为 $O(target)$。
    

### 华为 OD 考场关联与变体

- **真题伪装外壳**：机考中常包装为“_物资精准配重方案_”、“_固定额度代金券组合_”等需要枚举所有解的场景（200分题高频）。
    
- **ACM 输入解析**：题目若以 `[2,3,6,7]` 字符串格式给出输入，需先用 `strings.Trim(line, "[]")` 剔除外层括号，再用 `strings.Split(..., ",")` 结合 `strconv.Atoi` 提取切片。