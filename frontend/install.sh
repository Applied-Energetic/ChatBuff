#!/bin/bash

# ChatBuff 前端安装脚本

echo "🚀 开始安装 ChatBuff 前端依赖..."
echo ""

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "❌ 未检测到 Node.js，请先安装 Node.js"
    exit 1
fi

echo "✅ Node.js 版本: $(node --version)"
echo "✅ npm 版本: $(npm --version)"
echo ""

# 安装依赖
echo "📦 安装依赖中..."
npm install

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ 依赖安装完成！"
    echo ""
    echo "📝 接下来的步骤："
    echo ""
    echo "1️⃣  启动开发服务器:"
    echo "   npm run dev"
    echo ""
    echo "2️⃣  访问应用:"
    echo "   http://localhost:3000"
    echo ""
    echo "3️⃣  构建生产版本:"
    echo "   npm run build"
    echo ""
else
    echo "❌ 安装失败，请检查网络连接"
    exit 1
fi
