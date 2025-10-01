export const metadata = {
  title: 'Custom AR Experience – Coming Soon',
  description: 'This link will host a specialized custom AR experience soon.'
}

export default function Page() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-cream p-6">
      <div className="bg-white border-2 border-black rounded-2xl shadow-xl max-w-xl w-full p-8 text-center">
        <div className="mx-auto mb-4 w-16 h-16 rounded-full flex items-center justify-center" style={{ background: '#dc2626' }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'white' }}>
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
            <circle cx="12" cy="13" r="4"/>
          </svg>
        </div>
        <h1 className="text-2xl font-extrabold text-black mb-2">Custom AR Experience</h1>
        <p className="text-black opacity-80 mb-6">Coming soon. Keep this link/QR — well activate the experience here later.</p>
        <div className="text-left bg-cream rounded-xl border border-black/20 p-4">
          <h2 className="text-sm font-semibold text-black mb-2">Link details</h2>
          <ul className="text-sm text-black/80 space-y-1">
            <li><strong>URL:</strong> <span className="break-all">/exp/jatin-card-1</span></li>
            <li><strong>Status:</strong> Placeholder active</li>
            <li><strong>Next step:</strong> We can wire this to a specific AR experience when ready.</li>
          </ul>
        </div>
      </div>
    </main>
  )
}
