---
title: 高级全栈工程师面试题（含 JD）
---

# 职位描述

## 技术要求
TypeScript，CSS，后端开发经验，Node.js，MySQL/Redis/MongoDB，计算机相关专业，React，前端开发经验，全栈项目经验

## 任职要求

### 硬性要求
- 3 年以上全栈开发经验，熟悉 React + Node.js 技术栈
- TypeScript 熟练使用，理解类型系统、泛型、接口设计
- 有 LLM/AI API 集成经验，例如调用过 OpenAI、Gemini、Claude 等任一模型的 SDK，亲自写过 Prompt Template
- 熟悉 RESTful API 设计、了解常见后端架构模式（MVC / Service-Repository）
- Git 协作经验，熟悉分支策略、Code Review 流程

### 加分项
- 有 React 组件库搭建或大型 SPA 重构经验
- 有 PostgreSQL + Prisma/TypeORM 实战经验
- 了解联合国 UNGM/UNSPSC 采购体系或跨境贸易业务流程（可在入职后学习）
- 有 Docker/Docker Compose 及云服务部署经验（AWS/GCP/阿里云）
- 有 i18n 国际化项目实战经验（不限于简单的 key-value 替换，而是多语言路由/SEO/内容管理）
- 有 Next.js 或 Remix 等 React 全栈框架经验（未来可能迁移）
- 开源项目贡献经历

### 软素质
- 能从工程角度审视 AI 生成的代码，具备重构和抽象能力
- 在没有详细产品文档的情况下，能通过阅读代码和 API 反向理解业务逻辑
- 中英文文档读写能力（代码注释/README 需双语，AI Prompt 需英文调优）
- 对代码质量有追求：能写出"自己愿意维护"而非"能跑就行"的代码

## 岗位职责

1. **前端架构重构与组件化拆分**
   - 当前 App.tsx 为单文件组件（约 2500 行），需要进行组件拆分和模块化重构
   - 将 7 个功能 tab（海外展厅、共采系列、供应商目录、CRM、服务生态、学习中心、会员区）拆分为独立的功能模块
   - 抽离可复用的表单组件（展厅入驻、供应商注册、咨询预约）、模态弹窗、筛选器、拖拽上传等 UI 单元
   - 引入或设计合适的 React 状态管理方案（当前为纯 useState 驱动，无状态管理库）

2. **后端工程化与数据持久化**
   - 改造当前"内存数据库"为真正的持久化存储（推荐 PostgreSQL+Prisma，或 MySQL）
   - 设计合理的数据库 Schema，覆盖 6 大实体类型（ExhibitionHall、Supplier、Lead、Opportunity、LearningMaterial、FAQItem）
   - 为现有 6 个 REST API 端点添加分页、过滤、排序等生产级特性
   - 引入 API 层抽象（Service/Repository 模式），将当前嵌入在 server.ts 中的业务逻辑分离

3. **AI/LLM 功能增强**
   - 维护并优化现有的 Gemini 3.5 集成：Prompt 调优、输出格式约束、上下文窗口管理
   - 探索更多 AI 应用场景：智能供应商推荐、自动线索评分/优先级排序、合规文档 AI 审核
   - 设计并实现 AI 调用的观测与监控（token 用量统计、响应延迟、成功率追踪）
   - 引入多模型降级策略（Gemini → OpenAI → 开源模型，当主模型不可用时自动切换）

4. **用户系统与权限**
   - 当前系统没有身份验证，任何人可访问所有 API。需要引入用户注册/登录系统
   - 实现角色分级：游客 / 注册会员 / 金牌 VIP 会员，对应不同的功能访问权限
   - 将当前前端模拟的 VIP 开关替换为真实的后端权限校验
   - OAuth 集成（Google/GitHub 登录可选）

5. **真实文件上传**
   - 当前文件拖拽上传为纯前端模拟（仅提取文件名，不上传）。需要实现真实的文件存储
   - 支持 PDF、图片、Word 文档上传，用于企业资质材料、产品白皮书等
   - 文件存储方案：可选云存储（AWS S3 / Cloudflare R2）或本地文件系统 + CDN

6. **国际化完善与 SEO**
   - 当前中英双语翻译覆盖约 80 个 key，需要补齐所有硬编码的中文/英文文案
   - 确保 AI Prompt 在多语言场景下的输出质量一致
   - SEO 优化：SSR 或预渲染关键页面（展厅列表、供应商详情），添加 meta 标签和结构化数据

7. **测试与 CI/CD**
   - 当前项目无任何测试代码。需要建立测试体系：Vitest 单元测试 + Playwright E2E 测试
   - 编写 API 集成测试，覆盖 6 个端点的正常与异常路径
   - 搭建 GitHub Actions CI/CD 流水线：lint → typecheck → test → build → deploy

8. **部署与运维**
   - 当前开发服务器端口硬编码为 3039，需要支持通过环境变量配置
   - Docker 化部署方案：编写 Dockerfile + docker-compose
   - 可选：迁移为更标准的部署架构（Nginx 反向代理 + PM2 进程管理 + HTTPS）

---

# 高级全栈工程师面试题（基于 JD 场景）

根据上述职位描述中的真实项目场景（全栈重构、AI 集成、从 0 到 1 基建），设计以下问题：

---

## 一、前端架构重构（App.tsx 2500 行 → 模块化）

**问题 1：** 一个 2500 行的单文件组件，有 7 个功能 Tab。你怎么设计拆分方案？状态管理怎么选型？如果团队要求不能引入 Redux/Zustand 等第三方库，你怎么用 React 原生 API 做状态管理？

**解答：**

**拆分方案**：
1. **按 Tab 拆目录**：每个 Tab 独立为一个目录 `src/tabs/{海外展厅,共采系列,...}/`，包含组件 + hooks + types
2. **按 UI 层级拆**：抽离可复用 UI 单元（表单、弹窗、筛选器、拖拽上传）到 `src/components/`
3. **按职责分层**：
   - `pages/` — 页面级组件，负责布局和组合
   - `containers/` — 带业务逻辑的容器组件
   - `components/` — 纯 UI 组件
   - `hooks/` — 自定义 hooks 抽离逻辑
   - `services/` — API 调用层

