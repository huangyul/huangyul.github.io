## 使用 `gin` 

```go
func main() {
	g := gin.Default()
	// 注册中间件
	g.Use()
	// 注册健康检查路由
	g.GET("/health", func(ctx *gin.Context){
		ctx.JSON(200, gin.H{
			"status": "ok",
		})
	})
	httpsrv := &http.Server{Addr: ":8008", Handler: g}

	go func() {
		err := httpsrv.ListenAndServe()
		if err != nil {
		}
	}()

	// 优雅退出
	quit := make(chan os.Signal)
	// 监听 这两种退出信息
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	// 等待接收
	<- quit
	c, cancel := context.WithTimeout(context.Background(), time.Seconed * 10)
	defer cancel()
	if err := httpsrv.Shutdown(ctx); err != nil {
		// 退出超过10秒钟
	}
}
```

> [!TIP]
> `gin`的[中间件汇总](https://github.com/gin-contrib)





测试自动推送obsidian


