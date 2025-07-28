'use client'

import { useEffect } from 'react'
import { useAuth } from '@/components/AuthProvider'
import { useRouter } from 'next/navigation'

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
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-500"></div>
    </div>
  )
} 