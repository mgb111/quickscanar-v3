import React from "react";

declare global {
  namespace JSX {
    interface IntrinsicElements {
      "a-scene": any;
      "a-assets": any;
      "a-asset-item": any;
      "a-camera": any;
      "a-entity": any;
      "a-plane": any;
      "a-box": any;
      "a-sphere": any;
      "a-cylinder": any;
      "a-sky": any;
      "a-light": any;
      "a-animation": any;
      // Add more A-Frame elements as needed
    }
  }
} 