# AI 服务修复总结

## 修复内容

### 1. 图像预处理 - 使用正确的 PNG 解码 ✅

**问题**: 原代码使用 `atob` 直接解码 base64，但没有解析 PNG 格式，导致像素数据不正确

**修复**:

- 安装 `fast-png` 库用于 PNG 解码
- 使用 `expo-file-system` 读取文件 base64
- 正确解码 PNG 获取 RGBA 像素数据
- 验证图像格式（256x256, 4通道）

**文件变更**:

- `src/services/ai/ImagePreprocessor.ts` - 完全重写

### 2. 加载完整 CLIP tokenizer - 从 vocab.json 文件加载 ✅

**问题**: 原 tokenizer 只有50个硬编码词汇，不是完整的 CLIP tokenizer

**修复**:

- 从 Hugging Face 下载完整的 CLIP vocab.json 和 merges.txt
- 实现完整的 BPE tokenization 算法
- 支持从文件系统异步加载 tokenizer
- 实现字节级 fallback 编码

**文件变更**:

- `src/services/ai/CLIPTokenizer.ts` - 完全重写
- `src/services/ai/assets/vocab.json` - 新增
- `src/services/ai/assets/merges.txt` - 新增

### 3. 验证模型是否正确加载 - 避免 fallback 到 mock 模式 ✅

**问题**: 原代码默认 `_useMock: boolean = true`，模型加载失败会静默 fallback

**修复**:

- 默认 `_useMock: boolean = false`
- 添加 `forceReal` 参数支持强制真实模式
- 实现模型验证机制 (`validateModels()`)
- 验证 embedding 输出形状和数值
- 添加 `getDebugInfo()` 获取调试信息
- 添加 `isMockMode()`, `isModelValidated()` 等状态查询方法

**文件变更**:

- `src/services/ai/AIService.ts` - 添加验证逻辑和调试功能

## 安装说明

### 1. 安装依赖

```bash
npm install --legacy-peer-deps
```

### 2. 下载 tokenizer 资源

```bash
bash scripts/setup-tokenizer.sh
```

这会下载：

- vocab.json (~862KB)
- merges.txt (~524KB)

并自动复制到 Android/iOS 资源目录

### 3. 放置 ONNX 模型文件

下载 MobileCLIP-S0 ONNX 模型并放置到：

**Android:**

```
android/app/src/main/assets/models/
├── mobileclip_s0_image.onnx
└── mobileclip_s0_text.onnx
```

**iOS:**

```
io/<ProjectName>/models/
├── mobileclip_s0_image.onnx
└── mobileclip_s0_text.onnx
```

### 4. 更新 import 语句

由于 `getTokenizer()` 现在是异步函数，更新 AIService.ts 中的调用：

```typescript
// 之前
const tokenizer = getTokenizer();
const tokenIds = tokenizer.encode(text);

// 现在
const tokenizer = await getTokenizer();
const tokenIds = tokenizer.encode(text);
```

## 使用调试功能

```typescript
const aiService = AIService.getInstance();

// 初始化（强制真实模式，失败会抛出错误）
await aiService.initialize(true);

// 检查状态
console.log('Mock mode:', aiService.isMockMode());
console.log('Validated:', aiService.isModelValidated());
console.log('Debug info:', aiService.getDebugInfo());
```

## 验证修复

运行类型检查：

```bash
npm run typecheck
```

运行测试：

```bash
npm test
```

## 注意事项

1. **fast-png**: 需要 Node.js 18+ 的 Buffer/ArrayBuffer 支持
2. **Tokenizer 路径**: 首次使用时会尝试从多个路径加载，确保资源已正确放置
3. **模型验证**: 在 `initialize()` 时会运行验证，确保模型输出正确
4. **调试日志**: 使用 `getDebugInfo()` 可以获取详细的加载状态
