# 大模型技术栈解析

AI 在前端领域落地和我们前端到底有什么关系？有没有关系？我给大家彻底的讲清楚 AI 前端领域，整个我们应该掌握的一些技能。

最近看到好多人说 AI 代替前端，给大家传播这种焦虑。我们做前端的，你不能一直待在你的舒适区，因为在变化，所以说我们也要变好。在 AI 与大前端融合的时代，我们遇到瓶颈，瓶颈怎么突破？

你可能说 AI 很火，对于我们前端来说，可能就是调一下 AI 的接口吗？简简单单写个页面吗？那就大错特错了。

前端领域再结合 AI，我们应该掌握什么样的一个技能？可以打开 boss，比如一线大厂看一下，他们对这种 AI 大前端领域的岗位要求。

## 基础核心

基础的知识，基础的核心：

- 数据结构与算法（大学里学的）
- 计算机网络
- 操作系统

这是程序员的根，你的逻辑思维能力、分析问题解决问题能力。它其实是要专业的知识长时间沉淀，这是核心。不管做前端/后端/大模型也好，不管是研发还是应用层，这些东西是一个核心。

## 前端核心

前端相关的，我们应该掌握什么？

- React18+（状态库：zustand，jotai 业界流行的库）
- Vue3（状态库：pinia，老项目：vuex）
- 跨端方向，Electron（底层 nodejs 写的）、tauri2（底层 rust 写的）
- UI 组件库，现在在 AI 的趋势下，推荐：shadcn/ui，tailwindcss、unocss
- 工程化架构方案，pnpm，多包管理 monorepo
- 打包构建工具，webpack、rollup、esbuild、vite（推荐），也可字节的 rspack

tauri2 性能比 Electron 高，它相对于 Electron 更加轻量，更安全，性能更优，打完包提交更小。原来我们放的是 CSS in JS，现在交互方式变了。

## 后端核心

- react（next.js）、vue（nuxt.js）服务端渲染框架
- nestjs【推荐看一下】、express、koa
- 最关键，数据库存储，PostgreSQL
  - 它有数据持久层，orm，prisma【推荐】、typeORM
- 接口的规范，基本用 restful api，其他了解就行，graphQL api、grpc api、rpc api
- 认证，jwt【核心】、oauth2.0、openid、connect、认证授权方案

和技术栈强绑定的。nestjs 的生态是非常成熟的，可以看一下：https://nestjs.com/

包含了整个后端的开发，服务端开发所有的点，比如：要用 Controller、还要提供模型 model、还要提供拦截器，还有数据库相关的，可以用 Mongo，还有队列，还有日志，还有 cookie、还有这种请求，还有流的方式，文件上传，还有认证（JWT），还有 Graphql，微服务，中间件（Redis、MQ、Kafka、gRPC），这是我们整个后端的，它生态非常的全。

