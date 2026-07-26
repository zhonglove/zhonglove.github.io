import { viteBundler } from '@vuepress/bundler-vite'
import { defaultTheme } from '@vuepress/theme-default'
import { defineUserConfig } from 'vuepress'

export default defineUserConfig({
  title: 'LLM大模型Agent应用开发',
  bundler: viteBundler(),
  theme: defaultTheme({
    navbar: [
      { text: '首页', link: '/' },
      { text: '前端', link: '/frontend/' },
      { text: '后端', link: '/backend/' },
      { text: 'AI框架', link: '/ai-framework/' },
      { text: '向量数据库', link: '/vector-db/' },
      { text: '模型接入', link: '/model-access/' },
    ],
    sidebar: {
      '/frontend/': [
        {
          text: '前端',
          children: [
            '/frontend/',
          ],
          sidebarDepth: 6,
        },
      ],
      '/backend/': [
        {
          text: '后端',
          children: [
            '/backend/nestjs',
            '/backend/fastapi',
          ],
          sidebarDepth: 6,
        },
      ],
      '/ai-framework/': [
        {
          text: 'AI框架',
          children: [
            '/ai-framework/',
            '/ai-framework/langchain',
          ],
          sidebarDepth: 6,
        },
      ],
      '/vector-db/': [
        {
          text: '向量数据库',
          children: [
            '/vector-db/',
          ],
          sidebarDepth: 6,
        },
      ],
      '/model-access/': [
        {
          text: '模型接入',
          children: [
            '/model-access/',
          ],
          sidebarDepth: 6,
        },
      ],
    },
  }),
})
