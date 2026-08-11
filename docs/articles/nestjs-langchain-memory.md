---
title: NestJS + LangChain 实战：Memory 多轮对话记忆
description: 为什么大模型不记事？如何给 ChatOllama 加上多轮对话记忆。从零实现一个带会话历史列表、流式输出、清空记忆的完整聊天接口。
---

# Memory — 让大模型记起"刚才说了啥"

> **前置**：已完成 [NestJS + LangChain 集成与 Models 基础](/articles/nestjs-langchain-ai-app)
>
> **目标**：给大模型接上"记忆"，实现真正的多轮对话
>
> **技术栈**：NestJS + @langchain/ollama + ChatOllama（本地 qwen3.5:0.8b）

## 一、问题：大模型为什么不记事？

ChatGPT 用起来"记得你刚才说了什么"，但底层的大模型其实是**每次独立算账**的。

一句话解释：大模型本身是**没有状态的（stateless）**。你每一次调用 `invoke()`，都是把一堆消息丢给它，它按当前这批消息给你一个回答，然后……就忘了。

看这个现象——两次"单独调用"，第二次的"我叫小红"它完全不知道：

```mermaid
sequenceDiagram
    participant U as 用户
    participant M as 大模型
    U->>M: invoke(["我叫小红，请记住"])
    M-->>U: 好的，我记住了！
    Note over M: 说完就清空记忆……
    U->>M: invoke(["我叫什么名字？"])
    M-->>U: 对不起，我不知道你的名字 😅
```

为什么会这样？因为两次 `invoke` 提交的消息互不相干。模型就像一个**每次见你都说"好久不见"的失忆同事**。

## 二、思路：记忆 = 把历史消息再带上

解决办法其实很简单：**前端把全部聊天记录，每次都一起发给模型**。

```mermaid
flowchart LR
    subgraph 无记忆
        A1[第1问] --> M1[invoke 第1问]
        A2[第2问] --> M2[invoke 只有第2问]
    end
    subgraph 有记忆
        B1[第1问] --> H[(历史保存)]
        B2[第2问] --> H
        H --> M3[invoke 第1问+第2问]
    end
```

`invoke` 的参数本来就是**一个消息数组**。把上一次的输入输出都塞进数组里，模型就"想起"上文了。刚才的失忆同事，如果你每次都把上次的对话记录递给他看，他自然"记得"。

所以 Memory 的本质是：

::: tip 核心结论
**模型不记，我们帮它记。** 大模型 = 聪明的脑子；记忆 = 我们自己维护的一份"对话记录本"。调用前把记录本一起递进去。
:::

## 三、开始写：MemoryService

### 1. 生成模块

```bash
nest g module memory
nest g controller memory
nest g service memory
```

### 2. 完整代码：`memory.service.ts`

我们用 `Map` 做一个简单的"会话记录本"：`key` 是会话 id，`value` 是这条会话的消息数组。

```typescript
import { Injectable } from '@nestjs/common'
import { ChatOllama } from '@langchain/ollama'
import { HumanMessage, SystemMessage, AIMessage } from '@langchain/core/messages'
import { Response } from 'express'
import { config } from '../config'

@Injectable()
export class MemoryService {
  private llm = new ChatOllama({
    model: config.ollama.chatModel,
    baseUrl: config.ollama.baseUrl,
    temperature: config.ollama.temperature,
  })

  // 会话记录本：sessionId -> 消息数组
  private sessions = new Map<string, any[]>()

  // ---------- 基础：获取某条会话的历史（没有就新建） ----------
  getHistory(sessionId: string): any[] {
    if (!this.sessions.has(sessionId)) {
      // 新会话默认塞一条系统提示词，限定角色
      this.sessions.set(sessionId, [
        new SystemMessage('你是一个智能客服助手，请结合前面的对话上下文回答用户问题。'),
      ])
    }
    return this.sessions.get(sessionId)!
  }

  // ---------- 1. 多轮对话（带记忆） ----------
  async chat({ sessionId, message }: { sessionId: string; message: string }) {
    const history = this.getHistory(sessionId)

    // 把"本次问题"追加进历史，然后整段提交
    history.push(new HumanMessage(message))
    const response = await this.llm.invoke(history)

    // 把"本次回答"也追加进历史 → 下一轮它就在上面了
    history.push(response)

    return {
      sessionId,
      question: message,
      answer: response.content,
      historyMessages: history.length, // 当前历史共几条消息
    }
  }

  // ---------- 2. 多轮对话（带记忆 + 流式输出 SSE） ----------
  async chatStream(
    { sessionId, message }: { sessionId: string; message: string },
    res: Response,
  ) {
    const history = this.getHistory(sessionId)
    history.push(new HumanMessage(message))

    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')
    res.setHeader('Access-Control-Allow-Origin', '*')

    // 用 llm.stream 整段历史，返回的是"一个字一个字往外蹦"的片段流
    const stream = await this.llm.stream(history)
    let fullAnswer = ''
    for await (const chunk of stream) {
      const text = String(chunk.content)
      fullAnswer += text
      res.write(`data: ${JSON.stringify({ delta: text })}\n\n`)
    }
    res.write('data: [DONE]\n\n')
    res.end()

    // 流结束后，把完整回答补进历史 —— 否则下一轮"忘了自己刚说什么"
    history.push(new AIMessage(fullAnswer))
  }

  // ---------- 3. 查看指定会话的全部历史 ----------
  listHistory(sessionId: string) {
    const history = this.getHistory(sessionId)
    return {
      sessionId,
      messages: history.map((m) => ({
        // 把 LangChain 消息对象转成普通人能看的结构
        role: m.constructor?.name, // 如 HumanMessage / AIMessage / SystemMessage
        content: String(m.content),
      })),
    }
  }

  // ---------- 4. 清空某条会话的记忆 ----------
  clear(sessionId: string) {
    this.sessions.delete(sessionId)
    return { sessionId, success: true, message: '记忆已清空' }
  }

  // ---------- 5. 列出所有会话 ----------
  listSessions() {
    return { sessions: [...this.sessions.keys()] }
  }
}
```

