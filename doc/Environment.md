# AI 相册搜索 APP - 环境配置说明

## 文档信息

| 属性 | 值 |
|------|-----|
| 版本 | v1.0 |
| 最后更新 | 2026-04-04 |
| 作者 | AI助手 |

---

## 目录

1. [开发环境](#1-开发环境)
2. [环境变量](#2-环境变量)
3. [多环境配置](#3-多环境配置)
4. [CI/CD 配置](#4-cicd-配置)
5. [模型文件管理](#5-模型文件管理)
6. [调试配置](#6-调试配置)
7. [生产环境检查清单](#7-生产环境检查清单)
8. [快速开始](#8-快速开始)

---

## 1. 开发环境

### 1.1 系统要求

| 组件 | 最低版本 | 推荐版本 |
|------|---------|---------|
| Node.js | 18.0.0 | 20.x LTS |
| npm | 9.0.0 | 10.x |
| Python | 3.9 | 3.11 |
| Git | 2.30 | 2.40+ |
| Xcode | 15.0 | 15.2+ |
| Android Studio | 2023.1 | 2023.2+ |
| JDK | 17 | 17 |
| CocoaPods | 1.12 | 1.14+ |

### 1.2 安装步骤

```bash
# 1. 安装 Node.js (使用 nvm)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 20
nvm use 20
nvm alias default 20

# 2. 安装全局工具
npm install -g expo-cli @react-native-community/cli

# 3. 安装 Python 依赖
pip install onnx numpy pillow

# 4. iOS 开发环境 (Mac)
sudo gem install cocoapods
xcode-select --install

# 5. Android 开发环境
# 下载 Android Studio
# 安装 SDK: Android 13 (API 33), Android SDK Platform-Tools
# 配置环境变量
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/platform-tools
```

### 1.3 项目初始化

```bash
# 克隆项目
git clone https://github.com/your-org/smart-photo-search.git
cd smart-photo-search

# 安装依赖
npm install

# iOS 额外步骤
cd ios && pod install && cd ..

# 复制环境变量模板
cp .env.example .env

# 下载 AI 模型
npm run download-models
```

---

## 2. 环境变量

### 2.1 环境变量文件

```
├── .env                    # 默认环境变量
├── .env.development        # 开发环境
├── .env.staging            # 测试环境
├── .env.production         # 生产环境
└── .env.example            # 示例文件（提交到 Git）
```

### 2.2 必需环境变量

```bash
# .env.example

# ========== 基础配置 ==========
# 环境标识: development | staging | production
ENV=development

# 应用信息
APP_NAME=SmartPhoto
APP_VERSION=1.0.0
APP_BUNDLE_ID=com.yourcompany.smartphoto

# ========== 功能开关 ==========
# 数据分析
ENABLE_ANALYTICS=false

# 崩溃上报
ENABLE_CRASH_REPORTING=false

# 自动更新检查
ENABLE_AUTO_UPDATE=false

# 调试模式
DEBUG_MODE=true

# ========== AI 配置 ==========
# 模型存储路径（相对于应用目录）
AI_MODEL_PATH=./assets/models

# 启动时预热模型
AI_WARMUP_ON_START=true

# AI 批处理大小
AI_BATCH_SIZE=5

# 最大并发数
AI_MAX_CONCURRENT=2

# ========== 性能配置 ==========
# 每页加载照片数
PHOTO_PAGE_SIZE=50

# 搜索结果限制
SEARCH_RESULTS_LIMIT=20

# 缩略图尺寸
THUMBNAIL_SIZE=300

# 缩略图质量 (0-1)
THUMBNAIL_QUALITY=0.85

# 最大缓存大小 (MB)
MAX_CACHE_SIZE_MB=500

# ========== 数据库配置 ==========
# 数据库名称
DATABASE_NAME=smartphoto.db

# ========== 存储配置 ==========
# 缩略图缓存目录
THUMBNAIL_CACHE_DIR=./cache/thumbnails

# 向量缓存目录
VECTOR_CACHE_DIR=./cache/vectors

# 搜索历史限制
SEARCH_HISTORY_LIMIT=50
```

### 2.3 环境变量加载

```typescript
// src/config/env.ts
import { NativeModules } from 'react-native';

interface EnvVariables {
  ENV: string;
  APP_NAME: string;
  APP_VERSION: string;
  ENABLE_ANALYTICS: boolean;
  DEBUG_MODE: boolean;
  // ... 其他变量
}

// 开发环境：从 process.env 读取
// 生产环境：从原生模块读取（需要配置）
export const env: EnvVariables = {
  ENV: __DEV__ ? 'development' : 'production',
  APP_NAME: 'SmartPhoto',
  APP_VERSION: '1.0.0',
  ENABLE_ANALYTICS: __DEV__ ? false : true,
  DEBUG_MODE: __DEV__,
  // ...
};
```

---

## 3. 多环境配置

### 3.1 环境枚举

```typescript
// src/config/environment.ts
export enum Environment {
  DEVELOPMENT = 'development',
  STAGING = 'staging',
  PRODUCTION = 'production',
}

export const currentEnv: Environment =
  (process.env.ENV as Environment) || Environment.DEVELOPMENT;

export const isDev = currentEnv === Environment.DEVELOPMENT;
export const isStaging = currentEnv === Environment.STAGING;
export const isProd = currentEnv === Environment.PRODUCTION;
```

### 3.2 环境特定配置

```typescript
// src/config/environment.ts
import RNFS from 'react-native-fs';

interface EnvironmentConfig {
  // 基础
  ENV: Environment;
  APP_NAME: string;
  APP_VERSION: string;
  API_BASE_URL: string;

  // 功能开关
  ENABLE_ANALYTICS: boolean;
  ENABLE_CRASH_REPORTING: boolean;
  ENABLE_AUTO_UPDATE: boolean;
  ENABLE_CLOUD_BACKUP: boolean;

  // AI 配置
  AI_MODEL_PATH: string;
  AI_WARMUP_ON_START: boolean;
  AI_BATCH_SIZE: number;
  AI_MAX_CONCURRENT: number;

  // 性能
  PHOTO_PAGE_SIZE: number;
  SEARCH_RESULTS_LIMIT: number;
  THUMBNAIL_SIZE: number;
  THUMBNAIL_QUALITY: number;
  MAX_CACHE_SIZE_MB: number;

  // 存储
  DATABASE_NAME: string;
  DATABASE_LOCATION: string;
  THUMBNAIL_CACHE_DIR: string;
  VECTOR_CACHE_DIR: string;
  THUMBNAIL_CACHE_SIZE: string;
  VECTOR_CACHE_SIZE: string;
  SEARCH_HISTORY_LIMIT: number;
}

// 开发环境配置
export const developmentConfig: EnvironmentConfig = {
  // 基础
  ENV: Environment.DEVELOPMENT,
  APP_NAME: 'SmartPhoto Dev',
  APP_VERSION: '1.0.0-dev',
  API_BASE_URL: 'http://localhost:3000',

  // 功能开关
  ENABLE_ANALYTICS: false,
  ENABLE_CRASH_REPORTING: false,
  ENABLE_AUTO_UPDATE: false,
  ENABLE_CLOUD_BACKUP: false,

  // AI 配置
  AI_MODEL_PATH: `${RNFS.DocumentDirectoryPath}/models`,
  AI_WARMUP_ON_START: false,  // 开发环境不预热
  AI_BATCH_SIZE: 3,           // 较小的批次
  AI_MAX_CONCURRENT: 1,       // 单并发

  // 性能
  PHOTO_PAGE_SIZE: 20,        // 较小分页
  SEARCH_RESULTS_LIMIT: 10,
  THUMBNAIL_SIZE: 200,        // 较小缩略图
  THUMBNAIL_QUALITY: 0.8,
  MAX_CACHE_SIZE_MB: 100,     // 较小缓存

  // 存储
  DATABASE_NAME: 'smartphoto_dev.db',
  DATABASE_LOCATION: 'default',
  THUMBNAIL_CACHE_DIR: `${RNFS.CachesDirectoryPath}/thumbnails_dev`,
  VECTOR_CACHE_DIR: `${RNFS.CachesDirectoryPath}/vectors_dev`,
  THUMBNAIL_CACHE_SIZE: '50MB',
  VECTOR_CACHE_SIZE: '20MB',
  SEARCH_HISTORY_LIMIT: 20,
};

// 测试环境配置
export const stagingConfig: EnvironmentConfig = {
  // 基础
  ENV: Environment.STAGING,
  APP_NAME: 'SmartPhoto Beta',
  APP_VERSION: '1.0.0-beta',
  API_BASE_URL: 'https://staging-api.smartphoto.app',

  // 功能开关
  ENABLE_ANALYTICS: true,
  ENABLE_CRASH_REPORTING: true,
  ENABLE_AUTO_UPDATE: true,
  ENABLE_CLOUD_BACKUP: false,

  // AI 配置
  AI_MODEL_PATH: `${RNFS.DocumentDirectoryPath}/models`,
  AI_WARMUP_ON_START: true,
  AI_BATCH_SIZE: 5,
  AI_MAX_CONCURRENT: 2,

  // 性能
  PHOTO_PAGE_SIZE: 50,
  SEARCH_RESULTS_LIMIT: 20,
  THUMBNAIL_SIZE: 300,
  THUMBNAIL_QUALITY: 0.85,
  MAX_CACHE_SIZE_MB: 300,

  // 存储
  DATABASE_NAME: 'smartphoto_staging.db',
  DATABASE_LOCATION: 'default',
  THUMBNAIL_CACHE_DIR: `${RNFS.CachesDirectoryPath}/thumbnails`,
  VECTOR_CACHE_DIR: `${RNFS.CachesDirectoryPath}/vectors`,
  THUMBNAIL_CACHE_SIZE: '150MB',
  VECTOR_CACHE_SIZE: '50MB',
  SEARCH_HISTORY_LIMIT: 50,
};

// 生产环境配置
export const productionConfig: EnvironmentConfig = {
  // 基础
  ENV: Environment.PRODUCTION,
  APP_NAME: 'SmartPhoto',
  APP_VERSION: '1.0.0',
  API_BASE_URL: 'https://api.smartphoto.app',

  // 功能开关
  ENABLE_ANALYTICS: true,
  ENABLE_CRASH_REPORTING: true,
  ENABLE_AUTO_UPDATE: true,
  ENABLE_CLOUD_BACKUP: false,

  // AI 配置
  AI_MODEL_PATH: `${RNFS.DocumentDirectoryPath}/models`,
  AI_WARMUP_ON_START: true,
  AI_BATCH_SIZE: 5,
  AI_MAX_CONCURRENT: 1,

  // 性能
  PHOTO_PAGE_SIZE: 50,
  SEARCH_RESULTS_LIMIT: 20,
  THUMBNAIL_SIZE: 300,
  THUMBNAIL_QUALITY: 0.85,
  MAX_CACHE_SIZE_MB: 500,

  // 存储
  DATABASE_NAME: 'smartphoto.db',
  DATABASE_LOCATION: 'default',
  THUMBNAIL_CACHE_DIR: `${RNFS.CachesDirectoryPath}/thumbnails`,
  VECTOR_CACHE_DIR: `${RNFS.CachesDirectoryPath}/vectors`,
  THUMBNAIL_CACHE_SIZE: '200MB',
  VECTOR_CACHE_SIZE: '100MB',
  SEARCH_HISTORY_LIMIT: 50,
};

// 根据环境获取配置
export function getEnvConfig(): EnvironmentConfig {
  switch (currentEnv) {
    case Environment.DEVELOPMENT:
      return developmentConfig;
    case Environment.STAGING:
      return stagingConfig;
    case Environment.PRODUCTION:
      return productionConfig;
    default:
      return developmentConfig;
  }
}

// 导出当前环境配置
export const config = getEnvConfig();
```

### 3.3 环境变量文件

```bash
# .env (开发环境)
ENV=development
API_BASE_URL=http://localhost:3000
ENABLE_ANALYTICS=false
DEBUG_MODE=true

# .env.production (生产环境)
ENV=production
API_BASE_URL=https://api.smartphoto.app
ENABLE_ANALYTICS=true
DEBUG_MODE=false
```

### 3.4 平台特定配置

```typescript
// config/platform.ts
import { Platform } from 'react-native';

interface PlatformConfig {
  photoDirectory: string;
  maxConcurrentScans: number;
  supportsBackgroundIndexing: boolean;
  minMemoryRequiredMB: number;
}

const androidConfig: PlatformConfig = {
  photoDirectory: '/storage/emulated/0/DCIM',
  maxConcurrentScans: 3,
  supportsBackgroundIndexing: true,
  minMemoryRequiredMB: 512,
};

const iosConfig: PlatformConfig = {
  photoDirectory: '', // iOS 使用 Photos API
  maxConcurrentScans: 2,
  supportsBackgroundIndexing: false,
  minMemoryRequiredMB: 1024,
};

export const platformConfig: PlatformConfig = Platform.select({
  android: androidConfig,
  ios: iosConfig,
  default: androidConfig,
});
```

---

## 4. CI/CD 配置

### 4.1 GitHub Actions

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  lint-and-test:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run ESLint
        run: npm run lint

      - name: Run TypeScript check
        run: npm run typecheck

      - name: Run tests
        run: npm test -- --coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v3

  build-android:
    runs-on: ubuntu-latest
    needs: lint-and-test

    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Setup JDK
        uses: actions/setup-java@v3
        with:
          java-version: '17'
          distribution: 'temurin'

      - name: Install dependencies
        run: npm ci

      - name: Build Android
        run: cd android && ./gradlew assembleRelease

      - name: Upload APK
        uses: actions/upload-artifact@v3
        with:
          name: android-apk
          path: android/app/build/outputs/apk/release/*.apk

  build-ios:
    runs-on: macos-latest
    needs: lint-and-test

    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Install CocoaPods
        run: cd ios && pod install

      - name: Build iOS
        run: |
          cd ios
          xcodebuild -workspace SmartPhoto.xcworkspace \
            -scheme SmartPhoto \
            -configuration Release \
            -destination 'generic/platform=iOS' \
            build
```

### 4.2 EAS Build 配置

```json
// eas.json
{
  "cli": {
    "version": ">= 7.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "env": {
        "ENV": "development",
        "DEBUG_MODE": "true"
      }
    },
    "preview": {
      "distribution": "internal",
      "env": {
        "ENV": "staging",
        "DEBUG_MODE": "false"
      },
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "env": {
        "ENV": "production",
        "DEBUG_MODE": "false"
      },
      "android": {
        "buildType": "app-bundle"
      },
      "ios": {
        "enterpriseProvisioning": "adhoc"
      }
    }
  },
  "submit": {
    "production": {
      "android": {
        "serviceAccountKeyPath": "./path/to/service-account.json",
        "track": "production"
      },
      "ios": {
        "ascAppId": "1234567890",
        "ascAppleId": "your-apple-id@example.com",
        "ascAppSpecificPassword": "app-specific-password"
      }
    }
  }
}
```

---

## 5. 模型文件管理

### 5.1 模型下载脚本

```bash
#!/bin/bash
# scripts/download-models.sh

MODEL_DIR="assets/models"
MODEL_URL="https://models.smartphoto.app"

mkdir -p $MODEL_DIR

# MobileCLIP Vision Model
if [ ! -f "$MODEL_DIR/mobileclip_vision.onnx" ]; then
    echo "Downloading MobileCLIP vision model..."
    curl -L "$MODEL_URL/mobileclip_vision.onnx" -o "$MODEL_DIR/mobileclip_vision.onnx"
fi

# MobileCLIP Text Model
if [ ! -f "$MODEL_DIR/mobileclip_text.onnx" ]; then
    echo "Downloading MobileCLIP text model..."
    curl -L "$MODEL_URL/mobileclip_text.onnx" -o "$MODEL_DIR/mobileclip_text.onnx"
fi

echo "Models downloaded successfully!"

# 验证模型完整性
md5sum $MODEL_DIR/*.onnx > $MODEL_DIR/checksum.md5
```

### 5.2 模型配置

```typescript
// config/models.ts
export interface ModelConfig {
  name: string;
  filename: string;
  size: number;           // 字节
  md5: string;            // 校验值
  inputShape: number[];   // 输入维度
  outputShape: number[];  // 输出维度
  quantization: 'fp32' | 'fp16' | 'int8';
}

export const models: ModelConfig[] = [
  {
    name: 'MobileCLIP Vision',
    filename: 'mobileclip_vision.onnx',
    size: 40 * 1024 * 1024,  // 40MB
    md5: 'a1b2c3d4e5f6...',
    inputShape: [1, 3, 224, 224],
    outputShape: [1, 512],
    quantization: 'int8',
  },
  {
    name: 'MobileCLIP Text',
    filename: 'mobileclip_text.onnx',
    size: 20 * 1024 * 1024,  // 20MB
    md5: 'f6e5d4c3b2a1...',
    inputShape: [1, 77],
    outputShape: [1, 512],
    quantization: 'int8',
  },
];

// 模型下载 URL
export const MODEL_BASE_URL = 'https://models.smartphoto.app/v1';
```

---

## 6. 调试配置

### 6.1 React Native Debugger

```bash
# 启动 Metro bundler
npm start

# 启动 Flipper (调试工具)
npx flipper

# iOS 调试
npx react-native run-ios --simulator="iPhone 15 Pro"

# Android 调试
npx react-native run-android --variant=debug

# 启用 Hermes 调试
npm run start:hermes
```

### 6.2 开发服务器代理

```typescript
// metro.config.js
const { getDefaultConfig } = require('@react-native/metro-config');

module.exports = (async () => {
  const defaultConfig = await getDefaultConfig(__dirname);

  return {
    ...defaultConfig,
    server: {
      enhanceMiddleware: (middleware) => {
        return (req, res, next) => {
          // 添加 CORS 头
          if (req.url.startsWith('/api')) {
            res.setHeader('Access-Control-Allow-Origin', '*');
          }
          return middleware(req, res, next);
        };
      },
    },
    resolver: {
      assetExts: [...defaultConfig.resolver.assetExts, 'onnx', 'tflite'],
    },
  };
})();
```

---

## 7. 生产环境检查清单

### 7.1 发布前检查

```markdown
## Android 发布检查清单

- [ ] 更新 versionCode 和 versionName
- [ ] 配置签名密钥 (android/app/build.gradle)
- [ ] 启用 ProGuard 混淆 (可选)
- [ ] 检查权限声明 (AndroidManifest.xml)
- [ ] 生成发布 APK/App Bundle
- [ ] 测试发布版本
- [ ] 更新隐私政策
- [ ] 准备应用商店截图
- [ ] 准备应用描述

## iOS 发布检查清单

- [ ] 更新版本号和构建号
- [ ] 配置签名证书和描述文件
- [ ] 启用 Bitcode (如果需要)
- [ ] 检查权限描述 (Info.plist)
- [ ] 配置应用图标和启动图
- [ ] 归档并验证
- [ ] 上传到 App Store Connect
- [ ] 准备应用审核信息
- [ ] 测试 TestFlight 版本
```

### 7.2 环境验证脚本

```typescript
// scripts/validate-env.ts
import { config } from '../src/config/environment';

function validateEnvironment(): void {
  console.log('🔍 Validating environment...\n');

  // 检查必需配置
  const requiredFields = [
    'ENV',
    'APP_NAME',
    'APP_VERSION',
    'DATABASE_NAME',
  ];

  const missing = requiredFields.filter(field => !config[field as keyof typeof config]);

  if (missing.length > 0) {
    console.error('❌ Missing required configuration:');
    missing.forEach(field => console.error(`   - ${field}`));
    process.exit(1);
  }

  // 检查模型文件
  console.log('✓ Required configuration present');

  // 检查功能开关
  console.log(`\n📊 Environment: ${config.ENV}`);
  console.log(`🤖 AI Model Path: ${config.AI_MODEL_PATH}`);
  console.log(`📱 Page Size: ${config.PHOTO_PAGE_SIZE}`);
  console.log(`🔍 Search Limit: ${config.SEARCH_RESULTS_LIMIT}`);
  console.log(`📊 Analytics: ${config.ENABLE_ANALYTICS ? 'Enabled' : 'Disabled'}`);

  console.log('\n✅ Environment validation passed!');
}

validateEnvironment();
```

---

## 8. 快速开始

### 8.1 首次设置

```bash
# 1. 克隆仓库
git clone https://github.com/your-org/smart-photo-search.git
cd smart-photo-search

# 2. 安装依赖
npm install

# 3. 下载模型文件
npm run download-models

# 4. 配置环境
npm run setup:dev

# 5. 启动开发服务器
npm run ios     # iOS
npm run android # Android
```

### 8.2 常用命令速查

```bash
# 开发
npm start              # 启动 Metro
npm run ios            # 运行 iOS
npm run android        # 运行 Android
npm run ios --device   # 运行到真机

# 测试
npm test               # 运行单元测试
npm run test:e2e       # 运行 E2E 测试
npm run lint           # 运行 ESLint
npm run typecheck      # 运行 TypeScript 检查

# 构建
npm run build:android  # 构建 Android
npm run build:ios      # 构建 iOS
npm run build:prod     # 生产构建

# 发布
npm run release        # 发布新版本
npm run version        # 更新版本号
```

---

**文档版本**: v1.0  
**最后更新**: 2026-04-04  
**作者**: AI助手
