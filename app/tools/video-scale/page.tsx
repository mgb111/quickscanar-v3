"use client"

import React, { useEffect, useMemo, useRef, useState } from "react"

export default function VideoScaleToolPage() {
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [scale, setScale] = useState<number>(1)
  const [markerSize, setMarkerSize] = useState<number>(400) // px square representing 1.0 x 1.0 marker
  const [videoMeta, setVideoMeta] = useState<{ width: number; height: number } | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)

  // Receive video URL via postMessage from opener
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (!e?.data) return
      const { type, videoUrl: url, markerSizePx } = e.data || {}
      if (type === "VIDEO_SCALE_PREVIEW" && typeof url === "string") {
        setVideoUrl(url)
        if (markerSizePx && typeof markerSizePx === "number") setMarkerSize(Math.max(200, Math.min(800, markerSizePx)))
      }
    }
    window.addEventListener("message", handler)
    return () => window.removeEventListener("message", handler)
  }, [])

  // Allow quick +/- adjustments
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "+" || e.key === "=") setScale((s) => Math.min(5, +(s + 0.05).toFixed(2)))
      if (e.key === "-" || e.key === "_") setScale((s) => Math.max(0.2, +(s - 0.05).toFixed(2)))
      if (e.key === "0") setScale(1)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  const baseDims = useMemo(() => {
    if (!videoMeta) return { w: markerSize, h: markerSize }
    const aspect = videoMeta.width > 0 && videoMeta.height > 0 ? videoMeta.width / videoMeta.height : 1
    // Fit video to marker (1x1) while preserving aspect
    if (aspect >= 1) {
      // landscape: width matches marker, height derived
      const w = markerSize
      const h = Math.max(1, w / aspect)
      return { w, h }
    } else {
      // portrait: height matches marker, width derived
      const h = markerSize
      const w = Math.max(1, h * aspect)
      return { w, h }
    }
  }, [videoMeta, markerSize])

  const scaledDims = useMemo(() => ({ w: baseDims.w * scale, h: baseDims.h * scale }), [baseDims, scale])

  return (
    <div style={{ fontFamily: "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto", padding: 16, color: "#111" }}>
      <h1 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Video Scale Preview (Non-destructive)</h1>
      <p style={{ marginBottom: 16, opacity: 0.75 }}>
        This tool previews your video against a 1×1 marker and lets you adjust scale from 0.2x to 5x.
        It does not change your saved AR experience.
      </p>

      <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
        <div>
          <label style={{ fontWeight: 600 }}>Scale</label>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button onClick={() => setScale((s) => Math.max(0.2, +(s - 0.1).toFixed(2)))} style={btnStyle}>-</button>
            <input
              type="range"
              min={0.2}
              max={5}
              step={0.01}
              value={scale}
              onChange={(e) => setScale(parseFloat(e.target.value))}
              style={{ width: 240 }}
            />
            <button onClick={() => setScale((s) => Math.min(5, +(s + 0.1).toFixed(2)))} style={btnStyle}>+</button>
            <input
              type="number"
              min={0.2}
              max={5}
              step={0.01}
              value={scale}
              onChange={(e) => setScale(Number.isFinite(+e.target.value) ? Math.max(0.2, Math.min(5, +e.target.value)) : 1)}
              style={{ width: 80, padding: 6, border: "1px solid #000", borderRadius: 8 }}
            />
            <button onClick={() => setScale(1)} style={btnStyle}>Reset</button>
          </div>
        </div>

        <div>
          <label style={{ fontWeight: 600 }}>Marker Size</label>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input
              type="range"
              min={200}
              max={800}
              step={10}
              value={markerSize}
              onChange={(e) => setMarkerSize(parseInt(e.target.value, 10))}
            />
            <div style={{ width: 62, textAlign: "right" }}>{markerSize}px</div>
          </div>
        </div>

        <div style={{ marginLeft: "auto", opacity: videoUrl ? 1 : 0.6 }}>
          <span style={{ fontSize: 12 }}>Tip: press + / - to adjust, 0 to reset</span>
        </div>
      </div>

      <div style={{ marginTop: 16, display: "flex", gap: 24, alignItems: "flex-start", flexWrap: "wrap" }}>
        <div>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>Marker (1×1)</div>
          <div
            style={{
              position: "relative",
              width: markerSize,
              height: markerSize,
              border: "2px solid #000",
              borderRadius: 12,
              background: "#fff",
              overflow: "hidden",
            }}
          >
            {/* Center crosshair grid for reference */}
            <div style={{ position: "absolute", left: 0, top: "50%", width: "100%", height: 1, background: "rgba(0,0,0,.15)" }} />
            <div style={{ position: "absolute", top: 0, left: "50%", height: "100%", width: 1, background: "rgba(0,0,0,.15)" }} />

            {videoUrl ? (
              <video
                ref={videoRef}
                src={videoUrl}
                muted
                loop
                playsInline
                autoPlay
                onLoadedMetadata={() => {
                  if (videoRef.current) {
                    const v = videoRef.current
                    setVideoMeta({ width: v.videoWidth || 0, height: v.videoHeight || 0 })
                    v.play().catch(() => {})
                  }
                }}
                style={{
                  position: "absolute",
                  left: "50%",
                  top: "50%",
                  width: scaledDims.w,
                  height: scaledDims.h,
                  transform: "translate(-50%, -50%)",
                  objectFit: "cover",
                  borderRadius: 8,
                  boxShadow: "0 6px 16px rgba(0,0,0,.2)",
                  background: "#000",
                }}
              />
            ) : (
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "#555", fontSize: 14 }}>
                Waiting for video...
              </div>
            )}
          </div>
        </div>

        <div style={{ minWidth: 260 }}>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>Details</div>
          <div style={infoRow}><span>Scale</span><span>{scale.toFixed(2)}x</span></div>
          <div style={infoRow}><span>Marker</span><span>{markerSize} × {markerSize}px</span></div>
          <div style={infoRow}><span>Base size</span><span>{Math.round(baseDims.w)} × {Math.round(baseDims.h)}px</span></div>
          <div style={infoRow}><span>Scaled size</span><span>{Math.round(scaledDims.w)} × {Math.round(scaledDims.h)}px</span></div>
          <div style={infoRow}><span>Video</span><span>{videoMeta ? `${videoMeta.width} × ${videoMeta.height}` : "–"}</span></div>
        </div>
      </div>

      <div style={{ marginTop: 16, fontSize: 12, opacity: 0.7 }}>
        Note: This view is for visual reference only and does not change your saved experience.
      </div>
    </div>
  )
}

const btnStyle: React.CSSProperties = {
  padding: "8px 12px",
  border: "1px solid #000",
  borderRadius: 8,
  background: "#fff",
  cursor: "pointer",
}

const infoRow: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
  padding: "8px 0",
  borderBottom: "1px dashed rgba(0,0,0,.1)",
}
