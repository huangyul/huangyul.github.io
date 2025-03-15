# 使用 `gin` 启动 `http` 服务

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


# 接口认证

## `session` 机制

服务器存储 `session`（内存、 `redis` 等），然后将 `sessionid` 通过 `cookie` 发到客户端

基于cookie的实现：
将session数据加密存放到cookie中

```go
// 指定使用cookie
store := cookie.NewStore([]byte("secret"))  
server.Use(sessions.Sessions("webook", store))

// 存
sess := sessions.Default(ctx)
sess.Get(key)
```