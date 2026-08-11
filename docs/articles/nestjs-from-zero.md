---
title: NestJS 从零到实战：前端开发者的后端入门指南
description: 适合熟悉 JS/Vue/React 但没接触过 NestJS 的前端开发者。从安装、核心概念到数据库实战，一步步写出可调用的接口。
---

# NestJS 从零到实战：前端开发者的后端入门指南

> **适合人群**：熟悉 JavaScript / Vue / React，但从未接触过 NestJS 的前端开发者
> **目标**：从零安装，理解核心概念，独立写出可调用的接口，最后接入 PostgreSQL 数据库完成 CRUD

## 一、搭建环境与技术选型

后端接口用什么框架？**推荐 NestJS**。

也可以用 Next.js / Nuxt.js，但这两个框架强绑定前端框架语言（React/Vue）。而 NestJS 是纯 Node.js 后端框架，**不管你前端用 Vue 还是 React，后端都能用 NestJS**，生态成熟、模块化清晰。

### 1. 打开官方文档

先打开 [NestJS 官网](https://nestjs.com/)，内容很多，**不需要从头到尾学一遍**——按需索取，以最低成本换取最大的实战能力。英文不好可以看 [NestJS 中文社区](https://docs.nestjs.cn/introduction)。

### 2. 安装 CLI

在控制台执行：

```shell
npm i -g @nestjs/cli
```

安装完成后验证：

```shell
nest --version
# 11.0.24
```

### 3. 创建项目

```shell
# nest new 项目名
nest new my-nest-demo
```

选择包管理器（推荐 pnpm，npm 安装太慢）：

```shell
? Which package manager would you ❤️  to use?
❯ npm
  yarn
  pnpm
```

进入项目并用 VS Code 打开：

```bash
cd my-nest-demo/
code .
```

`code .` 是 VS Code 的命令。如果提示 `command not found`：
1. 打开 VS Code
2. 按 `Cmd+Shift+P` 打开命令面板
3. 搜索并执行 "Shell Command: Install 'code' command in PATH"
4. 重启终端即可

或者直接 File → Open Folder 选中 `my-nest-demo` 文件夹。

项目默认结构：

![项目结构](/images/nestjs/nest-project-structure.png)

里面有 controller（控制器）、module（模块），可以通过 HTTP 接口调用它，会调用 `getHello` 方法返回字符串，再调 service 层。

### 4. 运行项目

```bash
npm run start:dev
```

浏览器访问：

```bash
http://localhost:3000
```

![运行效果](/images/nestjs/nest-hello.png)

如果端口被占用，看 `src/main.ts`，把端口改一下即可。接口测试可以装 [Apifox](https://app.apifox.com/) 或 Postman。

::: tip 为什么 NestJS 适合做后端切入点？
Nest 在 Express/Fastify 等常见 Node.js 框架之上提供了一层抽象，也把底层 API 直接暴露给开发者。它包含了中间件、Redis、RabbitMQ、Kafka、gRPC、认证、数据持久层（Prisma）等完整的生态。**面向官方文档编程、面向 API 编程，坚持学下去，这是核心。**
:::

## 二、遇到问题怎么解决

先讲一个最重要的学习方法：**排查问题的心态**。

比如端口被占用报错——不要慌，看一下报错大概就能判断是端口占用。**端口占用改一下端口就行**，千万不要纠结"3000 为什么被占用"这种问题。

我们的主线是：**把项目跑起来，把 NestJS 学会**。其他问题都是支线。

如果看到报错看不懂，没关系，**复制报错丢给 AI**（比如 ChatGPT），AI 给的答案基本照着做就能解决。用最直接、最简单的方式，实在不行就重启电脑。

::: warning 核心学习观
不要被外界的干扰影响你的主线任务，这才是真正的学习方法。
:::

## 三、项目核心文件解析

NestJS 项目由几个核心文件组成，理解它们的关系就抓住了骨架：

```mermaid
flowchart LR
    main[main.ts<br/>入口文件] --> module[app.module.ts<br/>根模块]
    module --> controller[app.controller.ts<br/>控制器]
    controller --> service[app.service.ts<br/>服务]
    service --> data[(数据库)]
```

### 1. main.ts —— 应用入口

```typescript
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule); // 创建应用，传入根模块（类似 Vue 的 createApp）
  await app.listen(process.env.PORT ?? 3000); // 启动服务，设置端口
}
bootstrap();
```

类似 Vue 根模块的挂载方式：

```typescript
import router from './router'
app.use(router)
```

### 2. app.module.ts —— 根模块

注册所有模块的地方：

```typescript
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [], // 导入子模块
  controllers: [AppController], // 注册控制器
  providers: [AppService], // 注册服务
})
export class AppModule {}
```

### 3. app.controller.ts —— 控制器

处理路由和请求方法：

```typescript
import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller() // 可以加别名，比如 'user'，请求地址就变成 /user
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  // 新加的方法
  @Get("/test")
  getTest(): string {
    return this.appService.getTest();
  }
}
```

![新接口返回](/images/nestjs/nest-test-api.png)

### 4. app.service.ts —— 服务（业务逻辑）

```typescript
import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!';
  }

  getTest(): string {
    return 'test';
  }
}
```

service 里面写业务逻辑。**业务要分层**，像 Vue 一样，结构更清晰。

## 四、拆分业务模块：企业级最佳实践

页面要调后端接口，用 NestJS 怎么实现？正常在 `src` 目录下建一个模块文件夹。以用户模块为例：

```
src/
└── user/
    ├── user.controller.ts
    ├── user.service.ts
    └── user.module.ts
```

### 方式一：直接注册 controller 和 service

**user.controller.ts**：

```typescript
import { Controller, Get } from '@nestjs/common';
import { UserService } from './user.service';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('getUser')
  getUser(): string {
    return this.userService.getUser();
  }
}
```

**user.service.ts**：

```typescript
import { Injectable } from '@nestjs/common';

@Injectable()
export class UserService {
  getUser(): string {
    return 'Hello User!';
  }
}
```

然后在 `app.module.ts` 里注册（**别忘记了**）：

```typescript
@Module({
  imports: [],
  controllers: [AppController, UserController],
  providers: [AppService, UserService],
})
export class AppModule {}
```

![用户模块运行](/images/nestjs/nest-user-module.png)

### 方式二：用 UserModule 封装（推荐）

**user.module.ts**：

```typescript
import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';

@Module({
  imports: [],
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule {}
```

在 `app.module.ts` 注册：

```typescript
@Module({
  imports: [UserModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

这样更清爽，**推荐方式二**。

### 用命令快速创建模块

```shell
nest g module order      # 创建模块
nest g controller order  # 创建控制器
nest g service order     # 创建服务
```

命令会自动把新模块注册到 `app.module.ts`，非常省事。创建完就可以写业务代码了。

## 五、POST 请求：新增数据

### 1. 实体类

```typescript
export class User {
  id: number; // 用户 ID
  name: string; // 用户名
  age: number; // 年龄
  email?: string; // 可传可不传（? 表示可选）
}
```

### 2. Controller 新增方法

```typescript
@Post('add')
createUser(@Body() user: User) {
  return this.userService.createUser(user);
}
```

### 3. Service 新增方法

```typescript
createUser(user: User) {
  // 这里是模拟，实际会调数据库
  return {
    success: true,
    message: '创建成功',
    data: user,
  };
}
```

![POST 请求效果](/images/nestjs/nest-post-add.png)

::: tip 为什么业务逻辑放 Service，不放 Controller？
因为 service 可以被多个 Controller 调用，而且 service 里还可以调用其他 service。保持 Controller 整洁，一眼就能看出系统有哪些接口；service 专注处理业务逻辑。这是分层架构的核心思想。
:::

## 六、接口参数传递

真实业务中接口常见两种带参方式：

- 查询字符串：`/user/getUser?xx=1&xx=2`
- 路径参数：`/user/getUser/1`

### 方式一：路径参数 `/1`

**Controller**：

```typescript
@Get('user/:id')
getUserById(@Param('id') id: string) {
  return this.userService.getUserById(id);
}
```

**Service**：

```typescript
getUserById(id: string) {
  return {
    success: true,
    message: '获取成功',
    data: { id: Number(id), name: '李四', age: 18 },
  };
}
```

![路径参数效果](/images/nestjs/nest-param-id.png)

### 方式二：查询参数 `?page=1&size=10`

**Controller**：

```typescript
@Get('list')
getList(@Query('page') page: string, @Query('size') size: string) {
  return this.userService.getList(page, size);
}
```

**Service**：

```typescript
getList(page: string, size: string) {
  return {
    success: true,
    message: '获取成功',
    data: {
      page: Number(page),
      size: Number(size),
      list: [{ id: 1, name: '张三', age: 18 }, { id: 2, name: '李四', age: 18 }],
    },
  };
}
```

![查询参数效果](/images/nestjs/nest-query-params.png)

## 七、PUT 和 DELETE 接口

PUT 一般用于更新数据。企业级项目基本以 GET/POST 为主（省事），但得会。

**Controller**：

```typescript
// 路径参数 + 请求体参数
@Put('user/:id')
updateUser(@Param('id') id: string, @Body() user: User) {
  return this.userService.updateUser(id, user);
}
```

**Service**：

```typescript
updateUser(id: string, user: User) {
  return {
    success: true,
    message: '更新成功',
    data: user,
  };
}
```

DELETE 的写法类似，把 `@Put` 换成 `@Delete` 即可。

## 八、数据库选型：为什么是 PostgreSQL？

我们选 PostgreSQL 而不是 MySQL / MongoDB，核心原因是一个扩展：**pgvector**。

PostgreSQL 官方维护的向量扩展 `pgvector`，安装后 PostgreSQL 直接就能存储和检索向量数据，**不需要额外部署独立的向量数据库**（Chroma、Milvus 等）。而 MySQL 没有任何成熟的向量扩展。

### 具体差距

装上 `pgvector` 后，可以直接建带向量列的表：

```sql
CREATE TABLE documents (
  id      SERIAL PRIMARY KEY,
  content TEXT,
  embedding vector(1024)   -- 直接存 1024 维向量，MySQL 做不到
);
```

直接用 SQL 做余弦相似度检索：

```sql
SELECT content, 1 - (embedding <=> '[0.1, 0.2, ...]') AS score
FROM documents
ORDER BY embedding <=> '[0.1, 0.2, ...]'
LIMIT 5;
```

这意味着**关系型数据和向量数据可以放在同一张表，用一条 SQL 同时完成业务查询和语义检索**：

```sql
SELECT content
FROM documents
WHERE user_id = 1           -- 普通过滤条件
ORDER BY embedding <=> $1   -- 向量相似度排序
LIMIT 5;
```

MySQL 做这件事需要先用向量库检索，再回 MySQL 过滤，两次 I/O，架构复杂度翻倍。

### 其他客观局限

MySQL 的 JSON 支持、窗口函数、CTE（WITH 语句）、全文检索都比 PostgreSQL 弱，而 RAG 场景里这些特性经常用到。PostgreSQL 的 JSONB 类型还支持对 JSON 字段建索引。

::: tip 一句话结论
选 PostgreSQL 不是因为"更好用"，是因为 `pgvector` 让它同时具备**关系型 + 向量**两种能力，RAG 系统的整个存储层用一个数据库就能搞定，少一个中间件就少一层维护成本。
:::

## 九、安装 PostgreSQL

### 技术选型

| 角色 | 技术 | 作用 |
| --- | --- | --- |
| Web 框架 | NestJS | 路由、依赖注入、模块化 |
| 数据持久层（ORM） | Prisma | TypeScript 类型映射数据库表，自动生成 SQL |
| 数据库 | PostgreSQL 18 | 关系型数据库，存储真实数据 |

三者调用关系：

```mermaid
flowchart LR
    A[NestJS<br/>写接口逻辑] --> B[Prisma Client<br/>自动生成并执行 SQL] --> C[PostgreSQL 18<br/>存储数据]
```

### 为什么用 Prisma？

- TypeScript 全类型提示，字段名写错直接报红
- 不需要手写 SQL，`prisma.user.findMany()` 自动生成查询
- Schema 文件统一管理表结构，改表一目了然
- 内置迁移工具，团队协作表结构同步方便

### macOS 用 Homebrew 安装（可选）

```bash
# 安装 PostgreSQL 18
brew install postgresql@18

# Apple Silicon Mac 加入 PATH
echo 'export PATH="/opt/homebrew/opt/postgresql@18/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc

# 启动服务
brew services start postgresql@18

# 验证
psql --version
```

### 使用安装包安装

![选择安装程序](/images/nestjs/pg-install-select.png)

![选择版本](/images/nestjs/pg-install-version.png)

macOS 下载完后双击安装，一路下一步：

![安装步骤](/images/nestjs/pg-step1.png)

![安装步骤](/images/nestjs/pg-step2.png)

![数据目录](/images/nestjs/pg-step3.png)

![安装组件](/images/nestjs/pg-step4.png)

**设置密码（一定要记住）**：

![设置密码](/images/nestjs/pg-password.png)

**端口默认 5432**：

![端口](/images/nestjs/pg-port.png)

继续下一步直到完成：

![下一步](/images/nestjs/pg-next1.png)

![下一步](/images/nestjs/pg-next2.png)

![下一步](/images/nestjs/pg-next3.png)

![下一步](/images/nestjs/pg-next4.png)

![安装完成](/images/nestjs/pg-done.png)

### 验证安装

```bash
# 有这个路径说明安装成功
ls /Library/PostgreSQL/18/bin

# 打印版本号说明成功
/Library/PostgreSQL/18/bin/psql --version
psql (PostgreSQL) 18.4
```

### macOS 配置环境变量

```bash
echo 'export PATH="/Library/PostgreSQL/18/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

推荐安装 GUI 工具：Navicat、TablePlus 等。

## 十、连接数据库

在控制台连接：

```bash
psql postgres

# 输出
psql (18.4)
postgres=#
```

退出数据库：macOS 按 `Control + D`。

用 Navicat 连接：

```
连接名称：自定义
主机：localhost
端口：5432
初始数据库：postgres
用户名：postgres
密码：刚才设置的密码
```

## 十一、Prisma 入门

Prisma 是一个运行在 Node.js 里的 **ORM 框架**（Object-Relational Mapping，对象关系映射）。简单说：**用写 TypeScript 代码的方式操作数据库，不需要手写 SQL**。

### 不用 Prisma 时

```typescript
// 原始 SQL 写法
const users = await db.query('SELECT id, name, email FROM users WHERE role = $1', ['admin'])
```

问题：SQL 是字符串，写错了运行时才报错；字段名拼错没提示；换数据库要改代码。

### 用 Prisma 之后

```typescript
// Prisma 写法
const users = await prisma.user.findMany({
  where: { role: 'admin' },
  select: { id: true, name: true, email: true }
})
```

区别：`prisma.user` 有完整类型提示；字段拼错立即报红；换数据库只改连接字符串。

### Prisma 的三个核心部分

| 工具 | 文件 / 命令 | 作用 |
| --- | --- | --- |
| Prisma Schema | `prisma/schema.prisma` | 定义数据模型（相当于画表结构图） |
| Prisma Migrate | `npx prisma migrate dev` | 把 Schema 同步到数据库（自动建表） |
| Prisma Client | `src/generated/prisma/` | 自动生成的查询 API，有完整类型提示 |

### 常见 ORM 对比

| ORM | 特点 |
| --- | --- |
| Prisma | TypeScript 优先，类型最完善，上手最快 |
| TypeORM | 老牌框架，装饰器定义模型，NestJS 官方文档有介绍 |
| Sequelize | 历史最久，TypeScript 支持一般 |
| Drizzle | 新兴框架，性能好，生态还不成熟 |

新项目首选 Prisma。

## 十二、安装和配置 Prisma 7

### 1. 安装依赖

```bash
# Prisma CLI（开发依赖）
pnpm install prisma@latest --save-dev

# Prisma Client（运行时）
pnpm install @prisma/client@latest

# Prisma 7 必须安装的 PostgreSQL Driver Adapter（核心变化！）
pnpm install @prisma/adapter-pg pg

# pg 的 TypeScript 类型定义
pnpm install @types/pg --save-dev
```

::: warning Prisma 7 重要变化
不再内置数据库驱动，连接 PostgreSQL 必须安装 `@prisma/adapter-pg` 和 `pg`。连 MySQL 装 `@prisma/adapter-mariadb`，连 SQLite 装 `@prisma/adapter-better-sqlite3`。
:::

### 2. 初始化

```bash
# Prisma 7 初始化时必须指定 output 路径
npx prisma init --output ../src/generated/prisma
```

生成的文件：

```
my-nest-demo/
├── prisma/
│   └── schema.prisma         ← 数据模型定义文件
├── prisma.config.ts          ← Prisma 7 新增的配置文件
└── .env                      ← 环境变量（存放数据库密码）
```

VS Code 记得装 Prisma 插件，会有语法高亮。

### 3. 配置 prisma.config.ts

```typescript
// Prisma 7 的核心配置文件
// 数据库连接 URL 在这里配置，不再写在 schema.prisma 里
import 'dotenv/config'
import { defineConfig } from 'prisma/config'

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: process.env.DATABASE_URL as string,
  },
})
```

### 4. 配置 .env

```
# 格式：postgresql://用户名:密码@主机:端口/数据库名?schema=public
DATABASE_URL="postgresql://postgres:你的密码@localhost:5432/nest_demo?schema=public"
```

### 5. 配置 schema.prisma

```prisma
// Prisma 7 核心变化：
// 1. provider 改为 "prisma-client"
// 2. output 必须指定
// 3. moduleFormat = "cjs" 是 NestJS 必须加的（否则报错：Cannot use import statement in a module）
generator client {
  provider     = "prisma-client"
  output       = "../src/generated/prisma"
  moduleFormat = "cjs"
}

// Prisma 7 变化：url 移到 prisma.config.ts，这里只保留 provider
datasource db {
  provider = "postgresql"
}

// User 模型 → 对应数据库 users 表
model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  name      String
  password  String
  role      String   @default("user")
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  posts     Post[]

  @@map("users")
}

// Post 模型 → 对应数据库 posts 表
model Post {
  id        Int      @id @default(autoincrement())
  title     String
  content   String   @db.Text
  published Boolean  @default(false)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  authorId  Int
  author    User     @relation(fields: [authorId], references: [id], onDelete: Cascade)

  @@map("posts")
}
```

### 6. 生成数据表

```bash
npx prisma migrate dev
# 迁移名称直接回车即可
```

返回结果：

```
Applying migration `20260802064532`
Your database is now in sync with your schema.
```

会生成 SQL 语句并自动建好表，Navicat 里也能看到。

::: tip 学习建议
Prisma 工作流程：你的代码调用 `this.prisma.user.findMany(...)` → Prisma 7（纯 JS 实现）→ 通过 Driver Adapter → 连接数据库。核心是用会常用 API，高级功能现用现查。**会用就行，不纠结精通。**
:::

## 十三、Prisma 结合 NestJS：创建 Prisma 模块

### 1. 创建模块和服务

```bash
nest g module prisma
nest g service prisma
```

### 2. prisma.service.ts

```typescript
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common'

// Prisma 7 从生成的路径导入，而不是 '@prisma/client'
import { PrismaClient } from '../generated/prisma/client'

// Prisma 7 必须引入 Driver Adapter
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

@Injectable()
export class PrismaService extends PrismaClient
  implements OnModuleInit, OnModuleDestroy {

  constructor() {
    // 第一步：创建 pg 连接池
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    })

    // 第二步：把 pool 包装成 Prisma 认识的 adapter
    const adapter = new PrismaPg(pool)

    // 第三步：把 adapter 传给父类 PrismaClient
    super({ adapter })
  }

  // 模块初始化时建立数据库连接
  async onModuleInit() {
    await this.$connect()
    console.log('✅ PostgreSQL 数据库连接成功（Prisma 7）')
  }

  // 程序退出时断开连接，防止资源泄漏
  async onModuleDestroy() {
    await this.$disconnect()
  }
}
```

如果 `../generated/prisma/client` 不存在，先执行：

```bash
npx prisma generate
```

### 3. prisma.module.ts

```typescript
import { Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Module({
  providers: [PrismaService],
  exports: [PrismaService], // 导出，方便其他模块注入
})
export class PrismaModule {}
```

在 `app.module.ts` 引入 `PrismaModule`。启动服务 `npm run start:dev`，看到 `✅ PostgreSQL 数据库连接成功` 就说明连上了。

## 十四、创建文章模块（Post CRUD）

### 1. 命令创建

```bash
nest g module post
nest g controller post
nest g service post
```

### 2. 创建 DTO

DTO（Data Transfer Object）可以理解为"传输对象"，定义接口接收的数据结构。建 `post/dto/create-post-dto.ts`：

```typescript
export class CreatePostDto {
  title: string
  content: string
  published?: boolean
  authorId: number
}
```

### 3. Controller

```typescript
import { Body, Controller, Post } from '@nestjs/common';
import { CreatePostDto } from './dto/create-post-dto';
import { PostService } from './post.service';

@Controller('post')
export class PostController {
  constructor(private readonly postService: PostService) {}

  @Post('create')
  async create(@Body() createPostDto: CreatePostDto) {
    return this.postService.create(createPostDto);
  }
}
```

### 4. Service

```typescript
import { Injectable } from '@nestjs/common';
import { CreatePostDto } from './dto/create-post-dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class PostService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createPostDto: CreatePostDto) {
    const post = await this.prisma.post.create({
      data: {
        title: createPostDto.title,
        content: createPostDto.content,
        published: createPostDto.published ?? false,
        authorId: createPostDto.authorId,
      },
    })
    return { success: true, message: 'Post created successfully', data: post }
  }
}
```

![文章创建成功](/images/nestjs/prisma-post-create.png)

## 十五、用户模块 + 数据库存储

### 1. 创建 DTO

`user/dto/create-user-dto.ts`：

```typescript
export class CreateUserDto {
  name: string
  email: string
  password: string
  role?: string
}
```

### 2. Controller

```typescript
@Post('add')
createUser(@Body() user: CreateUserDto) {
  return this.userService.addUser(user);
}
```

### 3. Service

```typescript
async addUser(createUserDto: CreateUserDto) {
  const user = await this.prismaService.user.create({
    data: {
      name: createUserDto.name,
      email: createUserDto.email,
      password: createUserDto.password,
      role: createUserDto.role || 'user',
    },
  });
  return { success: true, message: '创建成功', data: user };
}
```

### 4. Module（记得引入 PrismaModule）

```typescript
import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule {}
```

![用户创建成功](/images/nestjs/prisma-user-create.png)

## 十六、查询和删除用户

### 1. 查询所有用户

**Controller**：

```typescript
@Get('list')
findAll() {
  return this.userService.findAll();
}
```

**Service**：

```typescript
async findAll() {
  const users = await this.prismaService.user.findMany({
    select: { // 指定需要返回的字段
      id: true, name: true, email: true, role: true,
      createdAt: true, updatedAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });
  return {
    success: true,
    message: '获取成功',
    data: { list: users, total: users.length },
  };
}
```

![用户列表](/images/nestjs/prisma-user-list.png)

### 2. 根据 ID 查询（含关联查询）

**Controller**：

```typescript
@Get('/:id')
findOne(@Param('id') id: string) {
  return this.userService.findOne(id);
}
```

**Service**：

```typescript
async findOne(id: string) {
  const user = await this.prismaService.user.findUnique({
    where: { id: parseInt(id) },
    select: {
      id: true, name: true, email: true, role: true,
      createdAt: true, updatedAt: true,
      posts: { // 关联查询-获取用户的所有帖子
        select: { id: true, title: true, content: true, createdAt: true, updatedAt: true },
        orderBy: { createdAt: 'desc' },
      },
    },
  });
  if (!user) {
    return { success: false, message: '用户不存在' };
  }
  return { success: true, message: '获取成功', data: user };
}
```

![根据 ID 查询](/images/nestjs/prisma-user-findone.png)

### 3. 删除用户

**Controller**：

```typescript
@Delete('/:id')
removeUser(@Param('id') id: string) {
  return this.userService.removeUser(id);
}
```

**Service**：

```typescript
removeUser(id: string) {
  return this.prismaService.user.delete({
    where: { id: parseInt(id) },
  }).then(() => {
    return { success: true, message: '删除成功' };
  }).catch(() => {
    return { success: false, message: '删除失败' };
  });
}
```

![删除用户](/images/nestjs/prisma-user-delete.png)

因为 Schema 里配置了 `onDelete: Cascade`（级联删除），删除用户时对应的文章也一起删除了。如果不想级联删除，改一下 `schema.prisma` 里的 `onDelete` 配置即可。

## 十七、更新用户

创建 `update-user-dto.ts`：

```typescript
export class UpdateUserDto {
  name?: string
  email?: string
  password?: string
  role?: string
}
```

**Controller**：

```typescript
@Put('/:id')
updateUser(@Param('id') id: string, @Body() user: UpdateUserDto) {
  return this.userService.updateUser(id, user);
}
```

**Service**：

```typescript
updateUser(id: string, user: UpdateUserDto) {
  return this.prismaService.user.update({
    where: { id: parseInt(id) },
    data: {
      name: user.name,
      email: user.email,
      password: user.password,
      role: user.role || 'user',
    },
  }).then((updatedUser) => {
    return { success: true, message: '更新成功', data: updatedUser };
  }).catch(() => {
    return { success: false, message: '更新失败' };
  });
}
```

![更新用户](/images/nestjs/prisma-user-update.png)

## 十八、分页查询（企业级完整版）

真实业务中查询往往带搜索条件 + 分页：

```
GET /user/list?page=1&pageSize=10        # 分页
GET /user/list?name=名字                  # 按名字模糊搜索
GET /user/list?role=admin                # 只查管理员
GET /user/list?page=1&pageSize=10&name=名字&role=admin  # 组合查询
```

### 1. 创建查询 DTO

```typescript
export class QueryUserDto {
  page?: string
  pageSize?: string
  name?: string
  role?: string
}
```

### 2. Controller

```typescript
@Get('search')
searchUsers(@Query() query: QueryUserDto) {
  return this.userService.searchUsers(query);
}
```

### 3. Service（基础版）

```typescript
searchUsers(query: QueryUserDto) {
  const { name, role, page = '1', pageSize = '10' } = query;
  // skip: 跳过多少条记录
  // 第一页：(1-1)*10=0，第二页：(2-1)*10=10
  const skip = (parseInt(page) - 1) * parseInt(pageSize);
  const take = parseInt(pageSize);
  return this.prismaService.user.findMany({
    where: {
      name: name ? { contains: name } : undefined,
      role: role || undefined,
    },
    skip,
    take,
    orderBy: { createdAt: 'desc' },
  }).then((users) => {
    return { success: true, message: '获取成功', data: { list: users, total: users.length } };
  });
}
```

![分页查询](/images/nestjs/prisma-user-search.png)

### 4. Service（企业级完整版）

基础版有两个缺点：
1. 没有返回分页信息（当前页、总页数、是否有下一页）
2. 把密码也返回了，要过滤

完整版用 `$transaction` 把**计数**和**查询**放在同一个事务里，防止并发时数据不一致：

```typescript
async searchUsers(query: QueryUserDto) {
  const { name, role, page = '1', pageSize = '10' } = query;
  const skip = (parseInt(page) - 1) * parseInt(pageSize);
  const take = parseInt(pageSize);

  const where: any = {};
  if (name) {
    where.name = { contains: name, mode: 'insensitive' }; // 不区分大小写
  }
  if (role) {
    where.role = role;
  }

  // 事务内并发执行：统计总数 + 查询列表
  const [total, users] = await this.prismaService.$transaction([
    this.prismaService.user.count({ where }),
    this.prismaService.user.findMany({
      where,
      skip,
      take,
      select: {
        id: true, name: true, email: true, role: true,
        createdAt: true, updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  const totalPages = Math.ceil(total / take);
  return {
    success: true,
    message: '获取成功',
    data: {
      pagination: {
        total, // 总记录数
        totalPages, // 总页数
        currentPage: parseInt(page), // 当前页
        pageSize: parseInt(pageSize), // 每页条数
        hasNextPage: parseInt(page) < totalPages, // 是否有下一页
        hasPreviousPage: parseInt(page) > 1, // 是否有上一页
      },
      list: users,
    },
  };
}
```

![分页查询完整版](/images/nestjs/prisma-user-search-page.png)

::: tip 为什么用事务（$transaction）？
这里会执行 2 个查询。如果别的用户在你查询时添加了一条数据，可能导致"总记录数是 10 条，但查出来 11 条"的不一致。把两个查询放进同一个事务，保证数据一致。
:::

## 十九、写在最后

- 核心重点不在 NestJS 本身，**会用就好**
- 重点是掌握大模型应用开发的完整链路：接口 → 大模型调用 → RAG 检索增强 → 数据存储 → 上线部署
- Vue/React 常用的接口就那么几个 API，**能干活、知道用什么技术**就行，遇到问题问 AI
- 无论用 Vue 还是 React，后端都可以用 NestJS

**学习思路最重要：能够坚持学下去。** 看懂视频和亲手实操一遍完全是两回事——实操会碰到各种各样的问题，问题都有解。在 AI 时代，要有**全流程的软件开发思维**，不要只聚焦业务功能，**项目的部署和上线才是最核心的能力**。

无论前后端，只要动手跑起来，你就是那个能干活的人。
