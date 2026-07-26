# 本地部署大模型教程

## 为什么要本地部署？

| 场景 | 云端 API | 本地部署 |
|------|---------|---------|
| 费用 | 按 token 付费 | **免费**（电费忽略不计） |
| 隐私 | 数据发给第三方 | **数据不出本地** |
| 网络 | 需要联网 | **离线可用** |
| 性能 | 取决于服务端 | 取决于你的电脑 |
| 模型选择 | 只能用平台提供的 | **随便换** |

**适合人群：**
- 想免费使用大模型的开发者
- 数据敏感的行业（金融、医疗）
- 需要在无网络环境使用的场景
- 想折腾各种开源模型的爱好者

---

## 什么是 Ollama？

Ollama 是一个**本地运行大模型**的工具，把复杂的模型部署变得像安装 App 一样简单。

```
传统部署：下载模型 → 装 Python → 配置 CUDA → 写推理代码 → 调优
Ollama：   ollama run qwen  ← 一行命令搞定
```

Ollama 支持的模型：
- **Qwen**（阿里通义千问）— 中文能力强
- **DeepSeek**（深度求索）— 编程能力强
- **Llama**（Meta）— 通用能力强
- **Mistral** — 轻量高效
- 以及数百种开源模型

---

## 安装 Ollama

### Mac 安装

```bash
# 一行命令
curl -fsSL https://ollama.com/install.sh | sh

# 或者去官网 https://ollama.com 下载 .dmg 安装包
```

### Windows 安装

去 https://ollama.com 下载安装包，双击安装即可。

### Linux 安装

```bash
curl -fsSL https://ollama.com/install.sh | sh
```

### 验证安装

```bash
ollama --version
# 输出类似：ollama version 0.5.7
```

---

## 运行第一个模型

### 下载并运行 Qwen（推荐首选）

Qwen（通义千问）是阿里的开源模型，**中文能力最强**，最适合中文开发者。

```bash
# 下载并运行 Qwen 2.5（7B 参数量，约 4GB）
ollama run qwen2.5
```

第一次运行会自动下载模型，等下载完成后进入对话界面：

```
>>> 你好
你好！我是通义千问，有什么可以帮助你的吗？

>>> 用 Python 写一个计算斐波那契数列的函数
以下是斐波那契数列的 Python 实现...
```

输入 `/bye` 退出对话。

### 可选的模型大小

| 模型 | 参数量 | 硬盘空间 | 内存要求 | 电脑配置 |
|------|--------|---------|---------|---------|
| qwen2.5:0.5b | 5亿 | 约 400MB | 2GB | **任何电脑** |
| qwen2.5:1.5b | 15亿 | 约 1GB | 4GB | 老旧笔记本 |
| qwen2.5:7b | 70亿 | 约 4GB | 8GB | **主流配置** |
| qwen2.5:14b | 140亿 | 约 9GB | 16GB | 高性能电脑 |
| qwen2.5:32b | 320亿 | 约 20GB | 32GB | 工作站 |
| qwen2.5:72b | 720亿 | 约 45GB | 64GB | 服务器 |

**新手推荐**：`qwen2.5:7b` — 在质量和性能之间取得平衡。

---

## 用 Python 调用本地模型

Ollama 启动后会自动在本地开启一个 API 服务（默认 http://localhost:11434），你可以像调用 OpenAI 一样调用它。

### 安装依赖

```bash
pip install openai
```

### 和 Qwen 对话

```python
from openai import OpenAI

# 连接本地 Ollama
client = OpenAI(
    api_key="ollama",                              # Ollama 不需要密钥，随便填
    base_url="http://localhost:11434/v1",           # 本地 API 地址
)

response = client.chat.completions.create(
    model="qwen2.5",                               # 模型名要和 ollama run 的一致
    messages=[
        {"role": "user", "content": "用 Python 写一个排序算法"},
    ],
)

print(response.choices[0].message.content)
```

**注意：** Ollama 的 API 兼容 OpenAI 格式，所以直接用 `openai` 库就能调用。

### 流式输出（像 ChatGPT 一样逐字显示）

```python
stream = client.chat.completions.create(
    model="qwen2.5",
    messages=[{"role": "user", "content": "讲一个笑话"}],
    stream=True,
)

for chunk in stream:
    if chunk.choices[0].delta.content:
        print(chunk.choices[0].delta.content, end="", flush=True)
```

---

## 其他模型的本地部署

### DeepSeek（编程强）

DeepSeek 在编程任务上表现出色，甚至能媲美 GPT-4。

```bash
# 下载并运行
ollama run deepseek-coder-v2

# 或者轻量版
ollama run deepseek-coder-v2:16b
```

Python 调用：

```python
client = OpenAI(
    api_key="ollama",
    base_url="http://localhost:11434/v1",
)

response = client.chat.completions.create(
    model="deepseek-coder-v2",
    messages=[{"role": "user", "content": "写一个 React 自定义 Hook"}],
)
```

