export function createSideBarZH() {
	return {
		"/notes/": [
			{
				text: "Makefile",
				collapsed: false,
				items: [
					{ text: "01基础知识", link: "/notes/Makefile/01基础知识" },
				]
			}
		].map((item, i) => (!i ? item : { ...item, collapsed: true })),
	}
}
