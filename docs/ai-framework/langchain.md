# LangChain 入门教程

## LangChain 是什么？

LangChain 是一个用 Python 写的框架，帮你更方便地调用大语言模型（LLM）来开发 AI 应用。

**不用 LangChain 时，你要自己写：**
- 拼接提示词
- 调用 API
- 解析返回结果
- 管理对话历史
- 调用外部工具

**用 LangChain 后，这些都有现成的模块。**

就算你只会写 JavaScript 没写过 Python，也能看懂本文。

---

## 安装

```bash
pip install langchain langchain-openai python-dotenv
```

需要 Python 3.8+。

---

## 核心概念

| 概念 | 是什么 | 类比前端 |
|------|--------|---------|
| Model | 大模型（GPT、Claude 等） | 类似后端 API |
| Prompt | 你给模型的指令 | 类似 HTTP 请求参数 |
| Chain | 把多个步骤串联起来 | 类似 Promise.then 链 |
| Agent | 让模型自己决定调用什么工具 | 类似自动路由 |
| Tool | 模型可以调用的外部功能 | 类似 API 接口 |
| Memory | 让模型记住上下文 | 类似 Redux 状态管理 |

---

## 基础用法

### 调用模型

```python
from langchain_openai import ChatOpenAI
from dotenv import load_dotenv

load_dotenv()

# 创建一个模型实例，就像 new Axios() 创建 API 客户端
llm = ChatOpenAI(model="gpt-4o-mini")

# 调用模型，就像调用一个异步 API
response = llm.invoke("中国的首都是哪里？")
print(response.content)
# 输出：中国的首都是北京。
```

### 提示词模板

把提示词中的变量抽出来，类似 JavaScript 的模板字符串：

```python
from langchain_core.prompts import ChatPromptTemplate

# 定义一个提示词模板，变量用 {} 包裹
prompt = ChatPromptTemplate.from_messages([
    ("system", "你是一个{role}，请用{style}风格回答问题。"),
    ("human", "{question}"),
])

# 传入变量，生成最终的提示词
messages = prompt.invoke({
    "role": "AI 助手",
    "style": "幽默",
    "question": "什么是机器学习？",
})
```

### Chain：把 Prompt 和 Model 串起来

Chain 是 LangChain 的核心，用来把多个步骤连接起来：

```python
from langchain_core.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI

# 1. 定义模板
prompt = ChatPromptTemplate.from_template(
    "把下面的句子翻译成{language}：{text}"
)

# 2. 创建模型
llm = ChatOpenAI(model="gpt-4o-mini")

# 3. 用 | 运算符串联，类似 pipe 管道
chain = prompt | llm

# 4. 调用
result = chain.invoke({
    "language": "英文",
    "text": "今天天气真好",
})
print(result.content)
# 输出：The weather is really nice today.
```

`prompt | llm` 就像前端的 `pipe` 函数：先通过 prompt 处理输入，再把结果传给 llm。

---

## 输出解析器

模型返回的是原始文本，你可以用输出解析器转成结构化数据：

```python
from langchain_core.output_parsers import StrOutputParser, JsonOutputParser
from langchain_core.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI

llm = ChatOpenAI(model="gpt-4o-mini")

# 文本输出：直接返回字符串
parser = StrOutputParser()
chain = prompt | llm | parser
result = chain.invoke({"language": "英文", "text": "你好"})
# result 是纯字符串

# JSON 输出：要求模型返回 JSON
json_prompt = ChatPromptTemplate.from_template(
    "根据问题{question}，用 JSON 格式返回答案，包含 answer 和 confidence 字段"
)
json_parser = JsonOutputParser()
json_chain = json_prompt | llm | json_parser
result = json_chain.invoke({"question": "1+1等于几？"})
print(result)
# {'answer': 2, 'confidence': 1.0}
# result 是 Python 字典，可以直接用 result['answer']
```

对前端开发者来说，`JsonOutputParser` 就像 `JSON.parse()`。

---

## 对话历史（Memory）

默认模型不记得之前的对话，你需要手动传历史消息。LangChain 帮你管理：

```python
from langchain_core.chat_history import BaseChatMessageHistory
from langchain_community.chat_message_histories import ChatMessageHistory
from langchain_core.runnables.history import RunnableWithMessageHistory
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.messages import HumanMessage

llm = ChatOpenAI(model="gpt-4o-mini")

prompt = ChatPromptTemplate.from_messages([
    ("system", "你是一个友好的助手。"),
    MessagesPlaceholder(variable_name="history"),
    ("human", "{input}"),
])

chain = prompt | llm

# 用 RunnableWithMessageHistory 自动管理历史
chain_with_history = RunnableWithMessageHistory(
    chain,
    # 每个 session 独立存储历史
    lambda session_id: ChatMessageHistory(),
    input_messages_key="input",
    history_messages_key="history",
)

# 第一次对话
result1 = chain_with_history.invoke(
    {"input": "我叫小明"},
    config={"configurable": {"session_id": "001"}},
)
print(result1.content)
# 输出：你好小明！很高兴认识你。

# 第二次对话，模型记得你的名字
result2 = chain_with_history.invoke(
    {"input": "我叫什么名字？"},
    config={"configurable": {"session_id": "001"}},
)
print(result2.content)
# 输出：你叫小明。
```