**状态管理选型**：
```
纯 useState → 发现痛点：跨 Tab 共享状态（如当前用户、选中的供应商）
                          → 通过 Context + useReducer 解决
                          → 如果 Context 导致不必要的重渲染
                          → 拆分为多个粒度更小的 Context（UserContext / FilterContext / UIContext）

不引入第三方库的方案：
  1. useReducer + Context：适合中大型项目
  2. 自定义 useStore hook（发布订阅模式）：
     const store = createStore({ user: null, filters: {} })
     // store 内部用 useSyncExternalStore 连接 React
     function useUser() {
       return useSyncExternalStore(store.subscribe, () => store.getState().user)
     }
```

**实际选型建议**：Zustand（2KB，无 Provider，API 简洁），如果团队限制则用 Context + useReducer + useSyncExternalStore。

---

**问题 2：** 7 个 Tab 之间需要共享状态（如选中的供应商、筛选条件），但每个 Tab 又需要独立的路由和懒加载。你怎么设计路由和代码分割方案？

**解答：**

```typescript
// 路由设计
const routes = [
  { path: '/', element: <Dashboard />, children: [
    { path: 'exhibition', element: lazy(() => import('./tabs/ExhibitionHall')) },
    { path: 'procurement', element: lazy(() => import('./tabs/Procurement')) },
    { path: 'suppliers',   element: lazy(() => import('./tabs/SupplierDirectory')) },
    { path: 'crm',         element: lazy(() => import('./tabs/CRM')) },
    { path: 'ecosystem',   element: lazy(() => import('./tabs/Ecosystem')) },
    { path: 'learning',    element: lazy(() => import('./tabs/LearningCenter')) },
    { path: 'member',      element: lazy(() => import('./tabs/MemberArea')) },
  ]}
]

// 各 Tab 路由下还可嵌套子路由（如供应商详情 /suppliers/:id）
// 使用 <Suspense fallback={<TabSkeleton />}> 包裹懒加载组件
```

**代码分割策略**：
```
├── src/
│   ├── tabs/
│   │   ├── ExhibitionHall/     ← 独立 chunk
│   │   ├── Procurement/        ← 独立 chunk
│   │   └── ...                  ← 每个 Tab 独立懒加载
│   ├── shared/                  ← 公共代码（会打包到主 chunk）
│   │   ├── components/          ← 可复用 UI
│   │   ├── hooks/              ← 共享 hooks
│   │   └── store/              ← 全局状态（Zustand store）
│   └── App.tsx                 ← 缩小到只做路由 + 布局
```

**共享状态方案**：Zustand store 独立于组件树，跨 Tab 共享：
```typescript
// store/global.ts
export const useGlobalStore = create<GlobalState>((set) => ({
  selectedSupplier: null,
  filters: {},
  setSelectedSupplier: (supplier) => set({ selectedSupplier: supplier }),
  setFilters: (filters) => set({ filters }),
}))
```

**要点**：各 Tab 独立打包，但共享 store 在主 chunk 中，不会重复加载。

---

## 二、后端工程化（内存数据库 → 持久化存储）

**问题 3：** 项目当前用内存数组存储数据，所有逻辑写在 server.ts 里。你要迁移到 PostgreSQL + Prisma，并引入 Service/Repository 模式。请给出完整的架构设计方案，包括目录结构、数据流和关键代码片段。

**解答：**

**目录结构**：
```
server/
├── src/
│   ├── routes/           ← 路由层（仅做请求路由和参数校验）
│   │   ├── exhibition.ts
│   │   ├── supplier.ts
│   │   └── index.ts
│   ├── controllers/      ← 控制器层（处理请求/响应，调用 service）
│   │   ├── exhibition.controller.ts
│   │   └── supplier.controller.ts
│   ├── services/         ← 业务逻辑层（事务、组合、校验）
│   │   ├── exhibition.service.ts
│   │   └── supplier.service.ts
│   ├── repositories/     ← 数据访问层（Prisma 封装，仅做 CRUD）
│   │   ├── exhibition.repository.ts
│   │   └── supplier.repository.ts
│   ├── middleware/        ← 中间件（auth、validation、error handler）
│   ├── types/            ← 类型定义
│   └── app.ts            ← Express/Fastify 应用配置
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── tests/
└── server.ts             ← 入口文件，启动服务器
```

**数据流**：
```
请求 → 路由(Route) → 控制器(Controller) → 服务层(Service)
                                              ↓
                                        仓库层(Repository)
                                              ↓
                                        数据库(PostgreSQL)
```

**Prisma Schema 示例（覆盖 6 大实体）**：
```prisma
model ExhibitionHall {
  id          String   @id @default(cuid())
  name        String
  company     String
  description String?
  category    String
  status      Status   @default(PENDING)
  contactInfo Json?    // 联系方式（电话、邮箱、地址）
  documents   Document[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model Supplier {
  id           String       @id @default(cuid())
  companyName  String
  contactName  String
  email        String
  phone        String?
  certifications String[]
  rating       Float        @default(0)
  leads        Lead[]
  opportunities Opportunity[]
  createdAt    DateTime     @default(now())
  updatedAt    DateTime     @updatedAt
}

model Lead {
  id          String   @id @default(cuid())
  supplierId  String
  supplier    Supplier @relation(fields: [supplierId], references: [id])
  source      String   // 来源：展会/搜索/推荐
  status      LeadStatus @default(NEW)
  score       Int      @default(0)  // AI 线索评分
  notes       String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model Opportunity {
  id          String        @id @default(cuid())
  supplierId  String
  supplier    Supplier      @relation(fields: [supplierId], references: [id])
  title       String
  amount      Float?
  stage       OpportunityStage @default(DISCOVERY)
  probability Int           @default(0)
  assignedTo  String?
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt
}

model LearningMaterial {
  id          String   @id @default(cuid())
  title       String
  description String?
  url         String
  category    String
  language    String   @default("zh-CN")
  tags        String[]
  createdAt   DateTime @default(now())
}

model FAQItem {
  id          String   @id @default(cuid())
  question    String
  answer      String
  category    String
  language    String   @default("zh-CN")
  order       Int      @default(0)
  createdAt   DateTime @default(now())
}
```

