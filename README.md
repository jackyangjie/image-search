# SmartPhoto Search - AI 相册搜索

基于 MobileCLIP 的本地智能相册搜索工具，支持自然语言描述搜索照片。

## 功能特性

- 🔍 **自然语言搜索** - 输入描述性文字快速找到照片
- 🏠 **完全本地处理** - AI推理和照片数据不上传云端
- 📸 **自动相册扫描** - 自动索引照片，支持增量更新
- 🔒 **隐私保护** - 无需网络权限，无需登录

## 技术栈

- React Native + TypeScript
- Expo SDK
- MobileCLIP (AI模型)
- SQLite (本地数据库)

## 构建说明

### 环境要求

- Node.js 18+
- npm 9+
- iOS: Xcode 15+ (仅 macOS)
- Android: Android Studio + SDK

### 安装依赖

```bash
npm install --legacy-peer-deps
```

### 启动开发服务器

```bash
npx expo start
```

### iOS 开发

```bash
npx expo run:ios
# 或
npx expo start --ios
```

### Android 开发

```bash
npx expo run:android
# 或
npx expo start --android
```

### 代码检查

```bash
# TypeScript 类型检查
npm run typecheck

# ESLint 检查
npm run lint
```

## 项目结构

```
src/
  api/          # API类型定义
  components/   # UI组件
  constants/    # 常量
  context/      # React Context状态管理
  navigation/   # 导航配置
  screens/      # 页面组件
  services/     # 业务服务层
  theme/        # 主题配置
  types/        # TypeScript类型
  utils/        # 工具函数
```

## 核心模块

### AIService

- 使用MobileCLIP进行图片和文本向量化
- 余弦相似度计算

### DBService

- SQLite本地数据库
- 照片元数据和向量存储
- 向量相似度搜索

### ScannerService

- 扫描本地相册
- AI向量化
- 缩略图生成

### SearchService

- 自然语言搜索
- 搜索历史管理

## 开发状态

- ✅ 项目初始化
- ✅ 数据库层 (SQLite)
- ✅ AI服务层（**ONNX Runtime + MobileCLIP-S0 真实推理**）
- ✅ 权限管理
- ✅ 权限引导页面
- ✅ 扫描服务
- ✅ 搜索服务
- ✅ UI组件
- ✅ 状态管理 (React Context)
- ✅ 页面组件 (Search, Gallery, PhotoDetail)
- ✅ 导航配置 (React Navigation)
- ✅ 错误边界处理
- ⏳ AsyncStorage 持久化
- ⏳ 性能优化
- ⏳ 测试覆盖

## 许可证

MIT
