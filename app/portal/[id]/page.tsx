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
import { Float, MeshDistortMaterial } from "@react-three/drei"

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
function MaskedContent({ invert, envUrl }: { invert: boolean; envUrl: string }) {
  const [textureError, setTextureError] = useState(false)
  const texture = useLoader(
    TextureLoader, 
    envUrl,
    undefined,
    (error) => {
      console.error("Failed to load texture:", error)
      setTextureError(true)
    }
  )
  
  // Fallback color if texture fails
  if (textureError) {
    return (
      <mesh>
        <sphereGeometry args={[500, 60, 40]} />
        <meshBasicMaterial
          color="#87ceeb"
          side={BackSide}
          stencilWrite={false}
          stencilRef={1}
          stencilFunc={invert ? NotEqualStencilFunc : EqualStencilFunc}
          stencilFail={KeepStencilOp}
          stencilZFail={KeepStencilOp}
          stencilZPass={KeepStencilOp}
        />
      </mesh>
    )
  }
  
  return (
    <mesh>
      <sphereGeometry args={[500, 60, 40]} />
      <meshBasicMaterial
        map={texture}
        side={BackSide}
        stencilWrite={false}
        stencilRef={1}
        stencilFunc={invert ? NotEqualStencilFunc : EqualStencilFunc}
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
  invert
}: { 
  distance: number; 
  scale: number; 
  onSelect: () => void;
  invert: boolean;
}) {
  const meshRef = useRef<any>(null)
  
  // Debug: log portal position
  useEffect(() => {
    if (meshRef.current) {
      console.log("Portal position:", meshRef.current.position)
    }
  }, [])
  
  return (
    <Interactive onSelect={onSelect}>
      <Float
        floatIntensity={3}
        rotationIntensity={1}
        speed={5}
        position={[0, 1.4, -distance]}
        scale={scale}
      >
        <mesh ref={meshRef}>
          <planeGeometry args={[1.5, 1.5, 128, 128]} />
          <MeshDistortMaterial
            distort={0.5}
            radius={1}
            speed={10}
            color="#4a90e2"
            colorWrite={!invert}
            depthWrite={true}
            stencilWrite={true}
            stencilRef={1}
            stencilFunc={AlwaysStencilFunc}
            stencilFail={KeepStencilOp}
            stencilZFail={KeepStencilOp}
            stencilZPass={ReplaceStencilOp}
            transparent={false}
            opacity={1}
          />
        </mesh>
      </Float>
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
      const entered = currentSide < 0
      console.log(`Portal crossed! Entered: ${entered}, Camera Z: ${cameraZ.toFixed(2)}, Portal Z: ${portalZ.toFixed(2)}`)
      onWalkThrough(entered)
    }
    
    lastSideRef.current = currentSide
  })
  
  return null
}

// Debug helper to show camera position
function DebugInfo() {
  const { camera } = useThree()
  const [pos, setPos] = useState({ x: 0, y: 0, z: 0 })
  
  useFrame(() => {
    setPos({
      x: camera.position.x,
      y: camera.position.y,
      z: camera.position.z
    })
  })
  
  return null
}

