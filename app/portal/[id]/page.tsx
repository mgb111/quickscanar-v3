"use client"

import { useEffect, useMemo, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@supabase/supabase-js"
import { Canvas, useFrame, useLoader } from "@react-three/fiber"
import { ARButton, XR } from "@react-three/xr"
import { TextureLoader, BackSide, Mesh } from "three"

// Minimal Supabase client (public anon) for client-side fetch
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
const supabase = (supabaseUrl && supabaseAnonKey) ? createClient(supabaseUrl, supabaseAnonKey) : null

function useExperience(id: string) {
  const [data, setData] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    async function run() {
      try {
        if (!supabase) throw new Error("Supabase not configured")
        const { data, error } = await supabase
          .from("ar_experiences")
          .select("id, title, portal_env_url, portal_distance, portal_scale, content_type")
          .eq("id", id)
          .maybeSingle()
        if (error) throw error
        if (mounted) setData(data)
      } catch (e: any) {
        if (mounted) setError(e?.message || "Failed to fetch experience")
      } finally {
        if (mounted) setLoading(false)
      }
    }
    run()
    return () => { mounted = false }
  }, [id])

  return { data, loading, error }
}

function PortalObject({ envUrl = "", distance = 2, scale = 1, onEnter }: { envUrl: string; distance: number; scale: number; onEnter: () => void }) {
  const tex = useLoader(TextureLoader, envUrl)
  const ringRef = useRef<Mesh>(null)

  useFrame((state, delta) => {
    if (ringRef.current) {
      ringRef.current.rotation.z += delta * 0.4
    }
  })

  return (
    <group position={[0, 1.4, -distance]} scale={scale}>
      <mesh ref={ringRef} onClick={onEnter}>
        <torusGeometry args={[0.5, 0.06, 16, 100]} />
        <meshStandardMaterial color="#ffffff" metalness={0.6} roughness={0.2} />
      </mesh>
      <mesh position={[0, 0, -0.01]} onClick={onEnter}>
        <sphereGeometry args={[0.75, 32, 32]} />
        <meshStandardMaterial map={tex} side={BackSide} />
      </mesh>
    </group>
  )
}

function ImmersiveSky({ envUrl = "" }: { envUrl: string }) {
  const tex = useLoader(TextureLoader, envUrl)
  return (
    <mesh>
      <sphereGeometry args={[25, 64, 64]} />
      <meshBasicMaterial map={tex} side={BackSide} />
    </mesh>
  )
}

export default function PortalPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { data, loading, error } = useExperience(params.id)
  const [inside, setInside] = useState(false)

  const envUrl = data?.portal_env_url || "https://cdn.aframe.io/360-image-gallery-boilerplate/img/sechelt.jpg"
  const distance = Number(data?.portal_distance ?? 2)
  const portalScale = Number(data?.portal_scale ?? 1)

  const title = data?.title || "AR Portal"

  return (
    <div style={{ height: "100vh", width: "100vw", background: "#000" }}>
      <div style={{ position: "fixed", top: 12, left: 0, right: 0, display: "flex", justifyContent: "center", zIndex: 5 }}>
        <div style={{ background: "rgba(0,0,0,0.55)", color: "#fff", border: "1px solid #000", borderRadius: 12, padding: "10px 14px", fontWeight: 700, fontSize: 14 }}>
          {inside ? "You are inside the portal" : "Tap the portal to enter. Tap Exit to return."}
        </div>
      </div>

      <ARButton style={{ position: "fixed", bottom: 16, left: 16, zIndex: 6 }} />
      {inside && (
        <button
          onClick={() => setInside(false)}
          style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", zIndex: 6, background: "#111827", color: "#fff", border: "2px solid #000", borderRadius: 9999, padding: "12px 18px", fontWeight: 800, boxShadow: "0 8px 20px rgba(0,0,0,.35)" }}
        >
          Exit portal
        </button>
      )}

      <Canvas>
        <XR>
          <ambientLight intensity={0.8} />
          <directionalLight position={[3, 5, 2]} intensity={1} />
          {inside ? (
            <ImmersiveSky envUrl={envUrl} />
          ) : (
            <PortalObject envUrl={envUrl} distance={distance} scale={portalScale} onEnter={() => setInside(true)} />
          )}
        </XR>
      </Canvas>
    </div>
  )
}
