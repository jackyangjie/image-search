# AI 相册搜索 APP - 执行计划

## 文档版本

| 属性 | 值 |
|------|-----|
| 版本 | v1.0 |
| 最后更新 | 2026-04-04 |
| 作者 | AI助手 |

---

## 1. 项目概述

基于 MobileCLIP 的本地智能相册搜索工具，支持自然语言描述搜索照片。所有AI处理本地完成，保障隐私安全。

### 1.1 技术栈
- **跨端框架**: React Native (v0.73.2)
- **AI推理**: onnx-react-native (MobileCLIP-S0)
- **数据库**: expo-sqlite
- **相册访问**: expo-media-library
- **开发平台**: iOS 14.0+, Android API 26+

### 1.2 文档引用
- PRD: `doc/PRD.md`
- TechSpec: `doc/TechSpec.md`
- Architecture: `doc/Architecture.md`
- API: `doc/API.md`
- UserStories: `doc/UserStories.md`
- Environment: `doc/Environment.md`
- CodingStyle: `doc/CodingStyle.md`

---

## 2. 里程碑与阶段划分

### 阶段1: MVP (2周) - P0功能
**目标**: 基础搜索功能可用

- [ ] 初始化 React Native 项目结构
- [ ] AI模型集成 (MobileCLIP ONNX)
- [ ] 本地数据库设计与实现
- [ ] 相册扫描功能
- [ ] 基础搜索功能
- [ ] UI框架搭建

### 阶段2: v1.0 (4周) - 完整体验
**目标**: 可发布到应用商店

- [ ] 完整搜索体验（搜索历史、建议）
- [ ] 增量索引
- [ ] 性能优化
- [ ] 隐私与安全功能
- [ ] 测试与质量保障

### 阶段3: v2.0 (8周) - 增强功能
**目标**: 高级功能与性能优化

- [ ] 相似图片搜索
- [ ] 高级筛选
- [ ] 智能相册
- [ ] 性能优化

---

## 3. 任务分解与依赖关系

### 3.1 核心任务依赖图

```
[项目初始化]
    │
    ├──▶ [环境配置] ──▶ [开发环境验证]
    │
    ├──▶ [数据库层] ──▶ [数据模型] ──▶ [DBService]
    │
    ├──▶ [AI服务层] ──▶ [模型集成] ──▶ [AIService]
    │         │
    │         └──▶ [模型下载/管理脚本]
    │
    ├──▶ [扫描服务] ──▶ [权限管理] ──▶ [ScannerService]
    │         │              │
    │         └──▶ [缩略图生成]     └──▶ [权限引导UI]
    │
    ├──▶ [搜索服务] ──▶ [SearchService]
    │
    ├──▶ [UI层] ──▶ [基础组件] ──▶ [页面实现]
    │       │            │
    │       └──▶ [主题/样式]    ├──▶ [SearchScreen]
    │                            ├──▶ [GalleryScreen]
    │                            └──▶ [PhotoDetailScreen]
    │
    └──▶ [状态管理] ──▶ [AppContext]
```

### 3.2 关键依赖说明

| 任务 | 前置依赖 | 并行任务 |
|------|---------|---------|
| AIService | 项目初始化, 环境配置 | DBService |
| DBService | 项目初始化, 环境配置 | AIService |
| ScannerService | AIService, DBService, 权限管理 | - |
| SearchService | AIService, DBService | ScannerService |
| SearchScreen | SearchService, PhotoGrid, SearchBar | GalleryScreen |
| GalleryScreen | ScannerService, PhotoGrid | SearchScreen |
| PhotoDetailScreen | PhotoService | - |

---

## 4. 详细任务清单

### 任务1: 项目初始化与环境配置

**任务ID**: INIT-001
**优先级**: P0
**预计工时**: 1天
**负责人**: TBD

#### 验收标准
- [ ] React Native项目成功初始化
- [ ] 所有依赖正确安装
- [ ] iOS/Android项目能正常编译运行
- [ ] TypeScript配置完成
- [ ] ESLint/Prettier配置完成

