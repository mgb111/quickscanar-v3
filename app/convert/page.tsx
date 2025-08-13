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

      {/* Brand Covering Image Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 mx-4 mt-6 rounded-2xl shadow-2xl">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-black/10">
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }} />
        </div>
        
        {/* Content */}
        <div className="relative px-8 py-12 text-center">
          {/* Logo/Icon */}
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 rounded-full backdrop-blur-sm mb-6">
            <Camera className="h-10 w-10 text-white" />
          </div>
          
          {/* Main Heading */}
          <h2 className="text-4xl font-bold text-white mb-4 tracking-tight">
            AR Image Compiler
          </h2>
          
          {/* Subtitle */}
          <p className="text-xl text-white/90 mb-6 max-w-2xl mx-auto leading-relaxed">
            Transform your images into AR-ready targets with our advanced MindAR compilation engine
          </p>
          
          {/* Feature Highlights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Image className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-white font-semibold mb-2">Smart Processing</h3>
              <p className="text-white/80 text-sm">Advanced image analysis for optimal AR tracking</p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Download className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-white font-semibold mb-2">Instant Download</h3>
              <p className="text-white/80 text-sm">Get your .mind file ready for AR development</p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                <Camera className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-white font-semibold mb-2">AR Ready</h3>
              <p className="text-white/80 text-sm">Compatible with MindAR and major AR frameworks</p>
            </div>
          </div>
        </div>
        
        {/* Bottom Wave Effect */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="w-full h-12">
            <path d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z" opacity=".25" fill="white"></path>
            <path d="M0,0V15.81C13,36.92,27.64,56.86,47.69,72.05,99.41,111.27,165,111,224.58,91.58c31.15-10.15,60.09-26.07,89.67-39.8,40.92-19,84.73-46,130.83-49.67,36.26-2.85,70.9,9.42,98.6,31.56,31.77,25.39,62.32,62,103.63,73,40.44,10.71,81.35-6.69,119.13-24.28s75.16-39,116.92-43.05c59.73-5.85,113.28,22.88,168.9,38.84,30.2,8.66,59,6.17,87.09-7.5,22.43-10.89,48-26.93,65.6-49.24V0Z" opacity=".5" fill="white"></path>
            <path d="M0,0V5.63C149.93,59,314.09,71.32,475.83,42.57c43-7.64,84.23-20.12,127.61-26.46,59-8.63,112.48,12.24,165.56,35.4C827.93,77.22,886,95.24,951.2,90c86.53-7,172.46-45.71,248.8-84.81V0Z" fill="white"></path>
          </svg>
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