'use client'

import { useAuth } from '@/components/AuthProvider'
import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { 
  CreditCard, 
  Calendar, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  ArrowRight,
  Settings,
  Crown
} from 'lucide-react'
import PricingCard from '@/components/subscription/PricingCard'
import Header from '@/components/Header'
import toast from 'react-hot-toast'

interface SubscriptionPlan {
  id: string
  name: string
  description: string
  amount: number
  currency: string
  interval: string
  features: string[]
  popular?: boolean
  recommended?: boolean
  polarCheckoutUrl?: string
  ctaText?: string
  savingsText?: string
  priceNote?: string
}

interface UserSubscription {
  id: string
  status: string
  plan_name: string
  features: string[]
  current_period_end: string
  is_active: boolean
}

interface CampaignUsage {
  used: number
  limit: number
  plan_name: string
}

function SubscriptionPageContent() {
  const { user, loading } = useAuth()
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [currentSubscription, setCurrentSubscription] = useState<UserSubscription | null>(null)
  const [campaignUsage, setCampaignUsage] = useState<CampaignUsage | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubscribing, setIsSubscribing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        setIsLoading(true)
        const response = await fetch('/api/polar?action=prices', { cache: 'no-store' })
        if (!response.ok) {
          throw new Error('Failed to fetch pricing plans')
        }
        const data = await response.json()

        // Manually add the Free plan as it's not in Polar
        const freePlan = {
          id: 'price_free',
          name: 'Free',
          description: 'Forever',
          amount: 0,
          currency: 'USD',
          interval: 'month',
          features: [
            '1 AR Experience',
            'Basic Tracking',
            'Community Support',
          ],
          priceNote: 'Forever',
          polarCheckoutUrl: undefined,
        }

        // Combine free plan with plans from Polar
        setPlans([freePlan, ...data.prices])
        setError(null)
      } catch (err) {
        console.error('Error fetching plans:', err)
        setError(err instanceof Error ? err.message : 'Could not load plans.')
        // Set default plans as a fallback
        setPlans([
          {
            id: 'price_free',
            name: 'Free',
            description: 'Forever',
            amount: 0,
            currency: 'USD',
            interval: 'month',
            features: ['1 AR Experience', 'Basic Tracking', 'Community Support'],
            priceNote: 'Forever',
          },
          {
            id: 'price_monthly',
            name: 'Monthly',
            description: 'Great for getting started',
            amount: 49,
            currency: 'USD',
            interval: 'month',
            features: ['Up to 3 AR Experiences / month', 'Standard Analytics', 'Email Support'],
            polarCheckoutUrl: 'https://sandbox-api.polar.sh/v1/checkout-links/polar_cl_omyhnY3XbF205MbBYiCHz2trQVp2xV38AezWv3hzK7h/redirect',
            ctaText: 'Start Monthly Plan',
            popular: true,
          },
          {
            id: 'price_yearly',
            name: 'Annual',
            description: 'Best value for teams',
            amount: 499,
            currency: 'USD',
            interval: 'year',
            features: ['Unlimited AR Experiences', 'Advanced Analytics', 'Priority Support', 'Custom Branding'],
            polarCheckoutUrl: 'https://sandbox-api.polar.sh/v1/checkout-links/polar_cl_HTsyBpbDXNy27FhhIKxcGfqAglfZ75r2Yg87U4IjbLH/redirect',
            ctaText: 'Start Annual',
            savingsText: 'Save $89/year',
          },
        ])
      } finally {
        setIsLoading(false)
      }
    }

    fetchPlans()

    if (user) {
      fetchCurrentSubscription()
      fetchCampaignUsage()
    }
  }, [user])

  useEffect(() => {
    // This effect runs once on mount to link the subscription if returning from checkout
    const linkSubscriptionFromCheckout = async () => {
      const params = new URLSearchParams(window.location.search)
      const checkoutId = params.get('checkout_id')

      if (checkoutId) {
        try {
          const response = await fetch('/api/polar/link-subscription', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ checkout_id: checkoutId }),
          })

          if (response.ok) {
            console.log('Subscription linked successfully.')
            // Refresh data to show the new subscription immediately
            window.location.href = '/subscription' // Clear params and refetch
          } else {
            const errorData = await response.json()
            setError(`Failed to link subscription: ${errorData.error}`)
          }
        } catch (err) {
          console.error('Error calling link-subscription API:', err)
          setError('An error occurred while finalizing your subscription.')
        }
      }
    }

    linkSubscriptionFromCheckout()
  }, []) // Empty dependency array ensures it runs only once

  // Add Polar.sh checkout script when component mounts
  useEffect(() => {
    // Load Polar.sh checkout script
    const script = document.createElement('script')
    script.src = 'https://cdn.jsdelivr.net/npm/@polar-sh/checkout@0.1/dist/embed.global.js'
    script.defer = true
    script.setAttribute('data-auto-init', '')
    document.head.appendChild(script)

    return () => {
      // Cleanup script when component unmounts
      if (document.head.contains(script)) {
        document.head.removeChild(script)
      }
    }
  }, [])

  const fetchCurrentSubscription = async () => {
    if (!user) return
    
    try {
      const response = await fetch('/api/get-subscription')
      if (response.ok) {
        const data = await response.json()
        if (data.subscription) {
          // Map price_id to plan name
          const planName = getPlanNameFromPriceId(data.subscription.price_id)
          const features = getFeaturesFromPriceId(data.subscription.price_id)
          
          setCurrentSubscription({
            id: data.subscription.polar_subscription_id,
            status: data.subscription.status,
            plan_name: planName,
            features: features,
            current_period_end: data.subscription.current_period_end,
            is_active: data.subscription.status === 'active'
          })
        }
      }
    } catch (error) {
      console.error('Failed to fetch subscription:', error)
    }
  }

  const getPlanNameFromPriceId = (priceId: string): string => {
    if (!priceId || priceId === 'unknown') return 'QuickScanAR Monthly'
    
    // Map known price IDs to plan names
    const priceMap: Record<string, string> = {
      '911e3835-9350-440e-a4d3-86702b91f49f': 'QuickScanAR Monthly',
      'price_monthly': 'QuickScanAR Monthly',
      'price_yearly': 'QuickScanAR Annual',
    }
    
    return priceMap[priceId] || 'QuickScanAR Monthly'
  }

  const getFeaturesFromPriceId = (priceId: string): string[] => {
    if (!priceId || priceId === 'unknown') {
      return ['Up to 3 AR Experiences', 'Advanced Analytics', 'Priority Support']
    }
    
    // Map price IDs to features
    const featuresMap: Record<string, string[]> = {
      '911e3835-9350-440e-a4d3-86702b91f49f': ['Up to 3 AR Experiences', 'Advanced Analytics', 'Priority Support'],
      'price_monthly': ['Up to 3 AR Experiences', 'Advanced Analytics', 'Priority Support'],
      'price_yearly': ['Up to 36 AR Experiences', 'Advanced Analytics', 'Priority Support', 'Custom Branding'],
    }
    
    return featuresMap[priceId] || ['Up to 3 AR Experiences', 'Advanced Analytics', 'Priority Support']
  }

  const fetchCampaignUsage = async () => {
    if (!user) return
    
    try {
      const response = await fetch('/api/campaigns/usage')
      if (response.ok) {
        const data = await response.json()
        setCampaignUsage(data)
      }
    } catch (error) {
      console.error('Failed to fetch campaign usage:', error)
      // Set default usage for free plan
      setCampaignUsage({
        used: 0,
        limit: 1,
        plan_name: 'Free Plan'
      })
    }
  }

  const handleSubscribe = async (planId: string, polarCheckoutUrl?: string) => {
    if (!user) {
      toast.error('Please sign in to subscribe')
      return
    }

    if (planId === 'price_free') {
      toast.success('Free plan activated!')
      return
    }

    if (polarCheckoutUrl) {
      // Open Polar.sh checkout in new window/tab
      const checkoutWindow = window.open(polarCheckoutUrl, '_blank')
      if (checkoutWindow) {
        checkoutWindow.focus()
      }
      toast.success('Opening Polar.sh checkout...')
    } else {
      // Fallback to old subscription method
      setIsSubscribing(true)
      try {
        const response = await fetch('/api/polar', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'create_subscription',
            userId: user.id,
            priceId: planId
          })
        })

        if (response.ok) {
          const data = await response.json()
          if (data.client_secret) {
            toast.success('Redirecting to payment...')
          } else {
            toast.success('Subscription created successfully!')
            fetchCurrentSubscription()
          }
        } else {
          const error = await response.json()
          toast.error(error.error || 'Failed to create subscription')
        }
      } catch (error) {
        console.error('Subscription error:', error)
        toast.error('Failed to create subscription')
      } finally {
        setIsSubscribing(false)
      }
    }
  }

  const handleCancelSubscription = async () => {
    if (!user || !currentSubscription) return

    if (confirm('Are you sure you want to cancel your subscription? You will lose access to premium features at the end of your current billing period.')) {
      try {
        const response = await fetch('/api/polar', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'cancel_subscription',
            userId: user.id
          })
        })

        if (response.ok) {
          toast.success('Subscription canceled successfully')
          fetchCurrentSubscription()
        } else {
          const error = await response.json()
          toast.error(error.error || 'Failed to cancel subscription')
        }
      } catch (error) {
        console.error('Cancel error:', error)
        toast.error('Failed to cancel subscription')
      }
    }
  }

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-600"></div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-black mb-4">Access Required</h1>
          <p className="text-black opacity-80 mb-6">Please sign in to view subscription options</p>
          <Link href="/auth/signin" className="bg-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors">
            Sign In
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cream">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-black mb-4">Subscription Management</h1>
          <p className="text-xl text-black opacity-80 max-w-3xl mx-auto">
            Choose the perfect plan for your AR creation needs
          </p>
        </div>

        {/* Current Subscription Status */}
        {currentSubscription && (
          <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-black mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-black mb-2">Current Subscription</h2>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center">
                    {currentSubscription.is_active ? (
                      <CheckCircle className="h-5 w-5 text-red-600 mr-2" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600 mr-2" />
                    )}
                    <span className={`font-medium ${
                      currentSubscription.is_active ? 'text-red-600' : 'text-red-600'
                    }`}>
                      {currentSubscription.status.charAt(0).toUpperCase() + currentSubscription.status.slice(1)}
                    </span>
                  </div>
                  <div className="flex items-center text-black">
                    <Crown className="h-4 w-4 mr-2 text-red-600" />
                    <span>{currentSubscription.plan_name}</span>
                  </div>
                  {currentSubscription.current_period_end && (
                    <div className="flex items-center text-black">
                      <Calendar className="h-4 w-4 mr-2 text-red-600" />
                      <span>Renews {new Date(currentSubscription.current_period_end).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleCancelSubscription}
                  className="bg-red-100 text-red-700 px-4 py-2 rounded-lg font-medium hover:bg-red-200 transition-colors border border-red-600"
                >
                  Cancel Subscription
                </button>
                <Link
                  href="/subscription/settings"
                  className="bg-cream text-black px-4 py-2 rounded-lg font-medium hover:bg-white transition-colors flex items-center border-2 border-black"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Plan & Usage Section */}
        {campaignUsage && (
          <div className="bg-white rounded-2xl p-6 shadow-lg border-2 border-black mb-8">
            <h2 className="text-xl font-semibold text-black mb-4">Your Plan & Usage</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-medium text-black mb-2">Current Plan: {campaignUsage.plan_name}</h3>
                <div className="text-black">
                  <span className="text-2xl font-bold text-red-600">{campaignUsage.used}</span>
                  <span className="text-black mx-2">/</span>
                  <span className="text-lg">{campaignUsage.limit}</span>
                  <span className="text-black ml-2">campaigns used</span>
                </div>
                {campaignUsage.limit > 0 && (
                  <div className="mt-3">
                    <div className="bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-red-600 h-2 rounded-full transition-all duration-300"
                        style={{ 
                          width: `${Math.min((campaignUsage.used / campaignUsage.limit) * 100, 100)}%` 
                        }}
                      ></div>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {campaignUsage.limit - campaignUsage.used} campaigns remaining
                    </p>
                  </div>
                )}
              </div>
              <div className="flex items-center justify-center">
                {campaignUsage.used >= campaignUsage.limit ? (
                  <div className="text-center">
                    <AlertCircle className="h-12 w-12 text-orange-500 mx-auto mb-2" />
                    <p className="text-black font-medium">Limit Reached</p>
                    <p className="text-sm text-gray-600">Upgrade to create more campaigns</p>
                  </div>
                ) : (
                  <div className="text-center">
                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
                    <p className="text-black font-medium">Active Plan</p>
                    <p className="text-sm text-gray-600">You can create more campaigns</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Pricing Plans */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-black mb-4">Choose Your Plan</h2>
          <p className="text-xl text-black opacity-80 max-w-3xl mx-auto">
            Start with our free plan and upgrade as you grow. All plans include our core AR creation tools and tracking.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {plans.length === 0 ? (
            <div className="col-span-full text-center py-8">
              <p className="text-black opacity-80">Loading plans...</p>
            </div>
          ) : (
            plans.map((plan) => (
              <PricingCard
                key={plan.id}
                plan={plan}
                onSubscribe={() => handleSubscribe(plan.id, plan.polarCheckoutUrl)}
                currentPlan={currentSubscription?.id}
                isLoading={isSubscribing}
              />
            ))
          )}
        </div>

        {/* Polar.sh Checkout Info */}
        <div className="bg-cream rounded-2xl p-6 border-2 border-black mb-8">
          <h3 className="text-lg font-semibold text-black mb-3">Secure Payment Processing</h3>
          <p className="text-black mb-4">
            All payments are processed securely through Polar.sh. You'll be redirected to their secure checkout page 
            and then back to our success page upon completion.
          </p>
          <div className="text-sm text-black">
            <p>✅ Secure SSL encryption</p>
            <p>✅ Multiple payment methods</p>
            <p>✅ Instant access to features</p>
            <p>✅ Automatic subscription management</p>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="bg-white rounded-2xl p-8 shadow-lg border-2 border-black">
          <h3 className="text-2xl font-bold text-black mb-6 text-center">Frequently Asked Questions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h4 className="font-semibold text-black mb-2">Can I change my plan anytime?</h4>
              <p className="text-black opacity-80">Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately with prorated billing.</p>
            </div>
            <div>
              <h4 className="font-semibold text-black mb-2">What happens if I cancel?</h4>
              <p className="text-black opacity-80">You'll keep access to premium features until the end of your current billing period. After that, you'll revert to the free plan.</p>
            </div>
            <div>
              <h4 className="font-semibold text-black mb-2">Is there a free trial?</h4>
              <p className="text-black opacity-80">Yes! Start with our free plan to explore all features. Upgrade when you're ready for more AR experiences and advanced tracking.</p>
            </div>
            <div>
              <h4 className="font-semibold text-black mb-2">What payment methods do you accept?</h4>
              <p className="text-black opacity-80">We accept all major credit cards, debit cards, and digital wallets through our secure payment processor, Polar.sh.</p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center mt-12">
          <div className="bg-red-600 rounded-2xl p-8 text-white border-2 border-black">
            <h3 className="text-2xl font-bold mb-4">Ready to Create Amazing AR Experiences?</h3>
            <p className="text-white opacity-90 mb-6 max-w-2xl mx-auto">
              Join thousands of creators who are already using QuickScanAR to build engaging augmented reality campaigns that drive results.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/compiler"
                className="bg-white text-red-600 px-8 py-3 rounded-lg font-semibold hover:bg-cream transition-colors flex items-center justify-center border-2 border-white"
              >
                Start Creating Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <Link
                href="/dashboard"
                className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-red-600 transition-colors"
              >
                View Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function SubscriptionPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SubscriptionPageContent />
    </Suspense>
  )
}
