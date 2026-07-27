---
title: MySQL 入门教程
---

# MySQL 入门教程（零基础友好）

## 什么是 MySQL？

MySQL 是一个**关系型数据库**，用来存数据。你可以把它理解成一个**Excel 表格**：

- 一个数据库就是一个 Excel 文件
- 一张表就是文件里的一个 Sheet
- 一行就是一条数据
- 一列就是一个字段（比如姓名、年龄）

## 安装 MySQL

### Mac

```bash
brew install mysql
brew services start mysql
```

### Windows

去 [dev.mysql.com/downloads/mysql](https://dev.mysql.com/downloads/mysql/) 下载安装包，一路下一步。

### 验证是否装好

```bash
mysql --version
```

能看到版本号就说明装成功了。

## 登录 MySQL

```bash
mysql -u root -p
```

`-u root` 表示用 root 用户登录，`-p` 表示需要输入密码。第一次登录会让你设置密码。

登录成功后你会看到 `mysql>` 提示符，说明已进入 MySQL 命令行。

## 基础操作

### 查看已有数据库

```sql
SHOW DATABASES;
```

每条 SQL 语句后面都要加 `;`，表示语句结束。

### 创建数据库

```sql
CREATE DATABASE myapp;
```

### 使用数据库

```sql
USE myapp;
```

后面所有的操作都是在这个数据库里进行的。

### 删除数据库

```sql
DROP DATABASE myapp;
```

**小心**，删了就没了。

## 表操作

### 创建表

```sql
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  age INT DEFAULT 0,
  email VARCHAR(100),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

这条语句创建了一张 `users` 表，字段说明：

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | INT | 整数，自动增长，主键 |
| `name` | VARCHAR(50) | 最多 50 个字符的字符串，不能为空 |
| `age` | INT | 整数，默认值为 0 |
| `email` | VARCHAR(100) | 最多 100 个字符的字符串 |
| `created_at` | DATETIME | 日期时间，默认是当前时间 |

### 查看表结构

```sql
DESCRIBE users;
```

### 查看所有表

```sql
SHOW TABLES;
```

### 删除表

```sql
DROP TABLE users;
```

## 增删改查（CRUD）

这是最常用的四个操作，英文缩写是 **CRUD**（Create / Read / Update / Delete）。

### 插入数据（Create）

```sql
INSERT INTO users (name, age, email) VALUES ('张三', 25, 'zhangsan@qq.com');
```

插入多条：

```sql
INSERT INTO users (name, age, email) VALUES
  ('李四', 30, 'lisi@qq.com'),
  ('王五', 28, 'wangwu@qq.com');
```

### 查询数据（Read）

查所有：

```sql
SELECT * FROM users;
```

查指定字段：

```sql
SELECT name, email FROM users;
```

按条件查：

```sql
SELECT * FROM users WHERE age > 25;
```

模糊查询：

```sql
SELECT * FROM users WHERE name LIKE '%张%';
```

`%` 是通配符，`%张%` 表示名字里带"张"的。

排序：

```sql
SELECT * FROM users ORDER BY age DESC;
```

`DESC` 表示降序（从大到小），`ASC` 表示升序（从小到大，默认）。

限制数量：

```sql
SELECT * FROM users LIMIT 10;
```

分页：

```sql
SELECT * FROM users LIMIT 10 OFFSET 20;
```

跳过前 20 条，取 10 条，也就是第 3 页（每页 10 条）。

### 更新数据（Update）

```sql
UPDATE users SET age = 26 WHERE name = '张三';
```

**一定记得加 WHERE**，不然会把所有人的年龄都改了。

### 删除数据（Delete）

```sql
DELETE FROM users WHERE name = '张三';
```

**也一定记得加 WHERE**，不然会删光所有人。

## 进阶查询

### 聚合函数

```sql
-- 查总人数
SELECT COUNT(*) FROM users;

-- 查平均年龄
SELECT AVG(age) FROM users;

-- 查最大年龄
SELECT MAX(age) FROM users;

-- 查最小年龄
SELECT MIN(age) FROM users;

-- 查年龄总和
SELECT SUM(age) FROM users;
```

### 分组

```sql
SELECT age, COUNT(*) FROM users GROUP BY age;
```

按年龄分组，统计每个年龄段各有多少人。

### 多表关联

先再建一张订单表：

```sql
CREATE TABLE orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  product VARCHAR(100),
  amount DECIMAL(10, 2),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO orders (user_id, product, amount) VALUES
  (1, '手机', 2999.00),
  (1, '耳机', 199.00),
  (2, '电脑', 5999.00);
```

内连接（查每个订单对应的用户信息）：

```sql
SELECT orders.id, users.name, orders.product, orders.amount
FROM orders
INNER JOIN users ON orders.user_id = users.id;
```

左连接（即使没下过单的用户也会显示）：

```sql
SELECT users.name, orders.product
FROM users
LEFT JOIN orders ON users.id = orders.user_id;
```

## 索引

索引用来加速查询。就像书的目录，没有索引就得一页页翻。

### 创建索引

```sql
CREATE INDEX idx_email ON users(email);
```

### 查看索引

```sql
SHOW INDEX FROM users;
```

### 什么时候该加索引？

- 经常在 `WHERE` 条件里用的字段
- 经常在 `ORDER BY` 里用的字段
- 经常做关联查询的字段（外键）

### 什么时候不该加？

- 数据量小的表（几千行不需要）
- 频繁更新的字段（索引维护有开销）
- 值很少变化的字段（比如性别只有男/女）

## 在 Node.js 里连接 MySQL

先用 `mysql2` 包：

```bash
npm install mysql2
```

### 连接查询

```javascript
const mysql = require('mysql2')

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '123456',
  database: 'myapp',
})

