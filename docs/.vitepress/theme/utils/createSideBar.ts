export function createSideBarZH() {
  return {
    "/notes/": [
			{
				text: "Python基础",
				collapsed: false,
				items: [
					{ text: "01python数据模型", link: "/notes/Python基础/01python数据模型" },
					{ text: "02序列构成的数组", link: "/notes/Python基础/02序列构成的数组" },
					{ text: "03字典与集合", link: "/notes/Python基础/03字典与集合" },
					{ text: "04文本与字节序列", link: "/notes/Python基础/04文本与字节序列" },
					{ text: "05一等函数", link: "/notes/Python基础/05一等函数" },
					{ text: "06使用一等函数实现设计模式", link: "/notes/Python基础/06使用一等函数实现设计模式" },
					{ text: "07函数装饰器与闭包", link: "/notes/Python基础/07函数装饰器与闭包" },
					{ text: "08对象引用、可变性和垃圾回收", link: "/notes/Python基础/08对象引用、可变性和垃圾回收" },
					{ text: "09符合python风格的对象", link: "/notes/Python基础/09符合python风格的对象" },
					{ text: "10序列的修改、散列和切片", link: "/notes/Python基础/10序列的修改、散列和切片" },
					{ text: "11接口：从协议到抽象基类", link: "/notes/Python基础/11接口：从协议到抽象基类" },
					{ text: "12继承的优缺点", link: "/notes/Python基础/12继承的优缺点" },
					{ text: "13正确重载运算符", link: "/notes/Python基础/13正确重载运算符" },
					{ text: "14可迭代的对象、迭代器和生成器", link: "/notes/Python基础/14可迭代的对象、迭代器和生成器" },
					{ text: "15上下文管理和else块", link: "/notes/Python基础/15上下文管理和else块" },
					{ text: "16协程", link: "/notes/Python基础/16协程" },
					{ text: "17使用future处理并发", link: "/notes/Python基础/17使用future处理并发" },
					{ text: "18使用asyncio包处理并发", link: "/notes/Python基础/18使用asyncio包处理并发" },
					{ text: "19元编程", link: "/notes/Python基础/19元编程" },
				],
			},
		].map((item, i) => (!i ? item : { ...item, collapsed: true })),
  }
}
