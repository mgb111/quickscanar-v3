"use client"

import { useEffect, useMemo, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@supabase/supabase-js"
import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber"
import { ARButton, XR, Interactive } from "@react-three/xr"
import { TextureLoader, BackSide, Mesh, Vector3 } from "three"
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
  const texture = useLoader(TextureLoader, envUrl)
  
  return (
    <mesh>
      <sphereGeometry args={[500, 60, 40]} />
      <meshBasicMaterial
        map={texture}
        side={BackSide}
        stencilWrite={false}
        stencilRef={1}
        stencilFunc={invert ? 517 : 514}
        stencilFail={7680}
        stencilZFail={7680}
        stencilZPass={7680}
      />
    </mesh>
  )
}

// The portal itself - a floating, distorting plane
function PortalPlane({ 
  distance = 2, 
  scale = 1, 
  onSelect,
  colorWrite,
  depthWrite 
}: { 
  distance: number; 
  scale: number; 
  onSelect: () => void;
  colorWrite: boolean;
  depthWrite: boolean;
}) {
  return (
    <Interactive onSelect={onSelect}>
      <Float
        floatIntensity={3}
        rotationIntensity={1}
        speed={5}
        position={[0, 1.4, -distance]}
        scale={scale}
      >
        <mesh>
          <planeGeometry args={[1.5, 1.5, 128, 128]} />
          <MeshDistortMaterial
            distort={0.5}
            radius={1}
            speed={10}
            color="#4a90e2"
            colorWrite={colorWrite}
            depthWrite={depthWrite}
            stencilWrite={true}
            stencilRef={1}
            stencilFunc={colorWrite ? 519 : 512}
            stencilFail={7680}
            stencilZFail={7680}
            stencilZPass={7680}
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
  const lastSideRef = useRef<number>(0)
  
  useFrame(() => {
    // Calculate which side of the portal the camera is on
    const cameraZ = camera.position.z
    const portalZ = portalPosition.z
    const currentSide = Math.sign(cameraZ - portalZ)
    
    // Check if we crossed the portal plane
    if (lastSideRef.current !== 0 && currentSide !== lastSideRef.current) {
      // We crossed! Determine if we entered or exited
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
  const [colorWrite, setColorWrite] = useState(true)
  const depthWrite = false

  const envUrl = data?.portal_env_url || "https://cdn.aframe.io/360-image-gallery-boilerplate/img/sechelt.jpg"
  const distance = Number(data?.portal_distance ?? 2)
  const portalScale = Number(data?.portal_scale ?? 1)
  const portalPosition = useMemo(() => new Vector3(0, 1.4, -distance), [distance])

  const title = data?.title || "AR Portal"

  const handleSelect = () => {
    setInvert(!invert)
    setColorWrite(!colorWrite)
  }

  const handleWalkThrough = (entered: boolean) => {
    // Automatically invert when walking through
    setInvert(entered)
    setColorWrite(!entered)
  }

  return (
    <div style={{ height: "100vh", width: "100vw", background: "#000" }}>
      <div style={{ position: "fixed", top: 12, left: 0, right: 0, display: "flex", justifyContent: "center", zIndex: 5 }}>
        <div style={{ background: "rgba(0,0,0,0.55)", color: "#fff", border: "1px solid #000", borderRadius: 12, padding: "10px 14px", fontWeight: 700, fontSize: 14 }}>
          {invert ? "You are inside the portal world" : "Walk toward the portal to enter, or tap it"}
        </div>
      </div>

      <ARButton style={{ position: "fixed", bottom: 16, left: 16, zIndex: 6 }} />

      <Canvas camera={{ position: [0, 1.6, 5] }}>
        <XR>
          <ambientLight intensity={0.8} />
          <directionalLight position={[3, 5, 2]} intensity={1} />
          
          <PortalPlane
            distance={distance}
            scale={portalScale}
            onSelect={handleSelect}
            colorWrite={colorWrite}
            depthWrite={depthWrite}
          />
          
          <MaskedContent invert={invert} envUrl={envUrl} />
          
          <CameraTracker
            portalPosition={portalPosition}
            onWalkThrough={handleWalkThrough}
          />
        </XR>
      </Canvas>
    </div>
  )
}