**Service/Repository 模式实现**：
```typescript
// repositories/exhibition.repository.ts
export class ExhibitionRepository {
  constructor(private prisma: PrismaClient) {}
  
  async findAll(params: { page: number; pageSize: number; filters?: ExhibitionFilter }) {
    const { page, pageSize, filters } = params
    const where = buildWhereClause(filters)
    
    const [items, total] = await Promise.all([
      this.prisma.exhibitionHall.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: { documents: true },
      }),
      this.prisma.exhibitionHall.count({ where }),
    ])
    
    return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) }
  }
  
  async findById(id: string) {
    return this.prisma.exhibitionHall.findUnique({ where: { id }, include: { documents: true } })
  }
  
  async create(data: CreateExhibitionDto) {
    return this.prisma.exhibitionHall.create({ data })
  }
}

// services/exhibition.service.ts
export class ExhibitionService {
  constructor(private repo: ExhibitionRepository) {}
  
  async getExhibitions(params: PaginationParams) {
    // 业务逻辑：校验参数、默认值、权限检查
    const page = Math.max(1, params.page)
    const pageSize = Math.min(100, Math.max(1, params.pageSize))
    
    return this.repo.findAll({ page, pageSize, filters: params.filters })
  }
  
  async createExhibition(data: CreateExhibitionDto, userId: string) {
    // 事务：创建展厅 + 记录操作日志
    return this.prisma.$transaction(async (tx) => {
      const exhibition = await tx.exhibitionHall.create({ data: { ...data, createdBy: userId } })
      await tx.auditLog.create({ data: { action: 'CREATE', entity: 'ExhibitionHall', entityId: exhibition.id, userId } })
      return exhibition
    })
  }
}

// controllers/exhibition.controller.ts
export class ExhibitionController {
  constructor(private service: ExhibitionService) {}
  
  list = async (req: Request, res: Response) => {
    const result = await this.service.getExhibitions({
      page: parseInt(req.query.page as string) || 1,
      pageSize: parseInt(req.query.pageSize as string) || 20,
      filters: {
        category: req.query.category as string,
        status: req.query.status as Status,
        search: req.query.search as string,
      }
    })
    res.json({ success: true, data: result })
  }
}
```

**从内存数组迁移到数据库的步骤**：
1. 创建 Prisma Schema + 运行迁移
2. 实现 Repository 层（封装所有 Prisma 查询）
3. 实现 Service 层（移入 server.ts 中的业务逻辑）
4. 修改 Controller/Route 层指向新的 Service
5. 写数据迁移脚本：读取内存 JSON → 写入 PostgreSQL
6. 删除旧的内存数组代码
7. 为 6 个端点添加分页、过滤、排序

---

**问题 4：** 6 个 REST API 端点需要添加分页、过滤、排序。你怎么做到统一、可复用的 API 查询方案，避免每个端点重复实现？

**解答：**

```typescript
// types/api.ts
interface PaginationParams {
  page: number
  pageSize: number
  sort?: string        // "createdAt:desc"
  search?: string
  filters?: Record<string, any>
}

interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
}

// 通用查询构建器
function buildPrismaQuery(params: PaginationParams, prismaModel: any, searchFields?: string[]) {
  const { page, pageSize, sort, search, filters } = params
  const orderBy: any = {}
  
  if (sort) {
    const [field, dir] = sort.split(':')
    orderBy[field] = dir || 'asc'
  } else {
    orderBy.createdAt = 'desc'
  }
  
  const where: any = { ...filters }
  
  if (search && searchFields) {
    where.OR = searchFields.map(field => ({
      [field]: { contains: search, mode: 'insensitive' }
    }))
  }
  
  return {
    where,
    orderBy,
    skip: (page - 1) * pageSize,
    take: pageSize,
  }
}

// 使用示例（所有端点统一调用）
class BaseService {
  constructor(protected prisma: PrismaClient) {}
  
  async paginatedFind<T>(
    model: keyof PrismaClient,
    params: PaginationParams,
    searchFields?: string[]
  ): Promise<PaginatedResponse<T>> {
    const query = buildPrismaQuery(params, model, searchFields)
    
    const [items, total] = await Promise.all([
      (this.prisma[model] as any).findMany(query),
      (this.prisma[model] as any).count({ where: query.where }),
    ])
    
    return {
      items,
      total,
      page: params.page,
      pageSize: params.pageSize,
      totalPages: Math.ceil(total / params.pageSize),
      hasNext: params.page * params.pageSize < total,
      hasPrev: params.page > 1,
    }
  }
}

// 具体 Service 继承 BaseService
class ExhibitionService extends BaseService {
  async list(params: PaginationParams) {
    return this.paginatedFind('exhibitionHall', params, ['name', 'company', 'description'])
  }
}
```

---

## 三、AI/LLM 功能增强

**问题 5：** 你接手了一个已有的 Gemini 集成，但 Prompt 是硬编码的、没有输出格式约束、没有上下文窗口管理。你怎么重构这个 AI 调用层？请给出 Prompt Template 管理方案、输出格式约束（JSON Mode）和上下文管理策略。

**解答：**

```typescript
// services/ai/prompt-templates.ts
// 统一管理所有 Prompt Template
export const PROMPT_TEMPLATES = {
  supplierRecommendation: {
    system: `你是一个跨境贸易采购专家。根据用户的需求，推荐最匹配的供应商。