### 3. 路由：`memory.controller.ts`

```typescript
import { Body, Controller, Delete, Get, Post, Query, Res } from '@nestjs/common'
import { Response } from 'express'
import { MemoryService } from './memory.service'

@Controller('memory')
export class MemoryController {
  constructor(private readonly memoryService: MemoryService) {}

  // POST /memory/chat
  @Post('chat')
  chat(@Body() body: { sessionId?: string; message: string }) {
    // 缺省用固定演示会话，方便前端不传 sessionId
    return this.memoryService.chat({
      sessionId: body.sessionId || 'demo',
      message: body.message,
    })
  }

  // POST /memory/chat-stream
  @Post('chat-stream')
  chatStream(@Body() body: { sessionId?: string; message: string }, @Res() res: Response) {
    return this.memoryService.chatStream(
      { sessionId: body.sessionId || 'demo', message: body.message },
      res,
    )
  }

  // GET /memory/history?sessionId=demo
  @Get('history')
  history(@Query('sessionId') sessionId = 'demo') {
    return this.memoryService.listHistory(sessionId)
  }

  // DELETE /memory/clear?sessionId=demo
  @Delete('clear')
  clear(@Query('sessionId') sessionId = 'demo') {
    return this.memoryService.clear(sessionId)
  }

  // GET /memory/sessions
  @Get('sessions')
  sessions() {
    return this.memoryService.listSessions()
  }
}
```

### 4. 注册模块：`memory.module.ts`

```typescript
import { Module } from '@nestjs/common'
import { MemoryController } from './memory.controller'
import { MemoryService } from './memory.service'

@Module({
  controllers: [MemoryController],
  providers: [MemoryService],
})
export class MemoryModule {}
```

最后在 `app.module.ts` 的 `imports` 数组里加上 `MemoryModule`：

```typescript
imports: [
  // ...其他模块
  MemoryModule,
],
```

## 四、用 Apifox 验证"记忆"真的生效

核心测试：**同一 sessionId 连续问两轮**，看第二轮它是否记得第一轮的信息。

### 测试一：建立记忆

```
POST /memory/chat
{ "sessionId": "demo", "message": "请记住，我的名字叫小红" }
```

返回（节选）：
```json
{
  "sessionId": "demo",
  "answer": "你好，小红！我记住了你的名字。",
  "historyMessages": 3
}
```

### 测试二：靠记忆回答（关键一步）

```
POST /memory/chat
{ "sessionId": "demo", "message": "我叫什么名字？" }
```

返回：
```json
{
  "sessionId": "demo",
  "answer": "你的名字叫小红！",
  "historyMessages": 5
}
```

**能看到"小红"+全程没在第二次请求里提名字**，就说明记忆生效了。

### 测试三：换个 sessionId = 失忆

```
POST /memory/chat
{ "sessionId": "other", "message": "我叫什么名字？" }
```

返回类似"我不知道/我们没有聊过名字"——因为换了新记录本，历史是空的。

### 测试四：查看 / 清空

```
GET  /memory/history   →  能看到完整对话记录
DELETE /memory/clear   →  清空后再问，又"失忆"了
```

```mermaid
flowchart LR
    A[第1问: 记住我叫小红] --> H[(会话记录本)]
    H --> B[invoke 历史+新问题]
    B --> C[第2问: 我叫什么]
    C --> H
    H --> D[invoke 完整历史]
    D --> E[答: 你叫小红 ✅]
    F[换 sessionId] --> G[新的空记录本]
    G --> E2[答: 不知道 ❌]
```

## 五、真实业务里会怎么用？

上面用 `Map` 存历史，重启服务就丢了，所以真实项目会分三层：

```mermaid
flowchart TD
    subgraph 前端
        F[浏览器 / 小程序 会话框]
    end
    subgraph 后端
        S[NestJS 接口]
        DB[(数据库: Redis / MySQL<br/>按 userId 存历史)]
    end
    subgraph 模型
        M[Ollama 大模型]
    end
    F -->|问一句| S -->|查历史+新问题| M
    M -->|回答| S -->|写回历史| DB
    DB --> S
    S --> F
```

- **Redis**：会话历史是高频读写、带过期时间（比如 24h 无操作自动清空），非常适合存 Redis；
- **MySQL / PostgreSQL**：要长期沉淀、按用户查询统计时，存关系型数据库；
- 无论存哪，**思路都是上面那套**：取历史 → 拼上新问题 → 提交 → 把回答写回历史。

::: tip 一句话总结
大模型的记忆不是模型自带的，而是**后端帮它存的对话历史**。核心代码就三行：读历史、提交历史+新问题、写回历史。
:::

下一篇，我们来解决大模型更严重的问题——**幻觉**（一本正经地胡说八道），这就是 [RAG 检索增强](/articles/nestjs-langchain-rag)。