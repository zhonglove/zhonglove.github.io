---
title: NestJS + LangChain 实战：向量存储三种方案与 pgvector 实操
description: RAG 生产落地。对比 MemoryVectorStore、PGVector、Chroma 三种向量存储，手把手用 Navicat 建 pgvector 向量表、插入数据、相似度检索，并讲透向量维度 vector(3) vs vector(1024)。
---

# 向量存储三种方案与 pgvector 实操

> **前置**：已完成 [RAG 检索增强](/articles/nestjs-langchain-rag)
> **目标**：把 RAG 的知识库从"内存"升级到"数据库"，讲透三种向量存储方案 + pgvector 建表/检索 + 向量维度
> **技术栈**：NestJS + @langchain/community + @langchain/pgvector + PostgreSQL 16 + pgvector / Chroma

## 一、为什么不能一直用内存向量库？

上一篇的 `MemoryVectorStore` 是把知识卡片存在**内存**里：

| 优点 | 缺点 |
| --- | --- |
| 零安装、零配置，上手最快 | 重启服务知识全丢 |
| 适合 demo / 学习 | 数据一多内存吃紧 |
| 单机演示足够 | 无法多服务共享、无法持久化 |

真实业务里，知识库（合同、售后、商品资料）是**长期资产**，必须存到数据库。这节课就把向量存储升级成三种主流方案，并动手操作最常用的 **pgvector**。

## 二、三种方案一览

### 1. MemoryVectorStore — 内存版（已经会了）

```typescript
import { MemoryVectorStore } from '@langchain/classic/vectorstores/memory'

const store = await MemoryVectorStore.fromDocuments(docs, embeddings)
const results = await store.similaritySearch('退休年龄是多大', 3)
```

### 2. PostgreSQL + pgvector — 数据库版（生产最常用）

- 用已有的 **PostgreSQL 数据库**加一个向量类型扩展，业务数据和向量放同一套数据库，少维护一个服务；
- LangChain 提供 `@langchain/pgvector` 开箱即用；
- 需要先装 PostgreSQL、启动 pgvector 扩展。

**安装**

```bash
# 1. 数据库用 Docker 一条命令搞定（想用 Navicat 可视化的选它）
docker run --name pgvector-db -e POSTGRES_PASSWORD=yourpassword -p 5432:5432 -d pgvector/pgvector:pg16

# 2. 装 LangChain 的 PGVector 集成包
pnpm install @langchain/pgvector
```

### 3. Chroma — 专用向量数据库

- 专为向量检索设计的数据库，装好即用，也支持 Docker；
- LangChain 社区包 `@langchain/community` 里自带 `Chroma` 集成。

```bash
# Chroma 官方 Docker 镜像
docker run --name chroma -p 8000:8000 -d chromadb/chroma
pnpm install chromadb
```

## 三、pgvector 手把手实操（Navicat 版）

很多同学习惯用可视化工具（如 **Navicat**）操作数据库。我们**先不写代码**，直接跟着步骤把向量表建出来、填数据、检查，把概念吃透，再切回 LangChain 代码。

### 第 1 步：创建数据库和 vector 扩展

用 Navicat 连上本地 PostgreSQL（docker 起的库默认库名 `postgres`，端口 `5432`）。

1. 新建一个数据库：`langchain_demo`；
2. 打开查询工具（Sql Editor），执行开启向量扩展：

```sql
-- 开启 pgvector 扩展（库只需执行一次）
CREATE EXTENSION IF NOT EXISTS vector;

-- 确认扩展装好了
SELECT extname, extversion FROM pg_extension WHERE extname = 'vector';
```

::: tip 建了扩展之后
`vector` 就不是一个可有可无的字符串，而是一个真正的 SQL 类型了。它可以像普通字段一样被 `create table`、插入、查询。下面所有 `VECTOR(3)`、`VECTOR(1024)` 都是它。
:::

### 第 2 步：建表（表结构是这门课的精髓）

```sql
CREATE TABLE documents (
  id         SERIAL PRIMARY KEY,      -- 自增主键
  content    TEXT NOT NULL,           -- 分块后的文本（知识卡片正文）
  metadata   JSONB,                   -- 可选：来源、页码等备注
  embedding  vector(3) NOT NULL       -- 向量列！(3) 表示 3 维
);
```

核心就是这一列：**`embedding vector(3)`**。`(3)` 是向量的维度，这一节最后的"维度"部分专门讲它。这里先用 3 维方便手算。

### 第 3 步：手动插入向量数据

```sql
-- 插入三条"知识卡片"，注意 embedding 是 [数字,数字,数字] 这种写法
INSERT INTO documents (content, metadata, embedding) VALUES
  ('员工入职需签订为期三年的劳动合同', '{"source":"员工手册"}', '[0.1, 0.2, 0.3]'),
  ('中秋节公司发放节日礼盒',          '{"source":"员工手册"}', '[0.6, 0.7, 0.8]'),
  ('公司实行弹性工作制',              '{"source":"员工手册"}', '[0.9, 0.1, 0.4]');
```

