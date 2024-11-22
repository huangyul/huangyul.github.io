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
					{ text: "01gin项目笔记", link: "/notes/GO项目实战笔记/01gin项目笔记" },
				]
			}
		].map((item, i) => (!i ? item : { ...item, collapsed: true })),
	}
}
