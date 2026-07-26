# Node.js (NestJS) 后端开发教程

## 什么是 NestJS？

NestJS 是一个基于 Node.js 的后端框架，使用 TypeScript，借鉴了 Angular 的模块化思想。它帮你把代码组织得清晰、可维护。

**核心概念**：
- **Module**（模块）：功能单元，一个模块管一组相关功能
- **Controller**（控制器）：处理 HTTP 请求，定义路由
- **Service**（服务）：写业务逻辑的地方
- **DTO**（数据传输对象）：定义请求和响应的数据格式

---

## 环境搭建

```bash
# 安装 NestJS CLI
npm install -g @nestjs/cli

# 创建项目
nest new my-nest-app
cd my-nest-app

# 启动
npm run start:dev
```

浏览器打开 http://localhost:3000，看到 `Hello World!` 即成功。

---

## 项目结构

```
my-nest-app/
├── src/
│   ├── main.ts          # 入口文件
│   ├── app.module.ts    # 根模块
│   ├── app.controller.ts
│   ├── app.service.ts
│   └── app.controller.spec.ts
├── test/
├── package.json
└── tsconfig.json
```

---

## 核心概念详解

### Module

模块是 NestJS 的组织单位。一个应用由多个模块组成。

```typescript
// app.module.ts
import { Module } from '@nestjs/common'
import { ChatModule } from './chat/chat.module'

@Module({
  imports: [ChatModule],  // 引入其他模块
  controllers: [],         // 当前模块的控制器
  providers: [],           // 当前模块的服务
})
export class AppModule {}
```

### Controller

控制器负责处理请求和返回响应。

```typescript
// chat/chat.controller.ts
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

### Service

服务里写具体的业务逻辑。

```typescript
// chat/chat.service.ts
import { Injectable } from '@nestjs/common'

@Injectable()
export class ChatService {
  async getReply(message: string) {
    // 调用 AI 模型
    const reply = `你说了：${message}`
    return { reply }
  }
}
```

### DTO

定义请求的格式，配合验证。

```bash
npm install class-validator class-transformer
```

```typescript
// chat/dto/chat.dto.ts
import { IsString, IsNotEmpty } from 'class-validator'

export class SendMessageDto {
  @IsString()
  @IsNotEmpty()
  message: string
}
```

```typescript
// chat.controller.ts
import { SendMessageDto } from './dto/chat.dto'

@Post()
async sendMessage(@Body() dto: SendMessageDto) {
  return this.chatService.getReply(dto.message)
}
```

在 `main.ts` 启用全局验证管道：

```typescript
import { ValidationPipe } from '@nestjs/common'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  app.useGlobalPipes(new ValidationPipe())
  await app.listen(3000)
}
```

---

## 集成 AI API

### OpenAI 接入

```typescript
// chat/chat.service.ts
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

@Module({
  imports: [ConfigModule.forRoot()],
})
```

```bash
# .env
OPENAI_API_KEY=sk-your-key
```

---

## 流式输出 (SSE)

AI 回答通常需要流式输出，实现打字机效果。

```typescript
// chat/chat.controller.ts
import { Controller, Post, Body, Res } from '@nestjs/common'
import { Response } from 'express'
import { ChatService } from './chat.service'

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

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

```typescript
// chat/chat.service.ts
async streamReply(message: string) {
  return this.openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: message }],
    stream: true,
  })
}
```

---

## 连接数据库

### 使用 Prisma

```bash
npm install @prisma/client prisma
npx prisma init
```

```prisma
// prisma/schema.prisma
model Message {
  id        Int      @id @default(autoincrement())
  content   String
  role      String   // user / assistant
  createdAt DateTime @default(now())
}
```

```bash
npx prisma migrate dev --name init
```

```typescript
// chat/chat.service.ts
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class ChatService {
  constructor(private prisma: PrismaService) {}

  async saveMessage(content: string, role: string) {
    return this.prisma.message.create({
      data: { content, role },
    })
  }

  async getHistory() {
    return this.prisma.message.findMany({
      orderBy: { createdAt: 'asc' },
    })
  }
}
```

---

## 认证 (JWT)

```bash
npm install @nestjs/jwt @nestjs/passport passport passport-jwt
```

```typescript
// auth/auth.module.ts
import { Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '7d' },
    }),
  ],
})
export class AuthModule {}
```

---

## 部署

### Docker

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

```yaml
# docker-compose.yml
services:
  app:
    build: .
    ports:
      - "3000:3000"
    env_file: .env
```

---

## 与前端配合

### 启用 CORS

```typescript
// main.ts
const app = await NestFactory.create(AppModule)
app.enableCors({
  origin: ['http://localhost:5173', 'https://your-frontend.com'],
})
```

---

## 下一步

- [NestJS 官方文档](https://docs.nestjs.com/)
- [Prisma 文档](https://www.prisma.io/docs)
- [OpenAI Node.js SDK](https://github.com/openai/openai-node)
