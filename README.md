# Holy Server - 圣经阅读云端同步服务

## 项目简介

Holy Server 是为 Holy Read 圣经阅读应用提供的后端服务，支持用户数据云端同步功能。

## 功能特性

- 🔐 **用户认证系统**：注册、登录、JWT Token 验证
- ☁️ **云端同步**：自动同步用户设置、阅读进度、书签、高亮和笔记
- 💾 **SQLite 数据库**：轻量级、高性能的本地数据库
- 🔄 **实时同步**：前端修改后自动同步到服务器

## 技术栈

- **Node.js** + **Express** - 后端框架
- **better-sqlite3** - SQLite 数据库
- **bcryptjs** - 密码加密
- **jsonwebtoken** - JWT 认证
- **cors** - 跨域支持

## 快速开始

### 1. 安装依赖

```bash
cd Holy-Server
npm install
```

### 2. 启动服务器

```bash
# 开发模式（自动重启）
npm run dev

# 或使用 nodemon
npx nodemon index.js
```

服务器将在 `http://localhost:5001` 启动

### 3. 环境变量（可选）

创建 `.env` 文件：

```env
PORT=5001
JWT_SECRET=your_secret_key_here
```

## API 接口文档

### 认证接口

#### 注册
```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "your_username",
  "password": "your_password"
}
```

**响应：**
```json
{
  "token": "jwt_token_here",
  "user": {
    "id": 1,
    "username": "your_username"
  }
}
```

#### 登录
```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "your_username",
  "password": "your_password"
}
```

**响应：** 同注册接口

### 用户数据接口

#### 获取用户配置
```http
GET /api/user/profile
Authorization: Bearer {token}
```

**响应：**
```json
{
  "settings": {
    "theme": "light",
    "language": "zh-Hans",
    "font_size": 18,
    ...
  },
  "progress": {
    "book_index": 0,
    "chapter_index": 0,
    "verse_num": 1
  },
  "bookmarks": [...],
  "highlights": [...],
  "notes": [...]
}
```

#### 同步数据
```http
POST /api/user/sync
Authorization: Bearer {token}
Content-Type: application/json

{
  "settings": { ... },
  "progress": { ... },
  "bookmarks": [...],
  "highlights": [...],
  "notes": [...]
}
```

## 数据库结构

### users 表
- `id` - 用户ID（主键）
- `username` - 用户名（唯一）
- `password_hash` - 密码哈希
- `created_at` - 创建时间

### settings 表
- `user_id` - 用户ID（外键）
- `theme`, `language`, `font_size` 等 - 各项设置

### progress 表
- `user_id` - 用户ID
- `book_index`, `chapter_index`, `verse_num` - 阅读进度

### bookmarks 表
- `id` - 书签ID
- `user_id` - 用户ID
- `book_id`, `chapter`, `start_verse`, `end_verse` - 经文范围

### highlights 表
- 同 bookmarks，额外包含 `color` 字段

### notes 表
- 同 bookmarks，额外包含 `text` 字段

## 前端集成

前端应用会自动：
1. 在用户登录后获取云端数据
2. 每次修改设置/书签/笔记后自动同步（5秒防抖）
3. 在 Settings 页面显示账号状态

## 安全性

- ✅ 密码使用 bcrypt 加密存储
- ✅ JWT Token 验证所有受保护接口
- ✅ Token 有效期 30 天
- ✅ CORS 配置支持跨域请求

## 开发计划

- [ ] 添加数据备份功能
- [ ] 支持多设备管理
- [ ] 添加数据导出功能
- [ ] 实现更细粒度的权限控制

## 许可证

MIT License

## 联系方式

如有问题，请提交 Issue 或联系开发团队。
# BibleReader-Server
