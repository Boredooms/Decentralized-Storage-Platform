#!/bin/bash

# Render Build Script for DeStore
echo "🚀 Starting DeStore build for Render..."

# Install dependencies
echo "📦 Installing dependencies..."
npm ci --legacy-peer-deps

# Build the application
echo "🔨 Building application..."
npm run build

# Verify build
if [ -d "dist" ]; then
    echo "✅ Build successful! Files ready in dist/"
    ls -la dist/
else
    echo "❌ Build failed - dist directory not found"
    exit 1
fi

echo "🎉 DeStore build completed successfully!"