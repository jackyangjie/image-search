#!/bin/bash

# MobileCLIP 模型下载脚本
# 使用 Apple 官方下载地址

MODEL_DIR="assets/models"
BASE_URL="https://docs-assets.developer.apple.com/ml-research/datasets/mobileclip"

echo "=========================================="
echo "  MobileCLIP 模型下载"
echo "=========================================="
echo ""

# 创建目录
mkdir -p $MODEL_DIR

# 可用的模型列表
MODELS=(
    "mobileclip_s0.pt"
    "mobileclip_s1.pt"
    "mobileclip_s2.pt"
    "mobileclip_b.pt"
    "mobileclip_blt.pt"
)

# 下载函数
download_model() {
    local model_name=$1
    local url="$BASE_URL/$model_name"
    local output_path="$MODEL_DIR/$model_name"
    
    if [ -f "$output_path" ]; then
        echo "✓ $model_name 已存在，跳过下载"
        return 0
    fi
    
    echo "正在下载: $model_name"
    echo "  URL: $url"
    
    if command -v wget &> /dev/null; then
        wget --show-progress -O "$output_path" "$url" 2>&1 | tail -5
    elif command -v curl &> /dev/null; then
        curl -L --progress-bar -o "$output_path" "$url" 2>&1 | tail -5
    else
        echo "✗ 错误: 需要 wget 或 curl"
        return 1
    fi
    
    if [ $? -eq 0 ]; then
        local size=$(ls -lh "$output_path" | awk '{print $5}')
        echo "✓ 下载成功: $size"
        return 0
    else
        echo "✗ 下载失败"
        return 1
    fi
}

# 使用代理（如果提供）
if [ -n "$1" ]; then
    echo "使用代理: $1"
    export http_proxy="$1"
    export https_proxy="$1"
fi

# 下载所有模型
echo "开始下载模型..."
echo ""

for model in "${MODELS[@]}"; do
    download_model "$model"
    echo ""
done

# 显示结果
echo "=========================================="
echo "  下载完成"
echo "=========================================="
echo ""
echo "模型文件:"
ls -lh $MODEL_DIR/*.pt 2>/dev/null || echo "  无 .pt 文件"
echo ""
echo "存储位置: $MODEL_DIR/"
echo ""
echo "提示: PyTorch (.pt) 模型需要转换为 ONNX 格式才能在 React Native 中使用"
