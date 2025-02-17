
# `Makefile` 语法学习

[跟我一起写Makefile](https://github.com/seisman/how-to-write-makefile)

# Makefile 要实现的功能

- 格式化代码
- 静态代码检查
- 单元检测
- 代码构建
- 文件清理
- 帮组
- 镜像打包

支持 `help` 命令，通过解析文件中的注释，输出集成的功能:
```make
## help: Show this help info.  
.PHONY: help  
help: Makefile  
    @printf "\nUsage: make <TARGETS> <OPTIONS> ...\n\nTargets:\n"  
    @sed -n 's/^##//p' $< | column -t -s ':' | sed -e 's/^/ /'  
    @echo "$$USAGE_OPTIONS"
```
