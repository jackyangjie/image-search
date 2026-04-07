#!/bin/bash

set -e

echo "=== SmartPhoto Search Setup Script ==="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running in the correct directory
if [ ! -f "package.json" ]; then
    print_error "Please run this script from the project root directory"
    exit 1
fi

print_info "Setting up tokenizer assets..."

# Create tokenizer assets directory
mkdir -p src/services/ai/assets/tokenizer

# Check if vocab.json exists
if [ ! -f "src/services/ai/assets/tokenizer/vocab.json" ]; then
    print_warn "vocab.json not found. Downloading from Hugging Face..."
    curl -L "https://huggingface.co/openai/clip-vit-base-patch32/resolve/main/vocab.json" \
        -o "src/services/ai/assets/tokenizer/vocab.json" \
        --progress-bar || {
        print_error "Failed to download vocab.json"
        exit 1
    }
    print_info "vocab.json downloaded successfully"
else
    print_info "vocab.json already exists"
fi

# Check if merges.txt exists
if [ ! -f "src/services/ai/assets/tokenizer/merges.txt" ]; then
    print_warn "merges.txt not found. Downloading from Hugging Face..."
    curl -L "https://huggingface.co/openai/clip-vit-base-patch32/resolve/main/merges.txt" \
        -o "src/services/ai/assets/tokenizer/merges.txt" \
        --progress-bar || {
        print_error "Failed to download merges.txt"
        exit 1
    }
    print_info "merges.txt downloaded successfully"
else
    print_info "merges.txt already exists"
fi

# Verify tokenizer files
VOCAB_SIZE=$(wc -c < src/services/ai/assets/tokenizer/vocab.json)
MERGES_SIZE=$(wc -c < src/services/ai/assets/tokenizer/merges.txt)

print_info "Tokenizer assets verified:"
print_info "  - vocab.json: $VOCAB_SIZE bytes"
print_info "  - merges.txt: $MERGES_SIZE bytes"

# Setup Android assets directory
if [ -d "android/app/src/main/assets" ]; then
    print_info "Setting up Android assets..."
    mkdir -p android/app/src/main/assets/tokenizer
    cp src/services/ai/assets/tokenizer/vocab.json android/app/src/main/assets/tokenizer/
    cp src/services/ai/assets/tokenizer/merges.txt android/app/src/main/assets/tokenizer/
    print_info "Android tokenizer assets copied"
fi

# Setup iOS assets directory
if [ -d "ios" ]; then
    print_info "Setting up iOS assets..."
    # Find the main app directory
    IOS_APP_DIR=$(find ios -name "*.xcodeproj" -maxdepth 1 | head -1 | sed 's/\.xcodeproj$//')
    if [ -n "$IOS_APP_DIR" ]; then
        mkdir -p "$IOS_APP_DIR/tokenizer"
        cp src/services/ai/assets/tokenizer/vocab.json "$IOS_APP_DIR/tokenizer/"
        cp src/services/ai/assets/tokenizer/merges.txt "$IOS_APP_DIR/tokenizer/"
        print_info "iOS tokenizer assets copied to $IOS_APP_DIR/tokenizer/"
    else
        print_warn "iOS app directory not found, skipping iOS setup"
    fi
fi

echo ""
print_info "Setup complete!"
echo ""
echo "Next steps:"
echo "  1. Download MobileCLIP ONNX models to android/app/src/main/assets/models/"
echo "  2. Run: npm install (if not already done)"
echo "  3. Run: npx expo run:android or npx expo run:ios"
echo ""
