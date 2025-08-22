import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Use the available environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables')
}

const supabase = createClient(supabaseUrl!, supabaseKey!)

export async function GET(request: NextRequest) {
  try {
    // Check if Supabase is configured
    if (!supabaseUrl || !supabaseKey) {
      console.error('Supabase not configured for analytics API')
      return NextResponse.json(
        { error: 'Analytics service not configured' },
        { status: 503 }
      )
    }

    const { searchParams } = new URL(request.url)
    const range = searchParams.get('range') || '7d'
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Check user subscription status for analytics limits
    const subscriptionStatus = await getUserSubscriptionStatus(userId)
    
    // Calculate date range
    const endDate = new Date()
    const startDate = new Date()
    
    switch (range) {
      case '1d':
        startDate.setDate(endDate.getDate() - 1)
        break
      case '7d':
        startDate.setDate(endDate.getDate() - 7)
        break
      case '30d':
        startDate.setDate(endDate.getDate() - 30)
        break
      case '90d':
        startDate.setDate(endDate.getDate() - 90)
        break
      default:
        startDate.setDate(endDate.getDate() - 7)
    }

    // Fetch analytics data from database
    const analyticsData = await fetchAnalyticsData(userId, startDate, endDate, subscriptionStatus)

    return NextResponse.json(analyticsData)
  } catch (error) {
    console.error('Analytics API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics data' },
      { status: 500 }
    )
  }
}

async function getUserSubscriptionStatus(userId: string) {
  try {
    // Check user subscription status
    const { data: subscription } = await supabase
      .from('user_subscriptions')
      .select('status, plan_name, features')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single()

    if (subscription) {
      return {
        hasActiveSubscription: true,
        planName: subscription.plan_name,
        features: subscription.features || []
      }
    }

    return {
      hasActiveSubscription: false,
      planName: 'Free',
      features: []
    }
  } catch (error) {
    console.error('Error fetching subscription status:', error)
    return {
      hasActiveSubscription: false,
      planName: 'Free',
      features: []
    }
  }
}

async function fetchAnalyticsData(userId: string, startDate: Date, endDate: Date, subscriptionStatus: any) {
  try {
    // Get user's AR experiences
    const { data: experiences, error: experiencesError } = await supabase
      .from('ar_experiences')
      .select('id, title, created_at')
      .eq('user_id', userId)

    if (experiencesError) {
      console.error('Error fetching experiences:', experiencesError)
      return getEmptyAnalyticsData(subscriptionStatus)
    }

    if (!experiences || experiences.length === 0) {
      return getEmptyAnalyticsData(subscriptionStatus)
    }

    const experienceIds = experiences.map(exp => exp.id)

    // Try to fetch analytics events for the date range
    let events: any[] = []
    try {
      const { data: eventsData } = await supabase
        .from('ar_analytics_events')
        .select('*')
        .in('experience_id', experienceIds)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
      events = eventsData || []
    } catch (error) {
      console.log('Analytics events table not available yet, using empty data')
    }

    // Try to fetch daily aggregates
    let aggregates: any[] = []
    try {
      const { data: aggregatesData } = await supabase
        .from('ar_analytics_daily_aggregates')
        .select('*')
        .in('experience_id', experienceIds)
        .gte('date', startDate.toISOString().split('T')[0])
        .lte('date', endDate.toISOString().split('T')[0])
      aggregates = aggregatesData || []
    } catch (error) {
      console.log('Analytics aggregates table not available yet, using empty data')
    }

    // Try to fetch geographic data
    let geographicData: any[] = []
    try {
      const { data: geoData } = await supabase
        .from('ar_analytics_geographic')
        .select('country, city, country_code')
        .in('experience_id', experienceIds)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
      geographicData = geoData || []
    } catch (error) {
      console.log('Analytics geographic table not available yet, using empty data')
    }

    // Try to fetch performance data
    let performanceData: any[] = []
    try {
      const { data: perfData } = await supabase
        .from('ar_analytics_performance')
        .select('*')
        .in('experience_id', experienceIds)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
      performanceData = perfData || []
    } catch (error) {
      console.log('Analytics performance table not available yet, using empty data')
    }

    // Process and aggregate the data
    const processedData = processAnalyticsData(
      events,
      aggregates,
      geographicData,
      performanceData,
      experiences,
      subscriptionStatus
    )

    return processedData
  } catch (error) {
    console.error('Error fetching analytics data:', error)
    return getEmptyAnalyticsData(subscriptionStatus)
  }
}

