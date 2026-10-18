import { useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { AccessoryType } from '../types/pet'

interface AccessoriesProps {
  accessory: AccessoryType
  petScale: [number, number, number]
  isSleeping?: boolean
}

function SleepHat() {
  const hatRef = useRef<THREE.Group>(null)
  const pomRef = useRef<THREE.Group>(null)

  useFrame((state) => {
    const t = state.clock.getElapsedTime()
    if (hatRef.current) {
      // Gentle breathing bob & tilt
      hatRef.current.position.y = 1.15 + Math.sin(t * 1.5) * 0.02
      hatRef.current.rotation.z = -0.15 + Math.sin(t * 1.5) * 0.03
    }
    if (pomRef.current) {
      // Fluffy pom-pom dangling motion
      pomRef.current.position.y = 0.58 + Math.sin(t * 2.2) * 0.04
      pomRef.current.position.x = 0.78 + Math.cos(t * 1.8) * 0.03
    }
  })

  return (
    <group ref={hatRef} position={[0.05, 1.15, -0.05]}>
      {/* Fluffy white cloud brim */}
      <mesh position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <torusGeometry args={[0.54, 0.12, 16, 32]} />
        <meshStandardMaterial color="#FFFFFF" roughness={0.95} />
      </mesh>

      {/* Main nightcap body (segments curving right & down) */}
      {/* Base segment */}
      <mesh position={[0, 0.18, 0]} castShadow>
        <cylinderGeometry args={[0.42, 0.5, 0.36, 20]} />
        <meshStandardMaterial color="#6C5CE7" roughness={0.8} />
      </mesh>

      {/* Golden Moon decal on front of hat */}
      <mesh position={[0, 0.22, 0.46]} rotation={[0, 0, -0.3]}>
        <sphereGeometry args={[0.09, 12, 12]} />
        <meshStandardMaterial color="#FFD166" emissive="#FFAA00" emissiveIntensity={0.6} roughness={0.3} />
      </mesh>

      {/* Mid segment (tilting right) */}
      <mesh position={[0.12, 0.48, -0.04]} rotation={[0.08, 0, -0.42]} castShadow>
        <cylinderGeometry args={[0.3, 0.42, 0.38, 20]} />
        <meshStandardMaterial color="#6C5CE7" roughness={0.8} />
      </mesh>

      {/* Upper segment (tilting more right and down) */}
      <mesh position={[0.34, 0.68, -0.08]} rotation={[0.12, 0, -0.95]} castShadow>
        <cylinderGeometry args={[0.18, 0.3, 0.38, 20]} />
        <meshStandardMaterial color="#6C5CE7" roughness={0.8} />
      </mesh>

      {/* Drooping tip segment (pointing down) */}
      <mesh position={[0.58, 0.68, -0.1]} rotation={[0.1, 0, -1.95]} castShadow>
        <cylinderGeometry args={[0.08, 0.18, 0.36, 20]} />
        <meshStandardMaterial color="#6C5CE7" roughness={0.8} />
      </mesh>

      {/* Swaying Pom-pom at tip */}
      <group ref={pomRef} position={[0.78, 0.58, -0.1]}>
        <mesh castShadow>
          <sphereGeometry args={[0.16, 16, 16]} />
          <meshStandardMaterial color="#FFFFFF" roughness={0.95} />
        </mesh>
      </group>
    </group>
  )
}

export function Accessories({ accessory, isSleeping = false }: AccessoriesProps) {
  const haloRef = useRef<THREE.Group>(null)
  const earsRef = useRef<THREE.Group>(null)

  useFrame((state) => {
    const t = state.clock.getElapsedTime()
    if (haloRef.current) {
      haloRef.current.position.y = 1.65 + Math.sin(t * 3) * 0.08
      haloRef.current.rotation.z = Math.sin(t * 2) * 0.05
    }
    if (earsRef.current) {
      // Gentle ear wiggle
      earsRef.current.children[0].rotation.z = 0.2 + Math.sin(t * 4) * 0.05
      earsRef.current.children[1].rotation.z = -0.2 - Math.sin(t * 4) * 0.05
    }
  })

  // When sleeping, always wear the Sleep Hat!
  if (isSleeping) {
    return (
      <group>
        <SleepHat />
        {/* If wearing cool glasses, keep them on */}
        {accessory === 'cool_glasses' && (
          <group position={[0, 0.15, 1.08]}>
            <mesh position={[-0.45, 0, 0]}>
              <boxGeometry args={[0.42, 0.26, 0.06]} />
              <meshStandardMaterial color="#1A181C" roughness={0.2} metalness={0.8} />
            </mesh>
            <mesh position={[0.45, 0, 0]}>
              <boxGeometry args={[0.42, 0.26, 0.06]} />
              <meshStandardMaterial color="#1A181C" roughness={0.2} metalness={0.8} />
            </mesh>
            <mesh position={[0, 0.04, 0]}>
              <boxGeometry args={[0.16, 0.05, 0.06]} />
              <meshStandardMaterial color="#1A181C" roughness={0.2} metalness={0.8} />
            </mesh>
          </group>
        )}
      </group>
    )
  }

  if (accessory === 'sleep_hat') {
    return <SleepHat />
  }

  if (accessory === 'none') return null

  if (accessory === 'crown') {
    return (
      <group position={[0, 1.25, 0]}>
        {/* Crown Base */}
        <mesh position={[0, 0, 0]} castShadow>
          <cylinderGeometry args={[0.55, 0.45, 0.35, 16]} />
          <meshStandardMaterial color="#FFD13B" metalness={0.7} roughness={0.3} />
        </mesh>
        {/* Crown Peaks */}
        {[0, 1, 2, 3, 4].map((i) => {
          const angle = (i / 5) * Math.PI * 2
          const x = Math.sin(angle) * 0.52
          const z = Math.cos(angle) * 0.52
          return (
            <group key={i} position={[x, 0.22, z]}>
              <mesh castShadow>
                <coneGeometry args={[0.12, 0.3, 8]} />
                <meshStandardMaterial color="#FFD13B" metalness={0.7} roughness={0.3} />
              </mesh>
              {/* Gem atop peak */}
              <mesh position={[0, 0.18, 0]}>
                <sphereGeometry args={[0.06, 8, 8]} />
                <meshStandardMaterial color={i % 2 === 0 ? '#FF3366' : '#00E5FF'} roughness={0.1} />
              </mesh>
            </group>
          )
        })}
      </group>
    )
  }

  if (accessory === 'bunny_ears') {
    return (
      <group ref={earsRef} position={[0, 1.15, 0]}>
        {/* Left Ear */}
        <group position={[-0.45, 0.4, 0]}>
          <mesh castShadow>
            <capsuleGeometry args={[0.16, 0.65, 8, 16]} />
            <meshStandardMaterial color="#FFFFFF" roughness={0.8} />
          </mesh>
          <mesh position={[0, 0, 0.07]}>
            <capsuleGeometry args={[0.09, 0.45, 8, 16]} />
            <meshStandardMaterial color="#FFADC6" roughness={0.8} />
          </mesh>
        </group>
        {/* Right Ear */}
        <group position={[0.45, 0.4, 0]}>
          <mesh castShadow>
            <capsuleGeometry args={[0.16, 0.65, 8, 16]} />
            <meshStandardMaterial color="#FFFFFF" roughness={0.8} />
          </mesh>
          <mesh position={[0, 0, 0.07]}>
            <capsuleGeometry args={[0.09, 0.45, 8, 16]} />
            <meshStandardMaterial color="#FFADC6" roughness={0.8} />
          </mesh>
        </group>
      </group>
    )
  }

  if (accessory === 'chef_hat') {
    return (
      <group position={[0, 1.25, 0]}>
        {/* Hat Headband */}
        <mesh position={[0, 0, 0]}>
          <cylinderGeometry args={[0.5, 0.5, 0.25, 16]} />
          <meshStandardMaterial color="#F7F7F7" roughness={0.9} />
        </mesh>
        {/* Hat Puffs */}
        <mesh position={[0, 0.35, 0]}>
          <sphereGeometry args={[0.62, 16, 16]} />
          <meshStandardMaterial color="#FFFFFF" roughness={0.8} />
        </mesh>
      </group>
    )
  }

  if (accessory === 'cool_glasses') {
    return (
      <group position={[0, 0.15, 1.08]}>
        {/* Left Lens */}
        <mesh position={[-0.45, 0, 0]}>
          <boxGeometry args={[0.42, 0.26, 0.06]} />
          <meshStandardMaterial color="#1A181C" roughness={0.2} metalness={0.8} />
        </mesh>
        {/* Right Lens */}
        <mesh position={[0.45, 0, 0]}>
          <boxGeometry args={[0.42, 0.26, 0.06]} />
          <meshStandardMaterial color="#1A181C" roughness={0.2} metalness={0.8} />
        </mesh>
        {/* Bridge */}
        <mesh position={[0, 0.04, 0]}>
          <boxGeometry args={[0.16, 0.05, 0.06]} />
          <meshStandardMaterial color="#1A181C" roughness={0.2} metalness={0.8} />
        </mesh>
        {/* Lens reflection highlights */}
        <mesh position={[-0.45, 0.05, 0.035]} rotation={[0, 0, -Math.PI / 4]}>
          <planeGeometry args={[0.06, 0.22]} />
          <meshBasicMaterial color="#FFFFFF" transparent opacity={0.65} />
        </mesh>
        <mesh position={[0.45, 0.05, 0.035]} rotation={[0, 0, -Math.PI / 4]}>
          <planeGeometry args={[0.06, 0.22]} />
          <meshBasicMaterial color="#FFFFFF" transparent opacity={0.65} />
        </mesh>
      </group>
    )
  }

  if (accessory === 'halo') {
    return (
      <group ref={haloRef} position={[0, 1.6, 0]} rotation={[Math.PI / 10, 0, 0]}>
        <mesh>
          <torusGeometry args={[0.65, 0.06, 16, 32]} />
          <meshStandardMaterial 
            color="#FFEA79" 
            emissive="#FFD700" 
            emissiveIntensity={0.8} 
            roughness={0.2}
          />
        </mesh>
      </group>
    )
  }

  if (accessory === 'flower') {
    return (
      <group position={[0.8, 1.05, 0.3]} rotation={[0.4, 0.5, -0.4]}>
        {/* Flower Center */}
        <mesh position={[0, 0, 0.05]}>
          <sphereGeometry args={[0.12, 12, 12]} />
          <meshStandardMaterial color="#FFE066" roughness={0.5} />
        </mesh>
        {/* Petals */}
        {[0, 1, 2, 3, 4].map((i) => {
          const angle = (i / 5) * Math.PI * 2
          return (
            <mesh 
              key={i} 
              position={[Math.cos(angle) * 0.2, Math.sin(angle) * 0.2, 0]} 
              rotation={[0, 0, angle]}
            >
              <sphereGeometry args={[0.12, 12, 12]} />
              <meshStandardMaterial color="#FF70A6" roughness={0.7} />
            </mesh>
          )
        })}
      </group>
    )
  }

  return null
}
