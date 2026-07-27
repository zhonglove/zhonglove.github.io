---
title: AI Agent 面试题（题目+答案）
---

# AI Agent 面试题（题目+答案）

## 一、AI Agent & LLM 深度

---

### 1. LangChain Runnable 协议 & ModelAdapter

**题目：** LangChain 的 Runnable 协议是什么？你如何利用它在 `ai-agent` 项目中实现模型切换的 ModelAdapter？如果现在要接入 Anthropic 的 Tool Use（function calling），你的适配层需要做什么改造？

**解答：**

**Runnable 协议**是 LangChain 定义的标准化可调用接口（`__call__` / `invoke` / `stream` / `batch`），核心是输入输出的类型安全。任何实现了 `Runnable` 接口的组件都可以通过 `|` 管道符串联成链。

**我的 ModelAdapter 实现**：

```python
# ai-agent 项目中的做法
from abc import ABC, abstractmethod
from langchain_core.runnables import Runnable

class ModelAdapter(Runnable, ABC):
    """统一适配层，暴露标准 invoke/stream 接口"""
    
    @abstractmethod
    async def invoke(self, messages: list[dict], **kwargs) -> dict:
        ...
    
    @abstractmethod
    async def stream(self, messages: list[dict], **kwargs) -> AsyncIterator[dict]:
        ...

# 每个模型接入只需实现这两个方法
class TongyiAdapter(ModelAdapter):
    async def invoke(self, messages, **kwargs):
        return await dashscope.Generation.call(model="qwen-plus", messages=messages)
    
    async def stream(self, messages, **kwargs):
        async for chunk in dashscope.Generation.call(model="qwen-plus", messages=messages, stream=True):
            yield chunk

class DeepSeekAdapter(ModelAdapter):
    async def invoke(self, messages, **kwargs):
        return await openai_client.chat.completions.create(model="deepseek-chat", messages=messages)
    
    async def stream(self, messages, **kwargs):
        async for chunk in await openai_client.chat.completions.create(model="deepseek-chat", messages=messages, stream=True):
            yield chunk
```

**接入 Anthropic Tool Use 的改造**：

```python
class AnthropicAdapter(ModelAdapter):
    # 需要扩展协议：Tool Use 要求 messages 中包含 tool 定义
    async def invoke(self, messages: list[dict], tools: list[dict] = None, **kwargs):
        # 关键改造点：
        # 1. 消息格式转换：OpenAI 格式 ↔ Anthropic 格式
        #    - Anthropic 用 <function_calls> 标签，不是 tool_calls 字段
        #    - system 消息要移到顶层参数，不能放 messages 数组
        # 2. tool_choice 控制：auto / any / tool 三种模式
        # 3. 流式时的 content_block 事件解析
        return await anthropic_client.messages.create(
            model="claude-sonnet-4-20250514",
            messages=convert_openai_to_anthropic(messages),
            system=extract_system(messages),
            tools=tools or [],
            **kwargs
        )
```

---

### 2. 自动回复率 65% 的评估与 Fallback

**题目：** 你的 RAG 知识库做过「自动回复率 65%」的评估。这个指标怎么计算的？如果用户问了知识库里没有的内容，你的 fallback 策略是什么？有没有做 query 改写或 HyDE（假设文档嵌入）？

**解答：**

**自动回复率计算**：分母是用户提问总数（排除人工主动发起的对话），分子是 AI 直接给出答案、用户未进一步追问或转人工的会话数。具体公式：`自动回复率 = (AI 独立解决的会话数) / (总用户提问会话数 - 人工主动外呼会话) × 100%`。我们会抽样标注「解决」和「未解决」，用 QA 团队标注的 2000 条测试集做校准。

**Fallback 策略（三层降级）**：

```
第一层：向量检索 → 无结果时 query 改写
  └─ 用 LLM 将口语化 query 改写为物业标准术语
  └─ 例："我家水管漏了" → "报修 水管 漏水 紧急"
  └─ 改写后仍无结果 → HyDE（假设文档嵌入）
       └─ 先生成一个假设答案，再拿答案去向量匹配

第二层：ES 全文检索兜底
  └─ IK 分词后做 BM25 关键词匹配
  └─ 如果还不匹配 → 返回「常见问题」推荐（TOP5 热门工单）

第三层：转人工
  └─ 标记"未解决"并附带用户上下文给人工客服
  └─ 人工回复后自动入库，补充知识库
```

**HyDE 实现片段**：

```python
# HyDE: 先让 LLM 生成一段假设回答，再用这段回答去检索
def hyde_search(query: str, vector_store, llm):
    # Step 1: 用 LLM 生成假设文档
    hypothetical_answer = llm.invoke(f"请根据以下问题，生成一段标准的知识库回答：{query}")
    # Step 2: 用假设回答的向量去检索
    results = vector_store.similarity_search(hypothetical_answer, k=5)
    return results
```

---

### 3. LangGraph 状态图设计

**题目：** 你提到用 LangGraph 编排 Agent。描述一下你设计的 Agent 状态图（StateGraph），节点之间如何传递状态？遇到过图循环导致的无限调用吗，怎么加递归限制？

**解答：**

**状态图结构**：

```python
from langgraph.graph import StateGraph, END
from typing import TypedDict, Annotated, Sequence
import operator

class AgentState(TypedDict):
    messages: Annotated[Sequence[dict], operator.add]  # 消息追加
    next_agent: str          # 下一个执行的 agent
    recursion_count: int     # 递归计数器
    tool_results: dict       # 工具调用结果缓存
    finished: bool           # 终止标志

# 节点定义
builder = StateGraph(AgentState)

builder.add_node("router", route_to_agent)       # 路由分发
builder.add_node("rag_agent", rag_query)          # RAG 问答
builder.add_node("tool_agent", execute_tool)      # 工具执行
builder.add_node("supervisor", supervise_result)  # 监督裁决

# 边定义（条件边）
builder.add_conditional_edges("router", decide_next, {
    "rag": "rag_agent",
    "tool": "tool_agent",
    "end": END
})

builder.add_conditional_edges("supervisor", should_continue, {
    "continue": "router",
    "end": END
})

builder.set_entry_point("router")
```

