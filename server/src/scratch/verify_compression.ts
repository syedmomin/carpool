import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

async function testCompression() {
  console.log('--- Testing Image Compression ---');
  
  try {
    // Create a 100x100 red square buffer from scratch
    const inputBuffer = await sharp({
      create: {
        width: 100,
        height: 100,
        channels: 3,
        background: { r: 255, g: 0, b: 0 }
      }
    }).png().toBuffer();

    const outputBuffer = await sharp(inputBuffer)
      .webp({ quality: 80 })
      .toBuffer();

    console.log(`✅ Success! Input size: ${inputBuffer.length} bytes, Output size: ${outputBuffer.length} bytes`);
    
    const metadata = await sharp(outputBuffer).metadata();
    console.log(`✅ Output format: ${metadata.format}`);

    if (metadata.format === 'webp') {
      console.log('✅ PASS: Image correctly converted to WebP');
    } else {
      console.log('❌ FAIL: Image format is not WebP');
    }
  } catch (err) {
    console.error('❌ Error during compression test:', err);
  }
}

testCompression();
