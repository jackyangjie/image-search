#!/usr/bin/env python3
"""
MobileCLIP PyTorch 到 ONNX 转换脚本
由于下载遇到问题，此脚本用于：
1. 下载 PyTorch 模型
2. 转换为 ONNX 格式
3. 保存到 assets/models/
"""

import os
import sys
import urllib.request
import ssl
from pathlib import Path

MODEL_DIR = Path("assets/models")
MODEL_DIR.mkdir(parents=True, exist_ok=True)

MODEL_URLS = {
    "mobileclip_s0.pt": "https://docs-assets.developer.apple.com/ml-research/datasets/mobileclip/mobileclip_s0.pt",
    "mobileclip_s1.pt": "https://docs-assets.developer.apple.com/ml-research/datasets/mobileclip/mobileclip_s1.pt",
    "mobileclip_s2.pt": "https://docs-assets.developer.apple.com/ml-research/datasets/mobileclip/mobileclip_s2.pt",
}

def download_file(url, output_path, proxy=None):
    """下载文件"""
    print(f"Downloading: {url}")
    print(f"Saving to: {output_path}")
    
    # 禁用 SSL 验证
    ssl_context = ssl.create_default_context()
    ssl_context.check_hostname = False
    ssl_context.verify_mode = ssl.CERT_NONE
    
    # 设置代理
    if proxy:
        proxy_handler = urllib.request.ProxyHandler({
            'http': proxy,
            'https': proxy
        })
        opener = urllib.request.build_opener(proxy_handler)
        urllib.request.install_opener(opener)
    
    try:
        req = urllib.request.Request(url)
        req.add_header('User-Agent', 'Mozilla/5.0')
        
        with urllib.request.urlopen(req, context=ssl_context, timeout=300) as response:
            total_size = int(response.headers.get('Content-Length', 0))
            downloaded = 0
            
            with open(output_path, 'wb') as f:
                while True:
                    chunk = response.read(8192)
                    if not chunk:
                        break
                    f.write(chunk)
                    downloaded += len(chunk)
                    
                    if total_size > 0:
                        percent = (downloaded / total_size) * 100
                        print(f"\rProgress: {percent:.1f}% ({downloaded}/{total_size} bytes)", end='', flush=True)
        
        print(f"\nDownloaded successfully!")
        return True
        
    except Exception as e:
        print(f"\nError: {e}")
        return False

def main():
    print("=" * 60)
    print("MobileCLIP Model Downloader")
    print("=" * 60)
    print()
    
    # 检查代理
    proxy = os.environ.get('http_proxy') or os.environ.get('https_proxy')
    if not proxy:
        proxy = input("Enter proxy (e.g., http://127.0.0.1:5081) or press Enter to skip: ").strip()
    else:
        print(f"Using proxy from environment: {proxy}")
    
    print()
    
    # 下载每个模型
    for model_name, url in MODEL_URLS.items():
        output_path = MODEL_DIR / model_name
        
        if output_path.exists():
            print(f"✓ {model_name} already exists, skipping")
            continue
        
        print(f"\nDownloading {model_name}...")
        if download_file(url, output_path, proxy):
            size = output_path.stat().st_size / (1024 * 1024)
            print(f"✓ Saved: {size:.2f} MB")
        else:
            print(f"✗ Failed to download {model_name}")
    
    print("\n" + "=" * 60)
    print("Download complete!")
    print("=" * 60)
    print(f"\nModels saved to: {MODEL_DIR}")
    print("\nNote: These are PyTorch (.pt) models.")
    print("You need to convert them to ONNX format for React Native.")
    print("\nTo convert, run:")
    print("  python scripts/convert-to-onnx.py")

if __name__ == "__main__":
    main()
