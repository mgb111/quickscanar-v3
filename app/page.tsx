'use client'

import { useAuth } from '@/components/AuthProvider'
import { isSupabaseConfigured } from '@/lib/supabase'
import Link from 'next/link'
import { Camera, Video, Upload, ArrowRight, AlertTriangle, CheckCircle, XCircle, Play, Star, Users, TrendingUp, Target, Zap } from 'lucide-react'

export default function Home() {
  const { user, loading, supabaseError } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-dark-blue"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cream">
      {/* Supabase Status */}
      {!isSupabaseConfigured() && (
        <div className="bg-white border-l-4 border-dark-blue p-4 shadow-sm">
          <div className="flex">
            <AlertTriangle className="h-5 w-5 text-dark-blue" />
            <div className="ml-3">
              <p className="text-sm text-black">
                <strong>Demo Mode:</strong> Supabase is not configured. Running in demo mode without authentication.
              </p>
            </div>
          </div>
        </div>
      )}

      {isSupabaseConfigured() && supabaseError && (
        <div className="bg-white border-l-4 border-dark-blue p-4 shadow-sm">
          <div className="flex">
            <XCircle className="h-5 w-5 text-dark-blue" />
            <div className="ml-3">
              <p className="text-sm text-black">
                <strong>Connection Error:</strong> {supabaseError}
              </p>
              <p className="text-xs text-gray-600 mt-1">
                Please check your Supabase configuration or try again later.
              </p>
            </div>
          </div>
        </div>
      )}

      {isSupabaseConfigured() && !supabaseError && (
        <div className="bg-white border-l-4 border-dark-blue p-4 shadow-sm">
          <div className="flex">
            <CheckCircle className="h-5 w-5 text-dark-blue" />
            <div className="ml-3">
              <p className="text-sm text-black">
                <strong>Connected:</strong> Supabase is working properly.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="bg-dark-blue shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Camera className="h-8 w-8 text-white" />
              <span className="ml-2 text-xl font-bold text-white">QuickScanAR</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/compiler"
                className="bg-white text-dark-blue px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-100 flex items-center"
              >
                <Upload className="h-4 w-4 mr-2" />
                Convert Images to AR
              </Link>
              {isSupabaseConfigured() && !supabaseError ? (
                user ? (
                  <>
                    <Link
                      href="/dashboard"
                      className="bg-white text-dark-blue px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-100"
                    >
                      Dashboard
                    </Link>
                    <Link
                      href="/auth/signout"
                      className="text-white hover:text-gray-200 px-3 py-2 rounded-md text-sm font-medium"
                    >
                      Sign Out
                    </Link>
                  </>
                ) : (
                  <>
                    <Link
                      href="/auth/signin"
                      className="text-white hover:text-gray-200 px-3 py-2 rounded-md text-sm font-medium"
                    >
                      Sign In
                    </Link>
                    <Link
                      href="/auth/signup"
                      className="text-white hover:text-gray-200 px-3 py-2 rounded-md text-sm font-medium"
                    >
                      Sign Up
                    </Link>
                  </>
                )
              ) : (
                <Link
                  href="/compiler"
                  className="bg-white text-dark-blue px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-100"
                >
                  Try Demo
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section - Exactly like Major Beam */}
      <div className="relative overflow-hidden bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Column - Content */}
            <div>
              <h1 className="text-5xl lg:text-6xl font-bold text-black leading-tight mb-6">
                Transform Your
                <span className="block text-dark-blue">Marketing with AR</span>
              </h1>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Create immersive augmented reality experiences that drive engagement, boost brand awareness, and deliver measurable ROI through experiential marketing.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/compiler"
                  className="bg-dark-blue text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-red-800 transition-colors flex items-center justify-center"
                >
                  Start Creating AR
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
                <button className="border-2 border-dark-blue text-dark-blue px-8 py-4 rounded-lg text-lg font-semibold hover:bg-dark-blue hover:text-white transition-colors flex items-center justify-center">
                  <Play className="mr-2 h-5 w-5" />
                  Watch Demo
                </button>
              </div>
            </div>
            
            {/* Right Column - Hero Image/Video */}
            <div className="relative">
              <div className="bg-gradient-to-br from-dark-blue to-red-800 rounded-2xl p-8 text-white text-center">
                <Camera className="h-24 w-24 mx-auto mb-6 text-white" />
                <h3 className="text-2xl font-bold mb-4">AR Experience Preview</h3>
                <p className="text-lg opacity-90">See how your content comes to life</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Social Proof Section */}
      <div className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-lg text-gray-600 mb-4">Trusted by leading brands worldwide</p>
            <div className="flex justify-center items-center space-x-8 opacity-60">
              <div className="text-2xl font-bold text-gray-400">BRAND</div>
              <div className="text-2xl font-bold text-gray-400">BRAND</div>
              <div className="text-2xl font-bold text-gray-400">BRAND</div>
              <div className="text-2xl font-bold text-gray-400">BRAND</div>
            </div>
          </div>
        </div>
      </div>

      {/* ROI & Business Impact Section */}
      <div className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-black mb-6">
              Proven ROI Through Experiential Marketing
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              AR experiences don't just engage—they convert. See how leading brands are achieving measurable business results.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            <div className="text-center">
              <div className="bg-dark-blue rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                <TrendingUp className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-black mb-4">300% Increase</h3>
              <p className="text-gray-600">in customer engagement with AR experiences</p>
            </div>
            
            <div className="text-center">
              <div className="bg-dark-blue rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                <Target className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-black mb-4">45% Higher</h3>
              <p className="text-gray-600">conversion rates compared to traditional marketing</p>
            </div>
            
            <div className="text-center">
              <div className="bg-dark-blue rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                <Users className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-black mb-4">2.5x Longer</h3>
              <p className="text-gray-600">time spent with AR content vs. static media</p>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-black mb-6">
              Create AR Experiences in Minutes
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our platform makes it simple to create, deploy, and measure AR marketing campaigns that drive real business results.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-2xl p-8 shadow-sm">
              <div className="bg-dark-blue rounded-full w-16 h-16 flex items-center justify-center mb-6">
                <span className="text-2xl font-bold text-white">1</span>
              </div>
              <h3 className="text-xl font-bold text-black mb-4">Upload & Convert</h3>
              <p className="text-gray-600 mb-6">
                Upload your images and convert them to AR-ready targets using our advanced MindAR compiler.
              </p>
              <Link
                href="/compiler"
                className="text-dark-blue font-semibold hover:text-red-800 transition-colors"
              >
                Start Converting →
              </Link>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-sm">
              <div className="bg-dark-blue rounded-full w-16 h-16 flex items-center justify-center mb-6">
                <span className="text-2xl font-bold text-white">2</span>
              </div>
              <h3 className="text-xl font-bold text-black mb-4">Create Experience</h3>
              <p className="text-gray-600 mb-6">
                Build immersive AR experiences by combining your converted targets with videos and interactive content.
              </p>
              <Link
                href="/dashboard/create"
                className="text-dark-blue font-semibold hover:text-red-800 transition-colors"
              >
                Create Experience →
              </Link>
            </div>

            <div className="bg-white rounded-2xl p-8 shadow-sm">
              <div className="bg-dark-blue rounded-full w-16 h-16 flex items-center justify-center mb-6">
                <span className="text-2xl font-bold text-white">3</span>
              </div>
              <h3 className="text-xl font-bold text-black mb-4">Deploy & Measure</h3>
              <p className="text-gray-600 mb-6">
                Share your AR experience instantly and track engagement metrics to measure your marketing ROI.
              </p>
              <Link
                href="/dashboard"
                className="text-dark-blue font-semibold hover:text-red-800 transition-colors"
              >
                View Dashboard →
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Use Cases Section */}
      <div className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-black mb-6">
              AR Marketing Use Cases
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              From product launches to trade shows, discover how AR is revolutionizing marketing across industries.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-gray-50 rounded-xl p-6 text-center">
              <div className="bg-dark-blue rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                <Camera className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-semibold text-black mb-2">Product Launches</h3>
              <p className="text-sm text-gray-600">Create buzz with interactive product demos</p>
            </div>

            <div className="bg-gray-50 rounded-xl p-6 text-center">
              <div className="bg-dark-blue rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                <Users className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-semibold text-black mb-2">Trade Shows</h3>
              <p className="text-sm text-gray-600">Stand out with immersive booth experiences</p>
            </div>

            <div className="bg-gray-50 rounded-xl p-6 text-center">
              <div className="bg-dark-blue rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                <Target className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-semibold text-black mb-2">Retail Marketing</h3>
              <p className="text-sm text-gray-600">Drive in-store traffic and sales</p>
            </div>

            <div className="bg-gray-50 rounded-xl p-6 text-center">
              <div className="bg-dark-blue rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-semibold text-black mb-2">Social Media</h3>
              <p className="text-sm text-gray-600">Viral content that drives engagement</p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-20 bg-dark-blue">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Transform Your Marketing?
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Join leading brands using AR to create unforgettable customer experiences and drive measurable business results.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/compiler"
              className="bg-white text-dark-blue px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-colors"
            >
              Start Creating AR
            </Link>
            <Link
              href="/auth/signup"
              className="border-2 border-white text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-white hover:text-dark-blue transition-colors"
            >
              Get Started Free
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-black text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <Camera className="h-8 w-8 text-dark-blue" />
                <span className="ml-2 text-xl font-bold">QuickScanAR</span>
              </div>
              <p className="text-gray-400">
                Transform your marketing with immersive AR experiences that drive engagement and ROI.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/compiler" className="hover:text-white transition-colors">AR Compiler</Link></li>
                <li><Link href="/dashboard" className="hover:text-white transition-colors">Dashboard</Link></li>
                <li><Link href="/debug" className="hover:text-white transition-colors">Debug Tools</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Support</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Connect</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Twitter</a></li>
                <li><a href="#" className="hover:text-white transition-colors">LinkedIn</a></li>
                <li><a href="#" className="hover:text-white transition-colors">GitHub</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 QuickScanAR. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
} 