#### 具体步骤
1. **创建React Native项目**
   ```bash
   npx create-expo-app SmartPhotoSearch --template blank-typescript
   cd SmartPhotoSearch
   ```

2. **安装核心依赖**
   ```bash
   # AI/ML
   npm install onnx-react-native
   
   # 数据库
   npx expo install expo-sqlite
   
   # 相册访问
   npx expo install expo-media-library
   
   # 图片处理
   npx expo install expo-image-manipulator
   
   # 导航
   npm install @react-navigation/native @react-navigation/native-stack
   npx expo install react-native-screens react-native-safe-area-context
   
   # 其他工具
   npm install uuid date-fns react-native-fs
   ```

3. **配置路径别名**
   - 更新 `tsconfig.json` 添加 baseUrl 和 paths
   - 配置 Babel 支持绝对路径导入

4. **配置代码规范**
   - 复制 CodingStyle.md 中的 ESLint 配置
   - 配置 Prettier
   - 添加 Husky 和 lint-staged

#### 输出物
- `/src` 目录结构
- `package.json` 完整依赖配置
- `tsconfig.json` 路径配置
- `.eslintrc.js` 代码规范配置
- `.prettierrc` 格式化配置

---

### 任务2: 数据库层实现

**任务ID**: DB-001
**优先级**: P0
**预计工时**: 2天
**负责人**: TBD
**前置任务**: INIT-001

#### 验收标准
- [ ] 数据库能正常创建和连接
- [ ] 照片表创建成功
- [ ] CRUD操作测试通过
- [ ] 向量搜索功能正常

#### 具体步骤

1. **创建数据模型定义**
   - 文件: `src/types/photo.ts`, `src/types/search.ts`
   - 定义 Photo, SearchResult 等接口

2. **实现数据库Schema**
   - 文件: `src/services/db/schema.ts`
   - 创建 photos 表结构
   - 创建索引 (isIndexed, createdAt)

3. **实现DBService**
   - 文件: `src/services/db/DBService.ts`
   - 实现初始化、CRUD、批量操作
   - 实现向量搜索 (暴力搜索)
   - 实现统计查询

4. **编写数据库测试**
   - 单元测试: CRUD操作
   - 集成测试: 向量搜索性能

#### API实现清单
- [ ] `initialize()` - 数据库初始化
- [ ] `insertPhoto()` - 插入单张照片
- [ ] `insertPhotos()` - 批量插入
- [ ] `getPhotos()` - 分页查询
- [ ] `getPhoto()` - 获取单张照片
- [ ] `updatePhoto()` - 更新照片
- [ ] `deletePhoto()` - 删除照片
- [ ] `searchByVector()` - 向量相似度搜索
- [ ] `getStats()` - 获取统计信息

#### 输出物
- `src/types/*.ts` - 类型定义
- `src/services/db/schema.ts` - 数据库Schema
- `src/services/db/DBService.ts` - 数据库服务
- `src/services/db/__tests__/*` - 测试文件

---

### 任务3: AI服务层实现

**任务ID**: AI-001
**优先级**: P0
**预计工时**: 3天
**负责人**: TBD
**前置任务**: INIT-001

#### 验收标准
- [ ] ONNX模型能成功加载
- [ ] 图片向量化功能正常
- [ ] 文本向量化功能正常
- [ ] 相似度计算准确
- [ ] 单次推理时间 < 100ms

#### 具体步骤

1. **模型管理**
   - 创建 `scripts/download-models.sh` 下载脚本
   - 配置模型校验 (MD5)
   - 实现模型配置 `src/config/models.ts`

2. **实现AIService**
   - 文件: `src/services/ai/AIService.ts`
   - 实现单例模式
   - 实现模型加载与初始化
   - 实现 `encodeImage()` 图片向量化
   - 实现 `encodeText()` 文本向量化
   - 实现 `cosineSimilarity()` 相似度计算
   - 实现模型预热功能

