'use client'

import { useState, useEffect } from 'react'
import { Activity, Users, Eye } from 'lucide-react'

interface RealTimeData {
  activeUsers: number
  currentSessions: number
  viewsLastHour: number
}

export default function RealTimeMetrics() {
  const [realTimeData, setRealTimeData] = useState<RealTimeData>({
    activeUsers: 0,
    currentSessions: 0,
    viewsLastHour: 0
  })
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    // Simulate real-time data updates
    const interval = setInterval(() => {
      setRealTimeData({
        activeUsers: Math.floor(Math.random() * 50) + 10,
        currentSessions: Math.floor(Math.random() * 30) + 5,
        viewsLastHour: Math.floor(Math.random() * 100) + 20
      })
      setIsConnected(true)
    }, 5000)

    // Initial data
    setRealTimeData({
      activeUsers: Math.floor(Math.random() * 50) + 10,
      currentSessions: Math.floor(Math.random() * 30) + 5,
      viewsLastHour: Math.floor(Math.random() * 100) + 20
    })
    setIsConnected(true)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <Activity className="h-5 w-5 mr-2 text-green-600" />
          Real-Time Metrics
        </h3>
        <div className="flex items-center">
          <div className={`w-3 h-3 rounded-full mr-2 ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className="text-sm text-gray-500">
            {isConnected ? 'Live' : 'Disconnected'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="text-center">
          <div className="flex items-center justify-center mb-2">
            <Users className="h-6 w-6 text-green-600 mr-2" />
            <span className="text-2xl font-bold text-gray-900">{realTimeData.activeUsers}</span>
          </div>
          <p className="text-sm text-gray-600">Active Users</p>
        </div>

        <div className="text-center">
          <div className="flex items-center justify-center mb-2">
            <Activity className="h-6 w-6 text-blue-600 mr-2" />
            <span className="text-2xl font-bold text-gray-900">{realTimeData.currentSessions}</span>
          </div>
          <p className="text-sm text-gray-600">Current Sessions</p>
        </div>

        <div className="text-center">
          <div className="flex items-center justify-center mb-2">
            <Eye className="h-6 w-6 text-purple-600 mr-2" />
            <span className="text-2xl font-bold text-gray-900">{realTimeData.viewsLastHour}</span>
          </div>
          <p className="text-sm text-gray-600">Views (Last Hour)</p>
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-500 text-center">
          Data updates every 5 seconds • Last updated: {new Date().toLocaleTimeString()}
        </p>
      </div>
    </div>
  )
}
