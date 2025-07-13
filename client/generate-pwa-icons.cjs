#!/usr/bin/env node

// generate-pwa-icons.js
// Script to generate PWA icons from a source image

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// Icon sizes needed for PWA
const iconSizes = [
  16, 32, 57, 60, 70, 72, 76, 96, 114, 120, 128, 
  144, 150, 152, 180, 192, 310, 384, 512
];

// Special sizes for Windows tiles
const tileSizes = [
  { size: 310, width: 310, height: 150, name: 'icon-310x150.png' }, // Wide tile
];

// Check if ImageMagick is available
function checkImageMagick() {
  return new Promise((resolve) => {
    exec('magick -version', (error) => {
      if (error) {
        exec('convert -version', (error) => {
          resolve(!error);
        });
      } else {
        resolve(true);
      }
    });
  });
}

// Generate square icons
function generateIcon(sourceImage, size, outputPath) {
  return new Promise((resolve, reject) => {
    const command = `magick "${sourceImage}" -resize ${size}x${size} -quality 95 "${outputPath}"`;
    
    exec(command, (error) => {
      if (error) {
        // Fallback to 'convert' command
        const fallbackCommand = `convert "${sourceImage}" -resize ${size}x${size} -quality 95 "${outputPath}"`;
        exec(fallbackCommand, (fallbackError) => {
          if (fallbackError) {
            reject(fallbackError);
          } else {
            resolve();
          }
        });
      } else {
        resolve();
      }
    });
  });
}

// Generate wide tile for Windows
function generateWideTile(sourceImage, outputPath) {
  return new Promise((resolve, reject) => {
    const command = `magick "${sourceImage}" -resize 310x150 -quality 95 "${outputPath}"`;
    
    exec(command, (error) => {
      if (error) {
        const fallbackCommand = `convert "${sourceImage}" -resize 310x150 -quality 95 "${outputPath}"`;
        exec(fallbackCommand, (fallbackError) => {
          if (fallbackError) {
            reject(fallbackError);
          } else {
            resolve();
          }
        });
      } else {
        resolve();
      }
    });
  });
}

// Create a default source image as base64 SVG
function createDefaultSourceImage() {
  const svgContent = `
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#4f46e5;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#7c3aed;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="80" fill="url(#grad)"/>
  <text x="256" y="280" font-family="Arial, sans-serif" font-size="128" font-weight="bold" 
        text-anchor="middle" fill="white">🎭</text>
  <text x="256" y="380" font-family="Arial, sans-serif" font-size="36" font-weight="bold" 
        text-anchor="middle" fill="white">마피아</text>
  <text x="256" y="420" font-family="Arial, sans-serif" font-size="24" 
        text-anchor="middle" fill="rgba(255,255,255,0.8)">게임</text>
</svg>
  `.trim();
  
  return svgContent;
}

async function main() {
  const sourceImagePath = path.join(__dirname, 'public', 'icons', 'source-icon.svg');
  const iconsDir = path.join(__dirname, 'public', 'icons');
  
  // Ensure icons directory exists
  if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
  }
  
  // Create default source image if it doesn't exist
  if (!fs.existsSync(sourceImagePath)) {
    const svgContent = createDefaultSourceImage();
    fs.writeFileSync(sourceImagePath, svgContent);
    console.log('📱 Created default source icon at:', sourceImagePath);
  }
  
  // Check if ImageMagick is available
  const hasImageMagick = await checkImageMagick();
  
  if (!hasImageMagick) {
    console.log('⚠️  ImageMagick not found. Please install ImageMagick to auto-generate icons.');
    console.log('');
    console.log('Installation instructions:');
    console.log('macOS: brew install imagemagick');
    console.log('Ubuntu: sudo apt-get install imagemagick');
    console.log('Windows: Download from https://imagemagick.org/script/download.php');
    console.log('');
    console.log('Alternative: Use online tools like:');
    console.log('- https://realfavicongenerator.net/');
    console.log('- https://favicon.io/favicon-converter/');
    console.log('');
    console.log('Place your source image at:', sourceImagePath);
    return;
  }
  
  console.log('📱 Generating PWA icons...');
  
  try {
    // Generate square icons
    for (const size of iconSizes) {
      const outputPath = path.join(iconsDir, `icon-${size}x${size}.png`);
      await generateIcon(sourceImagePath, size, outputPath);
      console.log(`✅ Generated ${size}x${size} icon`);
    }
    
    // Generate wide tile
    const wideTilePath = path.join(iconsDir, 'icon-310x150.png');
    await generateWideTile(sourceImagePath, wideTilePath);
    console.log('✅ Generated 310x150 wide tile');
    
    // Generate additional files needed
    const additionalFiles = [
      'badge-72x72.png',
      'action-open.png',
      'action-close.png',
      'shortcut-create.png',
      'shortcut-join.png',
      'shortcut-teacher.png'
    ];
    
    for (const file of additionalFiles) {
      const outputPath = path.join(iconsDir, file);
      const size = file.includes('badge') ? 72 : 96;
      await generateIcon(sourceImagePath, size, outputPath);
      console.log(`✅ Generated ${file}`);
    }
    
    console.log('');
    console.log('🎉 All PWA icons generated successfully!');
    console.log('');
    console.log('You can now:');
    console.log('1. Test PWA installation on mobile devices');
    console.log('2. Check lighthouse audit for PWA score');
    console.log('3. Replace source-icon.svg with your custom design');
    
  } catch (error) {
    console.error('❌ Error generating icons:', error.message);
    console.log('');
    console.log('Manual fallback:');
    console.log('1. Create a 512x512 PNG image with your app icon');
    console.log('2. Use online tools to generate all required sizes');
    console.log('3. Place them in:', iconsDir);
  }
}

if (require.main === module) {
  main();
}

module.exports = { main };