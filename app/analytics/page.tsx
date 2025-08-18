'use client'

import { useAuth } from '@/components/AuthProvider'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Eye, 
  Clock, 
  Target, 
  Globe, 
  Smartphone, 
  ArrowUp,
  ArrowDown,
  Activity,
  DollarSign,
  MousePointer,
  MapPin,
  Crown,
  Lock,
  AlertCircle
} from 'lucide-react'
import toast from 'react-hot-toast'

interface AnalyticsData {
  overview: {
    totalViews: number
    uniqueViewers: number
    avgSessionDuration: number
    conversionRate: number
    totalExperiences: number
    activeExperiences: number
  }
  engagement: {
    viewsToday: number
    viewsThisWeek: number
    viewsThisMonth: number
    interactionRate: number
    completionRate: number
    dropOffRate: number
  }
  performance: {
    targetRecognitionRate: number
    avgLoadingTime: number
    errorRate: number
    deviceCompatibility: number
  }
  geographic: {
    topCountries: Array<{country: string, views: number, percentage: number}>
    topCities: Array<city: string, views: number, percentage: number}>
  }
  devices: {
    mobile: number
    tablet: number
    desktop: number
  }
  campaigns: Array<{
    id: string
    name: string
    views: number
    conversions: number
    ctr: number
    created: string
  }>
}

interface SubscriptionStatus {
  hasActiveSubscription: boolean
  planName: string
  features: string[]
}

