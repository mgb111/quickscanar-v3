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
  export function compileFiles(files: File[]): Promise<ArrayBuffer>;
  export function download(target: ArrayBuffer): void;
  export default { compileFiles, download };
}