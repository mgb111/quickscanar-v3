'use client'

import { useEffect } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Camera } from 'lucide-react'

export default function SignOut() {
  const { signOut } = useAuth()
  const router = useRouter()

  useEffect(() => {
    const handleSignOut = async () => {
      try {
        await signOut()
        router.push('/')
      } catch (error) {
        console.error('Error signing out:', error)
        router.push('/')
      }
    }

    handleSignOut()
  }, [signOut, router])

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-dark-blue">
            <Camera className="h-8 w-8 text-white" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-black">
            Signing out...
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Please wait while we sign you out
          </p>
        </div>
        
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-dark-blue mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting to home page...</p>
        </div>

        <div className="text-center">
          <Link href="/" className="font-medium text-dark-blue hover:text-blue-900">
            Back to home
          </Link>
        </div>
      </div>
    </div>
  )
} 
