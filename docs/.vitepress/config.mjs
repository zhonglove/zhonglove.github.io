// https://vitepress.dev/reference/default-theme-config
import { withMermaid } from "vitepress-plugin-mermaid";

export default withMermaid({
  title: "ZhongLove Blog",
  description: "个人博客站点",
  base: "/",
  themeConfig: {
    outline: [2, 6],
    outlineTitle: "页面导航",
    search: {
      provider: "local",
      options: {
        translations: {
          button: { buttonText: "搜索", buttonAriaLabel: "搜索" },
          modal: {
            noResultsText: "未找到相关结果",
            resetButtonTitle: "清除搜索条件",
            footer: {
              navigateText: "切换",
              selectText: "选择",
              closeText: "关闭",
            },
          },
        },
      },
    },
    nav: [
      { text: "首页", link: "/" },
      { text: "AI 学习", link: "/articles/ai-learning-mindset" },
      { text: "技术栈", link: "/articles/ai-fullstack-tech-stack" },
      { text: "NestJS", link: "/articles/nestjs-from-zero" },
      { text: "LangChain", link: "/articles/nestjs-langchain-ai-app" },
      { text: "指南", link: "/guide" }
    ],
    sidebar: {
      "/articles/": [
        {
          text: "文章",
          items: [
            { text: "AI 时代的学习观", link: "/articles/ai-learning-mindset" },
            { text: "大模型技术栈全解析", link: "/articles/ai-fullstack-tech-stack" },
            { text: "NestJS 从零到实战", link: "/articles/nestjs-from-zero" },
            {
              text: "NestJS + LangChain 大模型开发",
              link: "/articles/nestjs-langchain-ai-app",
              items: [
                { text: "基础篇：集成与四大模块", link: "/articles/nestjs-langchain-ai-app" },
                { text: "Memory 多轮对话记忆", link: "/articles/nestjs-langchain-memory" },
                { text: "RAG 检索增强", link: "/articles/nestjs-langchain-rag" },
                { text: "向量存储三种方案完整实操", link: "/articles/nestjs-langchain-vectorstore" },
                { text: "Function Calling 与测试汇总", link: "/articles/nestjs-langchain-function-calling" },
              ],
            },
          ],
        },
      ]
    },
    socialLinks: [
      { icon: "github", link: "https://github.com/zhonglove" }
    ]
  }
})