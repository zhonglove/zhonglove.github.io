# pgvector 入门教程

## 什么是 pgvector？

pgvector 是 PostgreSQL 的**向量搜索插件**。它让你在普通数据库里也能存向量、搜向量，不需要额外部署一套专门的向量数据库。

**核心优势：** 你的用户数据本来就在 PostgreSQL 里，加上 pgvector 就不用多维护一套系统。

---

## 安装

### 用 Docker 安装（推荐）

```bash
docker run -d --name pgvector \
  -e POSTGRES_PASSWORD=mysecretpassword \
  -p 5432:5432 \
  pgvector/pgvector:0.8.0-pg17
```

### 在已有 PostgreSQL 上安装

```sql
-- 需要 superuser 权限
CREATE EXTENSION vector;
```

---

## 基础使用

### 创建带向量的表

```sql
-- 创建一个存储文档的表
CREATE TABLE documents (
    id SERIAL PRIMARY KEY,
    content TEXT,
    embedding vector(1536)  -- 1536 维，OpenAI embedding 的长度
);
```

`vector(1536)` 表示这个列存的是 1536 维的向量。不同模型输出的向量维度不同：
- OpenAI text-embedding-3-small → 1536 维
- OpenAI text-embedding-3-large → 3072 维
- BGE 系列 → 768 维或 1024 维

### 插入数据

```sql
INSERT INTO documents (content, embedding) VALUES
('猫是哺乳动物', '[0.1, 0.2, ..., 0.5]'::vector),
('狗是人类最好的朋友', '[0.3, 0.1, ..., 0.2]'::vector),
('Python 是一种编程语言', '[0.4, 0.3, ..., 0.1]'::vector);
```

> 实际开发中，embedding 向量由 AI 模型生成，不会手写。

### 向量相似度搜索

```sql
-- 找到最相似的 3 条记录
SELECT content, 1 - (embedding <=> '[0.2, 0.3, ..., 0.4]'::vector) AS similarity
FROM documents
ORDER BY embedding <=> '[0.2, 0.3, ..., 0.4]'::vector
LIMIT 3;
```

`<=>` 是余弦距离运算符，值越小越相似。

**三种距离运算符：**

| 运算符 | 距离类型 | 说明 |
|--------|---------|------|
| `<->` | L2 距离（欧几里得） | 值越小越相似 |
| `<=>` | 余弦距离 | 常用，不受向量长度影响 |
| `<#>` | 内积距离 | 适合归一化后的向量 |

---

## 用 Python 操作 pgvector

### 安装依赖

```bash
pip install psycopg2-binary openai
```

### 代码示例

```python
import psycopg2
from openai import OpenAI

# 连接数据库
conn = psycopg2.connect(
    host="localhost",
    port=5432,
    dbname="postgres",
    user="postgres",
    password="mysecretpassword",
)

# 创建 embedding
client = OpenAI()
texts = ["什么是人工智能", "机器学习入门", "深度学习基础"]

for text in texts:
    response = client.embeddings.create(
        model="text-embedding-3-small",
        input=text,
    )
    embedding = response.data[0].embedding

    # 存入数据库
    cur = conn.cursor()
    cur.execute(
        "INSERT INTO documents (content, embedding) VALUES (%s, %s::vector)",
        (text, embedding),
    )
    conn.commit()
    cur.close()
```

### 搜索

```python
# 搜索和 "AI 技术" 最相似的文档
query = "AI 技术"
response = client.embeddings.create(
    model="text-embedding-3-small",
    input=query,
)
query_embedding = response.data[0].embedding

cur = conn.cursor()
cur.execute("""
    SELECT content, 1 - (embedding <=> %s::vector) AS similarity
    FROM documents
    ORDER BY embedding <=> %s::vector
    LIMIT 5
""", (query_embedding, query_embedding))

for row in cur.fetchall():
    print(f"{row[1]:.2f}  {row[0]}")
```

---

## 创建索引（重要）

没有索引时，pgvector 会**全表扫描**，数据量大了会非常慢。

```sql
-- 创建 HNSW 索引（推荐，速度快）
CREATE INDEX ON documents USING hnsw (embedding vector_cosine_ops);

-- 或者 IVFFlat 索引（构建快，但精度略低）
CREATE INDEX ON documents USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
```

**HNSW vs IVFFlat：**

| 特性 | HNSW | IVFFlat |
|------|------|---------|
| 构建速度 | 慢 | 快 |
| 查询速度 | 极快 | 快 |
| 精度 | 高 | 较高 |
| 内存占用 | 较多 | 较少 |
| 适合场景 | 读多写少 | 数据频繁更新 |

---

## 实际应用：RAG 问答

```python
import psycopg2
from openai import OpenAI

client = OpenAI()
conn = psycopg2.connect("dbname=postgres user=postgres password=mysecretpassword")

def search_docs(query, limit=3):
    """搜索最相关的文档"""
    response = client.embeddings.create(
        model="text-embedding-3-small",
        input=query,
    )
    q_vector = response.data[0].embedding

    cur = conn.cursor()
    cur.execute("""
        SELECT content FROM documents
        ORDER BY embedding <=> %s::vector
        LIMIT %s
    """, (q_vector, limit))
    return [row[0] for row in cur.fetchall()]

def ask(question):
    """基于文档回答问题"""
    docs = search_docs(question)
    context = "\n".join(docs)

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": "基于以下资料回答问题："},
            {"role": "user", "content": f"资料：\n{context}\n\n问题：{question}"},
        ],
    )
    return response.choices[0].message.content

print(ask("什么是人工智能？"))
```

---

## 和前端类比

| pgvector 概念 | 前端类比 |
|--------------|---------|
| `vector(1536)` | 定义数组长度（TypeScript `number[]`） |
| `<=>` 运算符 | 类似 `Array.sort()` 的比较函数 |
| HNSW 索引 | 类似数据库的 B-Tree 索引 |
| embedding | 把文字变成数字，"猫"和"狗"的数字接近 |

---

## 总结

```
安装插件 → 建表(vector类型) → 存向量 → 建索引 → 搜向量
```

| 步骤 | SQL / 代码 |
|------|-----------|
| 1. 启用 | `CREATE EXTENSION vector;` |
| 2. 建表 | `embedding vector(1536)` |
| 3. 插入 | `INSERT ... VALUES (..., '[...]'::vector)` |
| 4. 索引 | `CREATE INDEX ... USING hnsw (...)` |
| 5. 搜索 | `ORDER BY embedding <=> '[...]'` |

pgvector 最适合**不想额外维护一套数据库**的场景，直接在 PostgreSQL 里解决。
