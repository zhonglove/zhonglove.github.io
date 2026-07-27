---
title: AI Agent 实时数据系统设计面试准备
---

# AI Agent 实时数据系统设计面试准备

## 2分钟项目介绍（AI Agent 对话引擎）

> 我主导开源的 AI Agent 项目，是一个基于 FastAPI + React 的企业级 AI 对话引擎，核心解决多模型统一接入和实时流式交互的问题。

> 架构上，我设计了一层 **ModelAdapter** 抽象接口，把通义千问、DeepSeek、GPT 等 5 种主流模型的 API 差异封装在适配层后面，新增一个模型只需 20 行代码，切换延迟小于 1 秒。

> 实时性方面，我实现了 **SSE 流式推送**方案——后端用 StreamingResponse 异步生成器逐 chunk 推送，前端用 ReadableStream 逐帧渲染打字机效果，首字响应延迟控制在 200ms 以内，相比非流式方案用户等待感降低了 80%。

> 上下文管理上，我设计了一个智能截断引擎，内置 5 种模型的上下文窗口映射表，按 role 优先级分层裁剪，保证 system prompt 完整，上线以来 Token 超限错误降为 0。

> 这个项目虽然是对话场景，但底层涉及的流式数据处理、增量更新、连接管理、断线恢复等机制，和实时行情系统有相通的设计理念——都可以抽象为「数据源 → 管道处理 → 视图渲染」的流式架构。

---

## 一、毫秒级延迟具体是多少？

端到端延迟分两段：

- **SSE 流式方案**：首字延迟（用户发出请求到第一个 token 到达）< 200ms，后续 token 间隔约 10-50ms（取决于模型输出速度）
- **WebSocket 实时数据**（义警大屏）：消息从服务端发出到前端渲染完成，P50 < 50ms，P99 < 200ms

延迟构成：`网络传输 + 序列化/反序列化 + React 批处理渲染`

---

## 二、延迟从哪里计算到哪里？

从「后端收到数据源事件」到「React 渲染完成」：

```
数据源事件 → 后端处理 → WebSocket 推送 → 前端接收 → React setState → 浏览器渲染
[ 服务端耗时 ]      [ 传输 ]    [  前端处理 + 渲染  ]
```

我在义警项目中的做法：
- 在消息体中嵌入 `serverTimestamp`（后端发出时间）和 `clientReceivedTimestamp`（前端收到时间）
- 通过阿里云 ARMS 的 TraceID 串起全链路，精确到毫秒
- 监控看板上直接展示 P50/P95/P99 端到端延迟

---

## 三、为什么选择 WebSocket？

**选 WebSocket 而不是 SSE/Polling 的原因**：

| 维度 | WebSocket | SSE | Polling |
|------|-----------|-----|---------|
| 双向通信 | ✅ | ❌ 单向 | ❌ 单向 |
| 延迟 | 低（长连接） | 低（长连接） | 高（短轮询） |
| 浏览器支持 | 全平台 | 不支持 IE | 全平台 |
| 自动重连 | 需自实现 | 原生支持 | 天然支持 |
| 适用场景 | 实时行情/大屏 | AI 流式输出 | 低实时性需求 |

**义警大屏/小哥码的实际选型**：
- 大屏实时数据 → **WebSocket**（需要双向：服务端推送 + 前端发送控制指令）
- AI Agent 对话 → **SSE**（单向流式输出即可，不需要双向）
- REST 接口 → HTTP Short Polling（低频兜底，30s 间隔）

---

## 四、首次快照和增量数据如何合并？

**义警大屏实时数据的快照+增量模式**：

```
首次连接：
  前端 → 发送 { type: 'subscribe', channel: 'activity_stats' }
  后端 → 返回快照 { type: 'snapshot', data: { totalActivities: 58000, ... } }
  前端 → 直接用快照初始化 state

后续增量：
  后端 → 推送 { type: 'delta', data: { totalActivities: { op: 'inc', value: 1 } } }
  前端 → 遍历 delta，按 op 应用到当前 state

合并逻辑：
  function applyDelta(state, delta) {
    for (const [key, change] of Object.entries(delta)) {
      switch (change.op) {
        case 'set':   state[key] = change.value; break
        case 'inc':   state[key] += change.value; break
        case 'delete': delete state[key]; break
        case 'merge': state[key] = { ...state[key], ...change.value }; break
      }
    }
    return { ...state }
  }
```

