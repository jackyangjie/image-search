#!/bin/bash
# 将模型文件复制到设备文档目录（用于开发测试）

# 检查 adb 是否可用
if ! command -v adb &> /dev/null; then
    echo "adb not found, trying to find it..."
    export PATH="/usr/lib/android-sdk/platform-tools:$PATH"
fi

# 模型源目录
MODELS_DIR="$(dirname "$0")/../assets/models"

# Android 设备上的目标目录
DEVICE_DIR="/sdcard/Android/data/com.yourcompany.smartphoto/files/models"

echo "Creating directory on device..."
adb shell mkdir -p "$DEVICE_DIR"

echo "Copying models to device..."
adb push "$MODELS_DIR/mobileclip_s0_image.onnx" "$DEVICE_DIR/"
adb push "$MODELS_DIR/mobileclip_s0_text.onnx" "$DEVICE_DIR/"

echo "Done! Models copied to: $DEVICE_DIR"
