'use client'

import { useEffect } from 'react'

interface PolarEmbeddedCheckoutProps {
  checkoutUrl: string
  buttonText?: string
  theme?: 'light' | 'dark'
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export default function PolarEmbeddedCheckout({
  checkoutUrl,
  buttonText = 'Subscribe Now',
  theme = 'dark',
  className = '',
  size = 'md'
}: PolarEmbeddedCheckoutProps) {
  useEffect(() => {
    // Load Polar.sh checkout script if not already loaded
    if (!document.querySelector('script[src*="@polar-sh/checkout"]')) {
      const script = document.createElement('script')
      script.src = 'https://cdn.jsdelivr.net/npm/@polar-sh/checkout@0.1/dist/embed.global.js'
      script.defer = true
      script.setAttribute('data-auto-init', '')
      document.head.appendChild(script)
    }
  }, [])

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

  return (
    <a
      href={checkoutUrl}
      data-polar-checkout
      data-polar-checkout-theme={theme}
      className={`inline-block bg-gradient-to-r from-dark-blue to-blue-600 text-white font-semibold rounded-lg transition-all duration-200 hover:from-blue-700 hover:to-dark-blue shadow-lg hover:shadow-xl hover:scale-105 ${getSizeClasses()} ${className}`}
    >
      {buttonText}
    </a>
  )
}

// Example usage components
export function StarterPlanCheckout() {
  return (
    <PolarEmbeddedCheckout
      checkoutUrl="https://buy.polar.sh/polar_cl_tIJXTsoXdnxQRDa7GaT3JBFrWiJY3CTYZ0vkr2Mwj9d"
      buttonText="Start Starter Plan - $9.99/month"
      theme="dark"
      size="lg"
      className="w-full text-center"
    />
  )
}

export function ProPlanCheckout() {
  return (
    <PolarEmbeddedCheckout
      checkoutUrl="https://buy.polar.sh/polar_cl_tIJXTsoXdnxQRDa7GaT3JBFrWiJY3CTYZ0vkr2Mwj9d"
      buttonText="Get Pro Plan - $49.99/month"
      theme="dark"
      size="lg"
      className="w-full text-center"
    />
  )
}

export function AnnualPlanCheckout() {
  return (
    <PolarEmbeddedCheckout
      checkoutUrl="https://buy.polar.sh/polar_cl_tIJXTsoXdnxQRDa7GaT3JBFrWiJY3CTYZ0vkr2Mwj9d"
      buttonText="Save 20% with Annual - $499.99/year"
      theme="dark"
      size="md"
      className="w-full text-center"
    />
  )
}

// Usage examples:
export function CheckoutExamples() {
  return (
    <div className="space-y-4 p-6 bg-gray-50 rounded-lg">
      <h3 className="text-lg font-semibold text-gray-900">Polar.sh Embedded Checkout Examples</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StarterPlanCheckout />
        <ProPlanCheckout />
        <AnnualPlanCheckout />
      </div>
      
      <div className="text-sm text-gray-600 mt-4">
        <p>These buttons will open the Polar.sh checkout in a new window/tab.</p>
        <p>After successful payment, users will be redirected to your success page with the checkout ID.</p>
      </div>
    </div>
  )
}
