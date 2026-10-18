import { useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'

interface DirtPatches3DProps {
  cleanliness: number
  isWashing?: boolean
}

// Single organic cartoon mud blob with main core and satellite splatters
function MudBlob({
  position,
  rotation = [0, 0, 0],
  scale = 1,
  opacity = 0.8,
  splatterCount = 3,
}: {
  position: [number, number, number]
  rotation?: [number, number, number]
  scale?: number
  opacity?: number
  splatterCount?: number
}) {
  return (
    <group position={position} rotation={rotation} scale={scale}>
      {/* Central mud patch */}
      <mesh>
        <cylinderGeometry args={[0.22, 0.24, 0.02, 12]} />
        <meshStandardMaterial
          color="#52351A"
          roughness={0.94}
          metalness={0.02}
          transparent
          opacity={opacity}
          polygonOffset
          polygonOffsetFactor={-1}
        />
      </mesh>

      {/* Overlapping soft mud contour */}
      <mesh position={[0.06, 0.005, 0.04]} rotation={[0, 0.6, 0]}>
        <cylinderGeometry args={[0.15, 0.17, 0.022, 10]} />
        <meshStandardMaterial
          color="#3E240F"
          roughness={0.96}
          metalness={0.0}
          transparent
          opacity={opacity * 0.9}
          polygonOffset
          polygonOffsetFactor={-2}
        />
      </mesh>

      {/* Satellite mud splatter drops */}
      {splatterCount >= 1 && (
        <mesh position={[-0.24, 0.002, 0.12]}>
          <cylinderGeometry args={[0.045, 0.05, 0.018, 8]} />
          <meshStandardMaterial
            color="#52351A"
            roughness={0.95}
            transparent
            opacity={opacity * 0.85}
          />
        </mesh>
      )}
      {splatterCount >= 2 && (
        <mesh position={[0.22, 0.002, -0.15]}>
          <cylinderGeometry args={[0.055, 0.06, 0.018, 8]} />
          <meshStandardMaterial
            color="#462B13"
            roughness={0.95}
            transparent
            opacity={opacity * 0.85}
          />
        </mesh>
      )}
      {splatterCount >= 3 && (
        <mesh position={[-0.1, 0.002, -0.22]}>
          <cylinderGeometry args={[0.038, 0.042, 0.018, 8]} />
          <meshStandardMaterial
            color="#5A3A1E"
            roughness={0.95}
            transparent
            opacity={opacity * 0.8}
          />
        </mesh>
      )}
    </group>
  )
}

// Cute tiny cartoon fly that buzzes around Maxy when very dirty
function BuzzingFly() {
  const flyRef = useRef<THREE.Group>(null)
  const wingRef = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    if (!flyRef.current) return
    const t = state.clock.getElapsedTime()
    // Organic buzzing orbit
    const orbitAngle = t * 3.8
    const orbitRadiusX = 1.35 + Math.sin(t * 2.2) * 0.2
    const orbitRadiusZ = 0.95 + Math.cos(t * 1.9) * 0.2
    const height = 0.75 + Math.sin(t * 4.5) * 0.22

    flyRef.current.position.set(
      Math.sin(orbitAngle) * orbitRadiusX,
      height,
      Math.cos(orbitAngle) * orbitRadiusZ
    )

    // Jittery fly rotation
    flyRef.current.rotation.y = orbitAngle + Math.PI / 2 + Math.sin(t * 20) * 0.2
    flyRef.current.rotation.x = Math.sin(t * 15) * 0.15

    // Fast flapping wings
    if (wingRef.current) {
      wingRef.current.rotation.z = Math.sin(t * 45) * 0.5
    }
  })

  return (
    <group ref={flyRef}>
      {/* Tiny black fly body */}
      <mesh>
        <sphereGeometry args={[0.045, 8, 8]} />
        <meshBasicMaterial color="#1E171F" />
      </mesh>
      {/* Tiny translucent wings */}
      <mesh ref={wingRef} position={[0, 0.03, 0]}>
        <planeGeometry args={[0.09, 0.045]} />
        <meshBasicMaterial
          color="#E8F4F8"
          transparent
          opacity={0.7}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  )
}

// Gentle cartoon green stink wisps rising from Maxy
function StinkWisps() {
  const wispRef = useRef<THREE.Group>(null)

  useFrame((state) => {
    if (!wispRef.current) return
    const t = state.clock.getElapsedTime()
    wispRef.current.children.forEach((child, i) => {
      const phase = t * 1.8 + i * 2.1
      child.position.y = 0.85 + ((phase % 2.5) * 0.45)
      child.position.x = (i === 0 ? -0.45 : 0.4) + Math.sin(phase * 2.5) * 0.08
      const mat = (child as THREE.Mesh).material as THREE.MeshBasicMaterial
      if (mat) {
        // Fade in then out as it rises
        const norm = (phase % 2.5) / 2.5
        mat.opacity = Math.sin(norm * Math.PI) * 0.55
      }
    })
  })

  return (
    <group ref={wispRef}>
      {/* Left wisp */}
      <mesh position={[-0.45, 0.85, 0.1]}>
        <sphereGeometry args={[0.065, 8, 8]} />
        <meshBasicMaterial color="#7CB518" transparent opacity={0.5} />
      </mesh>
      {/* Right wisp */}
      <mesh position={[0.4, 0.85, 0.15]}>
        <sphereGeometry args={[0.08, 8, 8]} />
        <meshBasicMaterial color="#99D98C" transparent opacity={0.5} />
      </mesh>
    </group>
  )
}

