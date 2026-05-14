# SmartPhoto Search - 手机打包部署指南

## 📱 快速开始

本指南将帮助你将 AI 相册搜索应用打包成 APK 并安装到 Android 手机上进行测试。

## ✅ 前置要求

### 必需软件

| 软件        | 版本    | 用途                   |
| ----------- | ------- | ---------------------- |
| Node.js     | 18+     | 运行 React Native 构建 |
| Java JDK    | 17      | Android 构建必需       |
| Android SDK | API 33+ | Android 平台工具       |

### 检查环境

```bash
# 检查 Node.js
node --version  # 应显示 v18.x 或更高

# 检查 Java
java -version   # 应显示 17.x

# 检查 Android SDK
echo $ANDROID_HOME  # 应显示 SDK 路径
```

## 📦 打包步骤

### 方法 1: 使用打包脚本（推荐）

```bash
# 1. 进入项目目录
cd /home/yangjie/learn/image-search

# 2. 运行打包脚本
bash scripts/build-apk.sh
```

脚本会自动：

- ✅ 检查环境
- ✅ 检查模型文件
- ✅ 安装依赖
- ✅ 配置模型资源
- ✅ 构建 APK
- ✅ 输出安装说明

### 方法 2: 手动打包

```bash
# 1. 安装依赖
npm install --legacy-peer-deps

# 2. 配置模型资源
mkdir -p android/app/src/main/assets
ln -s "$(pwd)/assets/models" android/app/src/main/assets/models

# 3. 构建 Debug APK
cd android
./gradlew assembleDebug

# 4. APK 输出位置
# android/app/build/outputs/apk/debug/app-debug.apk
```

## 🔧 模型配置

### 当前可用模型

项目包含以下模型（已内置在 APK 中）：

| 模型             | 路径                                              | 大小  | 状态          |
| ---------------- | ------------------------------------------------- | ----- | ------------- |
| **Chinese CLIP** | `assets/models/chinese-clip-base/onnx/model.onnx` | 719MB | ✅ 完全可用   |
| **SigLIP2 Base** | `assets/models/siglip2-base/onnx/model_int8.onnx` | 361MB | ⚠️ 仅图片编码 |

### 模型加载逻辑

AIService 会自动扫描以下路径加载模型：

1. `${Paths.document.uri}models/` - 文档目录
2. `${Paths.bundle.uri}models/` - Bundle 目录
3. `file:///android_asset/models/` - Android 内置资源

构建时模型会被打包到 APK 的 `assets/models/` 目录，运行时会从 `android_asset` 路径加载。

## 📲 安装到手机

### 方式 1: ADB 安装（需要 USB 调试）

```bash
# 1. 连接手机并开启 USB 调试
adb devices  # 确认设备已连接

# 2. 安装 APK
adb install -r SmartPhoto-Search.apk

# 3. 查看日志
adb logcat -s "ReactNative" "AIService"  # 过滤相关日志
```

### 方式 2: 手动安装

1. 将 `SmartPhoto-Search.apk` 复制到手机
2. 在文件管理器中点击安装
3. 允许安装未知来源应用
4. 打开应用并授予相册权限

### 方式 3: 使用 Expo Go（开发测试）

```bash
# 启动开发服务器
npx expo start

# 扫描终端显示的二维码
# 或使用 Expo Go 应用打开
```

## 🧪 测试验证

### 1. 检查模型加载

打开应用后，在 Logcat 中查看日志：

```bash
adb logcat -s "AIService" | grep -E "(Model loaded|initialized|ONNX)"
```

预期输出：

```
AI Service initialized (chinese-clip)
Model loaded: chinese-clip from file:///android_asset/models/...
```

### 2. 测试搜索功能

1. 首次启动时点击"开始扫描"索引照片
2. 在搜索框输入中文描述（如"海边日落"）
3. 验证是否能返回相关照片

### 3. 模型降级测试

如果模型加载失败，AIService 会自动降级到 mock 模式：

```
ONNX Runtime not available, using mock mode
```

在 mock 模式下，应用可以运行但搜索结果基于随机向量。

## 📊 APK 大小优化

当前 APK 包含模型文件，大小约为：

| 组件              | 大小        |
| ----------------- | ----------- |
| 应用代码          | ~30MB       |
| Chinese CLIP 模型 | ~719MB      |
| **总计**          | **~750MB+** |

### 优化建议

1. **仅打包一个模型**：编辑 `scripts/build-apk.sh`，只链接需要的模型
2. **使用压缩**：模型文件可以在构建时压缩
3. **下载后加载**：首次启动时从服务器下载模型（需修改 AIService）

## 🔍 常见问题

### Q: 构建失败 "Could not find onnxruntime-react-native"

```bash
# 确保安装了依赖
npm install onnxruntime-react-native
cd android && ./gradlew clean
```

### Q: 模型文件未找到

```bash
# 检查模型是否正确链接
ls -la android/app/src/main/assets/models

# 应该是符号链接指向 assets/models/
```

### Q: 应用启动后闪退

```bash
# 查看崩溃日志
adb logcat -s "AndroidRuntime" | grep -i "exception\|error"

# 常见原因：
# 1. 模型文件太大导致 OOM
# 2. 权限未授予
# 3. ONNX Runtime 初始化失败
```

### Q: 搜索返回随机结果

检查日志确认模型是否正确加载：

```bash
adb logcat -s "AIService" | grep "modelType"

# 应该显示 "chinese-clip"
# 如果显示 "mock"，说明模型加载失败
```

## 🚀 生产构建

### Release APK

```bash
# 生成签名密钥
keytool -genkey -v -keystore my-release-key.keystore \
  -alias smartphoto -keyalg RSA -keysize 2048 -validity 10000

# 配置签名（android/app/build.gradle）
# ...

# 构建 Release
cd android
./gradlew assembleRelease
```

### AAB 格式（Google Play）

```bash
cd android
./gradlew bundleRelease
```

## 📋 检查清单

发布前确认：

- [ ] 模型文件已正确打包
- [ ] 应用能正常启动
- [ ] 相册权限可以正常获取
- [ ] 扫描功能正常工作
- [ ] 搜索功能返回正确结果
- [ ] 模型加载日志显示 "chinese-clip"
- [ ] 在目标设备上测试通过

## 🆘 获取帮助

如果遇到问题：

1. 查看日志：`adb logcat`
2. 检查文档：`doc/` 目录
3. 重新构建：`./gradlew clean && ./gradlew assembleDebug`

---

**注意**: 当前 APK 包含 719MB 的 Chinese CLIP 模型，确保手机有足够存储空间（建议预留 2GB+）。
