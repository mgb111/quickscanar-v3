'use client'

import { useState, useRef } from 'react'
import { Upload, Download, FileImage, AlertCircle, CheckCircle, Loader2 } from 'lucide-react'
import Link from 'next/link'

export default function ConvertPage() {
  const [isConverting, setIsConverting] = useState(false)
  const [progress, setProgress] = useState(0)
  const [convertedFile, setConvertedFile] = useState<ArrayBuffer | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string>('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Reset state
    setError(null)
    setConvertedFile(null)
    setProgress(0)
    setFileName(file.name.replace(/\.[^/.]+$/, '.mind'))

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (JPG, PNG, etc.)')
      return
    }

    setIsConverting(true)

    try {
      // Load the image
      const img = new Image()
      img.onload = async () => {
        try {
          // Import the compiler dynamically
          const { Compiler } = await import('../compiler/compiler.js')
          const compiler = new Compiler()

          // Convert image to .mind format
          const images = [img]
          const dataList = await compiler.compileImageTargets(images, (progress) => {
            setProgress(progress)
          })

          // Export as .mind file
          const buffer = compiler.exportData()
          setConvertedFile(buffer)
          setIsConverting(false)
        } catch (err) {
          console.error('Conversion error:', err)
          setError('Failed to convert image. Please try again with a different image.')
          setIsConverting(false)
        }
      }

      img.onerror = () => {
        setError('Failed to load image. Please try again.')
        setIsConverting(false)
      }

      img.src = URL.createObjectURL(file)
    } catch (err) {
      console.error('File processing error:', err)
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
    a.download = fileName
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault()
    const files = event.dataTransfer.files
    if (files.length > 0) {
      const file = files[0]
      if (fileInputRef.current) {
        fileInputRef.current.files = files
        handleFileSelect({ target: { files } } as any)
      }
    }
  }

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="flex items-center">
                <FileImage className="h-8 w-8 text-primary-600" />
                <span className="ml-2 text-xl font-bold text-gray-900">QuickScanAR</span>
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/"
                className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                Home
              </Link>
              <Link
                href="/dashboard"
                className="bg-primary-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary-700"
              >
                Dashboard
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Convert Images to .mind Format
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Upload your marker images and convert them to MindAR compatible .mind files for creating AR experiences.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* File Upload Area */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isConverting
                ? 'border-gray-300 bg-gray-50'
                : 'border-primary-300 hover:border-primary-400 bg-primary-50'
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
              disabled={isConverting}
            />

            {!isConverting && !convertedFile && (
              <div>
                <Upload className="mx-auto h-12 w-12 text-primary-600 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Drop your image here or click to browse
                </h3>
                <p className="text-gray-600 mb-4">
                  Supports JPG, PNG, and other image formats
                </p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-primary-600 text-white px-6 py-3 rounded-md font-medium hover:bg-primary-700 transition-colors"
                >
                  Choose Image
                </button>
              </div>
            )}

            {/* Conversion Progress */}
            {isConverting && (
              <div>
                <Loader2 className="mx-auto h-12 w-12 text-primary-600 mb-4 animate-spin" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Converting image...
                </h3>
                <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                  <div
                    className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                <p className="text-gray-600">{progress.toFixed(1)}% complete</p>
              </div>
            )}

            {/* Success State */}
            {convertedFile && !isConverting && (
              <div>
                <CheckCircle className="mx-auto h-12 w-12 text-green-600 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Conversion Complete!
                </h3>
                <p className="text-gray-600 mb-4">
                  Your image has been successfully converted to .mind format.
                </p>
                <button
                  onClick={downloadFile}
                  className="bg-green-600 text-white px-6 py-3 rounded-md font-medium hover:bg-green-700 transition-colors flex items-center mx-auto"
                >
                  <Download className="h-5 w-5 mr-2" />
                  Download .mind File
                </button>
              </div>
            )}
          </div>

          {/* Error Display */}
          {error && (
            <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-red-400" />
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-medium text-blue-900 mb-3">
              How to use your .mind file:
            </h3>
            <ol className="list-decimal list-inside space-y-2 text-blue-800">
              <li>Download the converted .mind file</li>
              <li>Upload it to your MindAR project</li>
              <li>Use it as a marker for your AR experience</li>
              <li>Test the tracking in your AR application</li>
            </ol>
          </div>

          {/* Try Again Button */}
          {convertedFile && (
            <div className="mt-6 text-center">
              <button
                onClick={() => {
                  setConvertedFile(null)
                  setProgress(0)
                  setError(null)
                  if (fileInputRef.current) {
                    fileInputRef.current.value = ''
                  }
                }}
                className="text-primary-600 hover:text-primary-700 font-medium"
              >
                Convert another image
              </button>
            </div>
          )}
        </div>

        {/* Features Section */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="bg-primary-100 rounded-full p-3 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <Upload className="h-8 w-8 text-primary-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Easy Upload</h3>
            <p className="text-gray-600">
              Simply drag and drop or click to upload your marker images.
            </p>
          </div>

          <div className="text-center">
            <div className="bg-primary-100 rounded-full p-3 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <FileImage className="h-8 w-8 text-primary-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Fast Conversion</h3>
            <p className="text-gray-600">
              Advanced algorithms convert your images to MindAR format quickly.
            </p>
          </div>

          <div className="text-center">
            <div className="bg-primary-100 rounded-full p-3 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <Download className="h-8 w-8 text-primary-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Ready to Use</h3>
            <p className="text-gray-600">
              Download your .mind file and use it immediately in your AR projects.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
} 