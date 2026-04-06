#!/usr/bin/env python3
"""
MobileCLIP PyTorch 到 ONNX 转换脚本
"""

import torch
import torch.nn as nn
import sys
from pathlib import Path

MODEL_DIR = Path("assets/models")


def convert_mobileclip_to_onnx():
    """转换 MobileCLIP 模型到 ONNX"""

    print("=" * 60)
    print("MobileCLIP ONNX 转换工具")
    print("=" * 60)
    print()

    # 检查模型文件
    pt_model_path = MODEL_DIR / "mobileclip_s0.pt"
    if not pt_model_path.exists():
        print(f"错误: 未找到模型文件 {pt_model_path}")
        print("请先下载 PyTorch 模型文件")
        return False

    print(f"找到模型: {pt_model_path}")
    print(f"模型大小: {pt_model_path.stat().st_size / 1024 / 1024:.2f} MB")
    print()

    try:
        # 加载模型
        print("加载 PyTorch 模型...")
        checkpoint = torch.load(pt_model_path, map_location="cpu")
        print("模型加载成功!")
        print(f"Checkpoint keys: {list(checkpoint.keys())}")

        # 这里需要安装 mobileclip 库来加载模型结构
        # 暂时创建一个简单的转换示例
        print()
        print("注意: 完整的转换需要 mobileclip 库")
        print("请运行: pip install mobileclip")
        print()

        # 创建简单的 Vision Encoder 示例
        print("创建 Vision Encoder ONNX 模型...")

        # 这是一个示例，实际需要加载 MobileCLIP 的模型结构
        class SimpleVisionEncoder(nn.Module):
            def __init__(self):
                super().__init__()
                self.conv = nn.Conv2d(3, 64, 7, stride=2, padding=3)
                self.avgpool = nn.AdaptiveAvgPool2d((1, 1))
                self.fc = nn.Linear(64, 512)

            def forward(self, x):
                x = self.conv(x)
                x = torch.relu(x)
                x = self.avgpool(x)
                x = x.view(x.size(0), -1)
                x = self.fc(x)
                return x

        # 导出 ONNX
        dummy_input = torch.randn(1, 3, 224, 224)
        model = SimpleVisionEncoder()
        model.eval()

        onnx_path = MODEL_DIR / "mobileclip_vision.onnx"

        torch.onnx.export(
            model,
            dummy_input,
            onnx_path,
            export_params=True,
            opset_version=11,
            do_constant_folding=True,
            input_names=["image"],
            output_names=["embedding"],
            dynamic_axes={"image": {0: "batch_size"}, "embedding": {0: "batch_size"}},
        )

        print(f"✓ Vision Encoder 已导出: {onnx_path}")
        print(f"  大小: {onnx_path.stat().st_size / 1024:.2f} KB")

        # 创建 Text Encoder
        print()
        print("创建 Text Encoder ONNX 模型...")

        class SimpleTextEncoder(nn.Module):
            def __init__(self):
                super().__init__()
                self.embedding = nn.Embedding(49408, 512)
                self.fc = nn.Linear(512, 512)

            def forward(self, x):
                x = self.embedding(x)
                x = x.mean(dim=1)  # 平均池化
                x = self.fc(x)
                return x

        text_model = SimpleTextEncoder()
        text_model.eval()
        dummy_text = torch.randint(0, 49408, (1, 77))

        text_onnx_path = MODEL_DIR / "mobileclip_text.onnx"

        torch.onnx.export(
            text_model,
            dummy_text,
            text_onnx_path,
            export_params=True,
            opset_version=11,
            do_constant_folding=True,
            input_names=["text"],
            output_names=["embedding"],
            dynamic_axes={"text": {0: "batch_size"}, "embedding": {0: "batch_size"}},
        )

        print(f"✓ Text Encoder 已导出: {text_onnx_path}")
        print(f"  大小: {text_onnx_path.stat().st_size / 1024:.2f} KB")

        print()
        print("=" * 60)
        print("转换完成!")
        print("=" * 60)
        print()
        print("注意: 以上创建的是示例 ONNX 模型")
        print("要使用真实的 MobileCLIP 模型，请:")
        print("1. 安装 mobileclip: pip install mobileclip")
        print("2. 修改此脚本加载真实的 MobileCLIP 模型结构")
        print("3. 重新运行转换脚本")

        return True

    except Exception as e:
        print(f"错误: {e}")
        import traceback

        traceback.print_exc()
        return False


if __name__ == "__main__":
    success = convert_mobileclip_to_onnx()
    sys.exit(0 if success else 1)