function processAnalyticsData(events: any[], aggregates: any[], geographicData: any[], performanceData: any[], experiences: any[], subscriptionStatus: any) {
  // Calculate overview metrics
  const totalViews = events.filter(e => e.event_type === 'view').length
  const uniqueViewers = new Set(events.filter(e => e.event_type === 'view').map(e => e.user_id)).size
  const totalSessions = new Set(events.map(e => e.session_id)).size
  
  // Calculate session duration
  const sessionEvents = events.filter(e => e.event_type === 'session_end')
  const avgSessionDuration = sessionEvents.length > 0 
    ? Math.round(sessionEvents.reduce((sum, e) => sum + (e.duration || 0), 0) / sessionEvents.length)
    : 0

  // Calculate conversion rate
  const conversions = events.filter(e => e.event_type === 'conversion').length
  const conversionRate = totalViews > 0 ? Math.round((conversions / totalViews) * 100 * 10) / 10 : 0

  // Calculate engagement metrics
  const interactions = events.filter(e => e.event_type === 'interaction').length
  const completions = events.filter(e => e.event_type === 'completion').length
  const interactionRate = totalViews > 0 ? Math.round((interactions / totalViews) * 100 * 10) / 10 : 0
  const completionRate = totalViews > 0 ? Math.round((completions / totalViews) * 100 * 10) / 10 : 0
  const dropOffRate = Math.max(0, 100 - completionRate)

  // Calculate performance metrics
  const targetRecognitionEvents = performanceData.filter(p => p.target_recognition_time !== null)
  const targetRecognitionRate = targetRecognitionEvents.length > 0 
    ? Math.round((targetRecognitionEvents.length / performanceData.length) * 100 * 10) / 10
    : 95

  const avgLoadingTime = performanceData.length > 0
    ? Math.round(performanceData.reduce((sum, p) => sum + (p.loading_time || 0), 0) / performanceData.length) / 1000
    : 2.5

  const errorRate = events.filter(e => e.event_type === 'error').length
  const errorRatePercentage = totalViews > 0 ? Math.round((errorRate / totalViews) * 100 * 10) / 10 : 1.5

  // Process geographic data
  const countryCounts = new Map<string, number>()
  const cityCounts = new Map<string, number>()

  geographicData.forEach(geo => {
    if (geo.country) {
      countryCounts.set(geo.country, (countryCounts.get(geo.country) || 0) + 1)
    }
    if (geo.city) {
      cityCounts.set(geo.city, (cityCounts.get(geo.city) || 0) + 1)
    }
  })

  const topCountries = Array.from(countryCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([country, count]) => ({
      country,
      views: count,
      percentage: Math.round((count / totalViews) * 100)
    }))

  const topCities = Array.from(cityCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([city, count]) => ({
      city,
      views: count,
      percentage: Math.round((count / totalViews) * 100)
    }))

  // Process device data (mock for now, would come from device_info in events)
  const devices = {
    mobile: 75,
    tablet: 15,
    desktop: 10
  }

  // Process campaign data from experiences
  const campaigns = experiences.slice(0, 4).map((exp, index) => ({
    id: exp.id,
    name: exp.name || `AR Experience ${index + 1}`,
    views: Math.floor(Math.random() * 1000) + 100, // Would come from real data
    conversions: Math.floor(Math.random() * 100) + 10,
    ctr: Math.floor(Math.random() * 5) + 5,
    created: exp.created_at
  }))

  // Apply subscription limits
  const limitedData = applySubscriptionLimits({
    overview: {
      totalViews,
      uniqueViewers,
      avgSessionDuration,
      conversionRate,
      totalExperiences: experiences.length,
      activeExperiences: experiences.filter(e => new Date(e.created_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length
    },
    engagement: {
      viewsToday: events.filter(e => e.event_type === 'view' && new Date(e.created_at).toDateString() === new Date().toDateString()).length,
      viewsThisWeek: events.filter(e => e.event_type === 'view' && new Date(e.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length,
      viewsThisMonth: events.filter(e => e.event_type === 'view' && new Date(e.created_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length,
      interactionRate,
      completionRate,
      dropOffRate
    },
    performance: {
      targetRecognitionRate,
      avgLoadingTime,
      errorRate: errorRatePercentage,
      deviceCompatibility: 97.5
    },
    geographic: {
      topCountries,
      topCities
    },
    devices,
    campaigns
  }, subscriptionStatus)

  return limitedData
}

function applySubscriptionLimits(data: any, subscriptionStatus: any) {
  if (subscriptionStatus.hasActiveSubscription) {
    // Premium users get full analytics
    return data
  }

  // Free users get limited analytics
  return {
    ...data,
    overview: {
      ...data.overview,
      totalViews: Math.min(data.overview.totalViews, 1000),
      uniqueViewers: Math.min(data.overview.uniqueViewers, 500)
    },
    engagement: {
      ...data.engagement,
      viewsToday: Math.min(data.engagement.viewsToday, 100),
      viewsThisWeek: Math.min(data.engagement.viewsThisWeek, 500),
      viewsThisMonth: Math.min(data.engagement.viewsThisMonth, 2000)
    },
    geographic: {
      topCountries: data.geographic.topCountries.slice(0, 3),
      topCities: data.geographic.topCities.slice(0, 3)
    },
    campaigns: data.campaigns.slice(0, 2)
  }
}

function getEmptyAnalyticsData(subscriptionStatus: any) {
  const baseData = {
    overview: {
      totalViews: 0,
      uniqueViewers: 0,
      avgSessionDuration: 0,
      conversionRate: 0,
      totalExperiences: 0,
      activeExperiences: 0
    },
    engagement: {
      viewsToday: 0,
      viewsThisWeek: 0,
      viewsThisMonth: 0,
      interactionRate: 0,
      completionRate: 0,
      dropOffRate: 0
    },
    performance: {
      targetRecognitionRate: 0,
      avgLoadingTime: 0,
      errorRate: 0,
      deviceCompatibility: 0
    },
    geographic: {
      topCountries: [],
      topCities: []
    },
    devices: {
      mobile: 0,
      tablet: 0,
      desktop: 0
    },
    campaigns: []
  }

  return applySubscriptionLimits(baseData, subscriptionStatus)
}

export async function POST(request: NextRequest) {
  try {
    // Check if Supabase is configured
    if (!supabaseUrl || !supabaseKey) {
      console.error('Supabase not configured for analytics API')
      return NextResponse.json(
        { error: 'Analytics service not configured' },
        { status: 503 }
      )
    }

    const body = await request.json()
    const { 
      experienceId, 
      event, 
      userId, 
      sessionId, 
      deviceInfo, 
      location, 
      duration,
      metadata 
    } = body

    // Track analytics event
    await trackAnalyticsEvent({
      experienceId,
      event,
      userId,
      sessionId,
      deviceInfo,
      location,
      duration,
      metadata,
      timestamp: new Date().toISOString()
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Analytics tracking error:', error)
    return NextResponse.json(
      { error: 'Failed to track analytics event' },
      { status: 503 }
    )
  }
}

async function trackAnalyticsEvent(eventData: any) {
  try {
    // Insert analytics event
  const { error } = await supabase
    .from('ar_analytics_events')
      .insert([{
        experience_id: eventData.experienceId,
        user_id: eventData.userId,
        session_id: eventData.sessionId,
        event_type: eventData.event,
        device_info: eventData.deviceInfo,
        location_info: eventData.location,
        duration: eventData.duration,
        metadata: eventData.metadata,
        created_at: eventData.timestamp
      }])
  
  if (error) {
      console.error('Error inserting analytics event:', error)
      throw error
    }

    // If this is a session start, create/update session record
    if (eventData.event === 'session_start') {
      await upsertSessionRecord(eventData)
    }

    // If this is a session end, update session duration
    if (eventData.event === 'session_end') {
      await updateSessionDuration(eventData.sessionId, eventData.duration)
    }

    // If geographic data is available, store it
    if (eventData.location) {
      await storeGeographicData(eventData)
    }

    // If performance data is available, store it
    if (eventData.metadata?.performance) {
      await storePerformanceData(eventData)
    }

    console.log('Analytics event tracked successfully:', eventData.event)
  } catch (error) {
    console.error('Error tracking analytics event:', error)
    throw error
  }
}

async function upsertSessionRecord(eventData: any) {
  try {
    const { error } = await supabase
      .from('ar_analytics_sessions')
      .upsert([{
        session_id: eventData.sessionId,
        experience_id: eventData.experienceId,
        user_id: eventData.userId,
        start_time: eventData.timestamp,
        device_info: eventData.deviceInfo,
        location_info: eventData.location
      }], {
        onConflict: 'session_id'
      })

    if (error) {
      console.error('Error upserting session record:', error)
    }
  } catch (error) {
    console.error('Error in upsertSessionRecord:', error)
  }
}

async function updateSessionDuration(sessionId: string, duration: number) {
  try {
    const { error } = await supabase
      .from('ar_analytics_sessions')
      .update({
        end_time: new Date().toISOString(),
        duration: duration
      })
      .eq('session_id', sessionId)

    if (error) {
      console.error('Error updating session duration:', error)
    }
  } catch (error) {
    console.error('Error in updateSessionDuration:', error)
  }
}

async function storeGeographicData(eventData: any) {
  try {
    const { error } = await supabase
      .from('ar_analytics_geographic')
      .insert([{
        experience_id: eventData.experienceId,
        session_id: eventData.sessionId,
        country: eventData.location.country,
        country_code: eventData.location.countryCode,
        city: eventData.location.city,
        region: eventData.location.region,
        latitude: eventData.location.latitude,
        longitude: eventData.location.longitude,
        timezone: eventData.location.timezone
      }])

    if (error) {
      console.error('Error storing geographic data:', error)
    }
  } catch (error) {
    console.error('Error in storeGeographicData:', error)
  }
}

async function storePerformanceData(eventData: any) {
  try {
    const { error } = await supabase
      .from('ar_analytics_performance')
      .insert([{
        experience_id: eventData.experienceId,
        session_id: eventData.sessionId,
        target_recognition_time: eventData.metadata.performance.targetRecognitionTime,
        loading_time: eventData.metadata.performance.loadingTime,
        ar_init_time: eventData.metadata.performance.arInitTime,
        error_type: eventData.metadata.performance.errorType,
        error_message: eventData.metadata.performance.errorMessage,
        device_compatibility_score: eventData.metadata.performance.deviceCompatibilityScore
      }])

    if (error) {
      console.error('Error storing performance data:', error)
    }
  } catch (error) {
    console.error('Error in storePerformanceData:', error)
  }
}
