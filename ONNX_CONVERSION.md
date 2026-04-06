# MobileCLIP ONNX 转换指南

## 模型下载状态

✅ **已完成**:
- `mobileclip_s0.pt` (206 MB) - 已下载
- `mobileclip_s1.pt` (18 MB) - 已下载

## ONNX 转换步骤

由于 React Native 需要使用 ONNX 格式的模型，需要将 PyTorch (.pt) 模型转换为 ONNX (.onnx) 格式。

### 方法 1: 使用转换脚本（推荐）

```bash
# 1. 安装依赖
pip install torch onnx mobileclip

# 2. 运行转换脚本
python scripts/convert-to-onnx.py
```

### 方法 2: 手动转换

```python
import torch
import mobileclip

# 加载模型
model, _, preprocess = mobileclip.create_model_and_transforms(
    'mobileclip_s0',
    pretrained='assets/models/mobileclip_s0.pt'
)
model.eval()

# 重新参数化（用于推理）
from mobileclip.modules.common.mobileone import reparameterize_model
model = reparameterize_model(model)

# 导出 Vision Encoder
dummy_image = torch.randn(1, 3, 224, 224)
torch.onnx.export(
    model.visual,
    dummy_image,
    'assets/models/mobileclip_vision.onnx',
    export_params=True,
    opset_version=11,
    input_names=['image'],
    output_names=['embedding'],
    dynamic_axes={'image': {0: 'batch_size'}, 'embedding': {0: 'batch_size'}}
)

# 导出 Text Encoder
dummy_text = torch.randint(0, 49408, (1, 77))
torch.onnx.export(
    model.text,
    dummy_text,
    'assets/models/mobileclip_text.onnx',
    export_params=True,
    opset_version=11,
    input_names=['text'],
    output_names=['embedding'],
    dynamic_axes={'text': {0: 'batch_size'}, 'embedding': {0: 'batch_size'}}
)
```

### 方法 3: 使用现有的 ONNX 模型

如果转换遇到问题，可以下载社区预转换的 ONNX 模型：

```bash
# 从 Hugging Face 下载 ONNX 模型
wget https://huggingface.co/...
```

## 当前状态

| 模型 | 格式 | 大小 | 状态 |
|------|------|------|------|
| mobileclip_s0.pt | PyTorch | 206 MB | ✅ 已下载 |
| mobileclip_s1.pt | PyTorch | 18 MB | ✅ 已下载 |
| mobileclip_vision.onnx | ONNX | - | ⏳ 待转换 |
| mobileclip_text.onnx | ONNX | - | ⏳ 待转换 |

## 下一步

1. 在本地安装 PyTorch 和 mobileclip
2. 运行转换脚本
3. 将生成的 .onnx 文件复制到 assets/models/
4. 更新 AIService 使用 ONNX Runtime 加载模型

## React Native ONNX Runtime

转换完成后，需要在 React Native 中使用 onnx-react-native 库加载模型：

```typescript
import * as ort from 'onnx-react-native';

// 加载模型
const session = await ort.InferenceSession.create(
  FileSystem.documentDirectory + 'models/mobileclip_vision.onnx'
);

// 运行推理
const feeds = { image: imageTensor };
const results = await session.run(feeds);
const embedding = results.embedding;
```

## 注意事项

- ONNX 模型需要与 onnx-react-native 库的版本兼容
- 输入尺寸必须为 224x224
- 输出为 512 维向量
- 需要在 metro.config.js 中配置模型文件作为资源
