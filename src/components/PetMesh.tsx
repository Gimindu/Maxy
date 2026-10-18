import { useRef, useMemo, useEffect, useState } from 'react'
import * as THREE from 'three'
import { useFrame, ThreeEvent } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import { PetColor, PetMood, AccessoryType } from '../types/pet'
import { DynamicFaceTexture } from '../utils/faceCanvas'
import { Accessories } from './Accessories'

interface PetMeshProps {
  mood: PetMood
  color: PetColor
  accessory: AccessoryType
  onPoke: () => void
  onPet: () => void
  isSleeping: boolean
}

export function PetMesh({
  mood,
  color,
  accessory,
  onPoke,
  onPet,
  isSleeping,
}: PetMeshProps) {
  const groupRef = useRef<THREE.Group>(null)
  const [isHovered, setIsHovered] = useState(false)
  const isDraggingRef = useRef(false)
  const lastPetTimeRef = useRef(0)

  // Spring physics state for squish & stretch
  const scaleRef = useRef<THREE.Vector3>(new THREE.Vector3(1, 1, 1))
  const velocityRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 0))

  // Face texture generator
  const faceGenerator = useMemo(() => new DynamicFaceTexture(512), [])

  useEffect(() => {
    return () => {
      faceGenerator.dispose()
    }
  }, [faceGenerator])

  // Squish trigger
  const triggerSquish = (squashFactor: number = 0.65) => {
    // Compress Y, expand X and Z to simulate incompressibility
    scaleRef.current.set(1 / Math.sqrt(squashFactor), squashFactor, 1 / Math.sqrt(squashFactor))
    velocityRef.current.set(0, 0, 0)
  }

  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    isDraggingRef.current = true
    triggerSquish(0.68)
    onPoke()
  }

  const handlePointerUp = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    isDraggingRef.current = false
  }

  const handlePointerMove = (e: ThreeEvent<PointerEvent>) => {
    if (isDraggingRef.current) {
      const now = performance.now()
      if (now - lastPetTimeRef.current > 160) {
        lastPetTimeRef.current = now
        // Slight jiggle
        velocityRef.current.x += (Math.random() - 0.5) * 0.1
        velocityRef.current.y += 0.08
        onPet()
      }
    }
  }

  useFrame((state, delta) => {
    if (!groupRef.current) return

    const t = state.clock.getElapsedTime()
    const pointer = state.pointer

    // Spring solver parameters
    const stiffness = 220
    const damping = 12

    // Target scale calculation (including idle breathing)
    const breathRate = isSleeping ? 1.2 : 2.5
    const breathAmp = isSleeping ? 0.02 : 0.035
    const breathOffset = Math.sin(t * breathRate) * breathAmp
    const targetScale = new THREE.Vector3(1 - breathOffset * 0.5, 1 + breathOffset, 1 - breathOffset * 0.5)

    // Euler spring integration
    const diff = new THREE.Vector3().subVectors(targetScale, scaleRef.current)
    const springForce = diff.multiplyScalar(stiffness)
    const dampingForce = velocityRef.current.clone().multiplyScalar(damping)
    const acceleration = springForce.sub(dampingForce)

    velocityRef.current.addScaledVector(acceleration, delta)
    scaleRef.current.addScaledVector(velocityRef.current, delta)

    // Clamp spring to prevent infinite explode
    scaleRef.current.x = THREE.MathUtils.clamp(scaleRef.current.x, 0.4, 2.0)
    scaleRef.current.y = THREE.MathUtils.clamp(scaleRef.current.y, 0.4, 2.0)
    scaleRef.current.z = THREE.MathUtils.clamp(scaleRef.current.z, 0.4, 2.0)

    groupRef.current.scale.copy(scaleRef.current)

    // Floating position
    const floatSpeed = isSleeping ? 1.0 : mood === 'sleepy' ? 1.2 : 2.0
    const floatHeight = isSleeping ? 0.08 : mood === 'sleepy' ? 0.09 : 0.15
    const targetY = Math.sin(t * floatSpeed) * floatHeight
    groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, targetY, 0.1)

    // Rotation / Cursor tracking
    if (isSleeping) {
      // Gentle restful tilt
      const sleepTiltZ = Math.sin(t * 0.8) * 0.08 + 0.06
      groupRef.current.rotation.z = THREE.MathUtils.lerp(groupRef.current.rotation.z, sleepTiltZ, 0.05)
      groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, 0.1, 0.05)
      groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, 0.08, 0.05)
    } else if (mood === 'sleepy') {
      // Drowsy sluggish follow with gentle tired head-drop nod
      const sleepNod = Math.sin(t * 1.4) * 0.06 + 0.05
      const targetRotY = pointer.x * 0.3
      const targetRotX = -pointer.y * 0.2 + sleepNod
      const targetRotZ = Math.sin(t * 0.7) * 0.04

      groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, targetRotY, 0.05)
      groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, targetRotX, 0.05)
      groupRef.current.rotation.z = THREE.MathUtils.lerp(groupRef.current.rotation.z, targetRotZ, 0.05)
    } else {
      // Dynamic follow
      const targetRotY = pointer.x * 0.55
      const targetRotX = -pointer.y * 0.35
      const targetRotZ = -pointer.x * 0.1

      groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, targetRotY, 0.08)
      groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, targetRotX, 0.08)
      groupRef.current.rotation.z = THREE.MathUtils.lerp(groupRef.current.rotation.z, targetRotZ, 0.08)
    }

    // Update dynamic face
    const gazeX = isSleeping ? 0 : pointer.x
    const gazeY = isSleeping ? 0 : pointer.y
    faceGenerator.update(mood, gazeX, gazeY, delta, color.blushHex)
  })

  return (
    <group
      ref={groupRef}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerMove={handlePointerMove}
      onPointerOver={() => setIsHovered(true)}
      onPointerOut={() => {
        setIsHovered(false)
        isDraggingRef.current = false
      }}
    >
      {/* Main squishy body using RoundedBox */}
      <RoundedBox 
        args={[2, 2, 2]} 
        radius={0.52} 
        smoothness={6} 
        castShadow 
        receiveShadow
      >
        <meshStandardMaterial
          color={color.hex}
          roughness={color.roughness}
          metalness={0.05}
          bumpScale={0.02}
        />
      </RoundedBox>

      {/* Face plane hovering slightly in front of body */}
      <mesh position={[0, 0, 1.015]}>
        <planeGeometry args={[1.65, 1.65]} />
        <meshBasicMaterial 
          map={faceGenerator.texture} 
          transparent 
          toneMapped={false}
          depthWrite={false}
        />
      </mesh>

      {/* Little cute nub feet / paws underneath */}
      <group position={[0, -0.95, 0.2]}>
        {/* Left paw */}
        <mesh position={[-0.55, 0, 0.15]} castShadow>
          <sphereGeometry args={[0.22, 16, 16]} />
          <meshStandardMaterial color={color.hex} roughness={color.roughness} />
        </mesh>
        {/* Right paw */}
        <mesh position={[0.55, 0, 0.15]} castShadow>
          <sphereGeometry args={[0.22, 16, 16]} />
          <meshStandardMaterial color={color.hex} roughness={color.roughness} />
        </mesh>
      </group>

      {/* Accessories */}
      <Accessories 
        accessory={accessory} 
        petScale={[scaleRef.current.x, scaleRef.current.y, scaleRef.current.z]} 
        isSleeping={isSleeping}
      />
    </group>
  )
}
