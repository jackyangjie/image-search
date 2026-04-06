# AI 相册搜索 APP - 技术规格文档

## 1. 技术架构

### 1.1 整体架构

```
┌─────────────────────────────────────────────────────────┐
│                    React Native APP                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐ │
│  │  Search UI  │  │ Gallery UI  │  │  Scanner UI     │ │
│  └──────┬──────┘  └──────┬──────┘  └────────┬────────┘ │
│         │                │                   │          │
│  ┌──────┴────────────────┴───────────────────┴────────┐ │
│  │                  Services Layer                    │ │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────────────┐   │ │
│  │  │AIService │ │DBService │ │ ScannerService   │   │ │
│  │  └────┬─────┘ └────┬─────┘ └────────┬─────────┘   │ │
│  └───────┼────────────┼────────────────┼─────────────┘ │
└──────────┼────────────┼────────────────┼───────────────┘
           │            │                │
┌──────────┼────────────┼────────────────┼───────────────┐
│          ▼            ▼                ▼               │
│  ┌──────────────┐ ┌──────────┐ ┌──────────────────┐   │
│  │ ONNX Runtime │ │ SQLite   │ │  Media Library   │   │
│  │ MobileCLIP   │ │ Vector   │ │  (Photo Access)  │   │
│  └──────────────┘ └──────────┘ └──────────────────┘   │
│                      Native Modules                     │
└─────────────────────────────────────────────────────────┘
```

### 1.2 技术选型对比

| 组件     | 选型                       | 备选方案                   | 选择理由           |
| -------- | -------------------------- | -------------------------- | ------------------ |
| 跨端框架 | React Native               | Flutter                    | JS生态，开发效率高 |
| AI推理   | onnx-react-native          | TensorFlow.js              | 更好的ONNX支持     |
| 数据库   | expo-sqlite + 内存向量索引 | WatermelonDB               | 轻量，可控         |
| 图片处理 | expo-image-manipulator     | react-native-image-resizer | Expo集成好         |
| 相册访问 | expo-media-library         | react-native-cameraroll    | 权限处理完善       |
| 状态管理 | React Context + Hooks      | Redux/MobX                 | MVP够用，简单      |

---

## 2. 核心模块设计

### 2.1 AI 服务模块 (AIService)

#### 职责

- 加载和运行 MobileCLIP ONNX 模型
- 图片向量化
- 文本向量化
- 相似度计算

#### 接口定义

```typescript
class AIService {
  // 初始化模型
  async initialize(): Promise<void>;

  // 图片编码
  async encodeImage(imageUri: string): Promise<number[]>;

  // 文本编码
  async encodeText(text: string): Promise<number[]>;

  // 计算相似度
  cosineSimilarity(a: number[], b: number[]): number;

  // 释放资源
  release(): void;
}
```

#### 模型规格

| 属性     | 值                                                      |
| -------- | ------------------------------------------------------- |
| 模型     | MobileCLIP-S0                                           |
| 输入尺寸 | **256x256** (图片), 77 tokens (文本)                    |
| 输出维度 | 512维向量                                               |
| 模型大小 | ~44MB (vision) + ~162MB (text)                          |
| 推理时间 | ~50ms (图片), ~10ms (文本)                              |
| 归一化   | CLIP: mean=[0.481,0.458,0.408], std=[0.269,0.261,0.276] |

---

### 2.2 数据库服务模块 (DBService)

#### 职责

- 照片元数据存储
- 向量数据存储
- 相似度搜索

#### 数据模型

```typescript
interface Photo {
  id: number; // 自增ID
  uuid: string; // 唯一标识
  filePath: string; // 原图路径
  thumbnailPath?: string; // 缩略图路径
  createdAt: Date; // 创建时间
  modifiedAt: Date; // 修改时间
  width?: number; // 图片宽度
  height?: number; // 图片高度
  embedding: number[]; // 512维向量 (JSON存储)
  isIndexed: boolean; // 是否已索引
  fileSize?: number; // 文件大小
}
```

#### 数据库 Schema

```sql
CREATE TABLE photos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  uuid TEXT UNIQUE NOT NULL,
  filePath TEXT NOT NULL,
  thumbnailPath TEXT,
  createdAt DATETIME NOT NULL,
  modifiedAt DATETIME NOT NULL,
  width INTEGER,
  height INTEGER,
  embedding TEXT NOT NULL, -- JSON array
  isIndexed BOOLEAN DEFAULT 0,
  fileSize INTEGER
);

CREATE INDEX idx_photos_isIndexed ON photos(isIndexed);
CREATE INDEX idx_photos_createdAt ON photos(createdAt);
```

#### 向量搜索算法

