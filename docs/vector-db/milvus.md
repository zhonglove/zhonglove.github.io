# Milvus 入门教程

## 什么是 Milvus？

Milvus 是一个**分布式向量数据库**，专门为**大规模向量检索**设计的。它可以处理**百亿级**的向量数据，适合生产环境。

**和 pgvector / Chroma 的区别：**

| 数据库 | 规模 | 部署方式 |
|--------|------|---------|
| pgvector | 小到中等 | PostgreSQL 插件 |
| Chroma | 小到中等 | 嵌入式/单机 |
| Milvus | **大规模** | **分布式集群** |

---

## 安装

### 用 Docker 本地测试

```bash
# 下载启动脚本
wget https://raw.githubusercontent.com/milvus-io/milvus/master/scripts/standalone_embed.sh

# 启动（会自动下载 Docker 镜像）
bash standalone_embed.sh
```

启动后访问 http://localhost:9091 查看管理界面。

### 用 Docker Compose

```bash
# 下载 docker-compose.yml
wget https://github.com/milvus-io/milvus/releases/download/v2.5.4/milvus-standalone-docker-compose.yml

# 启动
docker compose -f milvus-standalone-docker-compose.yml up -d
```

### 安装 Python 客户端

```bash
pip install pymilvus
```

---

## 核心概念

| 概念 | 说明 | 类似 |
|------|------|------|
| Collection | 集合，类似数据库的表 | 类似 MongoDB Collection |
| Field | 字段，定义数据结构 | 类似 SQL 的列 |
| Vector Field | 向量字段 | 存 embedding 的列 |
| Index | 索引，加速搜索 | 类似 SQL 索引 |
| Partition | 分区，按标签分片 | 类似 MySQL 分表 |
| Milvus Lite | 嵌入式版本（适合开发调试） | 类似 Chroma |

---

## 快速上手

### 第 1 步：连接 Milvus

```python
from pymilvus import connections, Collection, FieldSchema, CollectionSchema, DataType

# 连接 Milvus 服务
connections.connect(host="localhost", port="19530")
```

### 第 2 步：创建集合

```python
# 定义字段
fields = [
    FieldSchema(name="id", dtype=DataType.INT64, is_primary=True, auto_id=True),
    FieldSchema(name="content", dtype=DataType.VARCHAR, max_length=1000),
    FieldSchema(name="embedding", dtype=DataType.FLOAT_VECTOR, dim=768),
]

# 创建集合
schema = CollectionSchema(fields, description="文档集合")
collection = Collection(name="documents", schema=schema)
```

### 第 3 步：插入数据

```python
import random

# 生成示例向量（实际开发中由 AI 模型生成）
vectors = [[random.random() for _ in range(768)] for _ in range(10)]
contents = ["文档1", "文档2", "文档3", "文档4", "文档5",
            "文档6", "文档7", "文档8", "文档9", "文档10"]

collection.insert([
    contents,   # content 字段
    vectors,    # embedding 字段
])
```

### 第 4 步：创建索引

```python
# 定义索引参数
index_params = {
    "metric_type": "COSINE",        # 相似度算法
    "index_type": "HNSW",           # 索引类型
    "params": {"M": 16, "efConstruction": 200},
}

# 创建索引
collection.create_index(
    field_name="embedding",
    index_params=index_params,
)
```

### 第 5 步：加载并搜索

```python
# 加载到内存（搜索前必须执行）
collection.load()

# 搜索向量
search_vector = [[random.random() for _ in range(768)]]

results = collection.search(
    data=search_vector,              # 要搜索的向量
    anns_field="embedding",          # 向量字段名
    param={"metric_type": "COSINE", "params": {"ef": 64}},
    limit=3,                         # 返回 top 3
    output_fields=["content"],       # 返回 content 字段
)

for hits in results:
    for hit in hits:
        print(f"相似度: {hit.score:.2f}, 内容: {hit.entity.get('content')}")
```

---

## Milvus Lite（嵌入式版本）

适合开发调试，不需要 Docker：

```bash
pip install pymilvus[milvus-lite]
```

