# NestJS 零基础入门实操文档

**适合人群：熟悉 JavaScript / Vue / React，但从未接触过 NestJS 的前端开发者**

**目标：从零安装，理解核心概念，独立写出可调用的接口**

---

## 目录
1. NestJS 是什么
2. 环境准备
3. 安装并创建项目
4. 项目目录结构详解
5. 核心概念：模块 / 控制器 / 服务
6. 写第一个接口：GET 请求
7. 写第二个接口：POST 请求 + 接收参数
8. 服务层：把逻辑抽到 Service
9. 路径参数和查询参数
10. 用 Apifox 调试所有接口
11. 生成新模块的完整流程
12. 常见报错处理

---

## 一、NestJS 是什么
NestJS 是一个基于 Node.js 的后端框架，专门用来写 **HTTP 接口服务**。

用前端熟悉的概念来类比：

| 前端（Vue3）(React) | NestJS 后端 |
| --- | --- |
| 组件 `.vue` | 模块 `module` |
| `<template>`<br/> 处理视图 | Controller 处理路由 |
| `<script setup>`<br/> 写逻辑 | Service 写业务逻辑 |
| `defineProps`<br/> 接收参数 | `@Body()`<br/>`@Param()`<br/> 接收参数 |
| `router.get('/path')` | `@Get('path')` |


NestJS 的核心架构是三层：

```markdown
HTTP 请求
    ↓
Controller（控制器）→ 接收请求，分发给 Service
    ↓
Service（服务）→ 处理业务逻辑，返回数据
    ↓
HTTP 响应
```

---

## 二、环境准备
### 检查 Node.js 版本
```bash
node -v
# 需要 >= 20.x，推荐 v22.21.1

npm -v
# 需要 >= 9.x
```

如果版本不够，去 https://nodejs.org 下载 LTS 版本重新安装。

---

## 三、安装并创建项目
### 1. 全局安装 NestJS CLI
```bash
npm i -g @nestjs/cli
```

验证安装成功：

```bash
nest --version
# 输出版本号说明安装成功，例如：10.x.x
```

### 2. 创建新项目
```bash
# nest new 项目名
nest new my-nest-demo

# 进入项目目录
cd my-nest-demo
```

创建时会询问使用哪个包管理器，选 **npm** 回车即可：

```plain
? Which package manager would you ❤️  to use?
  npm        ← 选这个，回车
  yarn
  pnpm
```

等待依赖安装完成（约 1~2 分钟）。

### 3. 启动项目
```bash
npm run start:dev
```

看到以下输出说明启动成功：

```plain
[NestJS] LOG [NestApplication] Nest application successfully started
[NestJS] LOG Application is listening on port 3000
```

### 4. 验证服务正常
打开浏览器访问：http://localhost:3000

看到 `Hello World!` 说明一切正常。

---

## 四、项目目录结构详解
```markdown
my-nest-demo/
├── src/
│   ├── app.controller.ts    ← 控制器：处理路由，接收请求
│   ├── app.controller.spec.ts  ← 测试文件（可以忽略）
│   ├── app.module.ts        ← 根模块：注册所有模块
│   ├── app.service.ts       ← 服务：写业务逻辑
│   └── main.ts              ← 入口文件：启动服务
├── test/                    ← 测试目录（可以忽略）
├── nest-cli.json            ← NestJS CLI 配置
├── package.json
└── tsconfig.json
```

### main.ts — 入口文件
```javascript
import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'

async function bootstrap() {
  // 创建 NestJS 应用，传入根模块
  const app = await NestFactory.create(AppModule)
  // 监听 3000 端口
  await app.listen(3000)
}
bootstrap()
```

这个文件一般不需要改，只改端口号时才动它。

### app.module.ts — 根模块
```javascript
import { Module } from '@nestjs/common'
import { AppController } from './app.controller'
import { AppService } from './app.service'

@Module({
  imports: [],                    // 注册子模块
  controllers: [AppController],   // 注册控制器
  providers: [AppService],        // 注册服务
})
  export class AppModule {}
```

