'use client'

import { useEffect, useRef } from 'react'

interface AnalyticsEvent {
  experienceId: string
  event: 'view' | 'interaction' | 'completion' | 'error' | 'conversion' | 'target_recognition' | 'session_start' | 'session_end'
  userId?: string
  sessionId: string
  deviceInfo?: any
  location?: any
  duration?: number
  metadata?: any
}

interface AnalyticsTrackerProps {
  experienceId: string
  userId?: string
  onEvent?: (event: AnalyticsEvent) => void
}

export default function AnalyticsTracker({ experienceId, userId, onEvent }: AnalyticsTrackerProps) {
  const sessionId = useRef(generateSessionId())
  const sessionStartTime = useRef(Date.now())
  const hasTrackedView = useRef(false)
  const interactionCount = useRef(0)

  useEffect(() => {
    // Track session start
    trackEvent('session_start', {
      deviceInfo: getDeviceInfo(),
      location: getLocationInfo()
    })

    // Track initial view
    if (!hasTrackedView.current) {
      trackEvent('view')
      hasTrackedView.current = true
    }

    // Track page visibility changes
    const handleVisibilityChange = () => {
      if (document.hidden) {
        trackEvent('session_end', {
          duration: Date.now() - sessionStartTime.current
        })
      } else {
        trackEvent('session_start', {
          deviceInfo: getDeviceInfo(),
          location: getLocationInfo()
        })
        sessionStartTime.current = Date.now()
      }
    }

    // Track user interactions
    const handleInteraction = (event: Event) => {
      interactionCount.current++
      trackEvent('interaction', {
        interactionType: event.type,
        target: (event.target as Element)?.tagName,
        totalInteractions: interactionCount.current
      })
    }

    // Track errors
    const handleError = (event: ErrorEvent) => {
      trackEvent('error', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      })
    }

    // Add event listeners
    document.addEventListener('visibilitychange', handleVisibilityChange)
    document.addEventListener('click', handleInteraction)
    document.addEventListener('touchstart', handleInteraction)
    window.addEventListener('error', handleError)

    // Track session end on unmount
    return () => {
      trackEvent('session_end', {
        duration: Date.now() - sessionStartTime.current,
        totalInteractions: interactionCount.current
      })
      
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      document.removeEventListener('click', handleInteraction)
      document.removeEventListener('touchstart', handleInteraction)
      window.removeEventListener('error', handleError)
    }
  }, [experienceId, userId])

  const trackEvent = async (event: AnalyticsEvent['event'], metadata?: any) => {
    const eventData: AnalyticsEvent = {
      experienceId,
      event,
      userId,
      sessionId: sessionId.current,
      deviceInfo: getDeviceInfo(),
      location: getLocationInfo(),
      metadata
    }

    // Call custom event handler if provided
    if (onEvent) {
      onEvent(eventData)
    }

    // Send to analytics API
    try {
      await fetch('/api/analytics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData),
      })
    } catch (error) {
      console.error('Failed to track analytics event:', error)
    }
  }

  // Expose tracking methods for manual tracking
  const trackTargetRecognition = (success: boolean, recognitionTime?: number) => {
    trackEvent('target_recognition', {
      success,
      recognitionTime,
      timestamp: Date.now()
    })
  }

  const trackCompletion = (completionRate: number) => {
    trackEvent('completion', {
      completionRate,
      sessionDuration: Date.now() - sessionStartTime.current
    })
  }

  const trackConversion = (conversionType: string, value?: any) => {
    trackEvent('conversion', {
      conversionType,
      value,
      sessionDuration: Date.now() - sessionStartTime.current
    })
  }

  // Store tracking methods on window for easy access
  useEffect(() => {
    (window as any).arAnalytics = {
      trackTargetRecognition,
      trackCompletion,
      trackConversion,
      trackCustomEvent: (metadata: any) => trackEvent('interaction', metadata)
    }
  }, [])

  return null
}

function generateSessionId(): string {
  return 'session_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now()
}

function getDeviceInfo() {
  if (typeof window === 'undefined') return null
  
  return {
    userAgent: navigator.userAgent,
    language: navigator.language,
    platform: navigator.platform,
    cookieEnabled: navigator.cookieEnabled,
    onLine: navigator.onLine,
    screenWidth: screen.width,
    screenHeight: screen.height,
    windowWidth: window.innerWidth,
    windowHeight: window.innerHeight,
    devicePixelRatio: window.devicePixelRatio,
    touchSupport: 'ontouchstart' in window,
    isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  }
}

function getLocationInfo() {
  if (typeof window === 'undefined') return null
  
  return {
    hostname: window.location.hostname,
    pathname: window.location.pathname,
    search: window.location.search,
    referrer: document.referrer,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
  }
}

// Performance tracking utilities
export const PerformanceTracker = {
  measureLoadTime: (callback: (loadTime: number) => void) => {
    if (typeof window !== 'undefined' && 'performance' in window) {
      window.addEventListener('load', () => {
        const loadTime = performance.now()
        callback(loadTime)
      })
    }
  },

  measureARInitTime: (startTime: number, callback: (initTime: number) => void) => {
    const initTime = performance.now() - startTime
    callback(initTime)
  },

  measureTargetRecognitionTime: (startTime: number, callback: (recognitionTime: number) => void) => {
    const recognitionTime = performance.now() - startTime
    callback(recognitionTime)
  }
}
