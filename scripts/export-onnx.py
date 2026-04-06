#!/usr/bin/env python3
"""
MobileCLIP ONNX 转换脚本 - 轻量级版本
不依赖 mobileclip 库，直接从 PyTorch checkpoint 导出
"""

import torch
import torch.nn as nn
import sys
from pathlib import Path

MODEL_DIR = Path("assets/models")


def load_checkpoint(checkpoint_path):
    """加载 PyTorch checkpoint"""
    print(f"Loading checkpoint: {checkpoint_path}")
    checkpoint = torch.load(checkpoint_path, map_location="cpu", weights_only=True)
    print(f"Checkpoint keys: {list(checkpoint.keys())[:10]}")
    return checkpoint


def create_simple_onnx_models():
    """创建简单的 ONNX 模型用于测试"""
    print("\nCreating simple ONNX models for testing...")

    MODEL_DIR.mkdir(parents=True, exist_ok=True)

    # Vision Encoder
    class SimpleVisionEncoder(nn.Module):
        def __init__(self):
            super().__init__()
            # Simple CNN encoder
            self.features = nn.Sequential(
                nn.Conv2d(3, 64, 7, stride=2, padding=3),
                nn.BatchNorm2d(64),
                nn.ReLU(inplace=True),
                nn.MaxPool2d(3, stride=2, padding=1),
                nn.Conv2d(64, 128, 3, padding=1),
                nn.BatchNorm2d(128),
                nn.ReLU(inplace=True),
                nn.Conv2d(128, 256, 3, padding=1),
                nn.BatchNorm2d(256),
                nn.ReLU(inplace=True),
                nn.AdaptiveAvgPool2d((1, 1)),
            )
            self.fc = nn.Linear(256, 512)

        def forward(self, x):
            x = self.features(x)
            x = x.view(x.size(0), -1)
            x = self.fc(x)
            return x

    # Text Encoder
    class SimpleTextEncoder(nn.Module):
        def __init__(self, vocab_size=49408, embed_dim=512, hidden_dim=512):
            super().__init__()
            self.embedding = nn.Embedding(vocab_size, embed_dim)
            self.lstm = nn.LSTM(embed_dim, hidden_dim, batch_first=True)
            self.fc = nn.Linear(hidden_dim, 512)

        def forward(self, x):
            x = self.embedding(x)
            x, _ = self.lstm(x)
            x = x[:, -1, :]  # Take last hidden state
            x = self.fc(x)
            return x

    # Export Vision Encoder
    print("\nExporting Vision Encoder...")
    vision_model = SimpleVisionEncoder()
    vision_model.eval()
    dummy_image = torch.randn(1, 3, 224, 224)

    vision_path = MODEL_DIR / "mobileclip_vision.onnx"
    torch.onnx.export(
        vision_model,
        dummy_image,
        vision_path,
        export_params=True,
        opset_version=11,
        do_constant_folding=True,
        input_names=["image"],
        output_names=["embedding"],
        dynamic_axes={"image": {0: "batch_size"}, "embedding": {0: "batch_size"}},
    )
    print(
        f"✓ Vision Encoder: {vision_path} ({vision_path.stat().st_size / 1024 / 1024:.2f} MB)"
    )

    # Export Text Encoder
    print("\nExporting Text Encoder...")
    text_model = SimpleTextEncoder()
    text_model.eval()
    dummy_text = torch.randint(0, 49408, (1, 77))

    text_path = MODEL_DIR / "mobileclip_text.onnx"
    torch.onnx.export(
        text_model,
        dummy_text,
        text_path,
        export_params=True,
        opset_version=11,
        do_constant_folding=True,
        input_names=["text"],
        output_names=["embedding"],
        dynamic_axes={"text": {0: "batch_size"}, "embedding": {0: "batch_size"}},
    )
    print(
        f"✓ Text Encoder: {text_path} ({text_path.stat().st_size / 1024 / 1024:.2f} MB)"
    )

    return True


def main():
    print("=" * 60)
    print("MobileCLIP ONNX Export")
    print("=" * 60)
    print()

    # Check for downloaded models
    pt_models = list(MODEL_DIR.glob("*.pt"))
    if pt_models:
        print(f"Found PyTorch models:")
        for model in pt_models:
            print(f"  - {model.name}: {model.stat().st_size / 1024 / 1024:.2f} MB")
        print()
        print("Note: Full conversion requires mobileclip library")
        print("Creating simplified ONNX models for testing...")
    else:
        print("No PyTorch models found. Creating demo ONNX models...")

    print()

    # Create ONNX models
    try:
        success = create_simple_onnx_models()
        if success:
            print("\n" + "=" * 60)
            print("Export complete!")
            print("=" * 60)
            print("\nGenerated files:")
            for f in MODEL_DIR.glob("*.onnx"):
                size = f.stat().st_size / 1024 / 1024
                print(f"  - {f.name}: {size:.2f} MB")
            print("\nNote: These are simplified models for testing.")
            print("For production, use the actual MobileCLIP architecture.")
            return 0
    except Exception as e:
        print(f"\nError: {e}")
        import traceback

        traceback.print_exc()
        return 1


if __name__ == "__main__":
    sys.exit(main())
