import React from "react";

declare global {
  namespace JSX {
    interface IntrinsicElements {
      "a-scene": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
      "a-assets": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
      "a-asset-item": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
      "a-camera": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
      "a-entity": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
      "a-plane": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
      "a-box": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
      "a-sphere": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
      "a-cylinder": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
      "a-sky": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
      "a-light": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
      "a-animation": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
      // Add more A-Frame elements as needed
    }
  }
} 