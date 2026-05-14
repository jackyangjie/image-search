#!/bin/bash
# AI相册搜索APP - 本地APK打包脚本
# 用于将模型打包到APK中

set -e

echo "=========================================="
echo "  SmartPhoto Search - 本地APK打包"
echo "=========================================="
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查环境
check_environment() {
    echo "🔍 检查打包环境..."
    
    # 检查 Node.js
    if ! command -v node &> /dev/null; then
        echo -e "${RED}✗ Node.js 未安装${NC}"
        exit 1
    fi
    echo -e "${GREEN}✓ Node.js: $(node --version)${NC}"
    
    # 检查 Java
    if ! command -v java &> /dev/null; then
        echo -e "${RED}✗ Java 未安装${NC}"
        exit 1
    fi
    echo -e "${GREEN}✓ Java: $(java -version 2>&1 | head -n 1)${NC}"
    
    # 检查 Android SDK
    if [ -z "$ANDROID_HOME" ] && [ -z "$ANDROID_SDK_ROOT" ]; then
        echo -e "${YELLOW}⚠ ANDROID_HOME 未设置${NC}"
        echo "  请设置 Android SDK 路径:"
        echo "  export ANDROID_HOME=/path/to/android/sdk"
    else
        echo -e "${GREEN}✓ Android SDK 已配置${NC}"
    fi
    
    echo ""
}

# 检查模型文件
check_models() {
    echo "🔍 检查模型文件..."
    
    MODEL_DIR="assets/models"
    
    if [ ! -d "$MODEL_DIR" ]; then
        echo -e "${RED}✗ 模型目录不存在: $MODEL_DIR${NC}"
        exit 1
    fi
    
    # 检查 Chinese CLIP 模型
    if [ -f "$MODEL_DIR/chinese-clip-base/onnx/model.onnx" ]; then
        MODEL_SIZE=$(du -h "$MODEL_DIR/chinese-clip-base/onnx/model.onnx" | cut -f1)
        echo -e "${GREEN}✓ Chinese CLIP 模型: $MODEL_SIZE${NC}"
    else
        echo -e "${YELLOW}⚠ Chinese CLIP 模型不存在${NC}"
    fi
    
    # 检查 SigLIP2 模型
    if [ -f "$MODEL_DIR/siglip2-base/onnx/model_int8.onnx" ]; then
        MODEL_SIZE=$(du -h "$MODEL_DIR/siglip2-base/onnx/model_int8.onnx" | cut -f1)
        echo -e "${GREEN}✓ SigLIP2 模型: $MODEL_SIZE${NC}"
    else
        echo -e "${YELLOW}⚠ SigLIP2 模型不存在${NC}"
    fi
    
    echo ""
}

# 安装依赖
install_dependencies() {
    echo "📦 安装依赖..."
    
    if [ ! -d "node_modules" ]; then
        echo "  运行 npm install..."
        npm install --legacy-peer-deps
    else
        echo -e "${GREEN}✓ 依赖已安装${NC}"
    fi
    
    echo ""
}

# 创建模型目录链接（用于 Android 构建）
setup_model_assets() {
    echo "🔗 配置模型资源..."
    
    # Android 构建时会自动包含 assets/ 目录下的文件
    # 这些文件会在运行时通过 AssetManager 访问
    
    ANDROID_ASSETS="android/app/src/main/assets"
    
    if [ ! -d "$ANDROID_ASSETS" ]; then
        mkdir -p "$ANDROID_ASSETS"
    fi
    
    # 清理旧的模型链接
    if [ -L "$ANDROID_ASSETS/models" ]; then
        rm "$ANDROID_ASSETS/models"
    fi
    
    # 创建符号链接（或者复制文件）
    # 为了打包速度，使用符号链接
    if [ ! -L "$ANDROID_ASSETS/models" ]; then
        ln -s "$(pwd)/assets/models" "$ANDROID_ASSETS/models"
        echo -e "${GREEN}✓ 模型资源链接已创建${NC}"
    fi
    
    echo ""
}

# 构建 APK
build_apk() {
    echo "🔨 开始构建 APK..."
    echo ""
    
    BUILD_TYPE=${1:-debug}
    
    if [ "$BUILD_TYPE" = "release" ]; then
        echo "构建 Release APK..."
        cd android
        ./gradlew assembleRelease
        cd ..
        
        APK_PATH="android/app/build/outputs/apk/release/app-release.apk"
    else
        echo "构建 Debug APK..."
        cd android
        ./gradlew assembleDebug
        cd ..
        
        APK_PATH="android/app/build/outputs/apk/debug/app-debug.apk"
    fi
    
    if [ -f "$APK_PATH" ]; then
        APK_SIZE=$(du -h "$APK_PATH" | cut -f1)
        echo ""
        echo -e "${GREEN}✅ APK 构建成功!${NC}"
        echo -e "${GREEN}   文件: $APK_PATH${NC}"
        echo -e "${GREEN}   大小: $APK_SIZE${NC}"
        echo ""
        
        # 复制到项目根目录方便查找
        cp "$APK_PATH" "./SmartPhoto-Search.apk"
        echo -e "${GREEN}   已复制到: ./SmartPhoto-Search.apk${NC}"
    else
        echo -e "${RED}✗ APK 构建失败${NC}"
        exit 1
    fi
    
    echo ""
}

# 显示安装说明
show_install_instructions() {
    echo "=========================================="
    echo "  📱 安装说明"
    echo "=========================================="
    echo ""
    echo "1. 将 APK 文件传输到手机:"
    echo "   adb install -r SmartPhoto-Search.apk"
    echo "   或通过文件管理器安装"
    echo ""
    echo "2. 安装前需要:"
    echo "   - 允许安装未知来源应用"
    echo "   - 授予相册访问权限"
    echo ""
    echo "3. 模型加载说明:"
    echo "   - 首次启动时会自动加载 Chinese CLIP 模型"
    echo "   - 模型已打包在 APK 中，无需额外下载"
    echo ""
    echo "=========================================="
}

# 主流程
main() {
    check_environment
    check_models
    install_dependencies
    setup_model_assets
    
    # 询问构建类型
    echo "选择构建类型:"
    echo "1) Debug (推荐测试使用)"
    echo "2) Release (发布使用)"
    read -p "请选择 [1-2, 默认1]: " choice
    
    case $choice in
        2)
            build_apk release
            ;;
        *)
            build_apk debug
            ;;
    esac
    
    show_install_instructions
}

# 运行
main
