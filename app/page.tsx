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
                Bring Any Image to Life <span className="text-red-600">with AR</span>
              </h1>
              <p className="text-xl text-black opacity-80 leading-relaxed">
                Turn any sign, flyer, packaging, or photo into an interactive AR experience in minutes.
              </p>
              <p className="text-lg text-black opacity-80 mb-8 leading-relaxed">
                No apps. No coding. Just scan and wow your audience.
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
                  Create Your First AR Experience
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
              <p className="text-black opacity-80">Choose any image — poster, flyer, packaging, or product shot</p>
            </div>
            
            <div className="text-center">
              <div className="bg-red-600 rounded-2xl w-16 h-16 flex items-center justify-center mx-auto mb-6 border-2 border-black">
                <span className="text-2xl font-bold text-white">2</span>
              </div>
              <h3 className="text-xl font-bold text-black mb-4">Add Your Content</h3>
              <p className="text-black opacity-80">Upload a short video demo, promo, or walkthrough</p>
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
              Why Teams Love QuickScanAR
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
                Transform static images into interactive AR experiences that wow viewers.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-red-600 rounded-2xl w-20 h-20 flex items-center justify-center mx-auto mb-6 border-2 border-black">
                <BarChart3 className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-black mb-4">Increase Engagement</h3>
              <p className="text-black opacity-80 text-lg">
                Let people instantly explore your content from their phones with AR walkthroughs.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-red-600 rounded-2xl w-20 h-20 flex items-center justify-center mx-auto mb-6 border-2 border-black">
                <Globe className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-black mb-4">Drive Action with Links</h3>
              <p className="text-black opacity-80 text-lg">
                Send viewers directly to your website, signup, or purchase page from AR experiences.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases (ROI-oriented image grid) */}
      <section className="py-20 bg-cream">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-5xl font-bold text-black mb-6">Use Cases That Drive ROI</h2>
            <p className="text-xl text-black opacity-80 max-w-3xl mx-auto">Turn everyday touchpoints into measurable outcomes — scans, clicks, and conversions</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* 1. Business cards */}
            <div className="bg-white rounded-2xl border-2 border-black shadow p-6 text-center">
              <div className="bg-red-600 rounded-2xl w-16 h-16 flex items-center justify-center mb-4 border-2 border-black mx-auto">
                <User className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-black">Business Cards</h3>
              <p className="text-black opacity-80 text-sm mt-2">Increase recall and scan-to-profile rates by showcasing a quick intro with clear next steps.</p>
            </div>

            {/* 2. Flyers & brochures */}
            <div className="bg-white rounded-2xl border-2 border-black shadow p-6 text-center">
              <div className="bg-red-600 rounded-2xl w-16 h-16 flex items-center justify-center mb-4 border-2 border-black mx-auto">
                <FileText className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-black">Flyers & Brochures</h3>
              <p className="text-black opacity-80 text-sm mt-2">Lift brochure response rates with instant AR demos that shorten the path to action.</p>
            </div>

            {/* 3. Yard sign riders */}
            <div className="bg-white rounded-2xl border-2 border-black shadow p-6 text-center">
              <div className="bg-red-600 rounded-2xl w-16 h-16 flex items-center justify-center mb-4 border-2 border-black mx-auto">
                <Tag className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-black">Signage</h3>
              <p className="text-black opacity-80 text-sm mt-2">Drive foot-traffic conversions with product reveals and time-bound CTAs at the point of decision.</p>
            </div>

            {/* 4. Event signage */}
            <div className="bg-white rounded-2xl border-2 border-black shadow p-6 text-center">
              <div className="bg-red-600 rounded-2xl w-16 h-16 flex items-center justify-center mb-4 border-2 border-black mx-auto">
                <HomeIcon className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-black">Event Signage</h3>
              <p className="text-black opacity-80 text-sm mt-2">Boost on-site engagement and qualified meetings with scannable highlights and signups.</p>
            </div>

            {/* 5. Window posters / office displays */}
            <div className="bg-white rounded-2xl border-2 border-black shadow p-6 text-center">
              <div className="bg-red-600 rounded-2xl w-16 h-16 flex items-center justify-center mb-4 border-2 border-black mx-auto">
                <Monitor className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-black">Window Posters & Displays</h3>
              <p className="text-black opacity-80 text-sm mt-2">Capture after-hours interest and convert window shoppers with AR experiences and QR CTAs.</p>
            </div>

            {/* 6. One‑pagers & sell sheets */}
            <div className="bg-white rounded-2xl border-2 border-black shadow p-6 text-center">
              <div className="bg-red-600 rounded-2xl w-16 h-16 flex items-center justify-center mb-4 border-2 border-black mx-auto">
                <Files className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-black">One‑Pagers & Sell Sheets</h3>
              <p className="text-black opacity-80 text-sm mt-2">Reduce friction with scannable explainers that lift understanding and form-completion rates.</p>
            </div>

            {/* 7. Direct mail postcards */}
            <div className="bg-white rounded-2xl border-2 border-black shadow p-6 text-center">
              <div className="bg-red-600 rounded-2xl w-16 h-16 flex items-center justify-center mb-4 border-2 border-black mx-auto">
                <Mail className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-black">Direct Mail Postcards</h3>
              <p className="text-black opacity-80 text-sm mt-2">Increase mail ROI by turning static postcards into interactive demos with trackable CTAs.</p>
            </div>

            {/* 8. Print ad photos */}
            <div className="bg-white rounded-2xl border-2 border-black shadow p-6 text-center">
              <div className="bg-red-600 rounded-2xl w-16 h-16 flex items-center justify-center mb-4 border-2 border-black mx-auto">
                <Newspaper className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-black">Print Ads & Editorial</h3>
              <p className="text-black opacity-80 text-sm mt-2">Lift print-to-digital CTR with scannable ads that jump to AR offers or product try-ons.</p>
            </div>

            {/* 9. Sold signs */}
            <div className="bg-white rounded-2xl border-2 border-black shadow p-6 text-center">
              <div className="bg-red-600 rounded-2xl w-16 h-16 flex items-center justify-center mb-4 border-2 border-black mx-auto">
                <CheckCircle className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-black">Badges & Displays</h3>
              <p className="text-black opacity-80 text-sm mt-2">Turn moments of attention into action with testimonials, promos, and instant follow-ups.</p>
            </div>
          </div>
        </div>
      </section>
      {/* Customer Results (ROI Testimonials) */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-5xl font-bold text-black mb-6">Customer Results</h2>
            <p className="text-xl text-black opacity-80 max-w-3xl mx-auto">Real ROI outcomes from teams using QuickScanAR</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* ROI Story 1 */}
            <div className="bg-white rounded-2xl p-8 border-2 border-black shadow transition-shadow">
              <Quote className="h-8 w-8 text-red-600 mb-4" />
              <p className="text-black text-lg leading-8">
                “We saw a <span className='font-semibold'>35% higher scan‑to‑site CTR</span> in the first 30 days after making print and packaging scannable with AR.”
              </p>
              <div className="mt-6 border-t border-black/10 pt-4">
                <div className="text-black opacity-70 text-sm">Growth Lead, DTC Brand</div>
              </div>
            </div>

            {/* ROI Story 2 */}
            <div className="bg-white rounded-2xl p-8 border-2 border-black shadow transition-shadow">
              <Quote className="h-8 w-8 text-red-600 mb-4" />
              <p className="text-black text-lg leading-8">
                “Adding AR to booth materials <span className='font-semibold'>2× our demo signups</span> and gave us cleaner attribution via QR scans.”
              </p>
              <div className="mt-6 border-t border-black/10 pt-4">
                <div className="text-black opacity-70 text-sm">Event Marketing Manager, B2B SaaS</div>
              </div>
            </div>

            {/* ROI Story 3 */}
            <div className="bg-white rounded-2xl p-8 border-2 border-black shadow transition-shadow">
              <Quote className="h-8 w-8 text-red-600 mb-4" />
              <p className="text-black text-lg leading-8">
                “We reduced <span className='font-semibold'>time‑to‑first‑action by 48%</span> from print by turning brochures into scannable AR explainers.”
              </p>
              <div className="mt-6 border-t border-black/10 pt-4">
                <div className="text-black opacity-70 text-sm">Marketing Ops, Enterprise</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-5xl font-bold text-black mb-6">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-black opacity-80">
              Common questions about creating AR experiences
            </p>
          </div>
          <div className="space-y-8">
            <div className="bg-cream rounded-2xl p-8 border-2 border-black">
              <h3 className="text-xl font-bold text-black mb-4">Do I need technical skills to create AR experiences?</h3>
              <p className="text-black opacity-80 text-lg">
                No technical skills are required. Our platform is designed for everyone. If you can upload images and videos, you can create professional AR experiences.
              </p>
            </div>
            <div className="bg-cream rounded-2xl p-8 border-2 border-black">
              <h3 className="text-xl font-bold text-black mb-4">How quickly can I launch my first AR experience?</h3>
              <p className="text-black opacity-80 text-lg">
                Most people can create and launch their first AR experience in under 10 minutes. Upload an image, add your video content, and publish instantly.
              </p>
            </div>
            <div className="bg-cream rounded-2xl p-8 border-2 border-black">
              <h3 className="text-xl font-bold text-black mb-4">What kind of videos can I add?</h3>
              <p className="text-black opacity-80 text-lg">
                Any demo, promo, or marketing video. Keep it short — under 1 minute works best for engagement.
              </p>
            </div>
            <div className="bg-cream rounded-2xl p-8 border-2 border-black">
              <h3 className="text-xl font-bold text-black mb-4">Will this work for printed materials too?</h3>
              <p className="text-black opacity-80 text-lg">
                Yes! Flyers, brochures, and posters all work — just make sure the image is clear. Perfect for events and trade shows.
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
              Flexible options designed to grow with you
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
            Ready to Make Your Content Unforgettable?
          </h2>
          <p className="text-xl text-white opacity-90 mb-8">
            Turn static images into AR video experiences that drive engagement — in just 3 steps.
          </p>
          <Link
            href="/compiler"
            onClick={() => {
              trackEvent('click', 'cta', 'final_section_create_ar')
              trackUserEngagement('cta_click', 'final_section', 'button')
            }}
            className="bg-white text-red-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-cream transition-colors inline-flex items-center border-2 border-white group"
          >
            Create Your First AR Experience
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
                Professional AR creation platform that makes interactive experiences accessible to creators and teams of all sizes. Simple, powerful, and results-driven.
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
