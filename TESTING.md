# Holy Read - 功能测试清单

## 用户系统测试

### 1. 注册功能
- [ ] 打开应用，进入"我的"页面
- [ ] 点击"立即登录"按钮
- [ ] 点击"去注册"切换到注册界面
- [ ] 输入用户名和密码
- [ ] 点击"注册账号"
- [ ] 验证注册成功，显示用户名
- [ ] 验证账号卡片显示"云端同步已激活"

### 2. 登录功能
- [ ] 退出登录
- [ ] 点击"立即登录"
- [ ] 输入已注册的用户名和密码
- [ ] 点击"立即登录"
- [ ] 验证登录成功

### 3. 数据同步测试

#### 设置同步
- [ ] 登录后，修改主题（明亮/深色/护眼）
- [ ] 修改语言（简体/繁体/English）
- [ ] 修改字体大小
- [ ] 修改字体样式
- [ ] 修改行高
- [ ] 修改朗读速率
- [ ] 修改自定义背景色
- [ ] 修改主题色调
- [ ] 等待 5 秒（自动同步）
- [ ] 退出登录
- [ ] 重新登录
- [ ] 验证所有设置已恢复

#### 阅读进度同步
- [ ] 登录后，阅读某一章节
- [ ] 记录当前位置（书卷、章节、节数）
- [ ] 等待 5 秒
- [ ] 退出登录
- [ ] 重新登录
- [ ] 验证阅读位置已恢复

#### 书签同步
- [ ] 登录后，添加 3-5 个书签
- [ ] 等待 5 秒
- [ ] 退出登录
- [ ] 重新登录
- [ ] 进入"书签"页面
- [ ] 验证所有书签已恢复

#### 高亮同步
- [ ] 登录后，高亮 3-5 处经文（不同颜色）
- [ ] 等待 5 秒
- [ ] 退出登录
- [ ] 重新登录
- [ ] 验证所有高亮已恢复

#### 笔记同步
- [ ] 登录后，添加 3-5 条笔记
- [ ] 等待 5 秒
- [ ] 退出登录
- [ ] 重新登录
- [ ] 进入"笔记"页面
- [ ] 验证所有笔记已恢复

### 4. 多语言测试

#### 中文界面
- [ ] 切换到简体中文
- [ ] 验证所有界面文字为简体中文
- [ ] 验证登录/注册界面为中文
- [ ] 验证设置页面为中文
- [ ] 验证账号卡片文字为中文

#### 繁体中文界面
- [ ] 切换到繁体中文
- [ ] 验证所有界面文字为繁体中文
- [ ] 验证登录/注册界面为繁体中文

#### 英文界面
- [ ] 切换到 English
- [ ] 验证所有界面文字为英文
- [ ] 验证登录/注册界面为英文

### 5. 错误处理测试

- [ ] 尝试注册已存在的用户名
- [ ] 验证显示错误提示
- [ ] 尝试使用错误密码登录
- [ ] 验证显示错误提示
- [ ] 在未登录状态下修改设置
- [ ] 验证数据仅保存在本地
- [ ] 关闭后端服务器
- [ ] 尝试登录
- [ ] 验证显示网络错误

### 6. 性能测试

- [ ] 添加 50+ 书签
- [ ] 验证同步速度
- [ ] 添加 50+ 笔记
- [ ] 验证同步速度
- [ ] 验证界面流畅度

## 后端 API 测试

### 使用 curl 测试

#### 1. 注册
```bash
curl -X POST http://localhost:5001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"test123"}'
```

#### 2. 登录
```bash
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"test123"}'
```

#### 3. 获取用户配置（需要替换 TOKEN）
```bash
curl http://localhost:5001/api/user/profile \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

#### 4. 同步数据（需要替换 TOKEN）
```bash
curl -X POST http://localhost:5001/api/user/sync \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "settings": {
      "theme": "dark",
      "language": "zh-Hans",
      "fontSize": 20
    },
    "progress": {
      "bookIndex": 0,
      "chapterIndex": 1,
      "verseNum": 1
    },
    "bookmarks": [],
    "highlights": [],
    "notes": []
  }'
```

## 数据库验证

### 查看数据库内容
```bash
cd Holy-Server
sqlite3 holy.db

# 查看所有表
.tables

# 查看用户
SELECT * FROM users;

# 查看设置
SELECT * FROM settings;

# 查看书签
SELECT * FROM bookmarks;

# 查看高亮
SELECT * FROM highlights;

# 查看笔记
SELECT * FROM notes;

# 退出
.quit
```

## 已知问题和待优化项

- [ ] 添加数据冲突解决机制
- [ ] 添加离线模式支持
- [ ] 添加数据导出功能
- [ ] 添加忘记密码功能
- [ ] 优化同步频率（当前 5 秒可能过于频繁）
- [ ] 添加同步状态指示器
- [ ] 添加数据备份功能
