'use client'

import { useEffect, useRef } from 'react'

interface AnalyticsTrackerProps {
  experienceId: string
  userId?: string
  sessionId: string
  onEventTracked?: (event: string, data: any) => void
}

interface DeviceInfo {
  userAgent: string
  platform: string
  language: string
  screenWidth: number
  screenHeight: number
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
}

interface LocationInfo {
  country?: string
  countryCode?: string
  city?: string
  region?: string
  latitude?: number
  longitude?: number
  timezone?: string
}

interface PerformanceMetrics {
  targetRecognitionTime?: number
  loadingTime?: number
  arInitTime?: number
  errorType?: string
  errorMessage?: string
  deviceCompatibilityScore?: number
}

export default function AnalyticsTracker({ 
  experienceId, 
  userId, 
  sessionId, 
  onEventTracked 
}: AnalyticsTrackerProps) {
  const sessionStartTime = useRef<number>(Date.now())
  const hasTrackedSessionStart = useRef<boolean>(false)
  const hasTrackedSessionEnd = useRef<boolean>(false)

  useEffect(() => {
    // Track session start
    if (!hasTrackedSessionStart.current) {
      trackEvent('session_start', {
        sessionId,
        experienceId,
        userId,
        timestamp: new Date().toISOString()
      })
      hasTrackedSessionStart.current = true
    }

    // Track page view
    trackEvent('view', {
      sessionId,
      experienceId,
      userId,
      timestamp: new Date().toISOString()
    })

    // Track performance metrics
    trackPerformanceMetrics()

    // Cleanup function to track session end
    return () => {
      if (!hasTrackedSessionEnd.current) {
        const sessionDuration = Date.now() - sessionStartTime.current
        trackEvent('session_end', {
          sessionId,
          experienceId,
          userId,
          duration: Math.round(sessionDuration / 1000), // Convert to seconds
          timestamp: new Date().toISOString()
        })
        hasTrackedSessionEnd.current = true
      }
    }
  }, [experienceId, userId, sessionId])

  const getDeviceInfo = (): DeviceInfo => {
    const userAgent = navigator.userAgent
    const platform = navigator.platform
    const language = navigator.language
    const screenWidth = window.screen.width
    const screenHeight = window.screen.height

    // Detect device type
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)
    const isTablet = /iPad|Android(?=.*\bMobile\b)(?=.*\bSafari\b)/i.test(userAgent)
    const isDesktop = !isMobile && !isTablet

    return {
      userAgent,
      platform,
      language,
      screenWidth,
      screenHeight,
      isMobile,
      isTablet,
      isDesktop
    }
  }

  const getLocationInfo = async (): Promise<LocationInfo> => {
    try {
      // Try to get location from IP (you can use a service like ipapi.co)
      const response = await fetch('https://ipapi.co/json/')
      const data = await response.json()
      
      return {
        country: data.country_name,
        countryCode: data.country_code,
        city: data.city,
        region: data.region,
        latitude: data.latitude,
        longitude: data.longitude,
        timezone: data.timezone
      }
    } catch (error) {
      console.log('Could not fetch location data:', error)
      return {}
    }
  }

  const trackPerformanceMetrics = async () => {
    try {
      // Measure AR initialization time (mock for now)
      const arInitTime = Math.random() * 2000 + 500 // 500ms to 2.5s
      
      // Measure loading time
      const loadingTime = performance.now()
      
      // Calculate device compatibility score
      const deviceInfo = getDeviceInfo()
      let deviceCompatibilityScore = 100
      
      if (deviceInfo.isMobile) {
        deviceCompatibilityScore = 95
      } else if (deviceInfo.isTablet) {
        deviceCompatibilityScore = 90
      }

      // Adjust score based on screen size
      if (deviceInfo.screenWidth < 375) {
        deviceCompatibilityScore -= 10
      }

      const performanceData: PerformanceMetrics = {
        arInitTime: Math.round(arInitTime),
        loadingTime: Math.round(loadingTime),
        deviceCompatibilityScore: Math.round(deviceCompatibilityScore)
      }

      trackEvent('performance', {
        sessionId,
        experienceId,
        userId,
        metadata: { performance: performanceData },
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      console.error('Error tracking performance metrics:', error)
    }
  }

  const trackEvent = async (eventType: string, eventData: any) => {
    try {
      const deviceInfo = getDeviceInfo()
      const locationInfo = await getLocationInfo()

      const analyticsEvent = {
        experienceId: eventData.experienceId,
        event: eventType,
        userId: eventData.userId,
        sessionId: eventData.sessionId,
        deviceInfo,
        location: locationInfo,
        duration: eventData.duration,
        metadata: eventData.metadata,
        timestamp: eventData.timestamp
      }

      // Send to analytics API
      const response = await fetch('/api/analytics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(analyticsEvent)
      })

      if (response.ok) {
        console.log(`Analytics event tracked: ${eventType}`)
        onEventTracked?.(eventType, analyticsEvent)
      } else {
        console.error('Failed to track analytics event:', response.statusText)
      }
    } catch (error) {
      console.error('Error tracking analytics event:', error)
    }
  }

  // Expose tracking functions for external use
  useEffect(() => {
    // Make tracking functions available globally for this component
    const tracker = {
      trackInteraction: (interactionType: string, metadata?: any) => {
        trackEvent('interaction', {
          sessionId,
          experienceId,
          userId,
          metadata: { interactionType, ...metadata },
          timestamp: new Date().toISOString()
        })
      },
      
      trackCompletion: (completionRate: number, metadata?: any) => {
        trackEvent('completion', {
          sessionId,
          experienceId,
          userId,
          metadata: { completionRate, ...metadata },
          timestamp: new Date().toISOString()
        })
      },
      
      trackConversion: (conversionType: string, conversionValue?: any) => {
        trackEvent('conversion', {
          sessionId,
          experienceId,
          userId,
          metadata: { conversionType, conversionValue },
          timestamp: new Date().toISOString()
        })
      },
      
      trackError: (errorType: string, errorMessage: string, metadata?: any) => {
        trackEvent('error', {
          sessionId,
          experienceId,
          userId,
          metadata: { errorType, errorMessage, ...metadata },
          timestamp: new Date().toISOString()
        })
      },
      
      trackTargetRecognition: (recognitionTime: number, metadata?: any) => {
        trackEvent('target_recognition', {
          sessionId,
          experienceId,
          userId,
          metadata: { recognitionTime, ...metadata },
          timestamp: new Date().toISOString()
        })
      }
    }

    // Attach to window for external access
    ;(window as any).arAnalyticsTracker = tracker

    return () => {
      delete (window as any).arAnalyticsTracker
    }
  }, [experienceId, userId, sessionId])

  // This component doesn't render anything
  return null
}

