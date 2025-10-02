'use client'

import { useState, useCallback, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import { Camera, Upload, Video, ArrowLeft, ArrowRight, Plus, X, CheckCircle, Box } from 'lucide-react'
import Header from '@/components/Header'
import toast from 'react-hot-toast'
import Script from 'next/script'

// Declare model-viewer for TypeScript
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': any
    }
  }
}

interface ARExperience {
  id: string
  title: string
  mind_file_url: string
  video_file_url: string
  user_id: string
  created_at: string
  updated_at: string
}

export default function CreateExperience() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [contentType, setContentType] = useState<'video' | '3d'>('video')
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [modelFile, setModelFile] = useState<File | null>(null)
  const [mindFile, setMindFile] = useState<File | null>(null)
  const [markerImageFile, setMarkerImageFile] = useState<File | null>(null)
  const [linkUrl, setLinkUrl] = useState('')
  const [modelScale, setModelScale] = useState(1.0)
  const [modelRotation, setModelRotation] = useState(0)

  // Preview states
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null)
  const [modelPreviewUrl, setModelPreviewUrl] = useState<string | null>(null)
  const [markerPreviewUrl, setMarkerPreviewUrl] = useState<string | null>(null)
  const [showCombinedPreview, setShowCombinedPreview] = useState(false)
  const [videoError, setVideoError] = useState(false)

  // 3D model position controls (for combined preview)
  const [modelPositionX, setModelPositionX] = useState(0)
  const [modelPositionY, setModelPositionY] = useState(0.3)
  const [modelPositionZ, setModelPositionZ] = useState(0.15)
  // Video zoom for combined preview
  const [videoScale, setVideoScale] = useState(1.0)

  const [submitting, setSubmitting] = useState(false)

  // Cleanup preview URLs on unmount
  useEffect(() => {
    return () => {
      if (videoPreviewUrl) URL.revokeObjectURL(videoPreviewUrl)
      if (modelPreviewUrl) URL.revokeObjectURL(modelPreviewUrl)
      if (markerPreviewUrl) URL.revokeObjectURL(markerPreviewUrl)
    }
  }, [videoPreviewUrl, modelPreviewUrl, markerPreviewUrl])

  const handleVideoUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Check file size (100MB limit to match server)
      const maxSizeInBytes = 100 * 1024 * 1024 // 100MB
      if (file.size > maxSizeInBytes) {
        toast.error(`Video file too large. Maximum size is 100MB, your file is ${(file.size / 1024 / 1024).toFixed(1)}MB`)
        return
      }

      // Check file type
      const allowedTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/avi', 'video/mov', 'video/quicktime']
      if (!allowedTypes.includes(file.type)) {
        toast.error(`Unsupported video format. Please use MP4, WebM, or MOV files. Current type: ${file.type}`)
        return
      }

      setVideoFile(file)
      
      // Create preview URL
      const previewUrl = URL.createObjectURL(file)
      setVideoPreviewUrl(previewUrl)
      
      toast.success('Video uploaded successfully!')
    }
  }, [])

  const handleModelUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Check file size (50MB limit for 3D models)
      const maxSizeInBytes = 50 * 1024 * 1024 // 50MB
      if (file.size > maxSizeInBytes) {
        toast.error(`3D model file too large. Maximum size is 50MB, your file is ${(file.size / 1024 / 1024).toFixed(1)}MB`)
        return
      }

      // Check file type
      const allowedTypes = ['model/gltf-binary', 'model/gltf+json', 'application/octet-stream']
      const fileName = file.name.toLowerCase()
      if (!fileName.endsWith('.glb') && !fileName.endsWith('.gltf')) {
        toast.error('Please upload a GLB or GLTF file')
        return
      }

      setModelFile(file)
      
      // Create preview URL for 3D model
      const previewUrl = URL.createObjectURL(file)
      setModelPreviewUrl(previewUrl)
      
      toast.success('3D model uploaded successfully!')
    }
  }, [])

  const handleMindUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (!file.name.endsWith('.mind')) {
        toast.error('Please upload a .mind file')
        return
      }
      setMindFile(file)
      toast.success('Mind file uploaded successfully!')
    }
  }, [])

  const handleMarkerImageUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
      if (!allowedTypes.includes(file.type)) {
        toast.error('Please upload a JPG, PNG, or WebP image file')
        return
      }
      const maxSizeInBytes = 10 * 1024 * 1024 // 10MB
      if (file.size > maxSizeInBytes) {
        toast.error(`Image file too large. Maximum size is 10MB, your file is ${(file.size / 1024 / 1024).toFixed(1)}MB`)
        return
      }
      setMarkerImageFile(file)
      
      // Create preview URL for marker image
      const previewUrl = URL.createObjectURL(file)
      setMarkerPreviewUrl(previewUrl)
      
      toast.success('Marker image uploaded successfully!')
    }
  }, [])

  const removeFile = useCallback((type: 'video' | '3d' | 'mind' | 'markerImage') => {
    if (type === 'video') {
      setVideoFile(null)
      if (videoPreviewUrl) {
        URL.revokeObjectURL(videoPreviewUrl)
        setVideoPreviewUrl(null)
      }
    } else if (type === '3d') {
      setModelFile(null)
      if (modelPreviewUrl) {
        URL.revokeObjectURL(modelPreviewUrl)
        setModelPreviewUrl(null)
      }
    } else if (type === 'mind') {
      setMindFile(null)
    } else if (type === 'markerImage') {
      setMarkerImageFile(null)
      if (markerPreviewUrl) {
        URL.revokeObjectURL(markerPreviewUrl)
        setMarkerPreviewUrl(null)
      }
    }
    toast.success(`${type === 'video' ? 'Video' : type === '3d' ? '3D model' : type === 'mind' ? 'Mind file' : 'Marker image'} removed`)
  }, [videoPreviewUrl, modelPreviewUrl, markerPreviewUrl])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!title.trim()) {
      toast.error('Please enter a title for your AR experience')
      return
    }
    
    // Must have at least video OR 3D model (or both)
    if (!videoFile && !modelFile) {
      toast.error('Please upload at least a video file or a 3D model file (or both)')
      return
    }

    if (!mindFile) {
      toast.error('Please upload a mind file')
      return
    }

    if (!markerImageFile) {
      toast.error('Please upload a marker image')
      return
    }

    setSubmitting(true)

    try {
      let videoUrl = ''
      let modelUrl = ''

      // Upload video if provided
      if (videoFile) {
        // Step 1: Get presigned URL for video upload to R2
        const videoPresignedResponse = await fetch('/api/upload/r2', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileName: videoFile.name,
            fileType: 'video',
            contentType: videoFile.type
          })
        })

        if (!videoPresignedResponse.ok) {
          const err = await videoPresignedResponse.json().catch(() => null)
          throw new Error(err?.error || 'Failed to get video upload URL')
        }

        const videoPresignedData = await videoPresignedResponse.json()
        
        // Step 2: Upload video directly to R2 using presigned URL
        const videoUploadResponse = await fetch(videoPresignedData.signedUrl, {
          method: 'PUT',
          body: videoFile,
          headers: {
            'Content-Type': videoFile.type,
          },
        })

        if (!videoUploadResponse.ok) {
          throw new Error('Failed to upload video to R2')
        }

        videoUrl = videoPresignedData.publicUrl
      }

      // Upload 3D model if provided
      if (modelFile) {
        // Step 1: Get presigned URL for 3D model upload to R2
        const modelPresignedResponse = await fetch('/api/upload/r2', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileName: modelFile.name,
            fileType: '3d',
            contentType: modelFile.type || 'application/octet-stream'
          })
        })

        if (!modelPresignedResponse.ok) {
          const err = await modelPresignedResponse.json().catch(() => null)
          throw new Error(err?.error || 'Failed to get 3D model upload URL')
        }

        const modelPresignedData = await modelPresignedResponse.json()
        
        // Step 2: Upload 3D model directly to R2 using presigned URL
        const modelUploadResponse = await fetch(modelPresignedData.signedUrl, {
          method: 'PUT',
          body: modelFile,
          headers: {
            'Content-Type': modelFile.type || 'application/octet-stream',
          },
        })

        if (!modelUploadResponse.ok) {
          throw new Error('Failed to upload 3D model to R2')
        }

        modelUrl = modelPresignedData.publicUrl
      }

      // Upload mind file to R2 (two-step: presign then upload)
      let mindUrl = ''
      if (mindFile) {
        // Step 1: Get presigned URL for .mind upload
        const mindPresignedResponse = await fetch('/api/upload/r2', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileName: mindFile.name,
            fileType: 'mind',
            // .mind is a binary bundle; octet-stream is a safe default
            contentType: 'application/octet-stream',
          }),
        })

        if (!mindPresignedResponse.ok) {
          const err = await mindPresignedResponse.json().catch(() => null)
          throw new Error(err?.error || 'Failed to get mind upload URL')
        }

        const mindPresignedData = await mindPresignedResponse.json()

        // Step 2: Upload .mind directly to R2 using presigned URL
        const mindUploadResponse = await fetch(mindPresignedData.signedUrl, {
          method: 'PUT',
          body: mindFile,
          headers: {
            'Content-Type': 'application/octet-stream',
          },
        })

        if (!mindUploadResponse.ok) {
          throw new Error('Failed to upload mind file to R2')
        }

        mindUrl = mindPresignedData.publicUrl
      }

      // Upload marker image to R2 (two-step: presign then upload)
      let markerImageUrl = ''
      if (markerImageFile) {
        // Step 1: Get presigned URL for marker image upload
        const markerImagePresignedResponse = await fetch('/api/upload/r2', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileName: markerImageFile.name,
            fileType: 'markerImage',
            contentType: markerImageFile.type,
          }),
        })

        if (!markerImagePresignedResponse.ok) {
          const err = await markerImagePresignedResponse.json().catch(() => null)
          throw new Error(err?.error || 'Failed to get marker image upload URL')
        }

        const markerImagePresignedData = await markerImagePresignedResponse.json()

        // Step 2: Upload marker image directly to R2 using presigned URL
        const markerImageUploadResponse = await fetch(markerImagePresignedData.signedUrl, {
          method: 'PUT',
          body: markerImageFile,
          headers: {
            'Content-Type': markerImageFile.type,
          },
        })

        if (!markerImageUploadResponse.ok) {
          throw new Error('Failed to upload marker image to R2')
        }

        markerImageUrl = markerImagePresignedData.publicUrl
      }

      // Determine content type based on what was uploaded
      let determinedContentType = 'video' // default
      if (videoUrl && modelUrl) {
        determinedContentType = 'both' // both video and 3D
      } else if (modelUrl && !videoUrl) {
        determinedContentType = '3d' // only 3D
      } else if (videoUrl && !modelUrl) {
        determinedContentType = 'video' // only video
      }

      // Create AR experience record
      const experienceData = {
        title: title.trim(),
        content_type: determinedContentType,
        video_file_url: videoUrl || null,
        model_url: modelUrl || null,
        model_scale: modelUrl ? modelScale : 1.0,
        model_rotation: modelUrl ? modelRotation : 0,
        model_position_x: modelUrl ? modelPositionX : 0,
        model_position_y: modelUrl ? modelPositionY : 0.3,
        model_position_z: modelUrl ? modelPositionZ : 0.15,
        mind_file_url: mindUrl || null,
        marker_image_url: markerImageUrl || null,
        user_id: user!.id,
        link_url: linkUrl.trim() ? linkUrl.trim() : null
      }

      const experienceResponse = await fetch('/api/ar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(experienceData)
      })

      if (!experienceResponse.ok) {
        const errorData = await experienceResponse.json().catch(() => ({ error: 'Unknown error' }))
        if (experienceResponse.status === 409) {
          if (errorData?.code === 'LIMIT_LIFETIME') {
            toast.error('Free plan allows only 1 campaign lifetime per user. Upgrade to create more.')
            return
          }
          if (errorData?.code === 'LIMIT_EXCEEDED') {
            toast.error('Only 1 campaign is allowed on your current plan. Upgrade to create more.')
            return
          }
        }
        throw new Error(errorData.error || 'Failed to create AR experience')
      }

      const experience = await experienceResponse.json()

      toast.success('AR experience created successfully!')
      
      // Redirect to the new experience
      setTimeout(() => {
        router.push(`/experience/${experience.id}`)
      }, 1000)

    } catch (error) {
      console.error('Error creating AR experience:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to create AR experience')
          } finally {
        setSubmitting(false)
      }
      }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-600"></div>
      </div>
    )
  }

  if (!user) {
    router.push('/auth/signin')
    return null
  }

  return (
    <>
      {/* Load model-viewer for 3D preview */}
      <Script 
        type="module" 
        src="https://ajax.googleapis.com/ajax/libs/model-viewer/3.3.0/model-viewer.min.js"
      />
      
      <div className="min-h-screen bg-cream">
        {/* Navigation */}
        <Header
          showDashboard={false}
          showSignOut={true}
          userEmail={user?.email}
          onSignOut={() => router.push('/auth/signout')}
        />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="text-center text-black mb-12">
          <div className="flex justify-center mb-6">
            <Link 
              href="/dashboard" 
              className="inline-flex items-center text-red-600 hover:text-red-800 text-sm font-medium"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Link>
          </div>
          <h1 className="text-4xl font-bold mb-4 tracking-tight">
            Create AR Experience
          </h1>
          <p className="text-xl opacity-80 max-w-2xl mx-auto leading-relaxed">
            Build an augmented reality experience that displays videos or 3D models when you point your camera at specific images
          </p>
        </div>

        {/* Step 1: Compile Image to AR Format */}
        <div className="bg-white border border-black rounded-2xl p-8 mb-8 shadow-lg">
          <div className="flex items-center justify-between mb-6">
          <div>
              <h3 className="text-2xl font-semibold mb-3 text-black flex items-center">
                <Camera className="h-6 w-6 mr-3 text-red-600" />
                Step 1: Compile Image to AR Format
            </h3>
              <p className="text-black opacity-80 text-lg">
                First, convert your image to AR-ready format using our compiler
            </p>
          </div>
          <Link
            href="/compiler"
              className="bg-red-600 text-white px-8 py-4 rounded-xl font-semibold hover:bg-red-700 transition-colors flex items-center shadow-lg"
          >
              Go to Compiler
              <ArrowLeft className="h-5 w-5 ml-2" />
          </Link>
        </div>
        
          <div className="bg-cream border border-black rounded-xl p-6">
            <h4 className="font-semibold text-black mb-4 text-lg">What happens in the compiler:</h4>
            <ul className="text-black space-y-2 text-base">
              <li className="flex items-center">
                <span className="w-2 h-2 bg-red-600 rounded-full mr-3"></span>
                Upload your image (JPG, PNG, etc.)
              </li>
            <li className="flex items-center">
                <span className="w-2 h-2 bg-red-600 rounded-full mr-3"></span>
                Our AI processes it to create a .mind file
            </li>
            <li className="flex items-center">
                <span className="w-2 h-2 bg-red-600 rounded-full mr-3"></span>
                The .mind file contains the image recognition data
            </li>
            <li className="flex items-center">
                <span className="w-2 h-2 bg-red-600 rounded-full mr-3"></span>
                Download the .mind file to use in your AR experience
            </li>
          </ul>
        </div>
      </div>

        {/* Step 2: Create AR Experience Form */}
        <div className="bg-white border border-black rounded-2xl p-8 mb-8 shadow-lg">
          <h3 className="text-2xl font-semibold mb-6 text-black flex items-center">
            <Upload className="h-6 w-6 mr-3 text-red-600" />
            Step 2: Create New AR Experience
        </h3>
          
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Title Input */}
            <div>
              <label htmlFor="title" className="block text-lg font-medium text-black mb-3">
                Experience Title *
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-6 py-4 border-2 border-black rounded-xl focus:ring-2 focus:ring-red-600 focus:border-transparent text-lg"
                placeholder="Enter a descriptive title"
                required
              />
            </div>

            {/* Content Type Info */}
            <div className="bg-blue-50 border-2 border-blue-600 rounded-xl p-6">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-xl">💡</span>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-black mb-2">Upload Video, 3D Model, or Both!</h4>
                  <p className="text-sm text-black opacity-80">
                    You can upload just a video, just a 3D model, or both together. If you upload both, they'll appear together in AR.
                  </p>
                  <ul className="text-sm text-black opacity-80 mt-2 space-y-1">
                    <li>• <strong>Video only:</strong> Video plays on the marker</li>
                    <li>• <strong>3D model only:</strong> 3D model appears on the marker</li>
                    <li>• <strong>Both:</strong> Video plays with 3D model displayed together</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Optional Link URL */}
            <div>
              <label htmlFor="link_url" className="block text-lg font-medium text-black mb-3">
                Optional Link (opens from AR)
              </label>
              <input
                type="url"
                id="link_url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                className="w-full px-6 py-4 border-2 border-black rounded-xl focus:ring-2 focus:ring-red-600 focus:border-transparent text-lg"
                placeholder="https://example.com"
                inputMode="url"
              />
              <p className="text-sm text-black opacity-70 mt-2">If provided, a small button will appear in the AR experience.</p>
            </div>

            {/* File Uploads */}
            <div className="grid md:grid-cols-2 gap-8">
              {/* Video Upload - Always show, optional */}
            <div>
              <label className="block text-lg font-medium text-black mb-3">
                Video File <span className="text-sm font-normal text-black opacity-70">(Optional, Max 100MB)</span>
              </label>
              <div className="border-2 border-dashed border-black rounded-xl p-8 text-center hover:border-red-600 transition-colors">
                  {videoFile ? (
                    <div className="space-y-3">
                      <CheckCircle className="h-10 w-10 text-red-600 mx-auto" />
                      <p className="text-base text-black font-medium">{videoFile.name}</p>
                      {videoPreviewUrl && (
                        <div className="mt-4">
                          <video 
                            key={videoPreviewUrl}
                            src={videoPreviewUrl} 
                            controls 
                            muted
                            loop
                            playsInline
                            preload="metadata"
                            className="w-full max-h-64 rounded-lg border-2 border-black bg-black"
                            style={{ objectFit: 'contain' }}
                            onLoadedData={(e) => {
                              const video = e.target as HTMLVideoElement;
                              video.play().catch(() => {});
                            }}
                          />
                          <p className="text-xs text-black opacity-70 mt-2">Preview - Click to play</p>
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => removeFile('video')}
                        className="text-red-600 hover:text-red-800 text-sm flex items-center justify-center mx-auto font-medium"
                      >
                        <X className="h-4 w-4 mr-1" />
                        Remove
                      </button>
            </div>
                  ) : (
            <div>
                      <Video className="h-10 w-10 text-black mx-auto mb-3" />
                      <p className="text-base text-black">
                        <label htmlFor="video-upload" className="cursor-pointer text-red-600 hover:text-red-800 font-semibold">
                          Click to upload video
              </label>
              </p>
                      <p className="text-sm text-black opacity-70 mt-2">MP4, WebM, or other common formats</p>
                <input
                          id="video-upload"
                  type="file"
                          accept="video/mp4,video/webm,video/ogg,video/avi,video/mov,video/quicktime"
                          onChange={handleVideoUpload}
                  className="hidden"
                />
              </div>
                  )}
                </div>
            </div>

              {/* 3D Model Upload - Always show, optional */}
                <div>
                  <label className="block text-lg font-medium text-black mb-3">
                    3D Model File <span className="text-sm font-normal text-black opacity-70">(Optional, Max 50MB)</span>
                  </label>
                  <div className="border-2 border-dashed border-black rounded-xl p-8 text-center hover:border-red-600 transition-colors">
                    {modelFile ? (
                      <div className="space-y-3">
                        <CheckCircle className="h-10 w-10 text-red-600 mx-auto" />
                        <p className="text-base text-black font-medium">{modelFile.name}</p>
                        {modelPreviewUrl && (
                          <div className="mt-4">
                            <div className="w-full h-64 bg-gray-100 rounded-lg border-2 border-black flex items-center justify-center">
                              <model-viewer
                                src={modelPreviewUrl}
                                alt="3D model preview"
                                auto-rotate
                                camera-controls
                                style={{width: '100%', height: '100%'}}
                              />
                            </div>
                            <p className="text-xs text-black opacity-70 mt-2">Preview - Drag to rotate</p>
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => removeFile('3d')}
                          className="text-red-600 hover:text-red-800 text-sm flex items-center justify-center mx-auto font-medium"
                        >
                          <X className="h-4 w-4 mr-1" />
                          Remove
                        </button>
                      </div>
                    ) : (
                      <div>
                        <Box className="h-10 w-10 text-black mx-auto mb-3" />
                        <p className="text-base text-black">
                          <label htmlFor="model-upload" className="cursor-pointer text-red-600 hover:text-red-800 font-semibold">
                            Click to upload 3D model
                          </label>
                        </p>
                        <p className="text-sm text-black opacity-70 mt-2">GLB or GLTF format</p>
                        <input
                          id="model-upload"
                          type="file"
                          accept=".glb,.gltf,model/gltf-binary,model/gltf+json"
                          onChange={handleModelUpload}
                          className="hidden"
                        />
                      </div>
                    )}
                  </div>
                </div>

              {/* Mind File Upload */}
              <div>
                <label className="block text-lg font-medium text-black mb-3">
                  Mind File (.mind) *
                </label>
                <div className="border-2 border-dashed border-black rounded-xl p-8 text-center hover:border-red-600 transition-colors">
                  {mindFile ? (
                    <div className="space-y-3">
                      <CheckCircle className="h-10 w-10 text-red-600 mx-auto" />
                      <p className="text-base text-black font-medium">{mindFile.name}</p>
                      <button
                        type="button"
                        onClick={() => removeFile('mind')}
                        className="text-red-600 hover:text-red-800 text-sm flex items-center justify-center mx-auto font-medium"
                      >
                        <X className="h-4 w-4 mr-1" />
                        Remove
                      </button>
                    </div>
                  ) : (
            <div>
                      <Upload className="h-10 w-10 text-black mx-auto mb-3" />
                      <p className="text-base text-black">
                        <label htmlFor="mind-upload" className="cursor-pointer text-red-600 hover:text-red-800 font-semibold">
                          Upload .mind file
              </label>
              </p>
                      <p className="text-sm text-black opacity-70 mt-2">From Step 1 compiler</p>
                <input
                        id="mind-upload"
                  type="file"
                        accept=".mind"
                        onChange={handleMindUpload}
                  className="hidden"
                />
              </div>
                  )}
                </div>
              </div>


            </div>

            {/* Combined Preview - Show if both video and 3D model uploaded */}
            {videoFile && modelFile && (
              <div className="col-span-full">
                <div className="bg-gradient-to-br from-purple-50 to-blue-50 border-2 border-purple-600 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="text-xl font-semibold text-black flex items-center gap-2">
                        🎬 Combined AR Preview
                        <span className="text-sm font-normal bg-purple-600 text-white px-3 py-1 rounded-full">Both</span>
                      </h4>
                      <p className="text-sm text-black opacity-80 mt-1">
                        See how your video and 3D model will look together in AR
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowCombinedPreview(!showCombinedPreview)}
                      className="bg-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-purple-700 transition-colors"
                    >
                      {showCombinedPreview ? 'Hide Preview' : 'Show Preview & Edit'}
                    </button>
                  </div>

                  {showCombinedPreview && (
                    <div className="space-y-6 mt-6">
                      {/* Preview Container - Overlaid View */}
                      <div className="bg-white rounded-xl p-6 border-2 border-black">
                        <h5 className="font-semibold text-black mb-3 text-center">Combined Preview (Overlaid)</h5>
                        <div className="relative mx-auto" style={{ maxWidth: '600px', height: '450px' }}>
                          {/* Video Layer (Background) */}
                          <video 
                            key={videoPreviewUrl || 'no-video'}
                            src={videoPreviewUrl || undefined}
                            controls 
                            autoPlay
                            muted
                            loop
                            playsInline
                            preload="metadata"
                            className="absolute inset-0 w-full h-full rounded-lg"
                            style={{ objectFit: 'cover', transform: `scale(${videoScale})`, transformOrigin: 'center center', border: 'none', outline: 'none' }}
                            onLoadedData={(e) => {
                              const video = e.target as HTMLVideoElement;
                              setVideoError(false);
                              video.play().catch(() => {});
                            }}
                            onCanPlay={() => setVideoError(false)}
                            onError={(e) => {
                              // Some browsers fire a transient error despite being able to play.
                              // Keep element visible and avoid false warning for valid MP4/WebM.
                              console.warn('Preview video error (non-fatal):', (e as any)?.message || e);
                            }}
                          />
                          {!videoPreviewUrl && (
                            <div className="absolute inset-0 rounded-lg flex items-center justify-center pointer-events-none">
                              <div className="bg-black/60 text-white text-xs px-3 py-2 rounded">
                                Preview may not be supported for this format. Try MP4/WebM for preview.
                              </div>
                            </div>
                          )}
                          
                          {/* 3D Model Layer (Foreground) - Overlaid */}
                          <div 
                            className="absolute rounded-lg pointer-events-none"
                            style={{
                              left: `${50 + (modelPositionX * 30)}%`,
                              top: `${50 - (modelPositionY * 40)}%`,
                              transform: `translate(-50%, -50%) translateZ(${modelPositionZ * 100}px)`,
                              width: `${40 * modelScale}%`,
                              height: `${40 * modelScale}%`,
                              minWidth: '150px',
                              minHeight: '150px'
                            }}
                          >
                            <model-viewer
                              id="combinedModelViewer"
                              src={modelPreviewUrl!}
                              alt="3D model preview"
                              auto-rotate={false}
                              camera-controls
                              interaction-prompt="none"
                              disable-zoom
                              disable-tap
                              disable-pan
                              camera-orbit="0deg 90deg 100%"
                              camera-target="0m 0m 0m"
                              field-of-view="25deg"
                              style={{ 
                                width: '100%', 
                                height: '100%',
                                // Apply Y-rotation for parity with runtime A-Frame rotation
                                transform: `rotateY(${modelRotation}deg)`,
                                pointerEvents: 'auto'
                              }}
                            />
                          </div>

                          {/* Layer Indicators */}
                          <div className="absolute top-2 left-2 bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-semibold z-10">
                            Video Layer
                          </div>
                          <div className="absolute top-2 right-2 bg-purple-600 text-white px-3 py-1 rounded-full text-xs font-semibold z-10">
                            3D Model Layer
                          </div>
                          
                          {/* Position Info */}
                          <div className="absolute bottom-2 left-2 right-2 bg-black bg-opacity-70 text-white px-3 py-2 rounded-lg text-xs z-10">
                            <div className="flex justify-between items-center">
                              <span>Position: ({modelPositionX.toFixed(1)}, {modelPositionY.toFixed(2)}, {modelPositionZ.toFixed(2)})</span>
                              <span>Scale: {modelScale.toFixed(1)}x</span>
                              <span>Rotation: {modelRotation}°</span>
                            </div>
                          </div>
                        </div>

                        <p className="text-center text-sm text-black opacity-70 mt-4">
                          💡 Adjust controls below to see changes in real-time
                        </p>
                      </div>

                      {/* 3D Model Position Controls */}
                      <div className="bg-white rounded-xl p-6 border-2 border-black">
                        <h5 className="font-semibold text-black mb-4 flex items-center gap-2">
                          🎮 Adjust 3D Model Position
                          <span className="text-xs font-normal bg-gray-200 px-2 py-1 rounded">Live Preview</span>
                        </h5>
                        
                        <div className="space-y-6">
                          {/* Position Controls */}
                          <div>
                            <h6 className="text-sm font-semibold text-black mb-3">Position (X, Y, Z)</h6>
                            <div className="grid md:grid-cols-3 gap-4">
                              {/* X Position */}
                              <div>
                                <label className="block text-xs font-medium text-black mb-2">
                                  X (Left ← → Right)
                                </label>
                                <input
                                  type="range"
                                  min="-1"
                                  max="1"
                                  step="0.1"
                                  value={modelPositionX}
                                  onChange={(e) => setModelPositionX(parseFloat(e.target.value))}
                                  className="w-full"
                                />
                                <div className="text-center text-xs text-black font-semibold mt-1">
                                  {modelPositionX.toFixed(1)}
                                </div>
                              </div>

                              {/* Y Position */}
                              <div>
                                <label className="block text-xs font-medium text-black mb-2">
                                  Y (Down ↓ ↑ Up)
                                </label>
                                <input
                                  type="range"
                                  min="0"
                                  max="1"
                                  step="0.05"
                                  value={modelPositionY}
                                  onChange={(e) => setModelPositionY(parseFloat(e.target.value))}
                                  className="w-full"
                                />
                                <div className="text-center text-xs text-black font-semibold mt-1">
                                  {modelPositionY.toFixed(2)}
                                </div>
                              </div>

                              {/* Z Position */}
                              <div>
                                <label className="block text-xs font-medium text-black mb-2">
                                  Z (Back ← → Front)
                                </label>
                                <input
                                  type="range"
                                  min="0"
                                  max="0.5"
                                  step="0.05"
                                  value={modelPositionZ}
                                  onChange={(e) => setModelPositionZ(parseFloat(e.target.value))}
                                  className="w-full"
                                />
                                <div className="text-center text-xs text-black font-semibold mt-1">
                                  {modelPositionZ.toFixed(2)}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Scale and Rotation Controls */}
                          <div>
                            <h6 className="text-sm font-semibold text-black mb-3">Scale & Rotation</h6>
                            <div className="grid md:grid-cols-3 gap-4">
                              {/* Scale */}
                              <div>
                                <label className="block text-xs font-medium text-black mb-2">
                                  Scale (Size)
                                </label>
                                <input
                                  type="range"
                                  min="0.1"
                                  max="3"
                                  step="0.1"
                                  value={modelScale}
                                  onChange={(e) => setModelScale(parseFloat(e.target.value))}
                                  className="w-full"
                                />
                                <div className="text-center text-xs text-black font-semibold mt-1">
                                  {modelScale.toFixed(1)}x
                                </div>
                              </div>

                              {/* Rotation */}
                              <div>
                                <label className="block text-xs font-medium text-black mb-2">
                                  Rotation (Y-axis)
                                </label>
                                <input
                                  type="range"
                                  min="0"
                                  max="360"
                                  step="15"
                                  value={modelRotation}
                                  onChange={(e) => setModelRotation(parseInt(e.target.value))}
                                  className="w-full"
                                />
                                <div className="text-center text-xs text-black font-semibold mt-1">
                                  {modelRotation}°
                                </div>
                              </div>

                              {/* Video Zoom */}
                              <div>
                                <label className="block text-xs font-medium text-black mb-2">
                                  Video Zoom (Background)
                                </label>
                                <input
                                  type="range"
                                  min="0.5"
                                  max="2.0"
                                  step="0.05"
                                  value={videoScale}
                                  onChange={(e) => setVideoScale(parseFloat(e.target.value))}
                                  className="w-full"
                                />
                                <div className="text-center text-xs text-black font-semibold mt-1">
                                  {videoScale.toFixed(2)}x
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Quick Presets */}
                        <div className="mt-6 pt-6 border-t-2 border-gray-200">
                          <h6 className="text-sm font-semibold text-black mb-3">Quick Presets:</h6>
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setModelPositionX(0)
                                setModelPositionY(0.3)
                                setModelPositionZ(0.15)
                              }}
                              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-sm font-medium transition-colors"
                            >
                              Default (Center, Raised)
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setModelPositionX(0)
                                setModelPositionY(0)
                                setModelPositionZ(0.2)
                              }}
                              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-sm font-medium transition-colors"
                            >
                              Flat (On Video)
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setModelPositionX(0)
                                setModelPositionY(0.5)
                                setModelPositionZ(0.15)
                              }}
                              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-sm font-medium transition-colors"
                            >
                              High (Above Video)
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setModelPositionX(0.3)
                                setModelPositionY(0.3)
                                setModelPositionZ(0.15)
                              }}
                              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-sm font-medium transition-colors"
                            >
                              Right Side
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setModelPositionX(-0.3)
                                setModelPositionY(0.3)
                                setModelPositionZ(0.15)
                              }}
                              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-sm font-medium transition-colors"
                            >
                              Left Side
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Tips */}
                      <div className="bg-yellow-50 border-2 border-yellow-400 rounded-xl p-4">
                        <h6 className="font-semibold text-black mb-2 flex items-center gap-2">
                          💡 Tips for Best Results
                        </h6>
                        <ul className="text-sm text-black space-y-1">
                          <li>• <strong>Y Position:</strong> Higher values lift the 3D model above the video</li>
                          <li>• <strong>Z Position:</strong> Higher values bring the model closer to camera</li>
                          <li>• <strong>X Position:</strong> Negative = left, Positive = right</li>
                          <li>• <strong>Scale:</strong> Adjust below if model is too large/small</li>
                          <li>• <strong>Test:</strong> Try different positions to see what works best</li>
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 3D Model Settings - Show if 3D model is uploaded but NOT in combined mode */}
            {modelFile && !videoFile && (
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <label htmlFor="model_scale" className="block text-lg font-medium text-black mb-3">
                    Model Scale
                  </label>
                  <input
                    type="number"
                    id="model_scale"
                    value={modelScale}
                    onChange={(e) => setModelScale(parseFloat(e.target.value) || 1.0)}
                    min="0.1"
                    max="10"
                    step="0.1"
                    className="w-full px-6 py-4 border-2 border-black rounded-xl focus:ring-2 focus:ring-red-600 focus:border-transparent text-lg"
                  />
                  <p className="text-sm text-black opacity-70 mt-2">Scale of the 3D model (1.0 = normal size)</p>
                </div>
                <div>
                  <label htmlFor="model_rotation" className="block text-lg font-medium text-black mb-3">
                    Model Rotation (degrees)
                  </label>
                  <input
                    type="number"
                    id="model_rotation"
                    value={modelRotation}
                    onChange={(e) => setModelRotation(parseInt(e.target.value) || 0)}
                    min="0"
                    max="360"
                    step="15"
                    className="w-full px-6 py-4 border-2 border-black rounded-xl focus:ring-2 focus:ring-red-600 focus:border-transparent text-lg"
                  />
                  <p className="text-sm text-black opacity-70 mt-2">Rotation around Y-axis (0-360 degrees)</p>
                </div>
              </div>
            )}

            {/* Marker Image Upload */}
            <div className="col-span-full">
              <label className="block text-lg font-medium text-black mb-3">
                Marker Image (.png, .jpg, .jpeg) * <span className="text-sm font-normal text-black opacity-70">(Max 10MB)</span>
              </label>
              <div className="border-2 border-dashed border-black rounded-xl p-8 text-center hover:border-red-600 transition-colors">
                {markerImageFile ? (
                  <div className="space-y-3">
                    <CheckCircle className="h-10 w-10 text-red-600 mx-auto" />
                    <p className="text-base text-black font-medium">{markerImageFile.name}</p>
                    {markerPreviewUrl && (
                      <div className="mt-4">
                        <img 
                          src={markerPreviewUrl} 
                          alt="Marker preview" 
                          className="max-w-full max-h-64 mx-auto rounded-lg border-2 border-black"
                        />
                        <p className="text-xs text-black opacity-70 mt-2">Marker Image Preview</p>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => removeFile('markerImage')}
                      className="text-red-600 hover:text-red-800 text-sm flex items-center justify-center mx-auto font-medium"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Remove
                    </button>
                  </div>
                ) : (
                  <div>
                    <Upload className="h-10 w-10 text-black mx-auto mb-3" />
                    <p className="text-base text-black">
                      <label htmlFor="marker-image-upload" className="cursor-pointer text-red-600 hover:text-red-800 font-semibold">
                        Click to upload marker image
                      </label>
                    </p>
                    <p className="text-sm text-black opacity-70 mt-2">This is the image that will trigger your AR experience</p>
                    <input
                      id="marker-image-upload"
                      type="file"
                      accept=".png,.jpg,.jpeg,.webp,image/*"
                      onChange={handleMarkerImageUpload}
                      className="hidden"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-center pt-4">
              <button
                type="submit"
                disabled={submitting}
                className="bg-red-600 text-white px-12 py-4 rounded-xl font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center text-lg shadow-lg"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                    Uploading Files...
                  </>
                ) : (
                  <>
                    <Plus className="h-6 w-6 mr-2" />
                    Create AR Experience
                  </>
                )}
              </button>
            </div>


          </form>
        </div>
        
        {/* How to Use Your AR Experience */}
        <div className="bg-white border border-black rounded-2xl p-8 shadow-lg">
          <h3 className="text-2xl font-semibold mb-6 text-black flex items-center">
            <Camera className="h-6 w-6 mr-3 text-red-600" />
            How to Use Your AR Experience
          </h3>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h4 className="font-semibold text-black mb-4 text-lg">For You (Creator):</h4>
              <ol className="text-black space-y-3 list-decimal list-inside text-base">
                <li>After creating, you'll get a unique link to your experience</li>
                <li>Share this link with others or embed it on your website</li>
                <li>You can edit or delete your experience anytime from your dashboard</li>
              </ol>
            </div>
            <div>
              <h4 className="font-semibold text-black mb-4 text-lg">For Users:</h4>
              <ol className="text-black space-y-3 list-decimal list-inside text-base">
                <li>Open the link on their phone (works best on mobile)</li>
                <li>Allow camera access when prompted</li>
                <li>Point their camera at the image you used to create the .mind file</li>
                <li>Your video will automatically play overlaid on the image!</li>
              </ol>
            </div>
          </div>
          
          <div className="mt-8 p-6 bg-cream border-2 border-black rounded-xl">
            <h4 className="font-semibold text-black mb-3 text-lg">💡 Pro Tips:</h4>
            <ul className="text-black space-y-2 text-base">
              <li>• Use high-quality, clear images for better recognition</li>
              <li>• Keep videos under 2 minutes for best performance</li>
              <li>• Test your experience on different devices</li>
              <li>• Good lighting helps the camera recognize your image</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
    </>
  )
} 