3. **错误处理**
   - 模型加载失败处理
   - 内存不足降级处理
   - 推理超时处理

4. **性能优化**
   - 模型预热策略
   - 批量推理支持
   - 内存管理优化

#### API实现清单
- [ ] `getInstance()` - 单例获取
- [ ] `initialize()` - 初始化模型
- [ ] `encodeImage()` - 图片向量化
- [ ] `encodeText()` - 文本向量化
- [ ] `cosineSimilarity()` - 余弦相似度计算
- [ ] `warmUp()` - 模型预热
- [ ] `release()` - 资源释放

#### 输出物
- `scripts/download-models.sh` - 模型下载脚本
- `src/config/models.ts` - 模型配置
- `src/services/ai/AIService.ts` - AI服务
- `src/services/ai/__tests__/*` - 测试文件

---

### 任务4: 权限管理服务

**任务ID**: PERM-001
**优先级**: P0
**预计工时**: 1天
**负责人**: TBD
**前置任务**: INIT-001

#### 验收标准
- [ ] 相册权限检查正常
- [ ] 权限申请流程正常
- [ ] 权限被拒时有引导提示
- [ ] iOS/Android权限处理一致

#### 具体步骤

1. **实现PermissionService**
   - 文件: `src/services/permission/PermissionService.ts`
   - 实现权限检查
   - 实现权限申请
   - 实现权限引导信息

2. **创建权限引导UI**
   - 文件: `src/screens/PermissionGuideScreen/`
   - 设计权限说明页面
   - 添加手动开启权限指引

#### API实现清单
- [ ] `checkPhotoPermission()` - 检查相册权限
- [ ] `requestPhotoPermission()` - 申请相册权限
- [ ] `getPermissionGuide()` - 获取权限引导信息

#### 输出物
- `src/services/permission/PermissionService.ts`
- `src/screens/PermissionGuideScreen/`

---

### 任务5: 扫描服务实现

**任务ID**: SCAN-001
**优先级**: P0
**预计工时**: 3天
**负责人**: TBD
**前置任务**: AI-001, DB-001, PERM-001

#### 验收标准
- [ ] 能扫描本地相册并获取照片列表
- [ ] 能生成缩略图
- [ ] 能进行AI向量化并存储
- [ ] 扫描进度实时更新
- [ ] 支持暂停/恢复扫描
- [ ] 扫描速度 > 10张/秒

#### 具体步骤

1. **实现ScannerService**
   - 文件: `src/services/scanner/ScannerService.ts`
   - 实现状态机 (IDLE, SCANNING, PAUSED, COMPLETED, ERROR)
   - 实现扫描控制 (start, pause, resume, stop)
   - 实现批量处理逻辑
   - 实现进度事件通知

2. **缩略图生成**
   - 文件: `src/services/scanner/ThumbnailGenerator.ts`
   - 使用 expo-image-manipulator
   - 生成 300x300 缩略图
   - 保存到缓存目录

3. **扫描流程**
   - 获取相册权限
   - 读取照片列表
   - 过滤已索引照片
   - 循环处理每张照片
     - 生成缩略图
     - AI向量化
     - 存入数据库
   - 更新进度

4. **事件系统**
   - 实现 EventBus
   - 扫描进度事件: `scan:progress`
   - 扫描完成事件: `scan:complete`
   - 扫描错误事件: `scan:error`

#### API实现清单
- [ ] `getInstance()` - 单例获取
- [ ] `initialize()` - 初始化
- [ ] `startScan()` - 开始扫描
- [ ] `pauseScan()` - 暂停扫描
- [ ] `resumeScan()` - 恢复扫描
- [ ] `stopScan()` - 停止扫描
- [ ] `getScanState()` - 获取扫描状态
- [ ] `getProgress()` - 获取扫描进度
- [ ] `onProgress()` - 监听进度
- [ ] `onComplete()` - 监听完成
- [ ] `onError()` - 监听错误

