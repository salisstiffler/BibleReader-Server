# 书签和笔记调试指南

## 🔍 如何查看调试信息

### 步骤 1：打开浏览器开发者工具
1. 在浏览器中按 `F12` 或 `Cmd+Option+I` (Mac)
2. 切换到 **Console** 标签页

### 步骤 2：刷新页面并登录
1. 刷新页面 (`Cmd+R` 或 `F5`)
2. 登录您的账号
3. 查看控制台输出

### 步骤 3：查看关键日志

#### 登录后应该看到：
```
📥 Received profile data: { settings: {...}, progress: {...}, bookmarks: [...], ... }
📚 Bookmarks: [...]
📝 Notes: [...]
🎨 Highlights: [...]
✅ Setting bookmarks: [...]
✅ Setting highlights: [...]
✅ Setting notes: [...]
```

#### 进入书签页面应该看到：
```
🔍 Processing bookmark: { id: "gn 1:1", bookId: "gn", chapter: 1, ... }
📖 Looking for bookId: "gn"
📚 Available books: [{ id: "gn", name: "创世记" }, ...]
✅ Verse info: { text: "起初，神创造天地...", location: "创世记 1:1" }
```

#### 删除书签时应该看到：
```
🔖 toggleBookmark called: { id: "gn 1:1", range: {...} }
🗑️ Removing bookmark: "gn 1:1"
```

---

## 🐛 常见问题诊断

### 问题 1：书签数据为空
**症状**：`📚 Bookmarks: []`

**可能原因**：
1. 数据库中没有书签数据
2. 用户未登录
3. Token 无效

**解决方法**：
```bash
# 检查数据库
cd Holy-Server
sqlite3 holy.db
SELECT * FROM bookmarks;
.quit
```

---

### 问题 2：bookId 为 undefined
**症状**：`📖 Looking for bookId: undefined`

**可能原因**：
后端返回的数据字段名不正确

**检查**：
在控制台查看 `📚 Bookmarks:` 的输出，应该是：
```javascript
[
  {
    id: "gn 1:1",
    bookId: "gn",        // ✅ 应该是 camelCase
    chapter: 1,
    startVerse: 1,
    endVerse: 1
  }
]
```

如果看到的是：
```javascript
[
  {
    id: "gn 1:1",
    book_id: "gn",       // ❌ 错误：snake_case
    chapter: 1,
    start_verse: 1,
    end_verse: 1
  }
]
```

说明后端转换没有生效。

---

### 问题 3：找不到书卷
**症状**：`❌ Book not found for bookmark: {...}`

**可能原因**：
1. `bookId` 与圣经数据中的 `id` 不匹配
2. 圣经数据还未加载完成

**检查**：
查看 `📚 Available books:` 的输出，确认书卷 ID 是否存在

---

### 问题 4：删除不生效
**症状**：点击删除按钮没有反应

**检查**：
1. 查看控制台是否有 `🔖 toggleBookmark called` 日志
2. 查看是否有 `🗑️ Removing bookmark` 日志
3. 查看网络请求是否发送了 `POST /api/user/bookmark/remove`

---

## 📊 完整的数据流程检查

### 1. 添加书签
```
用户点击书签按钮
  ↓
🔖 toggleBookmark called: { id: "gn 1:1", ... }
  ↓
➕ Adding bookmark: "gn 1:1"
  ↓
[Network] POST /api/user/bookmark/add
  ↓
✅ 成功
```

### 2. 查看书签
```
进入书签页面
  ↓
🔍 Processing bookmark: { id: "gn 1:1", bookId: "gn", ... }
  ↓
📖 Looking for bookId: "gn"
  ↓
📚 Available books: [{ id: "gn", name: "创世记" }, ...]
  ↓
✅ Verse info: { text: "起初，神创造天地", location: "创世记 1:1" }
  ↓
显示在页面上
```

### 3. 删除书签
```
用户点击删除按钮
  ↓
🔖 toggleBookmark called: { id: "gn 1:1", ... }
  ↓
🗑️ Removing bookmark: "gn 1:1"
  ↓
[Network] POST /api/user/bookmark/remove
  ↓
✅ 成功
```

---

## 🔧 手动测试步骤

### 测试 1：检查后端数据格式
```bash
# 1. 登录获取 token
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"YOUR_USERNAME","password":"YOUR_PASSWORD"}'

# 2. 使用 token 获取数据（替换 YOUR_TOKEN）
curl http://localhost:5001/api/user/profile \
  -H "Authorization: Bearer YOUR_TOKEN" | jq '.bookmarks'

# 应该看到：
# [
#   {
#     "id": "gn 1:1",
#     "bookId": "gn",        # ✅ camelCase
#     "chapter": 1,
#     "startVerse": 1,
#     "endVerse": 1
#   }
# ]
```

### 测试 2：直接查看数据库
```bash
cd Holy-Server
sqlite3 holy.db

# 查看书签
SELECT * FROM bookmarks;

# 应该看到类似：
# gn 1:1|1|gn|1|1|1

# 退出
.quit
```

---

## 📝 请提供以下信息

为了帮助诊断问题，请：

1. **打开浏览器控制台**
2. **刷新页面并登录**
3. **进入书签页面**
4. **复制控制台中的所有日志**（特别是带有 emoji 的日志）
5. **告诉我看到了什么**

特别关注：
- `📥 Received profile data:` 后面的数据
- `📚 Bookmarks:` 后面的数据
- `🔍 Processing bookmark:` 后面的数据
- 是否有 `❌` 错误日志

---

**创建时间：** 2026-01-29 23:20
