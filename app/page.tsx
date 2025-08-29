'use client'

import Link from 'next/link'
import { Camera, Upload, ArrowRight, BarChart3, Video, Users, Globe, Smartphone, CheckCircle, Star, ArrowLeft, Zap, Rocket, Target } from 'lucide-react'
import { AuthProvider, useAuth } from '@/components/AuthProvider'
import Header from '@/components/Header'
import { useAnalytics } from '@/lib/useAnalytics'

function HomePage() {
  const { user, loading, signOut } = useAuth()
  const { trackEvent, trackUserEngagement } = useAnalytics()

  const isSupabaseConfigured = () => {
    return process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  }

  const supabaseError = false // You can implement actual error checking here

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-600"></div>
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
        onSignOut={handleSignOut}
      />

      {/* Hero Section */}
      <section className="relative bg-cream py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl lg:text-6xl font-bold text-black leading-tight mb-6">
                🚀 QuickScanAR
                <span className="block text-red-600">The World's Only Two-Step AR Creator</span>
              </h1>
              <p className="text-xl text-black opacity-80 mb-8 leading-relaxed">
                Create professional AR campaigns in minutes, not months.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/compiler"
                  onClick={() => {
                    trackEvent('click', 'cta', 'hero_create_ar_experience')
                    trackUserEngagement('cta_click', 'hero_section', 'button')
                  }}
                  className="bg-red-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-red-700 transition-colors flex items-center justify-center border-2 border-black group"
                >
                  Create Your First AR Experience →
                  <Zap className="ml-2 h-5 w-5 group-hover:animate-pulse" />
                </Link>
              </div>
            </div>
            <div className="relative">
              <img 
                src="/ar-experience-preview.gif" 
                alt="AR Experience Preview"
                className="w-full h-auto rounded-2xl shadow-2xl border-2 border-black"
                style={{ 
                  aspectRatio: '1/1',
                  objectFit: 'cover'
                }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Product Walkthrough */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-5xl font-bold text-black mb-6">
              ✨ How It Works (Simple 2-Step Flow)
            </h2>
            <p className="text-xl text-black opacity-80 max-w-3xl mx-auto">
              Upload an image, add your content, and launch instantly
            </p>
          </div>
          <div className="relative w-full lg:max-w-4xl mx-auto">
            <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, width: '100%' }}>
              <iframe
                src="https://www.youtube.com/embed/Xeka_dIevm4?rel=0&modestbranding=1&playsinline=1&autoplay=1&mute=1&loop=1&playlist=Xeka_dIevm4"
                title="Create and Launch a Custom AR Experience"
                frameBorder="0"
                loading="lazy"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', borderRadius: '1rem', border: '2px solid #000000' }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-5xl font-bold text-black mb-6">
              🎯 Why QuickScanAR?
            </h2>
            <p className="text-xl text-black opacity-80 max-w-3xl mx-auto">
              No coding or tech skills needed
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-red-600 rounded-2xl w-20 h-20 flex items-center justify-center mx-auto mb-6 border-2 border-black">
                <Zap className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-black mb-4">10x Faster & 90% Cheaper</h3>
              <p className="text-black opacity-80 text-lg">
                Than traditional AR development. Create professional campaigns in minutes, not months.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-red-600 rounded-2xl w-20 h-20 flex items-center justify-center mx-auto mb-6 border-2 border-black">
                <BarChart3 className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-black mb-4">Analytics Included</h3>
              <p className="text-black opacity-80 text-lg">
                Track scans, views, and engagement. Monitor performance and optimize your campaigns.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-red-600 rounded-2xl w-20 h-20 flex items-center justify-center mx-auto mb-6 border-2 border-black">
                <Globe className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-black mb-4">Fully Browser-Based</h3>
              <p className="text-black opacity-80 text-lg">
                Nothing to install. Works on iOS & Android, no app required.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Results Section */}
      <section className="py-20 bg-cream">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-5xl font-bold text-black mb-6">
              💡 Use Cases
            </h2>
            <p className="text-xl text-black opacity-80 max-w-3xl mx-auto">
              Transform any image into an engaging AR experience
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-red-600 rounded-2xl w-16 h-16 flex items-center justify-center mx-auto mb-6 border-2 border-black">
                <Rocket className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-black mb-4">Product Launches & Demos</h3>
              <p className="text-black opacity-80">Make packaging interactive</p>
            </div>
            <div className="text-center">
              <div className="bg-red-600 rounded-2xl w-16 h-16 flex items-center justify-center mx-auto mb-6 border-2 border-black">
                <Users className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-black mb-4">Trade Show Engagement</h3>
              <p className="text-black opacity-80">Wow booth visitors</p>
            </div>
            <div className="text-center">
              <div className="bg-red-600 rounded-2xl w-16 h-16 flex items-center justify-center mx-auto mb-6 border-2 border-black">
                <Globe className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-black mb-4">Retail Experiences</h3>
              <p className="text-black opacity-80">AR promotions & loyalty rewards</p>
            </div>
            <div className="text-center">
              <div className="bg-red-600 rounded-2xl w-16 h-16 flex items-center justify-center mx-auto mb-6 border-2 border-black">
                <Target className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-black mb-4">Marketing Campaigns</h3>
              <p className="text-black opacity-80">Posters, flyers, and ads come alive</p>
            </div>
            <div className="text-center">
              <div className="bg-red-600 rounded-2xl w-16 h-16 flex items-center justify-center mx-auto mb-6 border-2 border-black">
                <Star className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-black mb-4">Lead Generation</h3>
              <p className="text-black opacity-80">Collect signups through AR CTAs</p>
            </div>
            <div className="text-center">
              <div className="bg-red-600 rounded-2xl w-16 h-16 flex items-center justify-center mx-auto mb-6 border-2 border-black">
                <Video className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-black mb-4">Education & Training</h3>
              <p className="text-black opacity-80">Interactive manuals, safety guides</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      

      {/* Pricing Section */}
      <section className="py-20 bg-cream">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-5xl font-bold text-black mb-6">
              Choose Your Plan
            </h2>
            <p className="text-xl text-black opacity-80 max-w-3xl mx-auto">
              Flexible options designed to grow with your business needs
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Free Plan */}
            <div className="bg-white rounded-2xl p-8 border-2 border-black">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-black mb-2">Starter</h3>
                <div className="text-4xl font-bold text-red-600 mb-2">$0</div>
                <p className="text-black opacity-80">Forever free</p>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-red-600 mr-3" />
                  <span className="text-black">1 AR experience</span>
                </li>
              </ul>
              <Link
                href="/compiler"
                onClick={() => {
                  trackEvent('click', 'pricing', 'free_plan')
                  trackUserEngagement('pricing_click', 'free_plan', 'button')
                }}
                className="w-full bg-red-600 text-white py-4 px-6 rounded-lg font-semibold hover:bg-red-700 transition-colors text-center block border-2 border-black"
              >
                Get Started Free
              </Link>
            </div>

            {/* Monthly Plan */}
            <div className="bg-red-600 rounded-2xl p-8 border-2 border-black relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-white text-red-600 px-4 py-2 rounded-full text-sm font-semibold border-2 border-black">Most Popular</span>
              </div>
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-white mb-2">Professional</h3>
                <div className="text-4xl font-bold text-white mb-2">$49</div>
                <p className="text-white opacity-90">per month</p>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-white mr-3" />
                  <span className="text-white">3 campaigns per month</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-white mr-3" />
                  <span className="text-white">Priority support</span>
                </li>
              </ul>
              <a
                href="https://buy.polar.sh/polar_cl_tIJXTsoXdnxQRDa7GaT3JBFrWiJY3CTYZ0vkr2Mwj9d"
                data-polar-checkout
                data-polar-checkout-theme="dark"
                data-customer-id={user?.id}
                onClick={() => {
                  trackEvent('click', 'pricing', 'professional_plan')
                  trackUserEngagement('pricing_click', 'professional_plan', 'button')
                  trackEvent('begin_checkout', 'ecommerce', 'professional_plan', 49)
                }}
                className="w-full bg-white text-red-600 py-4 px-6 rounded-lg font-semibold hover:bg-cream transition-colors text-center block border-2 border-black"
              >
                Start Professional Plan
              </a>
            </div>

            {/* Annual Plan */}
            <div className="bg-white rounded-2xl p-8 border-2 border-black">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-black mb-2">Enterprise</h3>
                <div className="text-4xl font-bold text-red-600 mb-2">$499</div>
                <p className="text-black opacity-80">per year</p>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-red-600 mr-3" />
                  <span className="text-black">36 campaigns per year</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-red-600 mr-3" />
                  <span className="text-black">24/7 support</span>
                </li>
              </ul>
              <a
                href="https://buy.polar.sh/polar_cl_uJCvGJRiHoQ9Y1fNO8c8aSlVofV5iTlzVtlaQ3hUriO"
                data-polar-checkout
                data-polar-checkout-theme="dark"
                data-customer-id={user?.id}
                onClick={() => {
                  trackEvent('click', 'pricing', 'enterprise_plan')
                  trackUserEngagement('pricing_click', 'enterprise_plan', 'button')
                  trackEvent('begin_checkout', 'ecommerce', 'enterprise_plan', 499)
                }}
                className="w-full bg-red-600 text-white py-4 px-6 rounded-lg font-semibold hover:bg-red-700 transition-colors text-center block border-2 border-black"
              >
                Choose Enterprise
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Why Use Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-5xl font-bold text-black mb-6">
              Why Choose QuickScanAR
            </h2>
            <p className="text-xl text-black opacity-80 max-w-3xl mx-auto">
              Built for businesses that need reliable, scalable AR solutions without the complexity
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="bg-red-600 rounded-2xl w-20 h-20 flex items-center justify-center mx-auto mb-6 border-2 border-black">
                <Zap className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-xl font-bold text-black mb-4">Fast Setup</h3>
              <p className="text-black opacity-80">From concept to live AR in minutes, not months</p>
            </div>
            <div className="text-center">
              <div className="bg-red-600 rounded-2xl w-20 h-20 flex items-center justify-center mx-auto mb-6 border-2 border-black">
                <Globe className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-xl font-bold text-black mb-4">Easy to Use</h3>
              <p className="text-black opacity-80">Intuitive interface that requires no technical expertise</p>
            </div>
            <div className="text-center">
              <div className="bg-red-600 rounded-2xl w-20 h-20 flex items-center justify-center mx-auto mb-6 border-2 border-black">
                <Target className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-xl font-bold text-black mb-4">Reliable Tracking</h3>
              <p className="text-black opacity-80">Stable AR experiences that work consistently across devices</p>
            </div>
            <div className="text-center">
              <div className="bg-red-600 rounded-2xl w-20 h-20 flex items-center justify-center mx-auto mb-6 border-2 border-black">
                <Rocket className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-xl font-bold text-black mb-4">Measurable Results</h3>
              <p className="text-black opacity-80">Comprehensive tracking to measure engagement and ROI</p>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="py-20 bg-cream">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-5xl font-bold text-black mb-6">
              Business Applications
            </h2>
            <p className="text-xl text-black opacity-80 max-w-3xl mx-auto">
              Proven use cases across industries that drive engagement and deliver measurable results
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white rounded-2xl p-8 text-center border-2 border-black">
              <div className="bg-red-600 rounded-2xl w-16 h-16 flex items-center justify-center mx-auto mb-6 border-2 border-black">
                <Rocket className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-black mb-4">Product Launches</h3>
              <p className="text-black opacity-80">Create immersive product reveals that generate buzz and media coverage</p>
            </div>
            <div className="bg-white rounded-2xl p-8 text-center border-2 border-black">
              <div className="bg-red-600 rounded-2xl w-16 h-16 flex items-center justify-center mx-auto mb-6 border-2 border-black">
                <Users className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-black mb-4">Trade Show Engagement</h3>
              <p className="text-black opacity-80">Stand out at events with interactive experiences that draw crowds and generate leads</p>
            </div>
            <div className="bg-white rounded-2xl p-8 text-center border-2 border-black">
              <div className="bg-red-600 rounded-2xl w-16 h-16 flex items-center justify-center mx-auto mb-6 border-2 border-black">
                <Globe className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-black mb-4">Retail Experiences</h3>
              <p className="text-black opacity-80">Transform retail spaces with interactive displays that increase dwell time and conversions</p>
            </div>
            <div className="bg-white rounded-2xl p-8 text-center border-2 border-black">
              <div className="bg-red-600 rounded-2xl w-16 h-16 flex items-center justify-center mx-auto mb-6 border-2 border-black">
                <Smartphone className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-black mb-4">Social Media Content</h3>
              <p className="text-black opacity-80">Create shareable AR experiences that boost organic reach and brand awareness</p>
            </div>
            <div className="bg-white rounded-2xl p-8 text-center border-2 border-black">
              <div className="bg-red-600 rounded-2xl w-16 h-16 flex items-center justify-center mx-auto mb-6 border-2 border-black">
                <Target className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-black mb-4">Lead Generation</h3>
              <p className="text-black opacity-80">Capture qualified leads through engaging AR experiences that qualify prospects</p>
            </div>
            <div className="bg-white rounded-2xl p-8 text-center border-2 border-black">
              <div className="bg-red-600 rounded-2xl w-16 h-16 flex items-center justify-center mx-auto mb-6 border-2 border-black">
                <Star className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-black mb-4">Brand Building</h3>
              <p className="text-black opacity-80">Create memorable brand experiences that build emotional connections with customers</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-5xl font-bold text-black mb-6">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-black opacity-80">
              Common questions about AR technology and our platform
            </p>
          </div>
          <div className="space-y-8">
            <div className="bg-cream rounded-2xl p-8 border-2 border-black">
              <h3 className="text-xl font-bold text-black mb-4">What is AR marketing and how does it benefit my business?</h3>
              <p className="text-black opacity-80 text-lg">
                AR marketing overlays digital content onto the real world through mobile devices. It creates interactive experiences that increase engagement, improve brand recall, and can drive higher conversion rates compared to traditional marketing methods.
              </p>
            </div>
            <div className="bg-cream rounded-2xl p-8 border-2 border-black">
              <h3 className="text-xl font-bold text-black mb-4">Do I need technical skills to create AR experiences?</h3>
              <p className="text-black opacity-80 text-lg">
                No technical skills are required. Our platform is designed for business users and marketers. If you can upload images and videos, you can create professional AR experiences. We've simplified the process to make AR accessible to everyone.
              </p>
            </div>
            <div className="bg-cream rounded-2xl p-8 border-2 border-black">
              <h3 className="text-xl font-bold text-black mb-4">How quickly can I launch my first AR campaign?</h3>
              <p className="text-black opacity-80 text-lg">
                Most users can create and launch their first AR experience in under 10 minutes. The process involves uploading an image, adding your content, and publishing. Compare this to traditional AR development which typically takes 6-12 weeks.
              </p>
            </div>
            <div className="bg-cream rounded-2xl p-8 border-2 border-black">
              <h3 className="text-xl font-bold text-black mb-4">What makes your AR tracking technology superior?</h3>
              <p className="text-black opacity-80 text-lg">
                Our platform uses advanced computer vision algorithms trained on millions of images. This enables reliable tracking across various lighting conditions and device types, ensuring consistent performance in real-world business environments.
              </p>
            </div>
            <div className="bg-cream rounded-2xl p-8 border-2 border-black">
              <h3 className="text-xl font-bold text-black mb-4">What if I need more campaigns than the standard plans offer?</h3>
              <p className="text-black opacity-80 text-lg">
                We offer custom enterprise solutions for high-volume users. Contact our sales team to discuss your specific needs. We've supported businesses running dozens of campaigns monthly and can scale to meet your requirements.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-red-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl lg:text-5xl font-bold text-white mb-6">
            🎯 Call to Action
          </h2>
          <p className="text-xl text-white opacity-90 mb-8">
            Turn every image into an AR experience today.
          </p>
          <Link
            href="/compiler"
            onClick={() => {
              trackEvent('click', 'cta', 'final_section_create_ar')
              trackUserEngagement('cta_click', 'final_section', 'button')
            }}
            className="bg-white text-red-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-cream transition-colors inline-flex items-center border-2 border-white group"
          >
            👉 Create Your First AR Experience
            <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center mb-6">
                <Camera className="h-8 w-8 text-red-600" />
                <span className="ml-2 text-2xl font-bold">QuickScanAR</span>
              </div>
              <p className="text-white opacity-80 text-lg">
                Professional AR creation platform that makes interactive experiences accessible to businesses of all sizes. Simple, powerful, and results-driven.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-6">Product</h3>
              <ul className="space-y-3 text-white opacity-80">
                <li><Link href="/compiler" className="hover:text-white transition-colors">AR Compiler</Link></li>
                <li><Link href="/dashboard" className="hover:text-white transition-colors">Dashboard</Link></li>
                <li><Link href="/debug" className="hover:text-white transition-colors">Debug Tools</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-6">Company</h3>
              <ul className="space-y-3 text-white opacity-80">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Support</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-6">Connect</h3>
              <ul className="space-y-3 text-white opacity-80">
                <li><a href="#" className="hover:text-white transition-colors">Twitter</a></li>
                <li><a href="#" className="hover:text-white transition-colors">LinkedIn</a></li>
                <li><a href="#" className="hover:text-white transition-colors">GitHub</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white opacity-20 mt-12 pt-8 text-center text-white opacity-80">
            <p className="text-lg">&copy; 2025 QuickScanAR. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Polar.sh Checkout Script */}
      <script 
        src="https://cdn.jsdelivr.net/npm/@polar-sh/checkout@0.1/dist/embed.global.js" 
        defer 
        data-auto-init
      />
    </div>
  )
}

export default function Home() {
  return (
    <HomePage />
  )
} 
