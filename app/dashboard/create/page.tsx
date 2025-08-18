'use client'

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import { Camera, Upload, Video, ArrowLeft, ArrowRight, Plus } from 'lucide-react'
import Header from '@/components/Header'

export default function CreateExperience() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [mindFile, setMindFile] = useState<File | null>(null)
  const [useCustomMind, setUseCustomMind] = useState(false)

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
          
          {/* Simple Step-by-Step Guide */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 max-w-4xl mx-auto text-left">
            <h2 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
              <Plus className="h-5 w-5 mr-2" />
              How AR Works (Simple Guide)
            </h2>
            <div className="grid md:grid-cols-3 gap-4 text-sm">
              <div className="bg-white p-4 rounded-lg border border-blue-100">
                <div className="font-semibold text-blue-800 mb-2">1. Upload Your Image</div>
                <p className="text-blue-700">First, create AR format from your photo using our compiler. This creates a "mind file" that your phone can recognize.</p>
              </div>
              <div className="bg-white p-4 rounded-lg border border-blue-100">
                <div className="font-semibold text-blue-800 mb-2">2. Add Your Video</div>
                <p className="text-blue-700">Upload a video that will play when someone points their camera at your image. This could be a tutorial, demo, or any video content.</p>
              </div>
              <div className="bg-white p-4 rounded-lg border border-blue-100">
                <div className="font-semibold text-blue-800 mb-2">3. Point & Play</div>
                <p className="text-blue-700">Users point their phone camera at your image, and your video automatically plays on top of it in real-time!</p>
              </div>
            </div>
          </div>
        </div>

        {/* Step 2: Create AR Experience */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-8 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xl font-semibold mb-2 text-black flex items-center">
                <Upload className="h-5 w-5 mr-2 text-dark-blue" />
                Step 2: Create New AR Experience
              </h3>
              <p className="text-gray-600">
                Now let's build your AR experience by combining your AR-ready image with a video
              </p>
            </div>
            <Link
              href="/compiler"
              className="bg-dark-blue text-white px-6 py-3 rounded-lg font-medium hover:bg-red-800 transition-colors flex items-center"
            >
              Create AR
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </div>
          
          {/* Quick Checklist */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-800 mb-3">Before you start, make sure you have:</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li className="flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                A .mind file (created from your image using the compiler above)
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                A video file (MP4, WebM, or other common formats)
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                A name and description for your experience
              </li>
            </ul>
          </div>
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
