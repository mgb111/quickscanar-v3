// Simplified detector for marker conversion
import * as tf from '@tensorflow/tfjs';

const PYRAMID_MIN_SIZE = 8;
const PYRAMID_MAX_OCTAVE = 3;

class Detector {
  constructor(width, height, debugMode = false) {
    this.debugMode = debugMode;
    this.width = width;
    this.height = height;
    let numOctaves = 0;
    let w = width;
    let h = height;
    while (w >= PYRAMID_MIN_SIZE && h >= PYRAMID_MIN_SIZE) {
      w /= 2;
      h /= 2;
      numOctaves++;
      if (numOctaves === PYRAMID_MAX_OCTAVE) break;
    }
    this.numOctaves = numOctaves;
  }

  // used in compiler
  detectImageData(imageData) {
    const arr = new Uint8ClampedArray(4 * imageData.length);
    for (let i = 0; i < imageData.length; i++) {
      arr[4 * i] = imageData[i];
      arr[4 * i + 1] = imageData[i];
      arr[4 * i + 2] = imageData[i];
      arr[4 * i + 3] = 255;
    }
    const img = new ImageData(arr, this.width, this.height);
    return this.detect(img);
  }

  detect(inputImageT) {
    // Simplified feature detection for markers
    const data = inputImageT.dataSync ? inputImageT.dataSync() : inputImageT.data;
    const width = inputImageT.shape ? inputImageT.shape[1] : inputImageT.width;
    const height = inputImageT.shape ? inputImageT.shape[0] : inputImageT.height;
    
    const featurePoints = this._detectSimpleFeatures(data, width, height);
    
    return {
      featurePoints: featurePoints,
      debugExtra: null
    };
  }

  _detectSimpleFeatures(data, width, height) {
    const features = [];
    const step = Math.max(8, Math.floor(Math.min(width, height) / 20)); // Adaptive step size
    
    for (let y = step; y < height - step; y += step) {
      for (let x = step; x < width - step; x += step) {
        const center = data[y * width + x];
        let isMaxima = true;
        let isMinima = true;
        
        // Check 3x3 neighborhood
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;
            
            const nx = x + dx;
            const ny = y + dy;
            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
              const neighbor = data[ny * width + nx];
              if (neighbor >= center) isMaxima = false;
              if (neighbor <= center) isMinima = false;
            }
          }
        }
        
        if (isMaxima || isMinima) {
          // Create a simple descriptor (8x8 patch)
          const descriptor = this._createSimpleDescriptor(data, width, height, x, y);
          
          features.push({
            x: x,
            y: y,
            scale: 1.0,
            angle: 0,
            maxima: isMaxima,
            descriptor: descriptor
          });
        }
      }
    }
    
    return features;
  }

  _createSimpleDescriptor(data, width, height, x, y) {
    const descriptor = new Uint8Array(64); // 8x8 = 64 bytes
    const patchSize = 8;
    const halfPatch = patchSize / 2;
    
    for (let py = 0; py < patchSize; py++) {
      for (let px = 0; px < patchSize; px++) {
        const sx = x - halfPatch + px;
        const sy = y - halfPatch + py;
        
        let value = 0;
        if (sx >= 0 && sx < width && sy >= 0 && sy < height) {
          value = data[sy * width + sx];
        }
        
        descriptor[py * patchSize + px] = value;
      }
    }
    
    return descriptor;
  }
}

export { Detector };
