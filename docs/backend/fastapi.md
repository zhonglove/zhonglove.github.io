# Python (FastAPI) 后端开发教程

## 什么是 FastAPI？

FastAPI 是一个现代、高性能的 Python Web 框架，专为构建 API 而生。它基于 Python 类型提示，自动生成 API 文档，天然支持异步。

**核心概念**：
- Path Operation：路由和请求处理
- Pydantic Model：数据验证和序列化
- Dependency Injection：依赖注入
- Async/Await：异步处理

## 环境搭建

```bash
# 创建项目目录
mkdir my-fastapi-app
cd my-fastapi-app

# 创建虚拟环境
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 安装 FastAPI
pip install fastapi uvicorn

# 启动
uvicorn main:app --reload
```

浏览器打开 http://localhost:8000，看到自动生成的 API 文档 http://localhost:8000/docs。

## 项目结构

```
my-fastapi-app/
├── main.py              # 入口文件
├── routers/             # 路由模块
│   └── chat.py
├── models/              # 数据模型
│   └── chat.py
├── services/            # 业务逻辑
│   └── chat.py
├── requirements.txt
└── .env
```

## 快速开始

```python
# main.py
from fastapi import FastAPI

app = FastAPI(title="AI Chat API")

@app.get("/")
def root():
    return {"message": "Hello World"}
```

## Path Operation

```python
from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()

class Message(BaseModel):
    message: str
    user_id: str | None = None

@app.post("/chat")
async def send_message(msg: Message):
    return {
        "reply": f"你说了：{msg.message}",
        "user_id": msg.user_id,
    }

@app.get("/chat/{message_id}")
async def get_message(message_id: int):
    return {"id": message_id, "content": "消息内容"}
```

## Pydantic Model

Pydantic 用于定义数据模型，自带验证。

```python
from pydantic import BaseModel, Field
from typing import List

class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, description="用户消息")
    history: List[dict] | None = None

class ChatResponse(BaseModel):
    reply: str
    usage: dict | None = None
```

```python
# 在路由中使用
@app.post("/chat", response_model=ChatResponse)
async def chat(req: ChatRequest):
    reply = await chat_service.get_reply(req.message)
    return ChatResponse(reply=reply)
```

## Router 路由模块

```python
# routers/chat.py
from fastapi import APIRouter

router = APIRouter(prefix="/chat", tags=["聊天"])

@router.post("/")
async def send_message(message: str):
    return {"reply": f"你说了：{message}"}

@router.get("/history")
async def get_history():
    return {"messages": []}
```

```python
# main.py
from routers.chat import router as chat_router

app.include_router(chat_router)
```

## 依赖注入

```python
from fastapi import Depends, FastAPI

app = FastAPI()

# 定义依赖
def get_current_user(token: str):
    return {"user_id": token}

# 在路由中使用
@app.post("/chat")
async def chat(user: dict = Depends(get_current_user)):
    return {"user": user}
```

## 集成 AI API

### OpenAI

```bash
pip install openai python-dotenv
```

```python
# services/chat.py
from openai import OpenAI
import os
from dotenv import load_dotenv

load_dotenv()

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

async def get_reply(message: str) -> str:
    completion = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": message}],
    )
    return completion.choices[0].message.content
```

```bash
# .env
OPENAI_API_KEY=sk-your-key
```

### 流式输出 SSE

FastAPI 原生支持异步流式响应。

```python
from fastapi.responses import StreamingResponse
import json

@app.post("/chat/stream")
async def chat_stream(message: str):
    async def generate():
        stream = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": message}],
            stream=True,
        )
        for chunk in stream:
            if chunk.choices[0].delta.content:
                yield f"data: {json.dumps({'content': chunk.choices[0].delta.content})}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")
```

## LangChain 集成

```bash
pip install langchain langchain-openai
```

```python
from langchain_openai import ChatOpenAI
from langchain.schema import HumanMessage

llm = ChatOpenAI(model="gpt-4o-mini", temperature=0.7)

@app.post("/langchain-chat")
async def langchain_chat(message: str):
    response = llm.invoke([HumanMessage(content=message)])
    return {"reply": response.content}
```

## 数据库 SQLAlchemy

```bash
pip install sqlalchemy psycopg2-binary
```

```python
# models/database.py
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

DATABASE_URL = "postgresql://user:pass@localhost/dbname"
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

```python
# models/chat.py
from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import declarative_base

Base = declarative_base()

class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    content = Column(String)
    role = Column(String)
    created_at = Column(DateTime, server_default=func.now())
```

```python
# 在路由中使用
from fastapi import Depends
from sqlalchemy.orm import Session
from models.database import get_db, SessionLocal
from models.chat import Message

@app.post("/messages")
async def create_message(content: str, role: str, db: Session = Depends(get_db)):
    msg = Message(content=content, role=role)
    db.add(msg)
    db.commit()
    db.refresh(msg)
    return msg

@app.get("/messages")
async def get_messages(db: Session = Depends(get_db)):
    return db.query(Message).order_by(Message.created_at).all()
```

## CORS

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "https://your-frontend.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## 部署

### Docker

```dockerfile
FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

```yaml
# docker-compose.yml
services:
  app:
    build: .
    ports:
      - "8000:8000"
    env_file: .env
```
