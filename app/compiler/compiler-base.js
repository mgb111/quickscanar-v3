import { Detector } from './detector/detector.js';
import { buildImageList, buildTrackingImageList } from './image-list.js';
import { build as hierarchicalClusteringBuild } from './matching/hierarchical-clustering.js';
import * as msgpack from '@msgpack/msgpack';
import * as tf from '@tensorflow/tfjs';

const CURRENT_VERSION = 2;

class CompilerBase {
  constructor() {
    this.data = null;
  }

  // Convert images to .mind format
  compileImageTargets(images, progressCallback) {
    return new Promise(async (resolve, reject) => {
      const targetImages = [];
      
      // Convert images to grayscale
      for (let i = 0; i < images.length; i++) {
        const img = images[i];
        const processCanvas = this.createProcessCanvas(img);
        const processContext = processCanvas.getContext('2d');
        processContext.drawImage(img, 0, 0, img.width, img.height);
        const processData = processContext.getImageData(0, 0, img.width, img.height);

        const greyImageData = new Uint8Array(img.width * img.height);
        for (let i = 0; i < greyImageData.length; i++) {
          const offset = i * 4;
          greyImageData[i] = Math.floor((processData.data[offset] + processData.data[offset + 1] + processData.data[offset + 2]) / 3);
        }
        const targetImage = { data: greyImageData, height: img.height, width: img.width };
        targetImages.push(targetImage);
      }

      // Extract features and compile
      const percentPerImage = 50.0 / targetImages.length;
      let percent = 0.0;
      this.data = [];
      
      for (let i = 0; i < targetImages.length; i++) {
        const targetImage = targetImages[i];
        const imageList = buildImageList(targetImage);
        const percentPerAction = percentPerImage / imageList.length;
        const matchingData = await _extractMatchingFeatures(imageList, () => {
          percent += percentPerAction;
          progressCallback(percent);
        });
        this.data.push({
          targetImage: targetImage,
          imageList: imageList,
          matchingData: matchingData
        });
      }

      // Add tracking data
      for (let i = 0; i < targetImages.length; i++) {
        const trackingImageList = buildTrackingImageList(targetImages[i]);
        this.data[i].trackingImageList = trackingImageList;
      }

      const trackingDataList = await this.compileTrack({progressCallback, targetImages, basePercent: 50});

      for (let i = 0; i < targetImages.length; i++) {
        this.data[i].trackingData = trackingDataList[i];
      }
      resolve(this.data);
    });
  }

  // Export as .mind file
  exportData() {
    const dataList = [];
    for (let i = 0; i < this.data.length; i++) {
      dataList.push({
        targetImage: {
          width: this.data[i].targetImage.width,
          height: this.data[i].targetImage.height,
        },
        trackingData: this.data[i].trackingData,
        matchingData: this.data[i].matchingData
      });
    }
    const buffer = msgpack.encode({
      v: CURRENT_VERSION,
      dataList
    });
    return buffer;
  }

  createProcessCanvas(img) {
    console.warn("missing createProcessCanvas implementation");
  }

  compileTrack({progressCallback, targetImages, basePercent}) {
    console.warn("missing compileTrack implementation");
  }
}

const _extractMatchingFeatures = async (imageList, doneCallback) => {
  const keyframes = [];
  for (let i = 0; i < imageList.length; i++) {
    const image = imageList[i];
    const detector = new Detector(image.width, image.height);

    await tf.nextFrame();
    tf.tidy(() => {
      const inputT = tf.tensor(image.data, [image.data.length], 'float32').reshape([image.height, image.width]);
      const { featurePoints: ps } = detector.detect(inputT);

      const maximaPoints = ps.filter((p) => p.maxima);
      const minimaPoints = ps.filter((p) => !p.maxima);
      const maximaPointsCluster = hierarchicalClusteringBuild({ points: maximaPoints });
      const minimaPointsCluster = hierarchicalClusteringBuild({ points: minimaPoints });

      keyframes.push({
        maximaPoints,
        minimaPoints,
        maximaPointsCluster,
        minimaPointsCluster,
        width: image.width,
        height: image.height,
        scale: image.scale
      });
      doneCallback(i);
    });
  }
  return keyframes;
}

export { CompilerBase } 