# LangChain.js 入门教程（TypeScript / 前端版）

> 面向 0 基础前端开发者的 LangChain 中文入门教程，全程使用 TypeScript 编写。
> 如果你学过上面的 [Python 版](./langchain)，这一版会让你更容易上手——因为前端开发者天生就熟悉 JS/TS 生态。

## LangChain 是什么？

LangChain 是一个帮你更方便调用大语言模型（LLM）来开发 AI 应用的框架。它有 JavaScript / TypeScript 版本，官方叫 **LangChain.js**（`langchain` 包）。

**不用 LangChain 时，你要自己写：**

- 拼接提示词
- 调用模型 API
- 解析返回结果
- 管理对话历史
- 调用外部工具

**用 LangChain 后，这些都有现成的模块。**

对前端来说，LangChain 就像给 LLM 加了一层「封装库」，类似 `axios` 之于 `fetch`。

> 注意：LangChain 有两个生态——Python（`langchain`）和 JS/TS（`langchain` npm 包）。本教程用 TS 生态。

---

## 准备工作

### 环境要求

- Node.js **18+**
- 一个模型 API Key（本教程以 OpenAI 为例，你也可以换成 DeepSeek、通义千问等兼容接口）

### 项目初始化

```bash
mkdir langchain-demo
cd langchain-demo
npm init -y
npm install langchain @langchain/openai dotenv
npm install -D typescript tsx @types/node
npx tsc --init
```

### 配置环境变量

创建 `.env` 文件，填入你的 API Key：

```env
OPENAI_API_KEY=sk-xxxxx
```

> 换成其他国内模型也可以，比如 DeepSeek：
> `OPENAI_API_KEY=sk-xxx` + `OPENAI_BASE_URL=https://api.deepseek.com`

新建 `index.ts` 测试一下：

```typescript
import 'dotenv/config'

console.log('游戏开始！')
```

```bash
npx tsx index.ts
```

能输出 `游戏开始！` 就说明环境 OK 了。

---

## 核心概念（先有印象，不用背）

| 概念 | 是什么 | 类比前端 |
|------|--------|---------|
| Model | 大模型（GPT、Claude 等） | 后端的 API 服务 |
| Prompt | 你给模型的指令 | HTTP 请求的 body |
| Chain | 把多个步骤串联起来 | Promise.then 链 / pipe |
| Tool | 模型能调用的外部功能 | API 接口 |
| Agent | 让模型自己决定调什么工具 | 自动路由 / 状态机 |
| Memory | 让模型记住上下文 | Redux / Pinia 状态 |

学的时候记住一句话：**LangChain 就是把 AI 开发里的重复动作变成模块化的积木。**

---

## 基础用法

### 1. 调用模型

调用模型就像调用一个异步 API，用 `await`：

```ts
import 'dotenv/config'
import { ChatOpenAI } from '@langchain/openai'

// 创建一个模型实例，就像 new Axios() 创建客户端
const model = new ChatOpenAI({
  model: 'gpt-4o-mini',
  temperature: 0.7,
})

// invoke = 一次性传入消息，返回完整回答（就像发一次 HTTP 请求）
const response = await model.invoke('中国的首都是哪里？')

console.log(response.content)
// 输出：中国的首都是北京。
```

`invoke` 返回的是一个 `AIMessage` 对象，不是纯字符串。想要纯字符串，后面会讲「输出解析器」。

### 2. 提示词模板（Prompt Template）

把提示词里的变量抽出来，类似 JS 的模板字符串：

```ts
import 'dotenv/config'
import { ChatOpenAI } from '@langchain/openai'
import { ChatPromptTemplate } from '@langchain/core/prompts'

const model = new ChatOpenAI({ model: 'gpt-4o-mini' })

// 定义模板，花括号里是变量
const prompt = ChatPromptTemplate.fromMessages([
  ['system', '你是一个{role}，请用{style}风格回答问题。'],
  ['human', '{question}'],
])

// 传入变量，生成最终消息数组
const messages = await prompt.invoke({
  role: 'AI 助手',
  style: '幽默',
  question: '什么是机器学习？',
})

console.log(messages.toChatMessages())
```

`ChatPromptTemplate` 就是「提示词的模板引擎」，和渲染字符串脚本很像。

### 3. Chain：把 Prompt 和 Model 串起来

这是 LangChain.js 玩法——用 **`.pipe()`** 把多个步骤串成一条链（Chain）：

```ts
import 'dotenv/config'
import { ChatOpenAI } from '@langchain/openai'
import { ChatPromptTemplate } from '@langchain/core/prompts'
import { StringOutputParser } from '@langchain/core/output_parsers'

const model = new ChatOpenAI({ model: 'gpt-4o-mini' })

const prompt = ChatPromptTemplate.fromTemplate(
  '把下面的句子翻译成{language}：{text}',
)

// 输出解析器：把模型返回的 Message 转成纯字符串
const parser = new StringOutputParser()

// .pipe() 类似前端的阮一峰常用工具 pipe：prompt 的输出 → model → parser
const chain = prompt.pipe(model).pipe(parser)

const result = await chain.invoke({
  language: '英文',
  text: '今天天气真好',
})

console.log(result)
// 输出：The weather is really nice today.
```

