'use client'

import { useState, useCallback, useEffect } from 'react'
import { useDropzone } from 'react-dropzone'
import { Camera, Upload, Video, Image, Download, AlertTriangle, Loader2, ArrowLeft, ArrowRight } from 'lucide-react'
import toast from 'react-hot-toast'
import Link from 'next/link'

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
    <div className="min-h-screen bg-cream">
      {/* Header */}
      <div className="bg-dark-blue shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Link href="/" className="mr-4 text-white/80 hover:text-white">
                <ArrowLeft className="h-6 w-6" />
              </Link>
              <Camera className="h-8 w-8 text-white" />
              <span className="ml-2 text-xl font-bold text-white">AR Image Compiler</span>
            </div>
            <Link
              href="/dashboard/create"
              className="bg-white text-dark-blue px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors"
            >
              Skip to Create Experience
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Brand Covering Image Section */}
        <div className="bg-white border border-gray-200 rounded-2xl p-8 mb-8 shadow-sm">
          <div className="text-center">
            {/* Logo/Icon */}
            <div className="inline-flex items-center justify-center w-20 h-20 bg-dark-blue rounded-full mb-6">
              <Camera className="h-10 w-10 text-white" />
            </div>
            
            {/* Main Heading */}
            <h2 className="text-4xl font-bold text-black mb-4 tracking-tight">
              AR Image Compiler
            </h2>
            
            {/* Subtitle */}
            <p className="text-xl text-gray-600 mb-6 max-w-2xl mx-auto leading-relaxed">
              Transform your images into AR-ready targets with our advanced MindAR compilation engine
            </p>
            
            {/* Feature Highlights */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <div className="text-center">
                <div className="w-16 h-16 bg-dark-blue rounded-full flex items-center justify-center mx-auto mb-4">
                  <Upload className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-black mb-2">Easy Upload</h3>
                <p className="text-gray-600">Simply drag and drop your images to get started</p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-dark-blue rounded-full flex items-center justify-center mx-auto mb-4">
                  <Camera className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-black mb-2">AR Optimized</h3>
                <p className="text-gray-600">Advanced algorithms ensure optimal AR tracking performance</p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-dark-blue rounded-full flex items-center justify-center mx-auto mb-4">
                  <Download className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-black mb-2">Instant Download</h3>
                <p className="text-gray-600">Get your .mind files ready for AR development</p>
              </div>
            </div>
          </div>
        </div>

        {/* File Upload Section */}
        <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
          <h3 className="text-2xl font-bold text-black mb-6 text-center">
            Convert Your Images
          </h3>
          
          <div className="max-w-2xl mx-auto">
                         <div
               {...getMarkerRootProps()}
               className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-colors ${
                 isMarkerDragActive ? 'border-dark-blue bg-blue-50' : 'border-gray-300 hover:border-dark-blue'
               }`}
             >
               <input {...getMarkerInputProps()} />
               <Upload className="h-16 w-16 text-gray-400 mx-auto mb-4" />
               <p className="text-lg text-gray-600 mb-2">
                 {isMarkerDragActive
                   ? 'Drop the image here...'
                   : 'Drag & drop your image here, or click to select'}
               </p>
               <p className="text-sm text-gray-500">
                 Supports JPG, PNG, and other image formats
               </p>
             </div>

             {markerFile && (
               <div className="mt-6">
                 <h4 className="text-lg font-semibold text-black mb-4">Selected File:</h4>
                 <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                   <div className="flex items-center justify-between">
                     <div className="flex items-center">
                       <Image className="h-5 w-5 text-dark-blue mr-3" />
                       <span className="text-black">{markerFile.name}</span>
                     </div>
                     <span className="text-sm text-gray-500">
                       {(markerFile.size / 1024 / 1024).toFixed(2)} MB
                     </span>
                   </div>
                 </div>
                
                <div className="mt-6 text-center">
                  <button
                    onClick={handleConvert}
                    disabled={converting || !markerFile}
                    className="bg-dark-blue text-white px-8 py-3 rounded-lg font-medium hover:bg-red-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center mx-auto"
                  >
                    {converting ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        Compiling...
                      </>
                    ) : (
                      <>
                        <Camera className="h-5 w-5 mr-2" />
                        Compile to AR Format
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Next Step */}
        <div className="text-center mt-8">
          <div className="bg-white border border-gray-200 rounded-xl p-6 inline-block shadow-sm">
            <h3 className="text-black font-semibold mb-2">Ready to create your AR experience?</h3>
            <p className="text-gray-600 text-sm mb-4">
              After converting your images, proceed to create your AR experience with videos and .mind files.
            </p>
            <Link
              href="/dashboard/create"
              className="bg-dark-blue text-white px-6 py-3 rounded-lg font-medium hover:bg-red-800 transition-colors inline-flex items-center"
            >
              Create AR Experience
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
