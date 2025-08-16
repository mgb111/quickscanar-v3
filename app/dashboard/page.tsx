'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Camera, Plus, Eye, Trash2, QrCode, Copy, Upload, ArrowRight, Video } from 'lucide-react'
import toast from 'react-hot-toast'
import QRCode from 'qrcode.react'

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
  const [showQR, setShowQR] = useState<string | null>(null)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/signin')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user) {
      fetchExperiences()
    }
  }, [user])

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

  if (loading || loadingExperiences) {
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
            <div className="flex items-center space-x-3 sm:space-x-4">
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

        {/* Step 1: Create AR Format */}
        <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-6 mb-6 sm:mb-8 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex-1">
              <h3 className="text-xl font-semibold mb-2 text-black flex items-center">
                <Upload className="h-5 w-5 mr-2 text-dark-blue" />
                Step 1: Create AR Format
              </h3>
              <p className="text-gray-600">
                First, create AR-ready targets using our MindAR compiler
              </p>
            </div>
            <Link
              href="/compiler"
              className="bg-gradient-to-r from-dark-blue to-blue-700 text-white px-6 py-4 rounded-xl font-semibold hover:from-blue-700 hover:to-dark-blue transition-all duration-300 flex items-center justify-center shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 min-w-[200px] lg:min-w-0 touch-manipulation select-none"
            >
              <Upload className="h-5 w-5 mr-2 hidden sm:inline" />
              <span className="hidden sm:inline">Create AR</span>
              <span className="sm:hidden">Create AR</span>
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </div>
        </div>

        {/* Create New Experience */}
        <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-6 mb-6 sm:mb-8 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex-1">
              <h3 className="text-xl font-semibold mb-2 text-black flex items-center">
                <Video className="h-5 w-5 mr-2 text-dark-blue" />
                Step 2: Create New AR Experience
              </h3>
              <p className="text-gray-600">
                Build your AR experience with videos and converted .mind files
              </p>
            </div>
            <Link
              href="/dashboard/create"
              className="bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-4 rounded-xl font-semibold hover:from-green-700 hover:to-green-800 transition-all duration-300 flex items-center justify-center shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 min-w-[200px] lg:min-w-0 touch-manipulation select-none"
            >
              <Video className="h-5 w-5 mr-2 hidden sm:inline" />
              <span className="hidden sm:inline">Create Experience</span>
              <span className="sm:hidden">Create AR</span>
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </div>
        </div>

        {/* Existing Experiences */}
        <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-6 shadow-sm">
          <h3 className="text-xl font-semibold mb-6 text-black flex items-center">
            <Camera className="h-5 w-5 mr-2 text-dark-blue" />
            Your AR Experiences
          </h3>
          
          {experiences.length === 0 ? (
            <div className="text-center py-12">
              <Camera className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">No experiences yet</h4>
              <p className="text-gray-600 mb-6">
                Start by creating AR format, then create your first experience.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  href="/compiler"
                  className="bg-gradient-to-r from-dark-blue to-blue-700 text-white px-6 py-4 rounded-xl font-semibold hover:from-blue-700 hover:to-dark-blue transition-all duration-300 flex items-center justify-center shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95 touch-manipulation select-none"
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
                  className="bg-gray-50 border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h4 className="font-semibold text-black mb-2">
                        {experience.title || 'Untitled Experience'}
                      </h4>
                      <p className="text-sm text-gray-600 mb-3">
                        {experience.description || 'No description'}
                      </p>
                      <div className="text-xs text-gray-500">
                        Created: {new Date(experience.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Link
                      href={`/experience/${experience.id}`}
                      className="flex-1 bg-dark-blue text-white text-center py-2 px-4 rounded-lg text-sm font-medium hover:bg-red-800 transition-colors"
                    >
                      View
                    </Link>
                    <button
                      onClick={() => copyToClipboard(`${window.location.origin}/experience/${experience.id}`)}
                      className="bg-white text-dark-blue border border-gray-300 py-2 px-4 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                    >
                      Share
                    </button>
                    <button
                      onClick={() => deleteExperience(experience.id)}
                      className="bg-red-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors flex items-center justify-center"
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
      </div>
    </div>
  )
} 
