# LangGraph 入门教程

## LangGraph 是什么？

LangGraph 是 LangChain 团队推出的框架，用来**构建有状态的 AI Agent**。它把 Agent 的工作流程看作一个有向图（Graph），节点是处理步骤，边是步骤之间的流转条件。

**对比 LangChain 和 LangGraph：**

| LangChain | LangGraph |
|-----------|-----------|
| 线性链（Chain），一步接一步 | 图结构（Graph），支持分支和循环 |
| 适合简单问答、翻译 | 适合复杂 Agent、多步骤推理 |
| Agent 是黑盒 | Agent 的每一步都可控制 |
| 状态管理靠外部 Memory | 内置状态管理 |

**你可以把 LangGraph 想象成一个流程图：**
- **节点（Node）**：一个处理步骤（调用 LLM、调工具、做判断）
- **边（Edge）**：从一个节点到下一个节点的连接
- **状态（State）**：所有节点共享的数据，类似前端的 Redux Store

---

## 安装

```bash
pip install langgraph langchain-openai
```

LangGraph 是独立包，不依赖 LangChain，但通常一起用。

---

## 核心概念

### State（状态）

状态是图里所有节点共享的数据。你需要用 Python 的 `TypedDict` 或 `dataclass` 定义状态的结构：

```python
from typing import TypedDict, List

# 定义状态的结构，就像定义 Redux 的 initialState
class AgentState(TypedDict):
    messages: List[dict]  # 消息历史
    next_step: str        # 下一步做什么
    final_answer: str     # 最终答案
```

### Node（节点）

节点就是一个 Python 函数，接收当前状态，返回更新后的状态：

```python
def call_model(state: AgentState) -> AgentState:
    """调用 LLM 的节点"""
    response = llm.invoke(state["messages"])
    return {"messages": state["messages"] + [response]}

def check_answer(state: AgentState) -> AgentState:
    """判断是否需要继续的节点"""
    if "不知道" in state["messages"][-1].content:
        return {"next_step": "retry"}
    return {"next_step": "done"}
```

### Edge（边）

边决定节点执行完后下一个节点是什么：

```python
from langgraph.graph import StateGraph

# 条件边：根据状态决定走向
def router(state: AgentState) -> str:
    if state["next_step"] == "retry":
        return "call_model"  # 重新调用模型
    return "format_answer"   # 生成最终答案
```

---

## 实战：构建一个数学解题 Agent

一步步构建一个能解题、检查答案、出错重试的 Agent。

### 第 1 步：定义状态

```python
from typing import TypedDict, Annotated, List
from langgraph.graph.message import add_messages

class MathState(TypedDict):
    messages: Annotated[List, add_messages]  # 自动追加消息
    problem: str          # 题目
    solution: str         # 解答过程
    answer: str           # 最终答案
    attempts: int         # 重试次数
    is_correct: bool      # 答案是否正确
```

`add_messages` 是 LangGraph 提供的一个 reducer，类似 Redux 的 `combineReducers`。它告诉 LangGraph 往 `messages` 列表追加消息，而不是覆盖。

### 第 2 步：创建图

```python
from langgraph.graph import StateGraph, START, END
from langgraph.checkpoint.memory import MemorySaver

# 创建一个状态图，就像创建一个 Redux store
builder = StateGraph(MathState)
```

### 第 3 步：添加节点

```python
from langchain_openai import ChatOpenAI

llm = ChatOpenAI(model="gpt-4o-mini")

# 节点 1：解题
def solve_problem(state: MathState) -> MathState:
    """调用 LLM 解答数学题"""
    prompt = f"请解答这道数学题：{state['problem']}\n请给出详细的解题步骤和最终答案。"
    response = llm.invoke(prompt)
    return {
        "messages": state["messages"] + [response],
        "solution": response.content,
    }

# 节点 2：检查答案
def check_answer(state: MathState) -> MathState:
    """检查答案是否正确"""
    prompt = f"""
题目：{state['problem']}
解题过程：{state['solution']}
请检查这个解答是否正确，只回答 yes 或 no。
"""
    response = llm.invoke(prompt)
    is_correct = "yes" in response.content.lower()
    return {
        "is_correct": is_correct,
        "attempts": state.get("attempts", 0) + 1,
    }

# 节点 3：生成最终输出
def format_answer(state: MathState) -> MathState:
    """生成格式化的最终答案"""
    if state["is_correct"]:
        return {"answer": f"答案是：{state['solution']}"}
    return {"answer": "无法得出正确答案"}

# 把节点加入图中
builder.add_node("solve", solve_problem)
builder.add_node("check", check_answer)
builder.add_node("format", format_answer)
```