**关键设计**：
- 快照是全量替换，增量是原子操作
- 每次增量自带 op 操作符，前端不做业务推导
- 快照和增量用同一个 channel 传输，保证顺序

---

## 五、如何处理重复、乱序和 sequence 跳号？

**sequence 机制**：

```typescript
interface Message {
  type: 'snapshot' | 'delta' | 'heartbeat'
  seq: number      // 严格递增
  channel: string
  data: any
}
```

**重复消息**：记录 `lastProcessedSeq`，收到 seq ≤ lastProcessedSeq 的直接丢弃。

**乱序消息**：
- 预期 seq = `lastProcessedSeq + 1`
- 收到 seq > 预期 → 放入 pendingQueue（按 seq 排序），不丢弃，等待中间 seq 到达
- 收到 seq < 预期 → 已处理过，直接丢弃

**sequence 跳号**：
- 跳号意味着中间数据丢失
- 策略：请求后端补发缺失的 seq 段
- 如果补发不可用 → 请求重新订阅（重新走快照+增量流程）

```typescript
class SequenceManager {
  private lastSeq = 0
  private pending = new Map<number, Message>()
  private maxPendingSize = 100

  process(msg: Message): Message | null {
    if (msg.seq <= this.lastSeq) return null  // 重复

    if (msg.seq === this.lastSeq + 1) {
      this.lastSeq = msg.seq
      // 检查 pending 中是否有后续连续消息
      this.flushPending()
      return msg
    }

    // 乱序，放入 pending
    if (msg.seq > this.lastSeq + 1) {
      if (this.pending.size >= this.maxPendingSize) {
        this.requestResync()  // pending 太大，直接重同步
        return null
      }
      this.pending.set(msg.seq, msg)
      return null
    }

    return null
  }

  private flushPending() {
    while (this.pending.has(this.lastSeq + 1)) {
      this.lastSeq++
      const msg = this.pending.get(this.lastSeq)
      this.pending.delete(this.lastSeq)
      this.process(msg!)  // 递归处理，但不会再进 pending
    }
  }
}
```

---

## 六、断线重连后如何恢复？

**义警大屏的重连策略**：

```
断线检测：
  1. WebSocket onclose 触发 → 立即开始重连
  2. 30s 内没收到心跳 → 主动断开，触发重连

重连策略（指数退避 + 随机抖动）：
  第 1 次：1s
  第 2 次：2s
  第 3 次：4s
  第 4 次：8s
  第 5 次：15s（上限）
  + 每次叠加 ±500ms 随机抖动，防止惊群效应

重连后的恢复：
  1. 重新建立 WebSocket 连接
  2. 重新发送 subscribe 消息
  3. 后端重新推送完整快照
  4. 丢弃旧 pending 队列
  5. lastSeq 重置为 0（从快照重新开始）
```

```typescript
class ReconnectManager {
  private ws: WebSocket | null = null
  private maxRetries = 10
  private retryCount = 0
  private timer: number | null = null

  connect() {
    this.ws = new WebSocket(WS_URL)

    this.ws.onclose = () => {
      if (this.retryCount < this.maxRetries) {
        const delay = Math.min(15000, Math.pow(2, this.retryCount) * 1000)
        const jitter = Math.random() * 1000 - 500
        this.timer = setTimeout(() => {
          this.retryCount++
          this.connect()
        }, delay + jitter)
      }
    }

    this.ws.onopen = () => {
      this.retryCount = 0
      // 重新订阅所有 channel
      this.resubscribeAll()
    }

    this.ws.onmessage = (event) => {
      const msg = JSON.parse(event.data)
      if (msg.type === 'snapshot') {
        // 快照到达，恢复完成
        this.onRecovered()
      }
    }
  }
}
```

---

## 七、每条行情都会触发 React 更新吗？

**不会，做节流合并**。

**义警大屏的做法**：

```typescript
const BATCH_INTERVAL = 50  // 50ms 合并窗口

function useBatchedWebSocket(channel: string) {
  const [data, setData] = useState<Snapshot>(initialState)
  const batchRef = useRef<Delta[]>([])
  const timerRef = useRef<number>()

  useEffect(() => {
    const ws = connectWebSocket(channel)

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data)
      batchRef.current.push(msg.data)

      if (!timerRef.current) {
        timerRef.current = setTimeout(() => {
          // 合并批次更新
          setData(prev => mergeDeltas(prev, batchRef.current))
          batchRef.current = []
          timerRef.current = undefined
        }, BATCH_INTERVAL)
      }
    }

    return () => ws.close()
  }, [channel])

  return data
}
```