查看插入结果：

```sql
SELECT * FROM documents;
--  id |           content           |     metadata      |  embedding
-- ----+-----------------------------+-------------------+------------
--   1 | 员工入职需签订三年劳动合同   | {"source":...}    | [0.1,0.2,0.3]
--   2 | 中秋节公司发放节日礼盒       | {"source":...}    | [0.6,0.7,0.8]
--   3 | 公司实行弹性工作制           | {"source":...}    | [0.9,0.1,0.4]
```

### 第 4 步：用余弦相似度检索最相近的卡片 —— RAG 问答的核心

RAG 在线问答时，系统把用户的问题变成一个向量（比如 `[0.15, 0.18, 0.25]`，语义上接近"合同"），然后到数据库里找**和它最像**的行。pgvector 的 `<=>` 运算符就是计算余弦相似度（越小越像）：

```sql
-- 找到与向量 [0.15, 0.18, 0.25] 最接近的 3 条卡片
SELECT content, embedding, embedding <=> '[0.15, 0.18, 0.25]' AS distance
FROM documents
ORDER BY embedding <=> '[0.15, 0.18, 0.25]'
LIMIT 3;
```

```mermaid
flowchart LR
    P["问题向量<br/>[0.15, 0.18, 0.25]"] --> Q{逐条算距离}
    Q -->|0.0116 ✅最小| R[合同卡片]
    Q -->|0.6500| S[弹性工作卡片]
    Q -->|0.3750| T[中秋礼盒卡片]
```

结果里**距离最小的就是"合同"那张卡**，说明语义检索成功了。

### 第 5 步：更新和删除（维护知识库）

```sql
-- 改一条卡片的正文和向量
UPDATE documents
SET content = '员工入职需签订为期五年的劳动合同', embedding = '[0.11, 0.21, 0.31]'
WHERE id = 1;

-- 删一条卡片
DELETE FROM documents WHERE id = 3;

-- 统计知识库有多少张卡
SELECT COUNT(*) FROM documents;
```

## 四、第 N+1 步：配套 HNSW 索引（数据多到几千条再上）

数据很少时挨个比就行；当知识库到了上千条，全表扫描会很慢。pgvector 支持 **HNSW 索引**（一种高效"找最近邻居"的算法，能大幅提速上限几十倍）：

```sql
-- 给向量列建 HNSW 索引，距离函数和查询时一致即可
CREATE INDEX ON documents USING hnsw (embedding vector_cosine_ops);
```

```mermaid
flowchart LR
    A[几百条数据] -->|没索引也够快| B[直接全表扫]
    C[几千上万条] -->|建 HNSW 索引| D[检索速度提升 10~50 倍]
```

::: tip 一句话记 HNSW
**数据少时别急着加索引**，让 SQL 先跑通；数据量真大了再加 HNSW，一条 `CREATE INDEX` 搞定。
:::

## 五、把 pgvector 接回 LangChain 代码

建好库、表之后，把上一篇 RAG 的 `MemoryVectorStore` 换成 `PGVectorStore`，只需要改 3 处：

```typescript
import { PGVectorStore } from '@langchain/pgvector'

// 在线程 / 模块初始化时建一次连接（用该扩展需要先 CREATE EXTENSION vector）
private pgStore = PGVectorStore.fromDocuments([], this.embeddings, {
  connectionString: 'postgresql://postgres:yourpassword@localhost:5432/langchain_demo',
  tableName: 'documents',
  columns: {
    idColumnName: 'id',
    contentColumnName: 'content',
    metadataColumnName: 'metadata',
    vectorColumnName: 'embedding',
  },
})
```

- **connectionString**：数据库连接串（用户名/密码/地址/端口/库名）；
- **tableName**：表名 `documents`，LangChain 会自动生成需要的表结构，无需手写建表；
- 之后 `loadKnowledge` 里 `store.fromDocuments`、`store.similaritySearch` 的用法和 Memory 版**完全一样**，业务代码不用动。

::: tip 换存储方案 = 只换"存的地方"
LangChain 把向量库封装成统一接口：Memory / PGVector / Chroma 都是 `fromDocuments()` 写入、`similaritySearch()` 检索。**换存储方案，业务代码几乎零改动**——这也是 LangChain 的意义所在。
:::

## 六、用 Navicat 看 LangChain 自己建的表

跑完"换 PGVectorStore 代码 + loadKnowledge"之后，回到 Navicat 刷新表列表——你会看到 **LangChain 自动帮我们建了一张 `documents` 表**，字段和我们手写时一模一样：

```sql
SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'documents';
--  id / content / metadata / embedding(vector)
```

