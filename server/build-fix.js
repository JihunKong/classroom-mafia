// build-fix.js - Ensure proper build for Railway deployment
const fs = require('fs');
const path = require('path');

console.log('🔧 Build Fix Script Running...');
console.log('📁 Current directory:', process.cwd());

// Check if we're in the server directory or root
const isInServer = process.cwd().includes('/server');
const rootDir = isInServer ? '..' : '.';
const serverDir = isInServer ? '.' : './server';

console.log('📂 Root directory:', path.resolve(rootDir));
console.log('📂 Server directory:', path.resolve(serverDir));

// Verify source files exist
const srcIndexPath = path.join(serverDir, 'src', 'index.ts');
const distDir = path.join(serverDir, 'dist');
const distIndexPath = path.join(distDir, 'index.js');

console.log('📄 Checking source file:', srcIndexPath);
if (fs.existsSync(srcIndexPath)) {
  console.log('✅ Source index.ts exists');
} else {
  console.log('❌ Source index.ts NOT found');
  process.exit(1);
}

// Check dist directory
console.log('📁 Checking dist directory:', distDir);
if (fs.existsSync(distDir)) {
  console.log('✅ Dist directory exists');
  const distFiles = fs.readdirSync(distDir);
  console.log('📋 Dist directory contents:', distFiles);
  
  if (fs.existsSync(distIndexPath)) {
    const stats = fs.statSync(distIndexPath);
    console.log('✅ dist/index.js exists');
    console.log('📊 File size:', Math.round(stats.size / 1024), 'KB');
    console.log('🕐 Modified:', stats.mtime.toISOString());
  } else {
    console.log('❌ dist/index.js NOT found');
  }
} else {
  console.log('❌ Dist directory NOT found');
}

console.log('🏁 Build verification complete');