export function DirtPatches3D({ cleanliness, isWashing = false }: DirtPatches3DProps) {
  const groupRef = useRef<THREE.Group>(null)
  const currentScale = useRef(0)

  // Smooth continuous dirt factor from 0.0 at 95% cleanliness to 1.0 at 15%
  const dirtFactor = Math.max(0, Math.min(1.0, (95 - cleanliness) / 80))
  // Smooth power curve so dirt gradually shrinks down to tiny specks without popping
  const targetScale = Math.pow(dirtFactor, 1.35) * 1.15
  const opacity = Math.min(0.92, Math.max(0.08, dirtFactor * 1.1))

  // While washing, back mud blobs that get scrubbed by the loofah sponge shrink faster
  const backScrubMultiplier = isWashing ? 0.65 : 1.0

  useFrame((_, delta) => {
    if (!groupRef.current) return
    // Continuous frame-by-frame lerp interpolation for silky smooth shrinking
    const lerpSpeed = isWashing ? delta * 5.5 : delta * 8.5
    currentScale.current = THREE.MathUtils.lerp(currentScale.current, targetScale, lerpSpeed)

    groupRef.current.scale.setScalar(currentScale.current)
    groupRef.current.visible = currentScale.current > 0.005
  })

  return (
    <group ref={groupRef} name="dirt-patches-3d">
      {/* --- FRONT BODY DIRT --- */}
      {/* Lower belly mud patch */}
      <MudBlob
        position={[-0.38, -0.62, 1.012]}
        rotation={[0.1, -0.05, 0.2]}
        scale={0.9}
        opacity={opacity}
        splatterCount={2}
      />

      {/* Upper forehead corner dirt */}
      <MudBlob
        position={[-0.55, 0.72, 1.008]}
        rotation={[-0.12, 0.1, -0.3]}
        scale={0.82}
        opacity={opacity}
        splatterCount={3}
      />

      {/* --- PAW MUD SPLATTERS --- */}
      {/* Left paw muddy top */}
      <MudBlob
        position={[-0.55, -0.84, 0.42]}
        rotation={[-0.4, 0, 0]}
        scale={0.7}
        opacity={opacity * 0.95}
        splatterCount={1}
      />

      {/* Right paw muddy top */}
      <MudBlob
        position={[0.55, -0.84, 0.42]}
        rotation={[-0.4, 0, 0]}
        scale={0.75}
        opacity={opacity * 0.95}
        splatterCount={2}
      />

      {/* --- SIDE FLANKS --- */}
      {/* Left side flank */}
      <MudBlob
        position={[-1.012, -0.08, 0.15]}
        rotation={[0, -Math.PI / 2, 0.4]}
        scale={1.05}
        opacity={opacity}
        splatterCount={3}
      />

      {/* Right side flank */}
      <MudBlob
        position={[1.012, 0.18, -0.22]}
        rotation={[0, Math.PI / 2, -0.25]}
        scale={0.95}
        opacity={opacity}
        splatterCount={2}
      />

      {/* --- TOP OF HEAD --- */}
      <MudBlob
        position={[0.38, 1.012, 0.12]}
        rotation={[-Math.PI / 2, 0, 0.5]}
        scale={0.88}
        opacity={opacity}
        splatterCount={3}
      />

      {/* --- BACK OF BODY (Target for the wash stick loofah sponge!) --- */}
      {/* Upper back shoulder */}
      <MudBlob
        position={[0.28, 0.48, -1.012]}
        rotation={[0, Math.PI, -0.3]}
        scale={1.15 * backScrubMultiplier}
        opacity={opacity * backScrubMultiplier}
        splatterCount={3}
      />

      {/* Mid-back central mud blob */}
      <MudBlob
        position={[-0.32, 0.12, -1.012]}
        rotation={[0, Math.PI, 0.4]}
        scale={1.05 * backScrubMultiplier}
        opacity={opacity * backScrubMultiplier}
        splatterCount={3}
      />

      {/* Lower back splash */}
      <MudBlob
        position={[0.15, -0.45, -1.012]}
        rotation={[0, Math.PI, 0.1]}
        scale={0.9 * backScrubMultiplier}
        opacity={opacity * backScrubMultiplier}
        splatterCount={2}
      />

      {/* --- VERY DIRTY EFFECTS (Cleanliness < 25, flies shoo away when washing starts) --- */}
      {!isWashing && cleanliness < 25 && (
        <>
          <BuzzingFly />
          <StinkWisps />
        </>
      )}
    </group>
  )
}
