'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'

interface HeaderProps {
  showCreateAR?: boolean
  showDashboard?: boolean
  showSignOut?: boolean
  showSignIn?: boolean
  showSignUp?: boolean
  showSkipToCreate?: boolean
  userEmail?: string
  onSignOut?: () => void
  className?: string
}

export default function Header({
  showCreateAR = false,
  showDashboard = false,
  showSignOut = false,
  showSignIn = false,
  showSignUp = false,
  showSkipToCreate = false,
  userEmail,
  onSignOut,
  className = ''
}: HeaderProps) {
  const [logoSrc, setLogoSrc] = useState<string>('/logo.png')
  return (
    <nav className={`bg-dark-blue shadow-sm ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            {/* Brand Logo - Always links to homepage */}
            <Link href="/" className="flex items-center hover:opacity-80 transition-opacity">
              <Image
                src={logoSrc}
                alt="QuickScanAR logo"
                width={28}
                height={28}
                priority
                onError={() => setLogoSrc('/logo.svg')}
              />
              <span className="ml-2 text-xl font-bold text-white">QuickScanAR</span>
            </Link>
          </div>
          
          <div className="flex items-center space-x-3 sm:space-x-4">
            {/* Skip to Create Experience (for compiler page) */}
            {showSkipToCreate && (
              <Link
                href="/dashboard/create"
                className="bg-white text-dark-blue px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors flex items-center"
              >
                Skip to Create Experience
                <svg className="h-4 w-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            )}
            
            {/* Create AR button */}
            {showCreateAR && (
              <Link
                href="/compiler"
                className="bg-white text-dark-blue px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-100 flex items-center ml-2 sm:ml-0 hidden sm:flex"
              >
                <svg className="h-4 w-4 mr-2 hidden sm:inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                Create AR
              </Link>
            )}
            
            {/* Dashboard link */}
            {showDashboard && (
              <Link
                href="/dashboard"
                className="bg-white text-dark-blue px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-100"
              >
                Dashboard
              </Link>
            )}
            
            {/* User email display */}
            {userEmail && (
              <span className="text-sm text-white">{userEmail}</span>
            )}
            
            {/* Sign Out button */}
            {showSignOut && (
              <button
                onClick={onSignOut}
                className="text-white hover:text-gray-200 px-3 py-2 rounded-md text-sm font-medium"
              >
                Sign Out
              </button>
            )}
            
            {/* Sign In link */}
            {showSignIn && (
              <Link
                href="/auth/signin"
                className="text-white hover:text-gray-200 px-3 py-2 rounded-md text-sm font-medium"
              >
                Sign In
              </Link>
            )}
            
            {/* Sign Up link */}
            {showSignUp && (
              <Link
                href="/auth/signup"
                className="text-white hover:text-gray-200 px-3 py-2 rounded-md text-sm font-medium"
              >
                Sign Up
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
