'use client'

import { useState, useCallback, useMemo } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Upload, ArrowLeft, Video, Plus, Camera, ArrowRight } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'

export default function CreateExperience() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [compilationProgress, setCompilationProgress] = useState<string>('')
  
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [mindFile, setMindFile] = useState<File | null>(null)
  const [useCustomMind, setUseCustomMind] = useState(false)
  
  // Optimize progress updates to reduce re-renders
  const updateProgress = useCallback((message: string) => {
    setCompilationProgress(message)
  }, [])

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Check if we have either a custom .mind file
    if (!mindFile) {
      toast.error('Please upload a custom .mind file')
      return
    }
    
    if (!videoFile) {
      toast.error('Please upload a video file')
      return
    }

    if (!supabase) {
      toast.error('Supabase client not available. Please check your environment configuration.')
      return
    }

    // Check if user is authenticated
    if (!user?.id) {
      toast.error('User not authenticated. Please sign in again.')
      return
    }

    setSubmitting(true)

    try {

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
        let mindFileUrl: string = ''
        
        if (useCustomMind && mindFile) {
          // Upload custom .mind file
          updateProgress('Uploading custom .mind file...')
        const mindFileName = `${user?.id}/${Date.now()}-custom.mind`
        
        try {
          // Validate file size (Supabase has limits)
          const maxSize = 50 * 1024 * 1024 // 50MB limit
          if (mindFile.size > maxSize) {
            throw new Error(`File too large: ${(mindFile.size / 1024 / 1024).toFixed(2)}MB. Maximum allowed: 50MB`)
          }
          
          // Check if file is empty
          if (mindFile.size === 0) {
            throw new Error('File is empty (0 bytes)')
          }
          
          // Try server-side upload first to avoid CORS/WAF issues
          try {
            const apiForm = new FormData()
            apiForm.append('file', mindFile)
            apiForm.append('path', mindFileName)
            const resp = await fetch('/api/upload/mind', {
              method: 'POST',
              body: apiForm,
            })
            if (!resp.ok) {
              const err = await resp.json().catch(() => ({} as any))
              throw new Error(err?.error || `Server upload failed: HTTP ${resp.status}`)
            }
            const json = await resp.json()
            mindFileUrl = json.url
            updateProgress('Custom .mind file uploaded!')
          } catch (serverUploadErr: any) {

            // Fallback: direct Supabase upload
            let mindData: any = null
            let mindError: any = null
            try {
              const result = await supabase.storage
                .from('mind-files')
                .upload(mindFileName, mindFile, {
                  cacheControl: '3600',
                  upsert: false,
                  contentType: 'application/octet-stream'
                })
              mindData = result.data
              mindError = result.error
            } catch (thrown: any) {
              mindData = null
              mindError = thrown
            }

            if (mindError) {

              if (mindError.message.includes('file size')) {
                throw new Error(`File size error: ${mindError.message}`)
              }

              if (mindError && (mindError.message.includes('CORS') || mindError.message.includes('cross-origin'))) {
                // Try alternative upload method for CORS issues
                const base64String = await new Promise<string>((resolve, reject) => {
                  const reader = new FileReader()
                  reader.onload = () => resolve(reader.result as string)
                  reader.onerror = reject
                  reader.readAsDataURL(mindFile)
                })

                const textFileName = `${user?.id}/${Date.now()}-custom.txt`
                const { data: altData, error: altError } = await supabase.storage
                  .from('mind-files')
                  .upload(textFileName, new Blob([base64String], { type: 'text/plain' }))

                if (altError) throw altError

                const { data: altUrlData } = supabase.storage
                  .from('mind-files')
                  .getPublicUrl(textFileName)

                mindFileUrl = altUrlData.publicUrl
                updateProgress('Custom .mind file uploaded!')
              } else if (mindError.message.includes('fetch') || mindError.message.includes('network') || mindError.message.includes('Failed to fetch')) {
                // Retry with exponential backoff for network issues
                let retryCount = 0
                const maxRetries = 3
                let lastError = mindError

                while (retryCount < maxRetries) {
                  retryCount++
                  const delay = Math.pow(2, retryCount) * 1000

                  await new Promise(resolve => setTimeout(resolve, delay))

                  try {
                    const { data: retryData, error: retryError } = await supabase.storage
                      .from('mind-files')
                      .upload(mindFileName, mindFile, {
                        cacheControl: '3600',
                        upsert: false,
                        contentType: 'application/octet-stream'
                      })

                    if (!retryError) {
                      const { data: retryUrlData } = supabase.storage
                        .from('mind-files')
                        .getPublicUrl(mindFileName)

                      mindFileUrl = retryUrlData.publicUrl
                      updateProgress('Custom .mind file uploaded!')
                      break
                    } else {
                      lastError = retryError
                    }
                  } catch (retryException: any) {
                    lastError = retryException
                  }
                }

                if (retryCount >= maxRetries) {
                  throw new Error(`Upload failed after ${maxRetries} retries. Last error: ${lastError.message}`)
                }
              } else {
                throw mindError
              }
            } else {
              const { data: mindUrlData } = supabase.storage
                .from('mind-files')
                .getPublicUrl(mindFileName)
              
              mindFileUrl = mindUrlData.publicUrl
              updateProgress('Custom .mind file uploaded!')
            }
          }
        } catch (uploadError: any) {
          throw new Error(`Mind file upload failed: ${uploadError.message}`)
        }
      } else {
        // The .mind file should already contain the image data
        throw new Error('Custom .mind file is required. Please upload a .mind file.')
      }
 
      // Ensure we have a valid mind file URL
      if (!mindFileUrl) {
        throw new Error('Failed to get mind file URL. Please try again.')
      }

      // Save to database
      updateProgress('Saving experience to database...')
      const { error: dbError } = await supabase
        .from('ar_experiences')
        .insert({
          user_id: user?.id,
          title,
          description: description || null,
          marker_image_url: null, // Marker image is now contained in the .mind file
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
    }, [mindFile, videoFile, title, description, user?.id, router, updateProgress])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cream">
      {/* Navigation */}
      <nav className="bg-dark-blue shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Camera className="h-8 w-8 text-white" />
              <span className="ml-2 text-xl font-bold text-white">QuickScanAR</span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-white">{user?.email}</span>
              <button
                onClick={useCallback(() => router.push('/auth/signout'), [router])}
                className="text-white hover:text-gray-200 px-3 py-2 rounded-md text-sm font-medium"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

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
          <p className="text-xl opacity-80 max-w-2xl mx-auto leading-relaxed">
            Build an augmented reality experience with your videos and converted .mind files
          </p>
        </div>

      {/* Step 2: Convert Images */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-8 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold mb-2 text-black flex items-center">
              <Upload className="h-5 w-5 mr-2 text-dark-blue" />
              Step 2: Create New AR Experience
            </h3>
            <p className="text-gray-600">
              Make sure you've converted your images to AR format first, then build your AR experience
            </p>
          </div>
          <Link
            href="/compiler"
            className="bg-dark-blue text-white px-6 py-3 rounded-lg font-medium hover:bg-red-800 transition-colors flex items-center"
          >
            Convert Images
            <ArrowRight className="h-4 w-4 ml-2" />
          </Link>
        </div>
          </div>

      {/* Form */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <h3 className="text-xl font-semibold mb-6 text-black flex items-center">
          <Video className="h-5 w-5 mr-2 text-dark-blue" />
          AR Experience Details
        </h3>
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
                onChange={useCallback((e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value), [])}
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
                onChange={useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value), [])}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-dark-blue focus:border-transparent text-black placeholder-gray-500"
                placeholder="Describe your AR experience"
              />
            </div>

            {/* Mind File Upload */}
              <div>
              <label htmlFor="mindFile" className="block text-sm font-medium text-black mb-2">
                Mind File (.mind) <span className="text-red-500">*</span>
                </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-dark-blue transition-colors">
                <input
                  type="file"
                  id="mindFile"
                  name="mindFile"
                  accept=".mind"
                  onChange={useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setMindFile(file);
                      setUseCustomMind(true);
                    }
                  }, [])}
                  required
                  className="hidden"
                />
                <label htmlFor="mindFile" className="cursor-pointer">
                  <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-sm text-gray-600 mb-2">
                    <span className="font-medium text-dark-blue">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-gray-500">Upload your .mind file</p>
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
                  onChange={useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setVideoFile(file);
                    }
                  }, [])}
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
                disabled={submitting || !mindFile || !videoFile}
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
