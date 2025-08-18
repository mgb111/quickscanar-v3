'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import { Camera, Upload, Video, ArrowLeft, ArrowRight, Plus, X, CheckCircle } from 'lucide-react'
import Header from '@/components/Header'
import toast from 'react-hot-toast'

interface ARExperience {
  id: string
  title: string
  description: string
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
  const [description, setDescription] = useState('')
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [mindFile, setMindFile] = useState<File | null>(null)
  const [useCustomMind, setUseCustomMind] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [compilationProgress, setCompilationProgress] = useState(0)

  const handleVideoUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.size > 100 * 1024 * 1024) { // 100MB limit
        toast.error('Video file must be smaller than 100MB')
        return
      }
      setVideoFile(file)
      toast.success('Video uploaded successfully!')
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

  const removeFile = useCallback((type: 'video' | 'mind') => {
    if (type === 'video') {
      setVideoFile(null)
    } else {
      setMindFile(null)
    }
    toast.success(`${type === 'video' ? 'Video' : 'Mind file'} removed`)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!title.trim()) {
      toast.error('Please enter a title for your AR experience')
      return
    }
    
    if (!videoFile) {
      toast.error('Please upload a video file')
      return
    }
    
    if (!mindFile && !useCustomMind) {
      toast.error('Please upload a mind file or use a custom one')
      return
    }

    setSubmitting(true)
    setCompilationProgress(0)

    try {
      // Simulate compilation progress
      const progressInterval = setInterval(() => {
        setCompilationProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 200)

      // Upload video file
      const videoFormData = new FormData()
      videoFormData.append('file', videoFile)
      videoFormData.append('userId', user!.id)
      
      const videoResponse = await fetch('/api/upload/video', {
        method: 'POST',
        body: videoFormData
      })

      if (!videoResponse.ok) {
        throw new Error('Failed to upload video')
      }

      const videoData = await videoResponse.json()
      const videoUrl = videoData.url

      // Upload mind file if provided
      let mindUrl = ''
      if (mindFile) {
        const mindFormData = new FormData()
        mindFormData.append('file', mindFile)
        mindFormData.append('userId', user!.id)
        
        const mindResponse = await fetch('/api/upload/mind', {
          method: 'POST',
          body: mindFormData
        })

        if (!mindResponse.ok) {
          throw new Error('Failed to upload mind file')
        }

        const mindData = await mindResponse.json()
        mindUrl = mindData.url
      }

      // Create AR experience record
      const experienceData = {
        title: title.trim(),
        description: description.trim(),
        video_file_url: videoUrl,
        mind_file_url: mindUrl || null,
        user_id: user!.id
      }

      const experienceResponse = await fetch('/api/ar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(experienceData)
      })

      if (!experienceResponse.ok) {
        throw new Error('Failed to create AR experience')
      }

      const experience = await experienceResponse.json()
      
      clearInterval(progressInterval)
      setCompilationProgress(100)
      
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
      setCompilationProgress(0)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-dark-blue"></div>
      </div>
    )
  }

  if (!user) {
    router.push('/auth/signin')
    return null
  }

  return (
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
        {/* Header */}
        <div className="text-center text-black mb-8">
          <div className="flex justify-center mb-4">
            <Link 
              href="/dashboard" 
              className="inline-flex items-center text-dark-blue hover:text-blue-900 text-sm font-medium"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Link>
          </div>
          <h1 className="text-4xl font-bold mb-4 tracking-tight">
            Create AR Experience
          </h1>
          <p className="text-xl opacity-80 max-w-2xl mx-auto leading-relaxed mb-6">
            Build an augmented reality experience that plays videos when you point your camera at specific images
          </p>
        </div>

        {/* Step 1: Compile Image to AR Format */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-8 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xl font-semibold mb-2 text-black flex items-center">
                <Camera className="h-5 w-5 mr-2 text-dark-blue" />
                Step 1: Compile Image to AR Format
              </h3>
              <p className="text-gray-600">
                First, convert your image to AR-ready format using our compiler
              </p>
            </div>
            <Link
              href="/compiler"
              className="bg-dark-blue text-white px-6 py-3 rounded-lg font-medium hover:bg-red-800 transition-colors flex items-center"
            >
              Go to Compiler
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-medium text-blue-800 mb-2">What happens in the compiler:</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Upload your image (JPG, PNG, etc.)</li>
              <li>• Our AI processes it to create a .mind file</li>
              <li>• The .mind file contains the image recognition data</li>
              <li>• Download the .mind file to use in your AR experience</li>
            </ul>
          </div>
        </div>

        {/* Step 2: Create AR Experience Form */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-8 shadow-sm">
          <h3 className="text-xl font-semibold mb-4 text-black flex items-center">
            <Upload className="h-5 w-5 mr-2 text-dark-blue" />
            Step 2: Create New AR Experience
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title and Description */}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                  Experience Title *
                </label>
                <input
                  type="text"
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dark-blue focus:border-transparent"
                  placeholder="Enter a descriptive title"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dark-blue focus:border-transparent"
                  placeholder="Describe what users will see"
                />
              </div>
            </div>

            {/* File Uploads */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Video Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Video File *
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-dark-blue transition-colors">
                  {videoFile ? (
                    <div className="space-y-2">
                      <CheckCircle className="h-8 w-8 text-green-500 mx-auto" />
                      <p className="text-sm text-gray-600">{videoFile.name}</p>
                      <button
                        type="button"
                        onClick={() => removeFile('video')}
                        className="text-red-600 hover:text-red-800 text-sm flex items-center justify-center mx-auto"
                      >
                        <X className="h-4 w-4 mr-1" />
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div>
                      <Video className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">
                        <label htmlFor="video-upload" className="cursor-pointer text-dark-blue hover:text-blue-700">
                          Click to upload video
                        </label>
                      </p>
                      <p className="text-xs text-gray-500 mt-1">MP4, WebM, or other common formats</p>
                      <input
                        id="video-upload"
                        type="file"
                        accept="video/*"
                        onChange={handleVideoUpload}
                        className="hidden"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Mind File Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mind File (.mind)
                </label>
                <div className="space-y-3">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="use-custom-mind"
                      checked={useCustomMind}
                      onChange={(e) => setUseCustomMind(e.target.checked)}
                      className="h-4 w-4 text-dark-blue focus:ring-dark-blue border-gray-300 rounded"
                    />
                    <label htmlFor="use-custom-mind" className="ml-2 text-sm text-gray-700">
                      Use custom mind file
                    </label>
                  </div>
                  
                  {!useCustomMind && (
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-dark-blue transition-colors">
                      {mindFile ? (
                        <div className="space-y-2">
                          <CheckCircle className="h-8 w-8 text-green-500 mx-auto" />
                          <p className="text-sm text-gray-600">{mindFile.name}</p>
                          <button
                            type="button"
                            onClick={() => removeFile('mind')}
                            className="text-red-600 hover:text-red-800 text-sm flex items-center justify-center mx-auto"
                          >
                            <X className="h-4 w-4 mr-1" />
                            Remove
                          </button>
                        </div>
                      ) : (
                        <div>
                          <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-600">
                            <label htmlFor="mind-upload" className="cursor-pointer text-dark-blue hover:text-blue-700">
                              Upload .mind file
                            </label>
                          </p>
                          <p className="text-xs text-gray-500 mt-1">From Step 1 compiler</p>
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
                  )}
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-center">
              <button
                type="submit"
                disabled={submitting}
                className="bg-dark-blue text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
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

            {/* Progress Bar */}
            {submitting && compilationProgress > 0 && (
              <div className="mt-4">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>Compiling...</span>
                  <span>{compilationProgress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-dark-blue h-2 rounded-full transition-all duration-300"
                    style={{ width: `${compilationProgress}%` }}
                  ></div>
                </div>
              </div>
            )}
          </form>
        </div>

        {/* How to Use Your AR Experience */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 mt-8 shadow-sm">
          <h3 className="text-xl font-semibold mb-4 text-black flex items-center">
            <Camera className="h-5 w-5 mr-2 text-dark-blue" />
            How to Use Your AR Experience
          </h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-gray-800 mb-3">For You (Creator):</h4>
              <ol className="text-sm text-gray-600 space-y-2 list-decimal list-inside">
                <li>After creating, you'll get a unique link to your experience</li>
                <li>Share this link with others or embed it on your website</li>
                <li>You can edit or delete your experience anytime from your dashboard</li>
              </ol>
            </div>
            <div>
              <h4 className="font-medium text-gray-800 mb-3">For Users:</h4>
              <ol className="text-sm text-gray-600 space-y-2 list-decimal list-inside">
                <li>Open the link on their phone (works best on mobile)</li>
                <li>Allow camera access when prompted</li>
                <li>Point their camera at the image you used to create the .mind file</li>
                <li>Your video will automatically play overlaid on the image!</li>
              </ol>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-blue-800 mb-2">💡 Pro Tips:</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Use high-quality, clear images for better recognition</li>
              <li>• Keep videos under 2 minutes for best performance</li>
              <li>• Test your experience on different devices</li>
              <li>• Good lighting helps the camera recognize your image</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
} 
