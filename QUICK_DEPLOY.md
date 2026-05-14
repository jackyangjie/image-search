# SmartPhoto Search - 快速部署指南

## 📦 构建结果

APK 文件已生成：

- **文件名**: `SmartPhoto-Search.apk`
- **大小**: 273MB
- **位置**: `/home/yangjie/learn/image-search/SmartPhoto-Search.apk`

## 📱 手机安装步骤

### 方式 1: 使用 ADB（推荐）

```bash
# 1. 确保手机已连接并开启 USB 调试
adb devices

# 2. 安装 APK
adb install -r SmartPhoto-Search.apk

# 3. 查看应用日志（可选）
adb logcat -s "AIService" "ReactNative"
```

### 方式 2: 手动安装

1. 将 `SmartPhoto-Search.apk` 复制到手机
2. 在文件管理器中找到并点击安装
3. 允许"安装未知来源应用"（如提示）
4. 等待安装完成

## ✅ 使用测试

### 首次启动

1. **授予权限**: 应用会请求相册访问权限，请点击"允许"
2. **模型加载**: 启动时会自动加载 Chinese CLIP 模型（约 2-3 秒）
3. **扫描照片**: 点击"开始扫描"按钮索引照片
4. **搜索测试**: 在搜索框输入中文描述，如"海边日落"、"美食"、"人物"

### 验证模型工作正常

连接手机并查看日志：

```bash
adb logcat -s "AIService" | grep "modelType"
```

应该显示：

```
modelType: chinese-clip
```

如果显示 `mock`，说明模型加载失败，应用使用模拟模式。

## 🎯 包含的功能

- ✅ Chinese CLIP 模型（支持中文语义搜索）
- ✅ 本地相册扫描和索引
- ✅ 自然语言照片搜索
- ✅ 向量相似度计算
- ✅ ONNX Runtime 推理

## 📊 模型信息

| 模型         | 大小  | 语言支持 | 功能       |
| ------------ | ----- | -------- | ---------- |
| Chinese CLIP | 719MB | 中文     | 图文向量化 |

**注意**: SigLIP2 模型因太大未包含在此版本中。

## 🔧 重新构建

如需重新构建：

```bash
cd /home/yangjie/learn/image-search
bash scripts/build-apk.sh
```

## 🐛 常见问题

### Q: 安装失败"解析包时出现问题"

- 确保手机 Android 版本 >= 8.0
- 确保手机有足够存储空间（建议预留 1GB）

### Q: 应用闪退

- 查看日志：`adb logcat | grep AndroidRuntime`
- 常见原因：内存不足、权限未授予

### Q: 搜索返回随机结果

- 检查模型是否加载：`adb logcat -s "AIService"`
- 如果显示 "mock mode"，说明模型加载失败

### Q: 扫描找不到照片

- 确保已授予相册权限
- 检查照片是否在标准相册目录

## 📞 获取帮助

如果遇到问题：

1. 查看详细部署文档: `DEPLOY.md`
2. 查看应用日志: `adb logcat`
3. 检查文档目录: `doc/`

---

**构建时间**: 2025-04-10  
**版本**: 1.0.0  
**模型**: Chinese CLIP (ONNX)
