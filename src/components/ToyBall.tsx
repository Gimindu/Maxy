import { useRef, useState, useEffect } from 'react'
import * as THREE from 'three'
import { useFrame, ThreeEvent } from '@react-three/fiber'

interface ToyBallProps {
  active: boolean
  onBounced: () => void
  onHitMaxy?: (normal: THREE.Vector3) => void
}

export function ToyBall({ active, onBounced, onHitMaxy }: ToyBallProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  // Start lower closer to floor so it doesn't bounce violently on spawn
  const pos = useRef(new THREE.Vector3(1.4, 0.2, 0.4))
  const vel = useRef(new THREE.Vector3(-0.01, 0.01, 0))

  // Hold / Drag state
  const isHolding = useRef(false)
  const [isGrabbed, setIsGrabbed] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const dragPlane = useRef(new THREE.Plane(new THREE.Vector3(0, 0, 1), -0.4))
  const lastPointerPos = useRef(new THREE.Vector3())
  const lastPointerTime = useRef(0)

  // Spring squish & stretch on impact
  const squash = useRef(1.0)
  const squashVel = useRef(0.0)

  // Reset ball position when activated
  useEffect(() => {
    if (active) {
      pos.current.set(1.4, 0.2, 0.4)
      vel.current.set(-0.01, 0.01, 0)
      squash.current = 1.0
      squashVel.current = 0.0
      isHolding.current = false
      setIsGrabbed(false)
    }
  }, [active])

  const triggerImpactSquash = (factor = 0.78) => {
    squash.current = factor
    squashVel.current = 0.0
  }

  // Pointer down: grab and hold the ball
  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    isHolding.current = true
    setIsGrabbed(true)

    // Set drag plane at current ball depth Z
    dragPlane.current.set(new THREE.Vector3(0, 0, 1), -pos.current.z)
    lastPointerPos.current.copy(pos.current)
    lastPointerTime.current = performance.now()
    vel.current.set(0, 0, 0)
    squash.current = 1.06

    try {
      ;(e.target as HTMLElement)?.setPointerCapture?.(e.pointerId)
    } catch {
      // Ignore if not supported
    }

    const handleWindowPointerUp = () => {
      if (!isHolding.current) return
      isHolding.current = false
      setIsGrabbed(false)

      window.removeEventListener('pointerup', handleWindowPointerUp)
      window.removeEventListener('pointercancel', handleWindowPointerUp)

      // Low, controlled throw momentum
      if (vel.current.length() < 0.015) {
        // Gentle low nudge if released almost still
        vel.current.set((Math.random() - 0.5) * 0.04, 0.05, -0.02)
      } else {
        // Clamp throwing momentum so it stays low and manageable
        vel.current.clampLength(0, 0.15)
        vel.current.z = THREE.MathUtils.clamp(vel.current.z - 0.02, -0.08, 0.05)
      }
    }

    window.addEventListener('pointerup', handleWindowPointerUp)
    window.addEventListener('pointercancel', handleWindowPointerUp)
  }

  useFrame((state, delta) => {
    if (!active || !meshRef.current) return

    // Spring solver for squish & stretch elastic recovery
    const k = 220
    const d = 14
    const force = (1.0 - squash.current) * k - squashVel.current * d
    squashVel.current += force * delta
    squash.current += squashVel.current * delta
    squash.current = THREE.MathUtils.clamp(squash.current, 0.65, 1.3)

    // Ball radius
    const ballRadius = 0.35

    if (isHolding.current) {
      // 1. WHILE HOLDING: follow pointer ray smoothly on drag plane
      const hitPoint = new THREE.Vector3()
      if (state.raycaster.ray.intersectPlane(dragPlane.current, hitPoint)) {
        // Clamp to screen bounds
        hitPoint.x = THREE.MathUtils.clamp(hitPoint.x, -2.4, 2.4)
        hitPoint.y = THREE.MathUtils.clamp(hitPoint.y, -1.05, 2.2)
        hitPoint.z = THREE.MathUtils.clamp(hitPoint.z, -1.2, 1.6)

        // Check collision with Maxy while dragging so ball cannot penetrate Maxy
        const maxyCore = 0.48
        const maxySkin = 0.52
        const R_coll = maxySkin + ballRadius // ~0.87
        const rel = hitPoint.clone()
        const closestCore = new THREE.Vector3(
          THREE.MathUtils.clamp(rel.x, -maxyCore, maxyCore),
          THREE.MathUtils.clamp(rel.y, -maxyCore, maxyCore),
          THREE.MathUtils.clamp(rel.z, -maxyCore, maxyCore)
        )
        const diff = rel.clone().sub(closestCore)
        const dist = diff.length()

        if (dist < R_coll) {
          // Push ball to surface of Maxy
          const normal = dist > 0.001 ? diff.normalize() : new THREE.Vector3(0, 0, 1)
          hitPoint.copy(closestCore).addScaledVector(normal, R_coll + 0.005)
          onHitMaxy?.(normal)
        }

        // Calculate throwing velocity from frame movement
        const now = performance.now()
        const dt = Math.max(1, now - lastPointerTime.current)
        const moveDelta = hitPoint.clone().sub(pos.current)

        vel.current.x = THREE.MathUtils.lerp(vel.current.x, (moveDelta.x / dt) * 14, 0.45)
        vel.current.y = THREE.MathUtils.lerp(vel.current.y, (moveDelta.y / dt) * 14, 0.45)
        vel.current.z = THREE.MathUtils.lerp(vel.current.z, (moveDelta.z / dt) * 14, 0.45)

        pos.current.copy(hitPoint)
        lastPointerPos.current.copy(hitPoint)
        lastPointerTime.current = now
      }
    } else {
      // 2. IN FREE FLIGHT: Controlled Low-Bounce Physics
      // Solid downward gravity to prevent high floaty bouncing
      vel.current.y -= 0.0082

      // Air resistance
      vel.current.multiplyScalar(0.992)

      // Apply velocity
      pos.current.add(vel.current)

      // --- MAXY COLLISION & LOW BOUNCE BACK ---
      const maxyCore = 0.48
      const maxySkin = 0.52
      const R_coll = maxySkin + ballRadius // 0.87

      const rel = pos.current.clone()
      const closestCore = new THREE.Vector3(
        THREE.MathUtils.clamp(rel.x, -maxyCore, maxyCore),
        THREE.MathUtils.clamp(rel.y, -maxyCore, maxyCore),
        THREE.MathUtils.clamp(rel.z, -maxyCore, maxyCore)
      )

      const diff = rel.clone().sub(closestCore)
      const dist = diff.length()

      if (dist < R_coll) {
        // Impact with Maxy detected!
        const normal = dist > 0.001 ? diff.normalize() : new THREE.Vector3(0, 0, 1)

        // Push ball out to surface immediately (prevents passing through)
        pos.current.copy(closestCore).addScaledVector(normal, R_coll + 0.006)

        // Reflect velocity along collision normal with low restitution (0.52)
        const dot = vel.current.dot(normal)
        if (dot < 0) {
          vel.current.sub(normal.clone().multiplyScalar(2 * dot))
          // Low bounce restitution
          vel.current.multiplyScalar(0.52)

          // Modest bounce back impulse
          const minBounceSpeed = 0.065
          if (vel.current.length() < minBounceSpeed) {
            vel.current.addScaledVector(normal, minBounceSpeed)
          }

          // Gentle low upward pop
          vel.current.y += 0.015

          // Trigger visual squish and sound/stars
          triggerImpactSquash(0.72)
          onBounced()
          onHitMaxy?.(normal)
        }
      }

      // --- FLOOR COLLISION (Low bounce & fast settling) ---
      const floorY = -1.1
      if (pos.current.y < floorY) {
        pos.current.y = floorY
        // Settle quickly when vertical bounce is low
        if (Math.abs(vel.current.y) > 0.035) {
          // Low floor restitution (0.45)
          vel.current.y = -vel.current.y * 0.45
          vel.current.x *= 0.85
          vel.current.z *= 0.85
          triggerImpactSquash(0.82)
          onBounced()
        } else {
          // Ball settles on floor and rolls smoothly
          vel.current.y = 0
          vel.current.x *= 0.88
          vel.current.z *= 0.88
        }
      }

      // --- BOUNDARY WALL BOUNCES (Low rebound) ---
      if (pos.current.x > 2.4) {
        pos.current.x = 2.4
        vel.current.x = -Math.abs(vel.current.x) * 0.45
        triggerImpactSquash(0.85)
      } else if (pos.current.x < -2.4) {
        pos.current.x = -2.4
        vel.current.x = Math.abs(vel.current.x) * 0.45
        triggerImpactSquash(0.85)
      }

      if (pos.current.z > 1.9) {
        pos.current.z = 1.9
        vel.current.z = -Math.abs(vel.current.z) * 0.45
      } else if (pos.current.z < -1.3) {
        pos.current.z = -1.3
        vel.current.z = Math.abs(vel.current.z) * 0.45
      }
    }

    // Apply 3D position
    meshRef.current.position.copy(pos.current)

    // Ball roll based on ground and air movement
    if (!isHolding.current) {
      meshRef.current.rotation.x += vel.current.z * 10
      meshRef.current.rotation.z -= vel.current.x * 10
    }

    // Apply squish & stretch
    const s = squash.current
    meshRef.current.scale.set(
      (1 / Math.sqrt(s)) * (isGrabbed ? 1.06 : isHovered ? 1.03 : 1.0),
      s * (isGrabbed ? 0.95 : isHovered ? 1.03 : 1.0),
      (1 / Math.sqrt(s)) * (isGrabbed ? 1.06 : isHovered ? 1.03 : 1.0)
    )
  })

  if (!active) return null

  return (
    <group>
      {/* Glossy Red Toy Ball */}
      <mesh
        ref={meshRef}
        position={[1.4, 0.2, 0.4]}
        onPointerDown={handlePointerDown}
        onPointerOver={() => {
          setIsHovered(true)
          document.body.style.cursor = 'grab'
        }}
        onPointerOut={() => {
          setIsHovered(false)
          if (!isHolding.current) {
            document.body.style.cursor = 'auto'
          }
        }}
        castShadow
        receiveShadow
      >
        <sphereGeometry args={[0.35, 32, 32]} />
        <meshStandardMaterial
          color="#FF2A42"
          roughness={0.16}
          metalness={0.08}
        />
      </mesh>
    </group>
  )
}
