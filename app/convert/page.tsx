'use client'

import { useState, useCallback, useEffect } from 'react'
import { useDropzone } from 'react-dropzone'
import { Camera, Upload, Video, Image, Download, AlertTriangle, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ConvertPage() {
  const [markerFile, setMarkerFile] = useState<File | null>(null)
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [markerPreview, setMarkerPreview] = useState<string | null>(null)
  const [videoPreview, setVideoPreview] = useState<string | null>(null)
  const [converting, setConverting] = useState(false)
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)
  const [conversionProgress, setConversionProgress] = useState<string>('')
  const [jobId, setJobId] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)

  const onMarkerDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (file) {
      setMarkerFile(file)
      const reader = new FileReader()
      reader.onload = () => {
        setMarkerPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }, [])

  const onVideoDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (file) {
      setVideoFile(file)
      const reader = new FileReader()
      reader.onload = () => {
        setVideoPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }, [])

  const { getRootProps: getMarkerRootProps, getInputProps: getMarkerInputProps, isDragActive: isMarkerDragActive } = useDropzone({
    onDrop: onMarkerDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png']
    },
    maxFiles: 1
  })

  const { getRootProps: getVideoRootProps, getInputProps: getVideoInputProps, isDragActive: isVideoDragActive } = useDropzone({
    onDrop: onVideoDrop,
    accept: {
      'video/mp4': ['.mp4']
    },
    maxFiles: 1
  })

  // Poll for progress updates
  useEffect(() => {
    if (!jobId || !converting) return

    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/compile-status?jobId=${jobId}`)
        const data = await response.json()
        
        if (data.success) {
          setProgress(data.progress)
          setConversionProgress(getProgressMessage(data.status, data.progress))
          
          if (data.status === 'completed') {
            setConverting(false)
            setDownloadUrl(data.downloadUrl)
            toast.success('MindAR compilation completed! Download your .mind file below.')
          } else if (data.status === 'failed') {
            setConverting(false)
            toast.error(`MindAR compilation failed: ${data.error}`)
          }
        }
      } catch (error) {
        console.error('Progress check failed:', error)
      }
    }, 2000)

    return () => clearInterval(interval)
  }, [jobId, converting])

  const getProgressMessage = (status: string, progress: number): string => {
    switch (status) {
      case 'starting':
        return 'Initializing MindAR compiler...'
      case 'compiling':
        if (progress < 30) return 'Loading MindAR compiler...'
        if (progress < 50) return 'Uploading image to compiler...'
        if (progress < 70) return 'Processing image with MindAR...'
        if (progress < 90) return 'Compiling AR tracking data...'
        return 'Finalizing compilation...'
      case 'completed':
        return 'Compilation completed successfully!'
      case 'failed':
        return 'Compilation failed'
      default:
        return 'Processing...'
    }
  }

  const handleConvert = async () => {
    if (!markerFile) {
      toast.error('Please upload a marker image')
      return
    }

    setConverting(true)
    setProgress(0)
    setConversionProgress('Starting MindAR compilation...')
    setDownloadUrl(null)
    toast.success('Starting MindAR compilation...')

    try {
      // Create form data
      const formData = new FormData()
      formData.append('image', markerFile)

      // Start compilation
      const response = await fetch('/api/compile-mind', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to start compilation')
      }

      const result = await response.json()
      if (result.downloadUrl) {
        setConversionProgress('Compilation completed successfully!')
        setProgress(100)
        setDownloadUrl(result.downloadUrl)
        setConverting(false)
        toast.success('MindAR compilation completed!')
      } else if (result.jobId) {
        setJobId(result.jobId)
        setConversionProgress('Compilation started successfully!')
      } else {
        throw new Error('Unexpected response from compiler')
      }

    } catch (error: any) {
      console.error('MindAR compilation error:', error)
      setConversionProgress(`Compilation failed: ${error.message}`)
      toast.error(`MindAR compilation failed: ${error.message}`)
      setConverting(false)
    }
  }

  const handleDownload = () => {
    if (downloadUrl) {
      const a = document.createElement('a')
      a.href = downloadUrl
      a.download = markerFile ? `${markerFile.name.replace(/\.[^/.]+$/, '')}.mind` : 'mindar-file.mind'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center">
            <Camera className="h-8 w-8 text-primary-600" />
            <span className="ml-2 text-xl font-bold text-gray-900">QuickScanAR - Vercel MindAR Compiler</span>
          </div>
          <p className="mt-2 text-sm text-gray-600">
            Convert your images to real MindAR compatible files using Vercel-optimized serverless compilation
          </p>
        </div>
      </div>

      {/* Vercel Compiler Notice */}
      <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mx-4 mt-4">
        <div className="flex">
          <AlertTriangle className="h-5 w-5 text-blue-400" />
          <div className="ml-3">
            <p className="text-sm text-blue-700">
              <strong>Vercel Serverless MindAR Compiler:</strong> This uses Vercel's serverless functions with optimized Chromium for reliable, scalable compilation.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">Convert Images to MindAR Format</h1>
          </div>

          <div className="p-6 space-y-6">
            {/* File Uploads */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              {/* Marker Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Marker Image *
                </label>
                <div
                  {...getMarkerRootProps()}
                  className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer ${
                    isMarkerDragActive ? 'border-primary-500 bg-primary-50' : 'border-gray-300'
                  }`}
                >
                  <input {...getMarkerInputProps()} />
                  <Image className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-2 text-sm text-gray-600">
                    {isMarkerDragActive
                      ? 'Drop the image here...'
                      : 'Drag & drop an image, or click to select'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">JPG, PNG up to 10MB</p>
                </div>
                {markerPreview && (
                  <div className="mt-2">
                    <img src={markerPreview} alt="Marker preview" className="h-20 w-20 object-cover rounded" />
                  </div>
                )}
              </div>

              {/* Video Upload (Optional for this conversion) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Video File (Optional)
                </label>
                <div
                  {...getVideoRootProps()}
                  className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer ${
                    isVideoDragActive ? 'border-primary-500 bg-primary-50' : 'border-gray-300'
                  } opacity-75`}
                >
                  <input {...getVideoInputProps()} />
                  <Video className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-2 text-sm text-gray-600">
                    {isVideoDragActive
                      ? 'Drop the video here...'
                      : 'Drag & drop a video, or click to select'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">MP4 up to 50MB (optional)</p>
                </div>
                {videoPreview && (
                  <div className="mt-2">
                    <video src={videoPreview} className="h-20 w-20 object-cover rounded" controls />
                  </div>
                )}
              </div>
            </div>

            {/* Convert Button */}
            <div className="flex justify-center">
              <button
                onClick={handleConvert}
                disabled={converting || !markerFile}
                className="bg-primary-600 text-white px-8 py-3 rounded-lg text-lg font-medium hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {converting ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Compiling...
                  </>
                ) : (
                  'Compile with MindAR'
                )}
              </button>
            </div>

            {/* Progress Indicator */}
            {conversionProgress && (
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-blue-800">{conversionProgress}</span>
                    <span className="text-sm font-medium text-blue-800">{progress}%</span>
                  </div>
                  <div className="w-full bg-blue-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Download Section */}
            {downloadUrl && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-green-800">MindAR Compilation Complete!</h3>
                    <p className="text-sm text-green-600 mt-1">
                      Your optimized MindAR file is ready for download.
                    </p>
                  </div>
                  <button
                    onClick={handleDownload}
                    className="bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700 flex items-center"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download .mind
                  </button>
                </div>
              </div>
            )}

            {/* How It Works */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">How Vercel MindAR Compilation Works</h3>
              <div className="space-y-3 text-sm text-gray-600">
                <p>1. <strong>Upload:</strong> Upload your marker image (JPG/PNG)</p>
                <p>2. <strong>Serverless Processing:</strong> Image is sent to Vercel's serverless functions</p>
                <p>3. <strong>MindAR Compilation:</strong> Uses optimized Chromium to compile with official MindAR</p>
                <p>4. <strong>Real-time Progress:</strong> Track compilation progress with live updates</p>
                <p>5. <strong>Vercel Blob Storage:</strong> Your .mind file is automatically stored and served via CDN</p>
                <p className="text-xs text-gray-500 mt-2">
                  <strong>Advantage:</strong> Serverless, scalable, and reliable - no client-side iframe issues!
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}