**AI Agent 对话的 SSE 场景**：
- 每个 chunk 都触发渲染（需要逐字显示）
- 但用 `requestAnimationFrame` 节流渲染频率，避免每毫秒都触发 React 更新
- 实际效果：模型输出速度（10-50ms/chunk）远低于浏览器帧率（16ms），天然不会卡顿

---

## 八、节流期间的数据是丢弃、覆盖还是合并？

**合并，不丢弃也非简单覆盖**。

三种处理逻辑按数据类型区分：

| 数据类型 | 处理方式 | 示例 |
|---------|---------|------|
| 计数器（累计值） | 保留最新值 | 参与人数 = 46000（最新值） |
| 增量值 | 累加合并 | 新增人数 += 每次的 inc |
| 列表项 | 合并+去重 | 活动列表按 id 合并 |

```typescript
// 批处理合并逻辑
function mergeBatch(prev: State, batch: Delta[]): State {
  const merged = { ...prev }
  for (const delta of batch) {
    switch (delta.type) {
      case 'overwrite':
        // 覆盖：取最新值
        merged[delta.key] = delta.value
        break
      case 'accumulate':
        // 累加值
        merged[delta.key] = (merged[delta.key] || 0) + delta.value
        break
      case 'list_merge':
        // 列表合并
        merged[delta.key] = mergeListItems(merged[delta.key], delta.items)
        break
    }
  }
  return merged
}
```

---

## 九、订单簿使用什么数据结构？

虽然简历项目不是交易系统，但实时大屏的**热力图/点位聚合**用了类似思路：

**分层聚合 Map（类比 OrderBook 的价格档位）**：

```typescript
// 热力图的区域聚合（类比价格档位）
class HeatmapAggregator {
  // key = 地理区域的 gridKey（类比价格）
  // value = 该区域的点位聚合数据（类比成交量）
  private gridMap: Map<string, GridCell>
  private sortedKeys: string[]  // 用于快速范围查询

  // 更新点位（类比订单簿的增量更新）
  upsert(point: { lat: number; lng: number; weight: number }) {
    const key = this.latLngToGridKey(point.lat, point.lng)
    const existing = this.gridMap.get(key)
    
    if (existing) {
      existing.count++
      existing.totalWeight += point.weight
    } else {
      this.gridMap.set(key, { 
        gridKey: key, 
        count: 1, 
        totalWeight: point.weight,
        avgWeight: point.weight
      })
      this.sortedKeys = null  // 标记排序失效
    }
  }

  // 聚合查询（类比查询某个价格区间的订单）
  queryRange(minLat: number, maxLat: number, minLng: number, maxLng: number) {
    // 筛选范围内的 gridKey
    return Array.from(this.gridMap.values()).filter(cell => 
      cell.gridKey >= `${minLat}:${minLng}` && 
      cell.gridKey <= `${maxLat}:${maxLng}`
    )
  }
}
```

**OrderBook 标准做法**（如果面试追问金融场景）：

```typescript
// 价格优先的二叉堆 / 跳表
// Key: 价格（需处理浮点精度）
// Value: 数量
// 买方（bids）：最大堆（高价优先）
// 卖方（asks）：最小堆（低价优先）

class OrderBook {
  bids: PriceLevel[] = []  // 降序排列
  asks: PriceLevel[] = []  // 升序排列
  private priceMap: Map<string, PriceLevel> = new Map()  // 价格 → 档位

  update(snapshot: { bids: [string, string][], asks: [string, string][] }) {
    // 快照：全量替换
    this.priceMap.clear()
    // ...重建
  }

  applyDelta(delta: { price: string; size: string; side: 'buy' | 'sell' }) {
    // 增量：增删改
    const key = delta.price
    if (delta.size === '0') {
      this.priceMap.delete(key)  // 删除档位
    } else {
      this.priceMap.set(key, { price: delta.price, size: delta.size })
    }
    // 重新排序
  }
}
```

---

## 十、为什么不直接把数据存在 React state？

**三个原因**：

1. **不必要的重渲染**
   - 实时数据每秒可能变化数百次，直接放 state 会频繁触发 React 更新
   - 实际做法：用 `useRef` 存数据，用 `setState` 做节流后的定期同步

