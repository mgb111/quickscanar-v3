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
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [mindFile, setMindFile] = useState<File | null>(null)

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

    if (!mindFile) {
      toast.error('Please upload a mind file')
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
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-600"></div>
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
            Build an augmented reality experience that plays videos when you point your camera at specific images
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

            {/* File Uploads */}
            <div className="grid md:grid-cols-2 gap-8">
              {/* Video Upload */}
            <div>
                <label className="block text-lg font-medium text-black mb-3">
                  Video File *
              </label>
                <div className="border-2 border-dashed border-black rounded-xl p-8 text-center hover:border-red-600 transition-colors">
                  {videoFile ? (
                    <div className="space-y-3">
                      <CheckCircle className="h-10 w-10 text-red-600 mx-auto" />
                      <p className="text-base text-black font-medium">{videoFile.name}</p>
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
                    Creating Experience...
                  </>
                ) : (
                  <>
                    <Plus className="h-6 w-6 mr-2" />
                    Create AR Experience
                  </>
                )}
              </button>
            </div>

            {/* Progress Bar */}
            {submitting && compilationProgress > 0 && (
              <div className="mt-6">
                <div className="flex justify-between text-base text-black mb-3 font-medium">
                  <span>Compiling...</span>
                  <span>{compilationProgress}%</span>
                </div>
                <div className="w-full bg-cream border-2 border-black rounded-full h-3">
                  <div
                    className="bg-red-600 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${compilationProgress}%` }}
                  ></div>
                </div>
              </div>
            )}
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
  )
} 
