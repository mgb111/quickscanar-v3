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

declare module '@maherboughdiri/mind-ar-compiler' {
  interface CompileOptions {
    maxTrack?: number;
    warmupTolerance?: number;
    missTolerance?: number;
  }

  export function compile(imageBuffer: Buffer, options?: CompileOptions): Promise<Buffer>;
  export default { compile };
}