#### 输出物
- `src/services/scanner/ScannerService.ts`
- `src/services/scanner/ThumbnailGenerator.ts`
- `src/services/event/EventBus.ts`
- `src/services/scanner/__tests__/*`

---

### 任务6: 搜索服务实现

**任务ID**: SEARCH-001
**优先级**: P0
**预计工时**: 2天
**负责人**: TBD
**前置任务**: AI-001, DB-001

#### 验收标准
- [ ] 自然语言搜索功能正常
- [ ] 搜索结果按相似度排序
- [ ] 搜索响应时间 < 500ms
- [ ] 支持搜索历史

#### 具体步骤

1. **实现SearchService**
   - 文件: `src/services/search/SearchService.ts`
   - 实现自然语言搜索
   - 实现搜索历史管理
   - 实现搜索建议

2. **搜索历史存储**
   - 使用 AsyncStorage 或 SQLite
   - 限制历史记录数量 (50条)
   - 去重和排序

3. **热门搜索建议**
   - 预设热门搜索词
   - 根据用户使用频率排序

#### API实现清单
- [ ] `getInstance()` - 单例获取
- [ ] `search()` - 执行搜索
- [ ] `getSearchHistory()` - 获取搜索历史
- [ ] `addToHistory()` - 添加到历史
- [ ] `clearHistory()` - 清空历史
- [ ] `getSuggestions()` - 获取搜索建议
- [ ] `getHotSearches()` - 获取热门搜索

#### 输出物
- `src/services/search/SearchService.ts`
- `src/services/search/__tests__/*`

---

### 任务7: 照片服务实现

**任务ID**: PHOTO-001
**优先级**: P1
**预计工时**: 1天
**负责人**: TBD
**前置任务**: DB-001

#### 验收标准
- [ ] 能获取照片详情
- [ ] 能生成缩略图
- [ ] 能删除照片

#### 具体步骤

1. **实现PhotoService**
   - 文件: `src/services/photo/PhotoService.ts`
   - 实现照片详情获取
   - 实现照片删除
   - 实现分享功能 (预留)

#### API实现清单
- [ ] `getPhotoDetail()` - 获取照片详情
- [ ] `deletePhoto()` - 删除照片
- [ ] `sharePhoto()` - 分享照片

#### 输出物
- `src/services/photo/PhotoService.ts`

---

### 任务8: UI组件开发 - 基础组件

**任务ID**: UI-001
**优先级**: P0
**预计工时**: 2天
**负责人**: TBD
**前置任务**: INIT-001

#### 验收标准
- [ ] 所有基础组件可用
- [ ] 组件符合设计规范
- [ ] 组件有TypeScript类型定义

#### 具体步骤

1. **创建主题配置**
   - 文件: `src/theme/index.ts`, `src/theme/light.ts`, `src/theme/dark.ts`
   - 定义颜色、字体、间距等

2. **实现UI基础组件**
   - `src/components/ui/Button/` - 按钮组件
   - `src/components/ui/Card/` - 卡片组件
   - `src/components/ui/Input/` - 输入框组件

3. **实现业务通用组件**
   - `src/components/common/SearchBar/` - 搜索栏
   - `src/components/common/PhotoCard/` - 照片卡片
   - `src/components/common/PhotoGrid/` - 照片网格
   - `src/components/common/EmptyState/` - 空状态
   - `src/components/common/ScanProgress/` - 扫描进度

#### 组件清单
- [ ] Button - 按钮
- [ ] Card - 卡片
- [ ] Input - 输入框
- [ ] SearchBar - 搜索栏
- [ ] PhotoCard - 照片卡片
- [ ] PhotoGrid - 照片网格 (FlatList)
- [ ] EmptyState - 空状态
- [ ] ScanProgress - 扫描进度弹窗
- [ ] LoadingSpinner - 加载指示器

#### 输出物
- `src/theme/*` - 主题配置
- `src/components/ui/*` - UI基础组件
- `src/components/common/*` - 业务组件
- `src/components/index.ts` - 统一导出

---

### 任务9: 状态管理实现

