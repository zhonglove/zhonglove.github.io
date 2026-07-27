import { viteBundler } from '@vuepress/bundler-vite'
import { defaultTheme } from '@vuepress/theme-default'
import { defineUserConfig } from 'vuepress'
import { searchPlugin } from '@vuepress/plugin-search'

export default defineUserConfig({
  title: 'LLM大模型Agent应用开发',
  bundler: viteBundler(),
  plugins: [
    searchPlugin({
      locales: {
        '/': {
          placeholder: '搜索',
        },
      },
    }),
  ],
  theme: defaultTheme({
    navbar: [
      { text: '首页', link: '/' },
      { text: '前端', link: '/frontend/' },
      { text: '后端', link: '/backend/' },
      { text: 'AI框架', link: '/ai-framework/' },
      { text: '向量数据库', link: '/vector-db/' },
      { text: '模型接入', link: '/model-access/' },
      { text: '面试突击', link: '/interview/' },
      { text: '  ', link: 'https://github.com/zhonglove/zhonglove.github.io' },
    ],
    sidebar: {
      '/frontend/': [
        '/frontend/',
      ],
      '/backend/': [
        '/backend/nestjs',
        '/backend/fastapi',
      ],
      '/ai-framework/': [
        '/ai-framework/langchain',
        '/ai-framework/langgraph',
        '/ai-framework/deepagents',
      ],
      '/vector-db/': [
        '/vector-db/pgvector',
        '/vector-db/chroma',
        '/vector-db/milvus',
      ],
      '/model-access/': [
        '/model-access/zero-basics',
        '/model-access/local-deploy',
      ],
      '/interview/': [
        '/interview/ai-agent',
        '/interview/ai-agent-system-design',
        '/interview/senior-fullstack',
      ],
    },
  }),
})
