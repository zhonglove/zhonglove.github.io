---
title: NestJS + LangChain 大模型应用开发实战
description: 前端开发者转大模型开发的完整入门课。从安装 LangChain、调用本地大模型，到提示词工程、链式调用、智能体 Agent 一步步写出可用的 AI 接口。
---

# NestJS + LangChain 大模型应用开发实战

> **适合人群**：熟悉 JS / TS / Vue / React，想转大模型应用开发的前端开发者
> **目标**：在 NestJS 项目里接入 LangChain，从"调用大模型"到"智能体 Agent"一步步写出真实的 AI 业务接口
> **技术栈**：NestJS + @langchain/ollama + Ollama（本地部署 qwen3.5:0.8b，免费）

## 一、为什么前端转大模型开发有优势

先看一张图，这是 LangChain 提供的完整模块全景——你接下来要学的就是它们：

![LangChain 七大模块全景](/images/nestjs-langchain/langchain-official.png)

LangChain 官网（[langchain.com](https://www.langchain.com/)）同时支持 **Python 和 TypeScript** 两种语言：

![LangChain 官网支持 Python / TypeScript](/images/nestjs-langchain/langchain-framework.png)

对前端开发者来说，这是巨大的优势：

- **JS / TS 你已经会了**，直接上手 LangChain，不需要学新语言
- 很多著名 AI 项目都是 TypeScript 写的，例如开源社区的 Claude 代码分析工具，源码几乎全是 `.ts` 后缀：

![开源 AI 项目的源码几乎都是 TS](/images/nestjs-langchain/claude-source-ts.png)

::: tip 一句话
前端转大模型开发，不是从零开始，而是把已有的 JS/TS 能力迁移到新场景。企业里要的是**能干活**，本课程的重点就是**写代码、跑通、演示**，每一个接口都能跑起来看到效果。
:::

## 二、安装 LangChain 依赖

### 1. 大模型从哪里来？

调用大模型有两种方式：

| 方式 | 说明 | 成本 |
| --- | --- | --- |
| 云 API | 注册 DeepSeek、OpenAI 等，创建 API Key | 按量收费 |
| 本地 Ollama | 把模型部署到本地电脑 | 免费，但对电脑配置要求高 |

本课程用 **Ollama 本地部署**：拉取一个体积很小的 `qwen3.5:0.8b`（约 1GB）对话模型，再拉一个 `mxbai-embed-large`（约 669MB）向量化模型（RAG 检索用）。

```bash
ollama pull qwen3.5:0.8b        # 对话模型
ollama pull mxbai-embed-large   # 向量化模型（RAG 用）

ollama list                     # 查看已安装的模型
```

### 2. 安装 LangChain 相关包

在项目根目录依次安装（`pnpm` 安装方式，不影响已有依赖）：

```bash
# 核心：LangChain Ollama 集成包（调用本地大模型）
pnpm install @langchain/ollama

# 核心：LangChain 基础类型和接口（消息、模板、解析器）
pnpm install @langchain/core

# 核心：LangChain 社区集成包（向量存储等）
pnpm install @langchain/community

# 文本分块器（RAG 用）
pnpm install @langchain/textsplitters

# LangChain 主包
pnpm install langchain

# 参数校验（Agent 工具 / Function Calling 用）
pnpm install zod
```

安装完成后，`package.json` 里会多出这些依赖：

![package.json 中的 LangChain 依赖](/images/nestjs-langchain/package-deps.png)

### 3. 全局配置

新建 `src/config.ts`，把可变参数集中管理，以后换模型只改这一个文件：

```typescript
export const config = {
  ollama: {
    // Ollama 服务地址
    baseUrl: 'http://localhost:11434',
    // 对话模型
    chatModel: 'qwen3.5:0.8b',
    // 向量化模型（RAG 用）
    embedModel: 'mxbai-embed-large',
    // 温度：0 = 最保守，1 = 最随机
    temperature: 0.3,
  },
}
```

### 4. 生成模块

```bash
nest g module models
nest g controller models
nest g service models

nest g module prompts
nest g controller prompts
nest g service prompts

nest g module chains
nest g controller chains
nest g service chains

nest g module agents
nest g controller agents
nest g service agents
```

后续每个模块我们都按 **service（业务逻辑）→ controller（路由）** 的顺序写。

## 三、Models — 统一对接大模型

`models` 是整个体系最基础的部分：**把调用大模型抽象成统一接口**。不用 LangChain 时，每家模型 API 格式都不一样，换模型要大改代码；用了 LangChain，统一用 `.invoke()` / `.stream()`，换模型只改一行构造参数。

### 方式一：基础调用（等完整回答）

在 `models.service.ts` 里创建模型实例：

```typescript
import { ChatOllama } from '@langchain/ollama'
import { HumanMessage } from '@langchain/core/messages'
import { config } from '../config'

@Injectable()
export class ModelsService {
  // 创建 ChatOllama 实例（整个 Service 共用一个）
  private llm = new ChatOllama({
    model: config.ollama.chatModel,
    baseUrl: config.ollama.baseUrl,
    temperature: config.ollama.temperature,
  })

  async basicChat(message: string) {
    const response = await this.llm.invoke([
      new HumanMessage(message), // 用户消息
    ])
    return {
      question: message,
      answer: response.content,      // 模型回答的文字
      usage: response.usage_metadata, // token 消耗统计
    }
  }
}
```

Controller 对应路由：

```typescript
@Controller('models')
export class ModelsController {
  constructor(private readonly modelsService: ModelsService) {}

  @Post('chat')
  basicChat(@Body() { message }: { message: string }) {
    return this.modelsService.basicChat(message)
  }
}
```

用 Apifox 测试 `POST /models/chat`：

![基础问答效果](/images/nestjs-langchain/models-chat.png)

### 方式二：设定系统提示词

就像提问前先告诉模型"你是教育领域的专家"一样，用 `SystemMessage` 限定角色，把它变成**垂直领域的大模型**：

```typescript
async chatSystem(system: string, message: string) {
  const response = await this.llm.invoke([
    new SystemMessage(system),  // 系统提示（角色设定）
    new HumanMessage(message),  // 用户问题
  ])
  return {
    system,
    question: message,
    answer: response.content,
    usage: response.usage_metadata,
  }
}
```

测试 `POST /models/chat-system`，传入 `{ "system": "你是教育领域的专家", "message": "什么是 Vuex？" }`：

![带系统提示词的问答效果](/images/nestjs-langchain/models-chat-system.png)

::: tip 卡顿怎么办？
本地小模型偶尔会很慢。可以在创建模型实例时关闭"思考模式"、限制输出长度：

```typescript
private llm = new ChatOllama({
  model: config.ollama.chatModel,
  temperature: config.ollama.temperature,
  baseUrl: config.ollama.baseUrl,
  think: false,   // 忽略推理过程
  numPredict: 521 // 不让生成太多 token
})
```
:::

### 方式三：流式输出（SSE）

真实业务里，接口返回**不可能是等一整段 JSON**，而是像 ChatGPT 那样一个字一个字蹦出来。这就要用 **SSE（Server-Sent Events）事件流**：

```typescript
import { Response } from 'express'

async chatStream({ message }: { message: string }, res: Response) {
  // 设置事件流响应头
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.setHeader('Access-Control-Allow-Origin', '*')

  // stream 返回一个异步生成器，每次产出一个文字片段
  const stream = await this.llm.stream([new HumanMessage(message)])

  // 逐个片段写入响应体
  for await (const chunk of stream) {
    res.write(`data: ${JSON.stringify(chunk)}\n\n`)
  }
  // 结束标记，前端据此判断流结束
  res.write('data: [DONE]\n\n')
  res.end()
}
```

Controller 需要用 `@Res()` 直接拿到响应对象：

```typescript
@Post('chat-stream')
chatStream(@Body() { message }: { message: string }, @Res() res: Response) {
  return this.modelsService.chatStream({ message }, res)
}
```

测试 `POST /models/chat-stream`（Apifox 里把响应类型设为 Event Stream）：

![SSE 流式输出效果](/images/nestjs-langchain/models-chat-stream.png)

这就是 ChatGPT"打字机"效果的底层原理：每个 `data:` 就是一个 chunk。

### 方式四：pipe 链 + 输出解析器

直接 `invoke` 返回的是一个 `AIMessage` 对象，里面除了文字还有一堆元数据：

```typescript
const response = await this.llm.invoke([new HumanMessage('你好')])
console.log(response)
// AIMessage {
//   content: '你好！有什么我可以帮你的？',
//   response_metadata: { model: 'qwen3.5:0.8b', ... },
//   usage_metadata: { input_tokens: 5, output_tokens: 12 },
//   ...
// }
// 要拿文字必须手动取 .content
```

很多场景我们只需要纯字符串。用 `pipe(new StringOutputParser())` 把它变成一条"管道链"：

```typescript
import { StringOutputParser } from '@langchain/core/output_parsers'

async chatParser(message: string) {
  // 把模型和解析器用 pipe 串联
  const chain = this.llm.pipe(new StringOutputParser())
  const answer = await chain.invoke([new HumanMessage(message)])
  // answer 直接是字符串
  return { question: message, answer }
}
```

pipe 的语义就是：**上一步的输出作为下一步的输入**。

```mermaid
flowchart LR
    A[prompt 模板] -->|格式化消息| B[llm 大模型]
    B -->|AIMessage| C[StringOutputParser]
    C -->|纯字符串| D[最终结果]
```

测试 `POST /models/chat-parser`：

![pipe 链调用效果](/images/nestjs-langchain/models-chat-parser.png)

## 四、Prompts — 可复用提示词工程

提示词模板的价值：**同一类任务的结构固定，只有变量不同**。手动拼字符串容易拼错、无法复用，模板化之后自动替换占位符。

```typescript
// 手动拼字符串（不推荐）：
const prompt = `把"${text}"翻译成${lang}`

// ChatPromptTemplate（推荐）：
const template = ChatPromptTemplate.fromMessages([
  ['system', '你是翻译专家'],
  ['human', '把"{text}"翻译成{lang}'],
])
await template.invoke({ text: 'Hello', lang: '中文' })
// {text} 和 {lang} 是占位符，自动替换
```

### 1. 多消息对话模板：翻译（最常用）

```typescript
import { ChatPromptTemplate } from '@langchain/core/prompts'

async translate(text: string, targetLanguage: string) {
  const prompt = ChatPromptTemplate.fromMessages([
    ['system', '你是一个翻译助手，只输出翻译结果，帮助用户将文本翻译成指定语言。'],
    ['user', `请把以下的内容翻译成${targetLanguage}：${text}`],
  ])
  // 三步串成链：模板 → 模型 → 解析器
  const chain = prompt.pipe(this.llm).pipe(new StringOutputParser())
  const result = await chain.invoke({ text, targetLanguage })
  return { original: text, translation: result }
}
```

测试 `POST /prompts/translate`：

![翻译效果](/images/nestjs-langchain/prompts-translate.png)

### 2. 单消息简单模板：文章总结

```typescript
import { PromptTemplate } from '@langchain/core/prompts'

async summarize(text: string, maxWords: number) {
  const prompt = PromptTemplate.fromTemplate(
    `请把以下的内容总结成不超过${maxWords}个字的版本：${text}`
  )
  const chain = prompt.pipe(this.llm).pipe(new StringOutputParser())
  const result = await chain.invoke({ text, maxWords })
  return { original: text, maxWords, summary: result }
}
```

测试 `POST /prompts/summarize`：

![文章总结效果](/images/nestjs-langchain/prompts-summarize.png)

### 3. 少样本学习模板：情感分类

业务里最常见的需求：**根据用户评价分类成正面 / 负面**。不用解释规则，给模型几个例子它就学会了输出格式，这就是 Few-Shot：

```typescript
import { FewShotPromptTemplate, PromptTemplate } from '@langchain/core/prompts'

async classify(text: string) {
  // 预先给的样本
  const examples = [
    { text: '今天天气真好，我们去公园玩吧', label: '积极' },
    { text: '我讨厌这个产品，太差了', label: '消极' },
    { text: '这个电影还行，有些地方不错', label: '中立' },
    { text: '这很失望，我不会买了', label: '消极' },
  ]
  // 单个样本的格式
  const examplePrompt = PromptTemplate.fromTemplate('输入：{text}\n 输出：{label}')

  const fewShotPrompt = new FewShotPromptTemplate({
    examples,          // 样本数据
    examplePrompt,     // 样本格式
    prefix: '请根据输入的文本内容进行情感分类，输出积极、消极或中立', // 前缀
    suffix: '输入：{text}\n 输出：', // 后缀（真实问题）
    inputVariables: ['text'],
  })

  const formattedPrompt = await fewShotPrompt.format({ text })
  const res = await this.llm.invoke(formattedPrompt)
  return { text, label: res.content }
}
```

测试 `POST /prompts/classify`：

![情感分类效果](/images/nestjs-langchain/prompts-classify.png)

### 4. 代码审查

让大模型当你的代码评审专家，找出 bug 和改进建议：

```typescript
async codeReview(code: string, language: string) {
  const prompt = ChatPromptTemplate.fromMessages([
    ['system', '你是一个资深{language}代码审查助手，帮助用户找出代码中的错误和改进建议。'],
    ['human', '请帮我审查一下的 {language} 代码，并指出其中的错误和改进建议：\n{code}'],
  ])
  const chain = prompt.pipe(this.llm).pipe(new StringOutputParser())
  const result = await chain.invoke({ code, language })
  return { language, code, review: result }
}
```

测试 `POST /prompts/code-review`：

![代码审查效果](/images/nestjs-langchain/prompts-code-review.png)

## 五、Chains — 链式调用

Chain 把多个步骤串联成流水线，每步输出作为下步输入。核心区别：

- **Chain = 工厂流水线**：步骤提前写死，自动执行，适合固定工作流
- **Agent = 聪明员工**：自己决定做什么、做几步

```mermaid
flowchart LR
    subgraph Chain["Chain 固定流水线"]
        A1[用户] --> A2[步骤1 写死] --> A3[步骤2 写死] --> A4[步骤3 写死] --> A5[结束]
    end
    subgraph Agent["Agent 自主决策"]
        B1[用户说什么] --> B2[模型思考] --> B3{决定调哪个工具}
        B3 --> B4[调工具A] --> B2
        B3 --> B5[最终回答]
    end
```

### 1. 多步骤链：文章润色（RunnableSequence）

"分析 → 润色"两步：先用模型分析出文章问题，再把问题和原文一起交给模型润色。

```typescript
import { RunnableSequence, RunnablePassthrough } from '@langchain/core/runnables'

async polish(article: string) {
  const analysisPrompt = ChatPromptTemplate.fromMessages([
    ['system', '你是一个文章分析助手，只输出问题列表，不要其他的内容。'],
    ['human', '分析这篇文章存在的问题：{article}'],
  ])
  const polishPrompt = ChatPromptTemplate.fromMessages([
    ['system', '你是一个文章润色助手，根据输出的问题列表对文章进行润色，改进文章的表达、结构、用词等方面。'],
    ['human', '请根据以下分析结果润色这篇文章：{analysis}，文章内容是：{article}'],
  ])

  // 第一步：article → 分析 → analysis 字符串
  const analysisChain = analysisPrompt.pipe(this.llm).pipe(new StringOutputParser())

  // 第二步：保留原文 + 调用分析链 → 润色
  const fullChain = RunnableSequence.from([
    {
      article: new RunnablePassthrough(), // 原文原样透传给下一步
      analysis: analysisChain,            // 并行执行分析链
    },
    polishPrompt.pipe(this.llm).pipe(new StringOutputParser()),
  ])

  const result = await fullChain.invoke({ article })
  return { original: article, polish: result }
}
```

测试 `POST /chains/polish`：

![文章润色（多步骤链）效果](/images/nestjs-langchain/chains-polish.png)

### 2. 顺序链：博客生成（关键词 → 大纲 → 文章 → SEO 标题）

上一步的输出作为下一步的输入，一步步来，逻辑最清晰：

```typescript
async generateBlog(keywords: string, style: string) {
  const outlinePrompt = ChatPromptTemplate.fromMessages([
    ['system', '你是一个博客大纲生成助手，根据用户提供的关键词和风格要求生成一篇博客文章大纲。'],
    ['human', '请根据以下关键词和风格要求生成一篇博客文章大纲。关键词：{keywords}，风格：{style}'],
  ]).pipe(this.llm).pipe(new StringOutputParser())

  const articlePrompt = ChatPromptTemplate.fromMessages([
    ['system', '你是一个博客文章生成助手，根据用户提供的大纲和风格要求生成一篇博客文章。'],
    ['human', '请根据以下大纲和风格要求生成一篇博客文章。博客大纲：{outline}'],
  ]).pipe(this.llm).pipe(new StringOutputParser())

  const seoTitlePrompt = ChatPromptTemplate.fromMessages([
    ['system', '你是一个博客文章seo标题生成助手，根据文章内容生成3个seo标题。'],
    ['human', '请根据以下文章内容生成3个seo标题。博客文章内容：{article}'],
  ]).pipe(this.llm).pipe(new StringOutputParser())

  // 顺序执行：关键词 → 大纲 → 文章 → SEO 标题
  const outline = await outlinePrompt.invoke({ keywords, style })
  const article = await articlePrompt.invoke({ outline })
  const seoTitles = await seoTitlePrompt.invoke({ article })

  return { keywords, style, outline, article, seoTitles }
}
```

```mermaid
flowchart LR
    A[关键词 keywords] --> B[大纲 outline]
    B --> C[文章 article]
    C --> D[SEO 标题]
```

测试 `POST /chains/blog`：

![博客生成（顺序链）效果](/images/nestjs-langchain/chains-blog.png)

### 3. 条件链：智能客服路由

根据问题类型，路由到不同的"专家"去回答，类似智能客服转接：

```typescript
async smartRouter(question: string) {
  // 第一步：分类（只输出分类标签）
  const routerPrompt = ChatPromptTemplate.fromMessages([
    ['system', `分析用户的问题，只输出分类标签：
技术问题-TECH
退款问题-REFUND
订单问题-ORDER
投诉建议-SUGGESTION
其他-OTHERS`],
    ['human', '{question}'],
  ]).pipe(this.llm).pipe(new StringOutputParser())

  const category = await routerPrompt.invoke({ question })

  // 第二步：根据分类选择对应的角色
  const systemMap: Record<string, string> = {
    TECH: '你是一个技术支持助手，帮助用户解决技术问题。',
    ORDER: '你是一个订单助手，帮助用户管理订单。',
    REFUND: '你是一个退款助手，帮助用户处理退款。',
    SUGGESTION: '你是一个投诉建议助手，帮助用户提交投诉建议。',
    OTHERS: '你是一个其他助手，帮助用户处理其他问题。',
  }
  const systemMessage = systemMap[category] || systemMap.OTHERS

  // 第三步：带着分类角色回答
  const answerPrompt = ChatPromptTemplate.fromMessages([
    ['system', systemMessage],
    ['human', '{question}'],
  ]).pipe(this.llm).pipe(new StringOutputParser())

  const answer = await answerPrompt.invoke({ question })
  return { question, category, answer }
}
```

```mermaid
flowchart LR
    Q[用户问题] --> C{分类}
    C -->|TECH| T[技术助手]
    C -->|REFUND| R[退款助手]
    C -->|ORDER| O[订单助手]
    C -->|SUGGESTION| S[投诉建议助手]
    C -->|OTHERS| X[通用助手]
    T & R & O & S & X --> A[最终回答]
```

测试 `POST /chains/router`：

![条件链（客服路由）效果](/images/nestjs-langchain/chains-router.png)

## 六、Agents — 智能代理（课程重点）

### 1. Agent 是什么

之前讲的 Chain 步骤都是写死的。Agent 不一样：**流程不写死，模型根据用户的意图，自己决定调用哪个工具、调用几次**。

```plain
用户：「我叫张三，帮我买一台 MacBook Pro」

Agent 自主决策流程：
  思考：用户想购买，但我需要先确认商品是否有货
  行动：调用 check_product → 「MacBook Pro 有货，¥10000」
  思考：有货，用户已报名字，可以直接下单
  行动：调用 create_order → 「订单 ORD-960000 创建成功」
  思考：任务完成，给用户完整答复
  输出：「张三您好！MacBook Pro 有货已下单，订单号 ORD-960000」
```

同样是"查库存再下单"，用 Chain 必须把两步写死；换成"查订单状态"，Chain 就跑不通了。而 Agent 同一套代码，可以灵活处理查库存、下单、查订单、退款等多种意图。

### 2. 定义工具：tool() + zod

工具就是**把普通的 JS 函数包装成模型能识别的格式**。`tool()` 的每个参数都有讲究：

- `name`：工具名称（模型据此决定何时调用）
- `description`：工具描述（**模型据此理解这个工具能干什么，写清楚很关键**）
- `schema`：参数定义（zod 格式，告诉模型调用时要传什么参数）

```typescript
import { tool } from '@langchain/core/tools'
import { z } from 'zod'

// 工具1：查询商品库存和价格
private checkProductTool = tool(
  ({ productName }: { productName: string }) => {
    const products: Record<string, { stock: number; price: number; category: string }> = {
      'iPhone 18': { stock: 10, price: 7999, category: '手机' },
      'MacBook Pro': { stock: 5, price: 10000, category: '电脑' },
      'AirPods Pro': { stock: 20, price: 2000, category: '耳机' },
    }
    const product = products[productName]
    if (!product) return `商品${productName}不存在`
    return `商品${productName}的库存是${product.stock}，价格是${product.price}，属于${product.category}`
  },
  {
    name: 'check_product',
    description: '查询商品库存和价格工具，输入参数的商品名字，输出是一个字符串，包含商品的库存和价格信息',
    schema: z.object({
      productName: z.string().describe('商品的名字，例如：iPhone 18、AirPods Pro等。'),
    }),
  },
)

// 工具2：创建订单
private createOrderTool = tool(
  ({ productName, quantity, customerName }: { productName: string; quantity: number; customerName: string }) => {
    const prices: Record<string, number> = {
      'iPhone 18': 7999,
      'MacBook Pro': 10000,
      'AirPods Pro': 2000,
    }
    const unitPrice = prices[productName] ?? 0
    const totalPrice = quantity * unitPrice
    if (!unitPrice) return `商品${productName}不存在`
    const orderId = `ORDER-${Date.now().toString().slice(-6)}`
    return `订单${orderId}创建成功，商品${productName}，数量${quantity}，客户${customerName}，总价${totalPrice}`
  },
  {
    name: 'create_order',
    description: '创建订单工具，输入参数的商品名字、数量和客户姓名，输出是一个字符串，包含订单的信息',
    schema: z.object({
      productName: z.string().describe('要创建订单的商品名字'),
      quantity: z.number().describe('要创建订单的商品数量'),
      customerName: z.string().describe('要创建订单的客户姓名'),
    }),
  },
)

// 工具3：查询订单状态
private checkOrderTool = tool(
  ({ orderId }: { orderId: string }) => {
    const statuses = ['已支付', '已发货', '已收货', '已完成', '已取消']
    const status = statuses[Math.floor(Math.random() * statuses.length)]
    return `查询${orderId}的状态，订单状态是：${status}`
  },
  {
    name: 'check_order_status',
    description: '查询订单状态工具，输入参数的订单id，输出是一个字符串，包含订单的状态',
    schema: z.object({
      orderId: z.string().describe('要查询订单状态的订单id，例如：ORDER-123456。'),
    }),
  },
)
```

### 3. Agent 核心执行逻辑

```typescript
async runAgent(userMessage: string) {
  const tools = [this.checkProductTool, this.createOrderTool, this.checkOrderTool]

  // 工具名 → 工具实例 的映射表
  const toolMap: Record<string, any> = {
    check_product: this.checkProductTool,
    create_order: this.createOrderTool,
    check_order_status: this.checkOrderTool,
  }

  // bindTools：把工具列表注册到模型
  // 注册后，模型回复里会带 tool_calls 字段（当它决定调用工具时）
  const llmWithTools = this.llm.bindTools(tools)

  // 消息历史：Agent 每一轮都能看到完整的对话 + 工具结果
  const messages: any[] = [new HumanMessage(userMessage)]

  // 记录每步执行过程（用于前端展示 / 演示）
  const steps: string[] = []

  // Agent 循环：最多 6 轮，防止死循环
  let roundCount = 0
  while (roundCount < 6) {
    roundCount++
    const response = await llmWithTools.invoke(messages)
    messages.push(response) // 模型回复加入历史

    // tool_calls 为空 → 模型有了最终答案，退出循环
    if (!response.tool_calls || response.tool_calls.length === 0) {
      steps.push(`💬 [最终回答] ${response.content}`)
      break
    }

    // 模型决定调用工具，逐个执行
    for (const toolCall of response.tool_calls) {
      steps.push(`🔧 [调用工具] ${toolCall.name}(${JSON.stringify(toolCall.args)})`)
      const toolFn = toolMap[toolCall.name]
      const toolResult = await toolFn.invoke(toolCall.args)
      steps.push(`✅ [工具结果] ${toolResult}`)

      // 把工具结果加入消息历史，模型下一轮看到后再决定下一步
      messages.push(
        new ToolMessage({ content: String(toolResult), tool_call_id: toolCall.id }),
      )
    }
  }

  // 取最后一条 AI 消息作为最终回答
  const lastAI = [...messages].reverse().find(m => m instanceof AIMessage)
  return {
    userMessage,
    steps,             // 完整的"思考-行动"过程
    totalRounds: roundCount,
    answer: lastAI?.content ?? '抱歉，暂时无法处理您的请求',
  }
}
```

```mermaid
flowchart TD
    U[用户提问] --> L1[模型思考]
    L1 -->|决定调用工具| T[执行工具并拿结果]
    T --> L2[模型再看结果]
    L2 -->|还需要工具| T
    L2 -->|有答案了| F[输出最终回答]
```

测试 `POST /agents/run`，输入 `{ "message": "我叫张三，帮我买一台 MacBook Pro" }`，返回的 `steps` 数组里能看到 Agent 完整的决策过程：**先自己判断要查库存 → 调 check_product → 看到有货 → 再调 create_order → 输出最终答复**，整个顺序代码里没有写死，全是模型自主决定的。

## 七、系列导航：下半场还有四篇

回顾整条主线，你已经掌握了：

| 模块 | 解决什么问题 | 关键 API |
| --- | --- | --- |
| Models | 统一对接大模型 | `ChatOllama` / `.invoke()` / `.stream()` |
| Prompts | 提示词模板化复用 | `ChatPromptTemplate` / `PromptTemplate` / `FewShotPromptTemplate` |
| Chains | 固定流程串联 | `pipe()` / `RunnableSequence` / `RunnablePassthrough` |
| Agents | 模型自主决策调用工具 | `tool()` + `zod` / `bindTools()` / `ToolMessage` |

::: tip 本系列完整目录
| 篇目 | 链接 | 一句话内容 |
| --- | --- | --- |
| 基础篇（本篇） | [NestJS + LangChain 集成与基础](/articles/nestjs-langchain-ai-app) | 安装、Models、Prompts、Chains、Agents |
| 记忆篇 | [Memory 多轮对话记忆](/articles/nestjs-langchain-memory) | 让模型"记住上文"，真实业务如何持久化 |
| 检索篇 | [RAG 检索增强](/articles/nestjs-langchain-rag) | 先翻书再回答，解决幻觉，核心组件详解 |
| 存储篇 | [三种向量存储方案与 pgvector](/articles/nestjs-langchain-vectorstore) | Memory/PGVector/Chroma + 建表检索 + 维度 |
| 工具篇 | [Function Calling 与测试汇总](/articles/nestjs-langchain-function-calling) | 自然语言转结构化函数参数 + 全接口测试表 |
:::

::: tip 学习思路
看懂视频和亲手实操完全是两回事——实操会碰到各种问题，问题都有解，可以丢给 AI 帮忙。核心是**坚持学下去、把项目跑起来**。在 AI 时代，要有全流程的软件开发思维，不要只聚焦业务功能，**项目的部署和上线才是最核心的能力**。
:::