// Hook for using analytics tracker in components
export function useAnalyticsTracker(experienceId: string, userId?: string) {
  const sessionId = useRef<string>(`session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`).current

  const trackEvent = (eventType: string, metadata?: any) => {
    if ((window as any).arAnalyticsTracker) {
      switch (eventType) {
        case 'interaction':
          ;(window as any).arAnalyticsTracker.trackInteraction(metadata?.interactionType || 'general', metadata)
          break
        case 'completion':
          ;(window as any).arAnalyticsTracker.trackCompletion(metadata?.completionRate || 100, metadata)
          break
        case 'conversion':
          ;(window as any).arAnalyticsTracker.trackConversion(metadata?.conversionType || 'general', metadata?.conversionValue)
          break
        case 'error':
          ;(window as any).arAnalyticsTracker.trackError(metadata?.errorType || 'unknown', metadata?.errorMessage || 'Unknown error', metadata)
          break
        case 'target_recognition':
          ;(window as any).arAnalyticsTracker.trackTargetRecognition(metadata?.recognitionTime || 0, metadata)
          break
        default:
          console.warn(`Unknown analytics event type: ${eventType}`)
      }
    }
  }

  return {
    sessionId,
    trackEvent,
    trackInteraction: (interactionType: string, metadata?: any) => trackEvent('interaction', { interactionType, ...metadata }),
    trackCompletion: (completionRate: number, metadata?: any) => trackEvent('completion', { completionRate, ...metadata }),
    trackConversion: (conversionType: string, conversionValue?: any) => trackEvent('conversion', { conversionType, conversionValue }),
    trackError: (errorType: string, errorMessage: string, metadata?: any) => trackEvent('error', { errorType, errorMessage, ...metadata }),
    trackTargetRecognition: (recognitionTime: number, metadata?: any) => trackEvent('target_recognition', { recognitionTime, ...metadata })
  }
}

// Example usage:
export function ExampleAnalyticsUsage() {
  const { trackInteraction, trackCompletion } = useAnalyticsTracker('exp_123', 'user_456')

  const handleButtonClick = () => {
    trackInteraction('button_click', { buttonId: 'cta_button', page: 'home' })
  }

  const handleExperienceComplete = () => {
    trackCompletion(85, { totalSteps: 10, completedSteps: 8, timeSpent: 120 })
  }

  return (
    <div>
      <button onClick={handleButtonClick}>Click Me</button>
      <button onClick={handleExperienceComplete}>Complete Experience</button>
    </div>
  )
}
