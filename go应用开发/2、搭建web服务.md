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

### 基于 `cookie` 的实现

将 `session` 数据加密存放到 `cookie` 中

```go
// 指定使用cookie
store := cookie.NewStore([]byte("secret"))  
server.Use(sessions.Sessions("webook", store))

// 存
sess := sessions.Default(ctx)
sess.Set(key, value)
sess.Options(&sessions.Options{
	MaxAge: xxxxx
})
sess.Save()

// 取
sess := sessions.Default(ctx)
sess.Get(key)
```

### 基于 `redis` 的实现

将 `session` 数据存放到 `redis` 中，适合分布式系统

```go
// based on redis  
store, err := redis.NewStore(16, "tcp", "localhost:16379", "", []byte("secret"), []byte("enc"))  
if err != nil {  
    panic(err)  
}  
server.Use(sessions.Sessions("webook", store))
```

## 基于 JWT 的实现

1. **无状态架构**：Token自包含用户信息，服务器无需存储会话数据，天然适配微服务与水平扩展
2. ​**跨平台与跨域支持**：Token可通过Header传递，规避Cookie限制，适配Native App、IoT设备及跨域API调用
3. ​**灵活性与性能**：
   - ​**细粒度控制**：Token可包含权限声明（如`role: admin`），实现动态授权
   - ​**减少I/O开销**：JWT验签仅需密钥，无需查询数据库（但需注意Token撤销问题）
   
```go
// 生成token 
loginClaim := middleware.LoginClaims{  
    UserId: user.ID,  
    RegisteredClaims: jwt.RegisteredClaims{  
       ExpiresAt: jwt.NewNumericDate(time.Now().Add(time.Minute * 30)),  
    },  
}  
tokenStr, err := jwt.NewWithClaims(jwt.SigningMethodHS256, loginClaim).SignedString([]byte("secret"))  
if err != nil {  
    ctx.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})  
    return  
}

// 解析token
tokenStr := ctx.GetHeader("Authorization")  
  
if tokenStr == "" {  
    ctx.AbortWithStatus(http.StatusUnauthorized)  
    return  
}  
  
tokenStr = strings.TrimPrefix(tokenStr, "Bearer ")  
if tokenStr == "" {  
    ctx.AbortWithStatus(http.StatusUnauthorized)  
    return  
}  
var c LoginClaims  
token, err := jwt.ParseWithClaims(tokenStr, &c, func(token *jwt.Token) (interface{}, error) {  
    return []byte("secret"), nil  
})  
// 主要判断token能否成功被解密以及token有效期
if err != nil || !token.Valid {  
    ctx.AbortWithStatus(http.StatusUnauthorized)  
    return  
}
```