数据库，MySQL，MongoDB 它有一个问题，就是说你没写过 SQL 的话，很难去掌握，现在推荐 PostgreSQL，与之对应的有一个平台叫：[supabase](https://supabase.com/)，可以理解为 PostgreSQL 的一个低代码平台，因为你用户登录认证，redis 认证体系，oauth 认证，等等第三方授权。

## AI 应用开发

我们不是去研究大模型。

- 【最核心】编排能力（链式调用、图调用）
  - langchain、langgraph
  - mastrg
  - ragflow
- RAG，知识库检索
  - 向量数据库：chromaDB，milvus
- 【最核心】模型部署
  - ollama + qwen
- 模型微调
  - qwen 微调教程

我们是从实战角度，它不是说我们调一下大模型的接口就完事了，而流式的输出，打字机效果。

链式调用、图调用最核心的 2 个库，langchain、langgraph，其他了解就行。

RAG 它涉及到，因为大模型，我问大模型一个问题，这个问题它是发散的，可能我的大模型我要做垂类的训练。比如我要基于某些知识库去训练它，训练它我可能基于一些文档去训练，这些文档里面，那么你涉及到一些存储向量数据，这是我们常说的这里面向量数据库 chromaDB，milvus。

我们技术选型，这是业界也可以说是最佳实践。

模型部署，现在技术栈里面最流行的就是 [Ollama](https://ollama.com/)，可以部署千问模型，其他模型都可以。

基于 qwen3.5 本地部署，怎么去部署，怎么去掉用，还有就是向量数据库，[embedding](https://ollama.com/search?c=embedding)，我可以直接去定义去使用。

上面列的，都是企业真正做项目所涉及到的技术栈，不是理论，是实践的技术栈，基本要掌握。

## 了解概念（面试会问）

- 机器学习基础
- 深度学习基础
- 自然语言处理基础
- 计算机视觉基础
- 大模型应用开发
  - prompt engineering 提示词工程
  - 模型微调与定制化开发
  - 模型部署与优化

## 工程化 & DevOps

- git、github、gitlab 版本控制与协作平台
- pnpm monorepo 工程化架构方案
- CI/CD、基于 github actions、gitlab ci、jenkins 持续集成与持续部署工程
- Docker、docker compose、kubernetes(k8s)、k3s、minikube 容器化与编排技术

## 为什么学习 AI 对我们前端特别友好

可以看下 langchain 官网，是大模型的一个框架，大模型就 2 类语言：python 和 typescript。

![langchain TS](/images/ai-tech-stack/langchain-ts.png)

没有 java，go。

对于我们前端来说，做大模型应用开发，是非常容易上手的，也可以 ts 方式用，不需要学 py。openclaw 里面 88% 都是 ts 写的。

不要被网上的声音带偏了。焦虑完，你要努力，90% 的人它是不努力，它是焦虑。而且我们要知道学啥？按照上面路径去学习。

---

# 基于 Ollama 部署模型 - 1

应用层的东西怎么去开发的，我们主要是讲模型的部署。

因为我们传统意义上的模型，只是说简单的调一下接口，那么这种东西太 low 了。比如我们调一个 deepseek 接口，就配一下，调下接口。这种东西不叫 AI 应用开发，也不叫 AI Agent 开发。

重点：模型部署与调优。

## 安装 Ollama

现在业界通用的 [Ollama](https://ollama.com/)。

![Ollama 官网](/images/ai-tech-stack/ollama-install.png)

也可以用命令安装：

```shell
curl -fsSL https://ollama.com/install.sh | sh
```

![安装 1](/images/ai-tech-stack/ollama-install1.png)

![安装 2](/images/ai-tech-stack/ollama-install2.png)

判断是否安装好：

```shell
ollama --version
Warning: could not connect to a running Ollama instance
Warning: client version is 0.9.5
```

## 部署模型

要根据电脑配置进行选，选了个占用内存小的模型：

https://ollama.com/library/qwen3.5

![qwen 模型页面](/images/ai-tech-stack/qwen-model.png)

拉取模型：

```shell
ollama pull qwen3.5:0.8b
```

![pull 模型](/images/ai-tech-stack/ollama-pull.png)

## 运行模型

```shell
ollama run qwen3.5:0.8b
> 你好
> 返回结果
```

模型部署，到这里就结束了。本地我们启动了千问模型，对外暴露的接口地址，默认端口：11434。

```shell
http://localhost:11434
> Ollama is running
```

我们也可以通过命令行形式，切换另一个命令窗口：

```shell
curl http://localhost:11434/api/generate -d '{
  "model": "qwen3.5:0.8b",
  "prompt": "解释一下什么是原型链"
}'
```

查看系统有哪些模型：

```shell
ollama ps
```

停止模型：

```shell
ollama stop qwen3.5:0.8b
```

删除模型：

```shell
ollama rm qwen3.5:0.8b
```

## 总结

模型部署与调优：`pull`（下载模型）→ `run`（运行）→ `ps`（查看）→ `stop`（停止）→ `rm`（删除模型）

Ollama 的模型管理分为四个阶段：

1. 通过 `pull` 完成模型的部署
2. 通过 `run` 启动推理实例
3. 通过 `ps` 管理运行状态
4. 通过 `stop` 或自动回收释放资源

cloud — 云端，不占内存。0.8b-2b，越大，占的内存越大。

大家要记住，ollama 一定要停止，你不停止，它还一直占用你的内存。

---

# 基于 Ollama 模型调优 - 2

## Ollama 模型调优参数总表（实操版）

| 参数名 | 类型 | 作用 | 调大效果 | 调小效果 | 推荐范围（0.8B） | 常见场景 |
|--------|------|------|---------|---------|----------------|---------|
| temperature | float | 控制随机性 | 更发散、更有创意、更容易胡编 | 更稳定、更保守 | 0.1 ~ 0.4 | 代码/问答 |
| top_p | float | 控制候选词概率范围 | 词汇更丰富、更开放 | 更保守、集中高概率词 | 0.7 ~ 0.9 | 通用 |
| top_k | int | 限制候选词数量 | 选择更多词 | 选择更少词（更稳定） | 20 ~ 50 | 辅助调优 |
| repeat_penalty | float | 防止重复输出 | 减少重复、避免复读 | 容易重复 | 1.05 ~ 1.2 | 长文本 |
| presence_penalty | float | 鼓励新内容 | 更容易换话题 | 更容易重复主题 | 0 ~ 0.6 | 创意写作 |
| frequency_penalty | float | 减少词频重复 | 控制用词重复 | 可能复读 | 0 ~ 0.5 | 文本优化 |
| num_predict | int | 最大生成长度 | 输出更长、耗时增加 | 输出更短 | 100 ~ 300 | 所有场景 |
| num_ctx | int | 上下文长度（记忆） | 记更多内容、占资源 | 容量变小 | 2048 | 小模型固定 |
| stop | array | 停止生成条件 | 控制输出结束 | 无控制 | 按需设置 | 格式控制 |
| seed | int | 随机种子（复现） | 固定输出（可复现） | 每次不同 | 任意 | 测试/对比 |

- **temperature**：温度，控制随机性，不同模型有推荐范围，值越小越稳定，值越大越发散。
- **top_p**：控制候选词概率范围，让模型回答问题更保守还是更发散。
- **top_k**：辅助调优。
- **repeat_penalty**：防止重复输出，减少重复的输入。
- **presence_penalty**：鼓励是不是要写作，不同场景值设置有一些推荐量。
- **num_predict**：控制输出的文本的长短，控制输出内容多少。
- **num_ctx**：模型的记忆功能，可以设置它的容量。

**控制"胡不胡说"**：temperature、top_p、top_k

**控制"复不复读"**：repeat_penalty、frequency_penalty

**控制"长不长"**：num_predict

**控制"记不记得住"**：num_ctx

### 推荐默认配置

#### 稳定通用版

```json
{
  "temperature": 0.2,       // 低温度，输出稳定保守
  "top_p": 0.85,            // 采样范围适中
  "repeat_penalty": 1.1,    // 轻微防重复
  "num_predict": 200,       // 输出长度适中
  "num_ctx": 2048           // 上下文窗口
}
```

#### 写代码专用

```json
{
  "temperature": 0.1,       // 极低温度，确保代码准确稳定
  "top_p": 0.8,             // 候选范围收紧
  "repeat_penalty": 1.1,    // 防止重复
  "num_predict": 300        // 代码通常需要更长输出
}
```

写代码 temperature 一定要调低一点，代码肯定要稳定性。

#### 创意文案（小模型慎用）

```json
{
  "temperature": 0.7,       // 较高温度，鼓励创意发散
  "top_p": 0.95,            // 扩大候选词范围
  "num_predict": 300        // 文案需要较长输出
}
```

文案创作，temperature 写大一点。

### 实操演示

```json
curl http://localhost:11434/api/generate -d '{
  "model": "qwen3.5:0.8b",
  "prompt": "写一个登录接口",
  "options": {
    "temperature": 0.2,
    "top_p": 0.9,
    "repeat_penalty": 1.1,
    "num_predict": 200
  }
}'
```

![调优返回](/images/ai-tech-stack/tuning-result.png)

基本配置就是调模型的时候可以传这些参数，这个参数的值就是对不同的模型进行调优。

### 系统提示词

模型运行之后，我们可以给一些系统提示词让他固化。

```json
curl http://localhost:11434/api/generate -d '{
  "model": "qwen3.5:0.8b",
  "prompt": "设计一个订单系统",
  "system": "你是一个资深架构师，回答必须包含模块拆分"
}'
```

一开始时候系统提示词给他限定了：你是一个资深架构师，等于说这是系统提示词。

比如我们在用 deepseek 时，在对话时也可以这样限定：

```json
你是一个专业的软件工程师助手:

要求:
1. 输出结构化
2. 优先给代码
3. 不确定的内容必须说明
4. 禁止编造不存在的API
```

### 使用 Modelfile 固化配置

```shell
touch Modelfile
vim Modelfile
```

```dockerfile
FROM qwen3.5:0.8b
PARAMETER temperature 0.2
PARAMETER top_p 0.85
PARAMETER repeat_penalty 1.1

SYSTEM """
你是一个专业的软件工程师助手:

要求:
1. 输出结构化
2. 优先给代码
3. 不确定的内容必须说明
4. 禁止编造不存在的API
"""
```

在执行的时候，可以给这个模型限定它的系统角色是啥。这就是系统的限定。

从应用开发角度来说，其实我们不涉及到模型的调优，但是要知道这样的理论。如果让你调的话，怎么调？这些词在面试过程中要跟面试官聊清楚。大概知道这些词，怎么控制一些幻觉？比如可以设置温度，也可以设置这个上下文，也可以给它检索。

整个重点其实是在应用层的开发。

![AI 开发重点](/images/ai-tech-stack/ai-dev-focus.png)

向量知识，知道就行了，都是现用现查的。

---

# 什么是 RAG - 原理篇 - 3

先讲理论，然后实现代码的 demo。

## 一、RAG 是什么

RAG 全称 **Retrieval-Augmented Generation**，翻译过来叫"检索增强生成"。

为什么出现它？它主要是用来**解决大模型的幻觉**和**失去记忆**的。

核心思想很简单：真实场景当中，公司内部的文档或者其他内部最新的业务，这些大模型它不知道。在不改变模型的时候，说白了就是改变它的输入，把和用户问题相关的文档先提取出来，塞进这个提示词里面，让模型看着资料去回答，顺带着再发挥一下大模型的想象力。

RAG 解决的核心问题：

- 大模型"幻觉"：没有依据乱编答案
- 知识截止问题：模型不知道它训练之后的事情（比如模型是 2026 年 5 月训练的，但 2026 年 6 月 7 月的事情它不知道）
- 私有数据问题：企业内部文档/知识库/wiki

---

先看整体数据流的两个阶段——**写入阶段**和**查询阶段**。

![RAG 总览](/images/ai-tech-stack/rag-write-phase.png)

![RAG 写入阶段 2](/images/ai-tech-stack/rag-write-phase2.png)

比如我们公司做的知识库文档，比如上传：技术文档、产品手册、法律合规、业务流程。可以选择公司内部文档上传，上传完后，在这里提问的时候，就可以基于上传的内容进行回答。

上传后，进行文本分块，分成不同的窗口，分完之后，这些东西**要向量化**存起来。普通的业务数据，比如要做增删改查功能、员工打开记录，这些记录存在数据库表里面。在存之前，**要先对这些数据进行向量化转换**，向量化之后存到向量数据库里面。这个向量库可以理解成 MySQL/MongoDB 数据库。这是写入这一块，先把原始文档先写入。

第二阶段就是查询，用户用自然语言提问。

![RAG 查询阶段](/images/ai-tech-stack/rag-query-phase.png)

在提问的过程当中，这个问题也需要向量化，对应的它能从向量库里面取，然后进行检索、相似度检测（就像之前讲的 top_k 文档检测）。检测完之后，加上用户提问的问题，加上知识库里面有的数据，然后统一做成一个新的提示词来扔给大模型。整体就这两个阶段。

## 二、写入阶段详解

写入阶段是离线状态/离线处理，可以提前批量跑，不影响用户体验。最关键的步骤是**分块**，块切得好不好直接影响最终检索质量。

![写入阶段详解](/images/ai-tech-stack/write-phase-detail.png)

提前根据公司业务，把所有的文档、业务类的东西先训练好，先放到库里面。提前准备好，类似于跑定时任务一样，提前一天跑好，直接查就行了。这里和开发没有关系，一般都会提前写脚本来整理好。

原理：原始的一个文档，一篇整长的文本，然后文本分块（因为有 token 限制），一块一块的，然后扔给向量模型。这里有对应的库，就是对应本地要安装的，类似于 ollama，这里面有好多模型。

现在基于演示使用 qwen3.5：

![ollama 模型列表](/images/ai-tech-stack/ollama-models.png)

向量用的下面这个：

![向量模型](/images/ai-tech-stack/embedding-model.png)

最终存到库里面，分块分 3 个块就 3 条记录，10 个块就 10 条记录。

有一些概念：块太大，可能精度会下降；分得太小，可能缺乏背景。两个块之间有没有重合度（overlap），防止切断。这是整个分块的细节。

## 三、查询阶段详解

查询阶段是用户实时触发的，每次提问都走一遍。核心是把"**用户问题**"和"**文档块**"放到同一个**向量空间**里做**距离计算**。

![查询阶段详解](/images/ai-tech-stack/query-phase-detail.png)

实时给反馈。

![RAG 查询](/images/ai-tech-stack/rag-query.png)

上传文件的数据要提前训练好，然后直接提问就行了。这是基于公司内部知识库进行回答的。

之前部署把数据拆分好存到库里了，放到同一个向量空间里面。用户问的问题也要向量化，然后去 Chroma 数据库里面检索有没有相应的分完片之后的文档，有的话取出来统一进行拼装。提示词 = 系统提示词 + 上下文 + 你的问题。

检索文档会返回出来，用户提的问题和数据库的文档有个相似度的概念，比如 0.921、0.876... 可以设置返回几个，相似度较高的排在第一个。

拼装完之后给大模型：

![拼装提示词](/images/ai-tech-stack/prompt-assembly.png)

可以设置系统提示词，比如限定"你是知识库助手"。还可以定义上下文，这个上下文就是检索里面定义出来的。

```typescript
import { ContentBlock } from '@langchain/core/messages';
// 系统消息：设定模型角色和行为方式
// 用户消息：传入用户输入的文本
// 内容块：用于构造多模态或结构化内容

export const prompt = async (promptText?: string) => {
  const conversation = [
    new SystemMessage('你是专业的翻译官，将用户输入的中文翻译成英文，并且输出英文'), // 系统提示词，限定模型角色
    new HumanMessage(promptText || '你好'), // 用户输入的问题或文本
    new ContentBlock(), // 可选的附加内容块（如图片、结构化数据）
  ];
  const res = await llm.invoke(conversation); // 调用大模型，传入完整会话
  console.log('res', res.content); // 输出模型返回的文本内容
};
```

最终调用模型，给会话传进去。初始化的模型就是 qwen 的模型。

在截图那里添加文档，传入相应的文件，然后在底部输入框提问，它就特别精确了。因为提示词里面已经做了限定，所有查询就是基于之前的文档。给模型的文档数据肯定是真实的，模型看到这个文档之后是有据可查的，模型的幻觉就大幅度降低了。它还可以返回 sources 来源。

RAG 比直接问答模型可靠的根本原因就在此。

## 四、核心概念

| 概念 | 解释 |
|------|------|
| Embedding | 把文字变成一串数字（向量），语义相近的文字，数字也接近 |
| 向量空间 | 所有向量都存在同一个"数学空间"里，可以计算距离 |
| 余弦相似度 | 衡量两个向量方向是否一致，越接近 1 越相似 |
| Top K | 检索时只取最相似的前 K 条文档 |
| Chunk | 把长文档切成小段，每段单独向量化 |
| Overlap | 相邻 Chunk 之间的重叠文本，防止语义被切断 |
| Collection | Chroma 里的"表"，对应一个知识库 |
| Context Window | 大模型一次能接受的最大文本长度，RAG 要控制 context 不超限 |

![Embedding 概念](/images/ai-tech-stack/embedding-concept.png)

**Embedding**：把文字变成一串数字（向量），语义相近的文字数字也接近。

**向量空间**：内部定义的一个数学空间。

**余弦相似度**：越接近 1 越相似，越接近你提的问题。

**Top K**：检索第几个。

**Chunk**：把长文本分成多少段，就像大文件上传一样。

**Overlap**：两个 Chunk 之间有没有重叠的文本，防止被切断回答一半。

**Collection**：表，相当于数据库里面的每一个表。

**Context Window**：模型上下文，整个这一次接收的最大程度。

![Context Window](/images/ai-tech-stack/context-window.png)

提问包括返回的内容，它有限定和时长。比如一次性返回 5 万它也返回不了，所以要有限定。

概念不用特别纠结，可能面试会问。

## 五、RAG vs 纯大模型 对比

| 对比项 | 纯大模型 | RAG |
|--------|---------|-----|
| 私有知识 | 不知道 | 可以查 |
| 实时数据 | 不知道 | 可以查 |
| 幻觉风险 | 高 | 低（有据可查） |
| 答案可溯源 | 不能 | 可以（返回 sources） |
| 部署成本 | 只需模型 | 需要向量库 |

私有数据库/实时数据，RAG 都可以查。纯大模型可以调用，也可以自己本地部署。RAG 必须选择数据库。

这就是大模型应用全栈技能，按照这个技能去学习，方向不会偏。不要被网上的焦虑带偏了。AI 代替前端、代替程序员？你会发现现在多了好多岗位。你输入 AI 前端，或者 AI Agent 开发，AI 应用开发，上面是我们整个的核心。
