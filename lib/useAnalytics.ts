'use client'

import { useCallback } from 'react'

declare global {
  interface Window {
    gtag: (...args: any[]) => void
  }
}

export const useAnalytics = () => {
  const trackEvent = useCallback((
    action: string,
    category: string,
    label?: string,
    value?: number
  ) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', action, {
        event_category: category,
        event_label: label,
        value: value,
      })
    }
  }, [])

  const trackPageView = useCallback((url: string) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('config', process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID!, {
        page_path: url,
      })
    }
  }, [])

  const trackConversion = useCallback((conversionId: string, value?: number) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'conversion', {
        send_to: conversionId,
        value: value,
      })
    }
  }, [])

  const trackUserEngagement = useCallback((
    action: string,
    contentId?: string,
    contentType?: string
  ) => {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', action, {
        content_id: contentId,
        content_type: contentType,
      })
    }
  }, [])

  return {
    trackEvent,
    trackPageView,
    trackConversion,
    trackUserEngagement,
  }
}
