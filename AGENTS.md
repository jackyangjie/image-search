# AI 相册搜索 APP - AGENTS.md

**项目**: SmartPhoto Search - AI相册搜索应用  
**类型**: React Native + AI/ML 移动端应用  
**最后更新**: 2026-04-04

---

## OVERVIEW

基于 MobileCLIP 的本地智能相册搜索工具，支持自然语言描述搜索照片。所有AI处理本地完成，保障隐私安全。

---

## STRUCTURE

```
.
├── doc/                          # 项目文档
│   ├── PRD.md                   # 产品需求文档
│   ├── TechSpec.md              # 技术规格文档
│   ├── API.md                   # API接口文档
│   ├── Architecture.md          # 架构设计文档
│   ├── CodingStyle.md           # 代码规范文档
│   ├── Environment.md           # 环境配置说明
│   ├── UserStories.md           # 用户故事文档
│   └── Cache-Logging-Degradation.md  # 缓存/日志/降级策略
└── AGENTS.md                    # 本文件
```

---

## WHERE TO LOOK

| 任务 | 查看文档 | 说明 |
|------|---------|------|
| 了解产品需求 | `doc/PRD.md` | 功能需求、用户故事、数据埋点 |
| 了解技术架构 | `doc/TechSpec.md` + `doc/Architecture.md` | 技术选型、数据流、时序图 |
| 开发接口实现 | `doc/API.md` | 完整API定义、类型、事件 |
| 环境配置 | `doc/Environment.md` | 开发环境、CI/CD、模型管理 |
| 代码规范 | `doc/CodingStyle.md` | 命名规范、代码风格、ESLint配置 |
| 性能优化 | `doc/Cache-Logging-Degradation.md` | 多级缓存、降级策略 |

---

## CONVENTIONS

### 文档规范
- 所有文档使用 Markdown 格式
- 文档标题格式: `{项目名} - {文档类型}`
- 必须包含文档信息表（版本、更新日期、作者）
- 使用相对路径链接相关文档

### 代码规范（预留）
- React Native + TypeScript
- 详见 `doc/CodingStyle.md`

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

- 这是一个**纯文档项目**，代码尚未开始编写
- 所有技术决策已记录在 TechSpec 中
- 下一步: 初始化 React Native 项目结构
- 模型文件 (MobileCLIP ONNX) 需要单独下载
