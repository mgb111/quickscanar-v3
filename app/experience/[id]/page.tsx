'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Camera, ArrowLeft, Share2, Smartphone, Play, Pause, Volume2, VolumeX } from 'lucide-react'
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
  const [isVideoPlaying, setIsVideoPlaying] = useState(false)
  const [isVideoMuted, setIsVideoMuted] = useState(true)
  const [targetFound, setTargetFound] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    setIsClient(true)
    setIsMobile(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent))
    
    // Check for HTTPS requirement
    if (typeof window !== 'undefined' && window.location.protocol !== 'https:') {
      toast.error('AR requires HTTPS. Please use https:// for the best experience.')
    }
    
    if (params.id) {
      fetchExperience()
    }
    // eslint-disable-next-line
  }, [params.id])

  useEffect(() => {
    // Add event listeners for AR interactions
    const handleTargetFound = () => {
      setTargetFound(true)
      if (videoRef.current && !isVideoPlaying) {
        videoRef.current.play()
        setIsVideoPlaying(true)
      }
    }

    const handleTargetLost = () => {
      setTargetFound(false)
    }

    const handleVideoPlay = () => {
      setIsVideoPlaying(true)
    }

    const handleVideoPause = () => {
      setIsVideoPlaying(false)
    }

    // Initialize AR scene properly
    const initializeAR = () => {
      const scene = document.querySelector('a-scene')
      if (scene) {
        // Wait for scene to be ready
        scene.addEventListener('loaded', () => {
          console.log('AR Scene loaded')
          
          // Request camera permissions
          if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            navigator.mediaDevices.getUserMedia({ video: true })
              .then(() => {
                console.log('Camera permission granted')
              })
              .catch((error) => {
                console.error('Camera permission denied:', error)
                toast.error('Camera permission is required for AR. Please allow camera access.')
              })
          }
        })

        // Add event listeners for AR events
        scene.addEventListener('targetFound', handleTargetFound)
        scene.addEventListener('targetLost', handleTargetLost)
      }

      const video = document.querySelector('#videoTexture')
      if (video) {
        video.addEventListener('play', handleVideoPlay)
        video.addEventListener('pause', handleVideoPause)
      }
    }

    // Initialize AR when component mounts
    if (isClient && experience) {
      // Small delay to ensure DOM is ready
      setTimeout(initializeAR, 1000)
    }

    return () => {
      const scene = document.querySelector('a-scene')
      if (scene) {
        scene.removeEventListener('targetFound', handleTargetFound)
        scene.removeEventListener('targetLost', handleTargetLost)
      }
      
      const video = document.querySelector('#videoTexture')
      if (video) {
        video.removeEventListener('play', handleVideoPlay)
        video.removeEventListener('pause', handleVideoPause)
      }
    }
  }, [isClient, experience, isVideoPlaying])

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

  const toggleVideoPlayback = () => {
    if (videoRef.current) {
      if (isVideoPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
      setIsVideoPlaying(!isVideoPlaying)
    }
  }

  const toggleVideoMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isVideoMuted
      setIsVideoMuted(!isVideoMuted)
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
            loading-screen="enabled: false"
          >
            <a-assets>
              <img id="marker" src={experience.marker_image_url} />
              <video
                ref={videoRef}
                id="videoTexture"
                src={experience.video_url}
                loop
                muted={isVideoMuted}
                playsInline
                crossOrigin="anonymous"
                preload="auto"
              ></video>
            </a-assets>

            <a-camera position="0 0 0" look-controls="enabled: false"></a-camera>

            <a-entity 
              mindar-image-target="targetIndex: 0" 
              id="target"
            >
              {/* Video plane - this will show the video over the marker */}
              <a-plane
                id="videoPlane"
                width={experience.plane_width}
                height={experience.plane_height}
                position="0 0 0.01"
                rotation={`0 0 ${experience.video_rotation * Math.PI / 180}`}
                material="shader: flat; src: #videoTexture; transparent: true; opacity: 1"
              ></a-plane>
            </a-entity>
          </a-scene>
        )}

        {/* Video Controls Overlay */}
        {targetFound && (
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-75 text-white px-6 py-4 rounded-lg">
            <div className="flex items-center space-x-4">
              <button
                onClick={toggleVideoPlayback}
                className="flex items-center space-x-2 hover:text-gray-300"
              >
                {isVideoPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                <span>{isVideoPlaying ? 'Pause' : 'Play'}</span>
              </button>
              <button
                onClick={toggleVideoMute}
                className="flex items-center space-x-2 hover:text-gray-300"
              >
                {isVideoMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                <span>{isVideoMuted ? 'Unmute' : 'Mute'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Target Detection Status */}
        <div className="absolute top-20 right-4 bg-black bg-opacity-75 text-white px-4 py-2 rounded-lg">
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${targetFound ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-sm">
              {targetFound ? 'Target Detected' : 'Point camera at marker'}
            </span>
          </div>
        </div>

        {/* Instructions Overlay */}
        {!isMobile && (
          <div className="absolute bottom-8 left-4 bg-black bg-opacity-75 text-white px-6 py-4 rounded-lg">
            <div className="flex items-center space-x-2">
              <Smartphone className="h-5 w-5" />
              <span>Open this page on your mobile device for the best AR experience</span>
            </div>
          </div>
        )}

        {/* Mobile Instructions */}
        {isMobile && !targetFound && (
          <div className="absolute bottom-8 left-4 right-4 bg-black bg-opacity-75 text-white px-6 py-4 rounded-lg">
            <div className="text-center">
              <h3 className="font-bold mb-2">How to Use AR</h3>
              <ol className="text-sm space-y-1">
                <li>1. Allow camera permission when prompted</li>
                <li>2. Point your camera at the marker image (shown on the right)</li>
                <li>3. Hold steady until the video appears</li>
                <li>4. Use the controls to play/pause/mute the video</li>
              </ol>
            </div>
          </div>
        )}

        {/* Debug Information */}
        {process.env.NODE_ENV === 'development' && (
          <div className="absolute top-32 left-4 bg-black bg-opacity-75 text-white px-4 py-2 rounded-lg text-xs">
            <div>MindAR File: {experience.mind_file_url.includes('compiled') ? '✅ Compiled' : '❌ Not Compiled'}</div>
            <div>Target Found: {targetFound ? '✅ Yes' : '❌ No'}</div>
            <div>Video Playing: {isVideoPlaying ? '✅ Yes' : '❌ No'}</div>
            <div>HTTPS: {typeof window !== 'undefined' && window.location.protocol === 'https:' ? '✅ Yes' : '❌ No'}</div>
          </div>
        )}

        {/* Experience Info */}
        <div className="absolute top-20 left-4 bg-black bg-opacity-75 text-white px-4 py-2 rounded-lg max-w-xs">
          <h2 className="font-bold text-lg">{experience.title}</h2>
          {experience.description && (
            <p className="text-sm text-gray-300 mt-1">{experience.description}</p>
          )}
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