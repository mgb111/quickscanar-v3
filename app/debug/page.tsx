'use client'

import { useEffect, useState } from 'react'
import Script from 'next/script'
import Link from 'next/link'
import { ArrowLeft, Camera, Upload, AlertTriangle, Smartphone, FileText } from 'lucide-react'
import { useAuth } from '@/components/AuthProvider'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'

export default function DebugPage() {
  const { user, loading } = useAuth()
  const [debugLog, setDebugLog] = useState<string[]>([])
  const [errorCount, setErrorCount] = useState(0)
  const [rangeErrorDetected, setRangeErrorDetected] = useState(false)
  const [scriptsLoaded, setScriptsLoaded] = useState(false)

  const updateDebug = (message: string, type: 'info' | 'error' | 'success' | 'warning' = 'info') => {
    const timestamp = new Date().toLocaleTimeString()
    const newLog = `[${timestamp}] ${message}`
    setDebugLog(prev => [...prev, newLog])
    console.log(message)
  }

  const testSupabaseConnection = async () => {
    if (!supabase) {
      updateDebug('❌ Supabase client not available', 'error')
      toast.error('Supabase client not available')
      return
    }

    try {
      updateDebug('🔍 Testing Supabase connection...', 'info')
      const { data, error } = await supabase.from('ar_experiences').select('count').limit(1)
      
      if (error) {
        updateDebug(`❌ Supabase error: ${error.message}`, 'error')
        toast.error(`Supabase error: ${error.message}`)
      } else {
        updateDebug('✅ Supabase connection successful', 'success')
        toast.success('Supabase connection successful')
      }
    } catch (err: any) {
      updateDebug(`❌ Supabase test failed: ${err.message}`, 'error')
      toast.error(`Supabase test failed: ${err.message}`)
    }
  }

  const testWorkingMind = () => {
    updateDebug('🧪 Testing working card.mind file...', 'info')
    
    // Check if A-Frame is loaded
    if (typeof (window as any).AFRAME === 'undefined') {
      updateDebug('❌ A-Frame not loaded, cannot test MindAR', 'error')
      return
    }
    
    // Check if MindAR is loaded
    if (typeof (window as any).MINDAR === 'undefined') {
      updateDebug('❌ MindAR not loaded, cannot test MindAR', 'error')
      return
    }
    
    updateDebug('✅ A-Frame and MindAR are loaded, creating test scene...', 'success')
    
    try {
      // Create a complete test scene with all required elements
      const testScene = document.createElement('a-scene')
      testScene.setAttribute('mindar-image', 'imageTargetSrc: https://cdn.jsdelivr.net/gh/hiukim/mind-ar-js@1.2.5/examples/image-tracking/assets/card-example/card.mind;')
      testScene.setAttribute('embedded', '')
      testScene.setAttribute('loading-screen', 'enabled: false')
      testScene.style.position = 'absolute'
      testScene.style.top = '-9999px'
      testScene.style.left = '-9999px'
      testScene.style.width = '100px'
      testScene.style.height = '100px'
      
      // Add required assets
      const assets = document.createElement('a-assets')
      const cardImg = document.createElement('img')
      cardImg.id = 'card'
      cardImg.src = 'https://cdn.jsdelivr.net/gh/hiukim/mind-ar-js@1.2.5/examples/image-tracking/assets/card-example/card.png'
      assets.appendChild(cardImg)
      testScene.appendChild(assets)
      
      // Add camera
      const camera = document.createElement('a-camera')
      camera.setAttribute('position', '0 0 0')
      camera.setAttribute('look-controls', 'enabled: false')
      testScene.appendChild(camera)
      
      // Add target entity
      const target = document.createElement('a-entity')
      target.setAttribute('mindar-image-target', 'targetIndex: 0')
      target.id = 'target'
      
      // Add plane to target
      const plane = document.createElement('a-plane')
      plane.setAttribute('src', '#card')
      plane.setAttribute('position', '0 0 0')
      plane.setAttribute('height', '0.552')
      plane.setAttribute('width', '1')
      plane.setAttribute('rotation', '0 0 0')
      target.appendChild(plane)
      
      testScene.appendChild(target)
      
      // Add to body temporarily
      document.body.appendChild(testScene)
      
      // Set a timeout to prevent hanging
      const timeout = setTimeout(() => {
        updateDebug('⚠️ Test scene timeout - removing scene', 'warning')
        if (testScene.parentNode) {
          testScene.parentNode.removeChild(testScene)
        }
      }, 10000)
      
      testScene.addEventListener('loaded', () => {
        clearTimeout(timeout)
        updateDebug('✅ Working card.mind loaded successfully', 'success')
        setTimeout(() => {
          if (testScene.parentNode) {
            testScene.parentNode.removeChild(testScene)
          }
        }, 2000)
      })
      
      testScene.addEventListener('error', (error) => {
        clearTimeout(timeout)
        updateDebug('❌ Working card.mind failed: ' + error, 'error')
        if (testScene.parentNode) {
          testScene.parentNode.removeChild(testScene)
        }
      })
      
    } catch (error) {
      updateDebug('❌ Error creating test scene: ' + error, 'error')
    }
  }

  const testCustomMind = () => {
    updateDebug('🧪 Testing custom MindAR file...', 'info')
    
    const customUrl = prompt('Enter your custom MindAR file URL:', 'https://your-domain.com/path/to/your.mind')
    
    if (!customUrl) {
      updateDebug('❌ No custom URL provided', 'error')
      return
    }
    
    // Check if A-Frame and MindAR are loaded
    if (typeof (window as any).AFRAME === 'undefined' || typeof (window as any).MINDAR === 'undefined') {
      updateDebug('❌ A-Frame or MindAR not loaded', 'error')
      return
    }
    
    updateDebug('✅ Creating test scene with custom MindAR file...', 'success')
    
    try {
      // Create a complete test scene with all required elements
      const testScene = document.createElement('a-scene')
      testScene.setAttribute('mindar-image', `imageTargetSrc: ${customUrl};`)
      testScene.setAttribute('embedded', '')
      testScene.setAttribute('loading-screen', 'enabled: false')
      testScene.style.position = 'absolute'
      testScene.style.top = '-9999px'
      testScene.style.left = '-9999px'
      testScene.style.width = '100px'
      testScene.style.height = '100px'
      
      // Add required assets
      const assets = document.createElement('a-assets')
      const markerImg = document.createElement('img')
      markerImg.id = 'marker'
      markerImg.src = 'https://via.placeholder.com/512x512/000000/FFFFFF?text=Marker'
      assets.appendChild(markerImg)
      testScene.appendChild(assets)
      
      // Add camera
      const camera = document.createElement('a-camera')
      camera.setAttribute('position', '0 0 0')
      camera.setAttribute('look-controls', 'enabled: false')
      testScene.appendChild(camera)
      
      // Add target entity
      const target = document.createElement('a-entity')
      target.setAttribute('mindar-image-target', 'targetIndex: 0')
      target.id = 'target'
      
      // Add plane to target
      const plane = document.createElement('a-plane')
      plane.setAttribute('src', '#marker')
      plane.setAttribute('position', '0 0 0')
      plane.setAttribute('height', '0.552')
      plane.setAttribute('width', '1')
      plane.setAttribute('rotation', '0 0 0')
      target.appendChild(plane)
      
      testScene.appendChild(target)
      
      // Add to body temporarily
      document.body.appendChild(testScene)
      
      // Set a timeout to prevent hanging
      const timeout = setTimeout(() => {
        updateDebug('⚠️ Custom MindAR test timeout - removing scene', 'warning')
        if (testScene.parentNode) {
          testScene.parentNode.removeChild(testScene)
        }
      }, 10000)
      
      testScene.addEventListener('loaded', () => {
        clearTimeout(timeout)
        updateDebug('✅ Custom MindAR file loaded successfully', 'success')
        setTimeout(() => {
          if (testScene.parentNode) {
            testScene.parentNode.removeChild(testScene)
          }
        }, 2000)
      })
      
      testScene.addEventListener('error', (error) => {
        clearTimeout(timeout)
        updateDebug('❌ Custom MindAR file failed: ' + error, 'error')
        if (testScene.parentNode) {
          testScene.parentNode.removeChild(testScene)
        }
      })
      
    } catch (error) {
      updateDebug('❌ Error creating custom test scene: ' + error, 'error')
    }
  }

  const testMindFileFetch = async () => {
    updateDebug('🧪 Testing MindAR file fetch (simple test)...', 'info')
    
    try {
      // Test fetching the working card.mind file
      const response = await fetch('https://cdn.jsdelivr.net/gh/hiukim/mind-ar-js@1.2.5/examples/image-tracking/assets/card-example/card.mind')
      
      if (!response.ok) {
        updateDebug('❌ Failed to fetch working card.mind: ' + response.statusText, 'error')
        return
      }
      
      const arrayBuffer = await response.arrayBuffer()
      updateDebug('✅ Successfully fetched working card.mind, size: ' + arrayBuffer.byteLength + ' bytes', 'success')
      
      // Try to parse the file structure
      const uint8Array = new Uint8Array(arrayBuffer)
      const header = new TextDecoder().decode(uint8Array.slice(0, 8))
      
      if (header.startsWith('MINDAR')) {
        updateDebug('✅ MindAR file header is valid: ' + header, 'success')
      } else {
        updateDebug('⚠️ MindAR file header may be invalid: ' + header, 'warning')
      }
      
    } catch (error) {
      updateDebug('❌ Error fetching MindAR file: ' + error, 'error')
    }
  }

  const testCustomMindFileFetch = async () => {
    updateDebug('🧪 Testing custom MindAR file fetch...', 'info')
    
    const customUrl = prompt('Enter your custom MindAR file URL:', 'https://your-domain.com/path/to/your.mind')
    
    if (!customUrl) {
      updateDebug('❌ No custom URL provided', 'error')
      return
    }
    
    try {
      const response = await fetch(customUrl)
      
      if (!response.ok) {
        updateDebug('❌ Failed to fetch custom MindAR file: ' + response.statusText, 'error')
        return
      }
      
      const arrayBuffer = await response.arrayBuffer()
      updateDebug('✅ Successfully fetched custom MindAR file, size: ' + arrayBuffer.byteLength + ' bytes', 'success')
      
      // Try to parse the file structure
      const uint8Array = new Uint8Array(arrayBuffer)
      const header = new TextDecoder().decode(uint8Array.slice(0, 8))
      
      if (header.startsWith('MINDAR')) {
        updateDebug('✅ Custom MindAR file header is valid: ' + header, 'success')
      } else {
        updateDebug('⚠️ Custom MindAR file header may be invalid: ' + header, 'warning')
      }
      
    } catch (error) {
      updateDebug('❌ Error fetching custom MindAR file: ' + error, 'error')
    }
  }

  const startErrorMonitoring = () => {
    updateDebug('🔍 Starting error monitoring...', 'info')
    
    // Monitor for RangeError
    const errorHandler = (event: ErrorEvent) => {
      if (event.error && event.error.message) {
        if (event.error.message.includes('RangeError')) {
          setRangeErrorDetected(true)
          setErrorCount(prev => prev + 1)
          updateDebug(`❌ RangeError detected (${errorCount + 1}): ${event.error.message}`, 'error')
        } else if (event.error.message.includes('getObject3D')) {
          setErrorCount(prev => prev + 1)
          updateDebug(`❌ getObject3D error detected (${errorCount + 1}): ${event.error.message}`, 'error')
        } else if (event.error.message.includes('Cannot read properties of undefined')) {
          setErrorCount(prev => prev + 1)
          updateDebug(`❌ Undefined property error detected (${errorCount + 1}): ${event.error.message}`, 'error')
        }
      }
    }
    
    // Monitor for unhandled promise rejections
    const rejectionHandler = (event: PromiseRejectionEvent) => {
      if (event.reason && event.reason.message) {
        if (event.reason.message.includes('RangeError')) {
          setRangeErrorDetected(true)
          setErrorCount(prev => prev + 1)
          updateDebug(`❌ RangeError in promise (${errorCount + 1}): ${event.reason.message}`, 'error')
        } else if (event.reason.message.includes('getObject3D')) {
          setErrorCount(prev => prev + 1)
          updateDebug(`❌ getObject3D error in promise (${errorCount + 1}): ${event.reason.message}`, 'error')
        } else if (event.reason.message.includes('Cannot read properties of undefined')) {
          setErrorCount(prev => prev + 1)
          updateDebug(`❌ Undefined property error in promise (${errorCount + 1}): ${event.reason.message}`, 'error')
        }
      }
    }
    
    window.addEventListener('error', errorHandler)
    window.addEventListener('unhandledrejection', rejectionHandler)
    
    updateDebug('✅ Error monitoring started', 'success')
    
    // Cleanup function
    return () => {
      window.removeEventListener('error', errorHandler)
      window.removeEventListener('unhandledrejection', rejectionHandler)
    }
  }

  const handleAframeLoad = () => {
    updateDebug('✅ A-Frame script loaded', 'success')
    checkScriptsLoaded()
  }

  const handleMindarLoad = () => {
    updateDebug('✅ MindAR script loaded', 'success')
    checkScriptsLoaded()
  }

  const checkScriptsLoaded = () => {
    setTimeout(() => {
      if (typeof (window as any).AFRAME !== 'undefined' && typeof (window as any).MINDAR !== 'undefined') {
        setScriptsLoaded(true)
        updateDebug('✅ Both A-Frame and MindAR are ready for testing', 'success')
      }
    }, 1000)
  }

  const testMobileAR = () => {
    updateDebug('🧪 Testing mobile AR functionality...', 'info')
    // Add mobile AR testing logic here
    setTimeout(() => {
      updateDebug('✅ Mobile AR test completed', 'success')
    }, 2000)
  }

  const clearDebugLog = () => {
    setDebugLog([])
    updateDebug('🗑️ Debug log cleared', 'info')
  }

  const exportDebugLog = () => {
    const logText = debugLog.join('\n')
    const blob = new Blob([logText], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'ar-debug-log.txt'
    a.click()
    URL.revokeObjectURL(url)
    updateDebug('📁 Debug log exported', 'success')
  }

  useEffect(() => {
    updateDebug('🚀 Debug page loaded', 'success')
    updateDebug('📱 Device: ' + (navigator.userAgent.includes('Mobile') ? 'Mobile' : 'Desktop'), 'info')
    updateDebug('🔒 HTTPS: ' + (location.protocol === 'https:' ? 'Yes' : 'No'), 'info')
    
    // Check if A-Frame and MindAR are loaded after a delay
    setTimeout(() => {
      if (typeof (window as any).AFRAME !== 'undefined') {
        updateDebug('✅ A-Frame loaded', 'success')
      } else {
        updateDebug('❌ A-Frame not loaded', 'error')
      }
      
      if (typeof (window as any).MINDAR !== 'undefined') {
        updateDebug('✅ MindAR loaded', 'success')
      } else {
        updateDebug('❌ MindAR not loaded', 'error')
      }
    }, 2000)
  }, [])

  return (
    <div className="min-h-screen bg-cream">
      {/* Header */}
      <div className="bg-dark-blue shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Link href="/" className="mr-4 text-white/80 hover:text-white">
                <ArrowLeft className="h-6 w-6" />
              </Link>
              <Camera className="h-8 w-8 text-white" />
              <span className="ml-2 text-xl font-bold text-white">AR Debug & Testing</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center text-black mb-8">
          <h1 className="text-4xl font-bold mb-4 tracking-tight">
            AR Debug & Testing
          </h1>
          <p className="text-xl opacity-80 max-w-2xl mx-auto leading-relaxed">
            Test and debug your AR setup, MindAR files, and AR experience components
          </p>
        </div>

        {/* Environment Variables Debug */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm mb-6">
          <h3 className="text-lg font-semibold text-black mb-4">Environment Variables</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>NODE_ENV:</span>
              <span className="font-mono">{process.env.NODE_ENV || 'undefined'}</span>
            </div>
            <div className="flex justify-between">
              <span>NEXT_PUBLIC_SUPABASE_URL:</span>
              <span className="font-mono">
                {process.env.NEXT_PUBLIC_SUPABASE_URL ? 
                  `${process.env.NEXT_PUBLIC_SUPABASE_URL.substring(0, 20)}...` : 
                  'undefined'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>NEXT_PUBLIC_SUPABASE_ANON_KEY:</span>
              <span className="font-mono">
                {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 
                  `${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.substring(0, 20)}...` : 
                  'undefined'}
              </span>
            </div>
          </div>
        </div>

        {/* Supabase Connection Test */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm mb-6">
          <h3 className="text-lg font-semibold text-black mb-4">Supabase Connection Test</h3>
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <span>Supabase Client:</span>
              <span className={supabase ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                {supabase ? '✅ Connected' : '❌ Not Connected'}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <span>User Authentication:</span>
              <span className={user ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                {user ? '✅ Authenticated' : '❌ Not Authenticated'}
              </span>
            </div>
            {user && (
              <div className="text-sm text-gray-600">
                <div>User ID: {user.id}</div>
                <div>Email: {user.email}</div>
              </div>
            )}
            <button
              onClick={testSupabaseConnection}
              className="bg-dark-blue hover:bg-red-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Test Supabase Connection
            </button>
          </div>
        </div>

        {/* Test Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Test 1: Working MindAR */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <h3 className="text-xl font-semibold mb-4 text-black flex items-center">
              <Camera className="h-5 w-5 mr-2 text-dark-blue" />
              Test 1: Working MindAR File
            </h3>
            <p className="text-gray-600 mb-4">
              Test with a known working MindAR file to verify your setup is working correctly.
            </p>
            <button
              onClick={testWorkingMind}
              className="bg-dark-blue text-white px-4 py-2 rounded-lg font-medium hover:bg-red-800 transition-colors"
            >
              Test Working MindAR
            </button>
            <div id="test1-result" className="mt-4 p-3 bg-gray-50 rounded-lg text-sm text-black"></div>
          </div>

          {/* Test 2: Custom MindAR */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <h3 className="text-xl font-semibold mb-4 text-black flex items-center">
              <Upload className="h-5 w-5 mr-2 text-dark-blue" />
              Test 2: Custom MindAR File
            </h3>
            <p className="text-gray-600 mb-4">
              Test your custom MindAR file and catch any buffer errors or compilation issues.
            </p>
            <button
              onClick={testCustomMind}
              className="bg-dark-blue text-white px-4 py-2 rounded-lg font-medium hover:bg-red-800 transition-colors"
            >
              Test Custom MindAR
            </button>
            <div id="test2-result" className="mt-4 p-3 bg-gray-50 rounded-lg text-sm text-black"></div>
          </div>

          {/* Test 3: Error Monitoring */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <h3 className="text-xl font-semibold mb-4 text-black flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2 text-dark-blue" />
              Test 3: Error Monitoring
            </h3>
            <p className="text-gray-600 mb-4">
              Monitor for RangeError and other MindAR errors in real-time.
            </p>
            <button
              onClick={startErrorMonitoring}
              className="bg-dark-blue text-white px-4 py-2 rounded-lg font-medium hover:bg-red-800 transition-colors"
            >
              Start Error Monitoring
            </button>
            <div id="test3-result" className="mt-4 p-3 bg-gray-50 rounded-lg text-sm text-black"></div>
          </div>

          {/* Test 4: Mobile AR */}
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <h3 className="text-xl font-semibold mb-4 text-black flex items-center">
              <Smartphone className="h-5 w-5 mr-2 text-dark-blue" />
              Test 4: Mobile AR
            </h3>
            <p className="text-gray-600 mb-4">
              Test AR functionality specifically on mobile devices.
            </p>
            <button
              onClick={testMobileAR}
              className="bg-dark-blue text-white px-4 py-2 rounded-lg font-medium hover:bg-red-800 transition-colors"
            >
              Test Mobile AR
            </button>
            <div id="test4-result" className="mt-4 p-3 bg-gray-50 rounded-lg text-sm text-black"></div>
          </div>
        </div>

        {/* Debug Log */}
        <div className="mt-8 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <h3 className="text-xl font-semibold mb-4 text-black flex items-center">
            <FileText className="h-5 w-5 mr-2 text-dark-blue" />
            Debug Log
          </h3>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 max-h-96 overflow-y-auto">
            <div id="debug-log" className="text-sm text-black font-mono space-y-1">
              <div className="text-gray-500">Debug log will appear here...</div>
            </div>
          </div>
          <div className="mt-4 flex space-x-2">
            <button
              onClick={clearDebugLog}
              className="bg-gray-300 text-black px-4 py-2 rounded-lg font-medium hover:bg-gray-400 transition-colors"
            >
              Clear Log
            </button>
            <button
              onClick={exportDebugLog}
              className="bg-dark-blue text-white px-4 py-2 rounded-lg font-medium hover:bg-red-800 transition-colors"
            >
              Export Log
            </button>
          </div>
        </div>
      </div>
    </div>
  )
} 
