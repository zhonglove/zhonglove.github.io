---
title: Express.js 入门教程
---

# Express.js 入门教程（零基础友好）

## 什么是 Express？

Node.js 本身可以写后端，但写起来很麻烦——要自己处理路由、解析请求体、管理静态文件等等。Express 就是在 Node.js 之上封装了一层，让你用几行代码就能搭起一个后端服务。

**打个比方**：Node.js 是砖块水泥，Express 是已经盖好的毛坯房。你不用从零开始砌墙，直接装修就能住。

## 环境搭建

### 1. 安装 Node.js

去 [nodejs.org](https://nodejs.org) 下载安装，建议选 LTS 版本。

装好后打开终端（命令行），输入：

```bash
node -v
```

能看到版本号就说明装成功了。

### 2. 新建项目

```bash
mkdir my-express-app
cd my-express-app
npm init -y
```

`npm init -y` 会生成一个 `package.json` 文件，记录项目的依赖信息。

### 3. 安装 Express

```bash
npm install express
```

装完后，项目里会多一个 `node_modules` 文件夹和一个 `package-lock.json` 文件，不用管它们。

## 第一个服务：Hello World

在项目根目录新建 `app.js`，写入：

```javascript
const express = require('express')
const app = express()

app.get('/', (req, res) => {
  res.send('Hello World')
})

app.listen(3000, () => {
  console.log('服务已启动：http://localhost:3000')
})
```

然后在终端运行：

```bash
node app.js
```

看到 `服务已启动：http://localhost:3000` 后，打开浏览器访问 `http://localhost:3000`，你会看到页面上显示 `Hello World`。

### 这段代码做了啥？

| 代码 | 说明 |
|------|------|
| `require('express')` | 引入 Express 包 |
| `express()` | 创建一个应用实例 |
| `app.get('/', ...)` | 当有人访问 `/` 这个路径时，执行后面的函数 |
| `req` | 请求对象，存着浏览器发来的信息 |
| `res.send()` | 发送响应给浏览器 |
| `app.listen(3000)` | 让服务监听 3000 端口 |

## 路由：处理不同请求

路由就是根据不同的 URL 和请求方式，执行不同的代码。

### GET 请求（获取数据）

```javascript
app.get('/user', (req, res) => {
  res.json({ name: '张三', age: 25 })
})

app.get('/about', (req, res) => {
  res.send('这是关于页面')
})
```

访问 `http://localhost:3000/user` 会看到 JSON 数据，访问 `/about` 会看到文字。

### POST 请求（提交数据）

```javascript
app.post('/login', (req, res) => {
  res.send('登录成功')
})
```

POST 请求无法在浏览器地址栏直接访问，需要用 Postman 或前端表单来测试。

### 路径参数（动态路由）

URL 里的某个部分是动态的，用 `:参数名` 表示：

```javascript
app.get('/user/:id', (req, res) => {
  res.send('用户的 ID 是：' + req.params.id)
})
```

访问 `/user/123`，页面显示 `用户的 ID 是：123`。

### 查询参数（URL 问号后面的部分）

```javascript
app.get('/search', (req, res) => {
  res.send('搜索关键词：' + req.query.keyword)
})
```

访问 `/search?keyword=手机`，页面显示 `搜索关键词：手机`。

## 请求与响应

Express 帮我们封装好了常用的请求和响应方法。

### 获取请求数据

```javascript
app.post('/submit', (req, res) => {
  // URL 路径参数
  console.log(req.params)

  // URL 查询参数（?name=xxx）
  console.log(req.query)

  // 请求体（POST 提交的 JSON 数据）
  console.log(req.body)
})
```

**注意**：`req.body` 默认是 undefined，需要用中间件来解析，下面会说。

### 返回响应

```javascript
// 返回 JSON
res.json({ success: true, data: [] })

// 返回纯文本
res.send('Hello')

// 返回状态码
res.status(404).send('没找到')

// 返回 HTML
res.send('<h1>标题</h1>')
```

## 中间件

中间件是 Express 的核心概念。你可以把它理解成**工厂流水线上的一个个工位**，每个工位处理完传给下一个。

### 内置中间件：解析请求体

```javascript
// 解析 JSON 格式的请求体
app.use(express.json())

// 解析表单格式的请求体
app.use(express.urlencoded({ extended: true }))
```

加上这两行之后，`req.body` 就能拿到数据了。

完整示例：

```javascript
const express = require('express')
const app = express()

app.use(express.json())

app.post('/submit', (req, res) => {
  console.log(req.body)  // 拿到前端传来的 JSON 数据
  res.json({ received: req.body })
})

app.listen(3000)
```

### 第三方中间件：cors

前端和后端端口不同的时候，浏览器会拦截请求，这叫跨域。用 `cors` 解决：

```bash
npm install cors
```

```javascript
const cors = require('cors')
app.use(cors())
```

### 静态文件服务

让用户可以直接访问你指定的文件夹里的文件（图片、CSS、JS 等）：

```javascript
// 让 public 文件夹下的文件可以被直接访问
app.use(express.static('public'))
```

项目目录下建个 `public` 文件夹，里面放一张 `logo.jpg`，然后访问 `http://localhost:3000/logo.jpg` 就能看到图片。

### 自定义中间件

你也可以自己写中间件，比如记录每个请求的耗时：

```javascript
app.use((req, res, next) => {
  console.log(req.method + ' ' + req.url)
  next()  // 调用 next() 让请求继续往下走
})
```

每一行请求都会在终端打印出 `GET /user` 这样的日志。

## 连接 MySQL 数据库

### 安装 mysql2

```bash
npm install mysql2
```

### 创建连接

新建 `db.js`：

```javascript
const mysql = require('mysql2')

const connection = mysql.createConnection({
  host: 'localhost',     // 数据库地址
  user: 'root',          // 用户名
  password: '123456',    // 密码
  database: 'myapp',     // 数据库名
})

connection.connect((err) => {
  if (err) {
    console.error('数据库连接失败：', err)
    return
  }
  console.log('数据库连接成功')
})

module.exports = connection
```

### 查询数据

```javascript
const db = require('./db')

app.get('/users', (req, res) => {
  db.query('SELECT * FROM users', (err, results) => {
    if (err) {
      res.status(500).json({ error: err.message })
      return
    }
    res.json(results)
  })
})
```

### 插入数据

```javascript
app.post('/users', (req, res) => {
  const { name, age } = req.body
  db.query('INSERT INTO users (name, age) VALUES (?, ?)', [name, age], (err, result) => {
    if (err) {
      res.status(500).json({ error: err.message })
      return
    }
    res.json({ id: result.insertId, name, age })
  })
})
```

`?` 是占位符，后面的数组是对应的值，这样做可以防止 SQL 注入。

## 写一个完整的 CRUD API

把上面学的东西串起来，写一个完整的用户管理接口。

```javascript
const express = require('express')
const mysql = require('mysql2')
const cors = require('cors')

const app = express()
app.use(express.json())
app.use(cors())

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '123456',
  database: 'myapp',
})

// 查全部
app.get('/users', (req, res) => {
  db.query('SELECT * FROM users', (err, results) => {
    if (err) return res.status(500).json({ error: err.message })
    res.json(results)
  })
})

// 查单个
app.get('/users/:id', (req, res) => {
  db.query('SELECT * FROM users WHERE id = ?', [req.params.id], (err, results) => {
    if (err) return res.status(500).json({ error: err.message })
    if (results.length === 0) return res.status(404).json({ error: '用户不存在' })
    res.json(results[0])
  })
})

// 新增
app.post('/users', (req, res) => {
  const { name, age } = req.body
  db.query('INSERT INTO users (name, age) VALUES (?, ?)', [name, age], (err, result) => {
    if (err) return res.status(500).json({ error: err.message })
    res.json({ id: result.insertId, name, age })
  })
})

// 修改
app.put('/users/:id', (req, res) => {
  const { name, age } = req.body
  db.query('UPDATE users SET name = ?, age = ? WHERE id = ?', [name, age, req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message })
    res.json({ message: '更新成功' })
  })
})

// 删除
app.delete('/users/:id', (req, res) => {
  db.query('DELETE FROM users WHERE id = ?', [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message })
    res.json({ message: '删除成功' })
  })
})

app.listen(3000, () => {
  console.log('服务已启动：http://localhost:3000')
})
```

## 错误处理

### try/catch 捕获异步错误

Node.js 新版本支持 `async/await`，可以用 `try/catch` 统一处理错误。

```javascript
app.get('/users', async (req, res) => {
  try {
    const [rows] = await db.promise().query('SELECT * FROM users')
    res.json(rows)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})
```

### 错误中间件

```javascript
// 放在所有路由的最后面
app.use((err, req, res, next) => {
  console.error('出错了：', err)
  res.status(500).json({ error: '服务器内部错误' })
})
```

## 部署

### 使用环境变量

不要把数据库密码直接写在代码里，用环境变量：

```bash
npm install dotenv
```

项目根目录建一个 `.env` 文件：

```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=123456
DB_NAME=myapp
PORT=3000
```

代码里读取：

```javascript
require('dotenv').config()

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
})

const port = process.env.PORT || 3000
app.listen(port)
```

### 用 Docker 部署

在项目根目录建 `Dockerfile`：

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["node", "app.js"]
```

然后执行：

```bash
docker build -t my-express-app .
docker run -p 3000:3000 my-express-app
```

浏览器打开 `http://localhost:3000`，就能看到你的服务了。

## 总结

Express 的核心就这六样东西：

| 概念 | 一句话 |
|------|--------|
| 路由 | 不同 URL 走不同的代码 |
| 中间件 | 流水线上一个个处理工位 |
| 请求 | 拿前端发来的数据 |
| 响应 | 给前端返回数据 |
| 数据库 | 存数据的地方 |
| 部署 | 让所有人都能访问 |

学会了这些，你已经可以用 Express 写一个完整的后端 API 了。
