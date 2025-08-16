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
}

interface PricingCardProps {
  plan: PricingPlan
  onSubscribe: (planId: string) => void
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

  return (
    <div
      className={`relative bg-white rounded-2xl p-8 shadow-lg border-2 transition-all duration-300 ${
        isPopular || isRecommended
          ? 'border-dark-blue shadow-xl scale-105'
          : 'border-gray-200 hover:border-gray-300'
      } ${isHovered ? 'transform -translate-y-2' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Popular/Recommended Badge */}
      {(isPopular || isRecommended) && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
          <div className="bg-gradient-to-r from-dark-blue to-blue-600 text-white px-6 py-2 rounded-full text-sm font-semibold shadow-lg">
            {isPopular ? 'Most Popular' : 'Recommended'}
          </div>
        </div>
      )}

      {/* Plan Header */}
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4">
          <div className={`p-3 rounded-full ${
            isPopular || isRecommended 
              ? 'bg-gradient-to-r from-dark-blue to-blue-600 text-white' 
              : 'bg-gray-100 text-gray-600'
          }`}>
            <Icon className="h-8 w-8" />
          </div>
        </div>
        
        <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
        <p className="text-gray-600 mb-6">{plan.description}</p>
        
        <div className="mb-2">
          <span className="text-4xl font-bold text-gray-900">
            {formatPrice(plan.amount, plan.currency)}
          </span>
          {plan.amount > 0 && (
            <span className="text-gray-600 ml-2">/{getIntervalText(plan.interval)}</span>
          )}
        </div>
        
        {plan.interval === 'year' && plan.amount > 0 && (
          <div className="text-sm text-green-600 font-medium">
            Save 20% with annual billing
          </div>
        )}
      </div>

      {/* Features List */}
      <div className="mb-8">
        <ul className="space-y-4">
          {plan.features.map((feature, index) => (
            <li key={index} className="flex items-start">
              <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
              <span className="text-gray-700">{feature}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Action Button */}
      <div className="text-center">
        {isCurrentPlan ? (
          <button
            disabled
            className="w-full bg-gray-100 text-gray-500 py-3 px-6 rounded-lg font-semibold cursor-not-allowed"
          >
            Current Plan
          </button>
        ) : (
          <button
            onClick={() => onSubscribe(plan.id)}
            disabled={isLoading || !user}
            className={`w-full py-3 px-6 rounded-lg font-semibold transition-all duration-200 ${
              isPopular || isRecommended
                ? 'bg-gradient-to-r from-dark-blue to-blue-600 text-white hover:from-blue-700 hover:to-dark-blue shadow-lg hover:shadow-xl'
                : 'bg-gray-900 text-white hover:bg-gray-800'
            } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}`}
          >
            {!user ? 'Sign In to Subscribe' : isLoading ? 'Processing...' : 'Subscribe Now'}
          </button>
        )}
      </div>

      {/* Additional Info */}
      {plan.amount === 0 && (
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            No credit card required • Cancel anytime
          </p>
        </div>
      )}
    </div>
  )
}