`session_id` 就像前端的 localStorage key，不同用户用不同 ID。

---

## 工具（Tool）

让模型能调用外部功能，比如搜索、计算、查数据库：

```python
from langchain_core.tools import tool

# 定义一个工具，就像写一个 API 接口
@tool
def get_weather(city: str) -> str:
    """查询指定城市的天气"""
    # 实际项目中这里调用天气 API
    weather_data = {
        "北京": "晴天，25°C",
        "上海": "多云，28°C",
        "深圳": "雨天，26°C",
    }
    return weather_data.get(city, "暂无数据")
```

---

## Agent（智能体）

Agent 让模型自己决定调用哪个工具、按什么顺序。这是最强大的功能：

```python
from langchain_openai import ChatOpenAI
from langchain.agents import create_tool_calling_agent, AgentExecutor
from langchain_core.prompts import ChatPromptTemplate

llm = ChatOpenAI(model="gpt-4o-mini")
tools = [get_weather]

prompt = ChatPromptTemplate.from_messages([
    ("system", "你是一个助手，可以使用工具来回答问题。"),
    ("human", "{input}"),
    ("placeholder", "{agent_scratchpad}"),
])

agent = create_tool_calling_agent(llm, tools, prompt)
agent_executor = AgentExecutor(agent=agent, tools=tools, verbose=True)

# Agent 会自动判断需要调用工具
result = agent_executor.invoke({"input": "北京今天天气怎么样？"})
print(result["output"])
# 输出：北京今天天气是晴天，25°C。
```

执行过程：
1. 用户问"北京天气"
2. Agent 决定调用 `get_weather("北京")`
3. 拿到结果后，Agent 组织成自然语言回复

**Agent 的执行流程可以用前端类比：**
- 用户发请求 → dispatch action
- Agent 分析 → middleware 判断
- 调工具 → 调 API
- 返回结果 → 更新 state

---

## 实战：做一个 AI 客服

把前面学的内容组合起来：

```python
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.tools import tool
from langchain.agents import create_tool_calling_agent, AgentExecutor
from langchain_community.chat_message_histories import ChatMessageHistory
from langchain_core.runnables.history import RunnableWithMessageHistory
from dotenv import load_dotenv

load_dotenv()

# 1. 定义工具
@tool
def check_order(order_id: str) -> str:
    """查询订单状态"""
    return f"订单 {order_id} 已发货，预计 3 天内到达"

@tool
def get_product_info(product_name: str) -> str:
    """查询商品信息"""
    return f"{product_name}，价格 99 元，库存 100 件"

# 2. 创建模型和 Agent
llm = ChatOpenAI(model="gpt-4o-mini")
tools = [check_order, get_product_info]

prompt = ChatPromptTemplate.from_messages([
    ("system", "你是一个电商客服助手，用中文回答。"),
    MessagesPlaceholder(variable_name="history"),
    ("human", "{input}"),
    ("placeholder", "{agent_scratchpad}"),
])

agent = create_tool_calling_agent(llm, tools, prompt)
agent_executor = AgentExecutor(agent=agent, tools=tools, verbose=False)

# 3. 添加对话历史
chain_with_history = RunnableWithMessageHistory(
    agent_executor,
    lambda session_id: ChatMessageHistory(),
    input_messages_key="input",
    history_messages_key="history",
)

# 4. 调用
def ask(session_id, question):
    result = chain_with_history.invoke(
        {"input": question},
        config={"configurable": {"session_id": session_id}},
    )
    return result["output"]

print(ask("001", "我的订单 12345 到哪了？"))
print(ask("001", "再帮我查一下 iPhone 的价格"))
```

---

## LangChain 生态

| 包名 | 用途 |
|------|------|
| langchain | 核心框架 |
| langchain-openai | OpenAI 模型接入 |
| langchain-community | 社区维护的集成（数据库、搜索等） |
| langchainhub | 共享的 Prompt 模板 |
| langsmith | 调试、测试、监控 |

---

## 和前端框架类比

| LangChain | React / Vue |
|-----------|-------------|
| Prompt | 组件模板（JSX） |
| Chain | 组件组合（父子组件） |
| Tool | API 接口 |
| Agent | 智能路由 / 状态机 |
| Memory | 状态管理（Redux / Pinia） |
| RunnableWithMessageHistory | 高阶组件（HOC） |
| Callback | 生命周期钩子 |

---

## 总结

LangChain 的核心思想就是把 AI 开发中的重复工作变成模块化的组件。你只需要：

1. 选模型 → `ChatOpenAI`
2. 写提示词 → `ChatPromptTemplate`
3. 串联步骤 → `prompt \| llm \| parser`
4. 加工具 → `@tool`
5. 让模型自己决策 → `Agent`

---

## 下一步

- [LangChain 官方文档](https://python.langchain.com/)
- [LangChain 中文教程](https://github.com/lichuang/langchain-tutorials)
- [LangSmith 调试平台](https://smith.langchain.com/)
