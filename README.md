# Holy Server - 圣经阅读云端同步服务

## 项目简介

Holy Server 是为 Holy Read 圣经阅读应用提供的后端服务，支持用户数据云端同步、版本管理以及后台管理功能。

## 功能特性

- 🔐 **用户认证系统**：注册、登录、JWT Token 验证
- ☁️ **云端同步**：自动同步用户设置、阅读进度、书签、高亮和笔记
- 🖥️ **后台管理系统**：React + Vite 开发的现代化管理后台，查看用户数据与应用版本
- 📦 **版本管理**：支持预览版/正式版发布，自动识别 Android/iOS/Windows/Mac 元数据
- 🚀 **自动化分发**：集成了服务器端 SCP 自动上传与 `app-last` 软连接维护
- 📖 **API 文档**：内置 Swagger (OpenAPI) 交互式接口文档
- 🧪 **自动化测试**：完善的 Jest + Supertest 接口测试用例
- 💾 **SQLite 数据库**：轻量级、高性能的存储引擎

## 技术栈

- **后端**: Node.js + Express
- **后台前端**: React + Vite + Framer Motion
- **数据库**: better-sqlite3
- **文档**: Swagger UI + OpenAPI 3.0
- **测试**: Jest + Supertest
- **其他相关**: app-info-parser (解析安装包), ssh2-sftp-client (SCP上传), bcryptjs, jsonwebtoken

## 快速开始

### 1. 安装依赖

```bash
# 后端依赖
npm install

# 管理后台依赖
cd admin-dashboard
npm install
```

### 2. 配置环境

创建 `.env` 文件：

```env
PORT=5001
JWT_SECRET=your_secret_key
# SCP 服务器配置 (用于版本管理)
SCP_HOST=your_scp_host
SCP_USER=your_user
SCP_PASSWORD=your_password
DOWNLOAD_BASE_URL=https://your-download-link.com
```

### 3. 启动服务

```bash
# 启动后端服务
npm run dev

# 启动管理后台 (新终端)
cd admin-dashboard
npm run dev
```

### 4. 运行测试

```bash
npm test
```

## 功能入口

- **后台 API**: `http://localhost:5001`
- **管理系统**: `http://localhost:5173`
- **API 文档**: `http://localhost:5001/api-docs` (Swagger UI)
- **OpenAPI Spec**: `http://localhost:5001/swagger.json`

## API 概览

### 核心接口
- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录
- `GET /api/user/profile` - 获取用户全量数据
- `POST /api/user/sync` - 同步用户数据

### 检查更新接口
- `GET /api/update/check` - 客户端调用，根据 platform 和 version_code 获取最新版本信息

### 管理接口
- `GET /api/admin/users` - 获取所有用户列表
- `GET /api/admin/users/:id/content` - 获取指定用户所有数据 (笔记/书签等)
- `POST /api/admin/versions/upload` - 上传新版本文件
- `GET /api/admin/versions` - 查看版本发布历史

## 数据库结构

主要表结构：
- `users`: 账户基础信息
- `settings`: 个性化配置
- `progress`: 阅读进度
- `bookmarks/highlights/notes`: 用户内容数据
- `app_versions`: 客户端版本发布记录

## 许可证

MIT License

## 联系方式

如有问题，请提交 Issue。
