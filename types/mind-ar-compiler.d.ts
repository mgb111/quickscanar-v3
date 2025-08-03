declare module '@maherboughdiri/mind-ar-compiler' {
  interface CompilerOptions {
    maxTrackingFeatures?: number;
  }

  interface ProgressCallback {
    (progress: number): void;
  }

  class MindARCompiler {
    constructor(options?: CompilerOptions);
    compileImageTargets(images: HTMLImageElement[], progressCallback?: ProgressCallback): Promise<any[]>;
    exportData(): ArrayBuffer;
  }

  const compiler: {
    Compiler: typeof MindARCompiler;
  };

  export default compiler;
}