import { useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { PetColor } from '../types/pet'

interface WashStick3DProps {
  color: PetColor
}

export function WashStick3D({ color }: WashStick3DProps) {
  const armGroupRef = useRef<THREE.Group>(null)
  const foamRef = useRef<THREE.Group>(null)

  useFrame((state) => {
    const t = state.clock.getElapsedTime()
    // Rhythmic scrubbing stroke up and down across Maxy's back
    const scrubPhase = Math.sin(t * 11)
    const scrubCross = Math.cos(t * 5.5)

    if (armGroupRef.current) {
      // Pivot and scrub along the back surface
      armGroupRef.current.position.y = 0.42 + scrubPhase * 0.18
      armGroupRef.current.position.x = 0.88 + scrubCross * 0.05
      armGroupRef.current.rotation.x = -0.55 + scrubPhase * 0.28
      armGroupRef.current.rotation.z = 0.25 + scrubCross * 0.08
    }

    if (foamRef.current) {
      // Jiggle the lather bubbles on the back
      foamRef.current.scale.setScalar(1 + Math.sin(t * 12) * 0.08)
    }
  })

  return (
    <group>
      {/* Animated Arm & Wash Stick */}
      <group ref={armGroupRef} position={[0.88, 0.42, -0.15]}>
        {/* Shoulder Joint matching Pet Color */}
        <mesh position={[0, 0, 0]} castShadow>
          <sphereGeometry args={[0.2, 16, 16]} />
          <meshStandardMaterial color={color.hex} roughness={color.roughness} />
        </mesh>

        {/* Upper Arm Segment reaching up and back over shoulder */}
        <mesh position={[-0.05, 0.22, -0.22]} rotation={[0.85, -0.2, 0.4]} castShadow>
          <cylinderGeometry args={[0.13, 0.16, 0.48, 16]} />
          <meshStandardMaterial color={color.hex} roughness={color.roughness} />
        </mesh>

        {/* Elbow Joint */}
        <mesh position={[-0.08, 0.42, -0.42]} castShadow>
          <sphereGeometry args={[0.15, 16, 16]} />
          <meshStandardMaterial color={color.hex} roughness={color.roughness} />
        </mesh>

        {/* Forearm Segment reaching over back */}
        <mesh position={[-0.22, 0.52, -0.58]} rotation={[-0.4, 0.35, -0.9]} castShadow>
          <cylinderGeometry args={[0.12, 0.14, 0.42, 16]} />
          <meshStandardMaterial color={color.hex} roughness={color.roughness} />
        </mesh>

        {/* Cute Paw / Hand gripping the wash stick */}
        <group position={[-0.38, 0.58, -0.72]}>
          <mesh castShadow>
            <sphereGeometry args={[0.15, 16, 16]} />
            <meshStandardMaterial color={color.hex} roughness={color.roughness} />
          </mesh>
          {/* Paw finger nubs */}
          {[-0.07, 0, 0.07].map((offset, idx) => (
            <mesh key={idx} position={[offset, 0.1, 0.02]} rotation={[0.3, 0, 0]}>
              <sphereGeometry args={[0.045, 8, 8]} />
              <meshStandardMaterial color={color.hex} roughness={color.roughness} />
            </mesh>
          ))}

          {/* THE WASH STICK (Long Bath Scrubber) */}
          {/* Wooden / Bamboo Handle */}
          <group rotation={[0.7, 0.25, 0.6]}>
            <mesh position={[0, -0.1, 0]} castShadow>
              <cylinderGeometry args={[0.032, 0.038, 1.45, 16]} />
              <meshStandardMaterial
                color="#E2B17B"
                roughness={0.45}
                metalness={0.05}
              />
            </mesh>
            {/* Wooden hanging ring at the bottom of handle */}
            <mesh position={[0, -0.82, 0]}>
              <torusGeometry args={[0.05, 0.016, 8, 16]} />
              <meshStandardMaterial color="#C68B59" roughness={0.5} />
            </mesh>

            {/* Brush / Sponge Head at working end */}
            <group position={[0, 0.65, 0]}>
              {/* Wooden head mounting bracket */}
              <mesh position={[0, 0.04, 0]} castShadow>
                <boxGeometry args={[0.14, 0.18, 0.08]} />
                <meshStandardMaterial color="#C68B59" roughness={0.5} />
              </mesh>

              {/* Fluffy Bath Sponge / Loofah Head */}
              <mesh position={[0, 0.14, 0.06]} castShadow>
                <sphereGeometry args={[0.22, 16, 16]} />
                <meshStandardMaterial
                  color="#48CAE4"
                  roughness={0.75}
                  metalness={0.02}
                />
              </mesh>

              {/* Fluffy White Soap Suds / Foam on the sponge */}
              {[
                { pos: [0, 0.22, 0.12], s: 0.11 },
                { pos: [0.12, 0.15, 0.14], s: 0.09 },
                { pos: [-0.11, 0.16, 0.14], s: 0.095 },
                { pos: [0.06, 0.08, 0.18], s: 0.085 },
                { pos: [-0.07, 0.07, 0.17], s: 0.08 },
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

      {/* Rich Bubbly Foam Lather on Maxy's Back */}
      <group ref={foamRef} position={[0.05, 0.08, -1.02]} rotation={[0, Math.PI, 0]}>
        {[
          { pos: [0, 0.12, 0], s: 0.16 },
          { pos: [0.18, 0.04, 0.02], s: 0.13 },
          { pos: [-0.16, 0.08, 0.01], s: 0.14 },
          { pos: [0.08, -0.14, 0.03], s: 0.15 },
          { pos: [-0.12, -0.10, 0.02], s: 0.13 },
          { pos: [0.22, -0.08, 0.04], s: 0.11 },
          { pos: [-0.22, 0.16, 0.03], s: 0.10 },
          { pos: [0.02, 0.26, 0.02], s: 0.12 },
          { pos: [-0.06, -0.22, 0.03], s: 0.11 },
        ].map((f, i) => (
          <mesh key={i} position={f.pos as [number, number, number]} scale={f.s}>
            <sphereGeometry args={[1, 14, 14]} />
            <meshStandardMaterial
              color="#FFFFFF"
              roughness={0.15}
              metalness={0.15}
            />
          </mesh>
        ))}
      </group>
    </group>
  )
}
