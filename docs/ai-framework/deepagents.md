# DeepAgents 入门教程

## DeepAgents 是什么？

DeepAgents 是 LangChain 团队推出的**开箱即用的 AI Agent 框架**。你只需要一个函数调用，就能得到一个带规划、文件系统、子代理、上下文管理等能力的完整 Agent。

你可以把 DeepAgents 理解成一个**已经组装好的机器人**，而普通的 LangChain Agent 只是一堆零件。

**三个框架的关系：**

| 框架 | 比喻 | 谁适合 |
|------|------|--------|
| LangChain | 工具箱（锤子、螺丝刀） | 需要自己动手搭 |
| LangGraph | 机器人图纸（状态机） | 需要自定义控制流 |
| DeepAgents | **已组装好的机器人** | 想要开箱即用 |

**一句话总结：DeepAgents = LangGraph 的图结构 + 预装好的全能力（规划/文件/子代理/记忆）。**

---

## 安装

```bash
pip install deepagents
```

安装后会自动带上 `langchain-core`、`langgraph` 等依赖。

---

## 你的第一个 DeepAgent

下面是最简代码，只有 3 行：

```python
from deepagents import create_deep_agent

agent = create_deep_agent()
result = agent.invoke({"messages": [{"role": "user", "content": "介绍一下 LangGraph"}]})
```

这个 Agent **什么代码都没写**，但已经具备以下能力：

- ✅ 多步骤规划
- ✅ 读写文件
- ✅ 调用子代理
- ✅ 管理上下文
- ✅ 执行 Shell 命令

**默认模型**是 `claude-sonnet-4-6`（Anthropic Claude）。

---

## 核心能力详解

### 1. 规划能力（Planning）

DeepAgents 会自动把复杂任务分解成步骤：

```python
# 你只需要问这一个问题
result = agent.invoke({
    "messages": [{"role": "user", "content": "研究 Python 异步编程，写一篇教程"}]
})
```

Agent 内部会调用 `write_todos` 工具，自动创建任务清单：

```
[1/5] 研究 Python async/await 基础
[2/5] 研究 asyncio 库的核心 API
[3/5] 编写代码示例
[4/5] 撰写教程草稿
[5/5] 检查和格式化
```

每一步完成后，Agent 会勾选并自动进入下一步。你可以看到它**正在做什么、做到哪一步了**。

### 2. 文件系统（Filesystem）

DeepAgents 内置了 6 个文件操作工具：

| 工具 | 作用 |
|------|------|
| `ls` | 列出目录 |
| `read_file` | 读取文件 |
| `write_file` | 写入文件 |
| `edit_file` | 编辑文件 |
| `glob` | 搜索文件 |
| `grep` | 搜索文件内容 |

**为什么要文件系统？**

LLM 的上下文窗口有限。假设 Agent 搜索了 10 个网页，全部塞进上下文就满了。DeepAgents 的做法是：**把中间结果写入文件，需要时再读取**。

```python
# Agent 内部会自动做这些：
# write_file("search_result_1.md", "网页内容...")  ← 写入文件
# read_file("search_result_1.md")                   ← 需要时读取
```

这样上下文窗口只保存当前步骤的关键信息，不会被中间结果撑爆。

### 3. 子代理（Sub-Agents）

Agent 可以把子任务**委派给专门的子代理**，每个子代理有独立的上下文环境。

想象一个场景：老板让你同时做市场调研和写代码。

- 你（主代理）：负责统筹，把任务分出去
- 员工 A（子代理 1）：负责调研，有自己的思路和资料
- 员工 B（子代理 2）：负责编码，有自己的代码和工具

**例子：研究一个开源项目**

```python
# 主代理自动执行：
# 1. task("在 GitHub 上搜索 LangGraph 的 Star 数和最近更新")
# 2. task("阅读 LangGraph 官方文档，总结核心概念")
# 3. 合并两个子代理的结果，写出最终报告
```

每个 `task` 调用都会生成一个**独立的子代理**，它的上下文不会污染主代理。

### 4. Shell 执行

Agent 可以执行 Shell 命令：

```python
# Agent 内部会自动调用 execute 工具
# execute("pip install requests")
# execute("python test.py")
```

这对于**编程类 Agent** 非常有用：写代码 → 运行 → 看到报错 → 修改 → 再运行。

