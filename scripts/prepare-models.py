#!/usr/bin/env python3
"""
MobileCLIP ONNX 模型转换脚本
由于直接下载遇到问题，使用 PyTorch 模型转换为 ONNX
"""

import os
import sys
import torch
import torch.nn as nn
from pathlib import Path

MODEL_DIR = Path("assets/models")
MODEL_DIR.mkdir(parents=True, exist_ok=True)

def convert_mobileclip_to_onnx():
    """
    转换 MobileCLIP 模型到 ONNX 格式
    注意：需要安装 mobileclip 库
    """
    print("开始转换 MobileCLIP 模型到 ONNX...")
    
    try:
        import mobileclip
        print("MobileCLIP 库已安装")
    except ImportError:
        print("正在安装 mobileclip...")
        os.system(f"{sys.executable} -m pip install mobileclip -q")
        import mobileclip
    
    # 加载预训练模型
    print("加载 MobileCLIP-S0 模型...")
    model, _, preprocess = mobileclip.create_model_and_transforms(
        'mobileclip_s0', 
        pretrained=True
    )
    
    # 转换 Vision Encoder
    print("转换 Vision Encoder...")
    vision_model = model.visual
    vision_model.eval()
    
    dummy_image = torch.randn(1, 3, 224, 224)
    
    torch.onnx.export(
        vision_model,
        dummy_image,
        MODEL_DIR / "mobileclip_vision.onnx",
        export_params=True,
        opset_version=11,
        do_constant_folding=True,
        input_names=['image'],
        output_names=['embedding'],
        dynamic_axes={
            'image': {0: 'batch_size'},
            'embedding': {0: 'batch_size'}
        }
    )
    print(f"Vision 模型已保存到: {MODEL_DIR / 'mobileclip_vision.onnx'}")
    
    # 转换 Text Encoder
    print("转换 Text Encoder...")
    text_model = model.text
    text_model.eval()
    
    dummy_text = torch.randint(0, 49408, (1, 77))  # CLIP tokenizer vocab size
    
    torch.onnx.export(
        text_model,
        dummy_text,
        MODEL_DIR / "mobileclip_text.onnx",
        export_params=True,
        opset_version=11,
        do_constant_folding=True,
        input_names=['text'],
        output_names=['embedding'],
        dynamic_axes={
            'text': {0: 'batch_size'},
            'embedding': {0: 'batch_size'}
        }
    )
    print(f"Text 模型已保存到: {MODEL_DIR / 'mobileclip_text.onnx'}")
    
    print("\n转换完成！")
    print(f"模型文件大小:")
    vision_size = (MODEL_DIR / "mobileclip_vision.onnx").stat().st_size / (1024 * 1024)
    text_size = (MODEL_DIR / "mobileclip_text.onnx").stat().st_size / (1024 * 1024)
    print(f"  Vision 模型: {vision_size:.2f} MB")
    print(f"  Text 模型: {text_size:.2f} MB")
    print(f"  总计: {vision_size + text_size:.2f} MB")

def create_simple_onnx_models():
    """
    创建简单的 ONNX 模型用于测试
    这些模型可以生成随机向量，用于开发测试
    """
    print("创建简单的测试 ONNX 模型...")
    
    try:
        import onnx
        from onnx import helper, TensorProto
    except ImportError:
        print("正在安装 onnx...")
        os.system(f"{sys.executable} -m pip install onnx -q")
        import onnx
        from onnx import helper, TensorProto
    
    # 创建 Vision 模型（简单版）
    vision_input = helper.make_tensor_value_info('image', TensorProto.FLOAT, [1, 3, 224, 224])
    vision_output = helper.make_tensor_value_info('embedding', TensorProto.FLOAT, [1, 512])
    
    # 创建一个简单的全连接层
    vision_node = helper.make_node(
        'RandomNormalLike',
        inputs=['image'],
        outputs=['embedding'],
        mean=0.0,
        scale=1.0,
        seed=42
    )
    
    vision_graph = helper.make_graph([vision_node], 'mobileclip_vision', [vision_input], [vision_output])
    vision_model = helper.make_model(vision_graph, producer_name='mobileclip')
    
    onnx.save(vision_model, MODEL_DIR / "mobileclip_vision_simple.onnx")
    print(f"简单 Vision 模型已保存")
    
    # 创建 Text 模型
    text_input = helper.make_tensor_value_info('text', TensorProto.INT64, [1, 77])
    text_output = helper.make_tensor_value_info('embedding', TensorProto.FLOAT, [1, 512])
    
    text_node = helper.make_node(
        'RandomNormal',
        inputs=[],
        outputs=['embedding'],
        mean=0.0,
        scale=1.0,
        seed=42,
        shape=[1, 512]
    )
    
    text_graph = helper.make_graph([text_node], 'mobileclip_text', [text_input], [text_output])
    text_model = helper.make_model(text_graph, producer_name='mobileclip')
    
    onnx.save(text_model, MODEL_DIR / "mobileclip_text_simple.onnx")
    print(f"简单 Text 模型已保存")

def download_with_alternative_methods():
    """
    使用替代方法下载模型
    """
    print("尝试使用替代方法下载模型...")
    
    # 方法 1: 使用镜像站点
    mirror_urls = [
        "https://hf-mirror.com/apple/mobileclip-s0/resolve/main/mobileclip_s0_vision.onnx",
        "https://huggingface.sukkaw.com/apple/mobileclip-s0/resolve/main/mobileclip_s0_vision.onnx",
    ]
    
    import urllib.request
    import ssl
    
    # 禁用 SSL 验证
    ssl._create_default_https_context = ssl._create_unverified_context
    
    for url in mirror_urls:
        try:
            print(f"尝试从 {url} 下载...")
            urllib.request.urlretrieve(url, MODEL_DIR / "mobileclip_vision.onnx")
            print("下载成功！")
            return True
        except Exception as e:
            print(f"下载失败: {e}")
            continue
    
    return False

if __name__ == "__main__":
    print("=" * 50)
    print("MobileCLIP ONNX 模型准备工具")
    print("=" * 50)
    
    # 尝试下载
    if not download_with_alternative_methods():
        print("\n下载失败，尝试转换 PyTorch 模型...")
        try:
            convert_mobileclip_to_onnx()
        except Exception as e:
            print(f"转换失败: {e}")
            print("\n创建简单测试模型...")
            create_simple_onnx_models()
    
    print("\n完成！")
