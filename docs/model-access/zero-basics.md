# 模型接入零基础教程

## 大模型是什么？

想象你有一个特别聪明的助手，它读完了互联网上所有的书和文章，你问它什么问题它都能回答。这就是**大语言模型（LLM）**。

常见的模型有：
- **GPT**（OpenAI）— 最出名，ChatGPT 就是用这个
- **Claude**（Anthropic）— 也很聪明，擅长长文章
- **通义千问**（阿里）— 国产免费模型
- **DeepSeek**（深度求索）— 国产开源模型

## 你需要什么？

要使用大模型，你需要三样东西：

```
你的代码 → 调用 API → 大模型 → 返回结果
```

1. **一台能上网的电脑** — 你的开发机
2. **API 密钥** — 相当于你的"门票"
3. **网络请求** — 你的代码发给模型的"信"

看不懂没关系，下面一步步来。

---

## 第一步：注册账号拿密钥

以 OpenAI 为例：

```
1. 打开 https://platform.openai.com
2. 点击 Sign Up 注册（需要手机号和邮箱）
3. 登录后点右上角头像 → API keys
4. 点 Create new secret key
5. 复制密钥（以 sk- 开头），保存好，别告诉别人
```

> **注意**：OpenAI 需要绑信用卡才能用（有免费额度）。如果不想花钱，可以先试试国产免费模型。

**国产免费方案：DeepSeek**

```
1. 打开 https://platform.deepseek.com
2. 注册账号
3. 创建 API key
4. 免费使用，不用绑卡
```

---

## 第二步：什么是 API？

API 就是"两个程序之间对话的规则"。

**打个比方：**

```
你去餐厅吃饭：
你（客户端）→ 点菜（请求）→ 服务员（API）→ 告诉厨房 → 上菜（响应）→ 你
```

调用大模型也是一样：
```
你的代码 → 发送问题（请求）→ API → 大模型处理 → 返回答案（响应）→ 你的代码
```

---

## 第三步：安装 Python

如果你没有装 Python，从这里开始：

### Mac 用户

打开终端（Terminal），输入：

```bash
python3 --version
```

如果显示版本号（如 Python 3.11），说明已经装了。如果没有，去 https://www.python.org/downloads/ 下载安装。

### Windows 用户

去 https://www.python.org/downloads/ 下载安装，安装时**记得勾选 "Add Python to PATH"**。

---

## 第四步：调用你的第一个模型

### 安装依赖

```bash
pip install openai
```

### 写代码

新建一个文件 `test_model.py`，粘贴下面代码：

```python
from openai import OpenAI

# 把你的密钥贴在这里（不要告诉别人）
client = OpenAI(
    api_key="sk-你的密钥在这里",
)

# 问问题
response = client.chat.completions.create(
    model="gpt-4o-mini",  # 模型名字，gpt-4o-mini 是便宜又好用的版本
    messages=[
        {"role": "user", "content": "你好，请用一句话介绍你自己"},
    ],
)

# 打印回答
print(response.choices[0].message.content)
```

### 运行

```bash
python test_model.py
```

如果看到屏幕上打印出模型的回答，恭喜你，你已经成功调用了大模型！

---

## 第五步：理解代码

上面的代码每一行在做什么？

```python
from openai import OpenAI
```
从 openai 库中导入 OpenAI 这个工具。

```python
client = OpenAI(api_key="sk-...")
```
创建了一个"客户端"，相当于你和服务器的连接通道。api_key 是你的身份证明。

```python
response = client.chat.completions.create(
    model="gpt-4o-mini",
    messages=[{"role": "user", "content": "你好"}],
)
```
这是核心调用：
- `model`：选择用哪个模型
- `messages`：对话内容，`role` 是"谁在说话"（user=你，assistant=模型）
- 返回值 `response` 是模型的回答

```python
print(response.choices[0].message.content)
```
从返回结果中提取模型的回答文字并打印。

---

## 第六步：让对话更有用

### 传多个问题（多轮对话）

```python
messages = [
    {"role": "user", "content": "中国的首都是哪里？"},
    {"role": "assistant", "content": "中国的首都是北京。"},
    {"role": "user", "content": "那里有什么著名的景点？"},
]

response = client.chat.completions.create(
    model="gpt-4o-mini",
    messages=messages,
)
print(response.choices[0].message.content)
```

注意：模型**不记得**之前的对话。你需要把整个对话历史都传给它。

### 设置系统提示词（System Prompt）

系统提示词相当于给模型一个"角色设定"：

```python
response = client.chat.completions.create(
    model="gpt-4o-mini",
    messages=[
        {"role": "system", "content": "你是一个幽默的数学老师，用有趣的方式回答问题。"},
        {"role": "user", "content": "1+1等于几？"},
    ],
)
```

---

## 常见问题

### Q：调用要钱吗？

OpenAI 按 token（字数）收费，gpt-4o-mini 很便宜，问几百次才几毛钱。

### Q：什么是 Token？

Token 是模型计费的单位。简单理解：1 个汉字 ≈ 2 个 token，1 个英文单词 ≈ 1 个 token。

### Q：报错 "AuthenticationError"？

密钥不对。检查你的 api_key 是否正确，是不是多了空格。

### Q：报错 "RateLimitError"？

请求太频繁了。等几秒再试，或者换更便宜的模型。

### Q：用国产模型怎么改？

```python
from openai import OpenAI

# DeepSeek（免费）
client = OpenAI(
    api_key="你的DeepSeek密钥",
    base_url="https://api.deepseek.com",
)

response = client.chat.completions.create(
    model="deepseek-chat",  # DeepSeek 的模型名
    messages=[{"role": "user", "content": "你好"}],
)
```

### Q：可以用其他语言吗？

可以。OpenAI 的 API 是 HTTP 接口，任何语言都能调用：

```python
# JavaScript (Node.js)
# const response = await fetch('https://api.openai.com/v1/chat/completions', {
#   method: 'POST',
#   headers: { 'Authorization': 'Bearer sk-...' },
#   body: JSON.stringify({ model: 'gpt-4o-mini', messages: [...] })
# })
```

---

## 总结

| 步骤 | 做的事 | 关键词 |
|------|--------|--------|
| 1 | 注册账号 | API Key |
| 2 | 装 Python | python3 |
| 3 | 装 openai 库 | pip install |
| 4 | 写代码 | client.chat.completions.create |
| 5 | 运行 | python 文件名.py |

**你现在已经学会了：**
1. 什么是大模型和 API
2. 如何获取 API 密钥
3. 如何用 Python 调用大模型
4. 如何处理多轮对话和系统提示词

下一步可以学习怎么用模型做具体的事情，比如写摘要、翻译、写代码等。
