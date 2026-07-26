# Chroma 入门教程

## 什么是 Chroma？

Chroma 是一个**轻量级向量数据库**，专门给 AI 应用用的。它的特点是：**简单**——几行代码就能跑起来。

适合场景：
- 快速原型开发
- 中小项目（几万条数据）
- 本地开发环境
- 不想折腾服务器配置

---

## 安装

```bash
pip install chromadb
```

Chroma 是嵌入式数据库，安装即用，不需要启动单独的服务器（默认模式）。

---

## 核心概念

| 概念 | 说明 | 类比 |
|------|------|------|
| Collection | 向量的集合，类似数据库的表 | 类似前端的 `Array` |
| Document | 原始文本内容 | 类似 `{ text: "..." }` |
| Embedding | 文本对应的向量 | 类似 `Array[1536]` 数字数组 |
| Metadata | 附加信息 | 类似 `{ tag: "技术", date: "2024" }` |
| ID | 唯一标识 | 类似 `id: 1` |

---

## 快速上手

### 创建集合并添加数据

```python
import chromadb

# 创建客户端（数据存内存，程序关闭后丢失）
client = chromadb.Client()

# 创建集合（类似建表）
collection = client.create_collection("my_docs")

# 添加文档
collection.add(
    documents=[
        "猫是哺乳动物，喜欢睡觉",
        "狗是人类最好的朋友，忠诚可靠",
        "Python 是一种流行的编程语言",
    ],
    ids=["doc1", "doc2", "doc3"],
)
```

### 搜索

```python
results = collection.query(
    query_texts=["告诉我关于猫的知识"],
    n_results=2,  # 返回最相似的 2 条
)

print(results["documents"])
# [["猫是哺乳动物，喜欢睡觉"], ["狗是人类最好的朋友，忠诚可靠"]]
```

Chroma 默认使用 `all-MiniLM-L6-v2` 模型自动将文本转成向量，所以不需要你手动调用 OpenAI 生成 embedding。

---

## 持久化存储

默认 Chroma 存在内存里，程序重启后数据就没了。要持久化保存：

```python
import chromadb

# 指定持久化目录
client = chromadb.PersistentClient(path="./chroma_data")

collection = client.get_or_create_collection("my_docs")

collection.add(
    documents=["今天天气真好", "明天可能下雨"],
    ids=["doc1", "doc2"],
)

# 下次运行同样的代码，数据还在
```

这会在当前目录创建 `chroma_data` 文件夹，数据存在里面。

---

## 带 Metadata 的搜索

Metadata 可以帮你对数据做过滤：

```python
collection.add(
    documents=[
        "Python 是一种高级编程语言",
        "JavaScript 主要用于前端开发",
        "PostgreSQL 是一个关系型数据库",
    ],
    metadatas=[
        {"category": "编程语言", "difficulty": "简单"},
        {"category": "编程语言", "difficulty": "中等"},
        {"category": "数据库", "difficulty": "中等"},
    ],
    ids=["doc1", "doc2", "doc3"],
)

# 只搜索"编程语言"分类
results = collection.query(
    query_texts=["学编程从哪里开始"],
    where={"category": "编程语言"},  # 过滤条件
    n_results=2,
)
```

---

## 用自定义 Embedding

如果你想用 OpenAI 或国产模型的 embedding：

```python
import chromadb
from chromadb.utils import embedding_functions

# 使用 OpenAI embedding
openai_ef = embedding_functions.OpenAIEmbeddingFunction(
    api_key="sk-你的密钥",
    model_name="text-embedding-3-small",
)

client = chromadb.Client()
collection = client.create_collection(
    name="my_docs",
    embedding_function=openai_ef,  # 指定 embedding 函数
)
```

---

## 增删改查

```python
# 新增
collection.add(documents=["新增内容"], ids=["doc4"])

# 查询
results = collection.get(ids=["doc1"])
print(results)

# 更新
collection.update(ids=["doc1"], documents=["更新后的内容"])

# 删除
collection.delete(ids=["doc1"])

# 查看集合中有多少条
count = collection.count()
print(f"共有 {count} 条数据")
```

---

## 实际应用：本地知识库

```python
import chromadb

# 初始化
client = chromadb.PersistentClient(path="./knowledge_base")
collection = client.get_or_create_collection("kb")

def add_knowledge(text, source):
    """添加知识"""
    collection.add(
        documents=[text],
        metadatas=[{"source": source}],
        ids=[f"doc_{collection.count() + 1}"],
    )

def search_knowledge(query, top_k=3):
    """搜索知识"""
    results = collection.query(
        query_texts=[query],
        n_results=top_k,
    )
    return results["documents"][0]

# 使用
add_knowledge("VuePress 是一个静态网站生成器", "官方文档")
add_knowledge("LangChain 可以帮你构建 LLM 应用", "教程")

answer = search_knowledge("怎么搭建文档网站？")
print(answer)
# ["VuePress 是一个静态网站生成器"]
```

---

## 和前端类比

| Chroma 概念 | 前端类比 |
|------------|---------|
| `Client()` | 类似 new Vue() |
| `create_collection()` | 类似定义一个数组 |
| `add()` | 类似 push 数据 |
| `query()` | 类似 filter + sort |
| `metadata` | 类似数据库的 where 条件 |
| `PersistentClient` | 类似 localStorage |

---

## Chroma vs pgvector

| 特性 | Chroma | pgvector |
|------|--------|----------|
| 安装 | pip install | 需要 PostgreSQL |
| 启动 | 零配置 | 需启动 PostgreSQL |
| 数据量 | 小到中等 | 中等 |
| 持久化 | PersistentClient | 自带 |
| 内置 embedding | ✅ 自动 | ❌ 需手动调用 API |
| 适合 | 开发原型、小项目 | 已有 PostgreSQL 的项目 |

---

## 总结

```
pip install chromadb
          ↓
client = chromadb.Client()
          ↓
collection = client.create_collection("name")
          ↓
collection.add(documents=[...], ids=[...])
          ↓
collection.query(query_texts=["问题"])
```

Chroma 最适合**快速开发**和**原型验证**，一行代码都不用写 embedding 逻辑。