### 5. 上下文管理

长时间运行时上下文会越来越大。DeepAgents 的 **SummarizationMiddleware** 会自动**压缩旧的对话历史**，只保留关键信息，释放上下文空间。

---

## 实战：构建一个研究助手

### 第 1 步：安装依赖

```bash
pip install deepagents tavily-python
```

Tavily 是一个搜索 API，专门给 AI Agent 用的。

### 第 2 步：设置 API 密钥

```bash
export OPENAI_API_KEY="你的OpenAI密钥"
export TAVILY_API_KEY="你的Tavily密钥"
```

### 第 3 步：自定义 Agent

```python
from deepagents import create_deep_agent
from langchain_openai import ChatOpenAI
from langchain_community.tools.tavily_search import TavilySearchResults

# 创建搜索工具
search = TavilySearchResults(max_results=3)

# 创建 Agent，指定模型、工具和系统提示词
agent = create_deep_agent(
    model=ChatOpenAI(model="gpt-4o"),
    tools=[search],
    system_prompt="你是一个技术研究助手。深入研究问题并给出详细的报告。",
)
```

### 第 4 步：执行复杂任务

```python
result = agent.invoke({
    "messages": [{
        "role": "user",
        "content": "比较 RAG 和微调这两种技术，写出详细的对比报告"
    }]
})

# 查看最终回复
for msg in result["messages"]:
    if hasattr(msg, "content") and msg.content:
        print(msg.content)
```

### Agent 内部发生了什么？

当你执行上面这个调用时，Agent 内部会自动完成：

```
Step 1: write_todos  → 分解任务
  ├── [1/4] 搜索 RAG 相关资料
  ├── [2/4] 搜索 微调 相关资料
  ├── [3/4] 对比分析
  └── [4/4] 撰写报告

Step 2: tavily_search  → 搜索 RAG 资料
         write_file("rag_info.md", ...)  → 保存到文件

Step 3: tavily_search  → 搜索微调资料
         write_file("finetune_info.md", ...)  → 保存到文件

Step 4: read_file("rag_info.md")   → 读取资料
         read_file("finetune_info.md")  → 读取资料
         对比分析

Step 5: 生成最终报告
```

全程**不需要你写任何编排代码**，Agent 自己规划、执行、调整。

---

## 配置详解

### 换模型

```python
# 用字符串指定
agent = create_deep_agent(model="openai:gpt-4o")
agent = create_deep_agent(model="anthropic:claude-sonnet-4-6")
agent = create_deep_agent(model="google:gemini-2.5-pro")

# 或者传入 LangChain 模型对象
from langchain_openai import ChatOpenAI
agent = create_deep_agent(model=ChatOpenAI(model="gpt-4o-mini"))
```

### 自定义系统提示词

```python
agent = create_deep_agent(
    system_prompt="你是 Python 编程导师。用中文回答，给出代码示例。",
)
```

注意：你的提示词会**追加**到内置的系统提示词后面，不会覆盖内置提示词。所以 Agent 仍然会使用规划、文件系统等能力。

### 自定义工具

```python
from langchain_core.tools import tool

@tool
def get_weather(city: str) -> str:
    """查询城市的天气"""
    # 这里调用天气 API
    return f"{city} 今天是晴天，25°C"

agent = create_deep_agent(
    model="openai:gpt-4o",
    tools=[get_weather],
)
```

### 配置子代理

```python
from deepagents import create_deep_agent

agent = create_deep_agent(
    model="openai:gpt-4o",
    subagents=[
        {
            "name": "coder",
            "model": "openai:gpt-4o",
            "system_prompt": "你是一个 Python 程序员，只负责写代码",
        },
        {
            "name": "reviewer",
            "model": "anthropic:claude-sonnet-4-6",
            "system_prompt": "你是一个代码审查员，检查代码质量",
        },
    ],
)
```

### 人类介入（Human-in-the-Loop）

对于**删除文件、发送邮件**等不可逆操作，可以让 Agent 暂停等待确认：

```python
agent = create_deep_agent(
    model="openai:gpt-4o",
    interrupt_on={
        "delete_file": True,    # 删除文件前暂停
        "execute": True,        # 执行命令前暂停（可选）
    },
)
```

### 持久化记忆

