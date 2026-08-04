# NestJS 中使用 LangChain.js

> 零基础教程：把上文的 [LangChain.js 入门（TypeScript 版）](./langchain-typescript) 搬到 NestJS 里，做成真实的 HTTP 接口。
> 适合：已经会 NestJS 基础（Controller / Service / Module），想给后端接大模型能力的同学。

## 为什么要在 NestJS 里用 LangChain.js？

前端页面调大模型，不能直接把 API Key 放浏览器里（会泄露、有跨域问题）。所以常规做法是：

```markdown
前端页面 ──HTTP──→ NestJS 后端 ──LangChain.js──→ 大模型 API
```

- **安全**：API Key 只存在后端环境变量里
- **统一**：LLM 调用、对话历史、工具/Agent 都在一个工程里管理
- **复用**：多个前端页面共用同一个 AI 接口

NestJS 的模块化（Module / Controller / Service）天然适合把「AI 能力」封装成一个独立模块，就像封装一个普通的后端功能。

---

## 一、安装依赖

在 NestJS 项目里安装 LangChain 相关包：

```bash
npm install langchain @langchain/openai dotenv
```

再安装环境变量加载：

```bash
npm install @nestjs/config
```

创建 `.env`：

```env
OPENAI_API_KEY=sk-xxxxx
# 用国内模型也可以，比如 DeepSeek：
# OPENAI_API_KEY=sk-xxx
# OPENAI_BASE_URL=https://api.deepseek.com
```

---

## 二、加载环境变量（ConfigModule）

在 `app.module.ts` 里全局引入 `ConfigModule`，让所有模块都能用 `.env` 里的配置：

```typescript
// src/app.module.ts
import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { ChatModule } from './chat/chat.module'

@Module({
  imports: [
    // 加载 .env 并设为全局，这样 ChatModule 里也能用
    ConfigModule.forRoot({ isGlobal: true }),
    ChatModule,
  ],
})
export class AppModule {}
```

---

## 三、创建 Chat 模块（CLI 三件套）

```bash
nest g module chat
nest g controller chat
nest g service chat
```

生成目录结构：

```markdown
src/chat/
├── chat.controller.ts   ← 接收 HTTP 请求
├── chat.module.ts       ← 注册 Controller 和 Service
└── chat.service.ts      ← 写 LangChain 逻辑
```

---

## 四、写一个最简 AI 接口

### 1. Service：把 LangChain 调用封装成方法

```typescript
// src/chat/chat.service.ts
import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { ChatOpenAI } from '@langchain/openai'

@Injectable()
export class ChatService {
  // 用 ConfigService 读取 .env，不在代码里写死 Key
  constructor(private readonly configService: ConfigService) {}

  // 创建一个模型实例（每次调用前先 new 一个，简单好理解）
  private createModel() {
    return new ChatOpenAI({
      apiKey: this.configService.get('OPENAI_API_KEY'),
      model: 'gpt-4o-mini',
      temperature: 0.7,
    })
  }

  // 最简调用：提问，返回回答
  async ask(question: string): Promise<string> {
    const model = this.createModel()
    const response = await model.invoke(question)
    // response.content 是模型返回的内容
    return response.content as string
  }
}
```

### 2. Controller：暴露 HTTP 接口

```typescript
// src/chat/chat.controller.ts
import { Controller, Post, Body } from '@nestjs/common'
import { ChatService } from './chat.service'

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  // POST /chat/ask
  // 请求体：{ "question": "什么是大模型？" }
  @Post('ask')
  async ask(@Body('question') question: string) {
    const answer = await this.chatService.ask(question)
    return { question, answer }
  }
}
```

### 3. 测试

```bash
npm run start:dev
```

用 Apifox 发请求：

```json
POST http://localhost:3000/chat/ask
{
  "question": "用一句话解释什么是大模型"
}
```

返回：

```json
{
  "question": "用一句话解释什么是大模型",
  "answer": "大模型是一种在海量数据上训练出来的巨型神经网络，能够理解和生成自然语言。"
}
```

---

## 五、流式输出（SSE，聊天界面的标准做法）

聊天界面要一个字一个字蹦出来，就得用「流式输出」。前端用 `EventSource` 或 `fetch` 读流，后端用 `@Sse()` 返回。

> SSE（Server-Sent Events）就是后端「持续往一个响应里写数据」的 HTTP 协议，非常适合 LLM 逐字输出。

