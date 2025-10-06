"use client"

import { useEffect, useMemo, useRef, useState } from "react"

export default function VideoScalePreviewPage() {
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [naturalSize, setNaturalSize] = useState<{ w: number; h: number } | null>(null)
  const [scale, setScale] = useState(1)
  const [status, setStatus] = useState<string>("Waiting for video...")
  const [lastSent, setLastSent] = useState<string>("")
  const videoRef = useRef<HTMLVideoElement | null>(null)

  // Listen for the opener to pass the video URL
  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      try {
        if (typeof window !== "undefined" && e.origin !== window.location.origin) return
        const data = e.data || {}
        if (data?.type === "VIDEO_SCALE_PREVIEW" && data?.videoUrl) {
          setVideoUrl(data.videoUrl)
          setStatus("Video received. Loading...")
        }
      } catch {}
    }
    window.addEventListener("message", onMsg)
    // Request data from opener if possible
    try {
      window.opener?.postMessage({ type: "VIDEO_SCALE_PREVIEW_HANDSHAKE" }, window.location.origin)
    } catch {}
    return () => window.removeEventListener("message", onMsg)
  }, [])

  // When video loads metadata, capture natural dimensions
  const handleLoadedMetadata = () => {
    const v = videoRef.current
    if (!v) return
    const w = v.videoWidth
    const h = v.videoHeight
    if (w && h) {
      setNaturalSize({ w, h })
      setStatus("")
    }
  }

  const aspect = useMemo(() => {
    if (!naturalSize) return 1
    return naturalSize.w / naturalSize.h
  }, [naturalSize])

  // Base size in marker units (marker is 1 x 1). Maintain aspect.
  // Landscape: width = 1, height = 1 / aspect. Portrait: height = 1, width = aspect.
  const baseDims = useMemo(() => {
    if (!naturalSize) return { w: 1, h: 1 }
    if (aspect >= 1) {
      return { w: 1, h: Math.max(1 / aspect, 0.0001) }
    }
    return { w: Math.max(aspect, 0.0001), h: 1 }
  }, [naturalSize, aspect])

  const scaledDims = useMemo(() => ({ w: baseDims.w * scale, h: baseDims.h * scale }), [baseDims, scale])

  const handleReset = () => setScale(1)
  const handleFitWidth = () => {
    // Scale so that width matches marker width 1
    if (baseDims.w > 0) setScale(1 / baseDims.w)
  }
  const handleFitHeight = () => {
    // Scale so that height matches marker height 1
    if (baseDims.h > 0) setScale(1 / baseDims.h)
  }

  // Keyboard shortcuts: +/- to change scale
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "+") setScale((s) => Math.min(5, +(s + 0.05).toFixed(2)))
      if (e.key === "=") setScale((s) => Math.min(5, +(s + 0.05).toFixed(2)))
      if (e.key === "-") setScale((s) => Math.max(0.2, +(s - 0.05).toFixed(2)))
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  // Post selected scale back to opener in real time (throttled)
  useEffect(() => {
    const send = () => {
      try {
        window.opener?.postMessage({ type: 'VIDEO_SCALE_SELECTED', scale }, window.location.origin)
        setLastSent(new Date().toLocaleTimeString())
      } catch {}
    }
    const t = setTimeout(send, 150)
    return () => clearTimeout(t)
  }, [scale])

  const confirmSend = () => {
    try {
      window.opener?.postMessage({ type: 'VIDEO_SCALE_SELECTED', scale }, window.location.origin)
      setLastSent(new Date().toLocaleTimeString())
    } catch {}
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f5f5dc", color: "#111", padding: 16 }}>
      <div style={{ display: "flex", gap: 16, alignItems: "flex-start", flexWrap: "wrap" }}>
        {/* Controls */}
        <div style={{ flex: "0 0 340px", background: "#fff", border: "2px solid #000", borderRadius: 12, padding: 16, boxShadow: "0 8px 20px rgba(0,0,0,0.1)" }}>
          <h2 style={{ margin: "0 0 12px", fontSize: 20 }}>Video Scale Preview</h2>
          <p style={{ margin: "0 0 12px", color: "#333" }}>
            Marker is 1×1 units. Adjust scale to see real-time size against marker.
          </p>

          <div style={{ marginTop: 12 }}>
            <label htmlFor="scale" style={{ fontWeight: 600 }}>Scale: {scale.toFixed(2)}×</label>
            <input
              id="scale"
              type="range"
              min={0.2}
              max={5}
              step={0.01}
              value={scale}
              onChange={(e) => setScale(parseFloat(e.target.value))}
              style={{ width: "100%", marginTop: 8 }}
            />
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <input
                type="number"
                min={0.2}
                max={5}
                step={0.01}
                value={scale}
                onChange={(e) => setScale(Math.min(5, Math.max(0.2, Number(e.target.value) || 1)))}
                style={{ width: 120, padding: 8, border: "1px solid #000", borderRadius: 8 }}
              />
              <button onClick={handleReset} style={btnStyle}>Reset 1×</button>
              <button onClick={handleFitWidth} style={btnStyle}>Fit Width</button>
              <button onClick={handleFitHeight} style={btnStyle}>Fit Height</button>
              <button onClick={confirmSend} style={btnStyle}>Use This Scale</button>
            </div>
          </div>

          <div style={{ marginTop: 16, fontSize: 14, lineHeight: 1.5 }}>
            <div><strong>Video natural:</strong> {naturalSize ? `${naturalSize.w}×${naturalSize.h}` : "—"}</div>
            <div><strong>Aspect:</strong> {aspect.toFixed(3)}</div>
            <div><strong>Base (marker units):</strong> {baseDims.w.toFixed(3)} × {baseDims.h.toFixed(3)}</div>
            <div><strong>Scaled (marker units):</strong> {scaledDims.w.toFixed(3)} × {scaledDims.h.toFixed(3)}</div>
          </div>

          {status && (
            <div style={{ marginTop: 12, color: "#b91c1c", fontWeight: 600 }}>{status}</div>
          )}

          {lastSent && (
            <div style={{ marginTop: 8, fontSize: 12, color: '#333' }}>Last sent: {lastSent}</div>
          )}

          <div style={{ marginTop: 12, fontSize: 12, color: "#444" }}>
            Tip: Use + / - keys to fine-tune scale.
          </div>
        </div>

        {/* Stage */}
        <div style={{ flex: "1 1 600px", minWidth: 360 }}>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>Stage</div>
          {/* Marker board (square). 600×600 px for clear view */}
          <div
            style={{
              position: "relative",
              width: 600,
              height: 600,
              background: "#fafafa",
              border: "2px solid #000",
              borderRadius: 12,
              boxShadow: "inset 0 0 0 2px #000",
              overflow: "hidden",
            }}
          >
            {/* Grid to visualize marker units */}
            <Grid />

            {/* Marker bounds (1x1) */}
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                width: 600, // marker width = 1 unit mapped to 600px
                height: 600, // marker height = 1 unit mapped to 600px
                outline: "2px dashed #dc2626",
                outlineOffset: -2,
                borderRadius: 8,
              }}
            />

            {/* Video plane scaled to marker units */}
            {videoUrl && (
              <div
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  width: scaledDims.w * 600, // 1 marker unit = 600px
                  height: scaledDims.h * 600,
                  boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
                  background: "#000",
                  borderRadius: 6,
                  overflow: "hidden",
                  border: "2px solid #000",
                }}
              >
                <video
                  ref={videoRef}
                  src={videoUrl}
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="metadata"
                  onLoadedMetadata={handleLoadedMetadata}
                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function Grid() {
  // Simple 10x10 grid
  const cells = []
  for (let y = 0; y < 10; y++) {
    for (let x = 0; x < 10; x++) {
      const key = `${x}-${y}`
      cells.push(
        <div
          key={key}
          style={{
            position: "absolute",
            left: x * 60,
            top: y * 60,
            width: 60,
            height: 60,
            border: "1px solid rgba(0,0,0,0.08)",
          }}
        />
      )
    }
  }
  // Axes
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      {cells}
      <div style={{ position: "absolute", left: 300, top: 0, bottom: 0, width: 2, background: "rgba(0,0,0,0.2)" }} />
      <div style={{ position: "absolute", top: 300, left: 0, right: 0, height: 2, background: "rgba(0,0,0,0.2)" }} />
    </div>
  )
}

const btnStyle: React.CSSProperties = {
  padding: "8px 12px",
  border: "2px solid #000",
  borderRadius: 10,
  background: "#dc2626",
  color: "#fff",
  fontWeight: 700,
  cursor: "pointer",
}
