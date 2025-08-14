'use client'

import { useState, useCallback } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useDropzone } from 'react-dropzone'
import { Camera, Upload, ArrowLeft, Video, Image, Plus } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'

export default function CreateExperience() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [compilationProgress, setCompilationProgress] = useState<string>('')
  
  const [markerFile, setMarkerFile] = useState<File | null>(null)
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [mindFile, setMindFile] = useState<File | null>(null)
  const [markerPreview, setMarkerPreview] = useState<string | null>(null)
  const [videoPreview, setVideoPreview] = useState<string | null>(null)
  const [useCustomMind, setUseCustomMind] = useState(false)

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

  const onMindDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (file) {
      setMindFile(file)
      setUseCustomMind(true)
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

  const { getRootProps: getMindRootProps, getInputProps: getMindInputProps, isDragActive: isMindDragActive } = useDropzone({
    onDrop: onMindDrop,
    accept: {
      'application/octet-stream': ['.mind']
    },
    maxFiles: 1
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Check if we have either a marker image OR a custom .mind file
    if (!markerFile && !useCustomMind) {
      toast.error('Please upload a marker image or enable custom .mind file upload')
      return
    }
    
    if (!videoFile) {
      toast.error('Please upload a video file')
      return
    }

    if (!supabase) {
      toast.error('Supabase client not available')
      return
    }

    setSubmitting(true)

    try {
      // Handle marker image upload (optional if custom .mind file is provided)
      let markerImageUrl: string
      
      if (markerFile) {
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
        
        markerImageUrl = markerUrlData.publicUrl
      } else {
        // Use a placeholder image if no marker file but custom .mind file is provided
        markerImageUrl = 'https://cdn.jsdelivr.net/gh/hiukim/mind-ar-js@1.2.5/examples/image-tracking/assets/card-example/card.png'
      }

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

      // Handle .mind file - either upload custom or generate from image
      let mindFileUrl: string
      
      if (useCustomMind && mindFile) {
        // Upload custom .mind file
        setCompilationProgress('Uploading custom .mind file...')
        const mindFileName = `${user?.id}/${Date.now()}-custom.mind`
        const { data: mindData, error: mindError } = await supabase.storage
          .from('mind-files')
          .upload(mindFileName, mindFile)

        if (mindError) throw mindError

        const { data: mindUrlData } = supabase.storage
          .from('mind-files')
          .getPublicUrl(mindFileName)
        
        mindFileUrl = mindUrlData.publicUrl
        setCompilationProgress('Custom .mind file uploaded!')
      } else {
        // Generate .mind file using the real MindAR compiler
        setCompilationProgress('Compiling MindAR file...')
        const compileResponse = await fetch('/api/compile-mind', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            imageUrl: markerImageUrl,
            userId: user?.id
          })
        })

        if (!compileResponse.ok) {
          const errorData = await compileResponse.json()
          throw new Error(errorData.error || 'Failed to compile MindAR file')
        }

        const compileData = await compileResponse.json()
        mindFileUrl = compileData.mindFileUrl
        setCompilationProgress('MindAR compilation completed!')
      }

      // Save to database
      setCompilationProgress('Saving experience to database...')
      const { error: dbError } = await supabase
        .from('ar_experiences')
        .insert({
          user_id: user?.id,
          title,
          description: description || null,
          marker_image_url: markerImageUrl,
          mind_file_url: mindFileUrl,
          video_url: videoUrlData.publicUrl,
          plane_width: 1,
          plane_height: 0.5625,
          video_rotation: 0
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
    <div className="min-h-screen bg-cream">
      {/* Step 2 Reminder */}
      <div className="bg-white border border-gray-200 rounded-lg mx-4 mt-4 p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Upload className="h-5 w-5 mr-2 text-dark-blue" />
            <span className="text-sm text-gray-600">
              <strong>Step 2:</strong> Make sure you've converted your images to AR format first
            </span>
          </div>
          <Link
            href="/compiler"
            className="text-dark-blue hover:text-blue-900 text-sm font-medium"
          >
            Convert Images →
          </Link>
        </div>
      </div>

      {/* Navigation */}
      <nav className="bg-dark-blue shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/dashboard" className="flex items-center text-white hover:text-gray-300">
                <ArrowLeft className="h-5 w-5 mr-2" />
                Back to Dashboard
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-white">{user?.email}</span>
              <button
                onClick={() => router.push('/auth/signout')}
                className="text-white hover:text-gray-200 px-3 py-2 rounded-md text-sm font-medium"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center text-black mb-8">
          <h1 className="text-4xl font-bold mb-4 tracking-tight">
            Create New AR Experience
          </h1>
          <p className="text-xl opacity-80 max-w-2xl mx-auto leading-relaxed">
            Build an augmented reality experience with your videos and converted .mind files
          </p>
        </div>

        {/* Form */}
        <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Experience Name */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-black mb-2">
                Experience Name
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dark-blue focus:border-transparent text-black placeholder-gray-500"
                placeholder="Enter a name for your AR experience"
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-black mb-2">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dark-blue focus:border-transparent text-black placeholder-gray-500"
                placeholder="Describe your AR experience"
              />
            </div>

            {/* Mind File Upload */}
            <div>
              <label htmlFor="mindFile" className="block text-sm font-medium text-black mb-2">
                Mind File (.mind)
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-dark-blue transition-colors">
                <input
                  type="file"
                  id="mindFile"
                  name="mindFile"
                  accept=".mind"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setMindFile(file);
                      setUseCustomMind(true);
                    }
                  }}
                  required
                  className="hidden"
                />
                <label htmlFor="mindFile" className="cursor-pointer">
                  <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-sm text-gray-600 mb-2">
                    <span className="font-medium text-dark-blue">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-gray-500">.mind files only</p>
                </label>
              </div>
              {mindFile && (
                <p className="mt-2 text-sm text-gray-600">
                  Selected: {mindFile.name}
                </p>
              )}
            </div>

            {/* Video File Upload */}
            <div>
              <label htmlFor="videoFile" className="block text-sm font-medium text-black mb-2">
                Video File
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-dark-blue transition-colors">
                <input
                  type="file"
                  id="videoFile"
                  name="videoFile"
                  accept="video/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setVideoFile(file);
                    }
                  }}
                  required
                  className="hidden"
                />
                <label htmlFor="videoFile" className="cursor-pointer">
                  <Video className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-sm text-gray-600 mb-2">
                    <span className="font-medium text-dark-blue">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-gray-500">MP4, WebM, or other video formats</p>
                </label>
              </div>
              {videoFile && (
                <p className="mt-2 text-sm text-gray-600">
                  Selected: {videoFile.name}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={submitting || (!markerFile && !useCustomMind) || !videoFile}
                className="w-full bg-dark-blue text-white py-3 px-6 rounded-lg font-medium hover:bg-red-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Creating Experience...
                  </>
                ) : (
                  <>
                    <Plus className="h-5 w-5 mr-2" />
                    Create AR Experience
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
} 