输出格式必须是 JSON，严格遵循以下结构：
{
  "recommendations": [
    {
      "supplierId": "string",
      "reason": "string",
      "matchScore": number,  // 0-100
      "confidence": "high|medium|low"
    }
  ],
  "summary": "string"
}`,
    user: (query: string, suppliers: SupplierBrief[]) => `
用户需求：${query}

可选供应商：
${suppliers.map(s => `- ${s.companyName}（${s.category}，评分 ${s.rating}）`).join('\n')}

请推荐最匹配的 3 个供应商。
`
  },
  
  leadScoring: {
    system: `你是一个销售线索评分专家。根据线索信息给出评分和优先级。
输出 JSON：
{
  "score": number,      // 0-100
  "priority": "high|medium|low",
  "reasoning": "string",
  "suggestedAction": "string"
}`,
    user: (lead: LeadInfo) => `
线索信息：
公司：${lead.companyName}
来源：${lead.source}
行业：${lead.industry}
预算：${lead.budget || '未知'}
时间线：${lead.timeline || '未知'}

请评分并给出跟进建议。
`
  },
  
  complianceReview: {
    system: `你是一个国际贸易合规审查专家。审核文档内容是否符合 UNSPSC 分类标准和国际贸易法规。
输出 JSON：
{
  "compliant": boolean,
  "issues": [{ "type": "string", "severity": "high|medium|low", "description": "string" }],
  "suggestions": string[]
}`,
    user: (documentText: string) => `请审核以下文档：\n\n${documentText}`
  }
}

// services/ai/ai-service.ts
export class AIService {
  private model: GenerativeModel
  private tokenCounter: TokenCounter
  
  constructor() {
    this.model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })
    this.tokenCounter = new TokenCounter()
  }
  
  async generate<T>(template: PromptTemplate, params: Record<string, any>): Promise<AIResult<T>> {
    const startTime = Date.now()
    
    try {
      // 1. 构建消息
      const systemPrompt = template.system
      const userPrompt = template.user(...Object.values(params))
      
      // 2. Token 估算 + 上下文截断
      const estimatedTokens = this.tokenCounter.estimate(systemPrompt + userPrompt)
      const truncatedPrompt = this.truncateContext(systemPrompt, userPrompt, estimatedTokens)
      
      // 3. 调用模型（JSON mode）
      const result = await this.model.generateContent({
        contents: [{ role: 'user', parts: [{ text: truncatedPrompt }] }],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.1,  // 低温度保证结构化输出
        },
      })
      
      // 4. 解析 JSON 输出
      const parsed = JSON.parse(result.response.text()) as T
      
      // 5. 监控数据
      const latency = Date.now() - startTime
      const tokenUsage = { prompt: estimatedTokens, completion: result.response.usageMetadata?.candidatesTokenCount || 0 }
      
      return { success: true, data: parsed, latency, tokenUsage }
      
    } catch (error) {
      // 6. 降级策略
      return this.fallback(error, template, params)
    }
  }
  
  private async fallback<T>(error: any, template: PromptTemplate, params: Record<string, any>): Promise<AIResult<T>> {
    // 降级链路：Gemini → OpenAI → 本地模型
    const fallbackModels = [/* OpenAI, Claude, ollama */]
    
    for (const model of fallbackModels) {
      try {
        return await model.generate(template, params)
      } catch (e) {
        continue
      }
    }
    
    // 全部失败，返回兜底结果
    return { success: false, error: error.message, data: this.getDefaultResponse(template) }
  }
  
  private truncateContext(system: string, user: string, estimated: number): string {
    const MAX_TOKENS = 128000 - 2000  // 留 2000 token 给输出
    if (estimated <= MAX_TOKENS) return user
    
    // 上下文窗口管理：优先保证 system prompt + 当前用户输入
    // 如果历史上下文过长，做摘要压缩
    // 具体策略：保留 system，保留用户完整输入，压缩历史对话
    return user  // 简化版
  }
}

// services/ai/monitoring.ts
// AI 调用观测与监控
export class AIMonitor {
  async recordCall(params: {
    model: string
    template: string
    latency: number
    tokenUsage: { prompt: number; completion: number }
    success: boolean
    error?: string
  }) {
    // 写入 Prometheus / 数据库
    await db.aiLog.create({
      data: {
        model: params.model,
        template: params.template,
        latency: params.latency,
        promptTokens: params.tokenUsage.prompt,
        completionTokens: params.tokenUsage.completion,
        success: params.success,
        error: params.error,
        timestamp: new Date(),
      }
    })
    
    // 更新计数器
    metrics.aiCallsTotal.inc({ model: params.model, success: String(params.success) })
    metrics.aiTokensTotal.add(params.tokenUsage.prompt + params.tokenUsage.completion)
    metrics.aiLatency.observe(params.latency)
  }
}
```

**多模型降级策略**：
```
正常 → Gemini 2.0 Flash（主模型）
                    ↓ 失败
                重试 1 次
                    ↓ 失败
OpenAI GPT-4o-mini（备选 1）
                    ↓ 失败
ollama 本地模型（备选 2，qwen2.5:7b）
                    ↓ 失败
缓存中的最近相似结果（兜底）
                    ↓ 全部失败
返回默认值 + 标记"AI 不可用"
```

---

**问题 6：** 如何设计 AI 调用的观测与监控系统？具体要监控哪些指标？怎么快速发现"模型变笨了"或"响应变慢了"？

**解答：**

**监控指标体系**：
```
├─ 可用性
│   ├─ 调用成功率（99.5% 告警阈值）
│   ├─ 降级触发率（超过 5% 告警）
│   └─ 超时率（超过 3% 告警）
├─ 性能
│   ├─ P50/P95/P99 响应延迟
│   ├─ TTFT（Time to First Token）
│   └─ Token 生成速率（tokens/s）
├─ 质量
│   ├─ JSON 解析失败率（输出格式不对）
│   ├─ 空回复率
│   └─ 用户反馈负面率（点赞/点踩）
└─ 成本
    ├─ 每日 Token 消耗
    ├─ 各模型 Token 占比
    └─ 每日 API 费用估算
```

