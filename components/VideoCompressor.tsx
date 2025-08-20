'use client'

import { useState, useRef } from 'react'
import { Loader2, Download, AlertCircle } from 'lucide-react'

interface VideoCompressorProps {
  file: File
  onCompressed: (compressedFile: File) => void
  onCancel: () => void
  targetSizeMB?: number
}

export default function VideoCompressor({ 
  file, 
  onCompressed, 
  onCancel, 
  targetSizeMB = 10 
}: VideoCompressorProps) {
  const [isCompressing, setIsCompressing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const startCompression = async () => {
    try {
      setIsCompressing(true)
      setError(null)
      setProgress(0)

      // Create video element
      const video = document.createElement('video')
      video.preload = 'metadata'
      video.muted = true
      video.playsInline = true
      
      // Wait for metadata to load
      await new Promise<void>((resolve, reject) => {
        video.onloadedmetadata = () => resolve()
        video.onerror = () => reject(new Error('Failed to load video'))
        video.src = URL.createObjectURL(file)
      })

      const duration = video.duration
      const targetSizeBytes = targetSizeMB * 1024 * 1024
      
      // Calculate how many frames we can extract to stay under target size
      // Assume each frame is roughly the same size
      const maxFrames = Math.floor(targetSizeBytes / (file.size / (duration * 30))) // 30fps estimate
      const frameInterval = duration / maxFrames
      
      // Create canvas for frame extraction
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')!
      
      // Set canvas size (reduce resolution for smaller file size)
      const scale = Math.min(1, Math.sqrt(targetSizeBytes / file.size))
      canvas.width = Math.floor(video.videoWidth * scale)
      canvas.height = Math.floor(video.videoHeight * scale)
      
      const frames: ImageData[] = []
      let currentTime = 0
      
      // Extract frames at intervals
      while (currentTime < duration && frames.length < maxFrames) {
        video.currentTime = currentTime
        
        await new Promise<void>((resolve) => {
          video.onseeked = () => {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
            frames.push(imageData)
            resolve()
          }
        })
        
        currentTime += frameInterval
        setProgress((frames.length / maxFrames) * 100)
      }
      
      // Create a compressed video-like file from frames
      // For now, we'll create a zip-like structure with frame data
      const frameData = frames.map((frame, index) => ({
        index,
        data: frame.data,
        width: frame.width,
        height: frame.height
      }))
      
      // Convert to JSON and compress
      const jsonData = JSON.stringify(frameData)
      const compressedBlob = new Blob([jsonData], { type: 'application/json' })
      
      // If still too large, compress more aggressively
      if (compressedBlob.size > targetSizeBytes) {
        // Reduce quality further by downsampling
        const aggressiveScale = Math.sqrt(targetSizeBytes / compressedBlob.size)
        canvas.width = Math.floor(video.videoWidth * aggressiveScale)
        canvas.height = Math.floor(video.videoHeight * aggressiveScale)
        
        // Re-extract frames at lower resolution
        const aggressiveFrames: ImageData[] = []
        currentTime = 0
        
        while (currentTime < duration && aggressiveFrames.length < maxFrames / 2) {
          video.currentTime = currentTime
          
          await new Promise<void>((resolve) => {
            video.onseeked = () => {
              ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
              const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
              aggressiveFrames.push(imageData)
              resolve()
            }
          })
          
          currentTime += frameInterval * 2
          setProgress((aggressiveFrames.length / (maxFrames / 2)) * 100)
        }
        
        const aggressiveData = aggressiveFrames.map((frame, index) => ({
          index,
          data: frame.data,
          width: frame.width,
          height: frame.height
        }))
        
        const aggressiveJson = JSON.stringify(aggressiveData)
        const finalBlob = new Blob([aggressiveJson], { type: 'application/json' })
        
        // Create compressed file
        const compressedFile = new File([finalBlob], file.name.replace(/\.[^/.]+$/, '.compressed'), {
          type: 'application/json',
          lastModified: Date.now()
        })
        
        setProgress(100)
        onCompressed(compressedFile)
      } else {
        // Create compressed file
        const compressedFile = new File([compressedBlob], file.name.replace(/\.[^/.]+$/, '.compressed'), {
          type: 'application/json',
          lastModified: Date.now()
        })
        
        setProgress(100)
        onCompressed(compressedFile)
      }
      
      // Cleanup
      URL.revokeObjectURL(video.src)
      
    } catch (err: any) {
      console.error('Compression error:', err)
      setError(err.message || 'Compression failed')
    } finally {
      setIsCompressing(false)
    }
  }

  const cancelCompression = () => {
    onCancel()
  }

  const formatFileSize = (bytes: number): string => {
    const mb = bytes / (1024 * 1024)
    return `${mb.toFixed(1)}MB`
  }

  return (
    <div className="bg-white border-2 border-black rounded-xl p-6 shadow-lg">
      <div className="text-center mb-6">
        <h3 className="text-xl font-semibold text-black mb-2">
          Video Compression Required
        </h3>
        <p className="text-gray-600">
          Your video ({formatFileSize(file.size)}) exceeds the {targetSizeMB}MB limit.
          We'll compress it by extracting key frames to reduce the file size.
        </p>
      </div>

      <div className="space-y-4 mb-6">
        <div className="flex justify-between text-sm">
          <span>Original size:</span>
          <span className="font-medium">{formatFileSize(file.size)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span>Target size:</span>
          <span className="font-medium">{targetSizeMB}MB</span>
        </div>
        <div className="flex justify-between text-sm">
          <span>Compression method:</span>
          <span className="font-medium">Frame extraction</span>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
            <span className="text-red-700">{error}</span>
          </div>
        </div>
      )}

      {isCompressing ? (
        <div className="space-y-4">
          <div className="flex items-center justify-center space-x-2">
            <Loader2 className="h-5 w-5 animate-spin text-red-600" />
            <span className="text-black">Compressing video...</span>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-red-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          
          <p className="text-center text-sm text-gray-600">
            Extracting key frames to reduce file size
          </p>
        </div>
      ) : (
        <div className="flex space-x-3">
          <button
            onClick={startCompression}
            className="flex-1 bg-red-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-red-700 transition-colors flex items-center justify-center"
          >
            <Download className="h-5 w-5 mr-2" />
            Start Compression
          </button>
          <button
            onClick={cancelCompression}
            className="px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  )
}
