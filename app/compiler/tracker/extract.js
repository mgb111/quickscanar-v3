import {Cumsum} from '../utils/cumsum.js';

const SEARCH_SIZE1 = 10;
const SEARCH_SIZE2 = 2;
const TEMPLATE_SIZE = 6;
const TEMPLATE_SD_THRESH = 5.0;
const MAX_SIM_THRESH = 0.95;
const MAX_THRESH = 0.9;
const MIN_THRESH = 0.2;
const SD_THRESH = 8.0;
const OCCUPANCY_SIZE = 24 * 2 / 3;

/*
 * Input image is in grey format. the imageData array size is width * height. value range from 0-255
 * pixel value at row r and c = imageData[r * width + c]
 *
 * @param {Uint8Array} options.imageData
 * @param {int} options.width image width
 * @param {int} options.height image height
 */
const extract = (image) => {
  const {data: imageData, width, height, scale} = image;

  // Step 1 - filter out interesting points. Interesting points have strong pixel value changed across neighbours
  const isPixelSelected = new Array(width * height);
  for (let i = 0; i < isPixelSelected.length; i++) isPixelSelected[i] = false;

  // Step 1.1 consider a pixel at position (x, y). compute gradient magnitude
  const dValue = new Float32Array(imageData.length);
  for (let i = 0; i < width; i++) {
    dValue[i] = -1;
    dValue[width * (height-1) + i] = -1;
  }
  for (let j = 0; j < height; j++) {
    dValue[j*width] = -1;
    dValue[j*width + width-1] = -1;
  }

  for (let i = 1; i < width-1; i++) {
    for (let j = 1; j < height-1; j++) {
      let pos = i + width * j;

      let dx = 0.0;
      let dy = 0.0;
      for (let k = -1; k <= 1; k++) {
        dx += (imageData[pos + width*k + 1] - imageData[pos + width*k -1]);
        dy += (imageData[pos + width + k] - imageData[pos - width + k]);
      }
      dx /= (3 * 256);
      dy /= (3 * 256);
      dValue[pos] = Math.sqrt( (dx * dx + dy * dy) / 2);
    }
  }

  // Step 1.2 - select all pixel which is dValue largest than all its neighbour as "potential" candidate
  const dValueHist = new Uint32Array(1000); // histogram of dvalue scaled to [0, 1000)
  for (let i = 0; i < 1000; i++) dValueHist[i] = 0;
  const neighbourOffsets = [-1, 1, -width, width];
  let allCount = 0;
  for (let i = 1; i < width-1; i++) {
    for (let j = 1; j < height-1; j++) {
      let pos = i + width * j;
      let isMax = true;
      for (let d = 0; d < neighbourOffsets.length; d++) {
        if (dValue[pos] <= dValue[pos + neighbourOffsets[d]]) {
          isMax = false;
          break;
        }
      }
      if (isMax) {
        let k = Math.floor(dValue[pos] * 1000);
        if (k > 999) k = 999;
        if (k < 0) k = 0;
        dValueHist[k] += 1;
        allCount += 1;
        isPixelSelected[pos] = true;
      }
    }
  }

  // reduce number of points according to dValue.
  const maxPoints = 0.02 * width * height;
  let k = 999;
  let filteredCount = 0;
  while (k >= 0) {
    filteredCount += dValueHist[k];
    if (filteredCount > maxPoints) break;
    k--;
  }

  // Step 2 - for each selected pixel, compute template and similarity
  const points = [];
  const imageDataCumsum = new Cumsum({data: imageData, width, height});
  const imageDataSqrCumsum = new Cumsum({data: imageData.map(x => x * x), width, height});

  for (let i = 1; i < width-1; i++) {
    for (let j = 1; j < height-1; j++) {
      let pos = i + width * j;
      if (!isPixelSelected[pos]) continue;

      let k = Math.floor(dValue[pos] * 1000);
      if (k < 0) k = 0;
      if (k > 999) k = 999;
      if (k < k) continue; // skip if dValue is too small

      const point = _selectFeature({
        imageData,
        width,
        height,
        cx: i,
        cy: j,
        imageDataCumsum,
        imageDataSqrCumsum
      });

      if (point) {
        points.push(point);
      }
    }
  }

  return points;
}

const _selectFeature = (options) => {
  const {imageData, width, height, cx, cy, imageDataCumsum, imageDataSqrCumsum} = options;

  // Simplified feature selection - in practice, you'd want more sophisticated template matching
  const templateSize = TEMPLATE_SIZE;
  const halfSize = Math.floor(templateSize / 2);

  if (cx - halfSize < 0 || cx + halfSize >= width || cy - halfSize < 0 || cy + halfSize >= height) {
    return null;
  }

  // Compute template statistics
  let sum = 0;
  let sumSqr = 0;
  let count = 0;

  for (let i = -halfSize; i <= halfSize; i++) {
    for (let j = -halfSize; j <= halfSize; j++) {
      const x = cx + i;
      const y = cy + j;
      const pos = y * width + x;
      const value = imageData[pos];
      sum += value;
      sumSqr += value * value;
      count++;
    }
  }

  const mean = sum / count;
  const variance = (sumSqr / count) - (mean * mean);
  const sd = Math.sqrt(variance);

  if (sd < TEMPLATE_SD_THRESH) {
    return null;
  }

  return {
    x: cx,
    y: cy,
    scale: 1.0,
    template: {
      mean: mean,
      sd: sd,
      size: templateSize
    }
  };
}

export {
  extract
}; 