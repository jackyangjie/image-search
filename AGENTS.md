# AI 相册搜索 APP - AGENTS.md

**项目**: SmartPhoto Search - AI相册搜索应用  
**类型**: React Native + AI/ML 移动端应用  
**最后更新**: 2026-04-16

---

## OVERVIEW

基于 MobileCLIP 的本地智能相册搜索工具，支持自然语言描述搜索照片。所有AI处理本地完成，保障隐私安全。

---

## STRUCTURE

```
.
├── src/                          # 源代码
│   ├── components/              # UI组件
│   │   ├── common/              # 通用组件 (PhotoCard, PhotoGrid, SearchBar等)
│   │   └── index.ts
│   ├── screens/                 # 页面
│   │   ├── SearchScreen/        # 搜索页
│   │   ├── GalleryScreen/       # 相册页
│   │   ├── PhotoDetailScreen/   # 照片详情页
│   │   └── PermissionGuideScreen/ # 权限引导页
│   ├── services/                # 服务层
│   │   ├── ai/                  # AI服务 (AIService, ImagePreprocessor, Tokenizer)
│   │   ├── db/                  # 数据库服务 (DBService, schema)
│   │   ├── scanner/             # 扫描服务
│   │   ├── search/              # 搜索服务
│   │   ├── photo/               # 照片服务
│   │   ├── permission/          # 权限服务
│   │   └── event/               # 事件总线
│   ├── context/                 # React Context (AppContext)
│   ├── navigation/              # 导航配置
│   ├── theme/                   # 主题配置
│   ├── types/                   # TypeScript类型定义
│   └── utils/                   # 工具函数
├── assets/                       # 静态资源
│   └── models/                  # AI模型文件 (Chinese-CLIP, SigLIP2)
├── doc/                          # 项目文档
│   ├── PRD.md                   # 产品需求文档
│   ├── TechSpec.md              # 技术规格文档
│   ├── API.md                   # API接口文档
│   ├── Architecture.md          # 架构设计文档
│   ├── CodingStyle.md           # 代码规范文档
│   ├── Environment.md           # 环境配置说明
│   ├── UserStories.md           # 用户故事文档
│   ├── IMPLEMENTATION_STATUS.md # 实现状态跟踪
│   └── Cache-Logging-Degradation.md  # 缓存/日志/降级策略
├── scripts/                      # 构建脚本
├── android/                      # Android原生代码
├── App.tsx                       # 应用入口
├── package.json                  # 依赖配置
└── AGENTS.md                    # 本文件
```

---

## WHERE TO LOOK

| 任务         | 查看文档                                  | 说明                           |
| ------------ | ----------------------------------------- | ------------------------------ |
| 了解产品需求 | `doc/PRD.md`                              | 功能需求、用户故事、数据埋点   |
| 了解技术架构 | `doc/TechSpec.md` + `doc/Architecture.md` | 技术选型、数据流、时序图       |
| 查看实现状态 | `doc/IMPLEMENTATION_STATUS.md`            | 各模块完成度、已知限制、下一步 |
| 开发接口实现 | `doc/API.md`                              | 完整API定义、类型、事件        |
| 环境配置     | `doc/Environment.md`                      | 开发环境、CI/CD、模型管理      |
| 代码规范     | `doc/CodingStyle.md`                      | 命名规范、代码风格、ESLint配置 |
| 性能优化     | `doc/Cache-Logging-Degradation.md`        | 多级缓存、降级策略             |

### 快速开始

```bash
# 安装依赖
npm install --legacy-peer-deps

# 启动开发服务器
npx expo start

# 类型检查
npm run typecheck

# 代码检查
npm run lint
```

---

## CONVENTIONS

### 文档规范

- 所有文档使用 Markdown 格式
- 文档标题格式: `{项目名} - {文档类型}`
- 必须包含文档信息表（版本、更新日期、作者）
- 使用相对路径链接相关文档

### 代码规范

- React Native + TypeScript (详见 `doc/CodingStyle.md`)
- Expo SDK 50
- ESLint + Prettier 配置已启用
- 使用绝对路径导入 (`@/services/...`)

---

## ANTI-PATTERNS

- **不要在文档中重复内容**: 使用链接引用其他文档
- **不要使用过时的术语**: 统一使用文档术语表
- **不要遗漏版本信息**: 所有文档必须包含版本号
- **不要混合语言和代码**: 技术实现细节放在 TechSpec，产品逻辑放在 PRD

---

## UNIQUE STYLES

### 文档优先级标记

- **P0**: MVP必需
- **P1**: v1.0应该实现
- **P2**: v2.0可以实现
- **P3**: 未来版本

### 用户角色代码

- **U1**: 摄影爱好者
- **U2**: 宝妈/宝爸
- **U3**: 商务人士
- **U4**: 隐私敏感用户
- **U5**: 首次使用用户

---

## COMMANDS

```bash
# 查看文档树
ls -la doc/

# 阅读指定文档
cat doc/PRD.md
cat doc/TechSpec.md

# 搜索文档内容
grep -r "关键词" doc/
```

---

## NOTES

- 这是一个**完全可工作的 React Native AI相册搜索应用**，代码已经完整实现
- 项目包含完整的TypeScript代码库（58+文件）和完整的AI推理能力
- 已实现功能：
  - ✅ 完整的UI（搜索页、相册页、照片详情页、权限引导页）
  - ✅ ONNX Runtime + MobileCLIP/Chinese-CLIP/SigLIP2 真实AI推理
  - ✅ SQLite数据库 + 向量相似度搜索
  - ✅ 照片扫描和索引服务
  - ✅ 搜索历史管理
  - ✅ 缩略图生成和缓存
- 未完成/待优化功能详见 `doc/IMPLEMENTATION_STATUS.md`
- 模型文件 (MobileCLIP ONNX) 已包含在assets/models/目录
