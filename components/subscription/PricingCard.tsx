'use client'

import { useState } from 'react'
import { Check, Crown, Zap, Star } from 'lucide-react'
import { useAuth } from '@/components/AuthProvider'

interface PricingPlan {
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

interface PricingCardProps {
  plan: PricingPlan
  onSubscribe: () => void
  currentPlan?: string
  isLoading?: boolean
}

export default function PricingCard({ 
  plan, 
  onSubscribe, 
  currentPlan, 
  isLoading = false 
}: PricingCardProps) {
  const { user } = useAuth()
  const [isHovered, setIsHovered] = useState(false)

  const isCurrentPlan = currentPlan === plan.id
  const isPopular = plan.popular
  const isRecommended = plan.recommended

  const formatPrice = (amount: number, currency: string) => {
    if (amount === 0) return 'Free'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount)
  }

  const getIntervalText = (interval: string) => {
    return interval === 'month' ? 'month' : 'year'
  }

  const getPlanIcon = (planName: string) => {
    if (planName.toLowerCase().includes('pro')) return Crown
    if (planName.toLowerCase().includes('starter')) return Zap
    return Star
  }

  const Icon = getPlanIcon(plan.name)

  const handleSubscribe = () => {
    if (plan.polarCheckoutUrl && plan.amount > 0) {
      // Open Polar.sh checkout in new window/tab
      const checkoutWindow = window.open(plan.polarCheckoutUrl, '_blank')
      if (checkoutWindow) {
        checkoutWindow.focus()
      }
    } else {
      // Call the parent onSubscribe for free plans or fallback
      onSubscribe()
    }
  }

  return (
    <div
      className={`relative bg-white rounded-2xl p-8 shadow-lg border-2 transition-all duration-300 ${
        isPopular || isRecommended
          ? 'border-red-600 shadow-xl scale-105'
          : 'border-black hover:border-red-600'
      } ${isHovered ? 'transform -translate-y-2' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Popular/Recommended Badge */}
      {(isPopular || isRecommended) && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
          <div className="bg-red-600 text-white px-6 py-2 rounded-full text-sm font-semibold shadow-lg border-2 border-black">
            {isPopular ? 'Most Popular' : 'Recommended'}
          </div>
        </div>
      )}

      {/* Plan Header */}
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4">
          <div className={`p-3 rounded-full border-2 border-black ${
            isPopular || isRecommended 
              ? 'bg-red-600 text-white' 
              : 'bg-cream text-black'
          }`}>
            <Icon className="h-8 w-8" />
          </div>
        </div>
        
        <h3 className="text-2xl font-bold text-black mb-2">{plan.name}</h3>
        <p className="text-black opacity-80 mb-6">{plan.description}</p>
        
        <div className="mb-2">
          <span className="text-4xl font-bold text-black">
            {formatPrice(plan.amount, plan.currency)}
          </span>
          {plan.amount > 0 && (
            <span className="text-black opacity-80 ml-2">/{getIntervalText(plan.interval)}</span>
          )}
        </div>
        
        {/* Price note (e.g., Free: Forever) */}
        {plan.priceNote && (
          <div className="text-sm text-black opacity-70">{plan.priceNote}</div>
        )}

        {/* Savings text for plans like annual */}
        {plan.savingsText && (
          <div className="text-sm text-red-600 font-medium">{plan.savingsText}</div>
        )}
      </div>

      {/* Features List */}
      <div className="mb-8">
        <ul className="space-y-4">
          {plan.features.map((feature, index) => (
            <li key={index} className="flex items-start">
              <Check className="h-5 w-5 text-red-600 mr-3 mt-0.5 flex-shrink-0" />
              <span className="text-black">{feature}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Action Button */}
      <div className="text-center">
        {isCurrentPlan ? (
          <button
            disabled
            className="w-full bg-cream text-black py-3 px-6 rounded-lg font-semibold cursor-not-allowed border-2 border-black"
          >
            Current Plan
          </button>
        ) : plan.amount === 0 ? (
          <button
            onClick={handleSubscribe}
            disabled={isLoading || !user}
            className="w-full bg-red-600 text-white py-3 px-6 rounded-lg font-semibold transition-all duration-200 hover:bg-red-700 shadow-lg hover:shadow-xl border-2 border-black"
          >
            {!user ? 'Sign In to Subscribe' : isLoading ? 'Processing...' : 'Get Started Free'}
          </button>
        ) : (
          <a
            href={plan.polarCheckoutUrl}
            data-polar-checkout
            data-polar-checkout-theme="dark"
            data-customer-id={user?.id}
            className={`w-full py-3 px-6 rounded-lg font-semibold transition-all duration-200 inline-block ${
              isPopular || isRecommended
                ? 'bg-red-600 text-white hover:bg-red-700 shadow-lg hover:shadow-xl'
                : 'bg-red-600 text-white hover:bg-red-700 shadow-lg hover:shadow-xl'
            } ${isLoading || !user ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'} border-2 border-black`}
          >
            {!user ? 'Sign In to Subscribe' : isLoading ? 'Processing...' : (plan.ctaText || 'Subscribe Now')}
          </a>
        )}
      </div>

      {/* Additional Info */}
      {plan.amount === 0 && (
        <div className="mt-6 text-center">
          <p className="text-sm text-black opacity-60">
            No credit card required • Cancel anytime
          </p>
        </div>
      )}
    </div>
  )
}