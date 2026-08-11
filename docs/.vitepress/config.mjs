// https://vitepress.dev/reference/default-theme-config
import { withMermaid } from "vitepress-plugin-mermaid";

export default withMermaid({
  title: "ZhongLove Blog",
  description: "个人博客站点",
  base: "/",
  themeConfig: {
    outline: [2, 6],
    outlineTitle: "页面导航",
    nav: [
      { text: "首页", link: "/" },
      { text: "学习方法", link: "/articles/ai-learning-mindset" },
      { text: "指南", link: "/guide" }
    ],
    sidebar: {
      "/articles/": [
        {
          text: "文章",
          items: [
            { text: "AI 时代的学习观", link: "/articles/ai-learning-mindset" }
          ]
        }
      ]
    },
    socialLinks: [
      { icon: "github", link: "https://github.com/zhonglove" }
    ]
  }
})