connection.query('SELECT * FROM users', (err, results) => {
  if (err) throw err
  console.log(results)
})

connection.end()
```

### 参数化查询（防 SQL 注入）

```javascript
const name = '张三'
connection.query('SELECT * FROM users WHERE name = ?', [name], (err, results) => {
  if (err) throw err
  console.log(results)
})
```

`?` 是占位符，后面的数组自动替换进去。永远不要直接用字符串拼 SQL：

```javascript
// ❌ 危险！会被 SQL 注入
const sql = 'SELECT * FROM users WHERE name = "' + name + '"'

// ✅ 安全
connection.query('SELECT * FROM users WHERE name = ?', [name])
```

### 用 Promise 写法

```javascript
async function getUsers() {
  const [rows] = await connection.promise().query('SELECT * FROM users')
  return rows
}

getUsers().then(console.log)
```

## 数据类型速查

### 字符串

| 类型 | 说明 | 最大长度 |
|------|------|---------|
| CHAR(n) | 定长字符串 | 255 |
| VARCHAR(n) | 变长字符串 | 65535 |
| TEXT | 长文本 | 65535 |

### 数字

| 类型 | 说明 | 范围 |
|------|------|------|
| INT | 整数 | ±21 亿 |
| BIGINT | 大整数 | 很大 |
| DECIMAL(m, n) | 小数 | 比如 DECIMAL(10, 2) 存金额 |
| FLOAT/DOUBLE | 浮点数 | 有精度问题，存钱别用 |

### 时间

| 类型 | 说明 |
|------|------|
| DATE | 日期（2026-07-27） |
| DATETIME | 日期时间（2026-07-27 14:30:00） |
| TIMESTAMP | 时间戳，范围小一些 |
| YEAR | 年份 |

## 常用命令速查

```sql
-- 登录
mysql -u root -p

-- 查看数据库
SHOW DATABASES;

-- 创建数据库
CREATE DATABASE db_name;

-- 使用数据库
USE db_name;

-- 查看表
SHOW TABLES;

-- 查看表结构
DESCRIBE table_name;

-- 创建表
CREATE TABLE table_name (column_name type);

-- 插入
INSERT INTO table_name (col1, col2) VALUES (val1, val2);

-- 查询
SELECT * FROM table_name WHERE condition;

-- 更新
UPDATE table_name SET col = val WHERE condition;

-- 删除
DELETE FROM table_name WHERE condition;

-- 删除表
DROP TABLE table_name;

-- 删除数据库
DROP DATABASE db_name;

-- 退出
EXIT;
```