```typescript
// 暴力搜索（MVP阶段，照片数<10000时可用）
function searchByVector(query: number[], topK: number): SearchResult[] {
  const results = photos
    .filter(p => p.isIndexed)
    .map(p => ({
      photo: p,
      similarity: cosineSimilarity(query, p.embedding),
    }))
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, topK);

  return results;
}

// 后续优化：HNSW索引
```

---

### 2.3 扫描服务模块 (ScannerService)

#### 职责

- 扫描本地相册
- 生成缩略图
- 调用AI服务向量化
- 更新数据库

#### 工作流程

```
开始扫描
  ↓
获取相册权限
  ↓
读取所有照片列表
  ↓
过滤已索引照片
  ↓
循环处理每张照片:
  ├─ 生成缩略图
  ├─ AI向量化
  ├─ 存入数据库
  └─ 更新进度
  ↓
完成扫描
```

#### 性能优化

- 批量处理：每10张批量写入数据库
- 后台线程：使用 Worker 避免阻塞UI
- 增量更新：只处理新增照片
- 断点续传：记录扫描进度

---

## 3. UI 组件设计

### 3.1 组件清单

| 组件          | 路径                        | 职责             |
| ------------- | --------------------------- | ---------------- |
| App           | App.tsx                     | 根组件，导航配置 |
| SearchScreen  | screens/SearchScreen.tsx    | 搜索页面         |
| GalleryScreen | screens/GalleryScreen.tsx   | 相册页面         |
| PhotoGrid     | components/PhotoGrid.tsx    | 照片网格         |
| PhotoCard     | components/PhotoCard.tsx    | 单张照片卡片     |
| SearchBar     | components/SearchBar.tsx    | 搜索输入框       |
| ScanProgress  | components/ScanProgress.tsx | 扫描进度弹窗     |
| EmptyState    | components/EmptyState.tsx   | 空状态展示       |

### 3.2 状态管理

```typescript
// 全局状态 (React Context)
interface AppState {
  // 照片数据
  photos: Photo[];
  searchResults: SearchResult[];

  // UI状态
  isScanning: boolean;
  scanProgress: number;
  scanTotal: number;
  scanIndexed: number;

  // 搜索状态
  searchQuery: string;
  isSearching: boolean;

  // 方法
  scanPhotos: () => Promise<void>;
  searchPhotos: (query: string) => Promise<void>;
  refreshGallery: () => Promise<void>;
}
```

---

## 4. 性能优化策略

### 4.1 图片加载

- 缩略图：300x300，质量85%
- 大图：按需加载，缓存5张
- 使用 FlatList 虚拟滚动

### 4.2 AI推理

- 模型预热：启动时预加载
- 批量推理：一次处理多张
- 量化模型：INT8减少内存

### 4.3 数据库

- 索引：isIndexed, createdAt
- 分页查询：每次加载50张
- 连接池：复用数据库连接

### 4.4 内存管理

- 大图片及时释放
- 向量数据分页加载
- 定期GC触发

---

### 4.4 缓存策略

详见 [Cache-Logging-Degradation.md](./Cache-Logging-Degradation.md) 文档。

#### 缓存层级

```
┌─────────────────────────────────────────────────────────────┐
│                     Cache Hierarchy                          │
│                                                              │
│  L1: Memory Cache (内存缓存)                                  │
│  • 搜索结果缓存                                               │
│  • UI 状态                                                    │
│  • 热点数据                                                   │
│                                                              │
│  L2: Disk Cache (磁盘缓存)                                    │
│  • 缩略图缓存 (200MB)                                         │
│  • 向量缓存 (100MB)                                           │
│  • 临时文件                                                   │
│                                                              │
│  L3: Database (数据库存储)                                    │
│  • 照片元数据                                                 │
│  • 向量数据                                                   │
│  • 搜索历史                                                   │
└─────────────────────────────────────────────────────────────┘
```

#### 缓存配置

| 缓存类型     | 大小限制 | 淘汰策略 | TTL    |
| ------------ | -------- | -------- | ------ |
| 缩略图缓存   | 200MB    | LRU      | 30天   |
| 向量缓存     | 100MB    | LRU      | 7天    |
| 搜索结果缓存 | 50MB     | LRU      | 1小时  |
| 内存缓存     | 动态     | LRU      | 会话级 |

---

## 5. 安全与隐私

### 5.1 数据安全

- 所有照片数据本地存储
- 不上传任何图片到云端
- 可选应用锁（生物识别）

### 5.2 权限管理

| 权限                   | 用途           | 时机       |
| ---------------------- | -------------- | ---------- |
| READ_EXTERNAL_STORAGE  | 读取相册       | 首次扫描   |
| WRITE_EXTERNAL_STORAGE | 保存缩略图     | 首次扫描   |
| CAMERA (可选)          | 拍照后直接索引 | 用户拍照时 |

### 5.3 模型安全

- ONNX模型文件只读
- 不暴露模型API
- 防止模型提取

---

## 6. 错误处理