每新增一个功能模块，都要在 `imports` 里注册。

### app.controller.ts — 控制器
```javascript
import { Controller, Get } from '@nestjs/common'
import { AppService } from './app.service'

@Controller()  // 路由前缀为空，直接是 /
  export class AppController {
    constructor(private readonly appService: AppService) {}

    @Get()  // 处理 GET / 请求
    getHello(): string {
      return this.appService.getHello()
    }
  }
```

### app.service.ts — 服务
```javascript
import { Injectable } from '@nestjs/common'

@Injectable()
  export class AppService {
    getHello(): string {
      return 'Hello World!'
    }
  }
```

---

## 五、核心概念：模块 / 控制器 / 服务
### 5.1 模块（Module）
模块是功能的"容器"，把同一个功能的 Controller 和 Service 打包在一起。

比如做一个用户功能，就建一个 `UserModule`，里面放 `UserController` 和 `UserService`。

```markdown
AppModule（根模块）
├── UserModule（用户模块）
│   ├── UserController → /user/* 路由
│   └── UserService    → 用户相关业务逻辑
└── ArticleModule（文章模块）
    ├── ArticleController → /article/* 路由
    └── ArticleService    → 文章相关业务逻辑
```

### 5.2 控制器（Controller）
控制器负责**接收请求、返回响应**，不写具体逻辑。

```javascript
@Controller('user')      // 路由前缀：/user
  export class UserController {

    @Get('list')           // GET /user/list
    getList() { ... }

    @Post('create')        // POST /user/create
    create() { ... }

    @Delete(':id')         // DELETE /user/123
    delete() { ... }
  }
```

### 5.3 服务（Service）
服务负责**具体的业务逻辑**，比如查数据库、调用第三方 API、数据处理等。

```javascript
@Injectable()
  export class UserService {
    // 真正干活的代码写在这里
    getList() {
      return [{ id: 1, name: '大伟' }, { id: 2, name: '小明' }]
    }
  }
```

### 5.4 三者关系
```markdown
HTTP 请求 → Controller（我来接收）→ Service（我来处理）→ Controller（我来返回）→ HTTP 响应
```

Controller 调用 Service 的方式：

```javascript
// Controller 里
constructor(private readonly userService: UserService) {}

@Get('list')
  getList() {
    // 调用 service 的方法，直接 return 结果
    return this.userService.getList()
  }
```

`this.userService` 是 NestJS 自动注入的，不需要手动 `new UserService()`。

---

## 六、写第一个接口：GET 请求
我们来写一个 `/demo/hello` 接口，返回一句问候语。

### 第一步：生成模块文件
```bash
# 在项目根目录执行
nest g module demo      # 生成 demo.module.ts
nest g controller demo  # 生成 demo.controller.ts
nest g service demo     # 生成 demo.service.ts
```

执行后，`src/` 目录下会新增 `demo/` 文件夹：

```markdown
src/
├── demo/
│   ├── demo.controller.ts
│   ├── demo.controller.spec.ts
│   ├── demo.module.ts
│   └── demo.service.ts
```

同时，`app.module.ts` 会自动更新，把 `DemoModule` 注册进去：

```javascript
// app.module.ts 自动变成这样：
@Module({
  imports: [DemoModule],   // ← 自动添加了
  ...
    })
```

### 第二步：写 Controller
打开 `src/demo/demo.controller.ts`，改成下面这样：

```javascript
// src/demo/demo.controller.ts

import { Controller, Get } from '@nestjs/common'
import { DemoService } from './demo.service'

// @Controller('demo') 设置路由前缀
// 这个控制器里所有接口的路径都以 /demo 开头
@Controller('demo')
  export class DemoController {
    // 通过构造函数注入 DemoService
    // NestJS 自动创建 DemoService 实例并传进来
    constructor(private readonly demoService: DemoService) {}

    // @Get('hello') 表示这个方法处理 GET /demo/hello 请求
    @Get('hello')
    getHello() {
      // 调用 service 的方法，把结果直接返回
      // NestJS 会自动把返回值转成 JSON 响应
      return this.demoService.getHello()
    }
  }
```

