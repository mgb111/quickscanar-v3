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
      />

      {/* Hero Section */}
      <section className="relative bg-cream py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl lg:text-6xl font-bold text-black leading-tight mb-6">
                World's Only
                <span className="block text-red-600">2-Step AR Creator</span>
              </h1>
              <p className="text-xl text-black opacity-80 mb-8 leading-relaxed">
                Upload an image + Upload a video = AR experience ready in minutes. No coding, no complexity, just professional AR marketing that drives engagement and ROI.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/compiler"
                  className="bg-red-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-red-700 transition-colors flex items-center justify-center border-2 border-black"
                >
                  Create AR in 2 Steps
                  <ArrowRight className="ml-2 h-5 w-5" />
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
              See How It Works
            </h2>
            <p className="text-xl text-black opacity-80 max-w-3xl mx-auto">
              Interactive walkthrough showing you exactly how to create and launch custom AR experiences
            </p>
          </div>
          <div className="relative w-full">
            <div style={{ position: 'relative', paddingBottom: 'calc(47.5% + 41px)', height: 0, width: '100%' }}>
              <iframe 
                src="https://demo.arcade.software/Mowg28GkHXLAEAj0GPoF?embed&embed_mobile=tab&embed_desktop=inline&show_copy_link=true" 
                title="Create and Launch a Custom AR Experience" 
                frameBorder="0" 
                loading="lazy" 
                allowFullScreen={true}
                allow="clipboard-write"
                style={{ 
                  position: 'absolute', 
                  top: 0, 
                  left: 0, 
                  width: '100%', 
                  height: '100%', 
                  colorScheme: 'light',
                  borderRadius: '1rem',
                  border: '2px solid #000000'
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
            <h2 className="text-3xl lg:text-5xl font-bold text-black mb-6">
               Just 2 Steps to Professional AR
             </h2>
            <p className="text-xl text-black opacity-80 max-w-3xl mx-auto">
               The world's simplest AR creation process - no coding, no complexity, just results
             </p>
           </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-red-600 rounded-2xl w-20 h-20 flex items-center justify-center mx-auto mb-6 border-2 border-black">
                <Camera className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-black mb-4">Step 1: Upload Image</h3>
              <p className="text-black opacity-80 text-lg">
                Upload any image - logo, product, business card. Our MindAR engine automatically converts it to AR-ready targets.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-red-600 rounded-2xl w-20 h-20 flex items-center justify-center mx-auto mb-6 border-2 border-black">
                <Video className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-black mb-4">Step 2: Upload Video</h3>
              <p className="text-black opacity-80 text-lg">
                Add your video content. Preserves original dimensions and audio. AR experience is ready instantly.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-red-600 rounded-2xl w-20 h-20 flex items-center justify-center mx-auto mb-6 border-2 border-black">
                <BarChart3 className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-black mb-4">Ultra-Stable AR</h3>
              <p className="text-black opacity-80 text-lg">
                Zero shaking, zero jitter. Our ultra-lock technology ensures professional, stable AR experiences every time.
              </p>
            </div>
          </div>
        </div>
      </section>

             {/* Trusted by Section */}
      <section className="py-20 bg-cream">
         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
           <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-5xl font-bold text-black mb-6">
               Trusted by 150+ Creators
             </h2>
            <p className="text-xl text-black opacity-80 max-w-3xl mx-auto">
               Join the community of creators who are already using the world's simplest AR creation process
             </p>
           </div>
           <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
             <div className="text-center">
               <div className="text-4xl lg:text-5xl font-bold text-red-600 mb-2">2 Steps</div>
               <p className="text-lg text-black opacity-80">That's all it takes</p>
             </div>
             <div className="text-center">
               <div className="text-4xl lg:text-5xl font-bold text-red-600 mb-2">10 min</div>
               <p className="text-lg text-black opacity-80">Average creation time</p>
             </div>
             <div className="text-center">
               <div className="text-4xl lg:text-5xl font-bold text-red-600 mb-2">0 Shaking</div>
               <p className="text-lg text-black opacity-80">Ultra-stable AR tracking</p>
             </div>
           </div>
         </div>
       </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-5xl font-bold text-black mb-6">
              Loved by Creators Worldwide
            </h2>
            <p className="text-xl text-black opacity-80 max-w-3xl mx-auto">
              See what creators are saying about their AR marketing success
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-cream rounded-2xl p-8 border-2 border-black">
              <div className="flex items-center mb-6">
                <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center text-white font-bold text-xl border-2 border-black">J</div>
                <div className="ml-4">
                  <h4 className="text-xl font-semibold text-black">John Smith</h4>
                  <p className="text-black opacity-80">Marketing Director</p>
                </div>
              </div>
              <p className="text-black opacity-80 mb-6 text-lg">
                "QuickScanAR transformed our trade show experience. We saw a 300% increase in booth engagement!"
              </p>
              <div className="flex text-red-600">
                <Star className="h-5 w-5 fill-current" />
                <Star className="h-5 w-5 fill-current" />
                <Star className="h-5 w-5 fill-current" />
                <Star className="h-5 w-5 fill-current" />
                <Star className="h-5 w-5 fill-current" />
              </div>
            </div>
            <div className="bg-cream rounded-2xl p-8 border-2 border-black">
              <div className="flex items-center mb-6">
                <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center text-white font-bold text-xl border-2 border-black">S</div>
                <div className="ml-4">
                  <h4 className="text-xl font-semibold text-black">Sarah Johnson</h4>
                  <p className="text-black opacity-80">Brand Manager</p>
                </div>
              </div>
              <p className="text-black opacity-80 mb-6 text-lg">
                "The AR experiences we created drove 45% higher conversion rates than our traditional campaigns."
              </p>
              <div className="flex text-red-600">
                <Star className="h-5 w-5 fill-current" />
                <Star className="h-5 w-5 fill-current" />
                <Star className="h-5 w-5 fill-current" />
                <Star className="h-5 w-5 fill-current" />
                <Star className="h-5 w-5 fill-current" />
              </div>
            </div>
            <div className="bg-cream rounded-2xl p-8 border-2 border-black">
              <div className="flex items-center mb-6">
                <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center text-white font-bold text-xl border-2 border-black">M</div>
                <div className="ml-4">
                  <h4 className="text-xl font-semibold text-black">Mike Chen</h4>
                  <p className="text-black opacity-80">Creative Director</p>
                </div>
              </div>
              <p className="text-black opacity-80 mb-6 text-lg">
                "Our customers spend 2.5x longer with AR content. It's a game-changer for engagement!"
              </p>
              <div className="flex text-red-600">
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
      <section className="py-20 bg-cream">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-5xl font-bold text-black mb-6">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-black opacity-80 max-w-3xl mx-auto">
              Start free and scale as you grow. No hidden fees, no surprises.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Free Plan */}
            <div className="bg-white rounded-2xl p-8 border-2 border-black">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-black mb-2">Free</h3>
                <div className="text-4xl font-bold text-red-600 mb-2">$0</div>
                <p className="text-black opacity-80">Forever</p>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-red-600 mr-3" />
                  <span className="text-black">1 AR Experience</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-red-600 mr-3" />
                  <span className="text-black">Basic Analytics</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-red-600 mr-3" />
                  <span className="text-black">Community Support</span>
                </li>
              </ul>
              <Link
                href="/compiler"
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
                <h3 className="text-2xl font-bold text-white mb-2">Monthly</h3>
                <div className="text-4xl font-bold text-white mb-2">$49</div>
                <p className="text-white opacity-90">per month</p>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-white mr-3" />
                  <span className="text-white">3 AR Campaigns per month</span>
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
              <a
                href="https://buy.polar.sh/polar_cl_tIJXTsoXdnxQRDa7GaT3JBFrWiJY3CTYZ0vkr2Mwj9d"
                data-polar-checkout
                data-polar-checkout-theme="dark"
                data-customer-id={user?.id}
                className="w-full bg-white text-red-600 py-4 px-6 rounded-lg font-semibold hover:bg-cream transition-colors text-center block border-2 border-black"
              >
                Start Monthly Plan
              </a>
            </div>

            {/* Annual Plan */}
            <div className="bg-white rounded-2xl p-8 border-2 border-black">
              <div className="text-center mb-8">
                <div className="bg-red-100 text-red-800 px-4 py-2 rounded-full text-sm font-semibold mb-4 inline-block border border-red-600">
                  Save $89/year
                </div>
                <h3 className="text-2xl font-bold text-black mb-2">Annual</h3>
                <div className="text-4xl font-bold text-red-600 mb-2">$499</div>
                <p className="text-black opacity-80">per year</p>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-red-600 mr-3" />
                  <span className="text-black">3 AR Campaigns per month</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-red-600 mr-3" />
                  <span className="text-black">Premium Analytics</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-red-600 mr-3" />
                  <span className="text-black">24/7 Support</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-red-600 mr-3" />
                  <span className="text-black">White-label Solutions</span>
                </li>
              </ul>
              <a
                href="https://buy.polar.sh/polar_cl_uJCvGJRiHoQ9Y1fNO8c8aSlVofV5iTlzVtlaQ3hUriO"
                data-polar-checkout
                data-polar-checkout-theme="dark"
                data-customer-id={user?.id}
                className="w-full bg-red-600 text-white py-4 px-6 rounded-lg font-semibold hover:bg-red-700 transition-colors text-center block border-2 border-black"
              >
                Start Annual Plan
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
              Why Choose QuickScanAR?
            </h2>
            <p className="text-xl text-black opacity-80 max-w-3xl mx-auto">
              The world's only 2-step AR creator with enterprise-grade stability
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="bg-red-600 rounded-2xl w-20 h-20 flex items-center justify-center mx-auto mb-6 border-2 border-black">
                <Smartphone className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-xl font-bold text-black mb-4">2 Steps Only</h3>
              <p className="text-black opacity-80">Upload image + Upload video = AR ready</p>
            </div>
            <div className="text-center">
              <div className="bg-red-600 rounded-2xl w-20 h-20 flex items-center justify-center mx-auto mb-6 border-2 border-black">
                <Globe className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-xl font-bold text-black mb-4">Zero Coding</h3>
              <p className="text-black opacity-80">No technical skills required</p>
            </div>
            <div className="text-center">
              <div className="bg-red-600 rounded-2xl w-20 h-20 flex items-center justify-center mx-auto mb-6 border-2 border-black">
                <Users className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-xl font-bold text-black mb-4">Ultra-Stable</h3>
              <p className="text-black opacity-80">No shaking, no jitter</p>
            </div>
            <div className="text-center">
              <div className="bg-red-600 rounded-2xl w-20 h-20 flex items-center justify-center mx-auto mb-6 border-2 border-black">
                <BarChart3 className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-xl font-bold text-black mb-4">10 Minutes</h3>
              <p className="text-black opacity-80">From idea to live AR</p>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="py-20 bg-cream">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-5xl font-bold text-black mb-6">
              Perfect For Every Business
            </h2>
            <p className="text-xl text-black opacity-80 max-w-3xl mx-auto">
              From startups to enterprise, AR marketing works for every industry and business size
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white rounded-2xl p-8 text-center border-2 border-black">
              <div className="bg-red-600 rounded-2xl w-16 h-16 flex items-center justify-center mx-auto mb-6 border-2 border-black">
                <Camera className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-black mb-4">Product Launches</h3>
              <p className="text-black opacity-80">Create buzz with interactive product demos and virtual try-ons</p>
            </div>
            <div className="bg-white rounded-2xl p-8 text-center border-2 border-black">
              <div className="bg-red-600 rounded-2xl w-16 h-16 flex items-center justify-center mx-auto mb-6 border-2 border-black">
                <Users className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-black mb-4">Trade Shows</h3>
              <p className="text-black opacity-80">Stand out with immersive booth experiences that capture attention</p>
            </div>
            <div className="bg-white rounded-2xl p-8 text-center border-2 border-black">
              <div className="bg-red-600 rounded-2xl w-16 h-16 flex items-center justify-center mx-auto mb-6 border-2 border-black">
                <Globe className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-black mb-4">Retail Marketing</h3>
              <p className="text-black opacity-80">Drive in-store traffic and boost sales with AR-powered campaigns</p>
            </div>
            <div className="bg-white rounded-2xl p-8 text-center border-2 border-black">
              <div className="bg-red-600 rounded-2xl w-16 h-16 flex items-center justify-center mx-auto mb-6 border-2 border-black">
                <Smartphone className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-black mb-4">Social Media</h3>
              <p className="text-black opacity-80">Create viral content that drives engagement and brand awareness</p>
            </div>
            <div className="bg-white rounded-2xl p-8 text-center border-2 border-black">
              <div className="bg-red-600 rounded-2xl w-16 h-16 flex items-center justify-center mx-auto mb-6 border-2 border-black">
                <BarChart3 className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-black mb-4">Lead Generation</h3>
              <p className="text-black opacity-80">Capture qualified leads with interactive AR experiences</p>
            </div>
            <div className="bg-white rounded-2xl p-8 text-center border-2 border-black">
              <div className="bg-red-600 rounded-2xl w-16 h-16 flex items-center justify-center mx-auto mb-6 border-2 border-black">
                <Star className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-black mb-4">Brand Activation</h3>
              <p className="text-black opacity-80">Build memorable brand experiences that customers love</p>
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
              Everything you need to know about QuickScanAR
            </p>
          </div>
          <div className="space-y-8">
            <div className="bg-cream rounded-2xl p-8 border-2 border-black">
              <h3 className="text-xl font-bold text-black mb-4">What is AR marketing?</h3>
              <p className="text-black opacity-80 text-lg">
                AR marketing uses augmented reality technology to create interactive, immersive experiences that engage customers and drive conversions. It overlays digital content onto the real world through smartphones and other devices.
              </p>
            </div>
            <div className="bg-cream rounded-2xl p-8 border-2 border-black">
              <h3 className="text-xl font-bold text-black mb-4">Do I need technical skills to use QuickScanAR?</h3>
              <p className="text-black opacity-80 text-lg">
                Absolutely not! QuickScanAR is designed to be the world's simplest AR creator. Just upload an image and a video - that's it! No coding, no technical knowledge required.
              </p>
            </div>
            <div className="bg-cream rounded-2xl p-8 border-2 border-black">
              <h3 className="text-xl font-bold text-black mb-4">How long does it take to create an AR experience?</h3>
              <p className="text-black opacity-80 text-lg">
                Most users create their first AR experience in under 10 minutes. The 2-step process is incredibly fast: upload image + upload video = AR ready!
              </p>
            </div>
            <div className="bg-cream rounded-2xl p-8 border-2 border-black">
              <h3 className="text-xl font-bold text-black mb-4">What types of images work best for AR?</h3>
              <p className="text-black opacity-80 text-lg">
                High-contrast images with distinct features work best. Logos, product packaging, business cards, and printed materials are ideal. Our MindAR engine handles the rest automatically.
              </p>
            </div>
            <div className="bg-cream rounded-2xl p-8 border-2 border-black">
              <h3 className="text-xl font-bold text-black mb-4">Can I track the performance of my AR campaigns?</h3>
              <p className="text-black opacity-80 text-lg">
                Yes! Our analytics dashboard provides detailed insights into engagement, views, interactions, and conversion metrics to help you measure ROI and optimize your campaigns.
              </p>
            </div>
            <div className="bg-cream rounded-2xl p-8 border-2 border-black">
              <h3 className="text-xl font-bold text-black mb-4">Is there a limit to how many AR experiences I can create?</h3>
              <p className="text-black opacity-80 text-lg">
                Free users can create 1 AR experience. Monthly subscribers get 3 campaigns per month, and annual subscribers get 3 campaigns per month for 12 months at a discounted rate.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-red-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl lg:text-5xl font-bold text-white mb-6">
            Ready to Generate More Leads?
          </h2>
          <p className="text-xl text-white opacity-90 mb-8">
            Start your first campaign in minutes.
          </p>
          <Link
            href="/compiler"
            className="bg-white text-red-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-cream transition-colors inline-block border-2 border-white"
          >
            Start Creating Free
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
                The world's only 2-step AR experience creator. Upload image + Upload video = Professional AR ready in minutes.
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
            <p className="text-lg">&copy; 2024 QuickScanAR. All rights reserved.</p>
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
