# Node.js (NestJS) 后端开发教程

## 什么是 NestJS？

NestJS 是一个基于 Node.js 的后端框架，使用 TypeScript，借鉴了 Angular 的模块化思想。

**核心概念**：
- Module：功能单元，一个模块管一组相关功能
- Controller：处理 HTTP 请求，定义路由
- Service：写业务逻辑的地方
- DTO：定义请求和响应的数据格式

## 环境搭建

```bash
npm install -g @nestjs/cli
nest new my-nest-app
cd my-nest-app
npm run start:dev
```

浏览器打开 http://localhost:3000，看到 `Hello World!` 即成功。

## 项目结构

```
my-nest-app/
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   ├── app.controller.ts
│   └── app.service.ts
├── test/
├── package.json
└── tsconfig.json
```

## Module

```typescript
import { Module } from '@nestjs/common'
import { ChatModule } from './chat/chat.module'

@Module({
  imports: [ChatModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
```

## Controller

```typescript
import { Controller, Post, Body } from '@nestjs/common'
import { ChatService } from './chat.service'

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  async sendMessage(@Body('message') message: string) {
    return this.chatService.getReply(message)
  }
}
```

## Service

```typescript
import { Injectable } from '@nestjs/common'

@Injectable()
export class ChatService {
  async getReply(message: string) {
    return { reply: `你说了：${message}` }
  }
}
```

## DTO 与数据验证

```bash
npm install class-validator class-transformer
```

```typescript
import { IsString, IsNotEmpty } from 'class-validator'

export class SendMessageDto {
  @IsString()
  @IsNotEmpty()
  message: string
}
```

```typescript
// main.ts 启用全局验证
import { ValidationPipe } from '@nestjs/common'
const app = await NestFactory.create(AppModule)
app.useGlobalPipes(new ValidationPipe())
```

## 集成 OpenAI

```typescript
import { Injectable } from '@nestjs/common'
import OpenAI from 'openai'

@Injectable()
export class ChatService {
  private openai: OpenAI

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  }

  async getReply(message: string) {
    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: message }],
    })
    return { reply: completion.choices[0].message.content }
  }
}
```

### 环境变量

```bash
npm install @nestjs/config
```

```typescript
// app.module.ts
import { ConfigModule } from '@nestjs/config'
@Module({ imports: [ConfigModule.forRoot()] })
```

```bash
# .env
OPENAI_API_KEY=sk-your-key
```

## 流式输出 SSE

```typescript
import { Controller, Post, Body, Res } from '@nestjs/common'
import { Response } from 'express'

@Controller('chat')
export class ChatController {
  @Post('stream')
  async streamMessage(@Body('message') message: string, @Res() res: Response) {
    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')

    const stream = await this.chatService.streamReply(message)
    for await (const chunk of stream) {
      res.write(`data: ${JSON.stringify(chunk)}\n\n`)
    }
    res.end()
  }
}
```

## 数据库 Prisma

```bash
npm install @prisma/client prisma
npx prisma init
```

```prisma
model Message {
  id        Int      @id @default(autoincrement())
  content   String
  role      String
  createdAt DateTime @default(now())
}
```

```typescript
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class ChatService {
  constructor(private prisma: PrismaService) {}

  async saveMessage(content: string, role: string) {
    return this.prisma.message.create({ data: { content, role } })
  }

  async getHistory() {
    return this.prisma.message.findMany({ orderBy: { createdAt: 'asc' } })
  }
}
```

## CORS

```typescript
// main.ts
app.enableCors({
  origin: ['http://localhost:5173', 'https://your-frontend.com'],
})
```

## 部署 Docker

```dockerfile
FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["node", "dist/main.js"]
```