### 第三步：写 Service
打开 `src/demo/demo.service.ts`，改成下面这样：

```javascript
// src/demo/demo.service.ts

import { Injectable } from '@nestjs/common'

// @Injectable() 声明这是一个可注入的服务
@Injectable()
  export class DemoService {
    // 具体的业务逻辑写在这里
    getHello() {
      // 返回一个对象，NestJS 会自动序列化成 JSON
      return {
        message: '你好，这是我的第一个 NestJS 接口！',
        timestamp: new Date().toISOString(),
      }
    }
  }
```

### 第四步：测试接口
确保服务在运行（`npm run start:dev`），然后：

**浏览器直接访问：**

```plain
http://localhost:3000/demo/hello
```

**返回结果：**

```json
{
  "message": "你好，这是我的第一个 NestJS 接口！",
  "timestamp": "2025-03-30T10:00:00.000Z"
}
```

---

## 七、写第二个接口：POST 请求 + 接收参数
### 7.1 创建 DTO（定义请求体结构）
DTO = Data Transfer Object，用来描述请求体的字段类型。

在 `demo/` 目录下新建 `dto/` 文件夹和文件：

```bash
mkdir src/demo/dto
# 手动创建文件 src/demo/dto/create-user.dto.ts
```

```javascript
// src/demo/dto/create-user.dto.ts

// DTO 就是一个普通的 TypeScript 类
// 用来描述 POST 请求体里有哪些字段、每个字段是什么类型
export class CreateUserDto {
  // 用户名，字符串类型
  name: string

  // 年龄，数字类型
  age: number

  // 邮箱，可选字段（加了 ? 表示可以不传）
  email?: string
}
```

### 7.2 在 Controller 里接收 POST 请求
```javascript
// src/demo/demo.controller.ts

import { Controller, Get, Post, Body } from '@nestjs/common'
import { DemoService } from './demo.service'
import { CreateUserDto } from './dto/create-user.dto'

@Controller('demo')
  export class DemoController {
    constructor(private readonly demoService: DemoService) {}

    // GET /demo/hello
    @Get('hello')
    getHello() {
      return this.demoService.getHello()
    }

    // POST /demo/user
    // @Body() 从请求体中取出 JSON 数据，映射到 CreateUserDto 类型
    @Post('user')
    createUser(@Body() dto: CreateUserDto) {
      // dto.name、dto.age、dto.email 就是请求体里的字段
      return this.demoService.createUser(dto)
    }
  }
```

### 7.3 在 Service 里处理逻辑
```javascript
// src/demo/demo.service.ts

import { Injectable } from '@nestjs/common'
import { CreateUserDto } from './dto/create-user.dto'

@Injectable()
  export class DemoService {
    getHello() {
      return {
        message: '你好，这是我的第一个 NestJS 接口！',
        timestamp: new Date().toISOString(),
      }
    }

    // 接收 DTO 对象，处理创建用户的逻辑
    createUser(dto: CreateUserDto) {
      // 这里模拟创建用户，实际项目中会调用数据库
      return {
        success: true,
        message: `用户 ${dto.name} 创建成功`,
        // 把接收到的数据原样返回，方便调试确认
        data: {
          id: Date.now(),    // 用时间戳模拟自增 ID
          name: dto.name,
          age: dto.age,
          email: dto.email ?? '未填写',
        },
      }
    }
  }
```

### 7.4 用 Apifox 测试 POST 接口
在 Apifox 中新建请求：

+ 方法：`POST`
+ URL：`http://localhost:3000/demo/user`
+ Body 类型：`JSON`
+ Body 内容：

