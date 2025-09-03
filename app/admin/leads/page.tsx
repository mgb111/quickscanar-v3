"use client"

import { useEffect, useState } from 'react'

type Lead = {
  id: string
  created_at: string
  name: string
  email: string
  subject: string
  message: string
  user_id: string | null
  marker_key: string | null
  video_key: string | null
  marker_url?: string | null
  video_url?: string | null
  status: 'new' | 'in_progress' | 'done'
}

export default function LeadsAdminPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [error, setError] = useState<string | null>(null)

  const adminToken = process.env.NEXT_PUBLIC_ADMIN_DASHBOARD_TOKEN

  const fetchLeads = async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (statusFilter) params.set('status', statusFilter)
      const res = await fetch(`/api/leads?${params.toString()}`, {
        headers: { 'x-admin-token': adminToken || '' }
      })
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json()
      setLeads(data.leads || [])
    } catch (e: any) {
      setError(e?.message || 'Failed to load leads')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchLeads() }, [statusFilter])

  const updateStatus = async (id: string, status: Lead['status']) => {
    try {
      const res = await fetch('/api/leads', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': adminToken || ''
        },
        body: JSON.stringify({ id, status })
      })
      if (!res.ok) throw new Error(await res.text())
      await fetchLeads()
    } catch (e) {
      alert('Failed to update status')
    }
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Leads Admin</h1>

        <div className="flex items-center gap-3 mb-4">
          <label className="text-sm">Filter:</label>
          <select
            className="border px-2 py-1 rounded"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All</option>
            <option value="new">New</option>
            <option value="in_progress">In Progress</option>
            <option value="done">Done</option>
          </select>
          <button className="border px-3 py-1 rounded" onClick={fetchLeads}>Refresh</button>
        </div>

        {error && <div className="mb-4 text-red-700 bg-red-50 p-2 border">{error}</div>}
        {loading ? (
          <div>Loading…</div>
        ) : (
          <div className="overflow-x-auto border rounded">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="text-left p-2">Created</th>
                  <th className="text-left p-2">Name</th>
                  <th className="text-left p-2">Email</th>
                  <th className="text-left p-2">Subject</th>
                  <th className="text-left p-2">Files</th>
                  <th className="text-left p-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((l) => (
                  <tr key={l.id} className="border-t align-top">
                    <td className="p-2 whitespace-nowrap">{new Date(l.created_at).toLocaleString()}</td>
                    <td className="p-2">
                      <div className="font-medium">{l.name}</div>
                      <div className="text-gray-500 text-xs">{l.user_id || 'no user'}</div>
                    </td>
                    <td className="p-2">
                      <a href={`mailto:${l.email}`} className="text-blue-600 underline">{l.email}</a>
                    </td>
                    <td className="p-2">
                      <div className="font-medium">{l.subject}</div>
                      <pre className="text-xs text-gray-700 whitespace-pre-wrap max-w-xs">{l.message}</pre>
                    </td>
                    <td className="p-2 max-w-xs">
                      <div className="text-xs break-words">
                        {l.marker_url ? (
                          <a className="text-blue-600 underline" href={l.marker_url} target="_blank">Marker</a>
                        ) : l.marker_key ? (
                          <span title={l.marker_key}>marker key saved</span>
                        ) : (
                          <span>-</span>
                        )}
                        {' | '}
                        {l.video_url ? (
                          <a className="text-blue-600 underline" href={l.video_url} target="_blank">Video</a>
                        ) : l.video_key ? (
                          <span title={l.video_key}>video key saved</span>
                        ) : (
                          <span>-</span>
                        )}
                      </div>
                    </td>
                    <td className="p-2">
                      <select
                        className="border px-2 py-1 rounded"
                        value={l.status}
                        onChange={(e) => updateStatus(l.id, e.target.value as Lead['status'])}
                      >
                        <option value="new">New</option>
                        <option value="in_progress">In Progress</option>
                        <option value="done">Done</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
