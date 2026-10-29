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