**快速发现问题**：
```typescript
// 实时监控看板
class AIHealthMonitor {
  // 滑动窗口检测（最近 5 分钟）
  checkHealth(): HealthStatus {
    const window = getSlidingWindow(5 * 60 * 1000)
    
    const alerts = []
    
    // 1. 成功率骤降
    if (window.successRate < 0.95) {
      alerts.push({ severity: 'critical', message: 'AI 成功率跌破 95%', rate: window.successRate })
    }
    
    // 2. P95 延迟飙升
    if (window.p95Latency > 5000) {
      alerts.push({ severity: 'warning', message: 'AI P95 延迟超过 5s', p95: window.p95Latency })
    }
    
    // 3. JSON 解析失败率
    if (window.parseErrorRate > 0.1) {
      alerts.push({ severity: 'warning', message: 'AI 输出格式异常率 10%+', rate: window.parseErrorRate })
    }
    
    // 4. Token 消耗异常（可能模型跑飞了）
    if (window.avgCompletionTokens > 5000 && window.avgCompletionTokens > window.baseline * 2) {
      alerts.push({ severity: 'info', message: 'Token 消耗异常增高', current: window.avgCompletionTokens, baseline: window.baseline })
    }
    
    return { healthy: alerts.length === 0, alerts }
  }
}
```

**告警响应流程**：
```
成功率 < 95% → 自动切换降级模型 → 通知 on-call → 排查原因
延迟 > 5s    → 检查模型 API 状态 → 限流/扩容 → 通知
Token 异常   → 检查 Prompt 是否跑飞 → 回滚最近 Prompt 变更
```

---

## 四、用户系统与权限

**问题 7：** 从零开始设计一个用户认证与角色权限系统（游客/注册会员/金牌 VIP），支持 OAuth 登录。你怎么设计数据库 Schema？JWT 还是 Session？VIP 权限如何在前端和后端同时生效？

**解答：**

**数据库 Schema**：
```prisma
enum Role {
  GUEST
  MEMBER
  VIP
}

model User {
  id            String   @id @default(cuid())
  email         String   @unique
  passwordHash  String?
  name          String
  avatar        String?
  role          Role     @default(MEMBER)
  vipExpiresAt  DateTime?  // VIP 过期时间
  oauthAccounts OAuthAccount[]
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

model OAuthAccount {
  id         String @id @default(cuid())
  userId     String
  user       User   @relation(fields: [userId], references: [id])
  provider   String // 'google' | 'github'
  providerId String // 第三方平台的用户 ID
  
  @@unique([provider, providerId])
}

// 权限资源配置（可扩展）
model Permission {
  id          String @id @default(cuid())
  role        Role
  resource    String // 'exhibition:create' | 'supplier:export' | etc.
  
  @@unique([role, resource])
}
```

**JWT vs Session**：
```
JWT（推荐）：
  ├─ 优点：无状态，适合 API 服务，跨域友好
  ├─ 缺点：无法主动失效，Payload 不宜过大
  └─ 方案：Access Token（15min）+ Refresh Token（7天）

Session：
  ├─ 优点：可主动失效，适合传统 Web 应用
  ├─ 缺点：需要 Redis 存储，跨域不友好
  └─ 场景：需要实时封号能力时辅助使用
```

**JWT 实现**：
```typescript
// 签发 Token
function generateTokens(user: User) {
  const payload = { sub: user.id, role: user.role, vip: user.vipExpiresAt > new Date() }
  
  return {
    accessToken: jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '15m' }),
    refreshToken: jwt.sign({ sub: user.id, type: 'refresh' }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' }),
  }
}

// 后端中间件
function authMiddleware(requiredRole?: Role) {
  return (req: Request, res: Response, next: NextFunction) => {
    const token = req.headers.authorization?.replace('Bearer ', '')
    if (!token) throw new UnauthorizedError()
    
    const payload = jwt.verify(token, process.env.JWT_SECRET) as JWTPayload
    
    // 角色校验
    if (requiredRole && getRoleWeight(payload.role) < getRoleWeight(requiredRole)) {
      throw new ForbiddenError('权限不足')
    }
    
    // VIP 状态
    if (payload.role === 'VIP' && !payload.vip) {
      // VIP 已过期，降级为 MEMBER
      throw new ForbiddenError('VIP 已过期')
    }
    
    req.user = payload
    next()
  }
}
```

**前端权限控制**：
```typescript
// hooks/usePermissions.ts
export function usePermissions() {
  const { user } = useAuth()
  
  return {
    can: (action: string) => {
      // 前端权限表
      const permissions: Record<Role, string[]> = {
        GUEST:  ['exhibition:view', 'supplier:view'],
        MEMBER: ['exhibition:view', 'exhibition:create', 'supplier:view', 'lead:view'],
        VIP:    ['exhibition:*', 'supplier:*', 'lead:*', 'opportunity:*', 'data:export'],
      }
      return permissions[user?.role || 'GUEST']?.some(p => matchPermission(p, action))
    },
    isVIP: user?.role === 'VIP' && user?.vipExpiresAt > Date.now(),
    isMember: user?.role === 'MEMBER',
  }
}

// VIP 按钮示例（当前端模拟 → 后端真实校验）
<Button
  onClick={handleExport}
  disabled={!can('data:export')}
  tooltip={!can('data:export') ? '需升级 VIP 会员' : ''}
>
  导出数据
</Button>

// 后端对应的中间件
router.post('/api/data/export', authMiddleware('VIP'), exportController)
```

---

**问题 8：** 如何设计 OAuth（Google/GitHub）登录流程？如果用户先通过邮箱注册，后来想绑定 Google 账号，你怎么处理合并？

**解答：**