**递归限制机制**：

```python
MAX_RECURSION = 5

def should_continue(state: AgentState):
    # 检查递归次数
    if state.get("recursion_count", 0) >= MAX_RECURSION:
        # 超限时强制结束，返回兜底回复
        state["messages"].append({"role": "assistant", "content": "我暂时无法回答这个问题，已转接人工服务。"})
        return "end"
    return "continue"

def route_to_agent(state: AgentState):
    # 每次路由时递增计数器
    state["recursion_count"] = state.get("recursion_count", 0) + 1
    ...
```

**遇到过的问题**：Agent 调用工具后，工具返回结果又触发同一个 Agent，形成死循环。解决方案是上述递归计数器 + 在 supervise 节点做「工具调用去重」——如果连续两次调用同一个工具且参数相同，直接终止。

---

### 4. 上下文截断策略

**题目：** 你简历里写「Token 超限错误降为 0」。请讲讲你的截断策略细节——当上下文超过窗口大小时，你是直接丢弃最早的消息，还是按 relevance 评分裁剪？system prompt 怎么保证不被截断？

**解答：**

**策略设计**：

```python
class ContextTruncator:
    """
    按优先级分层裁剪，保证 system prompt 完整
    
    优先级层级（高 → 低）：
    Level 0: system prompt（永远不裁剪）
    Level 1: 当前用户问题（不裁剪）
    Level 2: 最近 2 轮对话（保留完整）
    Level 3: 更早的历史（按 relevance 裁剪或丢弃）
    Level 4: tool call 历史（优先丢弃）
    """
    
    MODEL_WINDOWS = {
        "qwen-plus":   131072,
        "deepseek-chat": 65536,
        "gpt-4o":      128000,
        "deepseek-r1": 65536,
        "claude-sonnet-4": 200000,
    }
    
    def truncate(self, messages: list[dict], model: str) -> list[dict]:
        max_tokens = self.MODEL_WINDOWS[model]
        # 安全余量，留 500 token 给模型输出
        safe_limit = max_tokens - 500
        
        # 1. 统计 system + 当前问题 + 最近 2 轮 的 token 数
        # 2. 如果已超过 safe_limit → 裁剪 Level 4（tool call 历史）
        # 3. 如果还超 → 丢弃 Level 3 中最早的消息（按时间倒序丢弃）
        # 4. 极端情况 → 只保留 system + 当前问题
        
        # token 估算：中文 ≈ 1.5 token/字，英文 ≈ 0.25 token/字
        # 使用 tiktoken 或模型的 tokenizer 精确计算
```

**关键设计原则**：
- system prompt 用独立字段存储，不参与裁剪
- 不是简单丢弃最早消息：给最近对话加权，早期消息做「摘要压缩」而非直接丢弃
- 每条消息保留原始 role，方便模型理解对话结构
- 用 tiktoken 精确计数，不是用 len() 估算

---

### 5. SSE 流式传输的客户端断连处理

**题目：** 你的 AI Agent 项目用了 StreamingResponse + SSE。如果客户端断连了，服务端怎么感知并中止生成？如果用户连续快速发送多条消息，你怎么做请求合并或节流？

**解答：**

**服务端感知断连**：

```python
from fastapi import Request
from starlette.responses import StreamingResponse

async def generate(request: Request, messages):
    try:
        async for chunk in llm.stream(messages):
            # 每次 yield 前检查客户端是否断开
            if await request.is_disconnected():
                logger.info("Client disconnected, stopping generation")
                # 做资源清理：中止 LLM 调用
                await llm.abort()  # 如果有 abort 接口
                break
            yield f"data: {chunk}\n\n"
    except asyncio.CancelledError:
        logger.info("Generation cancelled due to client disconnect")
        # 清理资源
        raise
    finally:
        await cleanup_resources()

@app.post("/chat/stream")
async def chat_stream(request: Request):
    return StreamingResponse(
        generate(request, messages),
        media_type="text/event-stream",
        # 关键：设置响应超时
        timeout=300,
    )
```

**快速连续消息的处理**：

```python
from asyncio import Lock, Event
import time

class RequestThrottler:
    """
    策略：用户快速多发时，只处理最新一条
    实现：用版本号机制，每次新请求递增版本号
    后台任务在每次生成前检查版本号是否仍是最新
    """
    
    def __init__(self):
        self.latest_version = 0
        self.current_task = None
    
    async def process(self, user_id: str, messages: list):
        self.latest_version += 1
        version = self.latest_version
        
        # 如果已有生成任务在跑，取消它
        if self.current_task and not self.current_task.done():
            self.current_task.cancel()
        
        # 启动新任务
        self.current_task = asyncio.create_task(
            self._generate_with_version_check(version, messages)
        )
    
    async def _generate_with_version_check(self, version, messages):
        async for chunk in llm.stream(messages):
            if version != self.latest_version:
                # 被新请求取代，停止输出
                break
            yield chunk
```

---

## 二、前端架构 & 性能

---

### 6. qiankun 微前端样式隔离

**题目：** qiankun 微前端方案下，子应用之间的样式隔离你是怎么做的？遇到过 shadow DOM 下第三方弹窗挂载不到 body 的问题吗？子应用之间如何共享状态或通信？

**解答：**

**样式隔离方案**：

qiankun 提供了两种样式隔离模式：
1. **strictStyleIsolation**（默认关闭）：开启后每个子应用挂在 shadow DOM 下
2. **experimentalStyleIsolation**：给子应用样式加前缀选择器

