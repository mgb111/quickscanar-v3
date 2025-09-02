'use client'

import Link from 'next/link'
import { Camera, ArrowRight, BarChart3, Globe, CheckCircle, Zap, User, FileText, Tag, Home as HomeIcon, Monitor, Files, Mail, Newspaper, Quote } from 'lucide-react'
import { AuthProvider, useAuth } from '@/components/AuthProvider'
import Header from '@/components/Header'
import { useAnalytics } from '@/lib/useAnalytics';

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
                Bring Every Property to Life with AR
              </h1>
              <p className="text-xl text-black opacity-80 leading-relaxed">
                Turn any sign, flyer, or photo into an interactive AR showcase in minutes.
              </p>
              <p className="text-lg text-black opacity-80 mb-8 leading-relaxed">
                No apps. No coding. Just scan and wow your clients.
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
                  Create Your First AR Listing
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
              How It Works (Simple 3-Step Flow)
            </h2>
            <p className="text-xl text-black opacity-80 max-w-3xl mx-auto">
              Upload a marker image, add your content, and launch instantly
            </p>
          </div>
          
          {/* 3-Step Process */}
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <div className="text-center">
              <div className="bg-red-600 rounded-2xl w-16 h-16 flex items-center justify-center mx-auto mb-6 border-2 border-black">
                <span className="text-2xl font-bold text-white">1</span>
              </div>
              <h3 className="text-xl font-bold text-black mb-4">Upload Marker Image</h3>
              <p className="text-black opacity-80">Choose any property photo — brochure, flyer, or listing image</p>
            </div>
            
            <div className="text-center">
              <div className="bg-red-600 rounded-2xl w-16 h-16 flex items-center justify-center mx-auto mb-6 border-2 border-black">
                <span className="text-2xl font-bold text-white">2</span>
              </div>
              <h3 className="text-xl font-bold text-black mb-4">Add Your Content</h3>
              <p className="text-black opacity-80">Upload video walkthrough, promo, or virtual tour</p>
            </div>
            
            <div className="text-center">
              <div className="bg-red-600 rounded-2xl w-16 h-16 flex items-center justify-center mx-auto mb-6 border-2 border-black">
                <span className="text-2xl font-bold text-white">3</span>
              </div>
              <h3 className="text-xl font-bold text-black mb-4">Launch & Share</h3>
              <p className="text-black opacity-80">Get QR code and share your AR experience instantly</p>
            </div>
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
              Why Realtors Love QuickScanAR?
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
              <h3 className="text-2xl font-bold text-black mb-4">Stand Out from Competitors</h3>
              <p className="text-black opacity-80 text-lg">
                Transform static images into interactive AR experiences that wow buyers.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-red-600 rounded-2xl w-20 h-20 flex items-center justify-center mx-auto mb-6 border-2 border-black">
                <BarChart3 className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-black mb-4">Increase Buyer Engagement</h3>
              <p className="text-black opacity-80 text-lg">
                Let prospects instantly explore listings from their phones with AR walkthroughs.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-red-600 rounded-2xl w-20 h-20 flex items-center justify-center mx-auto mb-6 border-2 border-black">
                <Globe className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-black mb-4">Drive Action with Links</h3>
              <p className="text-black opacity-80 text-lg">
                Send buyers directly to your listing or scheduling page from AR experiences.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Real Estate Use Cases (image grid) */}
      <section className="py-20 bg-cream">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-5xl font-bold text-black mb-6">Real Estate Use Cases</h2>
            <p className="text-xl text-black opacity-80 max-w-3xl mx-auto">These broker and buyer touchpoints can be AR‑enabled</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* 1. Business cards */}
            <div className="bg-white rounded-2xl border-2 border-black shadow p-6 text-center">
              <div className="bg-red-600 rounded-2xl w-16 h-16 flex items-center justify-center mb-4 border-2 border-black mx-auto">
                <User className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-black">Business Cards</h3>
              <p className="text-black opacity-80 text-sm mt-2">Play an intro video, showcase a property, or link to your portfolio.</p>
            </div>

            {/* 2. Flyers & brochures */}
            <div className="bg-white rounded-2xl border-2 border-black shadow p-6 text-center">
              <div className="bg-red-600 rounded-2xl w-16 h-16 flex items-center justify-center mb-4 border-2 border-black mx-auto">
                <FileText className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-black">Flyers & Brochures</h3>
              <p className="text-black opacity-80 text-sm mt-2">Scanning pulls up an AR tour or property highlight reel.</p>
            </div>

            {/* 3. Yard sign riders */}
            <div className="bg-white rounded-2xl border-2 border-black shadow p-6 text-center">
              <div className="bg-red-600 rounded-2xl w-16 h-16 flex items-center justify-center mb-4 border-2 border-black mx-auto">
                <Tag className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-black">Yard Sign Riders</h3>
              <p className="text-black opacity-80 text-sm mt-2">Each rider can trigger unique AR content (e.g., drone pool video).</p>
            </div>

            {/* 4. Open house signs */}
            <div className="bg-white rounded-2xl border-2 border-black shadow p-6 text-center">
              <div className="bg-red-600 rounded-2xl w-16 h-16 flex items-center justify-center mb-4 border-2 border-black mx-auto">
                <HomeIcon className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-black">Open House Signs</h3>
              <p className="text-black opacity-80 text-sm mt-2">Scan to see highlights, agent intro, or book a showing.</p>
            </div>

            {/* 5. Window posters / office displays */}
            <div className="bg-white rounded-2xl border-2 border-black shadow p-6 text-center">
              <div className="bg-red-600 rounded-2xl w-16 h-16 flex items-center justify-center mb-4 border-2 border-black mx-auto">
                <Monitor className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-black">Window Posters & Displays</h3>
              <p className="text-black opacity-80 text-sm mt-2">Passersby can scan after hours and view AR walkthroughs.</p>
            </div>

            {/* 6. Listing sheets */}
            <div className="bg-white rounded-2xl border-2 border-black shadow p-6 text-center">
              <div className="bg-red-600 rounded-2xl w-16 h-16 flex items-center justify-center mb-4 border-2 border-black mx-auto">
                <Files className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-black">Listing Sheets</h3>
              <p className="text-black opacity-80 text-sm mt-2">Scan to view AR video tours or a mortgage calculator.</p>
            </div>

            {/* 7. Direct mail postcards */}
            <div className="bg-white rounded-2xl border-2 border-black shadow p-6 text-center">
              <div className="bg-red-600 rounded-2xl w-16 h-16 flex items-center justify-center mb-4 border-2 border-black mx-auto">
                <Mail className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-black">Direct Mail Postcards</h3>
              <p className="text-black opacity-80 text-sm mt-2">Trigger a 3D walkthrough or a compelling agent pitch.</p>
            </div>

            {/* 8. Print ad photos */}
            <div className="bg-white rounded-2xl border-2 border-black shadow p-6 text-center">
              <div className="bg-red-600 rounded-2xl w-16 h-16 flex items-center justify-center mb-4 border-2 border-black mx-auto">
                <Newspaper className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-black">Property Photos in Print Ads</h3>
              <p className="text-black opacity-80 text-sm mt-2">Magazine or newspaper photos jump to AR experiences.</p>
            </div>

            {/* 9. Sold signs */}
            <div className="bg-white rounded-2xl border-2 border-black shadow p-6 text-center">
              <div className="bg-red-600 rounded-2xl w-16 h-16 flex items-center justify-center mb-4 border-2 border-black mx-auto">
                <CheckCircle className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-black">Sold Signs</h3>
              <p className="text-black opacity-80 text-sm mt-2">Show success reels, testimonials, or current listings.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-5xl font-bold text-black mb-6">What Agents Say</h2>
            <p className="text-xl text-black opacity-80 max-w-3xl mx-auto">Real stories from top performers using QuickScanAR</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Luxury Agent */}
            <div className="bg-white rounded-2xl p-8 border-2 border-black shadow transition-shadow">
              <Quote className="h-8 w-8 text-red-600 mb-4" />
              <p className="text-black text-lg italic leading-8">
                "My sellers expect innovation. When I showed them how their $12M listing sign could trigger an AR film of the property, they were blown away. It set me apart from every other agent in the area."
              </p>
              <div className="mt-6 border-t border-black/10 pt-4">
                <div className="text-black opacity-70 text-sm">Luxury Broker, Beverly Hills CA</div>
              </div>
            </div>

            {/* International Agent */}
            <div className="bg-white rounded-2xl p-8 border-2 border-black shadow transition-shadow">
              <Quote className="h-8 w-8 text-red-600 mb-4" />
              <p className="text-black text-lg italic leading-8">
                "In Dubai, competition is intense. With QuickScanAR, my listings stand out immediately. Clients scan and see a polished walkthrough without even booking a showing. It’s a powerful first impression."
              </p>
              <div className="mt-6 border-t border-black/10 pt-4">
                <div className="text-black opacity-70 text-sm">Real Estate Consultant, Dubai</div>
              </div>
            </div>

            {/* Brokerage Owner */}
            <div className="bg-white rounded-2xl p-8 border-2 border-black shadow transition-shadow">
              <Quote className="h-8 w-8 text-red-600 mb-4" />
              <p className="text-black text-lg italic leading-8">
                "We rolled QuickScanAR across 45 agents in my office. Now every business card, sign rider, and brochure is interactive. It’s consistent, simple, and makes our brand look cutting-edge."
              </p>
              <div className="mt-6 border-t border-black/10 pt-4">
                <div className="text-black opacity-70 text-sm">Brokerage Owner, Miami FL</div>
              </div>
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
              Common questions about AR technology for real estate
            </p>
          </div>
          <div className="space-y-8">
            <div className="bg-cream rounded-2xl p-8 border-2 border-black">
              <h3 className="text-xl font-bold text-black mb-4">Do I need technical skills to create AR experiences?</h3>
              <p className="text-black opacity-80 text-lg">
                No technical skills are required. Our platform is designed for realtors and business users. If you can upload images and videos, you can create professional AR experiences.
              </p>
            </div>
            <div className="bg-cream rounded-2xl p-8 border-2 border-black">
              <h3 className="text-xl font-bold text-black mb-4">How quickly can I launch my first AR listing?</h3>
              <p className="text-black opacity-80 text-lg">
                Most realtors can create and launch their first AR experience in under 10 minutes. Upload a property photo, add your video content, and publish instantly.
              </p>
            </div>
            <div className="bg-cream rounded-2xl p-8 border-2 border-black">
              <h3 className="text-xl font-bold text-black mb-4">What kind of videos can I add to listings?</h3>
              <p className="text-black opacity-80 text-lg">
                Any property walkthrough, promo, or marketing video. Keep it short — under 1 minute works best for buyer engagement.
              </p>
            </div>
            <div className="bg-cream rounded-2xl p-8 border-2 border-black">
              <h3 className="text-xl font-bold text-black mb-4">Will this work for printed materials too?</h3>
              <p className="text-black opacity-80 text-lg">
                Yes! Flyers, brochures, and posters all work — just make sure the image is clear. Perfect for open houses and trade shows.
              </p>
            </div>
            <div className="bg-cream rounded-2xl p-8 border-2 border-black">
              <h3 className="text-xl font-bold text-black mb-4">Can I track engagement on my AR listings?</h3>
              <p className="text-black opacity-80 text-lg">
                You can see how many people scanned and watched the AR video via our dashboard. Track performance and optimize your campaigns.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 bg-cream">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-5xl font-bold text-black mb-6">
              Choose Your Plan
            </h2>
            <p className="text-xl text-black opacity-80 max-w-3xl mx-auto">
              Flexible options designed to grow with your real estate business
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Free Plan */}
            <div className="bg-white rounded-2xl p-8 border-2 border-black">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-black mb-2">Free Plan</h3>
                <div className="text-4xl font-bold text-red-600 mb-2">$0</div>
                <p className="text-black opacity-80">Forever free</p>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-red-600 mr-3" />
                  <span className="text-black">1 AR experience</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-red-600 mr-3" />
                  <span className="text-black">2-Step Upload Creation</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-red-600 mr-3" />
                  <span className="text-black">QR Code Added</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-red-600 mr-3" />
                  <span className="text-black">Experience Dashboard</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-red-600 mr-3" />
                  <span className="text-black">Customer Support</span>
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
                <h3 className="text-2xl font-bold text-white mb-2">Monthly Plan</h3>
                <div className="text-4xl font-bold text-white mb-2">$49</div>
                <p className="text-white opacity-90">per month</p>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-white mr-3" />
                  <span className="text-white">3 AR Experiences</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-white mr-3" />
                  <span className="text-white">2-Step Upload Creation</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-white mr-3" />
                  <span className="text-white">QR Code Added</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-white mr-3" />
                  <span className="text-white">Experience Dashboard</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-white mr-3" />
                  <span className="text-white">Priority Customer Support</span>
                </li>
              </ul>
              <a
                href="https://sandbox-api.polar.sh/v1/checkout-links/polar_cl_omyhnY3XbF205MbBYiCHz2trQVp2xV38AezWv3hzK7h/redirect"
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
                Start Monthly Plan
              </a>
            </div>

            {/* Annual Plan */}
            <div className="bg-white rounded-2xl p-8 border-2 border-black">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-black mb-2">Annual Plan</h3>
                <div className="text-4xl font-bold text-red-600 mb-2">$499</div>
                <p className="text-black opacity-80">per year</p>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-red-600 mr-3" />
                  <span className="text-black">36 AR Experiences</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-red-600 mr-3" />
                  <span className="text-black">2-Step Upload Creation</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-red-600 mr-3" />
                  <span className="text-black">QR Code Added</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-red-600 mr-3" />
                  <span className="text-black">Experience Dashboard</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-red-600 mr-3" />
                  <span className="text-black">Priority Customer Support</span>
                </li>
              </ul>
              <a
                href="https://sandbox-api.polar.sh/v1/checkout-links/polar_cl_HTsyBpbDXNy27FhhIKxcGfqAglfZ75r2Yg87U4IjbLH/redirect"
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
                Choose Annual Plan
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-red-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl lg:text-5xl font-bold text-white mb-6">
            Ready to Make Your Listings Unforgettable?
          </h2>
          <p className="text-xl text-white opacity-90 mb-8">
            Turn static property images into AR video experiences that drive leads and close deals — in just 3 steps.
          </p>
          <Link
            href="/compiler"
            onClick={() => {
              trackEvent('click', 'cta', 'final_section_create_ar')
              trackUserEngagement('cta_click', 'final_section', 'button')
            }}
            className="bg-white text-red-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-cream transition-colors inline-flex items-center border-2 border-white group"
          >
            Create Your First AR Listing
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
                Professional AR creation platform that makes interactive experiences accessible to realtors of all sizes. Simple, powerful, and results-driven.
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