**任务ID**: STATE-001
**优先级**: P0
**预计工时**: 1天
**负责人**: TBD
**前置任务**: UI-001

#### 验收标准
- [ ] Context能正常提供状态
- [ ] 状态更新能触发UI更新
- [ ] 状态方法能正常工作

#### 具体步骤

1. **实现AppContext**
   - 文件: `src/context/AppContext.tsx`
   - 定义 AppState 接口
   - 实现 Provider
   - 实现 useAppContext Hook

2. **状态定义**
   - photos: 照片列表
   - searchResults: 搜索结果
   - isScanning: 扫描状态
   - scanProgress: 扫描进度
   - searchQuery: 搜索词
   - isSearching: 搜索中状态

3. **Actions实现**
   - scanPhotos - 扫描照片
   - searchPhotos - 搜索照片
   - refreshGallery - 刷新相册
   - setSearchQuery - 设置搜索词

#### 输出物
- `src/context/AppContext.tsx`
- `src/context/index.ts`

---

### 任务10: 页面实现 - SearchScreen

**任务ID**: SCREEN-001
**优先级**: P0
**预计工时**: 2天
**负责人**: TBD
**前置任务**: UI-001, SEARCH-001, STATE-001

#### 验收标准
- [ ] 页面能正常渲染
- [ ] 搜索功能正常
- [ ] 搜索结果能正确显示
- [ ] 支持搜索历史和建议

#### 具体步骤

1. **创建页面结构**
   - 文件: `src/screens/SearchScreen/`
     - `index.tsx` - 页面组件
     - `styles.ts` - 样式
     - `types.ts` - 类型定义

2. **实现页面功能**
   - 搜索栏输入
   - 搜索建议展示
   - 搜索历史展示
   - 搜索结果网格
   - 空状态处理
   - 加载状态处理

3. **搜索流程**
   - 用户输入 → 防抖处理 → 调用SearchService
   - 文本向量化 → 向量搜索 → 结果排序
   - 更新搜索结果 → 刷新UI

#### 输出物
- `src/screens/SearchScreen/index.tsx`
- `src/screens/SearchScreen/styles.ts`
- `src/screens/SearchScreen/types.ts`

---

### 任务11: 页面实现 - GalleryScreen

**任务ID**: SCREEN-002
**优先级**: P0
**预计工时**: 2天
**负责人**: TBD
**前置任务**: UI-001, SCAN-001, STATE-001

#### 验收标准
- [ ] 页面能正常渲染
- [ ] 照片网格能正确显示
- [ ] 支持下拉刷新
- [ ] 扫描进度能正确显示
- [ ] 扫描按钮功能正常

#### 具体步骤

1. **创建页面结构**
   - 文件: `src/screens/GalleryScreen/`
     - `index.tsx` - 页面组件
     - `styles.ts` - 样式
     - `types.ts` - 类型定义

2. **实现页面功能**
   - 照片网格展示 (FlatList)
   - 下拉刷新
   - 扫描按钮
   - 扫描进度弹窗
   - 统计信息展示

3. **数据加载**
   - 首次加载从数据库读取
   - 下拉刷新重新加载
   - 监听扫描完成事件刷新

#### 输出物
- `src/screens/GalleryScreen/index.tsx`
- `src/screens/GalleryScreen/styles.ts`
- `src/screens/GalleryScreen/types.ts`

---

### 任务12: 页面实现 - PhotoDetailScreen

**任务ID**: SCREEN-003
**优先级**: P0
**预计工时**: 1天
**负责人**: TBD
**前置任务**: UI-001, PHOTO-001

#### 验收标准
- [ ] 页面能正常渲染
- [ ] 能显示大图
- [ ] 支持手势缩放
- [ ] 能显示照片信息

#### 具体步骤

1. **创建页面结构**
   - 文件: `src/screens/PhotoDetailScreen/`
     - `index.tsx` - 页面组件
     - `styles.ts` - 样式
     - `types.ts` - 类型定义

