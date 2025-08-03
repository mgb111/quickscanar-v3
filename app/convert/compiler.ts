export async function convertImageToMind(imageFile: File): Promise<ArrayBuffer> {
  // Check if we're on the client side
  if (typeof window === 'undefined') {
    throw new Error('This function can only be called on the client side');
  }

  // Only import the compiler on the client side
  const { Compiler } = await import('@maherboughdiri/mind-ar-compiler/assets/compiler.js');
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = async () => {
      try {
        const mindCompiler = new Compiler();
        const images = [img];
        
        const dataList = await mindCompiler.compileImageTargets(images, (progress: number) => {
          // Update progress callback
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('mindCompilerProgress', { 
              detail: { progress: progress } 
            }));
          }
        });
        
        const buffer = mindCompiler.exportData();
        resolve(buffer);
      } catch (error) {
        reject(error);
      }
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(imageFile);
  });
}

export function downloadMindFile(buffer: ArrayBuffer, filename: string = 'target.mind') {
  const blob = new Blob([buffer]);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}