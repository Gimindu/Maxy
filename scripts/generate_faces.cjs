const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// Minimal PNG generator using Node built-in zlib
function crc32(buf) {
  let table = new Int32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c;
  }
  let crc = -1;
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xff];
  }
  return (crc ^ -1) >>> 0;
}

function makeChunk(type, data) {
  const len = data.length;
  const chunk = Buffer.alloc(12 + len);
  chunk.writeUInt32BE(len, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);
  const typeAndData = chunk.subarray(4, 8 + len);
  const crc = crc32(typeAndData);
  chunk.writeUInt32BE(crc, 8 + len);
  return chunk;
}

function createPng(width, height, pixelFn) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // 8 bit
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  const ihdrChunk = makeChunk('IHDR', ihdr);

  // Scanlines with filter 0
  const rowSize = 1 + width * 4;
  const rawData = Buffer.alloc(rowSize * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // Filter: None
    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;
      const [r, g, b, a] = pixelFn(x, y, width, height);
      rawData[pxOffset] = r;
      rawData[pxOffset + 1] = g;
      rawData[pxOffset + 2] = b;
      rawData[pxOffset + 3] = a;
    }
  }

  const compressed = zlib.deflateSync(rawData);
  const idatChunk = makeChunk('IDAT', compressed);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([sig, ihdrChunk, idatChunk, iendChunk]);
}

// Generate cute face: shiny cartoon eyes, rosy cheeks, sweet smile
function generateCuteFace() {
  const size = 512;
  const png = createPng(size, size, (x, y, w, h) => {
    // Transparent background by default
    let r = 0, g = 0, b = 0, a = 0;

    // Distances
    const leftEyeX = 175, rightEyeX = 337, eyeY = 220, eyeRadius = 38;
    const dLeftEye = Math.hypot(x - leftEyeX, y - eyeY);
    const dRightEye = Math.hypot(x - rightEyeX, y - eyeY);

    // Left eye
    if (dLeftEye <= eyeRadius) {
      r = 35; g = 30; b = 38; a = 255;
      // Large sparkle
      if (Math.hypot(x - (leftEyeX - 10), y - (eyeY - 10)) <= 14) {
        r = 255; g = 255; b = 255; a = 255;
      }
      // Small sparkle
      else if (Math.hypot(x - (leftEyeX + 12), y - (eyeY + 12)) <= 6) {
        r = 255; g = 255; b = 255; a = 255;
      }
    }

    // Right eye
    if (dRightEye <= eyeRadius) {
      r = 35; g = 30; b = 38; a = 255;
      // Large sparkle
      if (Math.hypot(x - (rightEyeX - 10), y - (eyeY - 10)) <= 14) {
        r = 255; g = 255; b = 255; a = 255;
      }
      // Small sparkle
      else if (Math.hypot(x - (rightEyeX + 12), y - (eyeY + 12)) <= 6) {
        r = 255; g = 255; b = 255; a = 255;
      }
    }

    // Cheeks (blush)
    const leftCheekX = 135, rightCheekX = 377, cheekY = 280, cheekR = 32;
    const dLeftCheek = Math.hypot(x - leftCheekX, (y - cheekY) * 1.5);
    const dRightCheek = Math.hypot(x - rightCheekX, (y - cheekY) * 1.5);
    if (dLeftCheek <= cheekR) {
      const alpha = Math.floor(180 * (1 - dLeftCheek / cheekR));
      if (a === 0) {
        r = 255; g = 140; b = 160; a = alpha;
      }
    }
    if (dRightCheek <= cheekR) {
      const alpha = Math.floor(180 * (1 - dRightCheek / cheekR));
      if (a === 0) {
        r = 255; g = 140; b = 160; a = alpha;
      }
    }

    // Cute curved smile (w or :3 mouth)
    // Left curve: centered at 235, 275
    // Right curve: centered at 277, 275
    const mouthY = 280;
    const dMouthL = Math.hypot(x - 235, y - mouthY);
    const dMouthR = Math.hypot(x - 277, y - mouthY);
    if ((dMouthL >= 16 && dMouthL <= 22 && y >= mouthY) || (dMouthR >= 16 && dMouthR <= 22 && y >= mouthY)) {
      r = 45; g = 35; b = 40; a = 255;
    }

    return [r, g, b, a];
  });

  const publicDir = path.join(__dirname, '..', 'public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }
  fs.writeFileSync(path.join(publicDir, 'cute_face.png'), png);
  console.log('Successfully created public/cute_face.png');
}

generateCuteFace();
