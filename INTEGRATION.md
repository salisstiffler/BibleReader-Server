# Holy Read - 完整集成文档

## 📋 项目概述

Holy Read 是一个现代化的圣经阅读应用，支持云端同步、多语言、TTS 朗读等功能。

### 技术架构

**前端：**
- React + TypeScript
- Vite 构建工具
- Framer Motion 动画
- Context API 状态管理

**后端：**
- Node.js + Express
- SQLite 数据库
- JWT 认证
- bcrypt 密码加密

---

## 🚀 快速开始

### 1. 启动后端服务

```bash
cd /Users/berlin/Documents/antigravity/Holy-Server
npm install
npm run dev
```

服务器将在 `http://localhost:5001` 启动

### 2. 启动前端应用

```bash
cd /Users/berlin/Documents/antigravity/Holy
npm install
npm run dev
```

应用将在 `http://localhost:5173` 启动

---

## 📊 数据流程图

```
用户操作 (添加书签/笔记/修改设置)
    ↓
AppContext 状态更新
    ↓
localStorage 本地保存 (即时)
    ↓
useEffect 监听变化
    ↓
5秒防抖延迟
    ↓
syncData() 调用
    ↓
POST /api/user/sync
    ↓
后端数据库保存
```

---

## 🔐 认证流程

### 注册流程
```
1. 用户输入用户名和密码
2. POST /api/auth/register
3. 后端验证用户名唯一性
4. bcrypt 加密密码
5. 保存到 users 表
6. 生成 JWT Token (30天有效期)
7. 返回 token 和 user 对象
8. 前端保存到 localStorage
9. 自动调用 fetchProfile()
```

### 登录流程
```
1. 用户输入用户名和密码
2. POST /api/auth/login
3. 后端查询用户
4. bcrypt 验证密码
5. 生成 JWT Token
6. 返回 token 和 user 对象
7. 前端保存到 localStorage
8. 调用 fetchProfile() 拉取云端数据
9. 更新所有本地状态
```

### 数据同步流程
```
1. 用户修改任何数据（设置/书签/笔记等）
2. 立即更新 localStorage
3. 触发 useEffect 依赖
4. 5秒防抖计时器
5. 调用 syncData()
6. 发送所有数据到后端
7. 后端事务性更新数据库
8. 返回成功状态
```

---

## 📁 项目结构

### 前端结构
```
Holy/
├── src/
│   ├── components/
│   │   ├── Auth.tsx          # 登录/注册组件
│   │   ├── Settings.tsx      # 设置页面（含账号管理）
│   │   ├── Reader.tsx        # 阅读器
│   │   ├── Bookmarks.tsx     # 书签页面
│   │   └── Notes.tsx         # 笔记页面
│   ├── context/
│   │   └── AppContext.tsx    # 全局状态管理 + 同步逻辑
│   ├── locales/
│   │   ├── en.ts            # 英文翻译
│   │   ├── zh-Hans.ts       # 简体中文
│   │   └── zh-Hant.ts       # 繁体中文
│   └── App.tsx
```

### 后端结构
```
Holy-Server/
├── db.js                    # 数据库初始化
├── index.js                 # 服务器入口
├── middleware/
│   └── auth.js             # JWT 认证中间件
├── routes/
│   ├── auth.js             # 认证路由
│   └── user.js             # 用户数据路由
├── .env                    # 环境变量
├── package.json
└── README.md
```

---

## 🗄️ 数据库设计