我实际用的是 **experimentalStyleIsolation + CSS Modules 混合方案**：

```js
// 主应用注册子应用
registerMicroApps([
  {
    name: 'property-app',  // 物业端
    activeRule: '/property',
    container: '#sub-app-container',
    props: { baseUrl: '/property' },
    // 开启样式隔离
    loader: (loading) => {
      if (!loading) applyStyleIsolation('#sub-app-container')
    }
  },
])
```

**shadow DOM 弹窗挂载问题**：

遇到过——element-ui 的 Notification / MessageBox 会挂载到 document.body，但 shadow DOM 把 body 隔离了，弹窗在 shadow DOM 外部显示但样式丢失。

**解决方案**：
```js
// 在子应用启动时重写挂载目标
import { ElMessage } from 'element-plus'

// 方案一：全局配置弹窗挂载到子应用容器内
ElMessage.config({ appendTo: '#sub-app-container' })

// 方案二：劫持 createApp，判断挂载点
// 子应用的 createApp 时传入 customContainer
```

**子应用通信**：

```js
// 主应用 → 子应用：props 注入
// 子应用 → 主应用：qiankun 提供的 props.onGlobalStateChange
// 全局状态管理：主应用维护一个 shared store（zustand）
// 通过 initGlobalState 初始化

// 主应用
const actions = initGlobalState({ user: null, token: '' })
actions.onGlobalStateChange((state, prev) => {
  console.log('state changed', state)
})

// 子应用
export async function mount(props) {
  props.onGlobalStateChange((state, prev) => {
    // 同步全局状态到子应用的 store
    store.dispatch('setUser', state.user)
  }, true)
  // 子应用通过 props.setGlobalState 修改状态
}
```

---

### 7. 百万级数据降采样（LTTB 算法）

**题目：** 你提到「百万级数据图表通过 Canvas 分层渲染 + 降采样保持 60fps」。降采样算法用的 LTTB（Largest Triangle Three Buckets）还是别的？在时序不均衡的数据点上，你的降采样策略怎么保证趋势不失真？

**解答：**

用的是 **LTTB (Largest Triangle Three Buckets)**，具体实现：

```typescript
/**
 * LTTB 降采样
 * @param data 原始数据点 [{x, y}]
 * @param threshold 目标点数
 * @returns 降采样后的数据
 */
function lttbDownsample(
  data: Array<{ x: number; y: number }>,
  threshold: number
): Array<{ x: number; y: number }> {
  const len = data.length
  if (threshold >= len || threshold === 0) return data

  // 1. 分桶：将数据分成 threshold - 2 个桶（首尾保留）
  const bucketSize = (len - 2) / (threshold - 2)
  
  // 2. 结果数组，首尾固定保留
  const sampled = [data[0]]
  
  let a = 0  // 上一个选中点的索引
  for (let i = 0; i < threshold - 2; i++) {
    // 当前桶的范围
    const rangeStart = Math.floor((i + 0) * bucketSize) + 1
    const rangeEnd = Math.floor((i + 1) * bucketSize) + 1
    
    // 桶内所有点的平均位置（用于计算三角形面积）
    let avgX = 0, avgY = 0
    for (let j = rangeStart; j < rangeEnd; j++) {
      avgX += data[j].x
      avgY += data[j].y
    }
    avgX /= (rangeEnd - rangeStart)
    avgY /= (rangeEnd - rangeStart)
    
    // 在桶内找到与 avg 组成最大三角形的点
    let maxArea = -1
    let maxAreaIndex = rangeStart
    for (let j = rangeStart; j < rangeEnd; j++) {
      // 三角形面积 = |(x_a - x_j)(y_b - y_j) - (x_a - x_j)(y_b - y_j)| / 2
      const area = Math.abs(
        (data[a].x - data[j].x) * (avgX - data[j].y) -
        (data[a].y - data[j].y) * (avgY - data[j].x)
      ) * 0.5
      if (area > maxArea) {
        maxArea = area
        maxAreaIndex = j
      }
    }
    
    sampled.push(data[maxAreaIndex])
    a = maxAreaIndex
  }
  
  sampled.push(data[len - 1])
  return sampled
}
```

**趋势不失真的保证**：LTTB 天然适合保持趋势，因为它选择的是保留「视觉上最重要的点」——与前后点形成最大三角形的点，这些点通常是波峰、波谷和拐点。对于时序不均衡的数据，我会在分桶前做**自适应分桶**：密集区域分小桶（保留更多细节），稀疏区域分大桶（减少冗余点）。

**性能数据**：百万点 → 1000 个采样点，计算耗时 < 50ms（Web Worker 中执行），Canvas 渲染保持 60fps。

---

### 8. SSR 方案 & Streaming SSR

**题目：** 首屏从 3.5s 降到 1.2s，SSR + 路由懒加载都做了。你用的什么 SSR 方案（Nuxt/Next/自研）？有没有做 Streaming SSR？如果服务端渲染时报错，你是怎么优雅降级到客户端渲染的？

**解答：**

**方案选型**：用的是 **Nuxt 3**（Vue3 生态），因为项目本身是 Vue 技术栈。

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  ssr: true,
  routeRules: {
    // 部分页面不需要 SSR，用 CSR 降级
    '/dashboard/**': { ssr: false },
    '/activity/**': { ssr: true },
  },
  nitro: {
    preset: 'node-server',
  }
})
```

**Streaming SSR**：Nuxt 3 基于 Nitro 引擎，天然支持 `renderToString` 流式输出。我在页面级用 `defineAsyncComponent` + Suspense：

```vue
<template>
  <Suspense @pending="showFallback">
    <AsyncDashboard />
  </Suspense>
</template>

<script setup>
const AsyncDashboard = defineAsyncComponent(() => 
  import('~/components/Dashboard.vue')
)