### 6.1 错误分类

| 类型     | 示例             | 处理策略           |
| -------- | ---------------- | ------------------ |
| 权限错误 | 用户拒绝相册权限 | 引导开启权限       |
| 模型错误 | ONNX加载失败     | 降级提示，建议重启 |
| 内存错误 | 处理大图OOM      | 分批处理，降低质量 |
| 存储错误 | 磁盘空间不足     | 清理旧缩略图       |

### 6.2 降级方案

详见 [Cache-Logging-Degradation.md](./Cache-Logging-Degradation.md) 文档。

| 降级级别            | 触发条件       | 处理策略                 |
| ------------------- | -------------- | ------------------------ |
| Level 4 (Normal)    | 内存 > 200MB   | 完整功能                 |
| Level 3 (Reduced)   | 内存 150-200MB | 降低缩略图质量，减少并发 |
| Level 2 (Minimal)   | 内存 100-150MB | 暂停后台扫描，仅文本搜索 |
| Level 1 (Emergency) | 内存 < 100MB   | 停止AI服务，基础文件浏览 |

### 6.3 用户提示

- 权限被拒：显示引导页
- 扫描失败：显示重试按钮
- 搜索无结果：显示建议
- 内存不足：显示降级提示，建议清理缓存

---

## 7. 测试策略

### 7.1 单元测试

- AIService: 向量计算正确性
- DBService: CRUD操作
- ScannerService: 扫描流程

### 7.2 集成测试

- 端到端搜索流程
- 扫描+索引+搜索完整链路

### 7.3 性能测试

- 1000张照片索引时间
- 搜索响应时间
- 内存占用监控

### 7.4 兼容性测试

- Android 8-14
- iOS 14-17
- 不同分辨率图片

---

## 8. 部署与发布

### 8.1 构建配置

```json
// eas.json (Expo)
{
  "build": {
    "production": {
      "android": {
        "buildType": "apk"
      },
      "ios": {
        "enterpriseProvisioning": "adhoc"
      }
    }
  }
}
```

### 8.2 发布渠道

| 平台    | 渠道         | 时间 |
| ------- | ------------ | ---- |
| Android | Google Play  | v1.0 |
| Android | 国内应用市场 | v1.0 |
| iOS     | App Store    | v1.0 |

### 8.3 版本策略

- 主版本：重大功能更新
- 次版本：新功能
- 修订版本：Bug修复

---

## 9. 监控与埋点

### 9.1 性能指标

- 启动时间
- 搜索响应时间
- 索引速度
- 崩溃率

### 9.2 业务指标

- 日活用户
- 搜索次数
- 索引照片数
- 付费转化率

### 9.3 错误监控

- 模型加载失败
- 数据库错误
- 内存溢出

---

## 10. 附录

### 10.1 依赖版本

```json
{
  "react-native": "0.73.2",
  "expo": "50.0.0",
  "onnx-react-native": "0.5.0",
  "expo-sqlite": "13.3.0",
  "expo-media-library": "15.9.1"
}
```

### 10.2 开发环境

- Node.js: 18+
- Xcode: 15+ (iOS)
- Android Studio: 2023+
- Python: 3.9+ (模型转换)

### 10.3 参考资源

- [MobileCLIP Paper](https://arxiv.org/abs/2311.17073)
- [ONNX Runtime Mobile](https://onnxruntime.ai/docs/tutorials/mobile/)
- [Expo Documentation](https://docs.expo.dev/)

---

## 11. 图片搜索原理

### 11.1 核心流程

```
用户输入: "海边的日落"
    ↓
┌─────────────────────────────────────────┐
│  Step 1: 文本向量化 (Text Encoder)      │
│  - 使用 MobileCLIP Text Model           │
│  - 将文字转为 512维向量                  │
│  - 例如: [0.23, -0.15, 0.88, ...]      │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│  Step 2: 向量相似度计算                  │
│  - 计算文本向量 vs 所有图片向量的相似度   │
│  - 使用余弦相似度: similarity = A·B     │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│  Step 3: 排序返回结果                    │
│  - 按相似度从高到低排序                  │
│  - 返回 Top-K 张最匹配的照片             │
└─────────────────────────────────────────┘
    ↓
显示结果: 海边日落的照片
```

### 11.2 CLIP 模型原理

CLIP (Contrastive Language-Image Pre-training) 能同时理解图片和文字。

**训练方式：**

- 让匹配的图文对在向量空间中距离近
- 不匹配的图文对距离远

**MobileCLIP：** CLIP 的手机优化版，更小更快。

### 11.3 余弦相似度

```typescript
function cosineSimilarity(a: number[], b: number[]): number {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}
```

结果范围: [-1, 1]，越接近1越相似。

---

**文档版本**: v1.0  
**最后更新**: 2026-04-04  
**作者**: AI助手