### users 表
```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### settings 表
```sql
CREATE TABLE settings (
    user_id INTEGER PRIMARY KEY,
    theme TEXT,
    language TEXT,
    font_size INTEGER,
    line_height REAL,
    font_family TEXT,
    custom_theme TEXT,
    accent_color TEXT,
    page_turn_effect TEXT,
    continuous_reading BOOLEAN,
    playback_rate REAL,
    pause_on_manual_switch BOOLEAN,
    loop_count INTEGER,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### progress 表
```sql
CREATE TABLE progress (
    user_id INTEGER PRIMARY KEY,
    book_index INTEGER,
    chapter_index INTEGER,
    verse_num INTEGER,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### bookmarks 表
```sql
CREATE TABLE bookmarks (
    id TEXT PRIMARY KEY,
    user_id INTEGER,
    book_id TEXT,
    chapter INTEGER,
    start_verse INTEGER,
    end_verse INTEGER,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### highlights 表
```sql
CREATE TABLE highlights (
    id TEXT PRIMARY KEY,
    user_id INTEGER,
    book_id TEXT,
    chapter INTEGER,
    start_verse INTEGER,
    end_verse INTEGER,
    color TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### notes 表
```sql
CREATE TABLE notes (
    id TEXT PRIMARY KEY,
    user_id INTEGER,
    book_id TEXT,
    chapter INTEGER,
    start_verse INTEGER,
    end_verse INTEGER,
    text TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

---

## 🔌 API 接口详细说明

### 1. POST /api/auth/register
注册新用户

**请求体：**
```json
{
  "username": "string",
  "password": "string"
}
```

**响应：**
```json
{
  "token": "jwt_token_string",
  "user": {
    "id": 1,
    "username": "string"
  }
}
```

**错误响应：**
```json
{
  "error": "Username already exists"
}
```

### 2. POST /api/auth/login
用户登录

**请求体：**
```json
{
  "username": "string",
  "password": "string"
}
```

**响应：** 同注册接口

**错误响应：**
```json
{
  "error": "Invalid credentials"
}
```

### 3. GET /api/user/profile
获取用户完整配置（需要认证）

**请求头：**
```
Authorization: Bearer {token}
```

**响应：**
```json
{
  "settings": {
    "theme": "light",
    "language": "zh-Hans",
    "font_size": 18,
    "line_height": 1.6,
    "font_family": "sans",
    "custom_theme": null,
    "accent_color": "#6366f1",
    "page_turn_effect": "curl",
    "continuous_reading": 0,
    "playback_rate": 1.0,
    "pause_on_manual_switch": 0,
    "loop_count": 1
  },
  "progress": {
    "book_index": 0,
    "chapter_index": 0,
    "verse_num": 1
  },
  "bookmarks": [
    {
      "id": "gn 1:1",
      "book_id": "gn",
      "chapter": 1,
      "start_verse": 1,
      "end_verse": 1
    }
  ],
  "highlights": [
    {
      "id": "gn 1:1",
      "book_id": "gn",
      "chapter": 1,
      "start_verse": 1,
      "end_verse": 1,
      "color": "#fbbf24"
    }
  ],
  "notes": [
    {
      "id": "gn 1:1",
      "book_id": "gn",
      "chapter": 1,
      "start_verse": 1,
      "end_verse": 1,
      "text": "我的笔记内容"
    }
  ]
}
```

### 4. POST /api/user/sync
同步用户数据（需要认证）

**请求头：**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**请求体：**
```json
{
  "settings": {
    "theme": "dark",
    "language": "zh-Hans",
    "fontSize": 20,
    "lineHeight": 1.8,
    "fontFamily": "serif",
    "customTheme": "#fdf2f8",
    "accentColor": "#8b5cf6",
    "pageTurnEffect": "fade",
    "continuousReading": true,
    "playbackRate": 1.2,
    "pauseOnManualSwitch": true,
    "loopCount": 3
  },
  "progress": {
    "bookIndex": 0,
    "chapterIndex": 1,
    "verseNum": 5
  },
  "bookmarks": [...],
  "highlights": [...],
  "notes": [...]
}
```

**响应：**
```json
{
  "success": true
}
```

---

## 🌐 多语言支持

### 翻译文件结构
```typescript
{
  books: { ... },      // 书卷名称
  app: { ... },        // 应用标题和导航
  settings: { ... },   // 设置页面
  reader: { ... },     // 阅读器
  common: { ... },     // 通用文本
  bookmarks: { ... },  // 书签页面
  notes: { ... },      // 笔记页面
  globalSearch: { ... }, // 搜索页面
  auth: { ... }        // 认证相关
}
```

### 使用方法
```typescript
const { t } = useAppContext();
t('auth.login_title')  // "欢迎回来"
t('reader.verse_single', { verse: 1 })  // "第 1 节"
```

---

## ⚙️ 配置说明

### 前端配置
- API 地址：`http://localhost:5001/api`
- 同步延迟：5 秒
- Token 存储：localStorage

### 后端配置
- 端口：5001
- JWT 密钥：在 `.env` 文件中配置
- Token 有效期：30 天
- 数据库文件：`holy.db`

---

## 🔧 开发建议

### 1. 调试同步功能
在浏览器控制台查看同步日志：
```javascript
// AppContext.tsx 中已有 console.error
// 可以添加更多日志
console.log('Syncing data...', { bookmarks, highlights, notes });
```

### 2. 查看数据库
```bash
cd Holy-Server
sqlite3 holy.db
.mode column
.headers on
SELECT * FROM users;
```

### 3. 测试 API
使用 Postman 或 curl 测试各个接口

### 4. 监控同步状态
可以在 Settings 页面添加同步状态指示器

---

## 🐛 常见问题

### Q: 登录后数据没有同步？
A: 检查：
1. 后端服务是否运行
2. 浏览器控制台是否有错误
3. Token 是否有效
4. 网络请求是否成功

### Q: 修改设置后没有自动同步？
A: 等待 5 秒，同步有防抖延迟

### Q: 数据库文件在哪里？
A: `Holy-Server/holy.db`

### Q: 如何重置数据库？
A: 删除 `holy.db` 文件，重启服务器会自动创建新的

---

## 📝 待优化项

1. **同步优化**
   - 添加同步状态指示器
   - 实现增量同步（而非全量替换）
   - 添加冲突解决机制

2. **安全性增强**
   - 添加密码强度验证
   - 实现忘记密码功能
   - 添加邮箱验证

3. **功能扩展**
   - 多设备管理
   - 数据导出/导入
   - 分享功能
   - 社交功能

4. **性能优化**
   - 实现虚拟滚动（大量书签/笔记）
   - 优化数据库查询
   - 添加缓存机制

---

## 📄 许可证

MIT License

---

## 👥 贡献指南

欢迎提交 Issue 和 Pull Request！

---

**最后更新：** 2026-01-29