2. **实现页面功能**
   - 大图展示
   - 手势缩放 (react-native-zoomable-view)
   - 照片信息展示
   - 操作按钮 (删除、分享)
   - 左右滑动切换

#### 输出物
- `src/screens/PhotoDetailScreen/index.tsx`
- `src/screens/PhotoDetailScreen/styles.ts`
- `src/screens/PhotoDetailScreen/types.ts`

---

### 任务13: 导航配置

**任务ID**: NAV-001
**优先级**: P0
**预计工时**: 1天
**负责人**: TBD
**前置任务**: SCREEN-001, SCREEN-002, SCREEN-003

#### 验收标准
- [ ] 导航能正常工作
- [ ] 页面间跳转正常
- [ ] 导航类型定义完整

#### 具体步骤

1. **配置导航器**
   - 文件: `src/navigation/AppNavigator.tsx`
   - 配置 Native Stack Navigator
   - 配置路由参数类型

2. **定义导航类型**
   - 文件: `src/navigation/types.ts`
   - 定义 Screen 类型
   - 定义 NavigationProp 类型

3. **配置路由**
   - SearchScreen - 首页
   - GalleryScreen - 相册页
   - PhotoDetailScreen - 照片详情
   - PermissionGuideScreen - 权限引导

#### 输出物
- `src/navigation/AppNavigator.tsx`
- `src/navigation/MainTabNavigator.tsx` (如果需要Tab)
- `src/navigation/types.ts`

---

### 任务14: App入口配置

**任务ID**: APP-001
**优先级**: P0
**预计工时**: 1天
**负责人**: TBD
**前置任务**: NAV-001, STATE-001

#### 验收标准
- [ ] App能正常启动
- [ ] 初始化流程正常
- [ ] 状态管理Provider正常工作
- [ ] 导航正常工作

#### 具体步骤

1. **更新App.tsx**
   - 配置 NavigationContainer
   - 配置 AppStateProvider
   - 配置 ThemeProvider (可选)
   - 配置 ErrorBoundary

2. **初始化流程**
   - 应用启动
   - 初始化数据库
   - 初始化AI服务
   - 加载照片列表
   - 渲染首页

#### 输出物
- `src/App.tsx`
- `index.js`

---

### 任务15: 增量更新功能

**任务ID**: SCAN-002
**优先级**: P1
**预计工时**: 2天
**负责人**: TBD
**前置任务**: SCAN-001

#### 验收标准
- [ ] 能检测新增照片
- [ ] 后台自动索引新照片
- [ ] 增量扫描不影响用户体验

#### 具体步骤

1. **实现增量扫描**
   - 在 ScannerService 中添加增量扫描逻辑
   - 对比本地数据库和相册照片列表
   - 只处理新增照片

2. **后台扫描策略**
   - 应用启动时检查
   - 定期检测 (如每天一次)
   - 低优先级执行，不影响用户操作

3. **事件通知**
   - 新增照片索引完成通知
   - 可选：显示提示

#### API扩展
- [ ] `checkForNewPhotos()` - 检查新照片
- [ ] `scanNewPhotos()` - 扫描新照片

#### 输出物
- 更新 `src/services/scanner/ScannerService.ts`

---

### 任务16: 搜索增强功能

**任务ID**: SEARCH-002
**优先级**: P1
**预计工时**: 2天
**负责人**: TBD
**前置任务**: SEARCH-001

#### 验收标准
- [ ] 时间范围筛选正常
- [ ] 相似度阈值调整正常
- [ ] 搜索结果可按时间排序

#### 具体步骤

1. **实现时间筛选**
   - 相对时间解析 ("去年", "上周", "昨天")
   - 具体时间范围筛选

2. **实现相似度筛选**
   - UI滑块调整阈值
   - 根据阈值过滤结果

3. **排序选项**
   - 按相似度排序 (默认)
   - 按时间排序

#### API扩展
- [ ] `advancedSearch()` - 高级搜索
- [ ] 更新 `search()` 支持时间范围参数