### 1. Controller：加一个 SSE 接口

```typescript
// src/chat/chat.controller.ts
import { Controller, Post, Body, Sse } from '@nestjs/common'
import { Observable, from } from 'rxjs'
import { ChatService } from './chat.service'

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('ask')
  async ask(@Body('question') question: string) {
    return { question, answer: await this.chatService.ask(question) }
  }

  // POST /chat/stream
  // 返回一个 Observable，NestJS 会自动转成 SSE 流
  @Post('stream')
  stream(@Body('question') question: string): Observable<any> {
    return this.chatService.stream(question)
  }
}
```

### 2. Service：用 LangChain 的 stream 方法

```typescript
// src/chat/chat.service.ts
import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { ChatOpenAI } from '@langchain/openai'
import { Observable, from } from 'rxjs'
import { StringOutputParser } from '@langchain/core/output_parsers'

@Injectable()
export class ChatService {
  constructor(private readonly configService: ConfigService) {}

  // 流式：返回一个「一段一段吐字」的可观察对象
  stream(question: string): Observable<string> {
    const model = new ChatOpenAI({
      apiKey: this.configService.get('OPENAI_API_KEY'),
      model: 'gpt-4o-mini',
      streaming: true, // 开启流式
    })

    // StringOutputParser 把每段数据转成纯字符串
    const parser = new StringOutputParser()
    const stream = model.pipe(parser).stream(question)

    // 把异步迭代器包装成 RxJS Observable，NestJS 就能识别成 SSE
    return from(stream)
  }
}
```

### 3. 前端怎么接？

前端用 `fetch` 读取流（浏览器端直接用 POST + SSE 需要自己处理，或用 `@microsoft/fetch-event-source`）：

```typescript
const res = await fetch('/chat/stream', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ question: '讲个笑话' }),
})

// 读取响应流，一段段拼接文字
const reader = res.body!.getReader()
const decoder = new TextDecoder()
let text = ''
while (true) {
  const { done, value } = await reader.read()
  if (done) break
  text += decoder.decode(value)
  console.log('当前已输出的文字：', text)
}
```

> 记得在 `main.ts` 里给 NestJS 开启 CORS，前端才能跨域调用：
>
> ```typescript
> const app = await NestFactory.create(AppModule)
> app.enableCors() // 允许前端跨域
> await app.listen(3000)
> ```

---

## 六、带对话历史（Memory）

真实聊天要记住上下文。用 `RunnableWithMessageHistory`，每个用户一个 `sessionId`：

```typescript
// src/chat/chat.service.ts
import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { ChatOpenAI } from '@langchain/openai'
import { ChatPromptTemplate, MessagesPlaceholder } from '@langchain/core/prompts'
import { RunnableWithMessageHistory } from '@langchain/core/runnables'
import { InMemoryChatMessageHistory } from '@langchain/core/chats_helpers'

@Injectable()
export class ChatService {
  constructor(private readonly configService: ConfigService) {}

  // 用一个 Map 存每个用户的历史（生产环境换成 Redis / 数据库）
  private histories = new Map<string, InMemoryChatMessageHistory>()

  private getHistory(sessionId: string) {
    if (!this.histories.has(sessionId)) {
      this.histories.set(sessionId, new InMemoryChatMessageHistory())
    }
    return this.histories.get(sessionId)!
  }

  async chat(question: string, sessionId: string): Promise<string> {
    const model = new ChatOpenAI({
      apiKey: this.configService.get('OPENAI_API_KEY'),
      model: 'gpt-4o-mini',
    })

    const prompt = ChatPromptTemplate.fromMessages([
      ['system', '你是一个友好的助手，用中文回答。'],
      new MessagesPlaceholder('history'), // 历史消息插在这里
      ['human', '{input}'],
    ])

    const chain = prompt.pipe(model)

    const chainWithHistory = new RunnableWithMessageHistory({
      runnable: chain,
      getMessageHistory: async (sid) => this.getHistory(sid),
      inputMessagesKey: 'input',
      historyMessagesKey: 'history',
    })

    const response = await chainWithHistory.invoke(
      { input: question },
      { configurable: { sessionId } },
    )

    return response.content as string
  }
}
```

Controller 接收两个参数：

