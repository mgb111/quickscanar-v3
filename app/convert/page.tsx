'use client';

import { useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import toast from 'react-hot-toast';
import { convertImageToMind, downloadMindFile } from './compiler';

export default function ConvertPage() {
  const [progress, setProgress] = useState(0);
  const [isConverting, setIsConverting] = useState(false);

  useEffect(() => {
    const handleProgress = (event: CustomEvent) => {
      setProgress(event.detail.progress);
    };

    window.addEventListener('mindCompilerProgress', handleProgress as EventListener);
    return () => {
      window.removeEventListener('mindCompilerProgress', handleProgress as EventListener);
    };
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png']
    },
    maxFiles: 1,
    onDrop: async (acceptedFiles) => {
      if (acceptedFiles.length === 0) return;
      
      const file = acceptedFiles[0];
      setIsConverting(true);
      setProgress(0);
      
      try {
        const mindBuffer = await convertImageToMind(file);
        downloadMindFile(mindBuffer, file.name.replace(/\.[^/.]+$/, '.mind'));
        toast.success('Conversion completed successfully!');
      } catch (error) {
        console.error('Conversion failed:', error);
        toast.error('Failed to convert image. Please try again.');
      } finally {
        setIsConverting(false);
        setProgress(0);
      }
    }
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Image to .mind Converter</h1>
      
      <div 
        {...getRootProps()} 
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
          ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}`}
      >
        <input {...getInputProps()} />
        {isDragActive ? (
          <p>Drop the image here...</p>
        ) : (
          <div>
            <p className="mb-2">Drag & drop an image here, or click to select</p>
            <p className="text-sm text-gray-500">Supports JPG and PNG files</p>
          </div>
        )}
      </div>

      {isConverting && (
        <div className="mt-8">
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-center mt-2">Converting... {Math.round(progress)}%</p>
        </div>
      )}
    </div>
  );
}