```json
{
  "name": "大伟老师",
  "age": 30,
  "email": "dawei@example.com"
}
```

**返回结果：**

```json
{
  "success": true,
  "message": "用户 大伟老师 创建成功",
  "data": {
    "id": 1711789200000,
    "name": "大伟老师",
    "age": 30,
    "email": "dawei@example.com"
  }
}
```

---

## 八、服务层：把逻辑抽到 Service
### 为什么要 Service？
**不用 Service 的写法（错误示范）：**

```javascript
// ❌ 把逻辑全写在 Controller 里，不推荐
@Post('user')
  createUser(@Body() dto: CreateUserDto) {
  // 业务逻辑、数据处理全堆在这里
  const id = Date.now()
  const user = { id, ...dto }
  // 假设还要发邮件、写日志...越来越长
  return { success: true, data: user }
}
```

**用 Service 的写法（推荐）：**

```javascript
// ✅ Controller 只负责接收和返回，逻辑全在 Service
@Post('user')
  createUser(@Body() dto: CreateUserDto) {
  return this.demoService.createUser(dto)  // 一行搞定
}
```

好处：

+ Controller 保持简洁，一眼看清有哪些接口
+ Service 可以被多个 Controller 复用
+ 逻辑集中在 Service，方便单独测试

### Service 调用 Service
一个 Service 也可以调用另一个 Service，在构造函数里注入即可：

```javascript
// 假设 UserService 需要用到 MailService 发邮件
@Injectable()
  export class UserService {
    // 注入另一个 Service
    constructor(private readonly mailService: MailService) {}

    createUser(dto: CreateUserDto) {
      // ...创建用户逻辑
      this.mailService.sendWelcomeEmail(dto.email)  // 调用另一个 service
      return { success: true }
    }
  }
```

注意：被注入的 Service 必须在同一个模块的 `providers` 里注册，或者从其他模块 `exports` 出来。

---

## 九、路径参数和查询参数
### 9.1 路径参数 @Param()
路径参数是 URL 里的动态部分，用 `:参数名` 表示。

```javascript
// 例如：GET /demo/user/123  → id = '123'
//       GET /demo/user/456  → id = '456'

@Get('user/:id')
  getUserById(
    // @Param('id') 提取 URL 中 :id 的值
    @Param('id') id: string,
    ) {
      return this.demoService.getUserById(id)
}
```

对应的 Service：

```javascript
getUserById(id: string) {
  return {
    id,
    name: `用户${id}`,
    message: `这是 id 为 ${id} 的用户信息`,
  }
}
```

测试：GET `http://localhost:3000/demo/user/42`

### 9.2 查询参数 @Query()
查询参数是 URL `?` 后面的部分，例如 `/demo/list?page=1&size=10`。

```javascript
// GET /demo/list?page=1&size=10
@Get('list')
  getList(
    // @Query('page') 提取查询参数 page 的值
    @Query('page') page: string,
    // @Query('size') 提取查询参数 size 的值
    @Query('size') size: string,
    ) {
      return this.demoService.getList(Number(page), Number(size))
}
```

对应的 Service：

```javascript
getList(page: number, size: number) {
  // page 和 size 可能是 undefined（没传的情况），给默认值
  const currentPage = page || 1
  const pageSize = size || 10

  return {
    page: currentPage,
    size: pageSize,
    total: 100,
    message: `第 ${currentPage} 页，每页 ${pageSize} 条`,
  }
}
```

测试：GET `http://localhost:3000/demo/list?page=2&size=5`

