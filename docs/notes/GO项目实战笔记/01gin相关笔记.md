# gin

## 汉化模型绑定和验证

在使用`gin`框架时，我们可以使用**tag**来对表单进行验证，例如：

```go
type User struct {
	Name  string `form:"name" binding:"required"`
    Age   int    `form:"age" binding:"required,gt=0"`
    Email string `form:"email" binding:"required,email"`
    Password string `form:"password" binding:"required,min=6"`
}
func main() {
  router := gin.Default()
  router.POST("/user", func(c *gin.Context) {
    var user User
    if err := c.ShouldBind(&user); err != nil {
      c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
    }
  })
}
```

这时候提示的错误是没有格式化的英文，不是很友好。我们可以添加自定义的翻译器，来翻译我们自定义的错误。

```go
package validator

import (
	"regexp"
	"strings"

	"github.com/gin-gonic/gin/binding"
	"github.com/go-playground/locales/en"
	"github.com/go-playground/locales/zh"
	ut "github.com/go-playground/universal-translator"
	"github.com/go-playground/validator/v10"
	enTran "github.com/go-playground/validator/v10/translations/en"
	chTran "github.com/go-playground/validator/v10/translations/zh"
)

var trans ut.Translator

func init() {
	local := "zh"
	if v, ok := binding.Validator.Engine().(*validator.Validate); ok {
		zhT := zh.New()
		enT := en.New()
		uni := ut.New(enT, zhT, enT)

		var ok bool
		trans, ok = uni.GetTranslator("zh")

		if !ok {
			panic("uni.GetTranslator('zh') err")
		}
		var err error
		switch local {
		case "zh":
			err = chTran.RegisterDefaultTranslations(v, trans)
		case "en":
			err = enTran.RegisterDefaultTranslations(v, trans)
		default:
			err = enTran.RegisterDefaultTranslations(v, trans)
		}
		if err != nil {
			panic(err)
		}
	}
}

func Translate(err error) string { // [!code highlight]

	if err == nil {
		return ""
	}

	typ, ok := err.(validator.ValidationErrors)

	if !ok {
		return "no jion structure"
	}

	raw := typ.Translate(trans)

	for _, v := range raw {
		return convertToSnakeCase(v) // [!code highlight]
	}
	return "" // [!code highlight]
}

func pascalToSnake(s string) string { 
	re := regexp.MustCompile("([A-Z])")
	snake := re.ReplaceAllStringFunc(s, func(match string) string {
		return "_" + strings.ToLower(match) 
	})

	if len(snake) > 0 && snake[0] == '_' {
		snake = snake[1:]
	}

	return snake
}

func convertToSnakeCase(input string) string {
	wordRegex := regexp.MustCompile(`[A-Za-z]+`)

	result := wordRegex.ReplaceAllStringFunc(input, func(word string) string {
		re := regexp.MustCompile("([A-Z])")
		snake := re.ReplaceAllStringFunc(word, func(match string) string {
			return "_" + strings.ToLower(match)
		})
		if len(snake) > 0 && snake[0] == '_' {
			snake = snake[1:]
		}
		return snake
	})

	return result
}
```

::: tip
代码高亮处可以根据接口设计的调整，返回所有不满足的字段亦或者只返回第一个不满足的字段。
:::
