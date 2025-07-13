#!/usr/bin/env node

// create-basic-icons.cjs
// Simple script to create basic PNG icons using HTML5 Canvas (node-canvas)

const fs = require('fs');
const path = require('path');

// Essential icon sizes for PWA
const essentialSizes = [16, 32, 72, 96, 128, 144, 152, 192, 384, 512];

// Create a simple base64 PNG for each size
function createBase64Icon(size) {
  // Create a simple data URL for a colored square with emoji
  const canvas = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#4f46e5;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#7c3aed;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="${size}" height="${size}" rx="${size/8}" fill="url(#grad)"/>
      <text x="${size/2}" y="${size/2 + size/16}" font-family="Arial" font-size="${size/8}" 
            text-anchor="middle" fill="white">🎭</text>
    </svg>
  `;
  
  return Buffer.from(canvas);
}

// Convert SVG to base64 data URL
function svgToDataUrl(svgContent) {
  return `data:image/svg+xml;base64,${Buffer.from(svgContent).toString('base64')}`;
}

async function createBasicIcons() {
  const iconsDir = path.join(__dirname, 'public', 'icons');
  
  // Ensure icons directory exists
  if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
  }
  
  console.log('📱 Creating basic PWA icons...');
  
  try {
    // Create essential square icons
    for (const size of essentialSizes) {
      const svgContent = `
<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad${size}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#4f46e5;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#7c3aed;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${Math.max(8, size/12)}" fill="url(#grad${size})"/>
  <text x="${size/2}" y="${size/2 + size/16}" font-family="Arial, sans-serif" 
        font-size="${Math.max(12, size/8)}" font-weight="bold"
        text-anchor="middle" fill="white">🎭</text>
</svg>`.trim();
      
      const iconPath = path.join(iconsDir, `icon-${size}x${size}.svg`);
      fs.writeFileSync(iconPath, svgContent);
      console.log(`✅ Created ${size}x${size} icon (SVG)`);
    }
    
    // Create additional required files
    const additionalIcons = [
      { name: 'badge-72x72.svg', size: 72 },
      { name: 'action-open.svg', size: 24 },
      { name: 'action-close.svg', size: 24 },
      { name: 'shortcut-create.svg', size: 96 },
      { name: 'shortcut-join.svg', size: 96 },
      { name: 'shortcut-teacher.svg', size: 96 },
      { name: 'icon-310x150.svg', width: 310, height: 150 } // Wide tile
    ];
    
    for (const icon of additionalIcons) {
      const width = icon.width || icon.size;
      const height = icon.height || icon.size;
      const fontSize = Math.max(12, Math.min(width, height) / 8);
      
      let content = '🎭';
      if (icon.name.includes('create')) content = '➕';
      else if (icon.name.includes('join')) content = '🚪';
      else if (icon.name.includes('teacher')) content = '👨‍🏫';
      else if (icon.name.includes('open')) content = '📱';
      else if (icon.name.includes('close')) content = '✕';
      
      const svgContent = `
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad_${icon.name}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#4f46e5;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#7c3aed;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="${width}" height="${height}" rx="${Math.max(8, Math.min(width, height)/12)}" fill="url(#grad_${icon.name})"/>
  <text x="${width/2}" y="${height/2 + fontSize/4}" font-family="Arial, sans-serif" 
        font-size="${fontSize}" font-weight="bold"
        text-anchor="middle" fill="white">${content}</text>
</svg>`.trim();
      
      const iconPath = path.join(iconsDir, icon.name);
      fs.writeFileSync(iconPath, svgContent);
      console.log(`✅ Created ${icon.name} (SVG)`);
    }
    
    // Update manifest.json to use SVG icons temporarily
    const manifestPath = path.join(__dirname, 'public', 'manifest.json');
    if (fs.existsSync(manifestPath)) {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      
      // Update icon references to use SVG files
      manifest.icons = manifest.icons.map(icon => ({
        ...icon,
        src: icon.src.replace('.png', '.svg'),
        type: 'image/svg+xml'
      }));
      
      fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
      console.log('✅ Updated manifest.json to use SVG icons');
    }
    
    console.log('');
    console.log('🎉 Basic PWA icons created successfully!');
    console.log('');
    console.log('📝 Note: SVG icons are being used as fallbacks.');
    console.log('For production, consider converting to PNG using:');
    console.log('- Online converters (realfavicongenerator.net)');
    console.log('- Installing ImageMagick: brew install imagemagick');
    console.log('- Using design tools like Figma or Sketch');
    
  } catch (error) {
    console.error('❌ Error creating icons:', error.message);
  }
}

if (require.main === module) {
  createBasicIcons();
}

module.exports = { createBasicIcons };