### 9.3 完整的 Controller 示例（汇总以上内容）
```javascript
// src/demo/demo.controller.ts

import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Delete,
  Put,
} from '@nestjs/common'
import { DemoService } from './demo.service'
import { CreateUserDto } from './dto/create-user.dto'

@Controller('demo')
  export class DemoController {
    constructor(private readonly demoService: DemoService) {}

    // GET /demo/hello → 无参数
    @Get('hello')
    getHello() {
      return this.demoService.getHello()
    }

    // GET /demo/list?page=1&size=10 → 查询参数
    @Get('list')
    getList(
      @Query('page') page: string,
      @Query('size') size: string,
    ) {
      return this.demoService.getList(Number(page), Number(size))
    }

    // GET /demo/user/123 → 路径参数
    @Get('user/:id')
    getUserById(@Param('id') id: string) {
      return this.demoService.getUserById(id)
    }

    // POST /demo/user → 请求体参数
    @Post('user')
    createUser(@Body() dto: CreateUserDto) {
      return this.demoService.createUser(dto)
    }

    // PUT /demo/user/123 → 路径参数 + 请求体参数（更新）
    @Put('user/:id')
    updateUser(
      @Param('id') id: string,
      @Body() dto: CreateUserDto,
    ) {
      return this.demoService.updateUser(id, dto)
    }

    // DELETE /demo/user/123 → 路径参数（删除）
    @Delete('user/:id')
    deleteUser(@Param('id') id: string) {
      return this.demoService.deleteUser(id)
    }
  }
```

对应的完整 Service：

```javascript
// src/demo/demo.service.ts

import { Injectable } from '@nestjs/common'
import { CreateUserDto } from './dto/create-user.dto'

@Injectable()
  export class DemoService {
    // 用数组模拟数据库
    private users = [
      { id: '1', name: '大伟老师', age: 30, email: 'dawei@example.com' },
      { id: '2', name: '小明', age: 25, email: 'xiaoming@example.com' },
    ]

    getHello() {
      return {
        message: '你好，这是我的第一个 NestJS 接口！',
        timestamp: new Date().toISOString(),
      }
    }

    getList(page: number, size: number) {
      const currentPage = page || 1
      const pageSize = size || 10
      return {
        page: currentPage,
        pageSize: pageSize,
        total: this.users.length,
        list: this.users,
      }
    }

    getUserById(id: string) {
      // 从数组里找对应 id 的用户
      const user = this.users.find(u => u.id === id)
      if (!user) {
        // 没找到就返回提示信息
        return { success: false, message: `用户 ${id} 不存在` }
      }
      return { success: true, data: user }
    }

    createUser(dto: CreateUserDto) {
      const newUser = {
        id: String(Date.now()),
        name: dto.name,
        age: dto.age,
        email: dto.email ?? '未填写',
      }
      // 加入数组（模拟写入数据库）
      this.users.push(newUser)
      return { success: true, message: '创建成功', data: newUser }
    }

    updateUser(id: string, dto: CreateUserDto) {
      const index = this.users.findIndex(u => u.id === id)
      if (index === -1) {
        return { success: false, message: `用户 ${id} 不存在` }
      }
      // 更新数据
      this.users[index] = { ...this.users[index], ...dto }
      return { success: true, message: '更新成功', data: this.users[index] }
    }

    deleteUser(id: string) {
      const index = this.users.findIndex(u => u.id === id)
      if (index === -1) {
        return { success: false, message: `用户 ${id} 不存在` }
      }
      // 从数组中删除
      this.users.splice(index, 1)
      return { success: true, message: `用户 ${id} 已删除` }
    }
  }
```

---

## 十、用 Apifox 调试所有接口
### 接口清单
| 序号 | 方法 | URL | 说明 |
| --- | --- | --- | --- |
| 1 | GET | http://localhost:3000/demo/hello | 无参数 |
| 2 | GET | http://localhost:3000/demo/list?page=1&size=5 | 查询参数 |
| 3 | GET | http://localhost:3000/demo/user/1 | 路径参数 |
| 4 | POST | http://localhost:3000/demo/user | 请求体参数 |
| 5 | PUT | http://localhost:3000/demo/user/1 | 路径参数 + 请求体 |
| 6 | DELETE | http://localhost:3000/demo/user/1 | 路径参数 |


