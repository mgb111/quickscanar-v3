import { extractTrackingFeatures } from './tracker/extract-utils.js';
import { buildTrackingImageList } from './image-list.js';

onmessage = (msg) => {
  const { data } = msg;
  if (data.type === 'compile') {
    const { targetImages } = data;
    const percentPerImage = 100.0 / targetImages.length;
    let percent = 0.0;
    const list = [];
    
    for (let i = 0; i < targetImages.length; i++) {
      const targetImage = targetImages[i];
      const imageList = buildTrackingImageList(targetImage);
      const percentPerAction = percentPerImage / imageList.length;

      const trackingData = extractTrackingFeatures(imageList, (index) => {
        percent += percentPerAction
        postMessage({ type: 'progress', percent });
      });
      list.push(trackingData);
    }
    
    postMessage({
      type: 'compileDone',
      list,
    });
  }
}; 