**OAuth 登录流程**：
```
用户点击 "Google 登录"
    → 前端跳转 Google OAuth URL
       GET https://accounts.google.com/o/oauth2/v2/auth
         ?client_id=xxx
         &redirect_uri={BACKEND_URL}/auth/google/callback
         &response_type=code
         &scope=email+profile
         
    → Google 重定向回后端回调地址（带 code）
       {BACKEND_URL}/auth/google/callback?code=xxx
       
    → 后端用 code 换 token
       POST https://oauth2.googleapis.com/token
         { code, client_id, client_secret, redirect_uri, grant_type: 'authorization_code' }
         
    → 用 token 获取用户信息
       GET https://www.googleapis.com/oauth2/v2/userinfo
       
    → 匹配数据库中的 OAuthAccount
       ├─ 已存在 → 登录（签发 JWT）
       └─ 不存在 → 创建新用户 + OAuthAccount 记录
```

**已有账号绑定 Google**：
```typescript
async function bindOAuthAccount(userId: string, provider: string, providerId: string) {
  // 1. 检查这个 Google 账号是否已被其他用户绑定
  const existing = await prisma.oAuthAccount.findUnique({
    where: { provider_providerId: { provider, providerId } }
  })
  
  if (existing) {
    if (existing.userId === userId) {
      return { message: '已绑定该账号' }
    }
    throw new ConflictError('该 Google 账号已被其他用户绑定')
  }
  
  // 2. 绑定到当前用户
  await prisma.oAuthAccount.create({
    data: { userId, provider, providerId }
  })
}

// 登录流程优化：支持"邮箱密码 + OAuth 账号合并"
// 1. 先用邮箱密码登录
// 2. 在设置页面绑定 Google
// 3. 后续可以用 Google 一键登录
```

---

## 五、真实文件上传

**问题 9：** 当前文件拖拽上传只是模拟（只取文件名）。你要实现真实上传，支持 PDF/图片/Word，选择云存储方案（S3/R2/本地），并保证上传体验（进度、断点续传、安全校验）。

**解答：**

```typescript
// services/storage/storage.service.ts
// 抽象存储接口，支持切换底层实现
interface StorageProvider {
  upload(file: UploadFile): Promise<string>  // 返回 URL
  delete(key: string): Promise<void>
  getSignedUrl(key: string, expiresIn: number): Promise<string>
}

// AWS S3 实现
class S3StorageProvider implements StorageProvider {
  private s3: S3Client
  
  async upload(file: UploadFile): Promise<string> {
    const key = `${Date.now()}-${uuidv4()}-${file.originalname}`
    
    await this.s3.send(new PutObjectCommand({
      Bucket: process.env.S3_BUCKET,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
      ACL: 'private',
    }))
    
    return key
  }
  
  async getSignedUrl(key: string, expiresIn: number): Promise<string> {
    return getSignedUrl(this.s3, new GetObjectCommand({
      Bucket: process.env.S3_BUCKET,
      Key: key,
    }), { expiresIn })
  }
}

// 文件上传中间件（Express）
import multer from 'multer'

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 5,
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'application/pdf',
      'image/jpeg', 'image/png', 'image/webp',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ]
    
    if (!allowedMimes.includes(file.mimetype)) {
      return cb(new Error('不支持的文件类型'))
    }
    
    // 安全检查：验证文件魔数，不依赖 mimetype
    cb(null, true)
  }
})

// 前端上传组件
function FileUpload() {
  const [progress, setProgress] = useState(0)
  
  const handleUpload = async (files: FileList) => {
    for (const file of files) {
      const formData = new FormData()
      formData.append('file', file)
      
      const xhr = new XMLHttpRequest()
      
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          setProgress(Math.round((e.loaded / e.total) * 100))
        }
      }
      
      xhr.open('POST', '/api/upload')
      xhr.send(formData)
    }
  }
  
  return (
    <div className="upload-zone">
      <Dropzone onDrop={handleUpload} accept=".pdf,.jpg,.png,.doc,.docx">
        {progress > 0 && <progress value={progress} max={100} />}
      </Dropzone>
    </div>
  )
}

// 前端显示文件（使用签名 URL）
async function getFileUrl(key: string) {
  const { url } = await api.getSignedUrl({ key })
  return url  // 临时 URL，有效期内可访问
}

// 文件类型选择建议：
// AWS S3 / Cloudflare R2（推荐）：
//   ├─ 优势：高可用，自带 CDN，无需自己运维
//   ├─ 成本：R2 免流量费，对国际业务友好
//   └─ 适合：生产环境
// 
// 本地文件系统：
//   ├─ 优势：简单，无额外成本
//   ├─ 缺点：需要自己处理备份、扩容、CDN
//   └─ 适合：开发环境 / 小规模部署
```

---

## 六、国际化与 SEO

**问题 10：** 当前中英双语覆盖约 80 个 key，需要补齐并保证 AI Prompt 在多语言下输出一致。你怎么设计 i18n 方案？如何保证 AI 输出语言与用户提问语言一致？

**解答：**

