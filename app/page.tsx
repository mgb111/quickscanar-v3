'use client'

import Link from 'next/link'
import { Camera, Upload, ArrowRight, BarChart3, Video, Users, Globe, Smartphone, CheckCircle, Star, ArrowLeft } from 'lucide-react'
import { AuthProvider, useAuth } from '@/components/AuthProvider'
import Header from '@/components/Header'

function HomePage() {
  const { user, loading } = useAuth()

  const isSupabaseConfigured = () => {
    return process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  }

  const supabaseError = false // You can implement actual error checking here

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-dark-blue"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <Header
        showCreateAR={true}
        showDashboard={Boolean(isSupabaseConfigured() && !supabaseError && user)}
        showSignOut={Boolean(isSupabaseConfigured() && !supabaseError && user)}
        showSignIn={Boolean(isSupabaseConfigured() && !supabaseError && !user)}
        showSignUp={Boolean(isSupabaseConfigured() && !supabaseError && !user)}
      />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-50 to-indigo-100 py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
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
                  Create AR
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </div>
            </div>
            <div className="relative">
              <img 
                src="/ar-experience-preview.gif" 
                alt="AR Experience Preview"
                className="w-full h-auto rounded-2xl shadow-2xl"
                style={{ 
                  aspectRatio: '1/1',
                  objectFit: 'cover'
                }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-5xl font-bold text-gray-900 mb-6">
              Everything You Need to Create AR Experiences
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Powerful AR tools designed to capture attention and convert visitors into customers
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-dark-blue rounded-2xl w-20 h-20 flex items-center justify-center mx-auto mb-6">
                <Camera className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">AR Target Compiler</h3>
              <p className="text-gray-600 text-lg">
                Convert any image into AR-ready targets with our advanced MindAR compilation engine
              </p>
            </div>
            <div className="text-center">
              <div className="bg-dark-blue rounded-2xl w-20 h-20 flex items-center justify-center mx-auto mb-6">
                <Video className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Experience Builder</h3>
              <p className="text-gray-600 text-lg">
                Create immersive AR experiences by combining targets with videos and interactive content
              </p>
            </div>
            <div className="text-center">
              <div className="bg-dark-blue rounded-2xl w-20 h-20 flex items-center justify-center mx-auto mb-6">
                <BarChart3 className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Analytics Dashboard</h3>
              <p className="text-gray-600 text-lg">
                Track engagement metrics and measure ROI with detailed performance insights
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Trusted by Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-5xl font-bold text-gray-900 mb-6">
              Trusted by 150+ Creators
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Join the community of creators who are already using AR to boost their marketing results
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-4xl lg:text-5xl font-bold text-dark-blue mb-2">50+</div>
              <p className="text-lg text-gray-600">AR Experiences per month</p>
            </div>
            <div className="text-center">
              <div className="text-4xl lg:text-5xl font-bold text-dark-blue mb-2">10 min</div>
              <p className="text-lg text-gray-600">Average creation time</p>
            </div>
            <div className="text-center">
              <div className="text-4xl lg:text-5xl font-bold text-dark-blue mb-2">300%</div>
              <p className="text-lg text-gray-600">Increase in engagement</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-5xl font-bold text-gray-900 mb-6">
              Loved by Creators Worldwide
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              See what creators are saying about their AR marketing success
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-gray-50 rounded-2xl p-8">
              <div className="flex items-center mb-6">
                <div className="w-16 h-16 bg-dark-blue rounded-full flex items-center justify-center text-white font-bold text-xl">J</div>
                <div className="ml-4">
                  <h4 className="text-xl font-semibold text-gray-900">John Smith</h4>
                  <p className="text-gray-600">Marketing Director</p>
                </div>
              </div>
              <p className="text-gray-600 mb-6 text-lg">
                "QuickScanAR transformed our trade show experience. We saw a 300% increase in booth engagement!"
              </p>
              <div className="flex text-yellow-400">
                <Star className="h-5 w-5 fill-current" />
                <Star className="h-5 w-5 fill-current" />
                <Star className="h-5 w-5 fill-current" />
                <Star className="h-5 w-5 fill-current" />
                <Star className="h-5 w-5 fill-current" />
              </div>
            </div>
            <div className="bg-gray-50 rounded-2xl p-8">
              <div className="flex items-center mb-6">
                <div className="w-16 h-16 bg-dark-blue rounded-full flex items-center justify-center text-white font-bold text-xl">S</div>
                <div className="ml-4">
                  <h4 className="text-xl font-semibold text-gray-900">Sarah Johnson</h4>
                  <p className="text-gray-600">Brand Manager</p>
                </div>
              </div>
              <p className="text-gray-600 mb-6 text-lg">
                "The AR experiences we created drove 45% higher conversion rates than our traditional campaigns."
              </p>
              <div className="flex text-yellow-400">
                <Star className="h-5 w-5 fill-current" />
                <Star className="h-5 w-5 fill-current" />
                <Star className="h-5 w-5 fill-current" />
                <Star className="h-5 w-5 fill-current" />
                <Star className="h-5 w-5 fill-current" />
              </div>
            </div>
            <div className="bg-gray-50 rounded-2xl p-8">
              <div className="flex items-center mb-6">
                <div className="w-16 h-16 bg-dark-blue rounded-full flex items-center justify-center text-white font-bold text-xl">M</div>
                <div className="ml-4">
                  <h4 className="text-xl font-semibold text-gray-900">Mike Chen</h4>
                  <p className="text-gray-600">Creative Director</p>
                </div>
              </div>
              <p className="text-gray-600 mb-6 text-lg">
                "Our customers spend 2.5x longer with AR content. It's a game-changer for engagement!"
              </p>
              <div className="flex text-yellow-400">
                <Star className="h-5 w-5 fill-current" />
                <Star className="h-5 w-5 fill-current" />
                <Star className="h-5 w-5 fill-current" />
                <Star className="h-5 w-5 fill-current" />
                <Star className="h-5 w-5 fill-current" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-5xl font-bold text-gray-900 mb-6">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Start free and scale as you grow. No hidden fees, no surprises.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Free Plan */}
            <div className="bg-white rounded-2xl p-8 border-2 border-gray-200">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Free</h3>
                <div className="text-4xl font-bold text-dark-blue mb-2">$0</div>
                <p className="text-gray-600">Forever</p>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                  <span className="text-gray-700">1 AR Experience</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                  <span className="text-gray-700">Basic Analytics</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                  <span className="text-gray-700">Community Support</span>
                </li>
              </ul>
              <Link
                href="/compiler"
                className="w-full bg-dark-blue text-white py-4 px-6 rounded-lg font-semibold hover:bg-red-800 transition-colors text-center block"
              >
                Get Started Free
              </Link>
            </div>

            {/* Monthly Plan */}
            <div className="bg-dark-blue rounded-2xl p-8 border-2 border-dark-blue relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-red-500 text-white px-4 py-2 rounded-full text-sm font-semibold">Most Popular</span>
              </div>
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-white mb-2">Monthly</h3>
                <div className="text-4xl font-bold text-white mb-2">$49</div>
                <p className="text-blue-100">per month</p>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-white mr-3" />
                  <span className="text-white">3 AR Campaigns</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-white mr-3" />
                  <span className="text-white">Advanced Analytics</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-white mr-3" />
                  <span className="text-white">Priority Support</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-white mr-3" />
                  <span className="text-white">Custom Branding</span>
                </li>
              </ul>
              <Link
                href="/auth/signup"
                className="w-full bg-white text-dark-blue py-4 px-6 rounded-lg font-semibold hover:bg-gray-100 transition-colors text-center block"
              >
                Start Monthly Plan
              </Link>
            </div>

            {/* Annual Plan */}
            <div className="bg-white rounded-2xl p-8 border-2 border-gray-200">
              <div className="text-center mb-8">
                <div className="bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-semibold mb-4 inline-block">
                  Save $89/year
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Annual</h3>
                <div className="text-4xl font-bold text-dark-blue mb-2">$499</div>
                <p className="text-gray-600">per year</p>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                  <span className="text-gray-700">Unlimited AR Campaigns</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                  <span className="text-gray-700">Premium Analytics</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                  <span className="text-gray-700">24/7 Support</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                  <span className="text-gray-700">White-label Solutions</span>
                </li>
              </ul>
              <Link
                href="/auth/signup"
                className="w-full bg-dark-blue text-white py-4 px-6 rounded-lg font-semibold hover:bg-red-800 transition-colors text-center block"
              >
                Start Annual Plan
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Why Use Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-5xl font-bold text-gray-900 mb-6">
              Why Use QuickScanAR?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Discover the advantages that make us the preferred choice for AR marketing
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="bg-dark-blue rounded-2xl w-20 h-20 flex items-center justify-center mx-auto mb-6">
                <Smartphone className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Lightning Fast</h3>
              <p className="text-gray-600">Create AR experiences in minutes, not hours</p>
            </div>
            <div className="text-center">
              <div className="bg-dark-blue rounded-2xl w-20 h-20 flex items-center justify-center mx-auto mb-6">
                <Globe className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">High Converting</h3>
              <p className="text-gray-600">Proven to increase engagement and conversions</p>
            </div>
            <div className="text-center">
              <div className="bg-dark-blue rounded-2xl w-20 h-20 flex items-center justify-center mx-auto mb-6">
                <Users className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">User Friendly</h3>
              <p className="text-gray-600">No technical skills required</p>
            </div>
            <div className="text-center">
              <div className="bg-dark-blue rounded-2xl w-20 h-20 flex items-center justify-center mx-auto mb-6">
                <BarChart3 className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Scalable</h3>
              <p className="text-gray-600">Grow from 1 to 1000+ AR experiences</p>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-5xl font-bold text-gray-900 mb-6">
              Perfect For Every Business
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              From startups to enterprise, AR marketing works for every industry and business size
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white rounded-2xl p-8 text-center">
              <div className="bg-dark-blue rounded-2xl w-16 h-16 flex items-center justify-center mx-auto mb-6">
                <Camera className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Product Launches</h3>
              <p className="text-gray-600">Create buzz with interactive product demos and virtual try-ons</p>
            </div>
            <div className="bg-white rounded-2xl p-8 text-center">
              <div className="bg-dark-blue rounded-2xl w-16 h-16 flex items-center justify-center mx-auto mb-6">
                <Users className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Trade Shows</h3>
              <p className="text-gray-600">Stand out with immersive booth experiences that capture attention</p>
            </div>
            <div className="bg-white rounded-2xl p-8 text-center">
              <div className="bg-dark-blue rounded-2xl w-16 h-16 flex items-center justify-center mx-auto mb-6">
                <Globe className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Retail Marketing</h3>
              <p className="text-gray-600">Drive in-store traffic and boost sales with AR-powered campaigns</p>
            </div>
            <div className="bg-white rounded-2xl p-8 text-center">
              <div className="bg-dark-blue rounded-2xl w-16 h-16 flex items-center justify-center mx-auto mb-6">
                <Smartphone className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Social Media</h3>
              <p className="text-gray-600">Create viral content that drives engagement and brand awareness</p>
            </div>
            <div className="bg-white rounded-2xl p-8 text-center">
              <div className="bg-dark-blue rounded-2xl w-16 h-16 flex items-center justify-center mx-auto mb-6">
                <BarChart3 className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Lead Generation</h3>
              <p className="text-gray-600">Capture qualified leads with interactive AR experiences</p>
            </div>
            <div className="bg-white rounded-2xl p-8 text-center">
              <div className="bg-dark-blue rounded-2xl w-16 h-16 flex items-center justify-center mx-auto mb-6">
                <Star className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Brand Activation</h3>
              <p className="text-gray-600">Build memorable brand experiences that customers love</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-5xl font-bold text-gray-900 mb-6">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-gray-600">
              Everything you need to know about QuickScanAR
            </p>
          </div>
          <div className="space-y-8">
            <div className="bg-gray-50 rounded-2xl p-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4">What is AR marketing?</h3>
              <p className="text-gray-600 text-lg">
                AR marketing uses augmented reality technology to create interactive, immersive experiences that engage customers and drive conversions. It overlays digital content onto the real world through smartphones and other devices.
              </p>
            </div>
            <div className="bg-gray-50 rounded-2xl p-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Do I need technical skills to use QuickScanAR?</h3>
              <p className="text-gray-600 text-lg">
                No technical skills required! Our platform is designed to be user-friendly. Simply upload your images, use our AR compiler, and create experiences with our drag-and-drop interface.
              </p>
            </div>
            <div className="bg-gray-50 rounded-2xl p-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4">How long does it take to create an AR experience?</h3>
              <p className="text-gray-600 text-lg">
                Most users create their first AR experience in under 10 minutes. The process involves uploading an image, compiling it for AR, and adding your video content.
              </p>
            </div>
            <div className="bg-gray-50 rounded-2xl p-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4">What types of images work best for AR?</h3>
              <p className="text-gray-600 text-lg">
                High-contrast images with distinct features work best. Logos, product packaging, business cards, and printed materials are ideal. Avoid images with too many similar colors or patterns.
              </p>
            </div>
            <div className="bg-gray-50 rounded-2xl p-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Can I track the performance of my AR campaigns?</h3>
              <p className="text-gray-600 text-lg">
                Yes! Our analytics dashboard provides detailed insights into engagement, views, interactions, and conversion metrics to help you measure ROI and optimize your campaigns.
              </p>
            </div>
            <div className="bg-gray-50 rounded-2xl p-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Is there a limit to how many AR experiences I can create?</h3>
              <p className="text-gray-600 text-lg">
                Free users can create 1 AR experience. Monthly subscribers get 3 campaigns, and annual subscribers enjoy unlimited AR experiences with premium features.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-dark-blue">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl lg:text-5xl font-bold text-white mb-6">
            Ready to Generate More Leads?
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Start your first campaign in minutes.
          </p>
          <Link
            href="/compiler"
            className="bg-white text-dark-blue px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 transition-colors inline-block"
          >
            Start Creating Free
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center mb-6">
                <Camera className="h-8 w-8 text-dark-blue" />
                <span className="ml-2 text-2xl font-bold">QuickScanAR</span>
              </div>
              <p className="text-gray-400 text-lg">
                Transform your marketing with immersive AR experiences that drive engagement and ROI.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-6">Product</h3>
              <ul className="space-y-3 text-gray-400">
                <li><Link href="/compiler" className="hover:text-white transition-colors">AR Compiler</Link></li>
                <li><Link href="/dashboard" className="hover:text-white transition-colors">Dashboard</Link></li>
                <li><Link href="/debug" className="hover:text-white transition-colors">Debug Tools</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-6">Company</h3>
              <ul className="space-y-3 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Support</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-6">Connect</h3>
              <ul className="space-y-3 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Twitter</a></li>
                <li><a href="#" className="hover:text-white transition-colors">LinkedIn</a></li>
                <li><a href="#" className="hover:text-white transition-colors">GitHub</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            <p className="text-lg">&copy; 2024 QuickScanAR. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default function Home() {
  return (
    <AuthProvider>
      <HomePage />
    </AuthProvider>
  )
} 
