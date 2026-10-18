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

  // Reset ball position when activated in the foreground
  useEffect(() => {
    if (active) {
      pos.current.set(1.2, 0.35, 1.0)
      vel.current.set(-0.03, 0.05, 0.04)
      squash.current = 1.0
      squashVel.current = 0.0
      isHolding.current = false
      setIsGrabbed(false)
    }
  }, [active])

  const triggerImpactSquash = (factor = 0.92) => {
    squash.current = Math.max(0.88, factor)
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
    squash.current = 1.02

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

      // Controlled 3D throw momentum with natural forward/backward arc
      if (vel.current.length() < 0.02) {
        // Gentle toss forward into the foreground
        vel.current.set((Math.random() - 0.5) * 0.04, 0.07, 0.04 + Math.random() * 0.03)
      } else {
        // Lively 3D throw momentum
        vel.current.clampLength(0, 0.32)
        vel.current.z = THREE.MathUtils.clamp(vel.current.z, -0.22, 0.22)
      }
    }

    window.addEventListener('pointerup', handleWindowPointerUp)
    window.addEventListener('pointercancel', handleWindowPointerUp)
  }

  useFrame((state, delta) => {
    if (!active || !meshRef.current) return

    // Firm, responsive spring solver for crisp rubber elasticity (no excessive squishing)
    const k = 360
    const d = 22
    const force = (1.0 - squash.current) * k - squashVel.current * d
    squashVel.current += force * delta
    squash.current += squashVel.current * delta
    squash.current = THREE.MathUtils.clamp(squash.current, 0.88, 1.10)

    // Ball radius
    const ballRadius = 0.35

    if (isHolding.current) {
      // 1. WHILE HOLDING: follow pointer ray smoothly with natural perspective depth
      const hitPoint = new THREE.Vector3()
      if (state.raycaster.ray.intersectPlane(dragPlane.current, hitPoint)) {
        // Perspective depth: dragging towards bottom of screen brings ball forward (larger);
        // dragging upwards pushes it deeper towards Maxy
        const targetZ = THREE.MathUtils.lerp(1.8, -0.4, (hitPoint.y + 1.0) / 2.2)
        hitPoint.z = THREE.MathUtils.lerp(pos.current.z, targetZ, 0.18)

        // Dynamic viewport at pointer depth so the ball can be dragged across the full screen
        const vp = state.viewport.getCurrentViewport(state.camera, hitPoint)
        const halfW = vp.width / 2 - ballRadius * 0.3
        const topY = state.camera.position.y + vp.height / 2 - ballRadius * 0.3
        const floorY = -1.05

        hitPoint.x = THREE.MathUtils.clamp(hitPoint.x, -halfW, halfW)
        hitPoint.y = THREE.MathUtils.clamp(hitPoint.y, floorY, topY)
        hitPoint.z = THREE.MathUtils.clamp(hitPoint.z, -3.2, state.camera.position.z - 0.75)

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

        // Calculate throwing velocity with full 3D XYZ momentum
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
      // 2. IN FREE FLIGHT: Lively 3D Rubber Ball Physics
      // Smooth downward gravity (clean natural arc)
      vel.current.y -= 0.0055

      // Light air resistance
      vel.current.multiplyScalar(0.994)

      // Apply velocity
      pos.current.add(vel.current)

      // --- MAXY COLLISION & BOUNCE BACK ---
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

        // Reflect velocity along collision normal
        const dot = vel.current.dot(normal)
        if (dot < 0) {
          vel.current.sub(normal.clone().multiplyScalar(2 * dot))
          // Lively bounce restitution off Maxy
          vel.current.multiplyScalar(0.72)

          // Nice energetic bounce back impulse
          const minBounceSpeed = 0.095
          if (vel.current.length() < minBounceSpeed) {
            vel.current.addScaledVector(normal, minBounceSpeed)
          }

          // Cheerful upward bounce pop
          vel.current.y += 0.035

          // Bounce forward towards the screen/player!
          vel.current.z = Math.max(vel.current.z, 0.09 + Math.random() * 0.05)

          // Crisp, firm squish
          triggerImpactSquash(0.90)
          onBounced()
          onHitMaxy?.(normal)
        }
      }

      // --- FLOOR COLLISION (Natural 3D bounce & rolling) ---
      const floorY = -1.1
      if (pos.current.y < floorY) {
        pos.current.y = floorY
        // Continue bouncing down to gentle micro-hops
        if (Math.abs(vel.current.y) > 0.012) {
          // Playful rubber ball bounce restitution (0.68)
          vel.current.y = -vel.current.y * 0.68
          vel.current.x *= 0.92
          vel.current.z *= 0.92

          // Add subtle 3D forward variance so it comes to the front
          if (pos.current.z < 1.2) {
            vel.current.z += 0.012 + Math.random() * 0.015
          } else if (pos.current.z > 2.8) {
            vel.current.z -= 0.015
          }

          triggerImpactSquash(0.92)
          onBounced()
        } else {
          // Ball settles on floor and rolls smoothly in 3D
          vel.current.y = 0
          vel.current.x *= 0.94
          vel.current.z *= 0.94
        }
      }

      // --- DYNAMIC SCREEN & ROOM BOUNDARY BOUNCES ---
      // Uses the actual screen viewport dimensions at the ball's current depth
      const vp = state.viewport.getCurrentViewport(state.camera, pos.current)
      const halfW = vp.width / 2 - ballRadius
      const topY = state.camera.position.y + vp.height / 2 - ballRadius
      const screenGlassZ = state.camera.position.z - 0.85
      const backWallZ = -3.5

      // Left & Right screen edges
      if (pos.current.x > halfW) {
        pos.current.x = halfW
        vel.current.x = -Math.abs(vel.current.x) * 0.72
        triggerImpactSquash(0.93)
        onBounced()
      } else if (pos.current.x < -halfW) {
        pos.current.x = -halfW
        vel.current.x = Math.abs(vel.current.x) * 0.72
        triggerImpactSquash(0.93)
        onBounced()
      }

      // Ceiling / Top screen edge
      if (pos.current.y > topY) {
        pos.current.y = topY
        vel.current.y = -Math.abs(vel.current.y) * 0.68
        triggerImpactSquash(0.93)
        onBounced()
      }

      // Front screen glass: hits directly in front of the camera and rebounds backwards
      if (pos.current.z > screenGlassZ) {
        pos.current.z = screenGlassZ
        vel.current.z = -Math.max(0.09, Math.abs(vel.current.z) * 0.72)
        triggerImpactSquash(0.88)
        onBounced()
      } else if (pos.current.z < backWallZ) {
        pos.current.z = backWallZ
        vel.current.z = Math.max(0.09, Math.abs(vel.current.z) * 0.70)
        triggerImpactSquash(0.93)
        onBounced()
      }
    }

    // Apply 3D position
    meshRef.current.position.copy(pos.current)

    // Ball roll based on ground and air movement
    if (!isHolding.current) {
      meshRef.current.rotation.x += vel.current.z * 10
      meshRef.current.rotation.z -= vel.current.x * 10
    }

    // Apply squish & stretch: firm, subtle rubber ball deformation
    const s = squash.current
    const lateral = 1 / Math.sqrt(s)
    const grabScale = isGrabbed ? 1.04 : isHovered ? 1.02 : 1.0
    meshRef.current.scale.set(
      lateral * grabScale,
      s * grabScale,
      lateral * grabScale
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
