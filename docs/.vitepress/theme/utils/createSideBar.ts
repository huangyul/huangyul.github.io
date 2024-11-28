export function createSideBarZH() {
	return {
		"/notes/": [
			{
				text: "Makefile",
				collapsed: false,
				items: [
					{ text: "01基础知识", link: "/notes/Makefile/01基础知识" },
				]
			},
			{
				text: "GO项目实战笔记",
				collapsed: false,
				items: [
					{ text: "01gin相关笔记", link: "/notes/GO项目实战笔记/01gin相关笔记" },
					{ text: "02性能相关", link: "/notes/GO项目实战笔记/02性能相关" },
				]
			},
			{
				text: "WSL",
				collapsed: false,
				items: [
					{ text: "01基础知识", link: "/notes/WSL/01基础知识" },
					{ text: "02开发配置", link: "/notes/WSL/02开发配置" },
				]
			},
		].map((item, i) => (!i ? item : { ...item, collapsed: true })),
	}
}
