#!/bin/bash

ASSETS_DIR="src/services/ai/assets"
mkdir -p "$ASSETS_DIR"

echo "Downloading CLIP tokenizer assets from Hugging Face..."

# Download vocab.json
curl -L "https://huggingface.co/openai/clip-vit-base-patch32/resolve/main/vocab.json" -o "$ASSETS_DIR/vocab.json"

# Download merges.txt
curl -L "https://huggingface.co/openai/clip-vit-base-patch32/resolve/main/merges.txt" -o "$ASSETS_DIR/merges.txt"

echo "Tokenizer assets downloaded to $ASSETS_DIR"
ls -la "$ASSETS_DIR"