```typescript
// src/chat/chat.controller.ts
@Post('chat')
async chat(
  @Body('question') question: string,
  @Body('sessionId') sessionId: string, // 前端每次带上用户 ID
) {
  const answer = await this.chatService.chat(question, sessionId)
  return { sessionId, answer }
}
```

测试两次对话，同一个 `sessionId` 就能记上下文：

```json
POST /chat/chat
{ "sessionId": "user-001", "question": "我叫小明" }
// → "你好小明！"

POST /chat/chat
{ "sessionId": "user-001", "question": "我叫什么名字？" }
// → "你叫小明。"
```

---

## 七、工具 + Agent（让后端能力被模型调用）

把后端现有的方法（查订单、查天气、调数据库）包装成 Tool，Agent 会自动决定调哪个：

```typescript
// src/chat/chat.service.ts
import { tool } from '@langchain/core/tools'
import { z } from 'zod'
import { createReactAgent } from '@langchain/langgraph/prebuilt'

@Injectable()
export class ChatService {
  constructor(private readonly configService: ConfigService) {}

  private async createAgent() {
    const model = new ChatOpenAI({
      apiKey: this.configService.get('OPENAI_API_KEY'),
      model: 'gpt-4o-mini',
    })

    // 1. 定义工具：查询订单状态（真实项目里查数据库）
    const checkOrder = tool(
      async ({ orderId }) => `订单 ${orderId} 已发货，预计 3 天内到达`,
      {
        name: 'check_order',
        description: '查询订单状态',
        schema: z.object({ orderId: z.string() }),
      },
    )

    // 2. 创建 Agent：模型自己决定调不调工具
    return createReactAgent({
      llm: model,
      tools: [checkOrder],
    })
  }

  async askWithAgent(question: string): Promise<string> {
    const agent = await this.createAgent()

    const result = await agent.invoke({
      messages: [{ role: 'user', content: question }],
    })

    const lastMessage = result.messages[result.messages.length - 1]
    return lastMessage.content as string
  }
}
```

Controller：

```typescript
// src/chat/chat.controller.ts
@Post('agent')
async askWithAgent(@Body('question') question: string) {
  return { question, answer: await this.chatService.askWithAgent(question) }
}
```

测试：

```json
POST /chat/agent
{ "question": "帮我查一下订单 12345 到哪了？" }
// → "订单 12345 已发货，预计 3 天内到达"
```

模型自己判断出「这是订单查询」，自动调用了 `checkOrder` 工具——不需要你写任何 if/else 判断。

---

## 八、完整工程目录（参考）

```markdown
src/
├── main.ts                ← 入口，开启 CORS
├── app.module.ts          ← 根模块，引入 ConfigModule + ChatModule
└── chat/
    ├── chat.module.ts     ← providers 注册 ChatService
    ├── chat.controller.ts ← /chat/ask、/chat/stream、/chat/chat、/chat/agent
    ├── chat.service.ts    ← 所有 LangChain 逻辑
    └── dto/               ← 可选：用 DTO 校验请求体
        └── ask.dto.ts
```

接口清单：

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| POST | /chat/ask | 一次性问答 |
| POST | /chat/stream | SSE 流式输出 |
| POST | /chat/chat | 带对话历史 |
| POST | /chat/agent | 工具 + Agent |

---

## 九、常见问题

### 1. API Key 泄露到代码里了
把 Key 写在 `.env`，通过 `ConfigService` 读取。`.env` 记得加进 `.gitignore`。

### 2. 前端跨域报错
在 `main.ts` 里 `app.enableCors()`。

### 3. 服务一直转圈不返回
检查是不是没加 `await`。NestJS 方法返回 Promise，Controller 里要 `await this.chatService.xxx()`。

### 4. 对话记不住上文
确认每次请求都带了同一个 `sessionId`；生产环境把内存 Map 换成 Redis。

---

## 总结

在 NestJS 里用 LangChain.js，本质就是：

```markdown
Controller（接 HTTP）→ Service（封装 LangChain）→ 大模型 API
```

你只需要写一个 `ChatService`，把 `ask` / `stream` / `chat` / `agent` 这几个方法封装好，前端就能像调用普通后端接口一样用上大模型。

---

## 下一步

- [LangChain.js 入门（TypeScript 版）](./langchain-typescript)
- [NestJS 零基础入门](../backend/nestjs.md)
- [LangChain.js 官方文档](https://js.langchain.com/)