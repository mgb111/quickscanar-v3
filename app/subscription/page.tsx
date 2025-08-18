'use client'

import { useAuth } from '@/components/AuthProvider'
import { useState, useEffect } from 'react'
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
}

interface UserSubscription {
  id: string
  status: string
  plan_name: string
  features: string[]
  current_period_end: string
  is_active: boolean
}

export default function SubscriptionPage() {
  const { user, loading } = useAuth()
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [currentSubscription, setCurrentSubscription] = useState<UserSubscription | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubscribing, setIsSubscribing] = useState(false)

  useEffect(() => {
    console.log('🔐 Subscription page useEffect - User:', user, 'Loading:', loading)
    if (user) {
      console.log('✅ User authenticated, fetching plans and subscription...')
      fetchPlans()
      fetchCurrentSubscription()
    } else {
      console.log('❌ No user found, plans will not be fetched')
    }
  }, [user])

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

  const fetchPlans = async () => {
    try {
      console.log('🔍 Fetching plans from API...')
      const response = await fetch('/api/polar?action=prices')
      console.log('📡 API Response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('✅ Plans data received:', data)
        const formattedPlans = data.prices.map((price: any) => ({
          id: price.id,
          name: price.name,
          description: price.description,
          amount: price.amount,
          currency: price.currency,
          interval: price.recurring.interval,
          features: price.features,
          popular: price.amount >= 4999 && price.recurring.interval === 'month',
          recommended: price.amount >= 999 && price.amount < 4999 && price.recurring.interval === 'month',
          polarCheckoutUrl: price.checkout_url || `https://buy.polar.sh/${price.id}`
        }))
        console.log('🎯 Formatted plans:', formattedPlans)
        setPlans(formattedPlans)
      } else {
        console.error('❌ API call failed:', response.status, response.statusText)
        const errorData = await response.text()
        console.error('❌ Error details:', errorData)
        // Fallback to default plans with actual Polar.sh checkout URL
        console.log('🔄 Falling back to default plans...')
        setPlans(getDefaultPlans())
      }
    } catch (error) {
      console.error('💥 Error fetching plans:', error)
      // Fallback to default plans with actual Polar.sh checkout URL
      console.log('🔄 Falling back to default plans due to error...')
      setPlans(getDefaultPlans())
    }
    setIsLoading(false)
  }

  const fetchCurrentSubscription = async () => {
    if (!user) return
    
    try {
      const response = await fetch(`/api/polar?action=subscription&userId=${user.id}`)
      if (response.ok) {
        const data = await response.json()
        if (data.subscription) {
          setCurrentSubscription({
            id: data.subscription.id,
            status: data.subscription.status,
            plan_name: data.subscription.plan_name || 'Unknown Plan',
            features: data.subscription.features || [],
            current_period_end: data.subscription.current_period_end,
            is_active: data.subscription.is_active
          })
        }
      }
    } catch (error) {
      console.error('Failed to fetch subscription:', error)
    }
  }

  const getDefaultPlans = (): SubscriptionPlan[] => [
    {
      id: 'price_free',
      name: 'Free Plan',
      description: 'Get started with AR experiences',
      amount: 0,
      currency: 'USD',
      interval: 'month',
      features: [
        '1 AR Experience',
        'Basic Analytics',
        'Community Support',
        'Standard Templates'
      ]
    },
    {
      id: 'price_starter',
      name: 'Starter Plan',
      description: 'Perfect for growing creators',
      amount: 9.99,
      currency: 'USD',
      interval: 'month',
      features: [
        '10 AR Experiences',
        'Standard Analytics',
        'Email Support',
        'Custom Branding',
        'Advanced Templates',
        'Export Options'
      ],
      recommended: true,
      polarCheckoutUrl: 'https://buy.polar.sh/polar_cl_tIJXTsoXdnxQRDa7GaT3JBFrWiJY3CTYZ0vkr2Mwj9d'
    },
    {
      id: 'price_pro',
      name: 'Professional Plan',
      description: 'For businesses and agencies',
      amount: 49.99,
      currency: 'USD',
      interval: 'month',
      features: [
        'Unlimited AR Experiences',
        'Advanced Analytics',
        'Priority Support',
        'Custom Branding',
        'API Access',
        'White-label Options',
        'Team Collaboration',
        'Custom Integrations'
      ],
      popular: true,
      polarCheckoutUrl: 'https://buy.polar.sh/polar_cl_tIJXTsoXdnxQRDa7GaT3JBFrWiJY3CTYZ0vkr2Mwj9d'
    },
    {
      id: 'price_starter_yearly',
      name: 'Starter Plan (Yearly)',
      description: 'Save 20% with annual billing',
      amount: 99.99,
      currency: 'USD',
      interval: 'year',
      features: [
        '10 AR Experiences',
        'Standard Analytics',
        'Email Support',
        'Custom Branding',
        'Advanced Templates',
        'Export Options'
      ],
      polarCheckoutUrl: 'https://buy.polar.sh/polar_cl_tIJXTsoXdnxQRDa7GaT3JBFrWiJY3CTYZ0vkr2Mwj9d'
    },
    {
      id: 'price_pro_yearly',
      name: 'Professional Plan (Yearly)',
      description: 'Save 20% with annual billing',
      amount: 499.99,
      currency: 'USD',
      interval: 'year',
      features: [
        'Unlimited AR Experiences',
        'Advanced Analytics',
        'Priority Support',
        'Custom Branding',
        'API Access',
        'White-label Options',
        'Team Collaboration',
        'Custom Integrations'
      ],
      polarCheckoutUrl: 'https://buy.polar.sh/polar_cl_tIJXTsoXdnxQRDa7GaT3JBFrWiJY3CTYZ0vkr2Mwj9d'
    }
  ]

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
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-dark-blue"></div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Required</h1>
          <p className="text-gray-600 mb-6">Please sign in to view subscription options</p>
          <Link href="/auth/signin" className="bg-dark-blue text-white px-6 py-3 rounded-lg font-semibold">
            Sign In
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Debug Information - Remove this after fixing the issue */}
      {process.env.NODE_ENV === 'development' && (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-3 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium">Debug Info</h3>
              <div className="mt-2 text-sm">
                <p><strong>User:</strong> {user ? `Authenticated (${user.email})` : 'Not authenticated'}</p>
                <p><strong>Loading:</strong> {loading ? 'Yes' : 'No'}</p>
                <p><strong>Plans Count:</strong> {plans.length}</p>
                <p><strong>Current Subscription:</strong> {currentSubscription ? 'Yes' : 'No'}</p>
                <p><strong>Is Loading:</strong> {isLoading ? 'Yes' : 'No'}</p>
              </div>
              <div className="mt-3">
                <button
                  onClick={() => {
                    console.log('🧪 Manual test button clicked')
                    fetchPlans()
                  }}
                  className="bg-blue-500 text-white px-3 py-1 rounded text-xs hover:bg-blue-600"
                >
                  Test Fetch Plans
                </button>
                <button
                  onClick={async () => {
                    console.log('🧪 Testing API health...')
                    try {
                      const response = await fetch('/api/polar?action=health')
                      const data = await response.json()
                      console.log('🏥 API Health:', data)
                      alert(`API Health: ${JSON.stringify(data, null, 2)}`)
                    } catch (error) {
                      console.error('💥 Health check failed:', error)
                      alert('Health check failed')
                    }
                  }}
                  className="bg-green-500 text-white px-3 py-1 rounded text-xs hover:bg-green-600 ml-2"
                >
                  Test API Health
                </button>
              </div>
            </div>
          </div>
        )}

      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Subscription Management</h1>
              <p className="text-gray-600 mt-1">Choose the perfect plan for your AR creation needs</p>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/dashboard" className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-200">
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Current Subscription Status */}
        {currentSubscription && (
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Current Subscription</h2>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center">
                    {currentSubscription.is_active ? (
                      <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-500 mr-2" />
                    )}
                    <span className={`font-medium ${
                      currentSubscription.is_active ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {currentSubscription.status.charAt(0).toUpperCase() + currentSubscription.status.slice(1)}
                    </span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Crown className="h-4 w-4 mr-2" />
                    <span>{currentSubscription.plan_name}</span>
                  </div>
                  {currentSubscription.current_period_end && (
                    <div className="flex items-center text-gray-600">
                      <Calendar className="h-4 w-4 mr-2" />
                      <span>Renews {new Date(currentSubscription.current_period_end).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={handleCancelSubscription}
                  className="bg-red-100 text-red-700 px-4 py-2 rounded-lg font-medium hover:bg-red-200 transition-colors"
                >
                  Cancel Subscription
                </button>
                <Link
                  href="/subscription/settings"
                  className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-200 transition-colors flex items-center"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Pricing Plans */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Choose Your Plan</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Start with our free plan and upgrade as you grow. All plans include our core AR creation tools and analytics.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {plans.map((plan) => (
            <PricingCard
              key={plan.id}
              plan={plan}
              onSubscribe={() => handleSubscribe(plan.id, plan.polarCheckoutUrl)}
              currentPlan={currentSubscription?.id}
              isLoading={isSubscribing}
            />
          ))}
        </div>

        {/* Polar.sh Checkout Info */}
        <div className="bg-blue-50 rounded-lg p-6 border border-blue-200 mb-8">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">Secure Payment Processing</h3>
          <p className="text-blue-800 mb-4">
            All payments are processed securely through Polar.sh. You'll be redirected to their secure checkout page 
            and then back to our success page upon completion.
          </p>
          <div className="text-sm text-blue-700">
            <p>✅ Secure SSL encryption</p>
            <p>✅ Multiple payment methods</p>
            <p>✅ Instant access to features</p>
            <p>✅ Automatic subscription management</p>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="bg-white rounded-lg p-8 shadow-sm border border-gray-200">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">Frequently Asked Questions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Can I change my plan anytime?</h4>
              <p className="text-gray-600">Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately with prorated billing.</p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">What happens if I cancel?</h4>
              <p className="text-gray-600">You'll keep access to premium features until the end of your current billing period. After that, you'll revert to the free plan.</p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Is there a free trial?</h4>
              <p className="text-gray-600">Yes! Start with our free plan to explore all features. Upgrade when you're ready for more AR experiences and advanced analytics.</p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">What payment methods do you accept?</h4>
              <p className="text-gray-600">We accept all major credit cards, debit cards, and digital wallets through our secure payment processor, Polar.sh.</p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center mt-12">
          <div className="bg-gradient-to-r from-dark-blue to-blue-600 rounded-2xl p-8 text-white">
            <h3 className="text-2xl font-bold mb-4">Ready to Create Amazing AR Experiences?</h3>
            <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
              Join thousands of creators who are already using QuickScanAR to build engaging augmented reality campaigns that drive results.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/compiler"
                className="bg-white text-dark-blue px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors flex items-center justify-center"
              >
                Start Creating Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <Link
                href="/dashboard"
                className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-dark-blue transition-colors"
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
