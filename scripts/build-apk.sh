#!/usr/bin/env bash
# Small Casino - Standalone Android APK Build Script
# Uses Google's official Bubblewrap CLI to convert PWA to an installable Android APK

set -e

echo "=========================================="
echo "  Small Casino - Android APK Builder"
echo "=========================================="

# 1. Check if Node & NPM are installed
if ! command -v npm &> /dev/null; then
    echo "Error: Node.js and npm are required to build the APK."
    exit 1
fi

APP_URL="${1:-https://ais-pre-rmhlamusjgi34ginggaupo-993882630381.asia-southeast1.run.app}"

echo "Step 1: Installing Bubblewrap CLI..."
npx -y @bubblewrap/cli --version || true

echo "Step 2: Initializing Android project from Manifest..."
echo "Using Web Manifest: $APP_URL/manifest.json"
npx -y @bubblewrap/cli init --manifest="$APP_URL/manifest.json"

echo "Step 3: Compiling signed APK..."
npx -y @bubblewrap/cli build

echo "=========================================="
echo "Build Complete! Your signed .apk file is ready in the current folder."
echo "=========================================="
