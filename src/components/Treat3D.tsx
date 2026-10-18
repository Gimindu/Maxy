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

  useFrame((_, delta) => {
    if (!active) {
      progressRef.current = 0
      return
    }

    progressRef.current += delta * 1.8
    const p = progressRef.current

    if (treatRef.current) {
      if (p < 1.0) {
        // Arc path from lower-front to pet's mouth at [0, -0.1, 1.1]
        const startX = 0.8
        const startY = -1.8
        const startZ = 2.5

        const endX = 0
        const endY = -0.1
        const endZ = 1.1

        // Parabolic arc
        const currX = THREE.MathUtils.lerp(startX, endX, p)
        const currY = THREE.MathUtils.lerp(startY, endY, p) + Math.sin(p * Math.PI) * 0.8
        const currZ = THREE.MathUtils.lerp(startZ, endZ, p)

        treatRef.current.position.set(currX, currY, currZ)
        treatRef.current.rotation.x += delta * 5
        treatRef.current.rotation.y += delta * 6

        // Shrink at the end as it gets eaten
        const scale = p > 0.7 ? (1 - (p - 0.7) / 0.3) * 0.7 : 0.7
        treatRef.current.scale.setScalar(scale)
      } else {
        onEaten()
      }
    }
  })

  if (!active) return null

  return (
    <group ref={treatRef} position={[0.8, -1.8, 2.5]}>
      {/* 3D Strawberry treat */}
      <mesh castShadow>
        <coneGeometry args={[0.22, 0.45, 16]} />
        <meshStandardMaterial color="#FF3366" roughness={0.3} />
      </mesh>
      {/* Strawberry green stem & leaves */}
      <mesh position={[0, 0.22, 0]}>
        <cylinderGeometry args={[0.04, 0.04, 0.12, 8]} />
        <meshStandardMaterial color="#38B000" roughness={0.6} />
      </mesh>
      {[0, 1, 2, 3].map((i) => {
        const a = (i / 4) * Math.PI * 2
        return (
          <mesh 
            key={i} 
            position={[Math.sin(a) * 0.12, 0.2, Math.cos(a) * 0.12]} 
            rotation={[0.3, a, 0]}
          >
            <coneGeometry args={[0.08, 0.15, 6]} />
            <meshStandardMaterial color="#38B000" roughness={0.6} />
          </mesh>
        )
      })}
    </group>
  )
}
