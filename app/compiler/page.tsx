'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Camera, Upload, ArrowRight, ArrowLeft } from 'lucide-react'

export default function CompilerPage() {
  const [iframeLoaded, setIframeLoaded] = useState(false)

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600">
      {/* Header */}
      <div className="bg-white/10 backdrop-blur-sm border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Link
                href="/dashboard"
                className="mr-4 text-white/80 hover:text-white transition-colors"
              >
                <ArrowLeft className="h-6 w-6" />
              </Link>
              <Camera className="h-8 w-8 text-white" />
              <span className="ml-2 text-xl font-bold text-white">AR Image Compiler</span>
            </div>
            <Link
              href="/dashboard/create"
              className="bg-white/20 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-white/30 transition-colors flex items-center"
            >
              Skip to Create Experience
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="text-center text-white mb-8">
          <h1 className="text-4xl font-bold mb-4 tracking-tight">
            AR Image Compiler
          </h1>
          <p className="text-xl opacity-90 max-w-2xl mx-auto leading-relaxed">
            Convert your images to AR-ready targets with our advanced MindAR compilation engine
          </p>
        </div>

        {/* Instructions */}
        <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 mb-8 text-white">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Upload className="h-5 w-5 mr-2" />
            How to Use:
          </h3>
          <ol className="space-y-2 ml-6">
            <li className="flex items-start">
              <span className="bg-white/20 rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium mr-3 mt-0.5">1</span>
              <span>Upload your image(s) using the interface below</span>
            </li>
            <li className="flex items-start">
              <span className="bg-white/20 rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium mr-3 mt-0.5">2</span>
              <span>Wait for the compilation process to complete</span>
            </li>
            <li className="flex items-start">
              <span className="bg-white/20 rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium mr-3 mt-0.5">3</span>
              <span>Download the generated .mind file</span>
            </li>
            <li className="flex items-start">
              <span className="bg-white/20 rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium mr-3 mt-0.5">4</span>
              <span>Use the .mind file in your AR application</span>
            </li>
          </ol>
        </div>

        {/* Compiler Interface */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden relative">
          {/* Loading State */}
          {!iframeLoaded && (
            <div className="absolute inset-0 bg-gray-50 flex items-center justify-center z-20">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading MindAR compiler...</p>
              </div>
            </div>
          )}
          
          {/* Iframe Overlays */}
          <div className="absolute top-0 left-0 right-0 h-24 bg-white z-10 pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 right-0 h-20 bg-white z-10 pointer-events-none"></div>
          
          {/* MindAR Compiler Iframe */}
          <iframe 
            src="https://hiukim.github.io/mind-ar-js-doc/tools/compile/"
            className="w-full h-[600px] border-0 -mt-24 pt-24 -mb-20 pb-20"
            onLoad={() => setIframeLoaded(true)}
            title="AR Image Compiler"
          />
        </div>

        {/* Next Step */}
        <div className="text-center mt-8">
          <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6 inline-block">
            <h3 className="text-white font-semibold mb-2">Ready to create your AR experience?</h3>
            <p className="text-white/80 text-sm mb-4">
              After converting your images, proceed to create your AR experience with videos and .mind files.
            </p>
            <Link
              href="/dashboard/create"
              className="bg-white text-indigo-600 px-6 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors inline-flex items-center"
            >
              Create AR Experience
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