2. **状态管理与视图逻辑耦合**
   - 数据计算（聚合、排序、过滤）和渲染逻辑混在一起
   - 最佳实践：数据层（`useRef`/外部 store）→ 计算层（`useMemo`）→ 渲染层

3. **跨组件共享困难**
   - React state 在组件树中，多个组件需要访问同一份实时数据时，要么层层 props，要么全局 Context
   - Context 更新会导致所有消费组件重渲染，即使它们只关心其中一部分

**义警大屏的实际方案**：

```typescript
// 数据层：外部 store（zustand），独立于组件树
const useRealTimeStore = create<RealTimeState>((set) => ({
  rawData: null,
  updateCount: 0,
  // 节流更新
  batchUpdate: (deltas) => set(state => ({
    rawData: mergeDeltas(state.rawData, deltas),
    updateCount: state.updateCount + 1
  }))
}))

// 组件层：只订阅需要的数据片
function ActivityChart() {
  // 只订阅 totalActivities，变化时才重渲染
  const total = useRealTimeStore(s => s.rawData?.totalActivities)
  return <div>{total}</div>
}

function MemberStats() {
  // 只订阅 memberCount
  const members = useRealTimeStore(s => s.rawData?.memberCount)
  return <div>{members}</div>
}
```

---

## 十一、如何处理价格和数量精度？

**前端精度处理的通用原则**：

```typescript
// 方案一：后端下发字符串，前端不做运算
// 后端返回 "0.00000123" 而非 0.00000123
interface PriceLevel {
  price: string  // 字符串，前端不做浮点运算
  size: string
}

// 方案二：展示用 toFixed，排序用 BigNumber
import BigNumber from 'bignumber.js'

function formatPrice(price: string, decimals: number): string {
  return new BigNumber(price).toFormat(decimals)
}

// 方案三：后端下发整数（最小单位），前端按精度展示
// 例：ETH 精度 18，后端返回 "1230000000000000000"
// 前端展示：formatUnits("1230000000000000000", 18) → "1.23"
function formatUnits(value: string, decimals: number): string {
  const bn = new BigNumber(value)
  const divisor = new BigNumber(10).pow(decimals)
  return bn.div(divisor).toFormat(Math.min(decimals, 8))
}
```

**经验**：
- 前端永远**不要用 JavaScript number 做精度敏感的计算**（0.1 + 0.2 !== 0.3）
- 展示精度和后端计算精度分开：后端算到 18 位，前端展示 2-8 位
- 排序、比较用 BigNumber 或后端下发的排序字段

---

## 十二、深度档位切换如何重新聚合？

**分层聚合 + 懒计算**（类比热力图的不同缩放级别）：

```typescript
// 聚合层级定义
const DEPTH_LEVELS = [
  { level: 0, groupSize: 1,    label: '原始档位' },
  { level: 1, groupSize: 10,   label: '聚合10档' },
  { level: 2, groupSize: 100,  label: '聚合100档' },
  { level: 3, groupSize: 1000, label: '聚合1000档' },
]

// 义警热力图的分层聚合（完全相同的模式）
class DepthAggregator {
  private rawLevels: PriceLevel[] = []
  private cache: Map<number, PriceLevel[]> = new Map()

  // 切换档位时，从缓存取 or 重新聚合
  getLevel(level: number): PriceLevel[] {
    if (this.cache.has(level)) {
      return this.cache.get(level)!
    }

    const { groupSize } = DEPTH_LEVELS[level]
    const aggregated = this.aggregate(this.rawLevels, groupSize)
    this.cache.set(level, aggregated)
    return aggregated
  }

  private aggregate(levels: PriceLevel[], groupSize: number): PriceLevel[] {
    const result: PriceLevel[] = []
    for (let i = 0; i < levels.length; i += groupSize) {
      const group = levels.slice(i, i + groupSize)
      result.push({
        price: group[0].price,  // 取首价
        size: group.reduce((sum, p) => sum.plus(p.size), new BigNumber(0)).toString(),
        count: group.length,
      })
    }
    return result
  }

  // 原始数据更新时，清空缓存
  onRawUpdate() {
    this.cache.clear()
  }
}
```

**关键设计**：
- 缓存失效策略：原始数据有变更时清空缓存，下次切换时重新计算
- 懒计算：只计算被请求的层级，不预计算全部
- 增量更新时，只影响相关分组的聚合值，不做全量重算

---

## 十三、如何减少订单簿闪烁和跳动？

**闪动原因**：频繁 setState → React 重新渲染 → DOM 更新 → 视觉闪烁

