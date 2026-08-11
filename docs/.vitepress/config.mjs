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
      { text: "AI 学习", link: "/articles/ai-learning-mindset" },
      { text: "技术栈", link: "/articles/ai-fullstack-tech-stack" },
      { text: "NestJS", link: "/articles/nestjs-from-zero" },
      { text: "指南", link: "/guide" }
    ],
    sidebar: {
      "/articles/": [
        {
          text: "文章",
          items: [
            { text: "AI 时代的学习观", link: "/articles/ai-learning-mindset" },
            { text: "大模型技术栈全解析", link: "/articles/ai-fullstack-tech-stack" },
            { text: "NestJS 从零到实战", link: "/articles/nestjs-from-zero" }
          ]
        }
      ]
    },
    socialLinks: [
      { icon: "github", link: "https://github.com/zhonglove" }
    ]
  }
})