```python
from pymilvus import MilvusClient

# 启动内嵌 Milvus（自动管理，无需 Docker）
client = MilvusClient("./milvus_demo.db")

# 创建集合
client.create_collection(
    collection_name="demo",
    dimension=768,  # 向量维度
)

# 插入
client.insert(
    collection_name="demo",
    data=[
        {"id": 1, "vector": [0.1] * 768, "content": "猫是哺乳动物"},
        {"id": 2, "vector": [0.2] * 768, "content": "狗是人类朋友"},
    ],
)

# 搜索
results = client.search(
    collection_name="demo",
    data=[[0.15] * 768],
    limit=2,
    output_fields=["content"],
)

for result in results[0]:
    print(f"ID: {result['id']}, 距离: {result['distance']:.2f}, 内容: {result['entity']['content']}")
```

---

## 实际应用：图片搜索

Milvus 特别适合图片搜索场景：

```python
from pymilvus import MilvusClient
from openai import OpenAI

client = MilvusClient("./image_search.db")
openai_client = OpenAI()

# 创建集合
client.create_collection(
    collection_name="images",
    dimension=1536,
)

# 把图片描述转成向量存入
images = [
    ("日落海滩", "一张夕阳下的海滩照片"),
    ("城市夜景", "繁华的城市夜景"),
    ("森林小径", "阳光穿过树林的小路"),
]

for name, desc in images:
    response = openai_client.embeddings.create(
        model="text-embedding-3-small",
        input=desc,
    )
    vector = response.data[0].embedding

    client.insert("images", [
        {"id": hash(name), "vector": vector, "name": name, "description": desc},
    ])

# 搜索相似图片
query = "海边风景"
response = openai_client.embeddings.create(
    model="text-embedding-3-small",
    input=query,
)

results = client.search(
    collection_name="images",
    data=[response.data[0].embedding],
    limit=3,
    output_fields=["name", "description"],
)

for result in results[0]:
    print(f"匹配: {result['entity']['name']} (相似度: {result['distance']:.2f})")
```

---

## 索引类型详解

| 索引类型 | 特点 | 适合场景 |
|---------|------|---------|
| FLAT | 暴力搜索，最准确但最慢 | 数据量小（< 1万） |
| IVF_FLAT | 聚类索引，快且准 | 中等规模 |
| HNSW | 图索引，极快 | 大规模，读多写少 |
| DISKANN | 磁盘索引，省内存 | 超大超大规模 |

---

## 三种向量数据库对比

| 特性 | pgvector | Chroma | Milvus |
|------|----------|--------|--------|
| 部署难度 | 中等（需 PostgreSQL） | **最简单（pip）** | 较复杂（Docker/集群） |
| 数据规模 | 百万级 | 十万级 | **百亿级** |
| 查询速度 | 中等 | 快 | **极快** |
| 分布式 | ❌ | ❌ | ✅ |
| 内置 Embedding | ❌ | ✅ | ❌ |
| 开发环境 | 已有 PostgreSQL 时 | **原型开发** | 生产环境 |
| 生产环境 | ✅ 可用 | 小项目 | **首选** |

---

## 和前端类比

| Milvus 概念 | 前端类比 |
|------------|---------|
| Collection | 类似 MongoDB Collection |
| Schema | 类似 TypeScript 接口 |
| FieldSchema | 类似定义字段类型 |
| `collection.search()` | 类似 `Array.filter().sort()` |
| Index | 类似搜索引擎的索引 |
| Partition | 类似分片/分页 |
| Milvus Lite | 类似 SQLite（嵌入式） |

---

## 总结

```
启动 Milvus(Docker) → 连接 → 建 Collection → 插数据 → 建索引 → Load → 搜索
```

| 步骤 | 代码 |
|------|------|
| 1. 启动 | `docker compose up -d` |
| 2. 连接 | `connections.connect()` |
| 3. 建集合 | `CollectionSchema(fields)` |
| 4. 插入 | `collection.insert([...])` |
| 5. 索引 | `collection.create_index(...)` |
| 6. 加载 | `collection.load()` |
| 7. 搜索 | `collection.search(...)` |

Milvus 适合**需要处理海量数据的生产环境**，小型项目用 pgvector 或 Chroma 更简单。
