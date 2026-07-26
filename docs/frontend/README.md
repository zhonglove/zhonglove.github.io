# 前端开发入门教程

## 什么是前端开发？

前端开发就是做用户看得到、摸得着的界面。你在浏览器里看到的每一个页面、按钮、输入框、动画，都是前端开发的成果。

前端三件套：
- **HTML**：网页的骨架（标题、段落、按钮）
- **CSS**：网页的样式（颜色、大小、布局）
- **JavaScript**：网页的行为（点击、跳转、数据请求）

而 **Vue** 和 **React** 是"框架"，它们帮我们用更简洁、更高效的方式写这三件套。

---

## 环境搭建

### 安装 Node.js

Vue 和 React 都需要 Node.js 环境。

1. 打开 https://nodejs.org/，下载 LTS 版本
2. 安装后打开终端验证：

```bash
node --version   # 输出 v20.x.x 或更高
npm --version    # 输出 10.x.x 或更高
```

npm 是 Node.js 自带的包管理器，用来安装第三方库。

---

## Vue 3 入门

Vue 的特点：**上手简单，模板语法直观**。

### 创建项目

```bash
npm create vue@latest my-vue-app
cd my-vue-app
npm install
npm run dev
```

浏览器打开 http://localhost:5173，就能看到页面。

### 项目结构

```
my-vue-app/
├── src/
│   ├── App.vue        # 根组件
│   ├── main.js        # 入口文件
│   └── components/    # 组件目录
├── index.html
└── package.json
```

### 核心概念：组件

Vue 文件以 `.vue` 结尾，一个文件就是一个"组件"。组件三部分组成：

```vue
<script setup>
// JavaScript 逻辑
import { ref } from 'vue'

const count = ref(0)
const add = () => count.value++
</script>

<template>
  <!-- HTML 模板 -->
  <button @click="add">点击了 {{ count }} 次</button>
</template>

<style scoped>
/* CSS 样式，scoped 表示只对当前组件生效 */
button {
  background: #42b883;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
}
</style>
```

### 核心概念：响应式

`ref` 是 Vue 3 中最常用的响应式 API。当 `count.value` 改变时，模板中所有用到 `count` 的地方都会自动更新。

### 常用指令

```vue
<!-- v-if：条件渲染 -->
<p v-if="isLoggedIn">欢迎回来！</p>
<p v-else>请登录</p>

<!-- v-for：列表渲染 -->
<li v-for="item in list" :key="item.id">{{ item.name }}</li>

<!-- v-model：双向绑定 -->
<input v-model="username" placeholder="输入用户名" />

<!-- : 是 v-bind 的简写：绑定属性 -->
<img :src="imageUrl" />

<!-- @ 是 v-on 的简写：绑定事件 -->
<button @click="handleClick">点击</button>
```

### 组件间通信

父组件传值给子组件用 `props`：

```vue
<!-- 父组件 -->
<ChildComponent :message="parentMsg" />

<!-- 子组件 -->
<script setup>
const props = defineProps(['message'])
</script>
<template>{{ message }}</template>
```

### 与 AI 后端交互

```vue
<script setup>
import { ref } from 'vue'

const input = ref('')
const reply = ref('')
const loading = ref(false)

async function sendMessage() {
  loading.value = true
  const res = await fetch('https://your-api.com/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: input.value })
  })
  const data = await res.json()
  reply.value = data.reply
  loading.value = false
}
</script>

<template>
  <textarea v-model="input" placeholder="输入你的问题" />
  <button @click="sendMessage" :disabled="loading">
    {{ loading ? '思考中...' : '发送' }}
  </button>
  <div>{{ reply }}</div>
</template>
```

---

## React 入门

React 的特点：**组件化纯粹，生态庞大**。

### 创建项目

```bash
npm create vite@latest my-react-app -- --template react
cd my-react-app
npm install
npm run dev
```

### 项目结构

```
my-react-app/
├── src/
│   ├── App.jsx         # 根组件
│   ├── main.jsx        # 入口文件
│   └── components/     # 组件目录
├── index.html
└── package.json
```

### 核心概念：组件

React 组件就是一个返回 JSX 的函数：