#### 输出物
- 更新 `src/services/search/SearchService.ts`
- 新增筛选UI组件

---

### 任务17: 测试编写

**任务ID**: TEST-001
**优先级**: P1
**预计工时**: 3天
**负责人**: TBD
**前置任务**: 各服务层完成

#### 验收标准
- [ ] 单元测试覆盖率 > 80%
- [ ] 集成测试通过
- [ ] E2E测试覆盖核心流程

#### 具体步骤

1. **单元测试**
   - AIService 测试
   - DBService 测试
   - ScannerService 测试 (Mock)
   - SearchService 测试 (Mock)
   - 工具函数测试

2. **集成测试**
   - 扫描+索引+搜索完整链路
   - 权限流程

3. **E2E测试**
   - 搜索流程
   - 扫描流程
   - 浏览流程

#### 输出物
- `src/services/**/__tests__/*.test.ts`
- `tests/integration/*.test.ts`
- `tests/e2e/*.test.ts`

---

### 任务18: 性能优化

**任务ID**: PERF-001
**优先级**: P1
**预计工时**: 2天
**负责人**: TBD
**前置任务**: 功能开发完成

#### 验收标准
- [ ] 冷启动时间 < 3秒
- [ ] 搜索响应时间 < 500ms
- [ ] 索引速度 > 10张/秒
- [ ] 内存占用 < 200MB

#### 具体步骤

1. **启动优化**
   - 延迟加载非必要模块
   - 模型异步加载

2. **搜索优化**
   - 搜索结果缓存
   - 向量搜索优化

3. **内存优化**
   - 大图及时释放
   - 定期GC触发

4. **列表优化**
   - FlatList 虚拟滚动
   - 图片懒加载

#### 输出物
- 性能优化代码
- 性能测试报告

---

### 任务19: 隐私与安全功能

**任务ID**: PRIVACY-001
**优先级**: P1
**预计工时**: 2天
**负责人**: TBD
**前置任务**: INIT-001

#### 验收标准
- [ ] 应用锁功能正常
- [ ] 生物识别认证正常
- [ ] 隐私声明页面正常

#### 具体步骤

1. **实现应用锁**
   - 使用 expo-local-authentication
   - 支持生物识别/密码
   - 后台切换回来时验证

2. **隐私声明**
   - 创建隐私声明页面
   - 首次启动展示

3. **数据安全**
   - 数据库加密 (可选)

#### 输出物
- `src/services/security/SecurityService.ts`
- `src/screens/PrivacyScreen/`
- `src/screens/SecuritySettingsScreen/`

---

### 任务20: 构建与发布准备

**任务ID**: BUILD-001
**优先级**: P1
**预计工时**: 2天
**负责人**: TBD
**前置任务**: 功能开发完成

#### 验收标准
- [ ] Android APK能正常构建
- [ ] iOS IPA能正常构建
- [ ] 发布版本能通过审核检查

#### 具体步骤

1. **Android配置**
   - 配置签名密钥
   - 配置应用图标
   - 配置启动图
   - 配置权限声明

2. **iOS配置**
   - 配置签名证书
   - 配置应用图标
   - 配置启动图
   - 配置权限描述

3. **CI/CD配置**
   - 配置 GitHub Actions
   - 配置 EAS Build

#### 输出物
- `android/` 配置更新
- `ios/` 配置更新
- `.github/workflows/ci.yml`
- `eas.json`

---

## 5. 风险评估与缓解

### 5.1 技术风险

| 风险 | 影响 | 缓解措施 |
|------|------|---------|
| ONNX模型加载失败 | 高 | 添加降级提示，预留纯文本搜索模式 |
| 低端机性能不足 | 中 | 检测性能，自动降级 |
| 内存溢出 | 中 | 分批处理，定期GC |
| 数据库损坏 | 中 | 定期备份，异常恢复 |

### 5.2 进度风险

