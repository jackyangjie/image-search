# SmartPhoto Search - 安装问题排查指南

## 🚨 当前问题

APK 传输成功，但安装失败。错误提示："压缩包损坏"

## 🔍 可能原因

### 1. 文件传输问题

- APK 太大 (894MB)，传输过程中可能出错
- USB 连接不稳定
- 存储空间不足

### 2. APK 格式问题

- 构建过程中的问题
- 签名问题
- 文件损坏

### 3. 设备兼容性问题

- Android 版本不兼容
- 架构不匹配
- 安全限制

## ✅ 解决方案

### 方案 1: 直接在手机上安装

1. **传输文件到手机**:

   ```bash
   adb push SmartPhoto-Search-Release.apk /sdcard/Download/
   ```

2. **在手机上操作**:
   - 打开文件管理器
   - 进入 Download 文件夹
   - 长按 SmartPhoto-Search-Release.apk
   - 选择"安装"

### 方案 2: 使用 Split APK (App Bundle)

如果单 APK 太大，尝试构建 Split APK：

```bash
cd android
./gradlew bundleRelease
```

然后使用 bundletool 生成 Split APKs。

### 方案 3: 构建更小的 APK

#### 仅包含 arm64-v8a 架构

编辑 `android/app/build.gradle`:

```gradle
android {
    defaultConfig {
        ndk {
            abiFilters 'arm64-v8a'  // 只保留 arm64
        }
    }
}
```

#### 压缩模型文件

模型文件无法压缩，但可以：

- 使用更小的模型（SigLIP2 361MB）
- 下载后加载（首次启动从服务器下载）

### 方案 4: 使用 Debug 版本测试

Debug 版本较小 (273MB)，可能更容易安装：

```bash
adb install -r SmartPhoto-Search.apk  # Debug 版本
```

## 🔧 诊断命令

### 检查 APK 完整性

```bash
unzip -t SmartPhoto-Search-Release.apk
```

### 查看 APK 信息

```bash
# 需要安装 aapt
aapt dump badging SmartPhoto-Search-Release.apk
```

### 检查设备信息

```bash
# Android 版本
adb shell getprop ro.build.version.release

# SDK 版本
adb shell getprop ro.build.version.sdk

# 设备架构
adb shell getprop ro.product.cpu.abi

# 存储空间
adb shell df -h /data
```

### 尝试安装并查看详细错误

```bash
# 方式 1: pm install
adb shell pm install -r /data/local/tmp/SmartPhoto-Search-Release.apk

# 方式 2: cmd package
adb shell cmd package install -r /data/local/tmp/SmartPhoto-Search-Release.apk

# 方式 3: 带日志
adb logcat -s "PackageManager" | grep -i smartphoto
```

## 📝 建议操作步骤

### 步骤 1: 验证 APK 完整性

```bash
cd /home/yangjie/learn/image-search
unzip -t SmartPhoto-Search-Release.apk
```

如果显示 "No errors detected"，说明 APK 文件是完整的。

### 步骤 2: 检查设备兼容性

```bash
adb shell getprop ro.build.version.sdk
# 应该 >= 24 (Android 7.0)

adb shell getprop ro.product.cpu.abi
# 应该包含 arm64-v8a
```

### 步骤 3: 尝试安装

```bash
# 先复制到手机
adb push SmartPhoto-Search-Release.apk /sdcard/Download/

# 然后手动在手机上安装
# 或尝试：
adb install -r SmartPhoto-Search-Release.apk
```

### 步骤 4: 如果失败，查看日志

```bash
adb logcat -d | grep -i "install\|parse\|corrupt" | tail -20
```

## 🎯 备选方案

如果 Release APK 确实无法安装：

1. **使用 Debug APK** (273MB):

   ```bash
   adb install -r SmartPhoto-Search.apk
   ```

2. **通过无线调试安装**:

   ```bash
   # 开启无线调试后
   adb connect <ip>:5555
   adb install -r SmartPhoto-Search-Release.apk
   ```

3. **上传到网盘后手机下载安装**:
   - 上传到百度网盘/阿里云盘
   - 手机下载后安装

## 📊 当前状态

| 项目       | 状态                     |
| ---------- | ------------------------ |
| APK 完整性 | ✅ 通过验证              |
| 文件大小   | 894MB (正常)             |
| 签名       | ✅ 已签名                |
| 传输到手机 | ✅ 成功                  |
| 安装       | ❌ 失败 (提示压缩包损坏) |

## 🤔 可能的根本原因

经过分析，最可能的原因是：

1. **Android 15 (SDK 35) 的新安全限制**
   - Android 15 对 APK 安装有更严格的检查
   - 大文件 APK 可能需要额外处理

2. **SELinux 策略**
   - 从 /data/local/tmp/ 安装可能被限制
   - 需要特定的文件上下文

3. **APK 解压问题**
   - 某些设备对大文件 APK 解压有限制
   - 可能需要分包处理

## 💡 推荐解决方案

**立即尝试**:

1. 在手机上打开文件管理器
2. 找到 /sdcard/Download/SmartPhoto-Search-Release.apk
3. 点击安装
4. 允许"安装未知来源应用"

**如果仍失败**:
尝试构建 Debug 版本 (273MB)，它可能更容易安装。
