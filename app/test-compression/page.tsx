'use client'

import { useState } from 'react'
import { Upload, Video, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import VideoCompressor from '@/components/VideoCompressor'

export default function TestCompression() {
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [showCompression, setShowCompression] = useState(false)
  const [originalVideoFile, setOriginalVideoFile] = useState<File | null>(null)
  const [compressedFile, setCompressedFile] = useState<File | null>(null)

  const handleVideoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const fileSizeMB = file.size / 1024 / 1024
      const maxSizeMB = 10
      
      if (file.size > maxSizeMB * 1024 * 1024) {
        setOriginalVideoFile(file)
        setShowCompression(true)
      } else {
        setVideoFile(file)
      }
    }
  }

  const handleCompressionComplete = (compressed: File) => {
    setCompressedFile(compressed)
    setShowCompression(false)
    setOriginalVideoFile(null)
  }

  const handleCompressionCancel = () => {
    setShowCompression(false)
    setOriginalVideoFile(null)
  }

  const formatFileSize = (bytes: number): string => {
    const mb = bytes / (1024 * 1024)
    return `${mb.toFixed(1)}MB`
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <Link 
            href="/dashboard" 
            className="inline-flex items-center text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Link>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Video Compression Test
          </h1>
          <p className="text-lg text-gray-600">
            Test the video compression functionality
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Upload Video</h2>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <input
              type="file"
              accept="video/*"
              onChange={handleVideoUpload}
              className="hidden"
              id="video-upload"
            />
            <label htmlFor="video-upload" className="cursor-pointer">
              <Video className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-900">
                Click to upload video
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Any video format, will be compressed if over 10MB
              </p>
            </label>
          </div>
        </div>

        {videoFile && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <h3 className="font-medium text-green-800">Video Ready</h3>
            <p className="text-green-700">
              {videoFile.name} - {formatFileSize(videoFile.size)}
            </p>
          </div>
        )}

        {showCompression && originalVideoFile && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <h3 className="font-medium text-yellow-800">Compression Required</h3>
            <p className="text-yellow-700">
              {originalVideoFile.name} - {formatFileSize(originalVideoFile.size)}
            </p>
          </div>
        )}

        {showCompression && originalVideoFile && (
          <VideoCompressor
            file={originalVideoFile}
            onCompressed={handleCompressionComplete}
            onCancel={handleCompressionCancel}
            targetSizeMB={10}
          />
        )}

        {compressedFile && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-medium text-blue-800">Compression Complete!</h3>
            <p className="text-blue-700">
              Original: {originalVideoFile?.name} - {formatFileSize(originalVideoFile?.size || 0)}
            </p>
            <p className="text-blue-700">
              Compressed: {compressedFile.name} - {formatFileSize(compressedFile.size)}
            </p>
            <p className="text-blue-700 font-medium">
              Size reduction: {Math.round(((originalVideoFile?.size || 0) - compressedFile.size) / (originalVideoFile?.size || 1) * 100)}%
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
