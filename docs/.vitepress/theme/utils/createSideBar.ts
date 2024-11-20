export function createSideBarZH() {
	return {
		"/notes/": [
			{
				text: "Makefile基础",
				collapsed: false,
				items: [
					{ text: "01基础知识", link: "/notes/Makefile基础/01基础知识" },
				]
			}
		].map((item, i) => (!i ? item : { ...item, collapsed: true })),
	}
}
