'use client'

import Link from 'next/link'
import { Camera, ArrowRight, BarChart3, Globe, CheckCircle, Zap, User, FileText, Tag, Home as HomeIcon, Monitor, Files, Mail, Newspaper, Quote } from 'lucide-react'
import { AuthProvider, useAuth } from '@/components/AuthProvider'
import Header from '@/components/Header'
import { useAnalytics } from '@/lib/useAnalytics';
import { useState } from 'react'

function HomePage() {
  const { user, loading, signOut } = useAuth()
  const { trackEvent, trackUserEngagement } = useAnalytics()

  // Upload modal state
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [markerFile, setMarkerFile] = useState<File | null>(null)
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const openUploadModal = () => {
    setErrorMsg(null)
    setSubmitted(false)
    setShowUploadModal(true)
  }

  const closeUploadModal = () => {
    if (submitting) return
    setShowUploadModal(false)
  }

  const handleSubmitUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)
    if (!name || !email) {
      setErrorMsg('Please provide your name and email so we can contact you.')
      return
    }
    if (!markerFile || !videoFile) {
      setErrorMsg('Please upload both a marker photo and a video.')
      return
    }
    try {
      setSubmitting(true)
      // 1) Get signed URLs
      const imgReq = await fetch('/api/upload/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: `${Date.now()}_${markerFile.name}`,
          contentType: markerFile.type,
        }),
      })
      if (!imgReq.ok) throw new Error(`Image signing failed: ${await imgReq.text()}`)
      const imgData = await imgReq.json()

      const vidReq = await fetch('/api/upload/video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: `${Date.now()}_${videoFile.name}`,
          contentType: videoFile.type,
        }),
      })
      if (!vidReq.ok) throw new Error(`Video signing failed: ${await vidReq.text()}`)
      const vidData = await vidReq.json()

      // 2) Upload files to signed URLs
      const putImg = await fetch(imgData.signedUrl, {
        method: 'PUT',
        headers: { 'Content-Type': markerFile.type },
        body: markerFile,
      })
      if (!putImg.ok) {
        const errTxt = await putImg.text().catch(() => '')
        throw new Error(`Failed to upload marker image (status ${putImg.status}): ${errTxt}`)
      }

      const putVid = await fetch(vidData.signedUrl, {
        method: 'PUT',
        headers: { 'Content-Type': videoFile.type },
        body: videoFile,
      })
      if (!putVid.ok) {
        const errTxt = await putVid.text().catch(() => '')
        throw new Error(`Failed to upload video (status ${putVid.status}): ${errTxt}`)
      }

      // 3) Notify support with the uploaded keys (and user info if available)
      const subject = 'Free Custom AR Request (Landing Page)'
      const msg = [
        'A new free AR request was submitted from the landing page.',
        `Name: ${name}`,
        `Email: ${email}`,
        user?.id ? `User ID: ${user.id}` : 'User ID: not logged in',
        '',
        `Marker key: ${imgData.key}`,
        `Video key: ${vidData.key}`,
      ].join('\n')

      const supportRes = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name, 
          email, 
          subject, 
          message: msg,
          markerKey: imgData.key,
          videoKey: vidData.key,
          userId: user?.id || null
        }),
      })
      if (!supportRes.ok) throw new Error(`Support request failed: ${await supportRes.text()}`)

      setSubmitted(true)
    } catch (err: any) {
      console.error(err)
      setErrorMsg(err?.message || 'Upload failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

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
                QuickScanAR <span className="text-red-600">Professional AR Creation Service</span>
              </h1>
              <p className="text-xl text-black opacity-80 leading-relaxed">
                We create AR experiences that make your listings unforgettable.
              </p>
              <p className="text-lg text-black opacity-80 mb-8 leading-relaxed">
                Professional AR creation service for busy real estate agents. Send us your property photos and videos — we’ll deliver stunning AR experiences in 24 hours.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="#"
                  onClick={(e) => {
                    e.preventDefault()
                    trackEvent('click', 'cta', 'hero_create_ar_experience')
                    trackUserEngagement('cta_click', 'hero_section', 'button')
                    openUploadModal()
                  }}
                  className="bg-red-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-red-700 transition-colors flex items-center justify-center border-2 border-black group"
                >
                  Get Your First AR Experience Free
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

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={closeUploadModal} />
          <div className="relative bg-white w-full max-w-lg mx-4 rounded-2xl border-2 border-black shadow-xl p-6">
            {!submitted ? (
              <form onSubmit={handleSubmitUpload}>
                <h3 className="text-2xl font-bold text-black mb-2">Submit Your Materials</h3>
                <p className="text-black/70 mb-6">Upload a marker photo and a video. We will get back to you within 24 hours.</p>

                {errorMsg && (
                  <div className="mb-4 text-red-700 bg-red-50 border border-red-200 rounded-md p-3">{errorMsg}</div>
                )}

                <div className="grid grid-cols-1 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-semibold text-black mb-1">Your Name</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full border-2 border-black rounded-lg p-2"
                      placeholder="Jane Agent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-black mb-1">Your Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full border-2 border-black rounded-lg p-2"
                      placeholder="jane@example.com"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-semibold text-black mb-1">Marker Photo</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setMarkerFile(e.target.files?.[0] || null)}
                      className="w-full border-2 border-dashed border-black rounded-lg p-3"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-black mb-1">Video</label>
                    <input
                      type="file"
                      accept="video/*"
                      onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
                      className="w-full border-2 border-dashed border-black rounded-lg p-3"
                      required
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={closeUploadModal}
                    className="px-4 py-2 rounded-lg border-2 border-black hover:bg-cream"
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 rounded-lg bg-red-600 text-white font-semibold border-2 border-black hover:bg-red-700 disabled:opacity-60"
                  >
                    {submitting ? 'Submitting...' : 'Submit Materials'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="text-center">
                <h3 className="text-2xl font-bold text-black mb-3">Thanks! 🎉</h3>
                <p className="text-black/80 mb-6">We received your materials. We will get back to you within 24 hours.</p>
                <button
                  onClick={closeUploadModal}
                  className="px-5 py-2 rounded-lg bg-red-600 text-white font-semibold border-2 border-black hover:bg-red-700"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Interactive Product Walkthrough */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-5xl font-bold text-black mb-6">
              How Our Service Works (Simple 3-Step Process)
            </h2>
            <p className="text-xl text-black opacity-80 max-w-3xl mx-auto">
              Just send us your content — we handle everything else
            </p>
          </div>
          
          {/* 3-Step Process */}
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <div className="text-center">
              <div className="bg-red-600 rounded-2xl w-16 h-16 flex items-center justify-center mx-auto mb-6 border-2 border-black">
                <span className="text-2xl font-bold text-white">1</span>
              </div>
              <h3 className="text-xl font-bold text-black mb-4">Send Your Materials</h3>
              <p className="text-black opacity-80">Email us your property photos, videos, and any special requests</p>
            </div>
            
            <div className="text-center">
              <div className="bg-red-600 rounded-2xl w-16 h-16 flex items-center justify-center mx-auto mb-6 border-2 border-black">
                <span className="text-2xl font-bold text-white">2</span>
              </div>
              <h3 className="text-xl font-bold text-black mb-4">We Create Your AR Experience</h3>
              <p className="text-black opacity-80">Our team builds your professional AR experience within 24 hours</p>
            </div>
            
            <div className="text-center">
              <div className="bg-red-600 rounded-2xl w-16 h-16 flex items-center justify-center mx-auto mb-6 border-2 border-black">
                <span className="text-2xl font-bold text-white">3</span>
              </div>
              <h3 className="text-xl font-bold text-black mb-4">Get Your Links & QR Codes</h3>
              <p className="text-black opacity-80">Receive everything ready to share — links, QR codes, and usage instructions</p>
            </div>
          </div>

        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-5xl font-bold text-black mb-6">
              Why Top Agents Choose Our AR Creation Service
            </h2>
            <p className="text-xl text-black opacity-80 max-w-3xl mx-auto">
              Built for speed, quality, and results
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-red-600 rounded-2xl w-20 h-20 flex items-center justify-center mx-auto mb-6 border-2 border-black">
                <Zap className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-black mb-4">Zero Learning Curve</h3>
              <p className="text-black opacity-80 text-lg">No software to learn or technical skills needed. Just send materials and get results.</p>
            </div>
            <div className="text-center">
              <div className="bg-red-600 rounded-2xl w-20 h-20 flex items-center justify-center mx-auto mb-6 border-2 border-black">
                <BarChart3 className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-black mb-4">Professional Quality Guaranteed</h3>
              <p className="text-black opacity-80 text-lg">Every AR experience meets luxury real estate standards.</p>
            </div>
            <div className="text-center">
              <div className="bg-red-600 rounded-2xl w-20 h-20 flex items-center justify-center mx-auto mb-6 border-2 border-black">
                <Globe className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-black mb-4">24-Hour Turnaround</h3>
              <p className="text-black opacity-80 text-lg">Send materials today, start wowing buyers tomorrow.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Real Estate Use Cases (image grid) */}
      <section className="py-20 bg-cream">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-5xl font-bold text-black mb-6">Real Estate Applications We Create</h2>
            <p className="text-xl text-black opacity-80 max-w-3xl mx-auto">Transform any marketing material into an AR experience</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* 1. Business cards */}
            <div className="bg-white rounded-2xl border-2 border-black shadow p-6 text-center">
              <div className="bg-red-600 rounded-2xl w-16 h-16 flex items-center justify-center mb-4 border-2 border-black mx-auto">
                <User className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-black">Business Cards & Flyers</h3>
              <p className="text-black opacity-80 text-sm mt-2">Professional intro videos, property showcases, or portfolio highlights.</p>
            </div>

            {/* 2. Flyers & brochures */}
            <div className="bg-white rounded-2xl border-2 border-black shadow p-6 text-center">
              <div className="bg-red-600 rounded-2xl w-16 h-16 flex items-center justify-center mb-4 border-2 border-black mx-auto">
                <FileText className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-black">Yard Signs & Riders</h3>
              <p className="text-black opacity-80 text-sm mt-2">Property walkthroughs, drone footage, or agent introductions.</p>
            </div>

            {/* 3. Yard sign riders */}
            <div className="bg-white rounded-2xl border-2 border-black shadow p-6 text-center">
              <div className="bg-red-600 rounded-2xl w-16 h-16 flex items-center justify-center mb-4 border-2 border-black mx-auto">
                <Tag className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-black">Open House Materials</h3>
              <p className="text-black opacity-80 text-sm mt-2">Virtual tours, scheduling links, or property highlight reels.</p>
            </div>

            {/* 4. Open house signs */}
            <div className="bg-white rounded-2xl border-2 border-black shadow p-6 text-center">
              <div className="bg-red-600 rounded-2xl w-16 h-16 flex items-center justify-center mb-4 border-2 border-black mx-auto">
                <HomeIcon className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-black">Listing Sheets & Brochures</h3>
              <p className="text-black opacity-80 text-sm mt-2">Interactive tours, mortgage calculators, or contact information.</p>
            </div>

            {/* 5. Window posters / office displays */}
            <div className="bg-white rounded-2xl border-2 border-black shadow p-6 text-center">
              <div className="bg-red-600 rounded-2xl w-16 h-16 flex items-center justify-center mb-4 border-2 border-black mx-auto">
                <Monitor className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-black">Direct Mail & Print Ads</h3>
              <p className="text-black opacity-80 text-sm mt-2">3D walkthroughs, testimonials, or compelling agent pitches.</p>
            </div>

            {/* 6. Listing sheets */}
            <div className="bg-white rounded-2xl border-2 border-black shadow p-6 text-center">
              <div className="bg-red-600 rounded-2xl w-16 h-16 flex items-center justify-center mb-4 border-2 border-black mx-auto">
                <Files className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-black">Window Displays</h3>
              <p className="text-black opacity-80 text-sm mt-2">After-hours property viewing and showing scheduling.</p>
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
            <h2 className="text-3xl lg:text-5xl font-bold text-black mb-6">What Our Clients Say</h2>
            <p className="text-xl text-black opacity-80 max-w-3xl mx-auto">Real results from top real estate professionals</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Luxury Broker */}
            <div className="bg-white rounded-2xl p-8 border-2 border-black shadow transition-shadow">
              <Quote className="h-8 w-8 text-red-600 mb-4" />
              <p className="text-black text-lg italic leading-8">
                "I sent them a basic listing photo and property video on Monday. By Tuesday, I had an AR experience that made my $12M listing look like something from the future. My sellers were blown away."
              </p>
              <div className="mt-6 border-t border-black/10 pt-4">
                <div className="text-black opacity-70 text-sm">Luxury Broker, Beverly Hills CA</div>
              </div>
            </div>

            {/* Brokerage Owner */}
            <div className="bg-white rounded-2xl p-8 border-2 border-black shadow transition-shadow">
              <Quote className="h-8 w-8 text-red-600 mb-4" />
              <p className="text-black text-lg italic leading-8">
                "The team at QuickScanAR created AR experiences for our entire office. Now every business card and flyer is interactive. Our brand looks cutting-edge compared to competitors."
              </p>
              <div className="mt-6 border-t border-black/10 pt-4">
                <div className="text-black opacity-70 text-sm">Brokerage Owner, Miami FL</div>
              </div>
            </div>

            {/* International Consultant */}
            <div className="bg-white rounded-2xl p-8 border-2 border-black shadow transition-shadow">
              <Quote className="h-8 w-8 text-red-600 mb-4" />
              <p className="text-black text-lg italic leading-8">
                "In Dubai's competitive market, I needed something special. Their AR experiences give me that 'wow factor' that gets buyers excited before they even visit the property."
              </p>
              <div className="mt-6 border-t border-black/10 pt-4">
                <div className="text-black opacity-70 text-sm">Real Estate Consultant, Dubai</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-5xl font-bold text-black mb-6">Frequently Asked Questions</h2>
            <p className="text-xl text-black opacity-80">Everything you need to know before getting started</p>
          </div>
          <div className="space-y-8">
            <div className="bg-cream rounded-2xl p-8 border-2 border-black">
              <h3 className="text-xl font-bold text-black mb-4">How quickly can you create my AR experience?</h3>
              <p className="text-black opacity-80 text-lg">Standard turnaround is 24 hours. Rush orders (same-day) available for urgent listings.</p>
            </div>
            <div className="bg-cream rounded-2xl p-8 border-2 border-black">
              <h3 className="text-xl font-bold text-black mb-4">What materials do I need to send?</h3>
              <p className="text-black opacity-80 text-lg">Just your target image (listing photo, flyer, business card) and your video content. We handle everything else.</p>
            </div>
            <div className="bg-cream rounded-2xl p-8 border-2 border-black">
              <h3 className="text-xl font-bold text-black mb-4">What if I don't have a property video?</h3>
              <p className="text-black opacity-80 text-lg">We can work with photos, create slideshow videos, or recommend local videographers in your area.</p>
            </div>
            <div className="bg-cream rounded-2xl p-8 border-2 border-black">
              <h3 className="text-xl font-bold text-black mb-4">Can this work for printed materials?</h3>
              <p className="text-black opacity-80 text-lg">Absolutely! We optimize AR experiences to work perfectly with business cards, flyers, brochures, and yard signs.</p>
            </div>
            <div className="bg-cream rounded-2xl p-8 border-2 border-black">
              <h3 className="text-xl font-bold text-black mb-4">Do you provide the QR codes?</h3>
              <p className="text-black opacity-80 text-lg">Yes! You receive everything ready to use: shareable links, high-resolution QR codes, and printing instructions.</p>
            </div>
            <div className="bg-cream rounded-2xl p-8 border-2 border-black">
              <h3 className="text-xl font-bold text-black mb-4">Can I make changes after creation?</h3>
              <p className="text-black opacity-80 text-lg">First revision is included free. Additional changes available for a small fee.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Service Packages Section */}
      <section className="py-20 bg-cream">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-5xl font-bold text-black mb-6">Service Packages</h2>
            <p className="text-xl text-black opacity-80 max-w-3xl mx-auto">Done-for-you AR creation with fast turnaround</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Starter Package */}
            <div className="bg-white rounded-2xl p-8 border-2 border-black">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-black mb-2">Starter Package</h3>
                <div className="text-4xl font-bold text-red-600 mb-2">$49</div>
                <p className="text-black opacity-80">per AR experience</p>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center"><CheckCircle className="h-5 w-5 text-red-600 mr-3" />Professional AR creation</li>
                <li className="flex items-center"><CheckCircle className="h-5 w-5 text-red-600 mr-3" />24-hour turnaround</li>
                <li className="flex items-center"><CheckCircle className="h-5 w-5 text-red-600 mr-3" />Shareable links & QR codes</li>
                <li className="flex items-center"><CheckCircle className="h-5 w-5 text-red-600 mr-3" />One free revision</li>
                <li className="flex items-center"><CheckCircle className="h-5 w-5 text-red-600 mr-3" />Email support</li>
              </ul>
              <Link href="/support" className="w-full bg-red-600 text-white py-4 px-6 rounded-lg font-semibold hover:bg-red-700 transition-colors text-center block border-2 border-black">Get Started</Link>
            </div>

            {/* Agent Package */}
            <div className="bg-red-600 rounded-2xl p-8 border-2 border-black relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <span className="bg-white text-red-600 px-4 py-2 rounded-full text-sm font-semibold border-2 border-black">Most Popular</span>
              </div>
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-white mb-2">Agent Package</h3>
                <div className="text-4xl font-bold text-white mb-2">$129</div>
                <p className="text-white opacity-90">for 3 AR experiences</p>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center"><CheckCircle className="h-5 w-5 text-white mr-3" /><span className="text-white">Everything in Starter</span></li>
                <li className="flex items-center"><CheckCircle className="h-5 w-5 text-white mr-3" /><span className="text-white">Priority 12-hour turnaround</span></li>
                <li className="flex items-center"><CheckCircle className="h-5 w-5 text-white mr-3" /><span className="text-white">Custom branding options</span></li>
                <li className="flex items-center"><CheckCircle className="h-5 w-5 text-white mr-3" /><span className="text-white">Phone support</span></li>
                <li className="flex items-center"><CheckCircle className="h-5 w-5 text-white mr-3" /><span className="text-white">Usage analytics dashboard</span></li>
              </ul>
              <Link href="/support" className="w-full bg-white text-red-600 py-4 px-6 rounded-lg font-semibold hover:bg-cream transition-colors text-center block border-2 border-black">Choose Agent Package</Link>
            </div>

            {/* Brokerage Package */}
            <div className="bg-white rounded-2xl p-8 border-2 border-black">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-black mb-2">Brokerage Package</h3>
                <div className="text-4xl font-bold text-red-600 mb-2">$399</div>
                <p className="text-black opacity-80">for 10 AR experiences</p>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center"><CheckCircle className="h-5 w-5 text-red-600 mr-3" />Everything in Agent Package</li>
                <li className="flex items-center"><CheckCircle className="h-5 w-5 text-red-600 mr-3" />Same-day rush available</li>
                <li className="flex items-center"><CheckCircle className="h-5 w-5 text-red-600 mr-3" />Dedicated account manager</li>
                <li className="flex items-center"><CheckCircle className="h-5 w-5 text-red-600 mr-3" />Team training session</li>
                <li className="flex items-center"><CheckCircle className="h-5 w-5 text-red-600 mr-3" />Volume discounts available</li>
              </ul>
              <Link href="/contact" className="w-full bg-red-600 text-white py-4 px-6 rounded-lg font-semibold hover:bg-red-700 transition-colors text-center block border-2 border-black">Contact for Brokerage Pricing</Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-red-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl lg:text-5xl font-bold text-white mb-6">Ready to Transform Your Marketing?</h2>
          <p className="text-xl text-white opacity-90 mb-8">
            Send us your first property materials today and see the AR difference. No contracts. No setup fees. Just results.
          </p>
          <Link
            href="#"
            onClick={(e) => {
              e.preventDefault()
              trackEvent('click', 'cta', 'final_section_create_ar')
              trackUserEngagement('cta_click', 'final_section', 'button')
              openUploadModal()
            }}
            className="bg-white text-red-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-cream transition-colors inline-flex items-center border-2 border-white group"
          >
            Get My Free Custom AR Experience
            <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="space-y-4">
            <div className="text-2xl font-bold">QuickScanAR</div>
            <p className="text-white/80 text-lg">
              Professional AR creation platform that makes interactive experiences accessible to realtors of all sizes. Simple, powerful, and results-driven.
            </p>
            <div className="text-white/80 text-lg">&copy; 2025 QuickScanAR. All rights reserved.</div>
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
