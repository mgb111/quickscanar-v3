'use client'

import { useAuth } from '@/components/AuthProvider'
import { useSearchParams, useRouter } from 'next/navigation'
import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { 
  CheckCircle, 
  ArrowRight, 
  Calendar, 
  Crown,
  Download,
  Share2
} from 'lucide-react'
import toast from 'react-hot-toast'
import { createClient } from '@supabase/supabase-js'

interface SubscriptionSuccess {
  checkout_id: string
  subscription_id: string
  plan_name: string
  amount: number
  currency: string
  interval: string
  current_period_end: string
  campaign_limit: string
}

function SubscriptionSuccessContent() {
  const { user, loading, supabase } = useAuth()
  const searchParams = useSearchParams()
  const router = useRouter()
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionSuccess | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const checkoutId = searchParams.get('checkout_id')
  // Capture optional IDs that Polar may include in success URL
  const subIdParam = searchParams.get('subscription_id') || searchParams.get('subscriptionId')
  const custIdParam = searchParams.get('customer_id') || searchParams.get('customerId')

  useEffect(() => {
    console.log("Success page - document.cookie:", document.cookie);
    console.log("Success page - user agent:", navigator.userAgent);
  }, []);

  useEffect(() => {
    if (!checkoutId) {
      router.push('/subscription')
      return
    }

    // Wait for auth to load, then proceed
    if (loading) return

    if (!user) {
      console.log('❌ No user found on success page, redirecting to signin')
      router.push('/auth/signin?redirect=/subscription/success?checkout_id=' + checkoutId)
      return
    }

    if (user && supabase) {
      // Proactively link subscription using checkout_id, then poll for details
      ;(async () => {
        try {
          // Get the current session to include JWT token
          const { data: { session } } = await supabase.auth.getSession();
          
          if (!session) {
            setError("Please log in to continue");
            setIsLoading(false);
            return;
          }

          const authHeaders = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          };

          const linkPromise = fetch('/api/polar/link-subscription', {
            method: 'POST',
            headers: authHeaders,
            credentials: 'include',
            body: JSON.stringify({ checkout_id: checkoutId }),
          });

          toast.promise(
            linkPromise.then(async (res) => {
              if (!res.ok) {
                const errorData = await res.json().catch(() => ({ error: 'An unknown error occurred' }));
                throw new Error(errorData.error || `Request failed with status ${res.status}`);
              }
              return res.json();
            }),
            {
              loading: 'Finalizing your subscription...',
              success: 'Subscription linked successfully!',
              error: (err) => `Error: ${err.message}`,
            }
          );

          const res = await linkPromise;
          if (res.ok) {
            // Only poll if linking was successful
            pollSubscriptionDetails();
          } else {
            console.error('Failed to link subscription:', res.status);
            const errorData = await res.json().catch(() => ({ error: 'An unknown error occurred' }));
            setError(errorData.error || "Failed to link subscription");
            setIsLoading(false);
          }
        } catch (e: any) {
          console.warn('link-subscription call failed:', e)
          setError(e.message || "Failed to process subscription");
          setIsLoading(false);
        }
      })()
    }
  }, [checkoutId, user, router, subIdParam, custIdParam, supabase])

  const fetchSubscriptionDetails = async (): Promise<boolean> => {
    if (!checkoutId || !user || !supabase) return false

    try {
      // Get the current session to include JWT token
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setError("Authentication session expired");
        setIsLoading(false);
        return false;
      }

      const response = await fetch(`/api/get-subscription`, { 
        cache: 'no-store', 
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.subscription) {
          const planName = data.subscription.plan_name || 'Premium Plan';
          let campaignLimit = 'Unknown';
          if (planName.toLowerCase().includes('monthly')) {
            campaignLimit = '3 Campaigns';
          } else if (planName.toLowerCase().includes('annual')) {
            campaignLimit = 'Unlimited Campaigns';
          }

          setSubscriptionData({
            checkout_id: checkoutId,
            subscription_id: data.subscription.id,
            plan_name: planName,
            amount: data.subscription.amount || 0,
            currency: data.subscription.currency || 'USD',
            interval: data.subscription.interval || 'month',
            current_period_end: data.subscription.current_period_end,
            campaign_limit: campaignLimit
          })
          return true
        }
      }
      return false
    } catch (error) {
      console.error('Failed to fetch subscription details:', error)
      toast.error('Failed to load subscription details')
      return false
    } finally {
      setIsLoading(false)
    }
  }

  // Poll subscription details for a short period to allow webhook/linking to complete
  const pollSubscriptionDetails = async (maxAttempts = 8, delayMs = 2500) => {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const success = await fetchSubscriptionDetails()
      if (success) return
      await new Promise((r) => setTimeout(r, delayMs))
    }
  }

  if (loading || isLoading) {
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

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Payment Successful, but...</h1>
          <p className="text-gray-600 mb-4">Your payment was processed, but we're having trouble setting up your subscription.</p>
          <p className="text-red-600 mb-6">Error: {error}</p>
          <Link href="/subscription" className="bg-dark-blue text-white px-6 py-3 rounded-lg font-semibold">
            Contact Support
          </Link>
        </div>
      </div>
    )
  }

  if (!subscriptionData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Subscription Not Found</h1>
          <p className="text-gray-600 mb-6">Unable to find your subscription details.</p>
          <Link href="/subscription" className="bg-dark-blue text-white px-6 py-3 rounded-lg font-semibold">
            Back to Subscriptions
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome to Premium!</h1>
            <p className="text-gray-600">Your subscription has been activated successfully</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Success Details */}
        <div className="bg-white rounded-lg p-8 shadow-sm border border-gray-200 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Subscription Details</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Plan:</span>
                  <span className="font-medium text-gray-900">{subscriptionData.plan_name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Campaigns Unlocked:</span>
                  <span className="font-medium text-gray-900">{subscriptionData.campaign_limit}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Amount:</span>
                  <span className="font-medium text-gray-900">
                    ${(subscriptionData.amount / 100).toFixed(2)}/{subscriptionData.interval}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Checkout ID:</span>
                  <span className="font-mono text-sm text-gray-500">{subscriptionData.checkout_id}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Subscription ID:</span>
                  <span className="font-mono text-sm text-gray-500">{subscriptionData.subscription_id}</span>
                </div>
                {subscriptionData.current_period_end && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Next billing:</span>
                    <span className="font-medium text-gray-900">
                      {new Date(subscriptionData.current_period_end).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">What's Next?</h2>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <Crown className="h-5 w-5 text-yellow-500 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-gray-900">Access Premium Features</h3>
                    <p className="text-sm text-gray-600">Unlock unlimited AR experiences and advanced tracking</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Download className="h-5 w-5 text-blue-500 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-gray-900">Download Resources</h3>
                    <p className="text-sm text-gray-600">Get access to premium templates and assets</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <Share2 className="h-5 w-5 text-green-500 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-gray-900">Share Your Work</h3>
                    <p className="text-sm text-gray-600">Showcase your AR experiences to the world</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
          <Link
            href="/compiler"
            className="bg-dark-blue text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center"
          >
            Start Creating AR
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
          <Link
            href="/dashboard"
            className="bg-gray-100 text-gray-700 px-8 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
          >
            Go to Dashboard
          </Link>
        </div>

        {/* Additional Information */}
        <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">Need Help Getting Started?</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-blue-800">
            <div>
              <h4 className="font-medium mb-1">📚 Documentation</h4>
              <p>Check out our comprehensive guides and tutorials</p>
            </div>
            <div>
              <h4 className="font-medium mb-1">🎥 Video Tutorials</h4>
              <p>Watch step-by-step videos for quick learning</p>
            </div>
            <div>
              <h4 className="font-medium mb-1">💬 Community</h4>
              <p>Join our community for tips and inspiration</p>
            </div>
          </div>
        </div>

        {/* Support Section */}
        <div className="text-center mt-8">
          <p className="text-gray-600 mb-4">
            Questions about your subscription? We're here to help!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/subscription"
              className="text-dark-blue hover:text-blue-700 font-medium"
            >
              Manage Subscription
            </Link>
            <span className="text-gray-400">•</span>
            <a
              href="mailto:support@quickscanar.com"
              className="text-dark-blue hover:text-blue-700 font-medium"
            >
              Contact Support
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function SubscriptionSuccessPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SubscriptionSuccessContent />
    </Suspense>
  )
}
