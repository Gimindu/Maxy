import { useRef, useMemo, useEffect, useState } from 'react'
import * as THREE from 'three'
import { useFrame, ThreeEvent } from '@react-three/fiber'
import { AccessoryType } from '../types/pet'

interface AccessoriesProps {
  accessory: AccessoryType
  petScale: [number, number, number]
  isSleeping?: boolean
  onWakeUp?: () => void
}

interface SleepHatProps {
  isSleeping?: boolean
  onWakeUp?: () => void
  isTumbling?: boolean
  onTumbleChange?: (tumbling: boolean) => void
}

function SleepHat({ 
  isSleeping = false, 
  onWakeUp,
  isTumbling = false,
  onTumbleChange,
}: SleepHatProps) {
  const hatRef = useRef<THREE.Group>(null)
  const pomRef = useRef<THREE.Group>(null)

  // Drag & drop interaction state
  const isDragging = useRef(false)
  const hasMoved = useRef(false)
  const dragPlane = useRef(new THREE.Plane(new THREE.Vector3(0, 0, 1), 0))
  const grabAnchorOffset = useRef(new THREE.Vector3())
  const velocity = useRef(new THREE.Vector3())
  const prevPos = useRef(new THREE.Vector3())
  const prevTime = useRef(0)

  // Spring-back recovery state if dropped without pulling away
  const isSpringingBack = useRef(false)

  // Tumble physics state on pull-off
  const tumbleProgress = useRef(0)
  const tumblePos = useRef(new THREE.Vector3())
  const tumbleVel = useRef(new THREE.Vector3())
  const tumbleRotVel = useRef(new THREE.Vector3())

  const rings = 22
  const radialSegments = 24

  // Pre-allocate geometry with indices and UVs for the smooth, continuous watertight nightcap cone
  const { geometry, positionsArray } = useMemo(() => {
    const geom = new THREE.BufferGeometry()
    const vertexCount = (rings + 1) * (radialSegments + 1)
    const positions = new Float32Array(vertexCount * 3)
    const uvs = new Float32Array(vertexCount * 2)
    const indices: number[] = []

    for (let r = 0; r <= rings; r++) {
      const v = r / rings
      for (let s = 0; s <= radialSegments; s++) {
        const u = s / radialSegments
        const idx = r * (radialSegments + 1) + s
        uvs[idx * 2] = u
        uvs[idx * 2 + 1] = v
      }
    }

    for (let r = 0; r < rings; r++) {
      for (let s = 0; s < radialSegments; s++) {
        const a = r * (radialSegments + 1) + s
        const b = (r + 1) * (radialSegments + 1) + s
        const c = (r + 1) * (radialSegments + 1) + (s + 1)
        const d = r * (radialSegments + 1) + (s + 1)
        indices.push(a, b, d)
        indices.push(b, c, d)
      }
    }

    geom.setIndex(indices)
    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geom.setAttribute('uv', new THREE.BufferAttribute(uvs, 2))
    return { geometry: geom, positionsArray: positions }
  }, [rings, radialSegments])

  useEffect(() => {
    return () => {
      geometry.dispose()
      document.body.style.cursor = 'auto'
    }
  }, [geometry])

  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    if (isTumbling) return

    isDragging.current = true
    hasMoved.current = false
    isSpringingBack.current = false

    // Align drag plane with camera facing hat's world Z
    const worldPos = new THREE.Vector3()
    hatRef.current?.getWorldPosition(worldPos)
    dragPlane.current.set(new THREE.Vector3(0, 0, 1), -worldPos.z)

    // Raycast hit point in parent local space
    const worldHit = new THREE.Vector3()
    if (e.ray.intersectPlane(dragPlane.current, worldHit) && hatRef.current?.parent) {
      const localHit = worldHit.clone()
      hatRef.current.parent.worldToLocal(localHit)
      grabAnchorOffset.current.copy(localHit).sub(hatRef.current.position)
    } else {
      grabAnchorOffset.current.set(0, 0, 0)
    }

    if (hatRef.current) {
      prevPos.current.copy(hatRef.current.position)
    }
    prevTime.current = performance.now()
    velocity.current.set(0, 0, 0)

    try {
      ;(e.target as HTMLElement)?.setPointerCapture?.(e.pointerId)
    } catch {}

    document.body.style.cursor = 'grabbing'

    const handlePointerUp = () => {
      window.removeEventListener('pointerup', handlePointerUp)
      window.removeEventListener('pointercancel', handlePointerUp)
      document.body.style.cursor = 'auto'

      if (!isDragging.current) return
      isDragging.current = false

      const currentPos = hatRef.current ? hatRef.current.position : new THREE.Vector3(0.05, 1.15, -0.05)
      const dispX = currentPos.x - 0.05
      const dispY = currentPos.y - 1.15
      const pullDist = Math.hypot(dispX, dispY)

      // If dragged away from head (pull-off threshold)
      if (hasMoved.current && (pullDist > 0.18 || dispY > 0.14 || Math.abs(dispX) > 0.16)) {
        // Trigger wake-up callback!
        onWakeUp?.()

        // Begin tumble and fly-off animation
        onTumbleChange?.(true)
        tumbleProgress.current = 0
        tumblePos.current.copy(currentPos)

        // Fling velocity with forward/upward pop
        const flingX = THREE.MathUtils.clamp(velocity.current.x * 0.75 + dispX * 2.8, -3.2, 3.2)
        const flingY = Math.max(1.8, velocity.current.y * 0.75 + Math.max(0.6, dispY * 2.8))
        const flingZ = THREE.MathUtils.clamp(velocity.current.z + 0.9, 0.4, 2.0)
        tumbleVel.current.set(flingX, flingY, flingZ)

        tumbleRotVel.current.set(
          (Math.random() - 0.5) * 3 + 3.2,
          (Math.random() - 0.5) * 4,
          dispX > 0 ? -6.5 : 6.5
        )
      } else {
        // Spring back onto head
        isSpringingBack.current = true
      }
    }

    window.addEventListener('pointerup', handlePointerUp)
    window.addEventListener('pointercancel', handlePointerUp)
  }

  const handlePointerOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    if (!isDragging.current && !isTumbling) {
      document.body.style.cursor = 'grab'
    }
  }

  const handlePointerOut = () => {
    if (!isDragging.current) {
      document.body.style.cursor = 'auto'
    }
  }

  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime()
    const breathRate = isSleeping ? 1.2 : 2.2
    const breath = Math.sin(t * breathRate)

    const basePos = new THREE.Vector3(0.05, 1.15 + breath * 0.012, -0.05)
    const baseRotZ = -0.06 + Math.sin(t * 1.5) * 0.02

    if (isTumbling) {
      tumbleProgress.current += delta
      const p = Math.min(1, tumbleProgress.current / 0.75)

      // Apply parabolic gravity arc
      tumbleVel.current.y -= 9.8 * delta * 0.9
      tumblePos.current.addScaledVector(tumbleVel.current, delta)

      if (hatRef.current) {
        hatRef.current.position.copy(tumblePos.current)
        hatRef.current.rotation.x += tumbleRotVel.current.x * delta
        hatRef.current.rotation.y += tumbleRotVel.current.y * delta
        hatRef.current.rotation.z += tumbleRotVel.current.z * delta
        // Shrink & vanish softly
        const scale = Math.max(0.001, 1 - Math.pow(p, 2.2))
        hatRef.current.scale.setScalar(scale)
      }

      if (p >= 1) {
        if (hatRef.current) {
          hatRef.current.scale.setScalar(1)
          hatRef.current.position.copy(basePos)
          hatRef.current.rotation.set(0, 0, baseRotZ)
        }
        onTumbleChange?.(false)
      }
      return
    }

    // Secondary cloth sway
    const sway1 = Math.sin(t * 1.8) * 0.05
    const sway2 = Math.cos(t * 2.3) * 0.04
    const droopBounce = Math.sin(t * (isSleeping ? 1.4 : 3.0)) * (isSleeping ? 0.02 : 0.035)

    if (isDragging.current && hatRef.current) {
      const worldHit = new THREE.Vector3()
      if (state.raycaster.ray.intersectPlane(dragPlane.current, worldHit) && hatRef.current.parent) {
        const localHit = worldHit.clone()
        hatRef.current.parent.worldToLocal(localHit)
        const targetPos = localHit.sub(grabAnchorOffset.current)

        const dist = targetPos.distanceTo(basePos)
        if (dist > 0.04) {
          hasMoved.current = true
        }

        // Velocity tracking
        const now = performance.now()
        const dt = Math.max(1, now - prevTime.current) / 1000
        velocity.current.x = (targetPos.x - prevPos.current.x) / dt
        velocity.current.y = (targetPos.y - prevPos.current.y) / dt
        velocity.current.z = (targetPos.z - prevPos.current.z) / dt
        prevPos.current.copy(targetPos)
        prevTime.current = now

        // Clamp bounds
        targetPos.x = THREE.MathUtils.clamp(targetPos.x, -2.4, 2.4)
        targetPos.y = THREE.MathUtils.clamp(targetPos.y, 0.4, 3.2)
        targetPos.z = THREE.MathUtils.clamp(targetPos.z, -0.3, 1.2)

        hatRef.current.position.copy(targetPos)

        // Dynamic tilt with pull
        const pullX = targetPos.x - basePos.x
        const pullY = targetPos.y - basePos.y
        hatRef.current.rotation.z = baseRotZ - pullX * 0.5
        hatRef.current.rotation.x = pullY * 0.35
        hatRef.current.rotation.y = pullX * 0.25
      }
    } else if (isSpringingBack.current && hatRef.current) {
      hatRef.current.position.lerp(basePos, 0.22)
      hatRef.current.rotation.z = THREE.MathUtils.lerp(hatRef.current.rotation.z, baseRotZ, 0.22)
      hatRef.current.rotation.x = THREE.MathUtils.lerp(hatRef.current.rotation.x, 0, 0.22)
      hatRef.current.rotation.y = THREE.MathUtils.lerp(hatRef.current.rotation.y, 0, 0.22)

      if (hatRef.current.position.distanceTo(basePos) < 0.008) {
        hatRef.current.position.copy(basePos)
        hatRef.current.rotation.set(0, 0, baseRotZ)
        isSpringingBack.current = false
      }
    } else if (hatRef.current) {
      hatRef.current.position.copy(basePos)
      hatRef.current.rotation.z = baseRotZ
      hatRef.current.rotation.x = 0
      hatRef.current.rotation.y = 0
      hatRef.current.scale.setScalar(1)
    }

    // Dynamic 3D spine control points for a graceful drooping curve with ZERO holes
    const p0 = new THREE.Vector3(0, 0.02, 0)
    const p1 = new THREE.Vector3(0.02, 0.22, -0.01)
    const p2 = new THREE.Vector3(0.08 + sway1 * 0.35, 0.44 + breath * 0.01, -0.03)
    const p3 = new THREE.Vector3(0.24 + sway1 * 0.75, 0.62 + breath * 0.015, -0.06)
    const p4 = new THREE.Vector3(0.48 + sway1 * 1.15, 0.64 + droopBounce * 0.7, -0.09)
    const p5 = new THREE.Vector3(0.68 + sway1 * 1.55, 0.50 + droopBounce * 1.2, -0.12)
    const p6 = new THREE.Vector3(0.82 + sway1 * 1.95 + sway2, 0.32 + droopBounce * 1.6, -0.14)

    const curve = new THREE.CatmullRomCurve3([p0, p1, p2, p3, p4, p5, p6])
    // Use parallel-transport Frenet frames to eliminate any 90-degree twisting glitches
    const { normals, binormals } = curve.computeFrenetFrames(rings, false)

    // Update mesh vertices along the dynamic spline curve
    for (let r = 0; r <= rings; r++) {
      const u = r / rings
      const center = curve.getPoint(u)
      const normal = normals[r]
      const binormal = binormals[r]

      // Smooth taper: base fits in fluffy cloud brim, tip fits snugly in pom-pom
      const radius = 0.50 * Math.pow(1 - u, 0.82) + 0.04

      for (let s = 0; s <= radialSegments; s++) {
        const theta = (s / radialSegments) * Math.PI * 2
        const cos = Math.cos(theta)
        const sin = Math.sin(theta)

        const vx = center.x + radius * (cos * normal.x + sin * binormal.x)
        const vy = center.y + radius * (cos * normal.y + sin * binormal.y)
        const vz = center.z + radius * (cos * normal.z + sin * binormal.z)

        const idx = (r * (radialSegments + 1) + s) * 3
        positionsArray[idx] = vx
        positionsArray[idx + 1] = vy
        positionsArray[idx + 2] = vz
      }
    }

    // Flag position buffer update and recompute silky smooth lighting normals
    const posAttr = geometry.attributes.position as THREE.BufferAttribute
    posAttr.needsUpdate = true
    geometry.computeVertexNormals()

    // Animate pom-pom seamlessly attached to the swaying tip
    if (pomRef.current) {
      const tipTangent = curve.getTangent(1.0).normalize()
      const pomPos = p6.clone().addScaledVector(tipTangent, 0.12)
      pomRef.current.position.copy(pomPos)
      // Delicate pom-pom secondary jiggle
      pomRef.current.scale.setScalar(1.0 + Math.sin(t * 4.5) * 0.04)
    }
  })

  return (
    <group 
      ref={hatRef} 
      position={[0.05, 1.15, -0.05]}
      onPointerDown={handlePointerDown}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
    >
      {/* Generous invisible touch target so dragging is effortless on phones and desktop */}
      <mesh position={[0.3, 0.35, 0]}>
        <sphereGeometry args={[0.75, 12, 12]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      {/* Fluffy white cloud brim */}
      <mesh position={[0, 0.04, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <torusGeometry args={[0.52, 0.13, 16, 32]} />
        <meshStandardMaterial color="#FFFFFF" roughness={0.96} />
      </mesh>

      {/* Seamless, twist-free, fully animated continuous 3D nightcap mesh */}
      <mesh geometry={geometry} castShadow receiveShadow>
        <meshStandardMaterial
          color="#4338CA"
          roughness={0.7}
          metalness={0.06}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Golden Moon decal on front of hat */}
      <group position={[0, 0.16, 0.50]} rotation={[0.22, 0, -0.2]}>
        <mesh castShadow>
          <sphereGeometry args={[0.095, 16, 16]} />
          <meshStandardMaterial
            color="#FFD166"
            emissive="#FFAA00"
            emissiveIntensity={0.65}
            roughness={0.25}
            metalness={0.4}
          />
        </mesh>
      </group>

      {/* Swaying fluffy Pom-pom attached seamlessly to the moving tip */}
      <group ref={pomRef} position={[0.82, 0.32, -0.14]}>
        <mesh castShadow>
          <sphereGeometry args={[0.16, 20, 20]} />
          <meshStandardMaterial color="#FFFFFF" roughness={0.96} />
        </mesh>
      </group>
    </group>
  )
}

export function Accessories({ accessory, isSleeping = false, onWakeUp }: AccessoriesProps) {
  const [isHatTumbling, setIsHatTumbling] = useState(false)
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

  // When sleeping or nightcap is tumbling off, wear/show the Sleep Hat!
  if (isSleeping || isHatTumbling) {
    return (
      <group>
        <SleepHat 
          isSleeping={isSleeping} 
          onWakeUp={onWakeUp} 
          isTumbling={isHatTumbling}
          onTumbleChange={setIsHatTumbling}
        />
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
    return (
      <SleepHat 
        isSleeping={isSleeping} 
        onWakeUp={onWakeUp} 
        isTumbling={isHatTumbling}
        onTumbleChange={setIsHatTumbling}
      />
    )
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