`StringOutputParser` 就像给模型输出做了个 `.toString()`，让你直接拿字符串。

### 4. 输出解析器

模型返回原始文本，你想让它返回结构化 JSON 时用 `StructuredOuputParser` / `JsonOutputParser`：

```ts
import 'dotenv/config'
import { ChatOpenAI } from '@langchain/openai'
import { ChatPromptTemplate } from '@langchain/core/prompts'
import { JsonOutputParser } from '@langchain/core/output_parsers'

const model = new ChatOpenAI({ model: 'gpt-4o-mini' })

// 让模型返回 JSON，这会指定 JSON schema
const parser = new JsonOutputParser()

const prompt = ChatPromptTemplate.fromMessages([
  ['system', '根据用户的问题，用 JSON 格式返回，字段为 answer 和 confidence。只返回 JSON。'],
  ['human', '{question}'],
])

const chain = prompt.pipe(model).pipe(parser)

const result = await chain.invoke({ question: '1+1 等于几？' })

console.log(result.answer)      // 2
console.log(result.confidence)  // 1
```

对前端来说，`JsonOutputParser` 就是自动帮你 `JSON.parse()` 的工具，还能拿到类型推断。

---

## 对话历史（Memory）

默认情况模型不记得之前的对话，你需要手动把历史消息传回去。LangChain 提供 **`RunnableWithMessageHistory`** 帮你自动管理：

```ts
import 'dotenv/config'
import { ChatOpenAI } from '@langchain/openai'
import { ChatPromptTemplate, MessagesPlaceholder } from '@langchain/core/prompts'
import { RunnableWithMessageHistory } from '@langchain/core/runnables'
import { InMemoryChatMessageHistory } from '@langchain/core/chats'
import { HumanMessage } from '@langchain/core/messages'

const model = new ChatOpenAI({ model: 'gpt-4o-mini' })

const prompt = ChatPromptTemplate.fromMessages([
  ['system', '你是一个友好的助手。'],
  // 历史消息插到这里，位置很重要
  new MessagesPlaceholder('history'),
  ['human', '{input}'],
])

const chain = prompt.pipe(model)

// storage：用一个 Map 以 sessionId 为 key 存每个用户的历史
const messageHistories: Record<string, InMemoryChatMessageHistory> = {}

const chainWithHistory = new RunnableWithMessageHistory({
  runnable: chain,
  getMessageHistory: async (sessionId) => {
    if (!messageHistories[sessionId]) {
      messageHistories[sessionId] = new InMemoryChatMessageHistory()
    }
    return messageHistories[sessionId]
  },
  inputMessagesKey: 'input',
  historyMessagesKey: 'history',
})

// 第一次对话
const res1 = await chainWithHistory.invoke(
  { input: '我叫小明' },
  { configurable: { sessionId: 'user-001' } },
)
console.log(res1.content)
// 你好小明！很高兴认识你。

// 第二次对话，模型记得你
const res2 = await chainWithHistory.invoke(
  { input: '我叫什么名字？' },
  { configurable: { sessionId: 'user-001' } },
)
console.log(res2.content)
// 你叫小明。
```

`sessionId` 就像前端里的 `localStorage key`，每个用户用自己的 ID，互不干扰就能各自记对话。

---

## 工具（Tool）

让模型能调用你的外部功能，比如查天气、查订单、调你自己的 API：

```ts
import 'dotenv/config'
import { ChatOpenAI } from '@langchain/openai'
import { tool } from '@langchain/core/tools'
import { z } from 'zod'

const model = new ChatOpenAI({ model: 'gpt-4o-mini' })

// 定义一个天气工具：用 z.infer 定义入参类型，类型即文档
const weatherTool = tool(
  async ({ city }) => {
    const data: Record<string, string> = {
      '北京': '晴天，25°C',
      '上海': '多云，28°C',
      '深圳': '雨天，26°C',
    }
    // 实际项目这里调用天气 API
    return data[city] ?? '暂无数据'
  },
  {
    name: 'get_weather',
    description: '查询指定城市的天气',
    schema: z.object({
      city: z.string().describe('城市名'),
    }),
  },
)
```

> 细节点：`zod` 定义入参 schema 后，LangChain 会自动把 `schema` 翻译成模型的 function calling 参数，也保证类型安全。

---

## Agent（智能体）

Agent 让模型**自己决定**调哪个工具、按什么顺序。这是最强大的能力：