### 接口 1：GET /demo/hello
+ 方法：GET
+ URL：`http://localhost:3000/demo/hello`
+ 无需参数，直接发送

**返回：**

```json
{
  "message": "你好，这是我的第一个 NestJS 接口！",
  "timestamp": "2025-03-30T10:00:00.000Z"
}
```

### 接口 2：GET /demo/list（查询参数）
+ 方法：GET
+ URL：`http://localhost:3000/demo/list`
+ 在 Apifox 的 **Query 参数** 里填写： 
    - `page` = `1`
    - `size` = `5`

**返回：**

```json
{
  "page": 1,
  "size": 5,
  "total": 2,
  "list": [...]
}
```

### 接口 3：GET /demo/user/:id（路径参数）
+ 方法：GET
+ URL：`http://localhost:3000/demo/user/1`（1 就是 id）

**返回：**

```json
{
  "success": true,
  "data": { "id": "1", "name": "大伟老师", "age": 30, "email": "dawei@example.com" }
}
```

### 接口 4：POST /demo/user（请求体参数）
+ 方法：POST
+ URL：`http://localhost:3000/demo/user`
+ Body 类型：JSON
+ Body：

```json
{
  "name": "王五",
  "age": 28,
  "email": "wangwu@example.com"
}
```

**返回：**

```json
{
  "success": true,
  "message": "创建成功",
  "data": { "id": "1711789200000", "name": "王五", "age": 28, "email": "wangwu@example.com" }
}
```

### 接口 5：PUT /demo/user/:id（更新）
+ 方法：PUT
+ URL：`http://localhost:3000/demo/user/1`
+ Body：

```json
{
  "name": "大伟老师（已更新）",
  "age": 31
}
```

### 接口 6：DELETE /demo/user/:id（删除）
+ 方法：DELETE
+ URL：`http://localhost:3000/demo/user/2`
+ 无需 Body，直接发送

---

## 十一、生成新模块的完整流程
以后每新增一个业务功能，按以下步骤操作：

### 第一步：用 CLI 生成文件
```bash
# 假设要新建一个 article（文章）功能
nest g module article
nest g controller article
nest g service article
```

执行完后自动生成：

```plain
src/article/
├── article.controller.ts
├── article.module.ts
└── article.service.ts
```

`app.module.ts` 也会自动把 `ArticleModule` 加进去。

### 第二步：创建 DTO
```bash
mkdir src/article/dto
# 创建文件 src/article/dto/create-article.dto.ts
```

```javascript
// src/article/dto/create-article.dto.ts
export class CreateArticleDto {
  title: string       // 文章标题
  content: string     // 文章内容
  author?: string     // 作者（可选）
}
```

### 第三步：写 Controller
```javascript
// src/article/article.controller.ts
import { Controller, Get, Post, Body, Param } from '@nestjs/common'
import { ArticleService } from './article.service'
import { CreateArticleDto } from './dto/create-article.dto'

@Controller('article')
  export class ArticleController {
    constructor(private readonly articleService: ArticleService) {}

    @Get('list')
    getList() {
      return this.articleService.getList()
    }

    @Get(':id')
    getById(@Param('id') id: string) {
      return this.articleService.getById(id)
    }

    @Post('create')
    create(@Body() dto: CreateArticleDto) {
      return this.articleService.create(dto)
    }
  }
```

### 第四步：写 Service
```javascript
// src/article/article.service.ts
import { Injectable } from '@nestjs/common'
import { CreateArticleDto } from './dto/create-article.dto'

@Injectable()
  export class ArticleService {
    private articles = [
      { id: '1', title: 'Vue3 入门', content: '...', author: '大伟老师' },
    ]

    getList() {
      return { total: this.articles.length, list: this.articles }
    }

    getById(id: string) {
      const article = this.articles.find(a => a.id === id)
      return article ?? { message: '文章不存在' }
    }

    create(dto: CreateArticleDto) {
      const newArticle = { id: String(Date.now()), ...dto }
      this.articles.push(newArticle)
      return { success: true, data: newArticle }
    }
  }
```

