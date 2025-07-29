'use client'

import { useState, useCallback } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useDropzone } from 'react-dropzone'
import { Camera, Upload, ArrowLeft, Video, Image } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'

export default function CreateExperience() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [planeWidth, setPlaneWidth] = useState(1)
  const [planeHeight, setPlaneHeight] = useState(0.5625)
  const [videoRotation, setVideoRotation] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [compilationProgress, setCompilationProgress] = useState<string>('')
  
  const [markerFile, setMarkerFile] = useState<File | null>(null)
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [markerPreview, setMarkerPreview] = useState<string | null>(null)
  const [videoPreview, setVideoPreview] = useState<string | null>(null)

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!markerFile || !videoFile) {
      toast.error('Please upload both marker image and video')
      return
    }

    setSubmitting(true)

    try {
      // Upload marker image
      const markerFileName = `${user?.id}/${Date.now()}-marker.${markerFile.name.split('.').pop()}`
      const { data: markerData, error: markerError } = await supabase.storage
        .from('markers')
        .upload(markerFileName, markerFile)

      if (markerError) throw markerError

      // Get marker image URL
      const { data: markerUrlData } = supabase.storage
        .from('markers')
        .getPublicUrl(markerFileName)

      // Upload video
      const videoFileName = `${user?.id}/${Date.now()}-video.mp4`
      const { data: videoData, error: videoError } = await supabase.storage
        .from('videos')
        .upload(videoFileName, videoFile)

      if (videoError) throw videoError

      // Get video URL
      const { data: videoUrlData } = supabase.storage
        .from('videos')
        .getPublicUrl(videoFileName)

      // Generate .mind file using the real MindAR compiler
      setCompilationProgress('Compiling MindAR file...')
      const compileResponse = await fetch('/api/compile-mind', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageUrl: markerUrlData.publicUrl,
          userId: user?.id
        })
      })

      if (!compileResponse.ok) {
        const errorData = await compileResponse.json()
        throw new Error(errorData.error || 'Failed to compile MindAR file')
      }

      const compileData = await compileResponse.json()
      const mindFileUrl = compileData.mindFileUrl
      setCompilationProgress('MindAR compilation completed!')

      // Save to database
      setCompilationProgress('Saving experience to database...')
      const { error: dbError } = await supabase
        .from('ar_experiences')
        .insert({
          user_id: user?.id,
          title,
          description: description || null,
          marker_image_url: markerUrlData.publicUrl,
          mind_file_url: mindFileUrl,
          video_url: videoUrlData.publicUrl,
          plane_width: planeWidth,
          plane_height: planeHeight,
          video_rotation: videoRotation
        })

      if (dbError) throw dbError

      toast.success('AR experience created successfully!')
      router.push('/dashboard')
    } catch (error: any) {
      toast.error(error.message || 'Failed to create experience')
    } finally {
      setSubmitting(false)
      setCompilationProgress('')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/dashboard" className="flex items-center text-gray-700 hover:text-gray-900">
                <ArrowLeft className="h-5 w-5 mr-2" />
                Back to Dashboard
              </Link>
            </div>
            <div className="flex items-center">
              <Camera className="h-8 w-8 text-primary-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">QuickScanAR</span>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">Create New AR Experience</h1>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Basic Information */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                Experience Title
              </label>
              <input
                type="text"
                id="title"
                required
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Description (Optional)
              </label>
              <textarea
                id="description"
                rows={3}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            {/* File Uploads */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              {/* Marker Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Marker Image
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

              {/* Video Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Video File
                </label>
                <div
                  {...getVideoRootProps()}
                  className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer ${
                    isVideoDragActive ? 'border-primary-500 bg-primary-50' : 'border-gray-300'
                  }`}
                >
                  <input {...getVideoInputProps()} />
                  <Video className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-2 text-sm text-gray-600">
                    {isVideoDragActive
                      ? 'Drop the video here...'
                      : 'Drag & drop a video, or click to select'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">MP4 up to 50MB</p>
                </div>
                {videoPreview && (
                  <div className="mt-2">
                    <video src={videoPreview} className="h-20 w-20 object-cover rounded" controls />
                  </div>
                )}
              </div>
            </div>

            {/* Advanced Settings */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Advanced Settings</h3>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                <div>
                  <label htmlFor="planeWidth" className="block text-sm font-medium text-gray-700">
                    Plane Width
                  </label>
                  <input
                    type="number"
                    id="planeWidth"
                    step="0.1"
                    min="0.1"
                    max="10"
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    value={planeWidth}
                    onChange={(e) => setPlaneWidth(parseFloat(e.target.value))}
                  />
                </div>

                <div>
                  <label htmlFor="planeHeight" className="block text-sm font-medium text-gray-700">
                    Plane Height
                  </label>
                  <input
                    type="number"
                    id="planeHeight"
                    step="0.1"
                    min="0.1"
                    max="10"
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    value={planeHeight}
                    onChange={(e) => setPlaneHeight(parseFloat(e.target.value))}
                  />
                </div>

                <div>
                  <label htmlFor="videoRotation" className="block text-sm font-medium text-gray-700">
                    Video Rotation (degrees)
                  </label>
                  <input
                    type="number"
                    id="videoRotation"
                    step="1"
                    min="0"
                    max="360"
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                    value={videoRotation}
                    onChange={(e) => setVideoRotation(parseInt(e.target.value))}
                  />
                </div>
              </div>
            </div>

            {/* Progress Indicator */}
            {compilationProgress && (
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-3"></div>
                  <span className="text-sm text-blue-800">{compilationProgress}</span>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-end space-x-3">
              <Link
                href="/dashboard"
                className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={submitting || !markerFile || !videoFile}
                className="bg-primary-600 text-white py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Creating...' : 'Create Experience'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
} 