declare module '@maherboughdiri/mind-ar-compiler/assets/compiler.js' {
  interface CompilerOptions {
    maxTrackingFeatures?: number;
  }

  interface ProgressCallback {
    (progress: number): void;
  }

  export class Compiler {
    constructor(options?: CompilerOptions);
    compileImageTargets(images: HTMLImageElement[], progressCallback?: ProgressCallback): Promise<any[]>;
    exportData(): ArrayBuffer;
  }
}