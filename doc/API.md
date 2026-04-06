# AI 相册搜索 APP - API 接口文档

## 文档信息

| 属性     | 值         |
| -------- | ---------- |
| 版本     | v1.1       |
| 最后更新 | 2026-04-06 |
| 作者     | AI助手     |

---

## 目录

1. [AIService API](#1-aiservice-api)
2. [DBService API](#2-dbservice-api)
3. [ScannerService API](#3-scannerservice-api)
4. [PhotoService API](#4-photoservice-api)
5. [SearchService API](#5-searchservice-api)
6. [PermissionService API](#6-permissionservice-api)
7. [Event 定义](#7-event-定义)

---

## 1. AIService API

### 1.1 类定义

```typescript
class AIService {
  // 单例模式
  static getInstance(): AIService;

  // 生命周期
  async initialize(): Promise<void>;
  isInitialized(): boolean;
  release(): void;

  // 核心功能
  async encodeImage(imageUri: string): Promise<number[]>;
  async encodeText(text: string): Promise<number[]>;

  // 相似度计算
  cosineSimilarity(a: number[], b: number[]): number;
  euclideanDistance(a: number[], b: number[]): number;

  // 性能优化
  warmUp(): Promise<void>;
  getModelInfo(): ModelInfo;
}
```

### 1.2 接口详情

#### initialize()

初始化 AI 服务，加载 ONNX 模型。

**调用时机**: App 启动时

**示例**:

```typescript
const aiService = AIService.getInstance();
await aiService.initialize();
```

**错误码**:
| 错误码 | 说明 | 处理建议 |
|--------|------|---------|
| AI_INIT_FAILED | 模型加载失败 | 检查模型文件完整性，提示用户重启 |
| AI_OUT_OF_MEMORY | 内存不足 | 建议关闭其他应用后重试 |
| AI_MODEL_NOT_FOUND | 模型文件不存在 | 触发模型下载流程 |

---

#### encodeImage(imageUri: string)

将图片转换为 512 维向量。

**参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| imageUri | string | 是 | 图片本地路径，支持 file:// 协议 |

**返回**: `Promise<number[]>` - 512 维浮点数组

**示例**:

```typescript
const embedding = await aiService.encodeImage('file:///path/to/photo.jpg');
// embedding: [0.23, -0.15, 0.88, ...] (512 elements)
```

**性能指标**:

- 平均耗时: 50ms
- 超时阈值: 200ms

---

#### encodeText(text: string)

将文本转换为 512 维向量。

**参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| text | string | 是 | 搜索文本，最大 100 字符 |

**返回**: `Promise<number[]>` - 512 维浮点数组

**示例**:

```typescript
const embedding = await aiService.encodeText('海边的日落');
```

**性能指标**:

- 平均耗时: 10ms
- 超时阈值: 50ms

---

#### cosineSimilarity(a: number[], b: number[])

计算两个向量的余弦相似度。

**参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| a | number[] | 是 | 向量 A，512 维 |
| b | number[] | 是 | 向量 B，512 维 |

**返回**: `number` - 范围 [-1, 1]，越接近 1 越相似

**示例**:

```typescript
const similarity = aiService.cosineSimilarity(imageEmbedding, textEmbedding);
// 0.85 表示高度相似
```

---

## 2. DBService API

### 2.1 类定义

```typescript
class DBService {
  static getInstance(): DBService;

  // 生命周期
  async initialize(): Promise<void>;
  async close(): Promise<void>;

  // 照片 CRUD
  async insertPhoto(photo: Photo): Promise<number>;
  async updatePhoto(id: number, updates: Partial<Photo>): Promise<void>;
  async deletePhoto(id: number): Promise<void>;
  async getPhoto(id: number): Promise<Photo | null>;
  async getPhotoByUuid(uuid: string): Promise<Photo | null>;

  // 批量操作
  async insertPhotos(photos: Photo[]): Promise<number[]>;
  async deletePhotos(ids: number[]): Promise<void>;

  // 查询
  async getPhotos(options: PhotoQueryOptions): Promise<Photo[]>;
  async getPhotosCount(): Promise<number>;
  async getIndexedCount(): Promise<number>;
  async getUnindexedPhotos(limit?: number): Promise<Photo[]>;

  // 搜索
  async searchByVector(query: number[], topK: number, threshold?: number): Promise<SearchResult[]>;
  async searchByText(text: string, topK: number): Promise<SearchResult[]>;

  // 统计
  async getStats(): Promise<DBStats>;

  // 维护
  async vacuum(): Promise<void>;
  async backup(): Promise<string>;
  async restore(backupPath: string): Promise<void>;
}
```

### 2.2 数据类型定义

```typescript
interface Photo {
  id?: number; // 自增ID，创建时可选
  uuid: string; // 唯一标识 (格式: uuidv4)
  filePath: string; // 原图绝对路径
  thumbnailPath?: string; // 缩略图路径
  createdAt: Date; // 照片创建时间
  modifiedAt: Date; // 照片修改时间
  width?: number; // 图片宽度(像素)
  height?: number; // 图片高度(像素)
  embedding?: number[]; // 512维向量，未索引时为空
  isIndexed: boolean; // 是否已建立索引
  fileSize?: number; // 文件大小(字节)
}

interface PhotoQueryOptions {
  offset?: number; // 分页偏移量，默认 0
  limit?: number; // 每页数量，默认 50
  orderBy?: 'createdAt' | 'modifiedAt'; // 排序字段
  order?: 'ASC' | 'DESC'; // 排序方向，默认 DESC
  isIndexed?: boolean; // 按索引状态筛选
  startDate?: Date; // 开始时间筛选
  endDate?: Date; // 结束时间筛选
}

interface SearchResult {
  photo: Photo;
  similarity: number; // 相似度分数 0-1
}

interface DBStats {
  totalPhotos: number; // 照片总数
  indexedPhotos: number; // 已索引数
  unindexedPhotos: number; // 未索引数
  databaseSize: number; // 数据库文件大小(字节)
  lastScanAt?: Date; // 上次扫描时间
}
```

### 2.3 接口详情

#### insertPhoto(photo: Photo)

插入单张照片记录。

**示例**:

```typescript
const id = await dbService.insertPhoto({
  uuid: '550e8400-e29b-41d4-a716-446655440000',
  filePath: '/storage/emulated/0/DCIM/photo1.jpg',
  createdAt: new Date('2024-01-15'),
  modifiedAt: new Date('2024-01-15'),
  isIndexed: false,
});
console.log(`Inserted photo with ID: ${id}`);
```

**错误码**:
| 错误码 | 说明 |
|--------|------|
| DB_DUPLICATE_UUID | UUID 重复 |
| DB_INVALID_DATA | 数据格式错误 |

---

#### getPhotos(options: PhotoQueryOptions)

分页查询照片列表。

**示例**:

```typescript
// 获取最新 50 张已索引照片
const photos = await dbService.getPhotos({
  limit: 50,
  orderBy: 'createdAt',
  order: 'DESC',
  isIndexed: true,
});

// 获取下一页
const nextPage = await dbService.getPhotos({
  offset: 50,
  limit: 50,
  orderBy: 'createdAt',
  order: 'DESC',
});
```

---

#### searchByVector(query: number[], topK: number, threshold?: number)

基于向量相似度搜索照片。

**参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| query | number[] | 是 | 查询向量，512 维 |
| topK | number | 是 | 返回结果数量上限 |
| threshold | number | 否 | 相似度阈值，默认 0.5 |

**示例**:

```typescript
const textEmbedding = await aiService.encodeText('海边的日落');
const results = await dbService.searchByVector(textEmbedding, 20, 0.6);
// results: [{ photo: Photo, similarity: 0.89 }, ...]
```

**性能指标**:

- 1000 张照片: < 100ms
- 10000 张照片: < 500ms

---

## 3. ScannerService API

### 2.1 类定义

```typescript
class ScannerService {
  static getInstance(): ScannerService;

  // 生命周期
  async initialize(): Promise<void>;

  // 扫描控制
  async startScan(options?: ScanOptions): Promise<void>;
  async pauseScan(): Promise<void>;
  async resumeScan(): Promise<void>;
  async stopScan(): Promise<void>;

  // 状态查询
  getScanState(): ScanState;
  getProgress(): ScanProgress;

  // 事件监听
  onProgress(callback: (progress: ScanProgress) => void): void;
  onComplete(callback: (result: ScanResult) => void): void;
  onError(callback: (error: ScanError) => void): void;

  // 增量更新
  async checkForNewPhotos(): Promise<number>;
  async scanNewPhotos(): Promise<ScanResult>;
}
```

### 3.2 数据类型定义

```typescript
interface ScanOptions {
  incremental?: boolean; // 是否增量扫描，默认 true
  generateThumbnail?: boolean; // 是否生成缩略图，默认 true
  thumbnailSize?: number; // 缩略图尺寸，默认 300
  batchSize?: number; // 批量处理数量，默认 10
  concurrency?: number; // 并发数，默认 2
}

interface ScanState {
  status: 'idle' | 'scanning' | 'paused' | 'completed' | 'error';
  startTime?: Date;
  pauseTime?: Date;
  error?: string;
}

interface ScanProgress {
  total: number; // 总照片数
  processed: number; // 已处理
  indexed: number; // 已索引
  failed: number; // 失败数
  currentFile?: string; // 当前处理文件
  percent: number; // 进度百分比
  estimatedTimeRemaining?: number; // 预估剩余时间(秒)
}

interface ScanResult {
  totalFound: number; // 发现照片总数
  newlyIndexed: number; // 新索引数量
  failed: number; // 失败数量
  duration: number; // 耗时(秒)
  errors: ScanError[];
}

interface ScanError {
  filePath: string;
  error: string;
  timestamp: Date;
}
```

### 3.3 接口详情

#### startScan(options?: ScanOptions)

启动相册扫描。

**示例**:

```typescript
await scannerService.startScan({
  incremental: true, // 只扫描新照片
  generateThumbnail: true, // 生成缩略图
  batchSize: 10, // 每批处理10张
  concurrency: 2, // 2个并发任务
});
```

**完整流程示例**:

```typescript
// 监听进度
scannerService.onProgress(progress => {
  console.log(`Scanning: ${progress.percent}%`);
  console.log(`${progress.processed}/${progress.total}`);
});

// 监听完成
scannerService.onComplete(result => {
  console.log(`Scan completed: ${result.newlyIndexed} photos indexed`);
});

// 监听错误
scannerService.onError(error => {
  console.error(`Scan error: ${error.error}`);
});

// 开始扫描
await scannerService.startScan();
```

---

## 4. PhotoService API

### 4.1 类定义

```typescript
class PhotoService {
  static getInstance(): PhotoService;

  // 照片操作
  async getPhotoDetail(id: number): Promise<PhotoDetail | null>;
  async deletePhoto(id: number): Promise<void>;
  async deletePhotos(ids: number[]): Promise<void>;
  async sharePhoto(id: number): Promise<void>;
  async sharePhotos(ids: number[]): Promise<void>;

  // 缩略图
  async generateThumbnail(photoUri: string, options?: ThumbnailOptions): Promise<string>;
  async deleteThumbnail(photoUri: string): Promise<void>;
  async clearThumbnailCache(): Promise<void>;
  async getCacheSize(): Promise<number>;

  // 照片信息
  async getPhotoInfo(photoUri: string): Promise<{ width: number; height: number; size: number }>;
}
```

### 4.2 数据类型定义

```typescript
interface PhotoDetail extends Photo {
  thumbnailUri: string; // 缩略图 URI
  fullSizeUri: string; // 原图 URI
  fileSizeFormatted: string; // 格式化文件大小 (如 "2.5 MB")
  dimensions: string; // 尺寸 (如 "4032 x 3024")
  cameraInfo?: CameraInfo; // 相机信息
}

interface CameraInfo {
  make?: string; // 相机品牌
  model?: string; // 相机型号
  aperture?: string; // 光圈
  exposure?: string; // 曝光时间
  iso?: number; // ISO
  focalLength?: string; // 焦距
}
```

---

## 5. SearchService API

### 5.1 类定义

```typescript
class SearchService {
  static getInstance(): SearchService;

  // 搜索
  async search(query: string, options?: SearchOptions): Promise<SearchResult[]>;
  async advancedSearch(criteria: SearchCriteria): Promise<SearchResult[]>;

  // 搜索建议
  async getSuggestions(partial: string): Promise<string[]>;
  async getHotSearches(): string[];

  // 搜索历史
  async getSearchHistory(): Promise<SearchHistoryItem[]>;
  async addToHistory(query: string, resultCount: number): Promise<void>;
  async clearHistory(): Promise<void>;
}
```

### 5.2 数据类型定义

```typescript
interface SearchOptions {
  limit?: number; // 返回数量，默认 20
  threshold?: number; // 相似度阈值，默认 0.5
  timeRange?: TimeRange; // 时间范围筛选
  sortBy?: 'similarity' | 'date'; // 排序方式
}

interface TimeRange {
  start?: Date;
  end?: Date;
}

interface SearchCriteria {
  query?: string; // 文本查询
  timeRange?: TimeRange; // 时间范围
  minSimilarity?: number; // 最小相似度
  tags?: string[]; // 标签筛选（预留）
}

interface SearchHistoryItem {
  query: string;
  timestamp: Date;
  resultCount: number;
}
```

### 5.3 接口详情

#### search(query: string, options?: SearchOptions)

执行自然语言搜索。

**示例**:

```typescript
const results = await searchService.search('海边的日落', {
  limit: 20,
  threshold: 0.6,
  timeRange: {
    start: new Date('2024-01-01'),
    end: new Date('2024-12-31'),
  },
  sortBy: 'similarity',
});
```

---

## 6. PermissionService API

### 6.1 类定义

```typescript
class PermissionService {
  static getInstance(): PermissionService;

  // 权限检查
  async checkPhotoPermission(): Promise<PermissionStatus>;
  async checkStoragePermission(): Promise<PermissionStatus>;

  // 权限申请
  async requestPhotoPermission(): Promise<PermissionResult>;
  async requestStoragePermission(): Promise<PermissionResult>;

  // 引导
  shouldShowPermissionRationale(permission: Permission): boolean;
  getPermissionGuide(permission: Permission): PermissionGuide;
}
```

### 6.2 数据类型定义

```typescript
type PermissionStatus = 'granted' | 'denied' | 'limited' | 'notDetermined';

interface PermissionResult {
  status: PermissionStatus;
  canAskAgain: boolean; // 是否可以再次申请
}

interface PermissionGuide {
  title: string;
  description: string;
  steps: string[]; // 手动开启权限的步骤
}

type Permission = 'photos' | 'storage' | 'camera';
```

---

## 7. Event 定义

### 7.1 全局事件

```typescript
// 扫描事件
interface ScanProgressEvent {
  type: 'scan:progress';
  data: ScanProgress;
}

interface ScanCompleteEvent {
  type: 'scan:complete';
  data: ScanResult;
}

interface ScanErrorEvent {
  type: 'scan:error';
  data: ScanError;
}

// 搜索事件
interface SearchStartEvent {
  type: 'search:start';
  data: { query: string };
}

interface SearchCompleteEvent {
  type: 'search:complete';
  data: {
    query: string;
    results: SearchResult[];
    duration: number; // 搜索耗时(ms)
  };
}

// 数据变更事件
interface PhotoIndexedEvent {
  type: 'photo:indexed';
  data: { photoId: number; uuid: string };
}

interface PhotoDeletedEvent {
  type: 'photo:deleted';
  data: { photoId: number };
}
```

### 7.2 EventBus API

```typescript
class EventBus {
  static on(event: string, callback: Function): void;
  static off(event: string, callback: Function): void;
  static emit(event: string, data: any): void;
  static once(event: string, callback: Function): void;
}
```

**使用示例**:

```typescript
// 订阅扫描进度
EventBus.on('scan:progress', progress => {
  updateProgressBar(progress.percent);
});

// 订阅搜索完成
EventBus.on('search:complete', data => {
  console.log(`Found ${data.results.length} results in ${data.duration}ms`);
});

// 发送事件
EventBus.emit('photo:indexed', { photoId: 123, uuid: '...' });
```

---

## 8. 错误码规范

### 8.1 错误码格式

`[模块]_[错误类型]_[具体错误]`

### 8.2 错误码列表

| 错误码                 | 说明           | HTTP 状态码 |
| ---------------------- | -------------- | ----------- |
| AI_INIT_FAILED         | AI 初始化失败  | 500         |
| AI_OUT_OF_MEMORY       | AI 内存不足    | 507         |
| AI_MODEL_NOT_FOUND     | 模型文件不存在 | 404         |
| AI_ENCODE_FAILED       | 编码失败       | 500         |
| AI_TIMEOUT             | 编码超时       | 408         |
| DB_CONNECTION_FAILED   | 数据库连接失败 | 500         |
| DB_DUPLICATE_UUID      | UUID 重复      | 409         |
| DB_INVALID_DATA        | 数据格式错误   | 400         |
| DB_NOT_FOUND           | 记录不存在     | 404         |
| SCAN_PERMISSION_DENIED | 扫描权限被拒   | 403         |
| SCAN_CANCELED          | 扫描被取消     | 499         |
| SCAN_NO_PHOTOS         | 未发现照片     | 404         |
| FILE_NOT_FOUND         | 文件不存在     | 404         |
| FILE_READ_ERROR        | 文件读取错误   | 500         |
| FILE_TOO_LARGE         | 文件过大       | 413         |

---

**文档版本**: v1.0  
**最后更新**: 2026-04-04  
**作者**: AI助手
