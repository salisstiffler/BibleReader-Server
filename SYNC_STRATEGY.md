# Holy Read - 优化后的同步策略

## 📋 同步策略概述

我们已经优化了数据同步机制，采用更智能的策略来减少不必要的网络请求并提高性能。

---

## 🔄 新的同步策略

### 1. **阅读进度同步** - 每分钟一次
- **触发时机**：每 60 秒自动同步一次
- **同步内容**：当前阅读位置（书卷、章节、节数）
- **API 接口**：`POST /api/user/sync-progress`
- **原因**：阅读进度变化频繁，但不需要实时同步

```typescript
// 每分钟自动同步阅读进度
useEffect(() => {
    if (token) {
        const interval = setInterval(syncProgress, 60000); // 60秒
        return () => clearInterval(interval);
    }
}, [token, lastRead]);
```

---

### 2. **书签操作** - 立即同步
- **触发时机**：用户添加/删除书签时立即调用 API
- **同步内容**：单个书签的添加或删除
- **API 接口**：
  - 添加：`POST /api/user/bookmark/add`
  - 删除：`POST /api/user/bookmark/remove`
- **原因**：书签操作相对较少，需要立即保存

```typescript
const toggleBookmark = (range: VerseRange) => {
    const id = createRangeId(range);
    setBookmarks(prev => {
        const existing = prev.find(b => b.id === id);
        if (existing) {
            apiRemoveBookmark(id); // 立即调用 API
            return prev.filter(b => b.id !== id);
        }
        const newBookmark = { ...range, id };
        apiAddBookmark(newBookmark); // 立即调用 API
        return [...prev, newBookmark];
    });
};
```

---

### 3. **高亮操作** - 立即同步
- **触发时机**：用户添加/删除高亮时立即调用 API
- **同步内容**：单个高亮的设置或删除
- **API 接口**：
  - 设置：`POST /api/user/highlight/set`
  - 删除：`POST /api/user/highlight/remove`
- **原因**：高亮操作需要立即保存，确保用户看到的效果已同步

```typescript
const setHighlight = (range: VerseRange, color: string | null) => {
    const id = createRangeId(range);
    setHighlights(prev => {
        const filtered = prev.filter(h => h.id !== id);
        if (color) {
            const newHighlight = { ...range, id, color };
            apiSetHighlight(newHighlight); // 立即调用 API
            return [...filtered, newHighlight];
        }
        apiRemoveHighlight(id); // 立即调用 API
        return filtered;
    });
};
```

---

### 4. **笔记操作** - 立即同步
- **触发时机**：用户保存/删除笔记时立即调用 API
- **同步内容**：单个笔记的保存或删除
- **API 接口**：
  - 保存：`POST /api/user/note/save`
  - 删除：`POST /api/user/note/remove`
- **原因**：笔记是用户的重要内容，需要立即保存

```typescript
const saveNote = (range: VerseRange, text: string) => {
    const id = createRangeId(range);
    setNotes(prev => {
        const filtered = prev.filter(n => n.id !== id);
        if (text.trim()) {
            const newNote = { ...range, id, text };
            apiSaveNote(newNote); // 立即调用 API
            return [...filtered, newNote];
        }
        apiRemoveNote(id); // 立即调用 API
        return filtered;
    });
};
```

---

### 5. **设置同步** - 2秒防抖
- **触发时机**：用户修改设置后 2 秒
- **同步内容**：所有应用设置
- **API 接口**：`POST /api/user/sync-settings`
- **原因**：设置可能连续修改（如调整字体大小），使用防抖避免频繁请求

```typescript
useEffect(() => {
    if (token) {
        const timer = setTimeout(syncSettings, 2000); // 2秒防抖
        return () => clearTimeout(timer);
    }
}, [theme, language, fontSize, lineHeight, fontFamily, customTheme, 
    accentColor, pageTurnEffect, continuousReading, playbackRate, 
    pauseOnManualSwitch, loopCount, token]);
```

---

## 📊 同步策略对比

| 数据类型 | 旧策略 | 新策略 | 优势 |
|---------|--------|--------|------|
| 阅读进度 | 5秒防抖全量同步 | 每分钟单独同步 | 减少请求频率 |
| 书签 | 5秒防抖全量同步 | 立即单独同步 | 实时保存，减少数据量 |
| 高亮 | 5秒防抖全量同步 | 立即单独同步 | 实时保存，减少数据量 |
| 笔记 | 5秒防抖全量同步 | 立即单独同步 | 实时保存，减少数据量 |
| 设置 | 5秒防抖全量同步 | 2秒防抖单独同步 | 更快响应，减少数据量 |

---

## 🎯 API 接口详细说明

