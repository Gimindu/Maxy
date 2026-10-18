import { useRef, useMemo } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'

interface Treat3DProps {
  active: boolean
  onEaten: () => void
}

export function Treat3D({ active, onEaten }: Treat3DProps) {
  const treatRef = useRef<THREE.Group>(null)
  const sparklesRef = useRef<THREE.Group>(null)
  const progressRef = useRef(0)
  const hasEatenRef = useRef(false)

  // 1. Organic, luscious plump strawberry body curve (LatheGeometry)
  const strawberryPoints = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.001, -0.28, 0), // Smooth rounded tip
      new THREE.Vector3(0.075, -0.23, 0),
      new THREE.Vector3(0.155, -0.14, 0),
      new THREE.Vector3(0.22, -0.04, 0),
      new THREE.Vector3(0.25, 0.07, 0),   // Plump hips
      new THREE.Vector3(0.24, 0.16, 0),   // Full rounded shoulders
      new THREE.Vector3(0.18, 0.225, 0),  // Curving inward to crown
      new THREE.Vector3(0.09, 0.245, 0),  // Indent rim
      new THREE.Vector3(0.001, 0.235, 0), // Central stem dimple
    ])
    return curve.getPoints(36).map((p) => new THREE.Vector2(Math.max(0.001, p.x), p.y))
  }, [])

  // 2. Golden strawberry seeds nestled along the surface curvature
  const seeds = useMemo(() => {
    const list: { pos: [number, number, number]; rot: [number, number, number] }[] = []
    const rings = [
      { y: 0.16, r: 0.21, count: 11, tiltX: 0.35 },
      { y: 0.08, r: 0.245, count: 10, tiltX: 0.12 },
      { y: -0.01, r: 0.235, count: 9, tiltX: -0.15 },
      { y: -0.09, r: 0.19, count: 8, tiltX: -0.38 },
      { y: -0.17, r: 0.13, count: 6, tiltX: -0.65 },
      { y: -0.23, r: 0.065, count: 4, tiltX: -0.9 },
    ]
    rings.forEach((ring, rIdx) => {
      const angleOffset = (rIdx % 2) * (Math.PI / ring.count)
      for (let i = 0; i < ring.count; i++) {
        const a = (i / ring.count) * Math.PI * 2 + angleOffset
        const x = Math.sin(a) * ring.r
        const z = Math.cos(a) * ring.r
        list.push({
          pos: [x, ring.y, z],
          rot: [ring.tiltX, a, 0],
        })
      }
    })
    return list
  }, [])

  // 3. Stylized organic leaf petal shape for the green star crown
  const leafShape = useMemo(() => {
    const s = new THREE.Shape()
    s.moveTo(0, 0)
    // Left leafy curve with subtle serration
    s.quadraticCurveTo(-0.045, 0.06, -0.055, 0.12)
    s.quadraticCurveTo(-0.04, 0.17, 0, 0.22) // Leaf tip
    // Right leaf curve
    s.quadraticCurveTo(0.04, 0.17, 0.055, 0.12)
    s.quadraticCurveTo(0.045, 0.06, 0, 0)
    return s
  }, [])

  const leafExtrude = useMemo(
    () => ({
      depth: 0.006,
      bevelEnabled: true,
      bevelSegments: 2,
      steps: 1,
      bevelSize: 0.003,
      bevelThickness: 0.003,
    }),
    []
  )

  useFrame((state, delta) => {
    if (!active) {
      progressRef.current = 0
      hasEatenRef.current = false
      return
    }

    // Steady, enjoyable flight (~1.15 seconds total)
    progressRef.current += delta * 0.85
    const p = progressRef.current

    if (treatRef.current) {
      if (p < 1.0) {
        // Starts near bottom-right action area in front of camera
        const startX = 0.75
        const startY = -1.6
        const startZ = 2.6

        // Target: directly into Maxy's mouth plane at [0, -0.10, 1.05]
        const endX = 0.0
        const endY = -0.10
        const endZ = 1.05

        // Smooth ease-in-out progress
        const easeP = p * p * (3 - 2 * p)

        const currX = THREE.MathUtils.lerp(startX, endX, easeP)
        const currZ = THREE.MathUtils.lerp(startZ, endZ, easeP)
        // Parabolic arc that rises up in front of pet and curves right into the mouth
        const arcY = Math.sin(p * Math.PI) * 0.95
        const currY = THREE.MathUtils.lerp(startY, endY, p) + arcY

        treatRef.current.position.set(currX, currY, currZ)

        // Playful tumble spin
        treatRef.current.rotation.x += delta * 3.5
        treatRef.current.rotation.y += delta * 4.5

        // As it enters the open mouth in the final 22%, shrink into the mouth!
        const scale = p > 0.78 ? Math.max(0.01, (1 - (p - 0.78) / 0.22) * 0.8) : 0.8
        treatRef.current.scale.setScalar(scale)
      } else {
        if (!hasEatenRef.current) {
          hasEatenRef.current = true
          onEaten()
        }
      }
    }

    // Orbiting magical sweetness sparkles
    if (sparklesRef.current) {
      sparklesRef.current.rotation.y += delta * 3.0
      sparklesRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 4) * 0.2
    }
  })

  if (!active) return null

  return (
    <group ref={treatRef} position={[0.75, -1.6, 2.6]}>
      {/* Luscious Plump 3D Strawberry Body */}
      <mesh castShadow receiveShadow>
        <latheGeometry args={[strawberryPoints, 32]} />
        <meshPhysicalMaterial
          color="#FF154C"
          emissive="#B80036"
          emissiveIntensity={0.16}
          roughness={0.22}
          metalness={0.04}
          clearcoat={0.7}
          clearcoatRoughness={0.15}
          reflectivity={0.65}
        />
      </mesh>

      {/* Golden Achenes (Strawberry Seeds) */}
      <group>
        {seeds.map((s, idx) => (
          <mesh
            key={idx}
            position={s.pos}
            rotation={s.rot}
            scale={[0.014, 0.024, 0.012]}
          >
            <sphereGeometry args={[1, 6, 6]} />
            <meshStandardMaterial
              color="#FFE169"
              roughness={0.3}
              metalness={0.2}
            />
          </mesh>
        ))}
      </group>

      {/* Lush Green Calyx (Leaf Crown) */}
      <group position={[0, 0.22, 0]}>
        {/* Central leaf base collar */}
        <mesh position={[0, 0.01, 0]}>
          <cylinderGeometry args={[0.07, 0.11, 0.025, 12]} />
          <meshStandardMaterial color="#2B9348" roughness={0.5} />
        </mesh>

        {/* 6 Curved leaves draping over the plump shoulders */}
        {[0, 1, 2, 3, 4, 5].map((i) => {
          const angle = (i / 6) * Math.PI * 2
          return (
            <group
              key={i}
              rotation={[0, angle, 0]}
            >
              {/* Tilt leaf outward and drape downward over the shoulder */}
              <group position={[0, 0.01, 0.04]} rotation={[-1.15, 0, 0]}>
                <mesh castShadow>
                  <extrudeGeometry args={[leafShape, leafExtrude]} />
                  <meshStandardMaterial
                    color="#38B000"
                    roughness={0.45}
                    metalness={0.05}
                  />
                </mesh>
              </group>
            </group>
          )
        })}

        {/* Adorable bent green stem */}
        <group position={[0, 0.02, 0]} rotation={[0.12, 0, 0.25]}>
          <mesh position={[0, 0.07, 0]} castShadow>
            <cylinderGeometry args={[0.025, 0.038, 0.14, 10]} />
            <meshStandardMaterial color="#2B9348" roughness={0.6} />
          </mesh>
          {/* Soft rounded cut tip on stem */}
          <mesh position={[0, 0.14, 0]}>
            <sphereGeometry args={[0.025, 8, 8]} />
            <meshStandardMaterial color="#55A630" roughness={0.6} />
          </mesh>
        </group>
      </group>

      {/* Sweetness Magic Sparkles */}
      <group ref={sparklesRef}>
        {[
          { pos: [0.26, 0.18, 0.12], scale: 0.045 },
          { pos: [-0.22, 0.04, 0.2], scale: 0.035 },
          { pos: [0.12, -0.15, 0.22], scale: 0.04 },
        ].map((sp, idx) => (
          <mesh key={idx} position={sp.pos as [number, number, number]} scale={sp.scale}>
            <octahedronGeometry args={[1, 0]} />
            <meshStandardMaterial
              color="#FFF07C"
              emissive="#FFD000"
              emissiveIntensity={0.8}
              roughness={0.1}
            />
          </mesh>
        ))}
      </group>
    </group>
  )
}
