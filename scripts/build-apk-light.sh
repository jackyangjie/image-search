#!/bin/bash
# AI相册搜索APP - 轻量版APK打包（仅包含Chinese CLIP模型）

set -e

echo "=========================================="
echo "  SmartPhoto Search - 轻量版APK打包"
echo "  (仅包含 Chinese CLIP 模型)"
echo "=========================================="
echo ""

PROJECT_DIR="/home/yangjie/learn/image-search"
cd "$PROJECT_DIR"

# 创建临时轻量模型目录
LIGHT_MODEL_DIR="android/app/src/main/assets/models"
mkdir -p "$LIGHT_MODEL_DIR"

echo "📦 准备轻量模型..."

# 仅复制 Chinese CLIP 模型（719MB，比 SigLIP2 更小且支持中文）
if [ -d "assets/models/chinese-clip-base" ]; then
    echo "复制 Chinese CLIP 模型..."
    cp -r assets/models/chinese-clip-base "$LIGHT_MODEL_DIR/"
    MODEL_SIZE=$(du -sh "$LIGHT_MODEL_DIR/chinese-clip-base" | cut -f1)
    echo "✓ 模型已复制: $MODEL_SIZE"
else
    echo "✗ Chinese CLIP 模型不存在"
    exit 1
fi

echo ""
echo "🔨 开始构建 APK..."
cd android

# 构建 Debug APK
./gradlew assembleDebug --no-daemon

cd ..

# 检查构建结果
APK_PATH="android/app/build/outputs/apk/debug/app-debug.apk"
if [ -f "$APK_PATH" ]; then
    APK_SIZE=$(du -h "$APK_PATH" | cut -f1)
    echo ""
    echo "✅ APK 构建成功!"
    echo "   文件: $APK_PATH"
    echo "   大小: $APK_SIZE"
    echo ""
    
    # 复制到根目录
    cp "$APK_PATH" "./SmartPhoto-Search.apk"
    echo "   已复制到: ./SmartPhoto-Search.apk"
else
    echo "✗ APK 构建失败"
    exit 1
fi

echo ""
echo "=========================================="
echo "📱 安装说明"
echo "=========================================="
echo ""
echo "1. 连接手机并开启 USB 调试"
echo "2. 运行: adb install -r SmartPhoto-Search.apk"
echo "3. 打开应用并授予相册权限"
echo ""
echo "注意: 此版本仅包含 Chinese CLIP 模型（支持中文搜索）"
echo "      APK 大小约 750MB，确保手机有足够存储空间"
echo ""