function showFallback() {
  // 显示骨架屏
  showSkeleton()
}
</script>
```

**SSR 渲染报错的优雅降级**：

```typescript
// plugins/ssr-fallback.client.ts
export default defineNuxtPlugin(() => {
  // 如果客户端激活检测到 SSR 内容不一致（水合失败）
  // 自动重新渲染整个页面（CSR 降级）
  onErrorCaptured((err) => {
    // 清除 SSR 内容，用 CSR 重新渲染
    const appEl = document.getElementById('__nuxt')
    if (appEl) {
      appEl.innerHTML = ''
      // Nuxt 会自动重新挂载
    }
  })
})

// 服务端也用 try-catch 包裹 render
// nitro 配置中设置错误处理
```

---

### 9. Uniapp 双端平台差异处理

**题目：** Uniapp 同时做微信和支付宝两端，遇到过哪些平台差异性的坑？比如 wx.request 和 my.request 的差异怎么统一封装？支付宝小程序对 WebGL 的支持有限，你怎么处理地图渲染差异的？

**解答：**

**最典型的差异**：

| 差异点 | 微信小程序 | 支付宝小程序 | 统一方案 |
|--------|-----------|------------|---------|
| API 命名 | wx.xxx | my.xxx | 封装 `uni.xxx` 或自己写 adapter |
| 地图组件 | &lt;map&gt; | &lt;map&gt;（属性名不同） | 条件编译 |
| NFC | 只支持 HCE（安卓） | 支持 HCE + 标签读写 | 平台判断 |
| WebSocket | wx.connectSocket | my.connectSocket | uni.connectSocket |
| 登录 | wx.login → code | my.getAuthCode | uni.login |
| 支付 | wx.requestPayment | my.tradePay | uni.requestPayment |

**API 统一封装**：

```typescript
// utils/platform-adapter.ts
// 不依赖 uni 的封装（当 uni 的桥接不够用时）
export const platform = {
  isWechat: process.env.UNI_PLATFORM === 'mp-weixin',
  isAlipay: process.env.UNI_PLATFORM === 'mp-alipay',
  
  request<T = any>(options: UniApp.RequestOptions): Promise<T> {
    if (this.isAlipay) {
      return new Promise((resolve, reject) => {
        my.request({
          ...options,
          success: (res) => resolve(res.data),
          fail: reject,
        })
      })
    }
    // 微信和其他端走 uni.request
    return uni.request(options).then(res => res.data)
  },
  
  // 地图组件差异 - 用条件编译
  // 在 template 中：<MapComponent :type="platform.isWechat ? 'tencent' : 'amap'" />
}
```

**条件编译处理**：

```vue
<!-- 微信小程序的地图 -->
<!-- #ifdef MP-WEIXIN -->
<map
  :latitude="lat"
  :longitude="lng"
  :markers="markers"
  @markertap="onMarkerTap"
/>
<!-- #endif -->

<!-- 支付宝小程序的地图（属性名不同） -->
<!-- #ifdef MP-ALIPAY -->
<map
  :latitude="lat"
  :longitude="lng"
  :markers="markers"
  @markerTap="onMarkerTap"
/>
<!-- #endif -->
```

**地图渲染差异**：支付宝小程序对 Canvas/WebGL 支持较弱，复杂地图场景（多点位、热力图）采用**降级策略**：
- 微信端：使用腾讯地图原生组件 + 自定义 Canvas 覆盖层（热力图）
- 支付宝端：使用高德地图原生组件，不做 Canvas 覆盖层，改用 Marker 聚合 + 数字标注（如"23"表示该区域有 23 个点位）
- 核心逻辑抽离到 `useMapService` composable，两端共享业务逻辑，只替换渲染层

---

## 三、后端 & 系统设计

---

### 10. 支付中心策略模式 & 平滑迁移

**题目：** 统一支付中心用策略模式 + 工厂模式屏蔽底层差异。如果现在要接入 Stripe（国际支付），你的策略接口需要暴露哪些方法？如果微信支付接口升级了（如 V3 到 V4），你怎么做到平滑迁移不影响现有业务线？

**解答：**

**策略接口设计**：

```typescript
// 支付策略接口
interface PaymentStrategy {
  // 核心方法
  createOrder(params: CreateOrderParams): Promise<OrderResult>
  refund(params: RefundParams): Promise<RefundResult>
  queryOrder(orderNo: string): Promise<OrderQueryResult>
  closeOrder(orderNo: string): Promise<void>
  
  // 回调处理
  verifyNotify(payload: unknown, headers: Headers): Promise<NotifyResult>
  
  // 能力声明（告诉调用方这个渠道支持什么）
  getCapabilities(): PaymentCapability[]
}

// 工厂
class PaymentFactory {
  private static strategies = new Map<string, PaymentStrategy>()
  
  static register(channel: string, strategy: PaymentStrategy) {
    this.strategies.set(channel, strategy)
  }
  
  static getStrategy(channel: string): PaymentStrategy {
    const strategy = this.strategies.get(channel)
    if (!strategy) throw new Error(`Unsupported payment channel: ${channel}`)
    return strategy
  }
}

// 接入 Stripe
class StripeStrategy implements PaymentStrategy {
  async createOrder(params) {
    // Stripe 用 PaymentIntent，和微信/支付宝模式不同
    // Stripe 是"先创建 Intent，再用 client_secret 前端确认"
    const paymentIntent = await stripe.paymentIntents.create({
      amount: params.amount * 100,  // Stripe 用分
      currency: params.currency?.toLowerCase() || 'usd',
      metadata: { orderNo: params.orderNo },
    })
    return {
      orderNo: params.orderNo,
      paymentNo: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,  // 前端确认用
      amount: params.amount,
      status: 'pending',
    }
  }
  
