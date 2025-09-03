import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function requireAdmin(request: NextRequest) {
  const token = request.headers.get('x-admin-token')
  const expected = process.env.ADMIN_DASHBOARD_TOKEN
  if (!expected || token !== expected) {
    return false
  }
  return true
}

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key)
}

export async function GET(request: NextRequest) {
  if (!requireAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const supabase = getSupabaseAdmin()
  if (!supabase) return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')

  let query = supabase.from('leads').select('*').order('created_at', { ascending: false })
  if (status) {
    query = query.eq('status', status)
  }
  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ leads: data })
}

export async function PATCH(request: NextRequest) {
  if (!requireAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const supabase = getSupabaseAdmin()
  if (!supabase) return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })

  const body = await request.json()
  const { id, status } = body
  const allowed = ['new', 'in_progress', 'done']
  if (!id || !allowed.includes(status)) {
    return NextResponse.json({ error: 'Invalid id or status' }, { status: 400 })
  }
  const { error } = await supabase.from('leads').update({ status }).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
