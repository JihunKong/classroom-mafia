#!/bin/bash

# Railway Build Script
echo "🚀 Railway Build Script Starting..."

# Install dependencies
echo "📦 Installing dependencies..."
npm ci
cd client && npm ci
cd ../server && npm ci
cd ..

# Build server first (contains shared dependencies)
echo "🔧 Building server..."
cd server && npm run build
if [ ! -f "dist/index.js" ]; then
    echo "❌ Server build failed - index.js not found"
    exit 1
fi
echo "✅ Server built successfully: $(ls -lh dist/index.js)"
cd ..

# Build client
echo "🎨 Building client..."
cd client && npm run build
if [ ! -d "dist" ]; then
    echo "❌ Client build failed - dist directory not found"
    exit 1
fi
echo "✅ Client built successfully: $(du -sh dist/)"
cd ..

echo "🎉 Build completed successfully!"
echo "📊 Final verification:"
echo "  Server: $(ls -lh server/dist/index.js)"
echo "  Client: $(du -sh client/dist/)"

# Additional verification for Railway
echo ""
echo "📁 Directory structure verification:"
echo "  Current directory: $(pwd)"
echo "  Server dist contents:"
ls -la server/dist/ | head -5
echo "  Client dist contents:"
ls -la client/dist/ | head -5
echo ""
echo "🔍 Testing file paths:"
echo "  index.html exists: $(test -f client/dist/index.html && echo 'YES ✅' || echo 'NO ❌')"
echo "  Server can reach client: $(test -f ../client/dist/index.html && echo 'YES ✅' || echo 'NO ❌')"