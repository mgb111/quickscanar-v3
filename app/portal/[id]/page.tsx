"use client"

import { useEffect, useMemo, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@supabase/supabase-js"
import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber"
import { ARButton, XR, Interactive, useXR } from "@react-three/xr"
import { 
  TextureLoader, 
  BackSide, 
  Vector3,
  AlwaysStencilFunc,
  EqualStencilFunc,
  NotEqualStencilFunc,
  ReplaceStencilOp,
  KeepStencilOp
} from "three"
import { MeshDistortMaterial, Edges } from "@react-three/drei"

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

// Component that shows the portal world through the mask
function MaskedContent({ invert, envUrl, supportsStencil }: { invert: boolean; envUrl: string; supportsStencil: boolean }) {
  const texture = useLoader(TextureLoader, envUrl)
  
  // Fallback: without stencil, only render full environment when "inside"
  if (!supportsStencil && !invert) return null

  return (
    <mesh>
      <sphereGeometry args={[500, 60, 40]} />
      <meshBasicMaterial
        map={texture}
        side={BackSide}
        // Enable stencil read/write only when supported
        stencilWrite={supportsStencil}
        stencilRef={1}
        // Outside portal: show only where stencil equals 1 (through portal)
        // Inside portal: show where stencil does NOT equal 1 (everywhere but portal back)
        stencilFunc={supportsStencil ? (invert ? NotEqualStencilFunc : EqualStencilFunc) : AlwaysStencilFunc}
        stencilFail={KeepStencilOp}
        stencilZFail={KeepStencilOp}
        stencilZPass={KeepStencilOp}
      />
    </mesh>
  )
}

// The portal itself - a floating, distorting plane
function PortalPlane({ 
  distance = 2, 
  scale = 1, 
  onSelect,
  invert,
  supportsStencil,
  envUrl
}: { 
  distance: number; 
  scale: number; 
  onSelect: () => void;
  invert: boolean;
  supportsStencil: boolean;
  envUrl: string;
}) {
  // Door dimensions (meters)
  const doorWidth = 1.0
  const doorHeight = 2.1
  const previewTex = useLoader(TextureLoader, envUrl)
  return (
    <Interactive onSelect={onSelect}>
      {/* Stencil writer: invisible portal window, bottom at y=0 */}
      <mesh position={[0, doorHeight / 2, -distance]} scale={scale}>
        <planeGeometry args={[doorWidth, doorHeight, 64, 64]} />
        <MeshDistortMaterial
          distort={0.25}
          radius={1}
          speed={6}
          color="#4a90e2"
          colorWrite={!supportsStencil ? true : false}
          depthWrite={!supportsStencil ? true : false}
          stencilWrite={supportsStencil}
          stencilRef={1}
          stencilFunc={AlwaysStencilFunc}
          stencilFail={KeepStencilOp}
          stencilZFail={KeepStencilOp}
          stencilZPass={ReplaceStencilOp}
        />
        {/* Visible frame (edges only), does not affect stencil */}
        <Edges scale={1.002} color="#4a90e2" />
      </mesh>

      {/* iOS fallback preview: draw env preview on a slightly inset quad if stencil unsupported and not yet inside */}
      {!supportsStencil && !invert && (
        <mesh position={[0, doorHeight / 2 + 0.001, -distance + 0.001]} scale={scale}>
          <planeGeometry args={[doorWidth * 0.98, doorHeight * 0.98, 2, 2]} />
          <meshBasicMaterial map={previewTex} toneMapped={false} />
        </mesh>
      )}
    </Interactive>
  )
}

// Camera position tracker to detect walk-through
function CameraTracker({ 
  portalPosition, 
  onWalkThrough 
}: { 
  portalPosition: Vector3; 
  onWalkThrough: (entered: boolean) => void 
}) {
  const { camera } = useThree()
  const lastSideRef = useRef<number | null>(null)
  
  useFrame(() => {
    // Calculate which side of the portal the camera is on
    const cameraZ = camera.position.z
    const portalZ = portalPosition.z
    const currentSide = Math.sign(cameraZ - portalZ)
    
    // Initialize on first frame
    if (lastSideRef.current === null) {
      lastSideRef.current = currentSide
      return
    }
    
    // Check if we crossed the portal plane
    if (currentSide !== lastSideRef.current && currentSide !== 0) {
      // We crossed! Determine if we entered or exited
      // currentSide < 0 means camera is now on the negative Z side (inside/through the portal)
      onWalkThrough(currentSide < 0)
    }
    
    lastSideRef.current = currentSide
  })
  
  return null
}


export default function PortalPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { data, loading, error } = useExperience(params.id)
  const [invert, setInvert] = useState(false)
  const [arSupported, setArSupported] = useState<boolean | null>(null)
  const [supportsStencil, setSupportsStencil] = useState<boolean>(true)

  const envUrl = data?.portal_env_url || "https://cdn.aframe.io/360-image-gallery-boilerplate/img/sechelt.jpg"
  const distance = Number(data?.portal_distance ?? 2)
  const portalScale = Number(data?.portal_scale ?? 1)
  const portalPosition = useMemo(() => new Vector3(0, 1.4, -distance), [distance])

  const title = data?.title || "AR Portal"

  const handleSelect = () => {
    setInvert(!invert)
  }

  const handleWalkThrough = (entered: boolean) => {
    // Automatically invert when walking through
    setInvert(entered)
  }

  // Check WebXR AR support on mount
  useEffect(() => {
    let mounted = true
    async function check() {
      try {
        const supported = !!(navigator as any).xr && await (navigator as any).xr.isSessionSupported?.("immersive-ar")
        if (mounted) setArSupported(!!supported)
      } catch {
        if (mounted) setArSupported(false)
      }
    }
    check()
    return () => { mounted = false }
  }, [])

  // Detect stencil support after renderer is created and XR is presenting
  function XRStencilProbe() {
    const { gl } = useThree()
    const { isPresenting } = useXR()
    useEffect(() => {
      if (!isPresenting) return
      try {
        const attrs = (gl.getContextAttributes && gl.getContextAttributes()) || { stencil: false }
        setSupportsStencil(!!attrs.stencil)
      } catch {
        setSupportsStencil(false)
      }
    }, [gl, isPresenting])
    return null
  }

  // Render nothing until we know support
  if (arSupported === null) {
    return null
  }

  return (
    <div style={{ height: "100vh", width: "100vw", background: "transparent" }}>
      {/* Instructions / status bar */}
      <div style={{ position: "fixed", top: 12, left: 0, right: 0, display: "flex", justifyContent: "center", zIndex: 1001 }}>
        <div style={{ background: "rgba(0,0,0,0.55)", color: "#fff", border: "1px solid #000", borderRadius: 12, padding: "10px 14px", fontWeight: 700, fontSize: 14 }}>
          {invert ? "🌍 Inside the portal world" : arSupported ? "👁️ Walk toward the portal to enter another world" : "⚠️ AR not supported on this device/browser"}
        </div>
      </div>

      {/* Show ARButton only if AR is supported */}
      {arSupported && (
        <ARButton style={{ position: "fixed", bottom: 16, left: 16, zIndex: 1002 }} />
      )}

      {/* Only render the XR scene when supported. The portal content itself will render only when presenting. */}
      {arSupported && (
        <Canvas
          camera={{ position: [0, 1.6, 5] }}
          gl={{ 
            alpha: true, 
            antialias: true,
            stencil: true
          }}
          onCreated={({ gl }) => {
            gl.setClearColor(0x000000, 0)
          }}
          style={{ background: "transparent" }}
        >
          <XR
            referenceSpace="local-floor"
            sessionInit={{
              requiredFeatures: ["local-floor"],
              optionalFeatures: ["dom-overlay", "hit-test"],
              // @ts-ignore - domOverlay is part of sessionInit when dom-overlay is requested
              domOverlay: { root: typeof document !== "undefined" ? document.body : undefined }
            }}
          >
            <ambientLight intensity={0.8} />
            <directionalLight position={[3, 5, 2]} intensity={1} />
            <XRStencilProbe />

            {/* Render portal elements only when an AR session is active */}
            <RenderWhenPresenting>
              <PortalPlane
                distance={distance}
                scale={portalScale}
                onSelect={handleSelect}
                invert={invert}
                supportsStencil={supportsStencil}
                envUrl={envUrl}
              />
              <MaskedContent invert={invert} envUrl={envUrl} supportsStencil={supportsStencil} />
              <CameraTracker
                portalPosition={portalPosition}
                onWalkThrough={handleWalkThrough}
              />
            </RenderWhenPresenting>
          </XR>
        </Canvas>
      )}
    </div>
  )
}

// Helper component: renders children only when XR session is presenting
function RenderWhenPresenting({ children }: { children: React.ReactNode }) {
  const { isPresenting } = useXR()
  if (!isPresenting) return null
  return <>{children}</>
}