| 风险 | 影响 | 缓解措施 |
|------|------|---------|
| AI模型集成耗时超预期 | 高 | 预留额外3天缓冲 |
| 扫描性能不达标 | 中 | 提前进行性能测试 |
| UI调试时间不足 | 中 | 使用现成UI组件库 |

---

## 6. 关键里程碑检查点

### 检查点1: MVP完成
**时间**: 第2周末
**检查项**:
- [ ] AI模型能正常加载
- [ ] 相册扫描功能正常
- [ ] 基础搜索功能正常
- [ ] 基础UI可用

### 检查点2: v1.0完成
**时间**: 第4周末
**检查项**:
- [ ] 完整搜索体验
- [ ] 增量更新功能
- [ ] 性能达标
- [ ] 测试通过

### 检查点3: 发布准备
**时间**: 第6周末
**检查项**:
- [ ] Android构建成功
- [ ] iOS构建成功
- [ ] 文档完整
- [ ] 审核准备

---

## 7. 附录

### 7.1 任务优先级矩阵

| 任务ID | 任务名称 | P0 | P1 | P2 | 预计工时 | 前置任务 |
|--------|---------|:--:|:--:|:--:|---------|---------|
| INIT-001 | 项目初始化 | ✅ | | | 1天 | - |
| DB-001 | 数据库层 | ✅ | | | 2天 | INIT-001 |
| AI-001 | AI服务层 | ✅ | | | 3天 | INIT-001 |
| PERM-001 | 权限管理 | ✅ | | | 1天 | INIT-001 |
| SCAN-001 | 扫描服务 | ✅ | | | 3天 | AI-001, DB-001, PERM-001 |
| SEARCH-001 | 搜索服务 | ✅ | | | 2天 | AI-001, DB-001 |
| PHOTO-001 | 照片服务 | | ✅ | | 1天 | DB-001 |
| UI-001 | 基础组件 | ✅ | | | 2天 | INIT-001 |
| STATE-001 | 状态管理 | ✅ | | | 1天 | UI-001 |
| SCREEN-001 | SearchScreen | ✅ | | | 2天 | UI-001, SEARCH-001, STATE-001 |
| SCREEN-002 | GalleryScreen | ✅ | | | 2天 | UI-001, SCAN-001, STATE-001 |
| SCREEN-003 | PhotoDetailScreen | ✅ | | | 1天 | UI-001, PHOTO-001 |
| NAV-001 | 导航配置 | ✅ | | | 1天 | SCREEN-001, SCREEN-002, SCREEN-003 |
| APP-001 | App入口 | ✅ | | | 1天 | NAV-001, STATE-001 |
| SCAN-002 | 增量更新 | | ✅ | | 2天 | SCAN-001 |
| SEARCH-002 | 搜索增强 | | ✅ | | 2天 | SEARCH-001 |
| TEST-001 | 测试编写 | | ✅ | | 3天 | 各服务层 |
| PERF-001 | 性能优化 | | ✅ | | 2天 | 功能开发完成 |
| PRIVACY-001 | 隐私安全 | | ✅ | | 2天 | INIT-001 |
| BUILD-001 | 构建发布 | | ✅ | | 2天 | 功能开发完成 |

### 7.2 文档引用速查

- **PRD**: 产品需求、用户故事、功能定义
- **TechSpec**: 技术选型、API定义、性能要求
- **Architecture**: 系统架构、数据流、时序图
- **API**: 完整API接口定义
- **UserStories**: 详细用户故事、验收标准
- **Environment**: 环境配置、CI/CD
- **CodingStyle**: 代码规范、命名规范

### 7.3 关键性能指标

| 指标 | 目标值 | 验证方法 |
|------|--------|---------|
| 冷启动时间 | < 3秒 | 手动测试 |
| 搜索响应时间 | < 500ms | 性能测试 |
| 索引速度 | > 10张/秒 | 性能测试 |
| 内存占用 | < 200MB | 监控工具 |
| 存储占用 | 原始照片5-10% | 存储分析 |

---

**计划版本**: v1.0
**最后更新**: 2026-04-04
**状态**: 待执行
