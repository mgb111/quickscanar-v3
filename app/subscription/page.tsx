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

export default function SubscriptionPage() {
  const { user, loading } = useAuth()
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [currentSubscription, setCurrentSubscription] = useState<UserSubscription | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubscribing, setIsSubscribing] = useState(false)

  useEffect(() => {
    // Set plans immediately - only the 3 plans that actually exist
    const actualPlans = [
      {
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
      },
      {
        id: 'price_monthly',
        name: 'Monthly',
        description: '$49 per month',
        amount: 49,
        currency: 'USD',
        interval: 'month',
        features: [
          '3 AR Campaigns',
          'Advanced Tracking',
          'Priority Support',
          'Custom Branding',
        ],
        popular: true, // Shows "Most Popular" badge
        ctaText: 'Start Monthly Plan',
        polarCheckoutUrl: 'https://buy.polar.sh/polar_cl_tIJXTsoXdnxQRDa7GaT3JBFrWiJY3CTYZ0vkr2Mwj9d',
      },
      {
        id: 'price_yearly',
        name: 'Annual',
        description: '$499 per year',
        amount: 499,
        currency: 'USD',
        interval: 'year',
        features: [
          'Unlimited AR Campaigns',
          'Premium Tracking',
          '24/7 Support',
          'White-label Solutions',
        ],
        savingsText: 'Save $89/year',
        ctaText: 'Start Annual',
        polarCheckoutUrl: 'https://buy.polar.sh/polar_cl_uJCvGJRiHoQ9Y1fNO8c8aSlVofV5iTlzVtlaQ3JBFrWiJY3CTYZ0vkr2Mwj9d',
      }
    ]
    console.log('🔍 Setting actual plans:', actualPlans)
    setPlans(actualPlans)
    setIsLoading(false)
    
    if (user) {
      fetchCurrentSubscription()
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