**i18n 架构设计**：
```typescript
// i18n/config.ts
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

i18n.use(initReactI18next).init({
  resources: {
    'zh-CN': { translation: zhCN },
    'en-US': { translation: enUS },
  },
  fallbackLng: 'en-US',
  interpolation: { escapeValue: false },
  // 多语言路由支持
  // URL 格式：/zh-CN/exhibition/123 或 /en-US/supplier/456
})

// 多语言路由方案
// 方案一：子路径路由（推荐）
// /zh-CN/exhibition
// /en-US/exhibition
// 
// React Router 配置：
<Route path="/:lang/exhibition/:id?" element={<ExhibitionPage />} />

// 方案二：子域名
// zh.example.com
// en.example.com
// 需要 DNS + Nginx 配置

// SEO 优化
function SEOHead() {
  const { t, i18n } = useTranslation()
  const location = useLocation()
  
  return (
    <Helmet>
      <html lang={i18n.language} />
      <title>{t('page.title')}</title>
      <meta name="description" content={t('page.description')} />
      
      {/* 结构化数据（JSON-LD） */}
      <script type="application/ld+json">
        {JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'WebSite',
          'name': t('site.name'),
          'url': `https://example.com/${i18n.language}`,
          'inLanguage': i18n.language,
        })}
      </script>
      
      {/* hreflang 标签 */}
      <link rel="alternate" href={`https://example.com/zh-CN${location.pathname}`} hrefLang="zh-CN" />
      <link rel="alternate" href={`https://example.com/en-US${location.pathname}`} hrefLang="en-US" />
      <link rel="alternate" href={`https://example.com${location.pathname}`} hrefLang="x-default" />
    </Helmet>
  )
}
```

**AI 多语言输出一致性**：
```typescript
// AI Prompt 中指定输出语言
const PROMPT_TEMPLATES = {
  supplierRecommendation: {
    system: (language: string) => `你是一个跨境贸易采购专家。请使用 ${language} 回答。
输出 JSON（字段名保持英文不变，值用 ${language}）：
{
  "recommendations": [...],
  "summary": "string"  // 用 ${language} 写摘要
}`,
  }
}

// 使用示例
const lang = i18n.language  // 'zh-CN' | 'en-US'
const result = await aiService.generate(
  PROMPT_TEMPLATES.supplierRecommendation.system(lang === 'zh-CN' ? '中文' : 'English'),
  { query, suppliers }
)

// 质量保障：检查输出语言是否匹配
function validateLanguage(text: string, expected: string): boolean {
  // 用简单的字符检测判断输出语言
  // 中文：Unicode 范围 \u4e00-\u9fff
  // 英文：ASCII
  const chineseChars = (text.match(/[\u4e00-\u9fff]/g) || []).length
  const totalChars = text.replace(/\s/g, '').length
  const ratio = chineseChars / totalChars
  
  if (expected === 'zh-CN' && ratio < 0.1) return false  // 期望中文但没多少中文字符
  if (expected === 'en-US' && ratio > 0.5) return false   // 期望英文但太多中文字符
  
  return true
}
```

---

## 七、测试与 CI/CD

**问题 11：** 项目零测试。你要从零搭建测试体系（Vitest 单元测试 + Playwright E2E），并搭建 CI/CD 流水线。请给出完整的阶段划分、关键测试用例设计和流水线配置。

**解答：**

**测试分层策略**：
```
测试金字塔（从下到上）：

1. 单元测试（Vitest）— 覆盖最多
   ├─ Service 层（业务逻辑，最快的反馈）
   ├─ Repository 层（数据访问，用内存数据库）
   ├─ Utils / Helpers
   └─ React 组件（渲染测试 + 交互测试）

2. 集成测试（Vitest + Supertest）— 覆盖 API
   ├─ 6 个端点的正常路径
   ├─ 异常路径（参数错误、未授权、资源不存在）
   └─ 数据库操作测试（测试事务、级联删除）

3. E2E 测试（Playwright）— 覆盖关键流程
   ├─ 用户注册 → 登录 → 浏览展厅
   ├─ 供应商入驻流程
   └─ VIP 会员购买 → 解锁高级功能
```

**关键测试用例设计**：
```typescript
// tests/unit/services/exhibition.service.test.ts
describe('ExhibitionService', () => {
  it('should create exhibition with valid data')
  it('should reject exhibition with missing required fields')
  it('should paginate results correctly')
  it('should filter by category')
  it('should sort by createdAt desc by default')
  it('should throw error when page < 1')
  it('should limit pageSize to max 100')
})

// tests/integration/api/exhibition.test.ts
describe('GET /api/exhibitions', () => {
  it('should return paginated exhibitions')
  it('should return 400 for invalid page parameter')
  it('should return 401 without auth token')
  it('should return 403 for GUEST creating exhibition')
  it('should filter by search keyword')
})

// tests/e2e/exhibition-flow.spec.ts (Playwright)
test('user can browse exhibition hall', async ({ page }) => {
  await page.goto('/exhibition')
  await expect(page.getByText('海外展厅')).toBeVisible()
  
  // 查看详情
  await page.getByRole('link').first().click()
  await expect(page.getByRole('heading')).toBeVisible()
  
  // 提交入驻申请（需要登录）
  await page.getByRole('button', { name: '入驻' }).click()
  await expect(page.getByText('请先登录')).toBeVisible()
})
```

**GitHub Actions CI/CD 配置**：
```yaml
# .github/workflows/ci.yml
name: CI/CD

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
      
      - name: Install
        run: pnpm install
        
      - name: Lint
        run: pnpm lint
        
      - name: TypeCheck
        run: pnpm typecheck
        
      - name: Unit Tests
        run: pnpm test:unit
        
      - name: Integration Tests
        run: pnpm test:integration
        env:
          DATABASE_URL: postgresql://localhost:5432/test
        
      - name: E2E Tests
        run: pnpm test:e2e
        env:
          CI: true
  
  build:
    needs: quality
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      - name: Build
        run: |
          pnpm install
          pnpm build
      
      - name: Build Docker Image
        run: |
          docker build -t app:${{ github.sha }} .
          docker tag app:${{ github.sha }} app:latest
      
      - name: Deploy
        run: |
          # 部署到服务器 / Kubernetes
          echo "Deploying..."
```

---

## 八、部署与运维

**问题 12：** 当前端口 3039 硬编码。你需要 Docker 化部署，支持环境变量配置，并考虑 Nginx 反向代理 + HTTPS。请给出完整的 Dockerfile、docker-compose 和 Nginx 配置。

**解答：**

```dockerfile
# Dockerfile（多阶段构建）
# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

# Stage 2: Production
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000  # 默认端口，可通过环境变量覆盖

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 appuser

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

USER appuser

EXPOSE 3000