**义警大屏的解决方案**：

```typescript
// 方案一：最小值变化跳过（diff 渲染）
class Differ<T> {
  private lastSnapshot: T | null = null
  
  diff(next: T): Partial<T> {
    if (!this.lastSnapshot) {
      this.lastSnapshot = next
      return next  // 首次全量
    }
    
    const changed: Partial<T> = {}
    for (const key of Object.keys(next)) {
      if (JSON.stringify(next[key]) !== JSON.stringify(this.lastSnapshot![key])) {
        changed[key] = next[key]
      }
    }
    this.lastSnapshot = next
    return changed
  }
}

// 方案二：稳定排序 + key 不变
// 价格档位按固定顺序排列，不要重新排序
// 用价格作为 React key，不要用 index
{levels.map(level => (
  <LevelRow key={level.price} data={level} />
))}

// 方案三：单个元素的跳动用 CSS transition 做平滑过渡
// 数量变化时用 transition: width 0.3s
// 位置变化时用 transition: top 0.3s

// 方案四：变化不明显的元素不做更新
// 数量变化 < 1% 时不更新 DOM，只在数值变化超过阈值时更新
```

---

## 十四、如何计算背景深度条？

**相对比例计算**：

```typescript
function computeDepthBars(levels: PriceLevel[]) {
  // 1. 找最大数量作为 100% 基准
  const maxSize = Math.max(...levels.map(p => parseFloat(p.size)))
  
  // 2. 计算每个档位的宽度比例（从左到右）
  return levels.map(level => {
    const ratio = parseFloat(level.size) / maxSize
    
    // 卖出（红色/绿色背景条，从右往左）
    if (level.side === 'ask') {
      return {
        ...level,
        barStyle: {
          position: 'absolute',
          right: 0,
          width: `${ratio * 100}%`,
          backgroundColor: `rgba(255, 0, 0, ${0.1 + ratio * 0.2})`,
        }
      }
    }
    
    // 买入（绿色背景条，从左往右）
    return {
      ...level,
      barStyle: {
        position: 'absolute',
        left: 0,
        width: `${ratio * 100}%`,
        backgroundColor: `rgba(0, 255, 0, ${0.1 + ratio * 0.2})`,
      }
    }
  })
}
```

**义警大屏的条形图背景**（同样的逻辑）：

```typescript
// 热力图的色深 = 按区域密度动态计算
// 密度越高，颜色越深，透明度越高
function computeHeatmapColor(count: number, maxCount: number): string {
  const ratio = count / maxCount
  // ratio 0~1 → 透明度 0.1~0.9
  const alpha = 0.1 + ratio * 0.8
  return `rgba(255, 100, 0, ${alpha})`
}
```

---

## 十五、如何处理服务器时间和客户端时间不一致？

```typescript
class TimeSync {
  private offset = 0

  // 连接时做一次时间同步
  async sync(ws: WebSocket) {
    const clientSendTime = Date.now()
    
    ws.send(JSON.stringify({ type: 'ping', clientTime: clientSendTime }))
    
    // 等待 pong 响应
    const pong = await this.waitForPong(ws)
    const clientReceiveTime = Date.now()
    
    const serverTime = pong.serverTime
    const rtt = clientReceiveTime - clientSendTime
    
    // 估算时钟偏差
    // 假设网络延迟对称，服务器处理时间忽略
    this.offset = serverTime - (clientSendTime + rtt / 2)
  }

  getCurrentServerTime(): number {
    return Date.now() + this.offset
  }
}
```

**注意**：
- 时间偏差会随着 TCP 连接变化，需要定期校准（每 5 分钟一次）
- 如果 NTP 不可用（浏览器环境），用上述方式做近似同步
- 义警项目管理后台用的是 NTP 同步 + 阿里云 ARMS 时间戳，精度在 10ms 以内

---

## 十六、如何做监控？

**义警大屏的实时数据监控体系**：

```
前端侧（阿里云 ARMS）：
  1. WebSocket 连接状态（connected/disconnected）
  2. 消息吞吐量（msg/s）
  3. 延迟（P50/P95/P99 end-to-end）
  4. 重连次数/频率
  5. 数据错误率（parse error, seq gap）

告警规则：
  - WebSocket 断开超过 30s → P1 告警
  - P99 延迟 > 1s → P2 告警
  - 重连频率 > 5次/min → P2 告警
  - seq 跳号 > 10次/min → P3 告警

后端侧（Prometheus + Grafana）：
  1. WebSocket 连接数
  2. 推送消息速率
  3. 各 channel 的 QPS
  4. 推送延迟（服务端处理到发出）

业务侧：
  1. 数据刷新间隔（前端检测）
  2. 数据新鲜度（最后一次更新时间距离当前时间）
  3. 前端页面卡顿检测（long task 监控）
```