export default function PortalPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { data, loading, error } = useExperience(params.id)
  const [invert, setInvert] = useState(false)
  const [arSupported, setArSupported] = useState<boolean | null>(null)
  const [showDebug, setShowDebug] = useState(false)

  const envUrl = data?.portal_env_url || "https://cdn.aframe.io/360-image-gallery-boilerplate/img/sechelt.jpg"
  const distance = Number(data?.portal_distance ?? 2)
  const portalScale = Number(data?.portal_scale ?? 1)
  const portalPosition = useMemo(() => new Vector3(0, 1.4, -distance), [distance])

  const title = data?.title || "AR Portal"

  const handleSelect = () => {
    console.log("Portal tapped! Inverting:", !invert)
    setInvert(!invert)
  }

  const handleWalkThrough = (entered: boolean) => {
    console.log("Walk through detected! Entered:", entered)
    setInvert(entered)
  }

  // Check WebXR AR support on mount
  useEffect(() => {
    let mounted = true
    async function check() {
      try {
        const supported = !!(navigator as any).xr && await (navigator as any).xr.isSessionSupported?.("immersive-ar")
        if (mounted) {
          setArSupported(!!supported)
          console.log("AR Support:", !!supported)
        }
      } catch (err) {
        console.error("AR support check failed:", err)
        if (mounted) setArSupported(false)
      }
    }
    check()
    return () => { mounted = false }
  }, [])

  // Log when invert changes
  useEffect(() => {
    console.log("Invert state changed:", invert)
  }, [invert])

  // Render nothing until we know support
  if (arSupported === null) {
    return (
      <div style={{ height: "100vh", width: "100vw", display: "flex", alignItems: "center", justifyContent: "center", background: "#000" }}>
        <div style={{ color: "#fff", fontSize: 16 }}>Checking AR support...</div>
      </div>
    )
  }

  return (
    <div style={{ height: "100vh", width: "100vw", background: "transparent" }}>
      {/* Instructions / status bar */}
      <div style={{ position: "fixed", top: 12, left: 0, right: 0, display: "flex", justifyContent: "center", zIndex: 1001 }}>
        <div style={{ background: "rgba(0,0,0,0.7)", color: "#fff", border: "1px solid #000", borderRadius: 12, padding: "10px 14px", fontWeight: 700, fontSize: 14 }}>
          {invert ? "🌍 Inside the portal world" : arSupported ? "👁️ Walk toward the portal to enter another world" : "⚠️ AR not supported on this device/browser"}
        </div>
      </div>

      {/* Debug toggle button */}
      <button
        onClick={() => setShowDebug(!showDebug)}
        style={{ 
          position: "fixed", 
          top: 60, 
          right: 12, 
          zIndex: 1001,
          background: "rgba(0,0,0,0.7)",
          color: "#fff",
          border: "1px solid #fff",
          borderRadius: 8,
          padding: "8px 12px",
          fontSize: 12
        }}
      >
        {showDebug ? "Hide" : "Show"} Debug
      </button>

      {/* Debug info */}
      {showDebug && (
        <div style={{ 
          position: "fixed", 
          bottom: 80, 
          left: 12, 
          zIndex: 1001,
          background: "rgba(0,0,0,0.8)",
          color: "#fff",
          border: "1px solid #fff",
          borderRadius: 8,
          padding: "10px",
          fontSize: 11,
          fontFamily: "monospace"
        }}>
          <div>Portal Distance: {distance}m</div>
          <div>Portal Scale: {portalScale}x</div>
          <div>Portal Z: {portalPosition.z.toFixed(2)}</div>
          <div>Inverted: {invert ? "Yes" : "No"}</div>
          <div>Env: {envUrl.split('/').pop()}</div>
        </div>
      )}

      {/* Show ARButton only if AR is supported */}
      {arSupported && (
        <ARButton 
          style={{ 
            position: "fixed", 
            bottom: 16, 
            left: 16, 
            zIndex: 1002,
            padding: "12px 24px",
            fontSize: 16,
            fontWeight: 700,
            borderRadius: 8
          }} 
        />
      )}

      {/* Only render the XR scene when supported */}
      {arSupported && (
        <Canvas
          camera={{ position: [0, 1.6, 5], fov: 75 }}
          gl={{ 
            alpha: true, 
            antialias: true,
            stencil: true,
            preserveDrawingBuffer: true
          }}
          onCreated={({ gl }) => {
            gl.setClearColor(0x000000, 0)
            console.log("Canvas created, stencil bits:", gl.getContextAttributes()?.stencil)
          }}
          style={{ background: "transparent" }}
        >
          <XR>
            <ambientLight intensity={0.8} />
            <directionalLight position={[3, 5, 2]} intensity={1} />

            {/* Render portal elements only when an AR session is active */}
            <RenderWhenPresenting>
              <PortalPlane
                distance={distance}
                scale={portalScale}
                onSelect={handleSelect}
                invert={invert}
              />
              <MaskedContent invert={invert} envUrl={envUrl} />
              <CameraTracker
                portalPosition={portalPosition}
                onWalkThrough={handleWalkThrough}
              />
              {showDebug && <DebugInfo />}
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
  
  useEffect(() => {
    console.log("XR Presenting:", isPresenting)
  }, [isPresenting])
  
  if (!isPresenting) return null
  return <>{children}</>
}