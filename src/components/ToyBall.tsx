import { useRef, useState } from 'react'
import * as THREE from 'three'
import { useFrame, ThreeEvent } from '@react-three/fiber'

interface ToyBallProps {
  active: boolean
  onBounced: () => void
}

export function ToyBall({ active, onBounced }: ToyBallProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const pos = useRef(new THREE.Vector3(1.6, 1.5, 0.5))
  const vel = useRef(new THREE.Vector3(-0.02, 0.05, 0))
  const [bounceSquash, setBounceSquash] = useState(1)

  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    // Launch ball upward and away
    vel.current.y = 0.15 + Math.random() * 0.05
    vel.current.x = (Math.random() - 0.5) * 0.1
    vel.current.z = (Math.random() - 0.5) * 0.08
    setBounceSquash(0.7)
    setTimeout(() => setBounceSquash(1), 150)
    onBounced()
  }

  useFrame((_, delta) => {
    if (!active || !meshRef.current) return

    // Gravity
    vel.current.y -= 0.006

    pos.current.add(vel.current)

    // Floor collision
    const floorY = -1.1
    if (pos.current.y < floorY) {
      pos.current.y = floorY
      vel.current.y = -vel.current.y * 0.78
      if (Math.abs(vel.current.y) > 0.02) {
        onBounced()
      }
    }

    // Boundary bounce
    if (pos.current.x > 2.6 || pos.current.x < -2.6) {
      vel.current.x = -vel.current.x * 0.8
    }
    if (pos.current.z > 2.0 || pos.current.z < -1.5) {
      vel.current.z = -vel.current.z * 0.8
    }

    meshRef.current.position.copy(pos.current)
    meshRef.current.rotation.x += delta * 4 * Math.sign(vel.current.z || 1)
    meshRef.current.rotation.y += delta * 3
    meshRef.current.rotation.z += delta * 4 * Math.sign(vel.current.x || 1)
    meshRef.current.scale.set(1 / Math.sqrt(bounceSquash), bounceSquash, 1 / Math.sqrt(bounceSquash))
  })

  if (!active) return null

  return (
    <mesh 
      ref={meshRef} 
      position={[1.6, 1.5, 0.5]} 
      onPointerDown={handlePointerDown}
      castShadow
    >
      <sphereGeometry args={[0.35, 24, 24]} />
      <meshStandardMaterial 
        color="#FF5964" 
        roughness={0.25} 
        metalness={0.1} 
      />
    </mesh>
  )
}