---

## 十七、如何测试 OrderBook？

虽然没有金融 OrderBook 项目，但大规模实时数据处理我用类似方法测试：

```typescript
// 层级 1：单元测试 —— 核心合并逻辑
describe('Delta Merger', () => {
  it('should apply inc operation', () => {
    const state = { count: 10 }
    const result = applyDelta(state, { key: 'count', op: 'inc', value: 5 })
    expect(result.count).toBe(15)
  })

  it('should merge list items by id', () => {
    const state = { items: [{ id: 1, name: 'a' }] }
    const delta = { key: 'items', op: 'merge', items: [{ id: 2, name: 'b' }] }
    const result = applyDelta(state, delta)
    expect(result.items).toHaveLength(2)
  })

  it('should handle overwrite correctly', () => {
    const state = { name: 'old' }
    const result = applyDelta(state, { key: 'name', op: 'set', value: 'new' })
    expect(result.name).toBe('new')
  })
})

// 层级 2：WebSocket 连接测试（Mock）
describe('WebSocket Reconnection', () => {
  it('should reconnect with exponential backoff', async () => {
    const ws = new MockWebSocket()
    const manager = new ReconnectManager({ ws })
    
    ws.simulateDisconnect()
    expect(manager.retryCount).toBe(1)
    expect(manager.getNextDelay()).toBeCloseTo(2000, -2)  // ~2s
  })

  it('should resubscribe after reconnect', async () => {
    const subscribe = vi.fn()
    const manager = new ReconnectManager({ subscribe })
    
    manager.simulateReconnect()
    expect(subscribe).toHaveBeenCalled()
  })
})

// 层级 3：性能测试（批量压力）
describe('Performance', () => {
  it('should process 1000 messages within 100ms', () => {
    const messages = generateMessages(1000)
    const start = performance.now()
    
    for (const msg of messages) {
      processor.process(msg)
    }
    
    const elapsed = performance.now() - start
    expect(elapsed).toBeLessThan(100)
  })

  it('should maintain 60fps with batched updates', async () => {
    // 模拟 50ms 窗口内收到 100 条消息
    const batch = generateDeltas(100)
    const frames = measureFrameDurations(() => {
      batch.forEach(d => processor.enqueue(d))
      flushBatch()  // 触发节流渲染
    })
    
    // 所有帧应该在 16ms 内完成
    frames.forEach(fps => expect(fps).toBeGreaterThanOrEqual(55))
  })
})
```

---

## 十八、每秒从 1,000 条增长到 10,000 条，瓶颈在哪里？

**按优先级排序的瓶颈分析**：

```
第一梯队（最可能先出问题）：
  1. WebSocket 消息解析 + JSON.parse
     - 1 万条/秒 → 每秒 1 万次 JSON.parse
     - 优化：二进制协议（MessagePack/Protocol Buffers）
  
  2. React 渲染
     - 即使做了节流，每次批处理合并大量数据也会卡顿
     - 优化：Web Worker 做数据合并，主线程只做渲染

第二梯队：
  3. 节流队列堆积
     - 50ms 窗口内堆积 500 条 → 合并耗时增加 → 影响下一帧
     - 优化：动态调整节流窗口，负载高时自动增大窗口

  4. 内存增长
     - 1 万条/s × 100 条/snap × 1KB ≈ 10MB/s
     - 30 分钟不释放 → 18GB
     - 优化：限制历史缓存，定期清理

第三梯队：
  5. 浏览器渲染瓶颈
     - DOM 操作/重排/重绘
     - 优化：Canvas 渲染替代 DOM，虚拟列表

  6. 网络带宽
     - 1 万条 × 200 字节 = 2MB/s = 16Mbps
     - 一般公司内网没问题，公网可能受限
     - 优化：数据压缩，增量合并后推送
```

**实际在义警大屏遇到的经验**：
- 从 1K 到 10K，最先撑不住的是 JSON.parse（浏览器主线程卡死）
- 解决方案：切到 Web Worker 做数据解析和合并
- 其次是用 Canvas 替代 DOM 渲染热力图，渲染帧率从 15fps 回到 60fps

