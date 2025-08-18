'use client'

import { useState } from 'react'
import { CreditCard, ExternalLink } from 'lucide-react'

interface PolarCheckoutButtonProps {
  checkoutUrl: string
  planName: string
  amount: number
  currency: string
  interval: string
  className?: string
  variant?: 'primary' | 'secondary' | 'outline'
  size?: 'sm' | 'md' | 'lg'
}

export default function PolarCheckoutButton({
  checkoutUrl,
  planName,
  amount,
  currency,
  interval,
  className = '',
  variant = 'primary',
  size = 'md'
}: PolarCheckoutButtonProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleCheckout = () => {
    setIsLoading(true)
    
    // Open Polar.sh checkout in new window/tab
    const checkoutWindow = window.open(checkoutUrl, '_blank')
    
    // Reset loading state after a short delay
    setTimeout(() => {
      setIsLoading(false)
    }, 1000)

    // Focus the checkout window
    if (checkoutWindow) {
      checkoutWindow.focus()
    }
  }

  const getVariantClasses = () => {
    switch (variant) {
      case 'primary':
        return 'bg-gradient-to-r from-dark-blue to-blue-600 text-white hover:from-blue-700 hover:to-dark-blue shadow-lg hover:shadow-xl'
      case 'secondary':
        return 'bg-gray-900 text-white hover:bg-gray-800'
      case 'outline':
        return 'border-2 border-dark-blue text-dark-blue hover:bg-dark-blue hover:text-white'
      default:
        return 'bg-gradient-to-r from-dark-blue to-blue-600 text-white hover:from-blue-700 hover:to-dark-blue'
    }
  }

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'px-4 py-2 text-sm'
      case 'md':
        return 'px-6 py-3 text-base'
      case 'lg':
        return 'px-8 py-4 text-lg'
      default:
        return 'px-6 py-3 text-base'
    }
  }

  const formatPrice = (amount: number, currency: string) => {
    if (amount === 0) return 'Free'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount)
  }

  return (
    <button
      onClick={handleCheckout}
      disabled={isLoading}
      className={`
        ${getVariantClasses()}
        ${getSizeClasses()}
        rounded-lg font-semibold transition-all duration-200 
        flex items-center justify-center space-x-2
        disabled:opacity-50 disabled:cursor-not-allowed
        hover:scale-105 transform
        ${className}
      `}
    >
      {isLoading ? (
        <>
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
          <span>Opening Checkout...</span>
        </>
      ) : (
        <>
          <CreditCard className="h-4 w-4" />
          <span>
            Subscribe to {planName} - {formatPrice(amount, currency)}/{interval}
          </span>
          <ExternalLink className="h-4 w-4" />
        </>
      )}
    </button>
  )
}

// Example usage:
export function ExampleUsage() {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Polar.sh Checkout Examples</h3>
      
      {/* Primary Button */}
      <PolarCheckoutButton
        checkoutUrl="https://buy.polar.sh/polar_cl_tIJXTsoXdnxQRDa7GaT3JBFrWiJY3CTYZ0vkr2Mwj9d"
        planName="Starter Plan"
        amount={9.99}
        currency="USD"
        interval="month"
        variant="primary"
        size="lg"
      />
      
      {/* Secondary Button */}
      <PolarCheckoutButton
        checkoutUrl="https://buy.polar.sh/polar_cl_tIJXTsoXdnxQRDa7GaT3JBFrWiJY3CTYZ0vkr2Mwj9d"
        planName="Pro Plan"
        amount={49.99}
        currency="USD"
        interval="month"
        variant="secondary"
        size="md"
      />
      
      {/* Outline Button */}
      <PolarCheckoutButton
        checkoutUrl="https://buy.polar.sh/polar_cl_tIJXTsoXdnxQRDa7GaT3JBFrWiJY3CTYZ0vkr2Mwj9d"
        planName="Annual Plan"
        amount={499.99}
        currency="USD"
        interval="year"
        variant="outline"
        size="sm"
      />
    </div>
  )
}