```mermaid
flowchart LR
    A[NestJS loadKnowledge] --> B[把卡片交给 PGVectorStore]
    B --> C["自动 CREATE TABLE documents"]
    C --> D["自动把向量写进 embedding 列"]
    D --> E[Navicat 里刷新就能看到]
```

意味着：**你上一节手动做的事，LangChain 全自动完成**。手写一遍的价值在于把原理吃透，生产就放心交给库。

## 七、向量维度：vector(3) 和 vector(1024) 到底差在哪？

### 1. 维度是什么？

向量是一串数字 `[0.1, 0.2, ...]`，**这一串里有多少个数字，就叫多少维**。

- `vector(3)`：只有 3 个数字，`[0.1, 0.2, 0.3]`；
- `vector(1024)`：有 1024 个数字，是 mxbai-embed-large 的输出。
- `vector(1536)`：OpenAI 的 text-embedding-ada-002 是 1536 维。

### 2. 低维 vs 高维，用一张图看懂

```mermaid
block-beta
  columns 2
  block:low["vector(3) 三维"]
    L1["只有 x/y/z 轴<br/>每句话挤在一个点"]
  end
  block:high["vector(1024) 千维"]
    H1["上千个方向<br/>能细致区分意思"]
  end
```

- **3 维**：空间里只有 3 个方向（长宽高），所有句子都被压瘪，几乎无法区分不同语义；
- **1024 维**：有 1024 个方向来描述一个句子，每个维度记录一种细微特征（是否问句、语气、时态、领域…），**语义区分度大大提升**。

### 3. 谁来定维度？——向量模型的输出维度

**维度不是你自己定的，是由你选的向量模型决定的**：

| 向量模型 | 输出维度 | 说明 |
| --- | --- | --- |
| mxbai-embed-large（本课程） | 1024 | Ollama 拉的这个 |
| text-embedding-ada-002 (OpenAI) | 1536 | 老牌付费模型 |
| text-embedding-3-small | 1536 | 便宜好用 |

建表时写 `vector(1024)` 就是在告诉数据库"这列每行存 1024 个数字"；如果填错了（比如写了 3，却要存 1024 个数字）数据库会**直接报错**：

```
ERROR:  vector value has wrong dimension
```

### 4. 生产实践建议

| 场景 | 建议 |
| --- | --- |
| 建表维度 | 跟向量模型的输出维度严格一致（先查模型文档） |
| 用哪个模型 | 首次就选定一个（如 mxbai-embed-large 1024），**不要混用** |
| 换模型算旧数据 | 换模型 = 旧向量全失效，需重新载入知识 |

::: danger 为什么不能混用模型？
把模型 A（1024 维）生成的向量和模型 B（1536 维）生成的存一张表，检索时数字坐标系完全不同，**"相似度"毫无意义**。知识库上线前就锁死一个向量模型，可省掉大量返工。
:::

## 八、pgvector vs Chroma 怎么选（实战决策表）

| 对比项 | PostgreSQL + pgvector | Chroma |
| --- | --- | --- |
| 定位 | 关系型数据库"顺手"支持向量 | 专职向量数据库 |
| 已有业务数据吗 | **强烈推荐**，业务+向量一张库 | 需要再维护一个服务 |
| 管理成本 | 低（沿用现有 DBA 习惯） | 中（多一个组件） |
| SQL 查询 | 原生 SQL，能用 Navicat 看 | 用 API/客户端，无图形界面 |
| 生态成熟度 | PG 老牌稳定 | 向量专项，生态也不错 |
| 适合谁 | 大多数生产项目 | 海量纯向量场景 |

::: tip 一句话决策
**凡是有业务数据的项目，首选 PostgreSQL + pgvector**——向量和业务数据同库、同备份、同权限，最省心。Chroma 适合纯向量、海量、无业务耦合的更简单场景。
:::

## 九、三种方案最终对照（背下来）

| 方案 | 安装成本 | 持久化 | 相似度 API | 适合场景 |
| --- | --- | --- | --- | --- |
| MemoryVectorStore | 零 | ❌ 重启即失 | `similaritySearch` | 学习 / Demo / 原型 |
| PostgreSQL + pgvector | PostgreSQL 已有则几乎为零 | ✅ | `similaritySearch` | **生产首选** |
| Chroma | Docker 一条命令 | ✅ | `similaritySearch` | 纯向量海量场景 |

三者业务代码几乎一样，因为 LangChain 统一了接口：**写入 `fromDocuments`，检索 `similaritySearch`**。

::: tip 本课小结
1. 内存向量库只适合 demo，生产要持久化；
2. **pgvector 建表**：`CREATE EXTENSION vector` → 建表（`VECTOR(n)` 列）→ 插入 → `embedding <=> 问题向量` 排序检索 → 数据量大加 HNSW 索引；
3. **维度由向量模型决定**，mxbai-embed-large = 1024，多大多细决定了语义区分能力，且全库必须统一；
4. 接回 LangChain：换 `PGVectorStore`，业务代码零改动。
:::