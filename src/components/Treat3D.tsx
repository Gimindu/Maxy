import { useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'

interface Treat3DProps {
  active: boolean
  onEaten: () => void
}

export function Treat3D({ active, onEaten }: Treat3DProps) {
  const treatRef = useRef<THREE.Group>(null)
  const progressRef = useRef(0)
  const hasEatenRef = useRef(false)

  useFrame((_, delta) => {
    if (!active) {
      progressRef.current = 0
      hasEatenRef.current = false
      return
    }

    // Steady, enjoyable flight (~1.15 seconds total)
    progressRef.current += delta * 0.85
    const p = progressRef.current

    if (treatRef.current) {
      if (p < 1.0) {
        // Starts near bottom-right action area in front of camera
        const startX = 0.75
        const startY = -1.6
        const startZ = 2.6

        // Target: directly into Maxy's mouth plane at [0, -0.10, 1.05]
        const endX = 0.0
        const endY = -0.10
        const endZ = 1.05

        // Smooth ease-in-out progress
        const easeP = p * p * (3 - 2 * p)

        const currX = THREE.MathUtils.lerp(startX, endX, easeP)
        const currZ = THREE.MathUtils.lerp(startZ, endZ, easeP)
        // Parabolic arc that rises up in front of pet and curves right into the mouth
        const arcY = Math.sin(p * Math.PI) * 0.95
        const currY = THREE.MathUtils.lerp(startY, endY, p) + arcY

        treatRef.current.position.set(currX, currY, currZ)

        // Playful tumble spin
        treatRef.current.rotation.x += delta * 4.5
        treatRef.current.rotation.y += delta * 5.5

        // As it enters the open mouth in the final 22%, shrink into the mouth!
        const scale = p > 0.78 ? Math.max(0.01, (1 - (p - 0.78) / 0.22) * 0.75) : 0.75
        treatRef.current.scale.setScalar(scale)
      } else {
        if (!hasEatenRef.current) {
          hasEatenRef.current = true
          onEaten()
        }
      }
    }
  })

  if (!active) return null

  return (
    <group ref={treatRef} position={[0.75, -1.6, 2.6]}>
      {/* 3D Strawberry treat */}
      {/* Red berry cone pointing tip downwards */}
      <mesh position={[0, 0, 0]} rotation={[Math.PI, 0, 0]} castShadow>
        <coneGeometry args={[0.22, 0.44, 20]} />
        <meshStandardMaterial 
          color="#FF1E56" 
          roughness={0.35} 
          metalness={0.08} 
        />
      </mesh>

      {/* Strawberry green calyx leaves at top */}
      <mesh position={[0, 0.21, 0]}>
        <cylinderGeometry args={[0.07, 0.15, 0.04, 12]} />
        <meshStandardMaterial color="#2B9348" roughness={0.7} />
      </mesh>

      {/* Little green stem */}
      <mesh position={[0, 0.27, 0]}>
        <cylinderGeometry args={[0.03, 0.035, 0.12, 8]} />
        <meshStandardMaterial color="#2B9348" roughness={0.7} />
      </mesh>

      {/* Star sepals spread over the top */}
      {[0, 1, 2, 3, 4].map((i) => {
        const a = (i / 5) * Math.PI * 2
        return (
          <mesh 
            key={i} 
            position={[Math.sin(a) * 0.13, 0.21, Math.cos(a) * 0.13]} 
            rotation={[-0.35, a, 0]}
          >
            <coneGeometry args={[0.065, 0.16, 6]} />
            <meshStandardMaterial color="#55A630" roughness={0.6} />
          </mesh>
        )
      })}
    </group>
  )
}
