'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Camera, ArrowLeft, Share2, Smartphone } from 'lucide-react'
import Link from 'next/link'
import QRCode from 'qrcode.react'
import toast from 'react-hot-toast'

type ARExperience = {
  id: string
  title: string
  description: string | null
  marker_image_url: string
  mind_file_url: string
  video_url: string
  preview_image_url: string | null
  plane_width: number
  plane_height: number
  video_rotation: number
  created_at: string
  updated_at: string
}

export default function ExperienceViewer() {
  const params = useParams()
  const router = useRouter()
  const [experience, setExperience] = useState<ARExperience | null>(null)
  const [loading, setLoading] = useState(true)
  const [showQR, setShowQR] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
    setIsMobile(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent))
    if (params.id) {
      fetchExperience()
    }
    // eslint-disable-next-line
  }, [params.id])

  const fetchExperience = async () => {
    try {
      const { data, error } = await supabase
        .from('ar_experiences')
        .select('*')
        .eq('id', params.id)
        .single()

      if (error) throw error
      setExperience(data)
    } catch (error: any) {
      toast.error('Experience not found')
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      toast.success('Link copied to clipboard!')
    } catch (error) {
      toast.error('Failed to copy link')
    }
  }

  const openARExperience = () => {
    if (experience) {
      // Open the AR experience using the API route
      const arUrl = `${window.location.origin}/api/ar/${experience.id}`
      window.open(arUrl, '_blank')
    }
  }

  if (loading || !isClient) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  if (!experience) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Camera className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Experience not found</h3>
          <p className="mt-1 text-sm text-gray-500">The AR experience you're looking for doesn't exist.</p>
          <div className="mt-6">
            <Link
              href="/"
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Home
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Navigation */}
      <nav className="absolute top-0 left-0 right-0 z-10 bg-black bg-opacity-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="flex items-center text-white hover:text-gray-300">
                <ArrowLeft className="h-5 w-5 mr-2" />
                Back
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowQR(!showQR)}
                className="text-white hover:text-gray-300 px-3 py-2 rounded-md text-sm font-medium"
              >
                <Share2 className="h-5 w-5" />
              </button>
              <button
                onClick={copyToClipboard}
                className="text-white hover:text-gray-300 px-3 py-2 rounded-md text-sm font-medium"
              >
                Copy Link
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* AR Experience Launch */}
      <div className="relative w-full h-screen flex items-center justify-center">
        <div className="text-center text-white">
          <Camera className="mx-auto h-16 w-16 mb-4" />
          <h1 className="text-2xl font-bold mb-2">{experience.title}</h1>
          {experience.description && (
            <p className="text-gray-300 mb-6">{experience.description}</p>
          )}
          
          <button
            onClick={openARExperience}
            className="bg-primary-600 text-white px-8 py-3 rounded-lg text-lg font-medium hover:bg-primary-700 transition-colors"
          >
            Launch AR Experience
          </button>
          
          <div className="mt-6 text-sm text-gray-400">
            <p>Click the button above to open the AR experience in a new window</p>
            <p className="mt-2">Make sure to allow camera permissions when prompted</p>
          </div>
        </div>

        {/* Marker Reference */}
        <div className="absolute top-20 right-4 bg-black bg-opacity-75 text-white px-4 py-2 rounded-lg">
          <div className="flex items-center space-x-2">
            <img 
              src={experience.marker_image_url} 
              alt="Marker reference" 
              className="w-12 h-12 object-cover rounded"
            />
            <div>
              <p className="text-xs text-gray-300">Point camera at this image</p>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="absolute bottom-8 left-4 right-4 bg-black bg-opacity-75 text-white px-6 py-4 rounded-lg">
          <div className="text-center">
            <h3 className="font-bold mb-2">How to Use AR</h3>
            <ol className="text-sm space-y-1">
              <li>1. Click "Launch AR Experience" above</li>
              <li>2. Allow camera permission when prompted</li>
              <li>3. Point your camera at the marker image (shown on the right)</li>
              <li>4. Hold steady until the video appears</li>
            </ol>
          </div>
        </div>

        {/* QR Code Modal */}
        {showQR && (
          <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center z-20">
            <div className="bg-white p-6 rounded-lg">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Scan QR Code</h3>
              <div className="flex justify-center mb-4">
                <QRCode value={window.location.href} size={200} />
              </div>
              <p className="text-sm text-gray-600 text-center mb-4">
                Scan this QR code with your mobile device to open the AR experience
              </p>
              <button
                onClick={() => setShowQR(false)}
                className="w-full bg-primary-600 text-white py-2 px-4 rounded-md hover:bg-primary-700"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 