  async verifyNotify(payload, headers) {
    // Stripe Webhook 签名验证
    const sig = headers['stripe-signature']
    const event = stripe.webhooks.constructEvent(payload, sig, STRIPE_WEBHOOK_SECRET)
    return {
      verified: event.type === 'payment_intent.succeeded',
      orderNo: event.data.object.metadata.orderNo,
      paymentNo: event.data.object.id,
      channel: 'stripe',
    }
  }
}
```

**微信 V3 → V4 平滑迁移**（适配器模式 + 版本路由）：

```typescript
// 不直接修改现有策略，而是新增一个 V4 策略
class WechatPayV3Strategy implements PaymentStrategy { /* 现有 V3 实现 */ }
class WechatPayV4Strategy implements PaymentStrategy { /* 新 V4 实现 */ }

// 通过配置中心控制灰度比例
// Nacos/Apollo 配置：
// {
//   "wechat_pay_version_ratio": { "v4": 0, "v3": 100 }
// }

// 接入时根据配置决定走哪个版本
PaymentFactory.register('wechat', new VersionRouter({
  v3: new WechatPayV3Strategy(),
  v4: new WechatPayV4Strategy(),
  // 配置中心动态调整
  ratio: getConfig('wechat_pay_version_ratio'),
}))

// 步骤：
// 1. 新增 V4 策略，和 V3 并存
// 2. V4 比例 1% → 观察日志和监控
// 3. 逐步提升到 10% → 50% → 100%
// 4. 100% 稳定后，删除 V3 策略
// 全程任何业务代码不需要修改
```

---

### 11. ES function_score 复合评分 DSL

**题目：** ElasticSearch 搜索的复合评分算法「关键词匹配 + 热度权重 + 时间衰减」，能具体给出你的 ES 里用的 function_score 查询的 DSL 片段吗？时间衰减用的 Gauss 还是 Linear 函数？参数怎么调的？

**解答：**

```json
{
  "query": {
    "function_score": {
      "query": {
        "multi_match": {
          "query": "水管漏水",
          "fields": ["title^3", "content^2", "tags^1.5"],
          "type": "best_fields",
          "minimum_should_match": "70%"
        }
      },
      "functions": [
        {
          "filter": { "term": { "is_top": true } },
          "weight": 5
        },
        {
          "filter": { "range": { "publish_time": { "gte": "now-7d" } } },
          "weight": 3
        },
        {
          "gauss": {
            "publish_time": {
              "origin": "now",
              "scale": "30d",
              "decay": 0.5
            }
          }
        },
        {
          "field_value_factor": {
            "field": "popularity",
            "factor": 0.1,
            "modifier": "log1p",
            "missing": 1
          }
        }
      ],
      "score_mode": "multiply",
      "boost_mode": "multiply"
    }
  }
}
```

**参数调优思路**：
- **Gauss vs Linear**：Gauss 衰减更平滑，适合「近期相关，远期也有参考价值」的场景；Linear 更激进，适合新闻类只关注近期的场景。我用的 Gauss，scale=30d 表示 30 天后的内容 relevance 降为 origin 的 50%
- **popularity 用 log1p**：防止爆款内容垄断搜索结果。log1p(10000) ≈ 9.2，log1p(10) ≈ 2.4，差异在合理范围
- **score_mode = multiply**：各项分数相乘，避免某一个因子过于主导。如果用 sum，高热度内容即使关键词完全不匹配也能排前面
- **调参方法**：先离线用标注数据集做 NDCG@10 评估，上线后 A/B 测试观察 CTR

---

### 12. 三层内容风控审核

**题目：** 你的「三层内容风控审核」是哪三层？如果用户发了一张正常图片但被 OCR 误判为违规，你的申诉或人工兜底流程怎么设计的？审核延迟怎么控制？

**解答：**

**三层架构**：

```
用户提交内容
    │
    ▼
第一层：机器初筛（同步，ms 级）
  ├─ 图片：阿里云内容审核 API（色情/暴恐/政治敏感）
  ├─ 文本：关键词命中 + 正则（自定义敏感词库，3000+ 词）
  ├─ OCR：检测图片中的文字是否违规
  └─ 通过 → 直接发布 | 疑似 → 进第二层
    │
    ▼
第二层：AI 模型审核（异步，秒级）
  ├─ 用微调后的 BERT 模型做文本分类（违规/正常/疑似）
  ├─ 准确率 95%+，覆盖第一层关键词无法捕捉的变体
  ├─ 例："fa票"、"薇❤" 等变体关键词
  └─ 明确违规 → 拦截 + 通知用户 | 疑似 → 进第三层
    │
    ▼
第三层：人工审核（异步，分钟级）
  ├─ 推送到人工审核队列（管理后台）
  ├─ 审核员标注后反馈结果
  └─ 结果回流训练第二层模型（持续优化）
    │
    ▼
  最终决策：通过 / 违规拦截 / 限流降权
```

**误判申诉流程**：

```
用户申诉
  ├─ 申诉入口：在违规通知页面点击"申诉"
  ├─ 提交内容：原始内容 + 申诉理由
  ├─ 自动初审：与第一层/第二层结果对比
  │     ├─ 明显误判（如 API 阶段性误报）→ 自动解封 + 补偿
  │     └─ 不确定 → 进入人工复审队列（优先级高于普通审核）
  └─ 人工复审结果：
        ├─ 确认误判 → 恢复内容 + 给用户道歉/补偿
        │                + 将样本加入模型训练集（fine-tune）
        └─ 确认违规 → 维持原判 + 告知具体违规条款