---

## 十九、有没有使用虚拟列表、Canvas 或 Web Worker？

**义警大屏/小哥码全部用到**：

```typescript
// 1. 虚拟列表（@tanstack/vue-virtual）
// 物业工单列表 5000+ 条，只渲染可视区 20 条
const { virtualItems } = useVirtualizer({
  count: items.length,
  getScrollElement: () => scrollRef.value,
  estimateSize: () => 80,
})
// 优化结果：滚动帧率 15fps → 55fps+

// 2. Canvas 渲染
// 百万级数据热力图：用 Canvas 2D 替代 DOM/SVG
// 降采样（LTTB）后绘制，保持 60fps
function renderHeatmap(ctx: CanvasRenderingContext2D, data: Point[]) {
  ctx.clearRect(0, 0, width, height)
  for (const point of data) {
    const alpha = Math.min(1, point.weight / maxWeight)
    ctx.fillStyle = `rgba(255, 100, 0, ${alpha})`
    ctx.beginPath()
    ctx.arc(point.x, point.y, point.radius, 0, Math.PI * 2)
    ctx.fill()
  }
}

// 3. Web Worker（数据解析 + 合并 + 降采样）
// 主线程只负责渲染，计算密集型任务扔到 Worker
const worker = new Worker('data-processor.worker.js')
worker.postMessage({ type: 'process', data: rawMessages })
worker.onmessage = (event) => {
  // Worker 处理完的数据直接用于渲染
  setChartData(event.data.sampled)
}
```

---

## 二十、这个模块最关键的技术取舍是什么？

**义警大屏实时数据模块的三个关键技术取舍**：

### 取舍一：节流 vs 实时性

```
选择：50ms 节流窗口
原因：浏览器 60fps = 16ms/帧，50ms 窗口最多积压 3 帧
      不影响用户体验，但大幅减少 React 更新次数
代价：丢失了 50ms 内的中间状态（用户看不到每一笔变化）
      但对可视化大屏来说，50ms 延迟用户无感知
```

### 取舍二：快照+增量 vs 全量推送

```
选择：快照+增量
原因：全量推送每次 500KB+，增量仅几 KB
      带宽节省 95%+，延迟降低 80%
代价：需要处理 sequence、乱序、重连恢复
      实现复杂度显著增加
```

### 取舍三：DOM vs Canvas

```
选择：低数据量用 DOM，高数据量用 Canvas
原因：
  DOM：适合 < 1000 条，交互友好（点击、hover、滚动）
  Canvas：适合 > 10000 条，渲染性能好，但不支持事件
  方案：DOM + 虚拟列表兜底，Canvas + 命中检测做交互
代价：维护两套渲染逻辑，Canvas 的交互（点击热点）需要自己实现
```

**最关键的认知**：**没有银弹**。每种方案都有适用场景和代价，真正的能力是能根据业务场景和数据量级，选最合适的取舍，并且知道什么时候该切换方案。

---

## 面试官可能追加的压力题

### 1. UI 每 50ms 刷新一次，凭什么叫实时？

"实时"是相对于**用户感知**的，不是物理意义上的"零延迟"。
- 人眼视觉暂留约 100ms，50ms 刷新已经超过人眼感知阈值
- 行业标准：金融行情通常定义 <100ms 为实时
- 我们的 AI Agent SSE 首字延迟 200ms，用户已经觉得是"秒回"
- 大屏数据 50ms 刷新，操作员看到的就是"实时跳动"

### 2. 相同价格在一个批次内先删除再新增，怎么处理？

在批处理合并阶段做**操作抵消**：
- 扫描批次内同一价格的操作序列
- 删除 + 新增（相同价格）→ 抵消为"更新"
- 删除 + 删除 → 保持删除
- 新增 + 删除 → 抵消（不做任何操作）

```typescript
function optimizeBatch(batch: Operation[]): Operation[] {
  const byPrice = new Map<string, Operation[]>()
  for (const op of batch) {
    if (!byPrice.has(op.price)) byPrice.set(op.price, [])
    byPrice.get(op.price)!.push(op)
  }

  const result: Operation[] = []
  for (const [price, ops] of byPrice) {
    if (ops.length === 1) {
      result.push(ops[0])
    } else {
      // 多条操作，抵消后只保留最终状态
      const lastDelete = ops.findLast(o => o.type === 'delete')
      const lastAdd = ops.findLast(o => o.type === 'add')
      if (lastDelete && !lastAdd) result.push(lastDelete)
      else if (!lastDelete && lastAdd) result.push(lastAdd)
      else if (lastDelete && lastAdd) {
        // 删除后新增 = 更新
        result.push({ ...lastAdd, type: 'update' })
      }
    }
  }
  return result
}
```