```jsx
import { useState } from 'react'

function Counter() {
  const [count, setCount] = useState(0)
  const add = () => setCount(count + 1)

  return (
    <button onClick={add}>点击了 {count} 次</button>
  )
}

export default Counter
```

### 核心概念：State

`useState` 是 React 最核心的 Hook。`count` 是当前值，`setCount` 是修改值的函数。调用 `setCount` 后组件会自动重新渲染。

### JSX 语法

JSX 允许在 JavaScript 中写 HTML：

```jsx
function App() {
  const name = 'World'
  const isLoggedIn = true
  const items = ['A', 'B', 'C']

  return (
    <div>
      {/* 条件渲染 */}
      {isLoggedIn ? <p>欢迎回来</p> : <p>请登录</p>}

      {/* 列表渲染 */}
      <ul>
        {items.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>

      {/* 绑定属性 */}
      <img src="https://example.com/img.png" alt="" />

      {/* 绑定事件 */}
      <button onClick={() => alert('点击了')}>点击</button>
    </div>
  )
}
```

### 组件间通信

父传子用 props：

```jsx
// 父组件
<ChildComponent message={parentMsg} />

// 子组件
function ChildComponent({ message }) {
  return <div>{message}</div>
}
```

### 与 AI 后端交互

```jsx
import { useState } from 'react'

function ChatBox() {
  const [input, setInput] = useState('')
  const [reply, setReply] = useState('')
  const [loading, setLoading] = useState(false)

  async function sendMessage() {
    setLoading(true)
    const res = await fetch('https://your-api.com/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: input })
    })
    const data = await res.json()
    setReply(data.reply)
    setLoading(false)
  }

  return (
    <div>
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="输入你的问题"
      />
      <button onClick={sendMessage} disabled={loading}>
        {loading ? '思考中...' : '发送'}
      </button>
      <div>{reply}</div>
    </div>
  )
}
```

---

## Vue vs React 怎么选？

| 维度 | Vue 3 | React |
|------|-------|-------|
| 学习曲线 | 平缓，模板语法直观 | 需要理解 JSX 和纯 JS 思维 |
| 模板语法 | HTML 基础上扩展指令 | 全 JSX，HTML 写在 JS 里 |
| 响应式 | ref/reactive，自动追踪 | useState，手动触发更新 |
| 状态管理 | Pinia（官方推荐） | Zustand / Redux |
| 路由 | Vue Router | React Router |
| 适用场景 | 中小团队、快速开发 | 大团队、复杂交互、灵活度高 |

**初学者建议**：如果之前写过 HTML，Vue 更亲切。如果喜欢 JavaScript 函数式编程，React 更适合。

---

## 前后端联调

前端开发完成后，需要和后端 API 对接。常见方式：

### 1. 开发时跨域

在 Vite 配置 `vite.config.js` 中设置代理：

```js
// Vue 和 React 通用
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true
      }
    }
  }
})
```

### 2. 请求库推荐

```bash
npm install axios
```

```js
import axios from 'axios'

const res = await axios.post('/api/chat', { message: '你好' })
console.log(res.data.reply)
```

---

## AI 应用前端要点

| 功能 | 技术方案 |
|------|----------|
| 流式输出（打字机效果） | Server-Sent Events (SSE) |
| 对话历史管理 | useState / Pinia 管理消息列表 |
| Markdown 渲染 | markdown-it / react-markdown |
| 代码高亮 | highlight.js / prismjs |
| 语音交互 | Web Speech API / MediaRecorder |

### 流式输出示例（Vue）

```vue
<script setup>
import { ref } from 'vue'

const content = ref('')

async function streamChat() {
  const res = await fetch('/api/chat/stream', {
    method: 'POST',
    body: JSON.stringify({ message: '讲个故事' }),
    headers: { 'Content-Type': 'application/json' }
  })
  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    content.value += decoder.decode(value)
  }
}
</script>
<template>
  <div>{{ content }}</div>
  <button @click="streamChat">开始</button>
</template>
```

---

## 下一步

- [Vue 3 官方文档](https://vuejs.org/)
- [React 官方文档](https://react.dev/)
- [Vite 构建工具](https://vitejs.dev/)
