import { useRef, useMemo } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { FloatingParticleData } from '../types/pet'

interface Particles3DProps {
  particles: FloatingParticleData[]
}

function HeartMesh({ particle }: { particle: FloatingParticleData }) {
  const meshRef = useRef<THREE.Group>(null)

  const heartShape = useMemo(() => {
    const s = new THREE.Shape()
    // Start at bottom tip
    s.moveTo(0, -0.14)
    // Left lobe curving up
    s.bezierCurveTo(-0.04, -0.04, -0.18, 0.04, -0.18, 0.16)
    s.bezierCurveTo(-0.18, 0.26, -0.09, 0.3, 0, 0.2)
    // Right lobe curving up
    s.bezierCurveTo(0.09, 0.3, 0.18, 0.26, 0.18, 0.16)
    s.bezierCurveTo(0.18, 0.04, 0.04, -0.04, 0, -0.14)
    return s
  }, [])

  const extrudeSettings = useMemo(
    () => ({
      depth: 0.06,
      bevelEnabled: true,
      bevelSegments: 4,
      steps: 1,
      bevelSize: 0.03,
      bevelThickness: 0.03,
    }),
    []
  )

  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.position.set(...particle.position)
      meshRef.current.scale.setScalar(particle.scale)
      // Gentle floating spin and wobble
      meshRef.current.rotation.y += delta * 1.6
      meshRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 3 + particle.id) * 0.12
    }
  })

  return (
    <group ref={meshRef} position={particle.position}>
      {/* Upright volumetric 3D Heart with soft highlights */}
      <mesh position={[0, -0.06, -0.03]}>
        <extrudeGeometry args={[heartShape, extrudeSettings]} />
        <meshStandardMaterial 
          color="#FF3366" 
          emissive="#FF1E56" 
          emissiveIntensity={0.35} 
          roughness={0.25} 
          metalness={0.1} 
        />
      </mesh>
    </group>
  )
}

function StarMesh({ particle }: { particle: FloatingParticleData }) {
  const meshRef = useRef<THREE.Group>(null)

  useFrame((_, delta) => {
    if (meshRef.current) {
      meshRef.current.position.set(...particle.position)
      meshRef.current.scale.setScalar(particle.scale)
      meshRef.current.rotation.z += delta * 3
      meshRef.current.rotation.y += delta * 2
    }
  })

  return (
    <group ref={meshRef} position={particle.position}>
      <mesh>
        <octahedronGeometry args={[0.18, 0]} />
        <meshStandardMaterial 
          color="#FFD166" 
          emissive="#FFAA00" 
          emissiveIntensity={0.6} 
          roughness={0.2} 
        />
      </mesh>
    </group>
  )
}

function BubbleMesh({ particle }: { particle: FloatingParticleData }) {
  const meshRef = useRef<THREE.Mesh>(null)

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.position.set(...particle.position)
      meshRef.current.scale.setScalar(particle.scale)
    }
  })

  return (
    <mesh ref={meshRef} position={particle.position}>
      <sphereGeometry args={[0.16, 16, 16]} />
      <meshStandardMaterial 
        color="#70D6FF" 
        transparent 
        opacity={0.65} 
        roughness={0.1} 
        metalness={0.9} 
      />
    </mesh>
  )
}

function ZzzMesh({ particle }: { particle: FloatingParticleData }) {
  const meshRef = useRef<THREE.Group>(null)

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.position.set(...particle.position)
      meshRef.current.scale.setScalar(particle.scale)
      meshRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 2 + particle.id) * 0.2
    }
  })

  return (
    <group ref={meshRef} position={particle.position}>
      {/* 3D representation of 'Z' letter */}
      <mesh position={[0, 0.08, 0]}>
        <boxGeometry args={[0.16, 0.04, 0.04]} />
        <meshStandardMaterial color="#BDB2FF" emissive="#9B8FFF" emissiveIntensity={0.4} />
      </mesh>
      <mesh position={[0, 0, 0]} rotation={[0, 0, Math.PI / 4]}>
        <boxGeometry args={[0.2, 0.04, 0.04]} />
        <meshStandardMaterial color="#BDB2FF" emissive="#9B8FFF" emissiveIntensity={0.4} />
      </mesh>
      <mesh position={[0, -0.08, 0]}>
        <boxGeometry args={[0.16, 0.04, 0.04]} />
        <meshStandardMaterial color="#BDB2FF" emissive="#9B8FFF" emissiveIntensity={0.4} />
      </mesh>
    </group>
  )
}

function CrumbMesh({ particle }: { particle: FloatingParticleData }) {
  const meshRef = useRef<THREE.Mesh>(null)

  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.position.set(...particle.position)
      meshRef.current.scale.setScalar(particle.scale)
    }
  })

  return (
    <mesh ref={meshRef} position={particle.position}>
      <dodecahedronGeometry args={[0.07, 0]} />
      <meshStandardMaterial color="#FFB703" roughness={0.9} />
    </mesh>
  )
}

export function Particles3D({ particles }: Particles3DProps) {
  return (
    <group>
      {particles.map((p) => {
        if (p.type === 'heart') return <HeartMesh key={p.id} particle={p} />
        if (p.type === 'star') return <StarMesh key={p.id} particle={p} />
        if (p.type === 'bubble') return <BubbleMesh key={p.id} particle={p} />
        if (p.type === 'zzz') return <ZzzMesh key={p.id} particle={p} />
        if (p.type === 'crumb') return <CrumbMesh key={p.id} particle={p} />
        return null
      })}
    </group>
  )
}
