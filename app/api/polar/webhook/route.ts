// DEPRECATED: This file is no longer used with Make.com integration
// Make.com now handles Polar webhooks and updates Supabase directly
// This file can be removed or kept for reference

import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  console.log('⚠️  DEPRECATED: Polar webhook endpoint no longer used')
  console.log('ℹ️  Subscriptions are now managed via Make.com integration')
  console.log('📋 See MAKE_SETUP_GUIDE.md for configuration details')
  
  return NextResponse.json({ 
    message: 'This endpoint is deprecated. Subscriptions are managed via Make.com.',
    status: 'deprecated'
  }, { status: 200 })
}
