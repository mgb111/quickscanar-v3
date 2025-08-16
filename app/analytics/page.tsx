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
  MapPin
} from 'lucide-react'

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
    topCities: Array<{city: string, views: number, percentage: number}>
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

export default function Analytics() {
  const { user, loading } = useAuth()
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [timeRange, setTimeRange] = useState('7d')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchAnalytics()
    }
  }, [user, timeRange])

  const fetchAnalytics = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/analytics?range=${timeRange}`)
      if (response.ok) {
        const data = await response.json()
        setAnalyticsData(data)
      } else {
        // Mock data for demonstration
        setAnalyticsData({
          overview: {
            totalViews: 12547,
            uniqueViewers: 8342,
            avgSessionDuration: 142,
            conversionRate: 12.4,
            totalExperiences: 23,
            activeExperiences: 18
          },
          engagement: {
            viewsToday: 324,
            viewsThisWeek: 2156,
            viewsThisMonth: 8934,
            interactionRate: 68.7,
            completionRate: 45.2,
            dropOffRate: 23.8
          },
          performance: {
            targetRecognitionRate: 94.6,
            avgLoadingTime: 2.3,
            errorRate: 1.2,
            deviceCompatibility: 97.8
          },
          geographic: {
            topCountries: [
              { country: 'United States', views: 4523, percentage: 36 },
              { country: 'United Kingdom', views: 2134, percentage: 17 },
              { country: 'Canada', views: 1567, percentage: 12 },
              { country: 'Australia', views: 1234, percentage: 10 },
              { country: 'Germany', views: 987, percentage: 8 }
            ],
            topCities: [
              { city: 'New York', views: 1234, percentage: 15 },
              { city: 'London', views: 987, percentage: 12 },
              { city: 'Toronto', views: 756, percentage: 9 },
              { city: 'Sydney', views: 654, percentage: 8 },
              { city: 'Los Angeles', views: 543, percentage: 7 }
            ]
          },
          devices: {
            mobile: 78.3,
            tablet: 14.2,
            desktop: 7.5
          },
          campaigns: [
            { id: '1', name: 'Product Launch AR', views: 3456, conversions: 234, ctr: 6.8, created: '2024-01-15' },
            { id: '2', name: 'Trade Show Demo', views: 2134, conversions: 156, ctr: 7.3, created: '2024-01-10' },
            { id: '3', name: 'Social Media Campaign', views: 4567, conversions: 345, ctr: 7.6, created: '2024-01-05' },
            { id: '4', name: 'Retail Experience', views: 1987, conversions: 123, ctr: 6.2, created: '2024-01-01' }
          ]
        })
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
    }
    setIsLoading(false)
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
              <p className="text-gray-600 mt-1">Track your AR experience performance and engagement</p>
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
        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Eye className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Views</p>
                <p className="text-2xl font-bold text-gray-900">{analyticsData?.overview.totalViews.toLocaleString()}</p>
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
                <p className="text-2xl font-bold text-gray-900">{analyticsData?.overview.uniqueViewers.toLocaleString()}</p>
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
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <MapPin className="h-5 w-5 mr-2" />
              Top Cities
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
          </div>
        </div>
      </div>
    </div>
  )
}