### 1. 同步阅读进度
```http
POST /api/user/sync-progress
Authorization: Bearer {token}
Content-Type: application/json

{
  "progress": {
    "bookIndex": 0,
    "chapterIndex": 1,
    "verseNum": 5
  }
}
```

### 2. 同步设置
```http
POST /api/user/sync-settings
Authorization: Bearer {token}
Content-Type: application/json

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
  }
}
```

### 3. 添加书签
```http
POST /api/user/bookmark/add
Authorization: Bearer {token}
Content-Type: application/json

{
  "id": "gn 1:1",
  "bookId": "gn",
  "chapter": 1,
  "startVerse": 1,
  "endVerse": 1
}
```

### 4. 删除书签
```http
POST /api/user/bookmark/remove
Authorization: Bearer {token}
Content-Type: application/json

{
  "id": "gn 1:1"
}
```

### 5. 设置高亮
```http
POST /api/user/highlight/set
Authorization: Bearer {token}
Content-Type: application/json

{
  "id": "gn 1:2",
  "bookId": "gn",
  "chapter": 1,
  "startVerse": 2,
  "endVerse": 2,
  "color": "#fbbf24"
}
```

### 6. 删除高亮
```http
POST /api/user/highlight/remove
Authorization: Bearer {token}
Content-Type: application/json

{
  "id": "gn 1:2"
}
```

### 7. 保存笔记
```http
POST /api/user/note/save
Authorization: Bearer {token}
Content-Type: application/json

{
  "id": "gn 1:3",
  "bookId": "gn",
  "chapter": 1,
  "startVerse": 3,
  "endVerse": 3,
  "text": "这是我的笔记内容"
}
```

### 8. 删除笔记
```http
POST /api/user/note/remove
Authorization: Bearer {token}
Content-Type: application/json

{
  "id": "gn 1:3"
}
```

---

## 🔍 数据流程图

### 用户添加书签
```
用户点击书签按钮
    ↓
toggleBookmark() 调用
    ↓
更新本地 state (setBookmarks)
    ↓
立即更新 localStorage
    ↓
立即调用 apiAddBookmark()
    ↓
POST /api/user/bookmark/add
    ↓
后端数据库保存
    ✅ 完成
```

### 用户阅读经文
```
用户阅读经文
    ↓
setLastRead() 更新位置
    ↓
立即更新 localStorage
    ↓
等待 60 秒
    ↓
自动调用 syncProgress()
    ↓
POST /api/user/sync-progress
    ↓
后端数据库保存
    ✅ 完成
```

### 用户修改设置
```
用户修改主题/字体等
    ↓
setTheme() / setFontSize() 等
    ↓
立即更新 localStorage
    ↓
触发 useEffect
    ↓
等待 2 秒（防抖）
    ↓
自动调用 syncSettings()
    ↓
POST /api/user/sync-settings
    ↓
后端数据库保存
    ✅ 完成
```

---

## 💡 优势总结

### 1. **性能优化**
- 减少不必要的全量同步
- 单独的 API 调用数据量更小
- 防抖机制避免频繁请求

### 2. **用户体验**
- 书签/笔记/高亮立即保存，无需等待
- 阅读进度定时同步，不影响阅读体验
- 设置修改快速响应

### 3. **网络优化**
- 减少带宽消耗
- 降低服务器负载
- 提高同步成功率

### 4. **数据安全**
- 重要操作（书签/笔记）立即保存
- 本地 localStorage 双重保障
- 失败重试机制（可扩展）

---

## 🧪 测试建议

### 1. 测试书签同步
```
1. 登录账号
2. 添加一个书签
3. 立即检查网络请求（应该看到 /bookmark/add）
4. 刷新页面，验证书签仍然存在
5. 删除书签
6. 检查网络请求（应该看到 /bookmark/remove）
```

### 2. 测试阅读进度同步
```
1. 登录账号
2. 阅读某一章节
3. 等待 60 秒
4. 检查网络请求（应该看到 /sync-progress）
5. 退出登录，重新登录
6. 验证阅读位置已恢复
```

### 3. 测试设置同步
```
1. 登录账号
2. 快速修改多个设置（主题、字体等）
3. 等待 2 秒
4. 检查网络请求（应该只看到一次 /sync-settings）
5. 退出登录，重新登录
6. 验证所有设置已恢复
```

---

## 📝 注意事项

1. **离线模式**：当前未登录或网络断开时，所有数据仍会保存到 localStorage
2. **错误处理**：API 调用失败会在控制台输出错误，但不影响本地操作
3. **并发控制**：当前未实现请求队列，快速操作可能产生多个并发请求
4. **冲突解决**：当前采用"后写入覆盖"策略，未来可考虑添加时间戳

---

**更新时间：** 2026-01-29  
**版本：** 2.0.0  
**状态：** ✅ 已优化
