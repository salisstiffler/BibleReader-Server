# 书签和笔记显示问题修复

## 🐛 问题描述

用户报告：
- 书签页面：经文内容没有显示
- 笔记页面：经文内容没有显示
- 书籍名显示异常

## 🔍 问题原因

后端从数据库返回的数据使用 **snake_case** 命名（如 `book_id`、`start_verse`），但前端期望的是 **camelCase** 命名（如 `bookId`、`startVerse`）。

### 数据库字段（snake_case）
```sql
CREATE TABLE bookmarks (
    id TEXT PRIMARY KEY,
    user_id INTEGER,
    book_id TEXT,        -- ❌ snake_case
    chapter INTEGER,
    start_verse INTEGER, -- ❌ snake_case
    end_verse INTEGER,   -- ❌ snake_case
    ...
);
```

### 前端期望（camelCase）
```typescript
interface RangeBookmark {
    id: string;
    bookId: string;      // ✅ camelCase
    chapter: number;
    startVerse: number;  // ✅ camelCase
    endVerse: number;    // ✅ camelCase
}
```

### 问题表现
当前端尝试访问 `bookmark.bookId` 时，实际数据中只有 `bookmark.book_id`，导致：
- `bookId` 为 `undefined`
- 无法找到对应的书卷
- 无法获取经文内容
- 书籍名显示为 `undefined`

## ✅ 解决方案

在后端 `/api/user/profile` 接口中，将数据库返回的 snake_case 字段转换为 camelCase：

```javascript
// 修复前
const bookmarks = db.prepare('SELECT * FROM bookmarks WHERE user_id = ?').all(userId);
res.json({ bookmarks }); // 直接返回，字段名为 book_id, start_verse 等

// 修复后
const bookmarksRaw = db.prepare('SELECT * FROM bookmarks WHERE user_id = ?').all(userId);
const bookmarks = bookmarksRaw.map(b => ({
    id: b.id,
    bookId: b.book_id,           // ✅ 转换为 camelCase
    chapter: b.chapter,
    startVerse: b.start_verse,   // ✅ 转换为 camelCase
    endVerse: b.end_verse        // ✅ 转换为 camelCase
}));
res.json({ bookmarks });
```

同样的转换也应用于 `highlights` 和 `notes`。

## 📝 修改的文件

### `/Users/berlin/Documents/antigravity/Holy-Server/routes/user.js`

在 `GET /api/user/profile` 路由中添加了字段名转换：

```javascript
router.get('/profile', auth, (req, res) => {
    const userId = req.userId;

    const settings = db.prepare('SELECT * FROM settings WHERE user_id = ?').get(userId);
    const progress = db.prepare('SELECT * FROM progress WHERE user_id = ?').get(userId);
    const bookmarksRaw = db.prepare('SELECT * FROM bookmarks WHERE user_id = ?').all(userId);
    const highlightsRaw = db.prepare('SELECT * FROM highlights WHERE user_id = ?').all(userId);
    const notesRaw = db.prepare('SELECT * FROM notes WHERE user_id = ?').all(userId);

    // Convert snake_case to camelCase for frontend
    const bookmarks = bookmarksRaw.map(b => ({
        id: b.id,
        bookId: b.book_id,
        chapter: b.chapter,
        startVerse: b.start_verse,
        endVerse: b.end_verse
    }));

    const highlights = highlightsRaw.map(h => ({
        id: h.id,
        bookId: h.book_id,
        chapter: h.chapter,
        startVerse: h.start_verse,
        endVerse: h.end_verse,
        color: h.color
    }));

    const notes = notesRaw.map(n => ({
        id: n.id,
        bookId: n.book_id,
        chapter: n.chapter,
        startVerse: n.start_verse,
        endVerse: n.end_verse,
        text: n.text
    }));

    res.json({
        settings: settings || null,
        progress: progress || null,
        bookmarks,
        highlights,
        notes
    });
});
```

## 🧪 测试步骤

### 1. 测试书签显示
```
1. 登录账号
2. 添加几个书签（不同书卷、不同章节）
3. 进入"书签"页面
4. 验证：
   ✅ 书籍名正确显示（如 "创世记"、"约翰福音"）
   ✅ 章节信息正确显示（如 "1:1"、"3:16"）
   ✅ 经文内容正确显示
```

### 2. 测试笔记显示
```
1. 登录账号
2. 添加几条笔记
3. 进入"笔记"页面
4. 验证：
   ✅ 书籍名正确显示
   ✅ 章节信息正确显示
   ✅ 经文内容正确显示
   ✅ 笔记内容正确显示
```

### 3. 测试高亮显示
```
1. 登录账号
2. 高亮几处经文
3. 在阅读器中验证：
   ✅ 高亮颜色正确显示
   ✅ 高亮范围正确
```

### 4. 测试跨设备同步
```
1. 在设备 A 添加书签/笔记
2. 退出登录
3. 在设备 B（或同一设备）重新登录
4. 验证：
   ✅ 书签正确恢复并显示
   ✅ 笔记正确恢复并显示
   ✅ 高亮正确恢复并显示
```

## 📊 数据流程

### 添加书签流程
```
1. 用户点击书签按钮
2. toggleBookmark() 调用
3. 创建 bookmark 对象（camelCase）:
   {
     id: "gn 1:1",
     bookId: "gn",
     chapter: 1,
     startVerse: 1,
     endVerse: 1
   }
4. 保存到 localStorage（camelCase）
5. 调用 apiAddBookmark()
6. 发送到后端（camelCase）
7. 后端保存到数据库（snake_case）
   INSERT INTO bookmarks (id, book_id, chapter, start_verse, end_verse)
```

### 获取书签流程
```
1. 用户登录
2. fetchProfile() 调用
3. GET /api/user/profile
4. 后端从数据库读取（snake_case）:
   {
     id: "gn 1:1",
     book_id: "gn",
     chapter: 1,
     start_verse: 1,
     end_verse: 1
   }
5. 后端转换为 camelCase:
   {
     id: "gn 1:1",
     bookId: "gn",
     chapter: 1,
     startVerse: 1,
     endVerse: 1
   }
6. 返回给前端
7. 前端正确显示
```

## 🎯 关键点

1. **数据库使用 snake_case**：这是 SQL 的标准命名约定
2. **前端使用 camelCase**：这是 JavaScript/TypeScript 的标准命名约定
3. **后端负责转换**：在 API 层进行字段名转换，保持前后端一致性
4. **双向转换**：
   - 读取时：snake_case → camelCase
   - 写入时：前端发送 camelCase，后端接收后转换为 snake_case 存储

## ✅ 修复确认

修复后，应该能看到：
- ✅ 书签页面正确显示书籍名（如 "创世记 1:1"）
- ✅ 书签页面正确显示经文内容
- ✅ 笔记页面正确显示书籍名和经文
- ✅ 高亮功能正常工作
- ✅ 跨设备同步正常

## 🔄 相关文件

- **后端**：`/Users/berlin/Documents/antigravity/Holy-Server/routes/user.js`
- **前端**：
  - `/Users/berlin/Documents/antigravity/Holy/src/components/Bookmarks.tsx`
  - `/Users/berlin/Documents/antigravity/Holy/src/components/Notes.tsx`
  - `/Users/berlin/Documents/antigravity/Holy/src/context/AppContext.tsx`

---

**修复时间：** 2026-01-29 23:15  
**状态：** ✅ 已修复
