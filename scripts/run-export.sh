#!/bin/bash

# MobileCLIP ONNX 转换脚本

echo "=========================================="
echo "  MobileCLIP ONNX Export"
echo "=========================================="
echo ""

cd "$(dirname "$0")/.."

# 检查 Python
if ! command -v python3 &> /dev/null; then
    echo "Error: Python3 not found"
    exit 1
fi

echo "Python version:"
python3 --version
echo ""

# 安装依赖
echo "Installing dependencies..."
pip3 install torch torchvision --quiet --user 2>&1 | tail -5
pip3 install onnx --quiet --user 2>&1 | tail -5

echo ""
echo "Running export script..."
python3 scripts/export-onnx.py

echo ""
echo "=========================================="
echo "Checking generated files..."
echo "=========================================="
ls -lh assets/models/*.onnx 2>/dev/null || echo "No ONNX files generated"
