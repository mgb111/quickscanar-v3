'use client'

import Link from 'next/link'
import { XCircle, ArrowLeft, RefreshCw } from 'lucide-react'

export default function SubscriptionCancelPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
          <XCircle className="h-8 w-8 text-red-600" />
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Subscription Cancelled</h1>
        <p className="text-gray-600 mb-6">
          You've cancelled the subscription process. No charges have been made to your account.
        </p>
        
        <div className="space-y-3">
          <Link
            href="/subscription"
            className="w-full bg-dark-blue text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center"
          >
            <RefreshCw className="h-5 w-5 mr-2" />
            Try Again
          </Link>
          
          <Link
            href="/dashboard"
            className="w-full bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors flex items-center justify-center"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Dashboard
          </Link>
        </div>
        
        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-500 mb-2">Need help with your subscription?</p>
          <a
            href="mailto:support@quickscanar.com"
            className="text-dark-blue hover:text-blue-700 text-sm font-medium"
          >
            Contact Support
          </a>
        </div>
      </div>
    </div>
  )
}
