#!/bin/bash
# SmartPhoto Search - 安装修复脚本

echo "=========================================="
echo "  SmartPhoto Search - 安装修复"
echo "=========================================="
echo ""

APK_PATH="/home/yangjie/learn/image-search/SmartPhoto-Search-Release.apk"

# 检查设备连接
echo "1. 检查设备连接..."
adb devices

# 检查存储空间
echo ""
echo "2. 检查存储空间..."
adb shell df -h /data

# 清理可能的残留
echo ""
echo "3. 清理残留数据..."
adb shell pm clear com.yourcompany.smartphoto 2>/dev/null || true
adb shell pm uninstall com.yourcompany.smartphoto 2>/dev/null || true

# 推送到手机临时目录
echo ""
echo "4. 推送 APK 到手机..."
adb push "$APK_PATH" /sdcard/Download/SmartPhoto-Search.apk

# 使用 PackageInstaller 安装
echo ""
echo "5. 尝试安装..."
adb shell pm install -r /sdcard/Download/SmartPhoto-Search.apk

# 检查结果
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ 安装成功!"
    echo ""
    echo "启动应用..."
    adb shell am start -n com.yourcompany.smartphoto/.MainActivity
else
    echo ""
    echo "❌ 安装失败，尝试手动安装..."
    echo ""
    echo "请手动操作:"
    echo "1. 打开手机的文件管理器"
    echo "2. 进入 /sdcard/Download/"
    echo "3. 点击 SmartPhoto-Search.apk 安装"
fi
