'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Upload, ArrowLeft, Camera, ArrowRight } from 'lucide-react'
import Header from '@/components/Header'

export default function Compiler() {
  const [iframeLoaded, setIframeLoaded] = useState(false)

  return (
    <div className="min-h-screen bg-cream">
      {/* Header */}
      <Header showSkipToCreate={true} />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div className="text-center text-black mb-8">
          <div className="flex justify-center mb-4">
            <Link 
              href="/dashboard" 
              className="inline-flex items-center text-black hover:text-red-600 text-sm font-medium transition-colors"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Link>
          </div>
          <h1 className="text-4xl font-bold mb-4 tracking-tight">
            AR Image Converter
          </h1>
          <p className="text-xl opacity-80 max-w-2xl mx-auto leading-relaxed">
            Create AR-ready targets with our advanced MindAR conversion engine
          </p>
        </div>

        {/* Instructions */}
        <div className="bg-white border-2 border-black rounded-2xl p-6 mb-8 shadow-lg">
          <h3 className="text-xl font-semibold mb-4 flex items-center text-black">
            <Upload className="h-5 w-5 mr-2 text-red-600" />
            How to Use:
          </h3>
          <ol className="space-y-2 ml-6 text-black">
            <li className="flex items-start">
              <span className="bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium mr-3 mt-0.5">1</span>
              <span>Upload your image(s) using the interface below</span>
            </li>
            <li className="flex items-start">
              <span className="bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium mr-3 mt-0.5">2</span>
              <span>Wait for the conversion process to complete</span>
            </li>
            <li className="flex items-start">
              <span className="bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium mr-3 mt-0.5">3</span>
              <span>Download the generated file</span>
            </li>
            <li className="flex items-start">
              <span className="bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium mr-3 mt-0.5">4</span>
              <span>Use the file in your AR application</span>
            </li>
          </ol>
        </div>

        {/* Important Notice */}
        <div className="bg-red-600 border-2 border-black rounded-2xl p-6 mb-8 shadow-lg">
          <div className="text-center text-white">
            <h3 className="text-xl font-semibold mb-2 flex items-center justify-center">
              <Upload className="h-5 w-5 mr-2" />
              Important Notice
            </h3>
            <p className="text-lg opacity-90">
              <strong>Scroll down</strong> in the converter below to find the upload and convert buttons!
            </p>
            <p className="text-sm opacity-80 mt-2">
              The interface may be partially hidden by our overlays - scroll down to access all features.
            </p>
          </div>
        </div>

        {/* Compiler Interface */}
        <div className="bg-white border-2 border-black rounded-2xl shadow-lg overflow-hidden relative">
          {/* Loading State */}
          {!iframeLoaded && (
            <div className="absolute inset-0 bg-cream flex items-center justify-center z-20">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
                <p className="text-black">Loading image format converter...</p>
              </div>
            </div>
          )}
          
          {/* Iframe Overlays */}
          <div className="absolute top-0 left-0 right-0 h-32 bg-white z-10 pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-white z-10 pointer-events-none"></div>
          <div className="absolute top-0 left-0 bottom-0 w-72 bg-white z-10 pointer-events-none hidden md:block"></div>
          <div className="absolute top-0 right-0 bottom-0 w-0 bg-white z-10 pointer-events-none hidden md:block"></div>
          
          {/* AR Image Converter Iframe */}
          <iframe 
            src="https://hiukim.github.io/mind-ar-js-doc/tools/compile/"
            className="w-full h-[800px] border-0 -mt-32 pt-32 -mb-32 pb-32"
            onLoad={() => setIframeLoaded(true)}
            title="AR Image Converter"
          />
        </div>

        {/* Next Step */}
        <div className="text-center mt-8">
          <div className="bg-white border-2 border-black rounded-xl p-6 inline-block shadow-lg">
            <h3 className="text-black font-semibold mb-2">Ready to create your AR experience?</h3>
            <p className="text-black opacity-80 text-sm mb-4">
              After creating your AR targets, proceed to create your AR experience with videos and files.
            </p>
            <Link
              href="/dashboard/create"
              className="bg-red-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-red-700 transition-colors inline-flex items-center border-2 border-black"
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
