# SmartPhoto Search - 安装测试报告

## ✅ 安装状态

### APK 信息

- **文件**: SmartPhoto-Search.apk
- **大小**: ~750MB (包含 Chinese CLIP 模型 719MB)
- **包名**: com.yourcompany.smartphoto
- **安装状态**: ✅ 成功

### 模型打包状态

```
✅ assets/models/vocab.txt (109KB)
✅ assets/models/onnx/model.onnx (719MB)
```

## 📱 设备状态

### 已连接设备

```
设备ID: 39c6accc
状态: device (已连接)
```

### 应用运行状态

```
PID: 13702
包名: com.yourcompany.smartphoto
状态: 运行中
```

## 🧪 测试建议

由于 React Native Debug 版本需要 Metro 服务器连接，当前 APK 是 Debug 版本，需要以下步骤进行完整测试：

### 方式 1: 连接 Metro 服务器测试（推荐开发测试）

1. **启动 Metro 服务器**:

   ```bash
   cd /home/yangjie/learn/image-search
   npx expo start --tunnel
   ```

2. **在手机上打开应用**
   - 应用会自动连接到 Metro 服务器
   - 查看终端输出的 JavaScript 日志

3. **查看模型加载日志**:
   ```bash
   adb logcat -s "AIService"
   ```

### 方式 2: 构建 Release 版本（离线测试）

```bash
cd android
./gradlew assembleRelease
adb install -r app/build/outputs/apk/release/app-release.apk
```

## 🔍 验证模型加载

在 logcat 中查找以下日志：

```
# 成功加载
✅ "AI Service initialized (chinese-clip)"
✅ "Model loaded: chinese-clip from file:///android_asset/models/..."

# 失败降级
⚠️ "ONNX Runtime not available, using mock mode"
⚠️ "Falling back to mock mode"
```

## 📝 已知限制

1. **Debug APK**: 当前是 Debug 版本，需要 Metro 服务器或构建 Release 版本
2. **模型大小**: Chinese CLIP 模型 719MB，首次加载可能需要 5-10 秒
3. **内存需求**: 建议手机内存 4GB+，预留 2GB 存储空间

## 🎯 下一步操作

### 选项 A: 在手机上直接使用

应用已安装，可以从应用列表启动，但可能卡在等待 Metro 服务器。

### 选项 B: 启动开发服务器测试

```bash
npx expo start --tunnel
# 然后手机上点击"Reload"
```

### 选项 C: 构建 Release 版本

```bash
cd android
./gradlew assembleRelease
adb install -r app/build/outputs/apk/release/app-release.apk
```

## 📊 打包配置确认

| 配置项            | 状态                          |
| ----------------- | ----------------------------- |
| ONNX Runtime      | ✅ 已包含 (libonnxruntime.so) |
| Chinese CLIP 模型 | ✅ 已打包 (719MB)             |
| Metro 配置        | ✅ 支持 .onnx 文件            |
| 模型加载路径      | ✅ 扫描 android_asset         |

## 📞 手动验证命令

```bash
# 查看应用日志
adb logcat -s "AIService" "ReactNative" "System.err"

# 查看模型文件
adb shell run-as com.yourcompany.smartphoto ls -la

# 重新启动应用
adb shell am force-stop com.yourcompany.smartphoto
adb shell am start -n com.yourcompany.smartphoto/.MainActivity

# 卸载应用
adb uninstall com.yourcompany.smartphoto
```

---

**结论**: APK 构建和安装成功，模型文件已正确打包。要进行完整功能测试，建议启动 Metro 服务器或构建 Release 版本。