默认情况下，每次对话 Agent 都是"失忆"的。要让它记住之前的对话：

```python
from langgraph.checkpoint.memory import MemorySaver

agent = create_deep_agent(
    model="openai:gpt-4o",
    checkpointer=MemorySaver(),
)

# 第一次对话
agent.invoke({"messages": [...]}, config={"configurable": {"thread_id": "user_001"}})

# 第二次对话（会记住第一次的内容）
agent.invoke({"messages": [...]}, config={"configurable": {"thread_id": "user_001"}})
```

---

## DeepAgents vs 其他方案

| 对比 | create_agent (LangChain) | create_deep_agent (DeepAgents) |
|------|------------------------|--------------------------------|
| 代码量 | 需要手动搭建 | **1 个函数** |
| 规划能力 | ❌ 没有 | ✅ write_todos |
| 文件系统 | ❌ 没有 | ✅ 6 个文件工具 |
| 子代理 | ❌ 没有 | ✅ task 委派 |
| 上下文管理 | ❌ 需要自己实现 | ✅ 自动压缩 |
| Shell 执行 | ❌ 需要自己加工具 | ✅ 内置 |
| 模型重试 | ❌ 需要自己处理 | ✅ 自动重试 6 次 |
| 人类介入 | ❌ 需要手动配置 LangGraph | ✅ interrupt_on 参数 |

**什么时候用哪个？**

| 场景 | 推荐 |
|------|------|
| 简单的问答机器人 | `create_agent` |
| 翻译、摘要、分类 | `create_agent` |
| **多步骤研究任务** | **DeepAgents** |
| **编程助手（写代码+运行）** | **DeepAgents** |
| **需要调用子任务的** | **DeepAgents** |
| 需要完全自定义控制流 | LangGraph |

---

## 和前端框架类比

| DeepAgents | 前端类比 |
|-------------|---------|
| `create_deep_agent()` | 像 React 的 `create-react-app`，帮你搭好脚手架 |
| 规划（write_todos） | 像项目管理工具（Jira 的任务清单） |
| 文件系统 | 像浏览器的 localStorage / IndexedDB |
| 子代理（task） | 像 Web Worker，独立线程执行任务 |
| 上下文管理 | 像 Redux 的中间件，自动管理 state |
| 人类介入（interrupt_on） | 像弹窗确认："确定要删除吗？" |
| checkpointer（记忆） | 像 Redux Persist，刷新页面数据还在 |

---

## 常见问题

### Q：DeepAgents 需要 API Key 吗？

默认使用 Claude，需要 Anthropic API Key。你也可以换成 OpenAI、Gemini 等。

### Q：DeepAgents 只能在命令行用吗？

不，它返回的是 LangGraph 的 `CompiledStateGraph`，可以在任何 Python 应用中使用——Web 后端、API 服务、脚本等。

### Q：DeepAgents 可以流式输出吗？

```python
# 流式输出，像 ChatGPT 一样一个字一个字显示
for chunk in agent.stream({"messages": [...]}):
    print(chunk)
```

### Q：DeepAgents 和 Manus / Claude Code 什么关系？

Manus 和 Claude Code 是**产品**，DeepAgents 是它们的**底层架构的开源版本**。DeepAgents 提取了 Claude Code 的 Agent 架构，让你可以构建类似的产品。

### Q：DeepAgents 支持 MCP 吗？

支持。通过 `langchain-mcp-adapters` 可以连接 MCP 服务器，使用外部工具。

---

## 总结

DeepAgents = **一个函数** + **五类能力**

| 能力 | 解决什么问题 |
|------|-------------|
| 规划 | Agent 知道先做什么后做什么 |
| 文件系统 | 上下文不会被撑爆 |
| Shell 执行 | Agent 可以写代码、运行、调试 |
| 子代理 | 复杂任务可以分工协作 |
| 上下文管理 | 长时间运行不会忘记前面 |

**一句话记住：DeepAgents 让 AI Agent 从"只会聊天"变成"能干活"。**

---

## 下一步

- [DeepAgents 官方文档](https://docs.langchain.com/oss/python/deepagents/overview)
- [GitHub 仓库](https://github.com/langchain-ai/deepagents)
- [DeepAgents 示例库](https://github.com/langchain-ai/deepagents/tree/main/examples)
