'use client'

import { useState } from 'react'
import { Upload, Download, AlertCircle, CheckCircle, Loader2 } from 'lucide-react'

export default function TestCompilerPage() {
  const [isConverting, setIsConverting] = useState(false)
  const [progress, setProgress] = useState(0)
  const [convertedFile, setConvertedFile] = useState<ArrayBuffer | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [logs, setLogs] = useState<string[]>([])

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Reset state
    setError(null)
    setConvertedFile(null)
    setProgress(0)
    setLogs([])

    addLog(`Selected file: ${file.name} (${file.size} bytes)`)

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (JPG, PNG, etc.)')
      addLog('Error: Invalid file type')
      return
    }

    setIsConverting(true)
    addLog('Starting conversion...')

    try {
      // Load the image
      const img = new Image()
      img.onload = async () => {
        try {
          addLog(`Image loaded: ${img.width}x${img.height}`)
          
          // Import the compiler dynamically
          addLog('Loading compiler...')
          const { Compiler } = await import('../compiler/compiler.js')
          addLog('Compiler loaded successfully')
          
          const compiler = new Compiler()
          addLog('Compiler instance created')

          // Convert image to .mind format
          const images = [img]
          addLog('Starting image compilation...')
          
          const dataList = await compiler.compileImageTargets(images, (progress) => {
            setProgress(progress)
            addLog(`Progress: ${progress.toFixed(1)}%`)
          })

          addLog('Image compilation completed')
          addLog(`Generated ${dataList.length} target(s)`)

          // Export as .mind file
          addLog('Exporting to .mind format...')
          const buffer = compiler.exportData()
          addLog(`Export completed: ${buffer.byteLength} bytes`)
          
          setConvertedFile(buffer)
          setIsConverting(false)
          addLog('Conversion successful!')
        } catch (err) {
          console.error('Conversion error:', err)
          addLog(`Error during conversion: ${err}`)
          setError('Failed to convert image. Please try again with a different image.')
          setIsConverting(false)
        }
      }

      img.onerror = () => {
        addLog('Error: Failed to load image')
        setError('Failed to load image. Please try again.')
        setIsConverting(false)
      }

      img.src = URL.createObjectURL(file)
    } catch (err) {
      console.error('File processing error:', err)
      addLog(`Error processing file: ${err}`)
      setError('Failed to process file. Please try again.')
      setIsConverting(false)
    }
  }

  const downloadFile = () => {
    if (!convertedFile) return

    const blob = new Blob([convertedFile])
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'converted.mind'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    addLog('File downloaded')
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Compiler Test Page</h1>
        
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Test Image Conversion</h2>
          
          <input
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
            disabled={isConverting}
          />

          {isConverting && (
            <div className="mt-4">
              <div className="flex items-center mb-2">
                <Loader2 className="h-5 w-5 text-primary-600 mr-2 animate-spin" />
                <span className="text-sm font-medium">Converting...</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-600 mt-1">{progress.toFixed(1)}% complete</p>
            </div>
          )}

          {convertedFile && !isConverting && (
            <div className="mt-4">
              <div className="flex items-center mb-2">
                <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                <span className="text-sm font-medium text-green-600">Conversion Complete!</span>
              </div>
              <button
                onClick={downloadFile}
                className="bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-green-700"
              >
                <Download className="h-4 w-4 inline mr-2" />
                Download .mind File
              </button>
            </div>
          )}

          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-red-400" />
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Logs */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Conversion Logs</h2>
          <div className="bg-gray-100 rounded-lg p-4 h-64 overflow-y-auto">
            {logs.length === 0 ? (
              <p className="text-gray-500 text-sm">No logs yet. Upload an image to see conversion progress.</p>
            ) : (
              <div className="space-y-1">
                {logs.map((log, index) => (
                  <div key={index} className="text-sm font-mono text-gray-700">
                    {log}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 