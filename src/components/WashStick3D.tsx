import { useRef, useMemo } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { PetColor } from '../types/pet'

interface WashStick3DProps {
  color: PetColor
}

export function WashStick3D({ color }: WashStick3DProps) {
  const armGroupRef = useRef<THREE.Group>(null)
  const foamRef = useRef<THREE.Group>(null)

  // Single seamless, organic, continuous 3D curved chibi arm
  const armCurve = useMemo(() => {
    return new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.88, 0.32, 0.14),   // Shoulder base on Maxy's right side
      new THREE.Vector3(0.96, 0.58, 0.10),   // Upper arm curving up
      new THREE.Vector3(0.90, 0.82, -0.04),  // Arching over upper shoulder
      new THREE.Vector3(0.76, 0.94, -0.16),  // Wrist near body
      new THREE.Vector3(0.64, 0.92, -0.24),  // Paw holding stick
    ])
  }, [])

  useFrame((state) => {
    const t = state.clock.getElapsedTime()
    // Scrubbing motion directly on the body surface
    const scrub = Math.sin(t * 8.5)
    const scrubSide = Math.cos(t * 4.25)

    if (armGroupRef.current) {
      // Rubs and scrubs the sponge right against Maxy's body surface
      armGroupRef.current.position.y = scrub * 0.10
      armGroupRef.current.position.x = scrubSide * 0.03
      armGroupRef.current.rotation.x = scrub * 0.12
      armGroupRef.current.rotation.z = scrub * 0.04
    }

    if (foamRef.current) {
      // Gentle soft pulse of the lather foam on the body
      foamRef.current.scale.setScalar(1 + Math.sin(t * 9) * 0.07)
    }
  })

  return (
    <group>
      {/* Animated Organic Arm & Wash Stick */}
      <group ref={armGroupRef}>
        {/* Seamless Smooth Tube Arm */}
        <mesh castShadow receiveShadow>
          <tubeGeometry args={[armCurve, 32, 0.12, 16, false]} />
          <meshStandardMaterial
            color={color.hex}
            roughness={color.roughness}
            metalness={0.04}
          />
        </mesh>

        {/* Soft rounded shoulder base blend */}
        <mesh position={[0.88, 0.32, 0.14]} castShadow>
          <sphereGeometry args={[0.13, 16, 16]} />
          <meshStandardMaterial color={color.hex} roughness={color.roughness} />
        </mesh>

        {/* Soft chubby paw holding the wash stick */}
        <group position={[0.64, 0.92, -0.24]}>
          {/* Main rounded paw */}
          <mesh castShadow>
            <sphereGeometry args={[0.14, 20, 20]} />
            <meshStandardMaterial color={color.hex} roughness={color.roughness} />
          </mesh>

          {/* Cute paw thumb holding the stick */}
          <mesh position={[-0.04, 0.05, 0.07]} rotation={[0.4, -0.2, 0]} castShadow>
            <sphereGeometry args={[0.06, 12, 12]} />
            <meshStandardMaterial color={color.hex} roughness={color.roughness} />
          </mesh>

          {/* Sleek Polished Bamboo/Birch Wash Stick */}
          {/* Angled so the sponge end presses firmly against the body surface */}
          <group rotation={[0.62, 0.18, 0.32]}>
            {/* Long wooden handle shaft */}
            <mesh position={[0, 0, 0]} castShadow>
              <cylinderGeometry args={[0.026, 0.032, 1.25, 16]} />
              <meshStandardMaterial
                color="#F3C68F"
                roughness={0.35}
                metalness={0.05}
              />
            </mesh>

            {/* Cute wooden hanging loop ring at top end */}
            <mesh position={[0, 0.65, 0]}>
              <torusGeometry args={[0.045, 0.012, 10, 20]} />
              <meshStandardMaterial color="#DDA15E" roughness={0.4} />
            </mesh>

            {/* Golden decorative ferrule ring */}
            <mesh position={[0, -0.32, 0]}>
              <cylinderGeometry args={[0.036, 0.036, 0.05, 16]} />
              <meshStandardMaterial color="#FFD166" metalness={0.5} roughness={0.25} />
            </mesh>

            {/* Fluffy Bath Sponge Head - PRESSING DIRECTLY ONTO THE BODY */}
            <group position={[0, -0.46, 0]}>
              {/* Pastel cloud-blue sponge puff resting directly against Maxy's body */}
              <mesh castShadow>
                <sphereGeometry args={[0.22, 20, 20]} />
                <meshStandardMaterial
                  color="#64DFDF"
                  roughness={0.65}
                  metalness={0.02}
                />
              </mesh>

              {/* Soapy White Foam Lather Puffs on the sponge */}
              {[
                { pos: [0, -0.12, 0.10], s: 0.10 },
                { pos: [0.10, -0.06, 0.12], s: 0.085 },
                { pos: [-0.09, -0.07, 0.12], s: 0.09 },
                { pos: [0.05, -0.02, 0.15], s: 0.08 },
                { pos: [-0.06, -0.01, 0.14], s: 0.075 },
              ].map((f, i) => (
                <mesh key={i} position={f.pos as [number, number, number]} scale={f.s}>
                  <sphereGeometry args={[1, 12, 12]} />
                  <meshStandardMaterial
                    color="#FFFFFF"
                    roughness={0.2}
                    metalness={0.1}
                  />
                </mesh>
              ))}
            </group>
          </group>
        </group>
      </group>

      {/* Fluffy White Soap Lather Bubbles DIRECTLY ON MAXY'S BODY SURFACE */}
      <group ref={foamRef} position={[0.55, 0.68, -0.42]}>
        {[
          { pos: [0, 0.06, 0], s: 0.13 },
          { pos: [0.10, 0.02, 0.02], s: 0.11 },
          { pos: [-0.09, 0.05, 0.01], s: 0.12 },
          { pos: [0.04, -0.08, 0.03], s: 0.12 },
          { pos: [-0.07, -0.05, 0.02], s: 0.10 },
          { pos: [0.12, -0.03, 0.03], s: 0.09 },
          { pos: [-0.02, 0.14, 0.02], s: 0.10 },
        ].map((f, i) => (
          <mesh key={i} position={f.pos as [number, number, number]} scale={f.s}>
            <sphereGeometry args={[1, 14, 14]} />
            <meshStandardMaterial
              color="#FFFFFF"
              roughness={0.15}
              metalness={0.12}
            />
          </mesh>
        ))}
      </group>
    </group>
  )
}
