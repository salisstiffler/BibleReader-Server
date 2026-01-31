#!/bin/bash

# Holy Server API 测试脚本

echo "🧪 Holy Server API 测试"
echo "======================="
echo ""

API_URL="http://localhost:5001/api"
TEST_USER="testuser_$(date +%s)"
TEST_PASS="test123456"

echo "📝 测试用户信息："
echo "   用户名: $TEST_USER"
echo "   密码: $TEST_PASS"
echo ""

# 1. 测试注册
echo "1️⃣  测试用户注册..."
REGISTER_RESPONSE=$(curl -s -X POST "$API_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"$TEST_USER\",\"password\":\"$TEST_PASS\"}")

echo "   响应: $REGISTER_RESPONSE"

# 提取 token
TOKEN=$(echo $REGISTER_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
    echo "   ❌ 注册失败！"
    exit 1
else
    echo "   ✅ 注册成功！"
    echo "   Token: ${TOKEN:0:20}..."
fi
echo ""

# 2. 测试登录
echo "2️⃣  测试用户登录..."
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"$TEST_USER\",\"password\":\"$TEST_PASS\"}")

echo "   响应: $LOGIN_RESPONSE"

LOGIN_TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$LOGIN_TOKEN" ]; then
    echo "   ❌ 登录失败！"
    exit 1
else
    echo "   ✅ 登录成功！"
fi
echo ""

# 3. 测试获取用户配置
echo "3️⃣  测试获取用户配置..."
PROFILE_RESPONSE=$(curl -s "$API_URL/user/profile" \
  -H "Authorization: Bearer $TOKEN")

echo "   响应: $PROFILE_RESPONSE"

if echo "$PROFILE_RESPONSE" | grep -q "settings"; then
    echo "   ✅ 获取配置成功！"
else
    echo "   ❌ 获取配置失败！"
    exit 1
fi
echo ""

# 4. 测试数据同步
echo "4️⃣  测试数据同步..."
SYNC_DATA='{
  "settings": {
    "theme": "dark",
    "language": "zh-Hans",
    "fontSize": 20,
    "lineHeight": 1.8,
    "fontFamily": "serif",
    "customTheme": null,
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
  "bookmarks": [
    {
      "id": "gn 1:1",
      "bookId": "gn",
      "chapter": 1,
      "startVerse": 1,
      "endVerse": 1
    }
  ],
  "highlights": [
    {
      "id": "gn 1:2",
      "bookId": "gn",
      "chapter": 1,
      "startVerse": 2,
      "endVerse": 2,
      "color": "#fbbf24"
    }
  ],
  "notes": [
    {
      "id": "gn 1:3",
      "bookId": "gn",
      "chapter": 1,
      "startVerse": 3,
      "endVerse": 3,
      "text": "这是一条测试笔记"
    }
  ]
}'

SYNC_RESPONSE=$(curl -s -X POST "$API_URL/user/sync" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "$SYNC_DATA")

echo "   响应: $SYNC_RESPONSE"

if echo "$SYNC_RESPONSE" | grep -q "success"; then
    echo "   ✅ 数据同步成功！"
else
    echo "   ❌ 数据同步失败！"
    exit 1
fi
echo ""

# 5. 验证同步的数据
echo "5️⃣  验证同步的数据..."
VERIFY_RESPONSE=$(curl -s "$API_URL/user/profile" \
  -H "Authorization: Bearer $TOKEN")

echo "   响应: $VERIFY_RESPONSE"

if echo "$VERIFY_RESPONSE" | grep -q "dark" && \
   echo "$VERIFY_RESPONSE" | grep -q "gn 1:1" && \
   echo "$VERIFY_RESPONSE" | grep -q "测试笔记"; then
    echo "   ✅ 数据验证成功！"
else
    echo "   ❌ 数据验证失败！"
    exit 1
fi
echo ""

# 6. 测试错误登录
echo "6️⃣  测试错误密码登录..."
ERROR_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"$TEST_USER\",\"password\":\"wrongpassword\"}")

if echo "$ERROR_RESPONSE" | grep -q "error"; then
    echo "   ✅ 错误处理正常！"
else
    echo "   ❌ 错误处理异常！"
fi
echo ""

echo "🎉 所有测试完成！"
echo ""
echo "📊 测试总结："
echo "   ✅ 用户注册"
echo "   ✅ 用户登录"
echo "   ✅ 获取配置"
echo "   ✅ 数据同步"
echo "   ✅ 数据验证"
echo "   ✅ 错误处理"
echo ""
echo "💡 提示：可以使用以下命令查看数据库："
echo "   cd Holy-Server && sqlite3 holy.db"
echo "   SELECT * FROM users WHERE username='$TEST_USER';"