CMD ["node", "dist/server.js"]
```

```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "${PORT:-3000}:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
      - DATABASE_URL=postgresql://user:password@db:5432/app
      - REDIS_URL=redis://redis:6379
      - JWT_SECRET=${JWT_SECRET}
      - GEMINI_API_KEY=${GEMINI_API_KEY}
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - S3_ENDPOINT=${S3_ENDPOINT}
      - S3_BUCKET=${S3_BUCKET}
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_started
    volumes:
      - uploads:/app/uploads
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: password
      POSTGRES_DB: app
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U user -d app"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
      - uploads:/var/www/uploads
    depends_on:
      - app
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
  uploads:
```

```nginx
# nginx.conf
upstream app_servers {
    least_conn;  # 负载均衡：最小连接数
    server app:3000 max_fails=3 fail_timeout=30s;
    # 多实例扩展：
    # server app:3001 max_fails=3 fail_timeout=30s;
    # server app:3002 max_fails=3 fail_timeout=30s;
}

server {
    listen 80;
    server_name example.com;
    return 301 https://$server_name$request_uri;  # HTTP → HTTPS 重定向
}

server {
    listen 443 ssl http2;
    server_name example.com;

    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # 静态资源缓存
    location /assets/ {
        alias /var/www/uploads/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # API 代理
    location /api/ {
        proxy_pass http://app_servers;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # 超时配置
        proxy_read_timeout 60s;
        proxy_send_timeout 60s;
        
        # SSE 支持（不缓冲）
        proxy_buffering off;
        proxy_cache off;
    }

    # SPA 路由（所有非 API 请求返回 index.html）
    location / {
        proxy_pass http://app_servers;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        
        # SPA 必须关闭缓存
        add_header Cache-Control "no-cache, must-revalidate";
    }

    # 安全头
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
}
```

```
# .env 示例（不提交到 git）
PORT=3039
NODE_ENV=development
DATABASE_URL=postgresql://user:password@localhost:5432/app
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret-key-here
GEMINI_API_KEY=your-gemini-api-key
OPENAI_API_KEY=your-openai-api-key
S3_ENDPOINT=https://s3.amazonaws.com
S3_BUCKET=my-app-uploads
```

---

## 九、场景综合题

**问题 13：** 你发现团队成员提交的代码质量参差不齐，有人喜欢"能跑就行"。你要推行 Code Review 和代码质量标准，但团队只有 3 个人（包括你）。你怎么设计一个轻量但有效的质量保障体系？

**解答：**

**轻量级质量保障体系**：

```
第一天（强制执行，工具层面的）：
  1. ESLint + Prettier（自动修复）
     └─ husky + lint-staged：commit 前自动格式化
  2. TypeScript strict mode
     └─ 不允许 any，不允许 ts-ignore
  3. PR 模板（必填项）
     └─ 变更说明 / 截图 / 测试情况

第一周（流程层面的）：
  4. 所有 PR 必须至少 1 人 Review
     └─ 即使只有 3 个人，也要交叉 Review
  5. Review Checklist（贴在 PR 模板里）：
     ├─ [] 类型定义完整，没有 any
     ├─ [] 错误边界处理（loading/empty/error）
     ├─ [] 没有 console.log
     ├─ [] 没有硬编码的字符串（用了 i18n key）
     └─ [] 组件拆分合理，单文件不超过 300 行

第一个月（度量层面的）：
  6. 代码质量看板：
     ├─ PR Review 平均响应时间
     ├─ Review 通过率（一次通过 vs 需要修改）
     └─ 技术债务跟踪（SonarQube 或手动标记）
```

**关键原则**：
```
1. 不是"管的严"，而是"工具帮你管"
   └─ 不要在 Code Review 时说"这里少了分号"
   └─ 让 ESLint 自动修，Review 只看逻辑

2. Review 关注 20% 的关键问题，忽略 80% 的风格问题
   └─ 重点看：安全、性能、可维护性、边界 case
   └─ 不要纠结：命名风格、空行、括号位置

3. 建立"自己愿意维护"的标准
   └─ 你自己 3 个月后看这段代码，能不能快速理解？
   └─ 新人加入团队，能不能快速上手？
```

---

**问题 14：** 假设要评估一个候选人的"全栈能力"，你给他一个包含 2500 行 App.tsx 的代码库，让他花 2 小时重构。你期望看到什么结果？什么表现说明这个候选人合格/优秀/不合格？

**解答：**

**2 小时重构的评估标准**：

```
不合格：
  ├─ 什么都没做 / 只加了几行注释
  ├─ 新文件没建，全塞在一个文件里
  ├─ 拆出来的代码跑不起来（语法错误）
  ├─ 不理解原有业务逻辑，改坏了功能
  └─ 没有考虑状态管理

合格（能做）：
  ├─ 正确识别 7 个 Tab 并拆为独立文件
  ├─ 抽离了 3-5 个可复用组件（表单/弹窗/表格）
  ├─ 选了合适的状态管理（Context 或 Zustand）
  ├─ 引入路由懒加载
  └─ 代码能正常运行

优秀（能做好）：
  ├─ 以上所有 +
  ├─ 设计了清晰的目录结构（pages/containers/components/hooks/services）
  ├─ 抽离了 API 层（统一的 fetch/error handler）
  ├─ 加了 TypeScript 类型
  ├─ 考虑了边界状态（loading / empty / error）
  ├─ 写了简单的单元测试（1-2 个关键组件）
  ├─ 考虑了团队后续怎么维护
  └─ 说明了如果时间更多会怎么进一步优化

超出预期：
  ├─ 以上所有 +
  ├─ 发现了原本代码中隐藏的 bug（如内存泄漏、重复请求）
  ├─ 做了性能分析（哪些组件该 memo，哪些不该）
  ├─ 引入了开发体验改进（热更新优化、调试工具）
  ├─ 把重构方案写成了文档供团队讨论
  └─ 代码提交有规范的 commit message
```