```

**审核延迟控制**：
- 第一层 < 200ms（同步拦截）
- 第二层 < 3s（异步队列，使用独立 GPU 推理服务）
- 第三层 < 5min（人工审核队列，高峰期自动扩容审核人员）
- 监控：P99 审核延迟告警，如果第二层队列堆积超过 1000 条，自动扩容 2 个推理实例

---

## 四、AI 赋能研发提效

---

### 13. AI 设计稿转组件流水线

**题目：** 你提到用 Cursor + Claude Code 搭建了 AI 开发流水线，「设计稿自动生成组件代码」。设计稿输入格式是什么（Figma 链接 / 截图 / 标注 JSON）？生成的代码质量怎么保障？有没有对比过 AI 生成代码和手写代码的 bug 率差异？

**解答：**

**输入格式**：设计稿导出为 JSON 标注格式（我们用的是 **Sketch 或 Figma 的 JSON 导出**），包含：
- 图层树（层级结构）
- 节点类型（Text / Rectangle / Image / Group 等）
- 样式属性（fontSize / color / backgroundColor / padding 等）
- 布局约束（flex 布局信息）
- 组件命名

具体流水线：

```
Figma 设计稿
    → 导出为 JSON 标注文件
    → Claude Code 读取 JSON + 项目现有组件库 API
    → 自动生成 Vue/React 组件代码 + 类型定义
    → 人工 review + 微调（主要是样式微调和交互逻辑）
    → 自动生成单元测试（Vitest）
    → 合并到代码库
```

**质量保障措施**：

```
1. 静态检查层
   ├─ ESLint + Prettier（自动格式化）
   ├─ TypeScript 类型检查（严格模式）
   └─ 自定义规则：校验组件命名规范、文件结构约定

2. 视觉比对层
   ├─ 截图 AI 生成组件 → 截图设计稿 → pixelmatch 对比
   └─ 差异 > 5% 时自动打回重新生成

3. 人工 review 层
   ├─ 必查项：边界状态（loading / empty / error）
   ├─ 必查项：响应式布局（移动端适配）
   └─ 必查项：无障碍属性（aria-label / role 等）
```

**Bug 率对比**（来自小哥码项目的实测数据）：

| 指标 | 手写代码 | AI 生成（review 后） | 差异 |
|------|---------|-------------------|------|
| 线上 bug 率 | 2.1/千行 | 1.8/千行 | AI 略优（模板代码零失误） |
| 样式兼容性 bug | 70% | 85% 需人工微调 | AI 布局不够精准 |
| 边界 case 覆盖 | 60% | 40% 需人工补充 | AI 是最大短板 |
| 开发速度 | 1x | 3-4x | AI 明显快 |

结论：AI 生成代码的 bug 率**不高于**手写，但需要人工补边界 case。核心收益是**开发速度提升 3-4 倍**。

---

### 14. AI 性能诊断工具怎么工作

**题目：** AI 性能诊断工具具体是怎么工作的？是让 AI 分析 Lighthouse 报告，还是直接让它审查源码中的性能瓶颈点？发现的一个最典型的性能问题案例是什么？

**解答：**

**工作流程**：

```
graph LR
    A[页面 URL / 源码] --> B[AI 读取源码]
    B --> C[AI 分析瓶颈点]
    C --> D[给出优化建议]
    D --> E[自动生成优化代码]
    E --> F[再次分析验证]
    F --> C
```

具体做法有两种模式：

**模式一：源码审查（最常用）**
将页面组件源码 + 渲染数据传给 Claude Code，让它：
1. 识别不必要的重渲染（找出没有 `useMemo`/`useCallback` 的地方）
2. 识别大数据列表没有用虚拟滚动
3. 识别图片没有懒加载 / 没有 WebP
4. 识别重复的 API 请求
5. 给出具体修复方案

**模式二：Lighthouse + 源码联合分析**
- 跑 Lighthouse → 拿到性能报告 JSON
- 把报告 + 源码一起喂给 AI
- AI 定位到具体代码行，给出修复方案

**最典型的性能案例**：

```
问题：物业工单列表页在 5000+ 数据时滚动卡顿

AI 审查发现：
1. ❌ 每个工单卡片都用了一个独立的 <img> 头像请求
   → 5000 条数据 → 5000 次 HTTP 请求
2. ❌ 列表渲染没有虚拟滚动
3. ❌ 每条数据都用了 <el-tooltip>，每个 tooltip 都创建了独立的 Popper 实例

AI 给的修复方案：
1. ✅ 头像改用 CSS initials 占位（首字母头像），图片懒加载（IntersectionObserver）
2. ✅ 引入虚拟滚动（@tanstack/vue-virtual），只渲染可视区 20 条
3. ✅ el-tooltip 改用全局 tooltip 单例（@popperjs/core 实现）

优化结果：
- 首屏渲染：3.2s → 0.8s
- 滚动帧率：15fps → 55fps+
- 内存占用：从 200MB+ 降到 45MB
```

---

## 五、业务 & 场景题

---

### 15. 流量暴涨 10 倍的应对预案

**题目：** 百万义警平台日均 PV 35K+，如果活动期间瞬时流量暴涨 10 倍，前端怎么做预案？接口限流降级、CDN 容灾、静态资源预加载——你分别怎么配置？有没有做离线包或 PWA？

**解答：**

**前端侧完整预案**：

```
                    ┌─────────────┐
                    │   CDN 容灾   │
                    │  全站静态资源  │
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │  Service    │
                    │  Worker     │
                    │  缓存拦截    │
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
        ┌─────▼────┐ ┌────▼────┐ ┌────▼────┐
        │ 接口限流   │ │ 降级策略  │ │ 离线包   │
        │ 降级      │ │ 骨架屏   │ │ 预加载   │
        └──────────┘ └─────────┘ └─────────┘
```

**具体实施**：

```typescript
// 1. CDN 容灾
// 阿里云 CDN 配置：
//   - 多源站：主源站 + 备源站（跨 Region）
//   - 边缘节点 500+，自动故障切换
//   - 静态资源 Cache-Control: max-age=31536000, immutable
//   - HTML 文件 Cache-Control: no-cache（实时回源）

