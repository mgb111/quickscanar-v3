'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export default function LinkSubscriptionPage() {
  const [status, setStatus] = useState('Linking your subscription...')
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClientComponentClient()

  useEffect(() => {
    async function linkSubscription() {
      try {
        // Get checkout_id from URL params or fallback to known value
        const checkoutId = searchParams.get('checkout_id') || 'b9249aad-145b-485f-9946-2920971b78a1'
        
        // Get authenticated user
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        
        if (authError || !user) {
          setStatus('❌ Please log in first')
          setIsLoading(false)
          return
        }
        
        if (!checkoutId) {
          setStatus('❌ No checkout ID provided')
          setIsLoading(false)
          return
        }
        
        const response = await fetch('/api/polar/link-subscription', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            checkout_id: checkoutId,
            user_id: user.id
          })
        })
        
        const result = await response.json()
        
        if (response.ok) {
          setStatus('✅ Subscription linked successfully!')
          setTimeout(() => {
            router.push('/subscription')
          }, 2000)
        } else {
          setStatus(`❌ Failed to link subscription: ${result.error || 'Unknown error'}`)
        }
      } catch (error) {
        setStatus(`❌ Error: ${error}`)
      } finally {
        setIsLoading(false)
      }
    }

    linkSubscription()
  }, [router])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Linking Subscription
        </h1>
        
        {isLoading && (
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        )}
        
        <p className="text-gray-600 mb-6">{status}</p>
        
        {!isLoading && status.includes('✅') && (
          <p className="text-sm text-gray-500">
            Redirecting to subscription page...
          </p>
        )}
        
        {!isLoading && status.includes('❌') && (
          <button
            onClick={() => router.push('/subscription')}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Go to Subscription Page
          </button>
        )}
      </div>
    </div>
  )
}