### 3. 快照接口返回期间，增量消息已经来了怎么办？

**序列号机制保证**：
- 前端订阅时，后端返回当前数据版本号（snapshotId）
- 增量消息携带 snapshotId，前端缓存快照返回前的增量
- 快照到达后，用 snapshotId 过滤掉快照已包含的增量
- 未包含的增量按 sequence 顺序回放

```typescript
// 快照请求时标记
let pendingDeltas: Delta[] = []
let snapshotId: string | null = null

function subscribe(channel: string) {
  ws.send({ type: 'subscribe', channel })
  snapshotId = uuid()  // 生成本次快照 ID
  ws.send({ type: 'request_snapshot', channel, snapshotId })
}

// 快照到达前收到的增量，先缓存
ws.onmessage = (msg) => {
  if (msg.snapshotId && msg.snapshotId === snapshotId) {
    pendingDeltas.push(msg)
    return  // 不处理，等快照
  }
}

// 快照到达
ws.onmessage = (msg) => {
  if (msg.type === 'snapshot') {
    state = msg.data
    // 回放快照之后、但快照之前到达的增量
    // 通常这些增量 snapshotId 不同，直接丢弃
    pendingDeltas = pendingDeltas.filter(d => d.snapshotId === snapshotId)
    // 按 seq 排序后回放
    pendingDeltas.sort((a, b) => a.seq - b.seq)
    for (const delta of pendingDeltas) {
      applyDelta(state, delta)
    }
    pendingDeltas = []
    snapshotId = null
  }
}
```

### 4. 为什么 sequence gap 不能直接跳过去？

因为跳号意味着**数据丢失**，而丢失的数据可能包含关键信息：
- 价格突变（闪崩/拉升）
- 大额挂单/撤单
- 状态变更

如果跳过去，前端展示的数据会与真实数据产生偏差。对于行情展示可能问题不大（展示近似值），但对交易决策系统可能是致命的。

### 5. OrderBook 卡顿会不会影响下单？

**会**。根据架构决定影响范围：
- 如果渲染和下单在同一个线程（主线程）→ 卡顿会导致点击延迟、下单请求发不出去
- 解决方案：下单请求通过独立通道（HTTP API 而非 WebSocket 同一连接），不依赖渲染线程
- 义警大屏的做法：关键操作（审批、派单）走 REST API，非关键操作（数据刷新）走 WebSocket，**控制面和数据面分离**

### 6. 页面切换交易对后，旧交易对消息到达怎么办？

```typescript
// 方案：版本号 + 连接隔离
const activeChannelRef = useRef<string>()

function switchSymbol(symbol: string) {
  // 订阅新交易对
  const channel = `orderbook:${symbol}`
  activeChannelRef.current = channel
  ws.send({ type: 'subscribe', channel })

  // 旧交易对的消息通过 channel 字段区分
  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data)
    // 只处理当前活跃 channel 的消息
    if (msg.channel !== activeChannelRef.current) {
      return  // 旧数据，直接丢弃
    }
    process(msg)
  }
}
```

**或者更彻底**：切换时断开旧 WebSocket，新建新连接（适合不同数据源）。

---

## 回答时最容易踩的坑

| 坑 | 错误回答 | 正确思路 |
|----|---------|---------|
| 夸大实时性 | "我们是真正的实时，零延迟" | 量化延迟，说清楚 P50/P95/P99 |
| 忽略 trade-off | "我们全部用 Canvas" | 说明 DOM vs Canvas 的选型依据 |
| 不提监控 | 没想好怎么答 | 强调 ARMS 监控 + 告警体系 |
| 纸上谈兵 | 说理论不说实操 | 结合义警/小哥码真实数据（如 "50ms 节流窗口"） |
| 忽视异常处理 | "断线会自动重连" | 说完重连再说 seq 恢复、pending 清理 |
| 忽略精度问题 | "用 number 存价格" | 强调 bignumber.js / 字符串传递 |
| 过度承诺 | "我们可以处理 100 万 TPS" | 说实话："没实际测过 10K+，但架构上通过 Worker+Canvas 理论上可扩展" |
