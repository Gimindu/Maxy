import { useRef, useMemo, useEffect, useState } from 'react'
import * as THREE from 'three'
import { useFrame, ThreeEvent } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import { PetColor, PetMood, AccessoryType } from '../types/pet'
import { DynamicFaceTexture } from '../utils/faceCanvas'
import { Accessories } from './Accessories'
import { WashStick3D } from './WashStick3D'
import { DirtPatches3D } from './DirtPatches3D'

interface PetMeshProps {
  mood: PetMood
  color: PetColor
  accessory: AccessoryType
  onPoke: () => void
  onPet: () => void
  isSleeping: boolean
  cleanliness?: number
  hitCount?: number
  onWakeUp?: () => void
  energy?: number
}

export function PetMesh({
  mood,
  color,
  accessory,
  onPoke,
  onPet,
  isSleeping,
  cleanliness = 100,
  hitCount = 0,
  onWakeUp,
  energy = 100,
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

  // React to ball bouncing off Maxy
  const prevHitCountRef = useRef(hitCount)
  useEffect(() => {
    if (hitCount > 0 && hitCount !== prevHitCountRef.current) {
      prevHitCountRef.current = hitCount
      triggerSquish(0.68)
      velocityRef.current.y += 0.09
      velocityRef.current.x += (Math.random() - 0.5) * 0.12
    }
  }, [hitCount])

  // React to full tummy refusal mood & waking up
  const prevMoodRef = useRef(mood)
  const wakeTimerRef = useRef(0)
  const hasLandedRef = useRef(false)

  useEffect(() => {
    if (mood === 'full' && prevMoodRef.current !== 'full') {
      // Chubby full tummy squish
      scaleRef.current.set(1.15, 0.86, 1.15)
      velocityRef.current.set(0, 0, 0)
    }
    if (mood === 'waking_up' && prevMoodRef.current !== 'waking_up') {
      wakeTimerRef.current = 0
      hasLandedRef.current = false
      // Initial morning stretch
      scaleRef.current.set(0.92, 1.18, 0.92)
      velocityRef.current.set(0, 0, 0)
    }
    prevMoodRef.current = mood
  }, [mood])

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
    let targetScale = new THREE.Vector3(1 - breathOffset * 0.5, 1 + breathOffset, 1 - breathOffset * 0.5)

    if (mood === 'waking_up') {
      wakeTimerRef.current += delta
      if (wakeTimerRef.current < 0.65) {
        // Morning stretch tall!
        targetScale = new THREE.Vector3(0.92, 1.18, 0.92)
      } else {
        const hopP = Math.min(1, (wakeTimerRef.current - 0.65) / 0.70)
        if (hopP < 0.85) {
          // Mid-air joyful stretch
          targetScale = new THREE.Vector3(0.94, 1.14, 0.94)
        } else {
          // Soft squish upon landing
          targetScale = new THREE.Vector3(1.16, 0.86, 1.16)
          if (!hasLandedRef.current) {
            hasLandedRef.current = true
            triggerSquish(0.72)
          }
        }
      }
    }

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
    const isExhausted = (energy ?? 100) <= 15
    const floatSpeed = isSleeping ? 1.0 : (mood === 'anticipating' || mood === 'eating' || mood === 'washing' || mood === 'full' || mood === 'waking_up') ? 0 : mood === 'sleepy' ? (isExhausted ? 0.75 : 1.2) : 2.0
    const floatHeight = isSleeping ? 0.08 : (mood === 'anticipating' || mood === 'eating' || mood === 'washing' || mood === 'full' || mood === 'waking_up') ? 0 : mood === 'sleepy' ? (isExhausted ? 0.045 : 0.09) : 0.15
    let targetY = Math.sin(t * floatSpeed) * floatHeight
    if (mood === 'anticipating') {
      targetY = 0 // Centered mouth height for incoming treat
    } else if (mood === 'eating') {
      // Gentle sweet happy wiggle of delight
      targetY = Math.sin(t * 9) * 0.02
    } else if (mood === 'washing') {
      // Playful bath scrub wiggle
      targetY = Math.sin(t * 11) * 0.025
    } else if (mood === 'full') {
      // Contented belly bounce
      targetY = Math.sin(t * 6) * 0.02
    } else if (mood === 'waking_up') {
      if (wakeTimerRef.current < 0.65) {
        // Subtle morning stretch bob
        targetY = 0.04
      } else {
        // Joyful wake-up jump!
        const hopP = Math.min(1, (wakeTimerRef.current - 0.65) / 0.70)
        targetY = Math.sin(hopP * Math.PI) * 0.50
      }
    }
    groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, targetY, 0.12)

    // Rotation / Head orientation
    if (isSleeping) {
      // Gentle restful tilt
      const sleepTiltZ = Math.sin(t * 0.8) * 0.08 + 0.06
      groupRef.current.rotation.z = THREE.MathUtils.lerp(groupRef.current.rotation.z, sleepTiltZ, 0.05)
      groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, 0.1, 0.05)
      groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, 0.08, 0.05)
    } else if (mood === 'waking_up') {
      if (wakeTimerRef.current < 0.65) {
        // Morning stretch lean-back with sleepy wiggle
        const stretchWiggle = Math.sin(t * 8) * 0.04
        groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, -0.16, 0.15)
        groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, stretchWiggle, 0.15)
        groupRef.current.rotation.z = THREE.MathUtils.lerp(groupRef.current.rotation.z, -stretchWiggle * 0.5, 0.15)
      } else {
        // Joyful mid-air hop & twist!
        const hopP = Math.min(1, (wakeTimerRef.current - 0.65) / 0.70)
        const hopTwist = Math.sin(hopP * Math.PI * 2) * 0.32
        groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, 0.05, 0.2)
        groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, hopTwist, 0.25)
        groupRef.current.rotation.z = THREE.MathUtils.lerp(groupRef.current.rotation.z, Math.sin(hopP * Math.PI) * 0.08, 0.2)
      }
    } else if (mood === 'full') {
      // Cute rhythmic "no thank you!" head shake and contented belly lean
      const headShake = Math.sin(t * 10) * 0.30
      const tummyLean = -0.12 + Math.sin(t * 5) * 0.025
      groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, tummyLean, 0.15)
      groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, headShake, 0.22)
      groupRef.current.rotation.z = THREE.MathUtils.lerp(groupRef.current.rotation.z, -headShake * 0.22, 0.18)
    } else if (mood === 'anticipating') {
      // Pet faces front and center, tilting slightly forward eagerly to catch the incoming treat
      groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, -0.05, 0.15)
      groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, 0.0, 0.15)
      groupRef.current.rotation.z = THREE.MathUtils.lerp(groupRef.current.rotation.z, 0.0, 0.15)
    } else if (mood === 'eating') {
      // Gentle sweet head sway of pure contentment
      const chewBob = Math.sin(t * 9) * 0.02
      const chewWiggle = Math.sin(t * 4.5) * 0.015
      groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, -0.02 + chewBob, 0.15)
      groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, chewWiggle, 0.15)
      groupRef.current.rotation.z = THREE.MathUtils.lerp(groupRef.current.rotation.z, -chewWiggle * 0.5, 0.15)
    } else if (mood === 'washing') {
      // Pet stays facing forward with zero body rotation, enjoying the back scrub!
      const washTickle = Math.sin(t * 11) * 0.025
      groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, -0.02 + washTickle, 0.15)
      groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, 0.0, 0.15)
      groupRef.current.rotation.z = THREE.MathUtils.lerp(groupRef.current.rotation.z, 0.0, 0.15)
    } else if (mood === 'sleepy') {
      // Drowsy sluggish follow with heavy tired head-drop nod
      const nodSpeed = isExhausted ? 0.95 : 1.4
      const nodAmp = isExhausted ? 0.18 : 0.06
      const nodBase = isExhausted ? 0.15 : 0.05
      const sleepNod = Math.sin(t * nodSpeed) * nodAmp + nodBase
      const targetRotY = pointer.x * (isExhausted ? 0.09 : 0.3)
      const targetRotX = -pointer.y * (isExhausted ? 0.06 : 0.2) + sleepNod
      const targetRotZ = Math.sin(t * 0.6) * (isExhausted ? 0.08 : 0.04)

      groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, targetRotY, isExhausted ? 0.03 : 0.05)
      groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, targetRotX, isExhausted ? 0.035 : 0.05)
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

    // Update dynamic face & gaze tracking
    let gazeX = isSleeping ? 0 : pointer.x
    let gazeY = isSleeping ? 0 : pointer.y
    if (mood === 'anticipating') {
      // Eyes eagerly locked on incoming strawberry from bottom-right!
      gazeX = 0.45
      gazeY = -0.55
    } else if (mood === 'washing') {
      // Relaxed blissful gaze while facing forward
      gazeX = 0
      gazeY = 0
    }
    faceGenerator.update(mood, gazeX, gazeY, delta, color.blushHex, cleanliness)
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

      {/* 3D Cartoon Dirt Patches & Low Hygiene Effects */}
      <DirtPatches3D cleanliness={cleanliness} isWashing={mood === 'washing'} />

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
        onWakeUp={onWakeUp}
      />

      {/* 3D Wash Arm & Wash Stick for washing back */}
      {mood === 'washing' && <WashStick3D color={color} />}
    </group>
  )
}
