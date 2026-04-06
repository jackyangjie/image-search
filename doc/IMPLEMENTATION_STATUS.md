# 项目实现状态更新 - 2026-04-06

## 更新摘要

本次更新将项目从 Mock 实现升级到完整的 ONNX Runtime + MobileCLIP 真实推理，并补充了大量缺失的 API 方法。

---

## 主要变更

### 1. AI 服务层 (AIService) ✅

**状态**: Mock → **真实 ONNX Runtime 推理**

| 变更项      | 之前        | 现在                                                              |
| ----------- | ----------- | ----------------------------------------------------------------- |
| 实现方式    | 随机数 Mock | onnxruntime-react-native                                          |
| 模型        | 无          | MobileCLIP-S0                                                     |
| 模型文件    | 无          | mobileclip_s0_image.onnx (44MB) + mobileclip_s0_text.onnx (162MB) |
| Vision 输入 | N/A         | [1, 3, 256, 256] float32                                          |
| Text 输入   | N/A         | [1, 77] int64                                                     |
| Tokenizer   | 无          | CLIP BPE Tokenizer (77 tokens)                                    |
| 预处理      | 无          | Resize 256×256 + CLIP 归一化                                      |

**新增文件**:

- `src/services/ai/CLIPTokenizer.ts` - BPE 分词器
- `src/services/ai/ImagePreprocessor.ts` - 图像预处理

**依赖**: `onnxruntime-react-native@1.24.3`, `expo-sharing`

---

### 2. 数据库服务 (DBService) ✅

**新增方法**:

- `getPhotoByUuid(uuid: string)` - 按 UUID 查询照片
- `updatePhoto(id: number, updates: Partial<Photo>)` - 更新照片信息
- `deletePhoto(id: number)` - 删除单张照片
- `deletePhotos(ids: number[])` - 批量删除照片
- `getUnindexedPhotos(limit?: number)` - 获取未索引照片

---

### 3. 照片服务 (PhotoService) ✅

**新增方法**:

- `getPhotoDetail(id: number)` - 获取照片详情（含格式化信息）
- `deletePhoto(id: number)` - 删除照片（含缩略图清理）
- `deletePhotos(ids: number[])` - 批量删除
- `sharePhoto(id: number)` - 分享单张照片
- `sharePhotos(ids: number[])` - 批量分享
- `getPhotoInfo(photoUri: string)` - 获取图片元信息

---

### 4. 搜索服务 (SearchService) ✅

**新增功能**:

- `timeRange` 筛选 - 按时间范围过滤搜索结果
- `sortBy` 排序 - 支持 'similarity' | 'date' 排序
- `advancedSearch(criteria)` - 高级搜索（支持纯时间查询）

---

## 文档更新

### 已更新

| 文档              | 更新内容                                                          |
| ----------------- | ----------------------------------------------------------------- |
| `README.md`       | 开发状态：AI服务层改为"ONNX Runtime + MobileCLIP-S0 真实推理"     |
| `doc/TechSpec.md` | 修正模型输入尺寸 224→256，更新模型大小 44MB+162MB，添加归一化常量 |
| `doc/API.md`      | 更新版本 v1.1，修正 PhotoService/SearchService API 定义           |

---

## 实现对齐状态

| 组件              | 完成度 | 状态                      |
| ----------------- | ------ | ------------------------- |
| AIService         | 90%    | ✅ ONNX 真实推理          |
| DBService         | 85%    | ✅ CRUD 完整              |
| PhotoService      | 75%    | ✅ 核心功能实现           |
| SearchService     | 80%    | ✅ 时间筛选+排序          |
| ScannerService    | 65%    | ⚠️ 缺缩略图生成、并发控制 |
| PermissionService | 40%    | ⚠️ 返回类型简化           |

---

## 已知限制

1. **ScannerService** - 未实现缩略图自动生成、并发控制
2. **DBService** - 未实现 `vacuum`, `backup`, `restore`
3. **PhotoService** - 未实现 `findSimilarPhotos`
4. **SearchService** - 未实现智能搜索建议 `getSuggestions`
5. **运行环境** - 需要 Expo Development Build（原生模块不支持 Expo Go）

---

## 下一步建议

### 高优先级

- [ ] 实现 ScannerService 缩略图自动生成
- [ ] 添加搜索建议 (getSuggestions)
- [ ] AsyncStorage 持久化搜索历史

### 中优先级

- [ ] 实现相似照片搜索
- [ ] 数据库备份/恢复功能
- [ ] 性能优化（向量化索引）

### 低优先级

- [ ] 相机信息提取
- [ ] 照片导出功能
- [ ] 批量分享多张照片

---

## 技术债务

- `expo-file-system` API 已升级至 v2，部分代码使用 `FileSystem.Paths.cache.uri` 而非旧版 `FileSystem.cacheDirectory`
- PhotoService 使用 `expo-file-system/legacy` 以保持兼容
- SearchService 的 `searchByPhoto` 方法尚未实现