### Llama 3（Meta 出品，英文强）

```bash
ollama run llama3.2       # 轻量版，3B 参数
ollama run llama3.1:8b    # 标准版，8B 参数
ollama run llama3.1:70b   # 大模型，70B 参数
```

### Mistral（轻量高效）

```bash
ollama run mistral        # 7B 参数，速度快
ollama run mixtral:8x7b   # 专家混合模型，质量高
```

---

## 管理模型

```bash
# 查看已下载的模型
ollama list

# 删除模型
ollama rm qwen2.5:7b

# 复制模型
ollama cp qwen2.5 my-qwen

# 查看模型信息
ollama show qwen2.5
```

---

## 使用 Modelfile 自定义模型

Ollama 支持自定义模型参数，比如调整温度、设置系统提示词等。

创建一个 Modelfile：

```dockerfile
# 基于 Qwen 2.5
FROM qwen2.5

# 设置温度（越低越确定，越高越有创意）
PARAMETER temperature 0.7

# 设置上下文长度
PARAMETER num_ctx 8192

# 设置系统提示词
SYSTEM """你是一个 Python 编程助手，只回答编程相关问题。
如果问题与编程无关，请礼貌地拒绝回答。"""
```

然后构建：

```bash
ollama create my-coder -f ./Modelfile
ollama run my-coder
```

---

## 常用参数调整

| 参数 | 作用 | 推荐值 |
|------|------|--------|
| `temperature` | 随机性（0=确定，1=创意） | 0.7 |
| `top_p` | 采样范围 | 0.9 |
| `num_ctx` | 上下文窗口大小 | 4096~8192 |
| `num_predict` | 最大生成长度 | -1（不限） |
| `repeat_penalty` | 重复惩罚 | 1.1 |

---

## 在代码中设置参数

```python
response = client.chat.completions.create(
    model="qwen2.5",
    messages=[{"role": "user", "content": "写一首诗"}],
    temperature=0.8,          # 创意度高一点
    max_tokens=500,           # 最多生成 500 个 token
    top_p=0.9,
)
```

---

## Ollama API 完整示例

### 列出本地模型

```python
import requests

models = requests.get("http://localhost:11434/api/tags").json()
for model in models["models"]:
    print(f"{model['name']} ({model['size']} bytes)")
```

### 嵌入式（Embedding）

Ollama 也支持生成向量：

```python
response = client.embeddings.create(
    model="qwen2.5",
    input="要生成向量的文本",
)
print(response.data[0].embedding)
# 输出：[-0.012, 0.034, ...]  ← 一串数字
```

---

## 常见问题

### Q：模型下载太慢怎么办？

设置国内镜像：

```bash
# 设置环境变量（Linux/Mac）
export OLLAMA_HOST="http://localhost:11434"

# 使用镜像站下载（以 modelscope 为例）
# 手动下载模型文件放到 ~/.ollama/models/ 目录下
```

### Q：运行模型提示内存不足？

用更小的模型：

```bash
# 7B 模型至少需要 8GB 内存
# 如果内存不够，用 1.5B 或 0.5B 版本
ollama run qwen2.5:1.5b
```

### Q：能不能同时运行多个模型？

可以。Ollama 支持同时运行多个模型，每个模型独立占用内存。

### Q：模型跑在 CPU 上很慢？

Ollama **会自动使用 GPU**（如果有的话）。Mac 用户用 M 系列芯片效果很好。如果没有 GPU：
- 用小模型（1.5B 以下的）
- 减少 `num_ctx`（如设为 2048）

### Q：Ollama 和 Docker 一起用？

```bash
# 用 Docker 运行 Ollama
docker run -d --gpus all -v ollama:/root/.ollama -p 11434:11434 ollama/ollama
```

---

## 总结

```
安装 Ollama → ollama run qwen2.5 → 用 OpenAI 库调用本地 API
```

| 模型 | 运行命令 | 中文能力 | 编程能力 | 推荐场景 |
|------|---------|---------|---------|---------|
| Qwen 2.5 | `ollama run qwen2.5` | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | **中文首选** |
| DeepSeek Coder | `ollama run deepseek-coder-v2` | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | **编程首选** |
| Llama 3 | `ollama run llama3.2` | ⭐⭐ | ⭐⭐⭐⭐ | 英文场景 |
| Mistral | `ollama run mistral` | ⭐⭐ | ⭐⭐⭐ | 轻量场景 |

**新手推荐路线：**
1. `ollama run qwen2.5:1.5b` — 先跑通最小模型
2. `ollama run qwen2.5` — 用标准模型体验
3. `ollama run deepseek-coder-v2` — 尝试编程专用模型
4. 用 Python 调用 — 集成到自己的项目
