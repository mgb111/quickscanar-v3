'use client'

import { useEffect, useRef, useState } from 'react'
import type React from 'react'
import { useAuth } from '@/components/AuthProvider'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Camera, Plus, Eye, Trash2, QrCode, Copy, Upload, ArrowRight, Video, Crown } from 'lucide-react'
import toast from 'react-hot-toast'
import Header from '@/components/Header'

type ARExperience = {
  id: string
  title: string
  description: string | null
  marker_image_url: string | null
  mind_file_url: string
  video_url: string
  preview_image_url: string | null
  created_at: string
  updated_at: string
}

export default function Dashboard() {
  const { user, loading, supabase } = useAuth()
  const router = useRouter()
  const [experiences, setExperiences] = useState<ARExperience[]>([])
  const [loadingExperiences, setLoadingExperiences] = useState(true)
  const [showMarkerQR, setShowMarkerQR] = useState<string | null>(null)
  const [markerQRDataUrl, setMarkerQRDataUrl] = useState<string | null>(null)
  const [subscription, setSubscription] = useState<any>(null)
  const [campaignLimit, setCampaignLimit] = useState(1) // Default for free users
  const [loadingSubscription, setLoadingSubscription] = useState(true);

  // Editor state for draggable QR over marker
  const [qrEditorOpen, setQrEditorOpen] = useState(false)
  const [editorExperience, setEditorExperience] = useState<ARExperience | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const markerImageRef = useRef<HTMLImageElement | null>(null)
  const qrCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const [qrPos, setQrPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [qrEditSize, setQrEditSize] = useState<number>(0)
  const [isDragging, setIsDragging] = useState(false)
  const dragOffsetRef = useRef<{ dx: number; dy: number }>({ dx: 0, dy: 0 })

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/signin')
    }
  }, [loading, user, router])

  // Generate and download QR code only (no marker)
  const downloadQrOnly = async (experience: ARExperience) => {
    try {
      const qrCanvas = document.createElement('canvas')
      const size = 512 // high-res QR only
      const url = `${window.location.origin}/api/ar/${experience.id}`
      const QRCodeLib = await import('qrcode')
      await new Promise<void>((resolve, reject) => {
        QRCodeLib.toCanvas(
          qrCanvas,
          url,
          {
            width: size,
            color: { dark: '#000000', light: '#FFFFFF' },
            errorCorrectionLevel: 'H',
            margin: 2,
          },
          (err: any) => (err ? reject(err) : resolve())
        )
      })
      const link = document.createElement('a')
      link.download = `qr-${experience.id}.png`
      link.href = qrCanvas.toDataURL('image/png')
      link.click()
    } catch (e) {
      toast.error('Failed to generate QR')
    }
  }

  // Open draggable editor for positioning QR on marker
  const openQrEditor = async (experience: ARExperience) => {
    if (!experience.marker_image_url) {
      toast.error('No marker image available')
      return
    }
    setEditorExperience(experience)
    setQrEditorOpen(true)

    // Load marker
    const markerImg = new Image()
    markerImg.crossOrigin = 'anonymous'
    markerImg.onload = async () => {
      markerImageRef.current = markerImg
      const canvas = canvasRef.current
      if (!canvas) return
      canvas.width = markerImg.width
      canvas.height = markerImg.height

      // Make QR for editor (same sizing baseline as preview)
      const size = Math.min(220, markerImg.width * 0.25)
      setQrEditSize(size)
      const qrCanvas = document.createElement('canvas')
      try {
        const QRCodeLib = await import('qrcode')
        await new Promise<void>((resolve, reject) => {
          QRCodeLib.toCanvas(
            qrCanvas,
            `${window.location.origin}/api/ar/${experience.id}`,
            { width: size, color: { dark: '#000000', light: '#FFFFFF' }, errorCorrectionLevel: 'H' },
            (err: any) => (err ? reject(err) : resolve())
          )
        })
      } catch (e) {
        toast.error('Failed to load QR library')
        return
      }
      qrCanvasRef.current = qrCanvas

      // Default position: top-right with padding
      const padding = 16
      setQrPos({ x: canvas.width - size - padding, y: padding })
      drawEditor()
    }
    markerImg.onerror = () => toast.error('Failed to load marker image')
    markerImg.src = experience.marker_image_url!
  }

  const drawEditor = () => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    const markerImg = markerImageRef.current
    const qrCanvas = qrCanvasRef.current
    if (!markerImg || !qrCanvas) return
    // Draw marker
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(markerImg, 0, 0)
    // Background + QR + label
    const label = 'AR Experience'
    const labelFontSize = Math.max(12, Math.round(qrEditSize * 0.14))
    ctx.font = `${labelFontSize}px sans-serif`
    ctx.textBaseline = 'top'
    const labelHeight = labelFontSize + 6
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)'
    ctx.fillRect(qrPos.x - 4, qrPos.y - 4, qrEditSize + 8, qrEditSize + 8 + labelHeight)
    ctx.drawImage(qrCanvas, qrPos.x, qrPos.y)
    const textWidth = ctx.measureText(label).width
    ctx.fillStyle = '#000'
    const textX = qrPos.x + Math.max(0, (qrEditSize - textWidth) / 2)
    const textY = qrPos.y + qrEditSize + 4
    ctx.fillText(label, textX, textY)
  }

  const pointInQr = (x: number, y: number) => {
    return (
      x >= qrPos.x &&
      y >= qrPos.y &&
      x <= qrPos.x + qrEditSize &&
      y <= qrPos.y + qrEditSize
    )
  }

  const onEditorMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = (e.target as HTMLCanvasElement).getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    if (pointInQr(x, y)) {
      setIsDragging(true)
      dragOffsetRef.current = { dx: x - qrPos.x, dy: y - qrPos.y }
    }
  }

  const onEditorMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging) return
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = (e.target as HTMLCanvasElement).getBoundingClientRect()
    let x = e.clientX - rect.left - dragOffsetRef.current.dx
    let y = e.clientY - rect.top - dragOffsetRef.current.dy
    // Constrain inside canvas
    x = Math.max(0, Math.min(x, canvas.width - qrEditSize))
    y = Math.max(0, Math.min(y, canvas.height - (qrEditSize + Math.max(12, Math.round(qrEditSize * 0.14)) + 8)))
    setQrPos({ x, y })
    drawEditor()
  }

  const onEditorMouseUp = () => setIsDragging(false)

  const onEditorTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    const rect = (e.target as HTMLCanvasElement).getBoundingClientRect()
    const t = e.touches[0]
    const x = t.clientX - rect.left
    const y = t.clientY - rect.top
    if (pointInQr(x, y)) {
      setIsDragging(true)
      dragOffsetRef.current = { dx: x - qrPos.x, dy: y - qrPos.y }
    }
  }
  const onEditorTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDragging) return
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = (e.target as HTMLCanvasElement).getBoundingClientRect()
    const t = e.touches[0]
    let x = t.clientX - rect.left - dragOffsetRef.current.dx
    let y = t.clientY - rect.top - dragOffsetRef.current.dy
    x = Math.max(0, Math.min(x, canvas.width - qrEditSize))
    y = Math.max(0, Math.min(y, canvas.height - (qrEditSize + Math.max(12, Math.round(qrEditSize * 0.14)) + 8)))
    setQrPos({ x, y })
    drawEditor()
  }
  const onEditorTouchEnd = () => setIsDragging(false)

  const saveEditedComposite = () => {
    // Current canvas already has marker + QR + label drawn
    const canvas = canvasRef.current
    if (!canvas) return
    const link = document.createElement('a')
    link.download = `marker-with-qr-${editorExperience?.id}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
    toast.success('Edited marker with QR downloaded!')
    setQrEditorOpen(false)
  }

  const openMarkerQrPreview = async (experience: ARExperience) => {
    if (!experience.marker_image_url) {
      toast.error('No marker image available for this experience')
      return
    }

    try {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        toast.error('Canvas not supported in this browser')
        return
      }

      const markerImg = new Image()
      markerImg.crossOrigin = 'anonymous'

      markerImg.onload = () => {
        canvas.width = markerImg.width
        canvas.height = markerImg.height
        ctx.drawImage(markerImg, 0, 0)

        const qrCanvas = document.createElement('canvas')
        const qrSize = Math.min(220, markerImg.width * 0.25)

        import('qrcode').then((QRCodeLib) => {
          QRCodeLib.toCanvas(qrCanvas, `${window.location.origin}/api/ar/${experience.id}`, {
            width: qrSize,
            color: { dark: '#000000', light: '#FFFFFF' },
            errorCorrectionLevel: 'H'
          }, (error: any) => {
            if (error) {
              toast.error('Failed to generate QR code')
              return
            }

            const padding = 16
            // Top-right placement
            const qrX = canvas.width - qrSize - padding
            const qrY = padding
            // Background including space for label
            const label = 'AR Experience'
            const labelFontSize = Math.max(12, Math.round(qrSize * 0.14))
            ctx.font = `${labelFontSize}px sans-serif`
            ctx.textBaseline = 'top'
            const labelHeight = labelFontSize + 6
            ctx.fillStyle = 'rgba(255, 255, 255, 0.95)'
            ctx.fillRect(qrX - 4, qrY - 4, qrSize + 8, qrSize + 8 + labelHeight)
            // Draw QR
            ctx.drawImage(qrCanvas, qrX, qrY)
            // Draw label centered under QR
            const textWidth = ctx.measureText(label).width
            ctx.fillStyle = '#000000'
            const textX = qrX + Math.max(0, (qrSize - textWidth) / 2)
            const textY = qrY + qrSize + 4
            ctx.fillText(label, textX, textY)

            setMarkerQRDataUrl(canvas.toDataURL('image/png'))
            setShowMarkerQR(experience.id)
          })
        }).catch(() => {
          toast.error('Failed to load QR code library')
        })
      }

      markerImg.onerror = () => {
        toast.error('Failed to load marker image')
      }

      markerImg.src = experience.marker_image_url
    } catch (error) {
      console.error('Error generating preview image:', error)
      toast.error('Failed to generate preview')
    }
  }

  useEffect(() => {
    if (user) {
      fetchExperiences()
      fetchSubscription()
    }
  }, [user])

  const fetchSubscription = async () => {
    if (!user) return;
    setLoadingSubscription(true);
    try {
      const response = await fetch('/api/get-subscription');
      if (response.ok) {
        const data = await response.json();
        console.log('📊 Dashboard received subscription data:', JSON.stringify(data, null, 2));
        if (data.subscription) {
          setSubscription(data.subscription);
          if (data.plan && typeof data.plan.limit === 'number') {
            setCampaignLimit(data.plan.limit);
          }
        } else {
          // Explicitly set free plan if no subscription found
          setSubscription(null);
          setCampaignLimit(1);
        }
      }
    } catch (error) {
      console.error('Failed to fetch subscription details:', error);
    } finally {
      setLoadingSubscription(false);
    }
  };

  const fetchExperiences = async () => {
    if (!supabase) {
      toast.error('Supabase client not available')
      return
    }
    
    try {
      const { data, error } = await supabase
        .from('ar_experiences')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setExperiences(data || [])
    } catch (error: any) {
      toast.error('Failed to load experiences')
    } finally {
      setLoadingExperiences(false)
    }
  }

  const deleteExperience = async (id: string) => {
    if (!confirm('Are you sure you want to delete this experience?')) return

    if (!supabase) {
      toast.error('Supabase client not available')
      return
    }

    try {
      const { error } = await supabase
        .from('ar_experiences')
        .delete()
        .eq('id', id)

      if (error) throw error
      
      toast.success('Experience deleted successfully')
      fetchExperiences()
    } catch (error: any) {
      toast.error('Failed to delete experience')
    }
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success('Link copied to clipboard!')
    } catch (error) {
      toast.error('Failed to copy link')
    }
  }

  const downloadMarkerWithQR = async (experience: ARExperience) => {
    if (!experience.marker_image_url) {
      toast.error('No marker image available for this experience')
      return
    }

    try {
      // Create a canvas to combine marker image and QR code
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        toast.error('Canvas not supported in this browser')
        return
      }

      // Load the marker image
      const markerImg = new Image()
      markerImg.crossOrigin = 'anonymous'
      
      markerImg.onload = () => {
        // Set canvas size to match marker image
        canvas.width = markerImg.width
        canvas.height = markerImg.height
        
        // Draw the marker image
        ctx.drawImage(markerImg, 0, 0)
        
        // Create QR code for the AR camera link
        const qrCanvas = document.createElement('canvas')
        const qrSize = Math.min(220, markerImg.width * 0.25) // 25% of marker width, max 220px
        
        // Use QRCode.toCanvas for programmatic generation
        import('qrcode').then((QRCodeLib) => {
          QRCodeLib.toCanvas(qrCanvas, `${window.location.origin}/api/ar/${experience.id}`, {
            width: qrSize,
            color: {
              dark: '#000000',
              light: '#FFFFFF'
            },
            errorCorrectionLevel: 'H'
          }, (error: any) => {
            if (error) {
              toast.error('Failed to generate QR code')
              return
            }
            
            // Position QR code (top-right corner with padding) and draw label
            const padding = 16
            const qrX = canvas.width - qrSize - padding
            const qrY = padding

            // Background including space for label
            const label = 'AR Experience'
            const labelFontSize = Math.max(12, Math.round(qrSize * 0.14))
            ctx.font = `${labelFontSize}px sans-serif`
            ctx.textBaseline = 'top'
            const labelHeight = labelFontSize + 6
            ctx.fillStyle = 'rgba(255, 255, 255, 0.95)'
            ctx.fillRect(qrX - 4, qrY - 4, qrSize + 8, qrSize + 8 + labelHeight)

            // Draw QR code
            ctx.drawImage(qrCanvas, qrX, qrY)
            // Draw label centered under QR
            const textWidth = ctx.measureText(label).width
            ctx.fillStyle = '#000000'
            const textX = qrX + Math.max(0, (qrSize - textWidth) / 2)
            const textY = qrY + qrSize + 4
            ctx.fillText(label, textX, textY)
            
            // Download the combined image
            const link = document.createElement('a')
            link.download = `marker-with-qr-${experience.id}.png`
            link.href = canvas.toDataURL('image/png')
            link.click()
            
            toast.success('Marker with QR code downloaded!')
          })
        }).catch(() => {
          toast.error('Failed to load QR code library')
        })
      }
      
      markerImg.onerror = () => {
        toast.error('Failed to load marker image')
      }
      
      markerImg.src = experience.marker_image_url
    } catch (error) {
      console.error('Error generating combined image:', error)
      toast.error('Failed to generate combined image')
    }
  }

  if (loading || loadingExperiences) {
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Header */}
        <div className="text-center text-black mb-6 sm:mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold mb-3 sm:mb-4 tracking-tight">
            AR Experience Dashboard
          </h1>
          <p className="text-lg sm:text-xl opacity-80 max-w-2xl mx-auto leading-relaxed px-4 sm:px-0">
            Create and manage your augmented reality experiences
          </p>
        </div>

        {/* Campaign Usage & Subscription Status */}
        <div className="bg-white border-2 border-black rounded-2xl p-4 sm:p-6 mb-6 sm:mb-8 shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex-1">
              <h3 className="text-xl font-semibold mb-2 text-black flex items-center">
                <Crown className="h-5 w-5 mr-2 text-yellow-500" />
                Your Plan & Usage
              </h3>
              <p className="text-black opacity-80 mb-3">
                Current Plan: <span className="font-semibold capitalize">{loadingSubscription ? 'Loading...' : (subscription?.plan || 'Free Plan')}</span>
              </p>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-red-600 h-2.5 rounded-full"
                  style={{ width: `${Math.min((experiences.length / (campaignLimit === 36 ? 1 : campaignLimit)) * 100, 100)}%` }}
                ></div>
              </div>
              <p className="text-sm text-black opacity-80 mt-1">
                {experiences.length} / {campaignLimit === 36 ? 'Unlimited' : campaignLimit} campaigns used
              </p>
            </div>
            {(!subscription || campaignLimit < 36) && (
              <Link
                href="/subscription"
                className="bg-red-600 text-white px-6 py-4 rounded-xl font-semibold hover:bg-red-700 transition-all duration-300 flex items-center justify-center shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 min-w-[200px] lg:min-w-0 touch-manipulation select-none border-2 border-black"
              >
                Upgrade Plan
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            )}
          </div>
        </div>

        {/* Step 1: Create AR Format */}
        <div className="bg-white border-2 border-black rounded-2xl p-4 sm:p-6 mb-6 sm:mb-8 shadow-lg">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex-1">
              <h3 className="text-xl font-semibold mb-2 text-black flex items-center">
                <Upload className="h-5 w-5 mr-2 text-red-600" />
                Step 1: Create AR Format
              </h3>
              <p className="text-black opacity-80">
                First, create AR-ready targets using our MindAR compiler
              </p>
            </div>
            <Link
              href="/compiler"
              className="bg-red-600 text-white px-6 py-4 rounded-xl font-semibold hover:bg-red-700 transition-all duration-300 flex items-center justify-center shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 min-w-[200px] lg:min-w-0 touch-manipulation select-none border-2 border-black"
            >
              <Upload className="h-5 w-5 mr-2 hidden sm:inline" />
              <span className="hidden sm:inline">Create AR</span>
              <span className="sm:hidden">Create AR</span>
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </div>
        </div>

        {/* Create New Experience */}
        <div className="bg-white border-2 border-black rounded-2xl p-4 sm:p-6 mb-6 sm:mb-8 shadow-lg">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex-1">
              <h3 className="text-xl font-semibold mb-2 text-black flex items-center">
                <Video className="h-5 w-5 mr-2 text-red-600" />
                Step 2: Create New AR Experience
              </h3>
              <p className="text-black opacity-80">
                Build your AR experience with videos and converted .mind files
              </p>
            </div>
            <Link
              href="/dashboard/create"
              className="bg-red-600 text-white px-6 py-4 rounded-xl font-semibold hover:bg-red-700 transition-all duration-300 flex items-center justify-center shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 min-w-[200px] lg:min-w-0 touch-manipulation select-none border-2 border-black"
            >
              <Video className="h-5 w-5 mr-2 hidden sm:inline" />
              <span className="hidden sm:inline">Create Experience</span>
              <span className="sm:hidden">Create AR</span>
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </div>
        </div>



        {/* Existing Experiences */}
        <div className="bg-white border-2 border-black rounded-2xl p-4 sm:p-6 shadow-lg">
          <h3 className="text-xl font-semibold mb-6 text-black flex items-center">
            <Camera className="h-5 w-5 mr-2 text-red-600" />
            Your AR Experiences
          </h3>
          
          {experiences.length === 0 ? (
            <div className="text-center py-12">
              <Camera className="h-16 w-16 text-black mx-auto mb-4" />
              <h4 className="text-lg font-medium text-black mb-2">No experiences yet</h4>
              <p className="text-black opacity-80 mb-6">
                Start by creating AR format, then create your first experience.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  href="/compiler"
                  className="bg-red-600 text-white px-6 py-4 rounded-xl font-semibold hover:bg-red-700 transition-all duration-300 flex items-center justify-center shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 touch-manipulation select-none border-2 border-black"
                >
                  <Upload className="h-5 w-5 mr-2 hidden sm:inline" />
                  <span className="hidden sm:inline">Create AR First</span>
                  <span className="sm:hidden">Create AR First</span>
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {experiences.map((experience) => (
                <div
                  key={experience.id}
                  className="bg-cream border-2 border-black rounded-xl p-6 hover:shadow-md transition-shadow relative"
                >
                  {/* Marker image preview removed as requested */}

                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h4 className="font-semibold text-black mb-2">
                        {experience.title || 'Untitled Experience'}
                      </h4>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => openMarkerQrPreview(experience)}
                      className="bg-green-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors flex items-center justify-center border border-black"
                      title="Preview & Download Marker with QR"
                    >
                      <QrCode className="h-4 w-4 mr-2" />
                      Marker+QR
                    </button>
                    <button
                      onClick={() => downloadQrOnly(experience)}
                      className="bg-white text-black py-2 px-4 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors flex items-center justify-center border border-black"
                      title="Download QR only"
                    >
                      <QrCode className="h-4 w-4 mr-2" />
                      QR Only
                    </button>
                    <button
                      onClick={() => copyToClipboard(`${window.location.origin}/api/ar/${experience.id}`)}
                      className="bg-white text-black py-2 px-4 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors flex items-center justify-center border border-black"
                      title="Copy AR Link"
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy Link
                    </button>
                    <button
                      onClick={() => openQrEditor(experience)}
                      className="bg-blue-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center justify-center border border-black"
                      title="Edit QR position on marker"
                    >
                      Edit QR on Marker
                    </button>
                    <button
                      onClick={() => deleteExperience(experience.id)}
                      className="bg-red-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors flex items-center justify-center border border-black"
                      title="Delete experience"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Preview Modal: Marker + QR */}
        {showMarkerQR && markerQRDataUrl && (
          <div
            className="fixed inset-0 bg-black/60 z-[10000] flex items-center justify-center p-4"
            onClick={() => setShowMarkerQR(null)}
          >
            <div
              className="bg-white rounded-xl border-2 border-black max-w-[95vw] w-full p-4 sm:p-6 shadow-xl relative"
              onClick={(e) => e.stopPropagation()}
            >
              <h4 className="text-lg font-semibold text-black mb-4">Marker + QR Preview</h4>
              <div className="w-full overflow-auto max-h-[85vh] flex items-center justify-center bg-cream border border-black rounded-lg p-2">
                <img src={markerQRDataUrl} alt="Marker with QR" className="max-w-[90vw] max-h-[82vh] object-contain" />
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <button
                  onClick={() => setShowMarkerQR(null)}
                  className="bg-white text-black py-2 px-4 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors border border-black"
                >
                  Close
                </button>
                <a
                  href={markerQRDataUrl}
                  download={`marker-with-qr-${showMarkerQR}.png`}
                  className="bg-green-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors border border-black"
                >
                  Download
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Editor Modal: Draggable QR over Marker */}
        {qrEditorOpen && (
          <div
            className="fixed inset-0 bg-black/60 z-[10000] flex items-center justify-center p-4"
            onClick={() => setQrEditorOpen(false)}
          >
            <div
              className="bg-white rounded-xl border-2 border-black max-w-[95vw] w-full p-4 sm:p-6 shadow-xl relative"
              onClick={(e) => e.stopPropagation()}
            >
              <h4 className="text-lg font-semibold text-black mb-2">Edit QR Position</h4>
              <p className="text-sm text-black/70 mb-4">Drag the QR to reposition. Works with mouse or touch.</p>
              <div className="w-full overflow-auto max-h-[85vh] bg-cream border border-black rounded-lg p-2">
                <canvas
                  ref={canvasRef}
                  onMouseDown={onEditorMouseDown}
                  onMouseMove={onEditorMouseMove}
                  onMouseUp={onEditorMouseUp}
                  onMouseLeave={onEditorMouseUp}
                  onTouchStart={onEditorTouchStart}
                  onTouchMove={onEditorTouchMove}
                  onTouchEnd={onEditorTouchEnd}
                  className="block"
                />
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <button
                  onClick={() => setQrEditorOpen(false)}
                  className="bg-white text-black py-2 px-4 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors border border-black"
                >
                  Cancel
                </button>
                <button
                  onClick={saveEditedComposite}
                  className="bg-blue-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors border border-black"
                >
                  Save & Download
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
