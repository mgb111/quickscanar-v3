'use client'

import { useEffect, useState } from 'react'
import Script from 'next/script'

export default function DebugPage() {
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
    <>
      <Script 
        src="https://aframe.io/releases/1.5.0/aframe.min.js" 
        onLoad={handleAframeLoad}
        onError={() => updateDebug('❌ Failed to load A-Frame script', 'error')}
      />
      <Script 
        src="https://cdn.jsdelivr.net/npm/mind-ar@1.2.5/dist/mindar-image-aframe.prod.js" 
        onLoad={handleMindarLoad}
        onError={() => updateDebug('❌ Failed to load MindAR script', 'error')}
      />
      
      <div className="min-h-screen bg-black text-white p-6">
        <h1 className="text-3xl font-bold mb-6">MindAR Buffer Error Debug</h1>
        
        <div className="bg-gray-800 p-4 rounded-lg mb-6 max-h-96 overflow-y-auto">
          <strong>Debug Log:</strong><br />
          <div className="text-sm">
            {debugLog.map((log, index) => (
              <div key={index} className="mb-1">
                {log.includes('❌') ? (
                  <span className="text-red-400">{log}</span>
                ) : log.includes('✅') ? (
                  <span className="text-green-400">{log}</span>
                ) : log.includes('⚠️') ? (
                  <span className="text-yellow-400">{log}</span>
                ) : (
                  <span>{log}</span>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-800 p-4 rounded-lg">
            <h3 className="text-xl font-bold mb-2">Test 1: Working Card.mind</h3>
            <p className="text-gray-300 mb-4">This should work without buffer errors:</p>
            <button 
              onClick={testWorkingMind}
              disabled={!scriptsLoaded}
              className={`px-4 py-2 rounded mb-2 ${
                scriptsLoaded 
                  ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                  : 'bg-gray-500 text-gray-300 cursor-not-allowed'
              }`}
            >
              {scriptsLoaded ? 'Test Working MindAR' : 'Loading Scripts...'}
            </button>
            <button 
              onClick={testMindFileFetch}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded"
            >
              Simple Fetch Test
            </button>
          </div>

          <div className="bg-gray-800 p-4 rounded-lg">
            <h3 className="text-xl font-bold mb-2">Test 2: Custom MindAR File</h3>
            <p className="text-gray-300 mb-4">This will test your custom MindAR file and catch buffer errors:</p>
            <button 
              onClick={testCustomMind}
              disabled={!scriptsLoaded}
              className={`px-4 py-2 rounded mb-2 ${
                scriptsLoaded 
                  ? 'bg-green-600 hover:bg-green-700 text-white' 
                  : 'bg-gray-500 text-gray-300 cursor-not-allowed'
              }`}
            >
              {scriptsLoaded ? 'Test Custom MindAR' : 'Loading Scripts...'}
            </button>
            <button 
              onClick={testCustomMindFileFetch}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded"
            >
              Simple Fetch Test
            </button>
          </div>

          <div className="bg-gray-800 p-4 rounded-lg">
            <h3 className="text-xl font-bold mb-2">Test 3: Error Monitoring</h3>
            <p className="text-gray-300 mb-4">Monitor for RangeError, getObject3D, and other MindAR errors:</p>
            <button 
              onClick={startErrorMonitoring}
              className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded"
            >
              Start Error Monitoring
            </button>
          </div>
        </div>

        <div className="mt-6 bg-gray-800 p-4 rounded-lg">
          <h3 className="text-xl font-bold mb-2">Status</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <strong>Scripts Loaded:</strong> {scriptsLoaded ? '✅ Yes' : '❌ No'}
            </div>
            <div>
              <strong>Range Errors Detected:</strong> {rangeErrorDetected ? 'Yes' : 'No'}
            </div>
            <div>
              <strong>Total Errors:</strong> {errorCount}
            </div>
          </div>
        </div>

        <div className="mt-6">
          <a 
            href="/"
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded"
          >
            ← Back to Home
          </a>
        </div>
      </div>
    </>
  )
} 