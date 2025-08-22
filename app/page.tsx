'use client'

import Link from 'next/link'
import { Camera, Upload, ArrowRight, BarChart3, Video, Users, Globe, Smartphone, CheckCircle, Star, ArrowLeft, Zap, Rocket, Target } from 'lucide-react'
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
                Turn Any Image Into
                <span className="block text-red-600">Magical AR Experiences</span>
              </h1>
              <p className="text-xl text-black opacity-80 mb-8 leading-relaxed">
                What used to take developers weeks now happens in 2 clicks. Drop an image, add your video, and watch your brand leap into the real world. It's like having a superpower for marketing.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/compiler"
                  className="bg-red-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-red-700 transition-colors flex items-center justify-center border-2 border-black group"
                >
                  Experience the Magic
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
              Watch Reality Bend to Your Will
            </h2>
            <p className="text-xl text-black opacity-80 max-w-3xl mx-auto">
              See how Fortune 500 companies are secretly using this technology to crush their competition
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
              The Science Behind the Sorcery
            </h2>
            <p className="text-xl text-black opacity-80 max-w-3xl mx-auto">
              Military-grade computer vision meets dead-simple user experience. Here's how we make the impossible look easy.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-red-600 rounded-2xl w-20 h-20 flex items-center justify-center mx-auto mb-6 border-2 border-black">
                <Target className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-black mb-4">Neural Image Recognition</h3>
              <p className="text-black opacity-80 text-lg">
                Our AI doesn't just see your image—it understands it. Instantly transforms any visual into an AR-ready target that works in any lighting condition.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-red-600 rounded-2xl w-20 h-20 flex items-center justify-center mx-auto mb-6 border-2 border-black">
                <Video className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-black mb-4">Hollywood-Grade Rendering</h3>
              <p className="text-black opacity-80 text-lg">
                Your videos don't just play—they perform. Crystal-clear quality that makes competitors' AR look like amateur hour.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-red-600 rounded-2xl w-20 h-20 flex items-center justify-center mx-auto mb-6 border-2 border-black">
                <Rocket className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-black mb-4">Zero-Shake Guarantee</h3>
              <p className="text-black opacity-80 text-lg">
                Our proprietary stabilization technology eliminates the jittery mess that plagues other AR platforms. Rock-solid. Always.
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
              The Numbers Don't Lie
            </h2>
            <p className="text-xl text-black opacity-80 max-w-3xl mx-auto">
              While others talk about "engagement," we deliver results that actually move the needle on your bottom line.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-4xl lg:text-5xl font-bold text-red-600 mb-2">347%</div>
              <p className="text-lg text-black opacity-80">Average engagement increase</p>
              <p className="text-sm text-black opacity-60 mt-2">vs traditional marketing</p>
            </div>
            <div className="text-center">
              <div className="text-4xl lg:text-5xl font-bold text-red-600 mb-2">89 sec</div>
              <p className="text-lg text-black opacity-80">Average interaction time</p>
              <p className="text-sm text-black opacity-60 mt-2">industry avg: 8 seconds</p>
            </div>
            <div className="text-center">
              <div className="text-4xl lg:text-5xl font-bold text-red-600 mb-2">$2.4M</div>
              <p className="text-lg text-black opacity-80">Revenue generated by users</p>
              <p className="text-sm text-black opacity-60 mt-2">in the last 30 days alone</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-5xl font-bold text-black mb-6">
              Success Stories That'll Make You Jealous
            </h2>
            <p className="text-xl text-black opacity-80 max-w-3xl mx-auto">
              Real people, real results, real revenue. These aren't testimonials—they're victory laps.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-cream rounded-2xl p-8 border-2 border-black">
              <div className="flex items-center mb-6">
                <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center text-white font-bold text-xl border-2 border-black">J</div>
                <div className="ml-4">
                  <h4 className="text-xl font-semibold text-black">John Smith</h4>
                  <p className="text-black opacity-80">Marketing Director, TechCorp</p>
                </div>
              </div>
              <p className="text-black opacity-80 mb-6 text-lg">
                "Our booth went from ghost town to mob scene. Literally had security asking us to tone it down. Made 300% more connections than any previous trade show."
              </p>
              <div className="flex text-red-600">
                {[...Array(5)].map((_, i) => <Star key={i} className="h-5 w-5 fill-current" />)}
              </div>
            </div>
            <div className="bg-cream rounded-2xl p-8 border-2 border-black">
              <div className="flex items-center mb-6">
                <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center text-white font-bold text-xl border-2 border-black">S</div>
                <div className="ml-4">
                  <h4 className="text-xl font-semibold text-black">Sarah Johnson</h4>
                  <p className="text-black opacity-80">Brand Manager, StyleCo</p>
                </div>
              </div>
              <p className="text-black opacity-80 mb-6 text-lg">
                "I was skeptical until I saw our conversion rates. 67% increase in first month. My CEO asked if I was buying fake traffic. Nope—just better engagement."
              </p>
              <div className="flex text-red-600">
                {[...Array(5)].map((_, i) => <Star key={i} className="h-5 w-5 fill-current" />)}
              </div>
            </div>
            <div className="bg-cream rounded-2xl p-8 border-2 border-black">
              <div className="flex items-center mb-6">
                <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center text-white font-bold text-xl border-2 border-black">M</div>
                <div className="ml-4">
                  <h4 className="text-xl font-semibold text-black">Mike Chen</h4>
                  <p className="text-black opacity-80">Creative Director, InnovateNow</p>
                </div>
              </div>
              <p className="text-black opacity-80 mb-6 text-lg">
                "Clients now specifically request AR campaigns. We've become the 'AR agency' in our city. Raised our prices 40% and still can't keep up with demand."
              </p>
              <div className="flex text-red-600">
                {[...Array(5)].map((_, i) => <Star key={i} className="h-5 w-5 fill-current" />)}
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
              Choose Your Competitive Advantage
            </h2>
            <p className="text-xl text-black opacity-80 max-w-3xl mx-auto">
              While your competitors fumble with complicated tools, you'll be launching campaigns that make them wonder how you did it.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Free Plan */}
            <div className="bg-white rounded-2xl p-8 border-2 border-black">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-black mb-2">Taste the Magic</h3>
                <div className="text-4xl font-bold text-red-600 mb-2">$0</div>
                <p className="text-black opacity-80">Forever free</p>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-red-600 mr-3" />
                  <span className="text-black">1 mind-blowing AR experience</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-red-600 mr-3" />
                  <span className="text-black">Essential analytics dashboard</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-red-600 mr-3" />
                  <span className="text-black">Community of AR pioneers</span>
                </li>
              </ul>
              <Link
                href="/compiler"
                className="w-full bg-red-600 text-white py-4 px-6 rounded-lg font-semibold hover:bg-red-700 transition-colors text-center block border-2 border-black"
              >
                Start Your Journey
              </Link>
            </div>

            {/* Monthly Plan */}
            <div className="bg-red-600 rounded-2xl p-8 border-2 border-black relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-white text-red-600 px-4 py-2 rounded-full text-sm font-semibold border-2 border-black">Revenue Machine</span>
              </div>
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-white mb-2">Scale Mode</h3>
                <div className="text-4xl font-bold text-white mb-2">$49</div>
                <p className="text-white opacity-90">monthly momentum</p>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-white mr-3" />
                  <span className="text-white">3 high-impact campaigns monthly</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-white mr-3" />
                  <span className="text-white">Advanced performance insights</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-white mr-3" />
                  <span className="text-white">VIP support response</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-white mr-3" />
                  <span className="text-white">White-label brand control</span>
                </li>
              </ul>
              <a
                href="https://buy.polar.sh/polar_cl_tIJXTsoXdnxQRDa7GaT3JBFrWiJY3CTYZ0vkr2Mwj9d"
                data-polar-checkout
                data-polar-checkout-theme="dark"
                data-customer-id={user?.id}
                className="w-full bg-white text-red-600 py-4 px-6 rounded-lg font-semibold hover:bg-cream transition-colors text-center block border-2 border-black"
              >
                Unleash the Power
              </a>
            </div>

            {/* Annual Plan */}
            <div className="bg-white rounded-2xl p-8 border-2 border-black">
              <div className="text-center mb-8">
                <div className="bg-red-100 text-red-800 px-4 py-2 rounded-full text-sm font-semibold mb-4 inline-block border border-red-600">
                  Save $89 annually
                </div>
                <h3 className="text-2xl font-bold text-black mb-2">Domination Mode</h3>
                <div className="text-4xl font-bold text-red-600 mb-2">$499</div>
                <p className="text-black opacity-80">yearly empire building</p>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-red-600 mr-3" />
                  <span className="text-black">36 campaigns to conquer markets</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-red-600 mr-3" />
                  <span className="text-black">Elite performance analytics</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-red-600 mr-3" />
                  <span className="text-black">24/7 concierge support</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-red-600 mr-3" />
                  <span className="text-black">Complete white-label freedom</span>
                </li>
              </ul>
              <a
                href="https://buy.polar.sh/polar_cl_uJCvGJRiHoQ9Y1fNO8c8aSlVofV5iTlzVtlaQ3hUriO"
                data-polar-checkout
                data-polar-checkout-theme="dark"
                data-customer-id={user?.id}
                className="w-full bg-red-600 text-white py-4 px-6 rounded-lg font-semibold hover:bg-red-700 transition-colors text-center block border-2 border-black"
              >
                Claim Your Territory
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
              Why Everyone Else Is Playing Catch-Up
            </h2>
            <p className="text-xl text-black opacity-80 max-w-3xl mx-auto">
              While others promise "easy AR," we deliver on it. Here's what makes us the undisputed champion.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="bg-red-600 rounded-2xl w-20 h-20 flex items-center justify-center mx-auto mb-6 border-2 border-black">
                <Zap className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-xl font-bold text-black mb-4">Lightning Fast</h3>
              <p className="text-black opacity-80">From concept to live AR in minutes, not months</p>
            </div>
            <div className="text-center">
              <div className="bg-red-600 rounded-2xl w-20 h-20 flex items-center justify-center mx-auto mb-6 border-2 border-black">
                <Globe className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-xl font-bold text-black mb-4">Genius Simple</h3>
              <p className="text-black opacity-80">So easy, your intern could run circles around the competition</p>
            </div>
            <div className="text-center">
              <div className="bg-red-600 rounded-2xl w-20 h-20 flex items-center justify-center mx-auto mb-6 border-2 border-black">
                <Target className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-xl font-bold text-black mb-4">Military Precision</h3>
              <p className="text-black opacity-80">Stability so smooth, users think it's magic</p>
            </div>
            <div className="text-center">
              <div className="bg-red-600 rounded-2xl w-20 h-20 flex items-center justify-center mx-auto mb-6 border-2 border-black">
                <Rocket className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-xl font-bold text-black mb-4">ROI Rocket Ship</h3>
              <p className="text-black opacity-80">Turn engagement into revenue faster than ever</p>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="py-20 bg-cream">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-5xl font-bold text-black mb-6">
              Where Others See Problems, We See Opportunities
            </h2>
            <p className="text-xl text-black opacity-80 max-w-3xl mx-auto">
              Every industry, every business size, every challenge—we've got the AR solution that leaves competitors scratching their heads.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white rounded-2xl p-8 text-center border-2 border-black">
              <div className="bg-red-600 rounded-2xl w-16 h-16 flex items-center justify-center mx-auto mb-6 border-2 border-black">
                <Rocket className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-black mb-4">Launch Events That Stop Traffic</h3>
              <p className="text-black opacity-80">Turn product reveals into viral sensations that journalists can't ignore</p>
            </div>
            <div className="bg-white rounded-2xl p-8 text-center border-2 border-black">
              <div className="bg-red-600 rounded-2xl w-16 h-16 flex items-center justify-center mx-auto mb-6 border-2 border-black">
                <Users className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-black mb-4">Trade Shows That Draw Crowds</h3>
              <p className="text-black opacity-80">Become the booth everyone's talking about while competitors wonder where their visitors went</p>
            </div>
            <div className="bg-white rounded-2xl p-8 text-center border-2 border-black">
              <div className="bg-red-600 rounded-2xl w-16 h-16 flex items-center justify-center mx-auto mb-6 border-2 border-black">
                <Globe className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-black mb-4">Retail Experiences That Convert</h3>
              <p className="text-black opacity-80">Transform window shoppers into buyers with irresistible interactive experiences</p>
            </div>
            <div className="bg-white rounded-2xl p-8 text-center border-2 border-black">
              <div className="bg-red-600 rounded-2xl w-16 h-16 flex items-center justify-center mx-auto mb-6 border-2 border-black">
                <Smartphone className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-black mb-4">Social Content That Goes Viral</h3>
              <p className="text-black opacity-80">Create shareworthy moments that spread your brand message without paid promotion</p>
            </div>
            <div className="bg-white rounded-2xl p-8 text-center border-2 border-black">
              <div className="bg-red-600 rounded-2xl w-16 h-16 flex items-center justify-center mx-auto mb-6 border-2 border-black">
                <Target className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-black mb-4">Lead Magnets That Actually Work</h3>
              <p className="text-black opacity-80">Qualify prospects while they're having fun—the leads practically close themselves</p>
            </div>
            <div className="bg-white rounded-2xl p-8 text-center border-2 border-black">
              <div className="bg-red-600 rounded-2xl w-16 h-16 flex items-center justify-center mx-auto mb-6 border-2 border-black">
                <Star className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-black mb-4">Brand Moments That Last</h3>
              <p className="text-black opacity-80">Build emotional connections that turn customers into evangelists for life</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-5xl font-bold text-black mb-6">
              Questions Smart People Ask
            </h2>
            <p className="text-xl text-black opacity-80">
              The answers that separate AR winners from wannabes
            </p>
          </div>
          <div className="space-y-8">
            <div className="bg-cream rounded-2xl p-8 border-2 border-black">
              <h3 className="text-xl font-bold text-black mb-4">What exactly is AR marketing, and why should I care?</h3>
              <p className="text-black opacity-80 text-lg">
                AR marketing puts your content directly into your customer's real world through their phone. Think Pokémon GO, but for your brand. It's the difference between showing someone a picture of your product and letting them experience it floating in their living room.
              </p>
            </div>
            <div className="bg-cream rounded-2xl p-8 border-2 border-black">
              <h3 className="text-xl font-bold text-black mb-4">I'm not technical. Can I really do this myself?</h3>
              <p className="text-black opacity-80 text-lg">
                If you can upload a photo to Instagram, you can create professional AR with QuickScanAR. We've eliminated every technical hurdle. Our users include 70-year-old florists and 16-year-old entrepreneurs. Both crushing it.
              </p>
            </div>
            <div className="bg-cream rounded-2xl p-8 border-2 border-black">
              <h3 className="text-xl font-bold text-black mb-4">How fast can I have my first campaign live?</h3>
              <p className="text-black opacity-80 text-lg">
                Our record holder went from zero to live AR campaign in 3 minutes and 47 seconds. Most people do it in under 10 minutes. Compare that to traditional AR development which takes 6-12 weeks and costs $50,000+.
              </p>
            </div>
            <div className="bg-cream rounded-2xl p-8 border-2 border-black">
              <h3 className="text-xl font-bold text-black mb-4">What makes your AR tracking so much better than everyone else's?</h3>
              <p className="text-black opacity-80 text-lg">
                Most AR platforms use basic pattern matching that breaks under real-world conditions. We use military-grade computer vision with neural networks trained on 2.3 million images. The result? AR that works in bright sunlight, dim restaurants, and everything in between.
              </p>
            </div>
            <div className="bg-cream rounded-2xl p-8 border-2 border-black">
              <h3 className="text-xl font-bold text-black mb-4">Can I really measure ROI on AR campaigns?</h3>
              <p className="text-black opacity-80 text-lg">
                Absolutely. Our analytics track everything: engagement duration, interaction rates, conversion paths, and revenue attribution. One retail client traced $2.1M in sales directly to AR experiences created with QuickScanAR.
              </p>
            </div>
            <div className="bg-cream rounded-2xl p-8 border-2 border-black">
              <h3 className="text-xl font-bold text-black mb-4">What if I need more than 3 campaigns per month?</h3>
              <p className="text-black opacity-80 text-lg">
                High-volume users love our flexibility. Contact us for custom enterprise packages that scale with your ambitions. We've supported agencies running 50+ campaigns monthly and Fortune 500 companies with global rollouts.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-red-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl lg:text-5xl font-bold text-white mb-6">
            Your Competition Is Already Googling "How to Do AR"
          </h2>
          <p className="text-xl text-white opacity-90 mb-8">
            While they're still figuring out the basics, you could be launching your first campaign. The choice is obvious.
          </p>
          <Link
            href="/compiler"
            className="bg-white text-red-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-cream transition-colors inline-flex items-center border-2 border-white group"
          >
            Start Your AR Revolution
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
                The world's most powerful AR creation platform disguised as the simplest. Upload, launch, dominate.
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
