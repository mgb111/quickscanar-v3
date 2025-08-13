import { NextRequest, NextResponse } from 'next/server'
import { mindarService } from '@/lib/mindar-service'

// Vercel function configuration
export const maxDuration = 30

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const jobId = searchParams.get('jobId')
  if (!jobId) return NextResponse.json({ error: 'jobId required' }, { status: 400 })

  const status = mindarService.getJobStatus(jobId)
  if (!status) return NextResponse.json({ error: 'Job not found' }, { status: 404 })
  return NextResponse.json({ success: true, ...status, jobId })
}