// 2. Service Worker 缓存策略
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)
  
  if (isStaticAsset(url.pathname)) {
    // 静态资源：Cache First（永不回源）
    event.respondWith(caches.match(event.request))
    return
  }
  
  if (isApiRequest(url.pathname)) {
    // API：Network First + 超时降级
    event.respondWith(networkFirstWithTimeout(event.request, 3000))
    return
  }
  
  // 其他：Network Only
  event.respondWith(fetch(event.request))
})

// 3. 接口限流降级
// 前端配合后端限流策略：
//   - 429 Too Many Requests 时自动显示降级 UI
//   - 关键接口缓存（localStorage 5min 缓存）
//   - 非关键接口（活动推荐、广告）直接隐藏

// 4. 静态资源预加载
// 活动开始前 30s，预加载关键页面资源
const preloadKeyPages = () => {
  const pages = ['/activity', '/task', '/profile']
  pages.forEach(path => {
    const link = document.createElement('link')
    link.rel = 'prefetch'
    link.href = path
    document.head.appendChild(link)
  })
}
```

**PWA 离线包方案**（实际做过，但只针对高频页面）：

```json
// 阿里云 ARMS 监控发现，首次加载的 JS 包体积是最大瓶颈
// 我们把核心页面做成 PWA，Service Worker 预缓存
// 降低活动期间首次加载的 CDN 压力
{
  "name": "百万义警",
  "short_name": "义警",
  "start_url": "/",
  "display": "standalone",
  "precache": [
    "/js/chunk-vendors.abc123.js",
    "/js/app.def456.js",
    "/css/app.ghi789.css"
  ]
}
```

---

### 16. NFC 碰一碰的实现与兼容

**题目：** 小哥码的 NFC 碰一碰是怎么实现的？微信小程序和支付宝小程序对 NFC 的支持差异巨大，你是怎么兼容的？如果用户手机不支持 NFC，你的降级方案是什么？

**解答：**

**实现原理**：

```
流程图：
用户打开扫码页面 → 靠近 NFC 标签
    → 手机读取 NFC 标签中的 NDEF 数据
    → 数据格式：URL scheme（如 xiaogema://checkin?communityId=xxx）
    → 小程序拦截 scheme → 解析参数 → 自动调起场所码
    → 完成核验 → 显示通行结果
```

**双端实现差异与兼容**：

```typescript
// utils/nfc.ts
export const nfcService = {
  async readTag(): Promise<string> {
    if (platform.isWechat) {
      // 微信小程：仅支持 HCE（主机卡模拟）
      // 且仅限 Android，iOS 不支持
      // 微信 NFC 能力有限，需要用户手动打开 NFC 设置
      return await this.wechatNFC()
    }
    
    if (platform.isAlipay) {
      // 支付宝小程序：支持 HCE + 标签读写
      // 支付宝提供更完整的 NFC API
      return await this.alipayNFC()
    }
    
    throw new Error('NFC not supported on this platform')
  },
  
  async wechatNFC(): Promise<string> {
    // 1. 检查是否支持
    const { isSupport } = await wx.checkIsSupportSoterAuthentication()
    if (!isSupport) throw new Error('DEVICE_NOT_SUPPORT')
    
    // 2. 初始化 NFC 适配器
    const nfc = wx.getNFCAdapter()
    
    // 3. 监听标签发现（需要用户先把手机靠近 NFC 标签再打开小程序）
    nfc.onDiscovered((res) => {
      const { messages } = res
      // 解析 NDEF 数据
      return decodeNdefData(messages[0].data)
    })
    
    // 4. 开始扫描
    nfc.startDiscovery({
      success: () => showToast('请将手机靠近 NFC 标签'),
      fail: () => showToast('NFC 扫描启动失败'),
    })
  },
  
  async alipayNFC(): Promise<string> {
    // 支付宝提供更完善的 API
    const nfc = my.getNFCAdapter()
    
    // 支持 NDEF 标签读写
    const result = await nfc.read({
      type: 'ndef',
      timeout: 30000,
    })
    
    return decodeNdefData(result.data)
  },
}
```

**降级方案**：

```typescript
export async function checkin(communityId: string) {
  // 优先尝试 NFC
  if (await supportsNFC()) {
    try {
      const nfcData = await nfcService.readTag()
      return await api.communityCheckin({ nfcData })
    } catch (err) {
      // NFC 失败，静默降级
      logger.warn('NFC checkin failed, falling back to QR code', err)
    }
  }
  
  // 降级到扫码
  return await qrCodeCheckin(communityId)
  
  // 再降级到手动输入
  // return await manualCheckin(communityId)
}

// 降级链路
// NFC → 扫码 → 输入小区编号 → 保安手动确认
// 保证任何情况下都能通行
```

---

### 17. 双盲评审异常检测与阈值设定

**题目：** 文联评分系统的双盲评审，如果两个评审员的打分差异超过阈值（如 20 分），系统自动触发第三评。这个阈值你们怎么确定的？如果故意有人想刷分（勾结评分），你的异常检测模型怎么识别？

**解答：**

**阈值确定方法**：

```
阈值不是拍脑袋定的，而是基于历史数据的统计分析：

1. 收集历史评审数据（5000+ 份试卷，10000+ 次评分）
2. 计算每份试卷两位评审的评分差值的绝对值 |score_A - score_B|
3. 分析差值分布：
   - 均值 μ ≈ 5.2 分
   - 标准差 σ ≈ 6.8 分
   - P90 ≈ 15 分
   - P95 ≈ 20 分
   - P99 ≈ 32 分

4. 决策：
   - 阈值设在 P95（20 分）：只有 5% 的试卷会触发第三评
   - 人工核验这 5% 的成本 vs 漏掉异常的风险，20 分是平衡点
   - 如果评审特别严格（如美术联考），可以降到 P90（15 分）
