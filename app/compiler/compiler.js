import { CompilerBase } from './compiler-base.js'
import { extractTrackingFeatures } from './tracker/extract-utils.js';
import { buildTrackingImageList } from './image-list.js';

export class Compiler extends CompilerBase {
  createProcessCanvas(img) {
    const processCanvas = document.createElement('canvas');
    processCanvas.width = img.width;
    processCanvas.height = img.height;
    return processCanvas;
  }

  compileTrack({progressCallback, targetImages, basePercent}) {
    return new Promise((resolve, reject) => {
      try {
        const percentPerImage = 100.0 / targetImages.length;
        let percent = 0.0;
        const list = [];

        for (let i = 0; i < targetImages.length; i++) {
          const targetImage = targetImages[i];
          const imageList = buildTrackingImageList(targetImage);
          const percentPerAction = percentPerImage / imageList.length;

          const trackingData = extractTrackingFeatures(imageList, (index) => {
            percent += percentPerAction;
            progressCallback(basePercent + percent * basePercent/100);
          });
          list.push(trackingData);
        }

        resolve(list);
      } catch (error) {
        reject(error);
      }
    });
  }
} 