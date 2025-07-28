'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Camera, ArrowLeft, Share2, Smartphone } from 'lucide-react'
import Link from 'next/link'
import QRCode from 'qrcode.react'
import toast from 'react-hot-toast'
import Script from 'next/script'

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
      {/* Load A-Frame and MindAR scripts before anything else */}
      <Script src="https://aframe.io/releases/1.5.0/aframe.min.js" strategy="beforeInteractive" />
      <Script src="https://cdn.jsdelivr.net/npm/mind-ar@1.2.5/dist/mindar-image-aframe.prod.js" strategy="beforeInteractive" />

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

      {/* AR Experience */}
      <div className="relative w-full h-screen">
        {/* Only render AR scene on client */}
        {isClient && (
          <a-scene
            mindar-image={`imageTargetSrc: ${experience.mind_file_url};`}
            color-space="sRGB"
            renderer="colorManagement: true, physicallyCorrectLights"
            vr-mode-ui="enabled: false"
            device-orientation-permission-ui="enabled: false"
            embedded
          >
            <a-assets>
              <img id="marker" src={experience.marker_image_url} />
              <video
                id="videoTexture"
                src={experience.video_url}
                loop
                muted
                playsInline
                crossOrigin="anonymous"
              ></video>
            </a-assets>

            <a-camera position="0 0 0" look-controls="enabled: false"></a-camera>

            <a-entity mindar-image-target="targetIndex: 0" id="target">
              {/* Marker image plane */}
              <a-plane 
                src="#marker"
                position="0 0 0"
                height={experience.plane_height}
                width={experience.plane_width}
                rotation="0 0 0"
              ></a-plane>

              {/* Video plane */}
              <a-plane
                id="videoPlane"
                width={experience.plane_width}
                height={experience.plane_height}
                position="0 0 0.01"
                rotation={`0 0 ${experience.video_rotation * Math.PI / 180}`}
                material="shader: flat; src: #videoTexture"
              ></a-plane>
            </a-entity>
          </a-scene>
        )}

        {/* Instructions Overlay */}
        {!isMobile && (
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-75 text-white px-6 py-4 rounded-lg">
            <div className="flex items-center space-x-2">
              <Smartphone className="h-5 w-5" />
              <span>Open this page on your mobile device for the best AR experience</span>
            </div>
          </div>
        )}

        {/* Experience Info */}
        <div className="absolute top-20 left-4 bg-black bg-opacity-75 text-white px-4 py-2 rounded-lg max-w-xs">
          <h2 className="font-bold text-lg">{experience.title}</h2>
          {experience.description && (
            <p className="text-sm text-gray-300 mt-1">{experience.description}</p>
          )}
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