### 第 4 步：添加边

```python
# 条件路由：检查结果决定下一步
def after_check(state: MathState) -> str:
    if not state["is_correct"] and state["attempts"] < 3:
        return "solve"  # 答案不对，重新解题
    return "format"     # 对了或重试用完，生成最终答案

# 连接节点
builder.add_edge(START, "solve")     # 起始 → 解题
builder.add_edge("solve", "check")   # 解题 → 检查
builder.add_conditional_edges(
    "check",
    after_check,
    {"solve": "solve", "format": "format"}
)
builder.add_edge("format", END)      # 格式化 → 结束
```

### 第 5 步：编译和执行

```python
# 编译图，就像 webpack 打包代码
graph = builder.compile()

# 执行
result = graph.invoke({
    "problem": "一个长方形的长是 8 厘米，宽是 5 厘米，求它的面积。",
    "messages": [],
    "solution": "",
    "answer": "",
    "attempts": 0,
    "is_correct": False,
})

print(result["answer"])
# 输出：答案是：长方形的面积 = 长 × 宽 = 8 × 5 = 40 平方厘米。
```

---

## 可视化

LangGraph 可以生成图的 Mermaid 流程图：

```python
# 查看图结构
print(graph.get_graph().draw_mermaid())

# 保存为图片（需要安装 mermaid-cli）
graph.get_graph().draw_mermaid_png("math_agent.png")
```

---

## 带工具的 Agent

LangGraph 特别适合需要调用外部工具的复杂场景：

```python
from langchain_core.tools import tool

# 定义工具
@tool
def calculate(expression: str) -> str:
    """计算数学表达式"""
    return str(eval(expression))

@tool
def search(query: str) -> str:
    """搜索信息"""
    return f"关于 '{query}' 的搜索结果..."

tools = [calculate, search]

# Agent 节点：决定调用哪个工具
def agent_node(state: MathState) -> MathState:
    result = llm_with_tools.invoke(state["messages"])
    return {"messages": [result]}

# 工具节点：执行工具调用
def tool_node(state: MathState) -> MathState:
    from langgraph.prebuilt import ToolNode
    tool_executor = ToolNode(tools)
    return tool_executor.invoke(state)
```

---

## 持久化和记忆

LangGraph 支持 Checkpoint，可以保存和恢复对话状态：

```python
from langgraph.checkpoint.memory import MemorySaver

# 使用内存存储（类似前端的 localStorage）
memory = MemorySaver()

# 编译时传入 checkpointer
graph = builder.compile(checkpointer=memory)

# 执行时传入 thread_id，同一个 ID 可以恢复上下文
config = {"configurable": {"thread_id": "user_001"}}
result = graph.invoke({"problem": "1+1等于几？"}, config)

# 继续对话（图的记忆会保留）
result2 = graph.invoke({"problem": "那2+2呢？"}, config)
```

`thread_id` 就像前端的用户 ID，同一个用户的不同对话用不同 ID。

---

## 常用图模式

### 1. 顺序执行（Chain）

```python
builder.add_edge(START, "node1")
builder.add_edge("node1", "node2")
builder.add_edge("node2", END)
```

### 2. 分支选择（Router）

```python
builder.add_conditional_edges("router", router_func, {
    "option_a": "node_a",
    "option_b": "node_b",
})
```

### 3. 循环（Loop）

```python
# 通过条件边实现循环
builder.add_conditional_edges("check", should_retry, {
    True: "solve",   # 回到上一个节点
    False: END,
})
```

---

## 和前端框架类比

| LangGraph | React / Redux |
|-----------|---------------|
| StateGraph | Redux Store |
| State（TypedDict） | initialState |
| Node（函数） | Reducer |
| Edge | dispatch / action |
| add_messages | combineReducers |
| Conditional Edge | middleware 路由 |
| Checkpointer | Redux Persist |
| thread_id | 用户 session ID |

---

## 总结

LangGraph = **状态 + 节点 + 边**。

| 步骤 | 代码 | 说明 |
|------|------|------|
| 1 | `StateGraph(State)` | 创建图 |
| 2 | `add_node(name, func)` | 添加处理步骤 |
| 3 | `add_edge(from, to)` | 连接步骤 |
| 4 | `add_conditional_edges` | 添加条件分支 |
| 5 | `compile()` | 编译图 |
| 6 | `invoke(input)` | 执行图 |

---

## 下一步

- [LangGraph 官方文档](https://langchain-ai.github.io/langgraph/)
- [LangGraph 示例库](https://github.com/langchain-ai/langgraph/tree/main/examples)
- [LangGraph 中文教程](https://github.com/liguodong/llm-learning)