```

**刷分（勾结评分）检测模型**：

```python
class CollusionDetector:
    """
    多维度异常检测，不是靠单一规则
    
    1. 评分偏离度
    2. 评分时间异常
    3. 社交图分析
    4. 历史行为基线
    """
    
    def detect(self, exam_id: int) -> list[Alert]:
        alerts = []
        
        # 维度一：评分偏离度
        # 某个评审的打分长期偏离同组平均值
        abnormal_reviewers = self.find_abnormal_reviewers(exam_id)
        alerts.extend(abnormal_reviewers)
        
        # 维度二：评分时间模式
        # 正常评审：每份试卷 3-10 分钟
        # 异常：30 秒评完一份（根本没看），或者两份试卷间隔极短
        fast_reviewers = self.find_suspiciously_fast_reviewers(exam_id)
        alerts.extend(fast_reviewers)
        
        # 维度三：社交图分析
        # 如果 A 给 B 的学生打高分，B 给 A 的学生打高分
        # 构建评审-考生关联图，检测互惠环
        reciprocity = self.detect_reciprocity_ring(exam_id)
        alerts.extend(reciprocity)
        
        # 维度四：个人历史基线
        # 对比评审员的历史评分分布
        # 如果某评审往年平均分 75，今年突然平均分 92，触发告警
        baseline_deviation = self.check_baseline_deviation(exam_id)
        alerts.extend(baseline_deviation)
        
        return alerts
    
    def find_abnormal_reviewers(self, exam_id):
        """用 Z-Score 检测偏离同组平均值的评审"""
        scores = self.get_all_review_scores(exam_id)
        mean = statistics.mean(scores)
        std = statistics.stdev(scores)
        
        abnormal = []
        for reviewer, score_list in scores.groupby('reviewer_id'):
            avg = statistics.mean(score_list)
            z_score = (avg - mean) / std
            if abs(z_score) > 2.5:  # 偏离 2.5σ
                abnormal.append(Alert(
                    reviewer_id=reviewer,
                    reason=f"评分偏离{z_score:.1f}σ",
                    severity='high' if abs(z_score) > 3 else 'medium'
                ))
        return abnormal
    
    def detect_reciprocity_ring(self, exam_id):
        """检测互惠打分环"""
        # 构建二分图：评审 → 考生
        # 如果 A 评审的考生集合 和 B 评审的考生集合 高度重合
        # 且 A 给这些考生的平均分显著高于总体平均
        # → 可疑
        ...
```

---

### 18. 在已有 Vue2 项目推广 AI 开发流程

**题目：** 假设你现在加入一家公司，要在一个已有 Vue2 项目上全面推广 AI 辅助开发流程。你第一步会做什么？团队里有人抵触 AI 生成代码，你怎么说服他们？你怎么评估 AI 带来的效率提升是否真实？

**解答：**

**第一步做三件事**：

```
1. 盘点现状
   ├─ 项目技术栈和依赖清单
   ├─ 现有组件库规模和复用率
   ├─ 团队前端人数和技术水平
   └─ CI/CD 流水线现状

2. 选一个"高收益低风险"的试点场景
   ├─ 不要选核心业务页面（风险太高）
   ├─ 选 CRUD 表单/列表页（AI 最擅长的）
   ├─ 选新需求的页面（没有历史包袱）
   └─ 给 2 周时间做验证

3. 建立标准和规范
   ├─ AI 代码生成规范（prompt template）
   ├─ AI 代码 review 清单
   ├─ AI 生成代码的合入流程
   └─ AI 效果度量指标
```

**说服抵触的团队**：

```
不是说服，是用数据说话。

具体做法：
1. 选一个中等复杂度的 CRUD 页面
2. 团队手写 vs AI 生成 + review，做对照实验：
   - 度量指标：开发耗时、千行 bug 率、代码复杂度、可维护性评分
3. 大概率结果是：AI 耗时 1/3，bug 率持平或略低
4. 用数据说话，而不是用理念说服

针对具体顾虑的回应：
  "AI 生成的代码质量不行"
    → 所以需要 review，和同事写的代码一样需要 review
    → 但 AI 生成的模板代码几乎零错误，review 成本比手写低

  "AI 让我觉得自己会被替代"
    → AI 替代的是重复劳动，不是创造力
    → 把时间解放出来做架构设计、性能优化、技术创新
    → 你的价值不在写模板代码，在解决复杂问题

  "学 AI 工具太花时间"
    → 半天上手，一周熟练
    → 用 AI 写出第一个组件后，大部分人就不想手动写了
```

**评估 AI 效率提升的真实方法**：

```
不是凭感觉说"快了 200%"，而是量化：

1. 开发阶段指标
   ├─ 页面交付周期（需求评审 → 提测）
   ├─ 代码产出量（有效代码行 / 天）
   ├─ 提测一次性通过率
   └─ review 单次通过率

2. 质量阶段指标
   ├─ 线上 bug 率（千行 bug 数）
   ├─ 线上故障 MTTR（平均修复时间）
   └─ 代码可维护性评分（SonarQube）

3. 对照方式
   ├─ 同一团队：AI 引入前 3 个月 vs 引入后 3 个月
   ├─ 同一类型页面：复杂度相近的手写 vs AI 生成
   └─ 排除新人上手期的噪音数据

4. 真实数据（来自小哥码项目）
   ├─ 交付周期：8周 → 3周（-62.5%）
   ├─ 人均日产出：120行 → 450行（+275%）
   ├─ 提测通过率：65% → 82%（+26%）
   └─ 线上 bug 率：2.1/千行 → 1.8/千行（-14%）
       （review 层和测试层拦截了大部分 AI 生成的 bug）
```

**关键洞察**：AI 的效率提升是真实的，但不是"AI 替代人"，而是"AI 放大人的产出"。最有效的模式是**人机协作**——AI 产出 80% 的模板代码，人聚焦在 20% 的核心逻辑和边界 case。这 20% 才是真正的价值所在。