```ts
import 'dotenv/config'
import { ChatOpenAI } from '@langchain/openai'
import { tool } from '@langchain/core/tools'
import { z } from 'zod'
import { createReactAgent } from '@langchain/langgraph/prebuilt'

const model = new ChatOpenAI({ model: 'gpt-4o-mini' })

const weatherTool = tool(...)  // 复用上面的工具

const agent = await createReactAgent({
  llm: model,
  tools: [weatherTool],
})

// 直接调用，Agent 会自动判断是否要调用工具
const result = await agent.invoke({ messages: [{ role: 'user', content: '北京今天天气怎么样？' }] })

console.log(result.messages[result.messages.length - 1].content)
// 北京今天天气是晴天，25°C。
```

执行过程：
1. 用户问「北京天气」
2. Agent 分析后决定调用 `get_weather({ city: '北京' })`
3. 拿到结果后，Agent 组织成自然语言回复

> 早期 LangChain.js 用 `createToolCallingAgent` + `AgentExecutor`，新版更推荐 `@langchain/langgraph` 的 `createReactAgent`。两者都能跑，React Agent 更贴近现代写法。

---

## 实战：做一个 AI 客服

把前面学的都拼起来——工具 + 记忆 + Agent：

```ts
import 'dotenv/config'
import { ChatOpenAI } from '@langchain/openai'
import { tool } from '@langchain/core/tools'
import { z } from 'zod'
import { createReactAgent } from '@langchain/langgraph/prebuilt'
import { InMemoryChatMessageHistory } from '@langchain/core/chats_helpers'
import { HumanMessage, AIMessage } from '@langchain/core/messages'

const model = new ChatOpenAI({ model: 'gpt-4o-mini' })

// 1. 定义工具
const checkOrder = tool(
  async ({ orderId }) => `订单 ${orderId} 已发货，预计 3 天内到达`,
  { name: 'check_order', description: '查询订单状态', schema: z.object({ orderId: z.string() }) },
)

const getProductInfo = tool(
  async ({ productName }) => `${productName}，价格 99 元，库存 100 件`,
  { name: 'get_product_info', description: '查询商品信息', schema: z.object({ productName: z.string() }) },
)

// 2. 创建 Agent（先简单版，不带记忆）
const agent = await createReactAgent({
  llm: model,
  tools: [checkOrder, getProductInfo],
  prompt: '你是一个电商客服助手，请用中文回答。',
})

// 3. 加记忆：每位用户各自的历史
const histories: Record<string, InMemoryChatMessageHistory> = {}
async function ask(sessionId: string, message: string) {
  if (!histories[sessionId]) histories[sessionId] = new InMemoryChatMessageHistory()
  const state = await agent.invoke({
    messages: [
      ...(await histories[sessionId].getMessages()),
      { role: 'user', content: message },
    ],
  })
  const reply = state.messages[state.messages.length - 1].content as string
  await histories[sessionId].addMessage(new HumanMessage(message))
  await histories[sessionId].addMessage(new AIMessage(reply))
  return reply
}

console.log(await ask('u1', '我的订单 12345 到哪了？'))
console.log(await ask('u1', '再帮我查一下 iPhone 的价格'))
```

---

## LangChain.js 生态

TS 版生态包名以 `@langchain/*` 开头：

| 包名 | 用途 |
|------|------|
| `langchain` | 核心框架 |
| `@langchain/openai` | OpenAI / 兼容接口模型接入 |
| `@langchain/anthropic` | Claude 接入 |
| `@langchain/core` | 核心抽象（prompt、tool、message） |
| `@langchain/langgraph` | Agent 编排（推荐用它做 Agent） |
| `@langchain/community` | 社区集成（向量数据库、工具等） |

---

## 和前端框架类比

| LangChain.js | React / Vue |
|-----------|-------------|
| Prompt | 组件模板（JSX） |
| Chain 组织 | 组件组合 / pipe |
| Tool | API 接口 |
| Agent | 智能路由 / 状态机 |
| Memory | 状态管理（Redux / Pinia） |
| RunnableWithMessageHistory | 高阶组件（HOC） |
| `.pipe()` | 函数组合 / pipeline |

---

## 总结

LangChain.js 的开发模板，跟 Python 版一模一样五步：

1. 选模型 → `new ChatOpenAI()`
2. 写提示词 → `ChatPromptTemplate`
3. 串步骤 → `prompt.pipe(model).pipe(parser)`
4. 加功能 → `tool(...)`
5. 让模型自己决策 → `createReactAgent`

前端开发者上手 LangChain.js 有天然优势：你懂异步、懂 API、懂状态管理，把 LLM 当成一个「有点特别的后端 API」就好。

---

## 下一步

- [LangChain.js 官方文档](https://js.langchain.com/)
- [Python 版教程](./langchain)
- [LangSmith 调试平台](https://smith.langchain.com/)