export default function Analytics() {
  const { user, loading } = useAuth()
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null)
  const [timeRange, setTimeRange] = useState('7d')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchAnalytics()
      fetchSubscriptionStatus()
    }
  }, [user, timeRange])

  const fetchAnalytics = async () => {
    if (!user) return
    
    setIsLoading(true)
    try {
      const response = await fetch(`/api/analytics?range=${timeRange}&userId=${user.id}`)
      if (response.ok) {
        const data = await response.json()
        setAnalyticsData(data)
      } else {
        const error = await response.json()
        console.error('Failed to fetch analytics:', error)
        toast.error('Failed to load analytics data')
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
      toast.error('Failed to load analytics data')
    }
    setIsLoading(false)
  }

  const fetchSubscriptionStatus = async () => {
    if (!user) return
    
    try {
      const response = await fetch(`/api/polar?action=subscription&userId=${user.id}`)
      if (response.ok) {
        const data = await response.json()
        if (data.subscription) {
          setSubscriptionStatus({
            hasActiveSubscription: data.subscription.is_active,
            planName: data.subscription.plan_name || 'Unknown Plan',
            features: data.subscription.features || []
          })
        } else {
          setSubscriptionStatus({
            hasActiveSubscription: false,
            planName: 'Free',
            features: []
          })
        }
      }
    } catch (error) {
      console.error('Failed to fetch subscription status:', error)
      setSubscriptionStatus({
        hasActiveSubscription: false,
        planName: 'Free',
        features: []
      })
    }
  }

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-dark-blue"></div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600 mb-6">Please sign in to view analytics</p>
          <Link href="/auth/signin" className="bg-dark-blue text-white px-6 py-3 rounded-lg font-semibold">
            Sign In
          </Link>
        </div>
      </div>
    )
  }

  const isFreeUser = !subscriptionStatus?.hasActiveSubscription
  const hasData = analyticsData && analyticsData.overview.totalViews > 0

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
              <p className="text-gray-600 mt-1">Track your AR experience performance and engagement</p>
              {subscriptionStatus && (
                <div className="flex items-center mt-2">
                  <Crown className="h-4 w-4 text-yellow-500 mr-2" />
                  <span className="text-sm text-gray-600">
                    {subscriptionStatus.planName} Plan
                  </span>
                </div>
              )}
            </div>
            <div className="flex items-center space-x-4">
              <select 
                value={timeRange} 
                onChange={(e) => setTimeRange(e.target.value)}
                className="border border-gray-300 rounded-lg px-4 py-2 bg-white"
              >
                <option value="1d">Last 24 hours</option>
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
              </select>
              <Link href="/dashboard" className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-200">
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Subscription Upgrade Banner for Free Users */}
        {isFreeUser && (
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg p-6 mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Lock className="h-6 w-6 text-yellow-600 mr-3" />
                <div>
                  <h3 className="text-lg font-semibold text-yellow-800">Upgrade to Premium Analytics</h3>
                  <p className="text-yellow-700">
                    Free users see limited analytics. Upgrade to unlock full insights, unlimited data, and advanced metrics.
                  </p>
                </div>
              </div>
              <Link
                href="/subscription"
                className="bg-yellow-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-yellow-700 transition-colors"
              >
                Upgrade Now
              </Link>
            </div>
          </div>
        )}

        {/* No Data State */}
        {!hasData && (
          <div className="bg-white rounded-lg p-12 text-center mb-8">
            <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Analytics Data Yet</h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              {isFreeUser 
                ? "Start creating AR experiences to see basic analytics. Upgrade to premium for unlimited insights."
                : "Start creating AR experiences to see your analytics data. Track views, engagement, and performance."
              }
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/compiler"
                className="bg-dark-blue text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Create AR Experience
              </Link>
              {isFreeUser && (
                <Link
                  href="/subscription"
                  className="border-2 border-dark-blue text-dark-blue px-6 py-3 rounded-lg font-semibold hover:bg-dark-blue hover:text-white transition-colors"
                >
                  Upgrade for Full Analytics
                </Link>
              )}
            </div>
          </div>
        )}

        {/* Analytics Content */}
        {hasData && (
          <>
            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Eye className="h-8 w-8 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Views</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {analyticsData?.overview.totalViews.toLocaleString()}
                      {isFreeUser && analyticsData?.overview.totalViews > 1000 && (
                        <span className="text-xs text-yellow-600 ml-2">(Limited)</span>
                      )}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg p-6 shadow-sm">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Users className="h-8 w-8 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Unique Viewers</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {analyticsData?.overview.uniqueViewers.toLocaleString()}
                      {isFreeUser && analyticsData?.overview.uniqueViewers > 500 && (
                        <span className="text-xs text-yellow-600 ml-2">(Limited)</span>
                      )}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg p-6 shadow-sm">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Clock className="h-8 w-8 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Avg Session</p>
                    <p className="text-2xl font-bold text-gray-900">{analyticsData?.overview.avgSessionDuration}s</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg p-6 shadow-sm">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <TrendingUp className="h-8 w-8 text-orange-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
                    <p className="text-2xl font-bold text-gray-900">{analyticsData?.overview.conversionRate}%</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Engagement Metrics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Engagement Overview</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Interaction Rate</span>
                    <span className="font-semibold text-green-600">{analyticsData?.engagement.interactionRate}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Completion Rate</span>
                    <span className="font-semibold text-blue-600">{analyticsData?.engagement.completionRate}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Drop-off Rate</span>
                    <span className="font-semibold text-red-600">{analyticsData?.engagement.dropOffRate}%</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Metrics</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Target Recognition</span>
                    <span className="font-semibold text-green-600">{analyticsData?.performance.targetRecognitionRate}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Avg Loading Time</span>
                    <span className="font-semibold text-blue-600">{analyticsData?.performance.avgLoadingTime}s</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Error Rate</span>
                    <span className="font-semibold text-yellow-600">{analyticsData?.performance.errorRate}%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Geographic and Device Analytics */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Globe className="h-5 w-5 mr-2" />
                  Top Countries
                  {isFreeUser && (
                    <span className="text-xs text-yellow-600 ml-2">(Limited)</span>
                  )}
                </h3>
                <div className="space-y-3">
                  {analyticsData?.geographic.topCountries.map((country, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-gray-600">{country.country}</span>
                      <div className="flex items-center">
                        <span className="text-sm text-gray-500 mr-2">{country.percentage}%</span>
                        <span className="font-semibold">{country.views.toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                  {isFreeUser && analyticsData?.geographic.topCountries.length === 3 && (
                    <div className="text-xs text-yellow-600 text-center pt-2">
                      Upgrade to see all countries
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <MapPin className="h-5 w-5 mr-2" />
                  Top Cities
                  {isFreeUser && (
                    <span className="text-xs text-yellow-600 ml-2">(Limited)</span>
                  )}
                </h3>
                <div className="space-y-3">
                  {analyticsData?.geographic.topCities.map((city, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-gray-600">{city.city}</span>
                      <div className="flex items-center">
                        <span className="text-sm text-gray-500 mr-2">{city.percentage}%</span>
                        <span className="font-semibold">{city.views.toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                  {isFreeUser && analyticsData?.geographic.topCities.length === 3 && (
                    <div className="text-xs text-yellow-600 text-center pt-2">
                      Upgrade to see all cities
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Smartphone className="h-5 w-5 mr-2" />
                  Device Breakdown
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Mobile</span>
                    <span className="font-semibold text-blue-600">{analyticsData?.devices.mobile}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Tablet</span>
                    <span className="font-semibold text-green-600">{analyticsData?.devices.tablet}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Desktop</span>
                    <span className="font-semibold text-purple-600">{analyticsData?.devices.desktop}%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Campaign Performance */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                <BarChart3 className="h-5 w-5 mr-2" />
                Campaign Performance
                {isFreeUser && (
                  <span className="text-xs text-yellow-600 ml-2">(Limited)</span>
                )}
              </h3>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-600">Campaign</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-600">Views</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-600">Conversions</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-600">CTR</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-600">Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analyticsData?.campaigns.map((campaign) => (
                      <tr key={campaign.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <Link href={`/analytics/campaign/${campaign.id}`} className="text-blue-600 hover:text-blue-800 font-medium">
                            {campaign.name}
                          </Link>
                        </td>
                        <td className="py-3 px-4">{campaign.views.toLocaleString()}</td>
                        <td className="py-3 px-4">{campaign.conversions}</td>
                        <td className="py-3 px-4">
                          <span className="text-green-600 font-semibold">{campaign.ctr}%</span>
                        </td>
                        <td className="py-3 px-4 text-gray-500">{new Date(campaign.created).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {isFreeUser && analyticsData?.campaigns.length === 2 && (
                  <div className="text-xs text-yellow-600 text-center pt-4">
                    Upgrade to see all campaigns and detailed performance metrics
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* Upgrade CTA for Free Users */}
        {isFreeUser && (
          <div className="bg-gradient-to-r from-dark-blue to-blue-600 rounded-2xl p-8 text-white text-center mt-12">
            <Crown className="h-16 w-16 mx-auto mb-4 text-yellow-300" />
            <h3 className="text-2xl font-bold mb-4">Unlock Premium Analytics</h3>
            <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
              Get unlimited data, advanced insights, real-time metrics, and comprehensive reporting. 
              Perfect for businesses and serious creators.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/subscription"
                className="bg-white text-dark-blue px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
              >
                View Plans & Pricing
              </Link>
              <Link
                href="/compiler"
                className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-dark-blue transition-colors"
              >
                Create More Experiences
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
