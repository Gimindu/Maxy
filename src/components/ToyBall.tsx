import { useRef, useState, useMemo, useEffect } from 'react'
import * as THREE from 'three'
import { useFrame, ThreeEvent, useThree } from '@react-three/fiber'

interface ToyBallProps {
  active: boolean
  onBounced: () => void
  onHitMaxy?: (normal: THREE.Vector3) => void
}

// Generate a vibrant, colorful striped beach-ball texture
function createBeachBallTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 256
  const ctx = canvas.getContext('2d')
  if (!ctx) return null

  // 6 vibrant beach-ball segments
  const colors = [
    '#FF5964', // Coral Red
    '#FFFFFF', // White
    '#118AB2', // Ocean Blue
    '#FFD166', // Sunshine Yellow
    '#06D6A0', // Mint Green
    '#FF9F1C', // Vivid Orange
  ]

  const stripeWidth = canvas.width / colors.length
  colors.forEach((col, i) => {
    ctx.fillStyle = col
    ctx.fillRect(i * stripeWidth, 0, stripeWidth, canvas.height)

    // Subtle seam contour
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.08)'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(i * stripeWidth, 0)
    ctx.lineTo(i * stripeWidth, canvas.height)
    ctx.stroke()
  })

  // White pole caps at top and bottom
  ctx.fillStyle = '#FFFFFF'
  ctx.beginPath()
  ctx.ellipse(canvas.width / 2, 0, canvas.width / 2, 34, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.beginPath()
  ctx.ellipse(canvas.width / 2, canvas.height, canvas.width / 2, 34, 0, 0, Math.PI * 2)
  ctx.fill()

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

export function ToyBall({ active, onBounced, onHitMaxy }: ToyBallProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const pos = useRef(new THREE.Vector3(1.5, 1.3, 0.4))
  const vel = useRef(new THREE.Vector3(-0.02, 0.04, 0.01))

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

  // Beach ball texture
  const ballTexture = useMemo(() => {
    return createBeachBallTexture()
  }, [])

  useEffect(() => {
    return () => {
      ballTexture?.dispose()
    }
  }, [ballTexture])

  // Reset ball position when activated
  useEffect(() => {
    if (active) {
      pos.current.set(1.5, 1.3, 0.4)
      vel.current.set(-0.02, 0.04, 0.01)
      squash.current = 1.0
      squashVel.current = 0.0
      isHolding.current = false
      setIsGrabbed(false)
    }
  }, [active])

  const triggerImpactSquash = (factor = 0.68) => {
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
    squash.current = 1.08

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

      // If user released after holding almost still, give it a gentle toss
      if (vel.current.length() < 0.015) {
        vel.current.set((Math.random() - 0.5) * 0.06, 0.12, -0.04)
      } else {
        // Clamp throwing momentum so it doesn't fly out of control
        vel.current.clampLength(0, 0.24)
        // Add a slight natural depth toss towards the playfield
        vel.current.z = THREE.MathUtils.clamp(vel.current.z - 0.03, -0.12, 0.08)
      }
    }

    window.addEventListener('pointerup', handleWindowPointerUp)
    window.addEventListener('pointercancel', handleWindowPointerUp)
  }

  useFrame((state, delta) => {
    if (!active || !meshRef.current) return

    // Spring solver for squish & stretch elastic recovery
    const k = 240
    const d = 12
    const force = (1.0 - squash.current) * k - squashVel.current * d
    squashVel.current += force * delta
    squash.current += squashVel.current * delta
    squash.current = THREE.MathUtils.clamp(squash.current, 0.5, 1.4)

    // Ball radius
    const ballRadius = 0.35

    if (isHolding.current) {
      // 1. WHILE HOLDING: follow pointer ray smoothly on drag plane
      const hitPoint = new THREE.Vector3()
      if (state.raycaster.ray.intersectPlane(dragPlane.current, hitPoint)) {
        // Clamp to screen bounds
        hitPoint.x = THREE.MathUtils.clamp(hitPoint.x, -2.5, 2.5)
        hitPoint.y = THREE.MathUtils.clamp(hitPoint.y, -1.05, 2.4)
        hitPoint.z = THREE.MathUtils.clamp(hitPoint.z, -1.2, 1.8)

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

        vel.current.x = THREE.MathUtils.lerp(vel.current.x, (moveDelta.x / dt) * 16, 0.5)
        vel.current.y = THREE.MathUtils.lerp(vel.current.y, (moveDelta.y / dt) * 16, 0.5)
        vel.current.z = THREE.MathUtils.lerp(vel.current.z, (moveDelta.z / dt) * 16, 0.5)

        pos.current.copy(hitPoint)
        lastPointerPos.current.copy(hitPoint)
        lastPointerTime.current = now
      }
    } else {
      // 2. IN FREE FLIGHT: Physics & Bouncing
      // Gravity
      vel.current.y -= 0.0062

      // Air resistance
      vel.current.multiplyScalar(0.995)

      // Apply velocity
      pos.current.add(vel.current)

      // --- MAXY COLLISION & BOUNCE BACK ---
      // Maxy rounded box dimensions: half extents 1.0, corner radius 0.52 -> core box half-extents 0.48
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
        pos.current.copy(closestCore).addScaledVector(normal, R_coll + 0.008)

        // Reflect velocity along collision normal
        const dot = vel.current.dot(normal)
        if (dot < 0) {
          // V' = V - 2 * (V . N) * N
          vel.current.sub(normal.clone().multiplyScalar(2 * dot))
          // Elastic bounce restitution
          vel.current.multiplyScalar(0.85)

          // Guarantee an energetic bounce back away from Maxy
          const minBounceSpeed = 0.13
          if (vel.current.length() < minBounceSpeed) {
            vel.current.addScaledVector(normal, minBounceSpeed)
          }

          // Playful upward bounce arc
          vel.current.y += 0.035

          // Trigger visual squish and sound/stars
          triggerImpactSquash(0.65)
          onBounced()
          onHitMaxy?.(normal)
        }
      }

      // --- FLOOR COLLISION ---
      const floorY = -1.1
      if (pos.current.y < floorY) {
        pos.current.y = floorY
        if (Math.abs(vel.current.y) > 0.02) {
          vel.current.y = -vel.current.y * 0.76
          vel.current.x *= 0.95
          vel.current.z *= 0.95
          triggerImpactSquash(0.78)
          onBounced()
        } else {
          vel.current.y = 0
          vel.current.x *= 0.92
          vel.current.z *= 0.92
        }
      }

      // --- BOUNDARY WALL BOUNCES ---
      if (pos.current.x > 2.5) {
        pos.current.x = 2.5
        vel.current.x = -Math.abs(vel.current.x) * 0.8
        triggerImpactSquash(0.82)
      } else if (pos.current.x < -2.5) {
        pos.current.x = -2.5
        vel.current.x = Math.abs(vel.current.x) * 0.8
        triggerImpactSquash(0.82)
      }

      if (pos.current.z > 2.0) {
        pos.current.z = 2.0
        vel.current.z = -Math.abs(vel.current.z) * 0.8
      } else if (pos.current.z < -1.4) {
        pos.current.z = -1.4
        vel.current.z = Math.abs(vel.current.z) * 0.8
      }
    }

    // Apply 3D position
    meshRef.current.position.copy(pos.current)

    // Ball spin based on movement
    if (!isHolding.current) {
      meshRef.current.rotation.x += (vel.current.z * 18 + delta * 2)
      meshRef.current.rotation.y += delta * 1.5
      meshRef.current.rotation.z -= (vel.current.x * 18 + delta * 2)
    }

    // Apply squish & stretch
    const s = squash.current
    meshRef.current.scale.set(
      (1 / Math.sqrt(s)) * (isGrabbed ? 1.08 : isHovered ? 1.04 : 1.0),
      s * (isGrabbed ? 0.94 : isHovered ? 1.04 : 1.0),
      (1 / Math.sqrt(s)) * (isGrabbed ? 1.08 : isHovered ? 1.04 : 1.0)
    )
  })

  if (!active) return null

  return (
    <group>
      <mesh
        ref={meshRef}
        position={[1.5, 1.3, 0.4]}
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
          map={ballTexture ?? undefined}
          color={ballTexture ? '#FFFFFF' : '#FF5964'}
          roughness={0.22}
          metalness={0.06}
        />
      </mesh>
    </group>
  )
}