### 第五步：确认模块注册
检查 `article.module.ts` 是否正确：

```javascript
// src/article/article.module.ts
import { Module } from '@nestjs/common'
import { ArticleController } from './article.controller'
import { ArticleService } from './article.service'

@Module({
  controllers: [ArticleController],
  providers: [ArticleService],
})
  export class ArticleModule {}
```

检查 `app.module.ts` 是否已自动加入：

```javascript
// src/app.module.ts
import { ArticleModule } from './article/article.module'

@Module({
  imports: [DemoModule, ArticleModule],  // ← ArticleModule 应该在这里
  ...
    })
```

### 第六步：测试
```javascript
GET    http://localhost:3000/article/list
GET    http://localhost:3000/article/1
POST   http://localhost:3000/article/create
```

---

## 十二、常见报错处理
### 报错 1：`Cannot GET /xxx`
原因：路由写错了，或者模块没有注册到 `AppModule`。

解决：

1. 检查 `@Controller('前缀')` 和 `@Get('路径')` 拼在一起是否正确
2. 检查 `app.module.ts` 的 `imports` 里有没有你的模块

### 报错 2：`Nest can't resolve dependencies`
```plain
Nest can't resolve dependencies of the XxxController (?).
Please make sure that the argument XxxService is available in the XxxModule context.
```

原因：Controller 想注入的 Service 没有在当前模块的 `providers` 里注册。

解决：打开对应的 `xxx.module.ts`，确认 `providers` 里有该 Service：

```javascript
@Module({
  controllers: [XxxController],
  providers: [XxxService],   // ← 确认这里有
})
```

### 报错 3：`Cannot read properties of undefined`
原因：`@Body()` 取出来的字段是 `undefined`，说明请求体的字段名写错了，或者 Content-Type 不对。

解决：

1. Apifox 发请求时，Body 类型必须选 **JSON**，不是 form-data
2. 字段名要和 DTO 里的完全一致，区分大小写

### 报错 4：端口已被占用
```plain
Error: listen EADDRINUSE: address already in use :::3000
```

解决：换一个端口，在 `main.ts` 里改：

```plain
await app.listen(3001)   // 改成 3001 或其他未被占用的端口
```

### 报错 5：模块热更新没生效
`npm run start:dev` 模式下，修改代码后会自动重启。如果没有生效：

```bash
# 停掉进程（Ctrl+C），重新启动
npm run start:dev
```

---

## 总结：NestJS 开发流程记忆口诀
```plain
新功能 → nest g 三件套（module / controller / service）
接参数 → GET 用 @Param @Query，POST 用 @Body + DTO
写逻辑 → Controller 调 Service，Service 干活
测接口 → Apifox 按方法选 GET/POST/PUT/DELETE
出问题 → 看终端报错，99% 是路由写错或模块没注册
```

---

## 附：常用装饰器速查表
| 装饰器 | 用途 | 示例 |
| --- | --- | --- |
| `@Controller('path')` | 声明控制器，设置路由前缀 | `@Controller('user')` |
| `@Get('path')` | 处理 GET 请求 | `@Get('list')`<br/> → GET /user/list |
| `@Post('path')` | 处理 POST 请求 | `@Post('create')` |
| `@Put('path')` | 处理 PUT 请求（更新） | `@Put(':id')` |
| `@Delete('path')` | 处理 DELETE 请求 | `@Delete(':id')` |
| `@Body()` | 从请求体取数据 | `@Body() dto: CreateUserDto` |
| `@Param('key')` | 从 URL 路径取参数 | `@Param('id') id: string` |
| `@Query('key')` | 从 URL 查询字符串取参数 | `@Query('page') page: string` |
| `@Injectable()` | 声明服务可被注入 | 写在 Service 类上面 |
| `@Module({})` | 声明模块 | 写在 Module 类上面 |
