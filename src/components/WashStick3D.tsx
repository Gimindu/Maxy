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
    // Rhythmic scrubbing stroke up and down across Maxy's back and shoulder
    const scrubPhase = Math.sin(t * 10)
    const scrubWiggle = Math.cos(t * 5)

    if (armGroupRef.current) {
      // Pump up and down over the shoulder scrubbing the back
      armGroupRef.current.position.y = 0.45 + scrubPhase * 0.15
      armGroupRef.current.position.x = 0.92 + scrubWiggle * 0.03
      armGroupRef.current.rotation.x = -0.15 + scrubPhase * 0.22
      armGroupRef.current.rotation.z = 0.08 + scrubWiggle * 0.06
    }

    if (foamRef.current) {
      // Jiggle the lather bubbles on the shoulder/back
      foamRef.current.scale.setScalar(1 + Math.sin(t * 11) * 0.08)
    }
  })

  return (
    <group>
      {/* Animated Arm & Wash Stick reaching over shoulder to wash back */}
      <group ref={armGroupRef} position={[0.92, 0.45, 0.1]}>
        {/* Shoulder Joint matching Pet Color */}
        <mesh position={[0, 0, 0]} castShadow>
          <sphereGeometry args={[0.2, 16, 16]} />
          <meshStandardMaterial color={color.hex} roughness={color.roughness} />
        </mesh>

        {/* Upper Arm Segment reaching up and back */}
        <mesh position={[0.06, 0.3, -0.12]} rotation={[0.4, 0.1, -0.28]} castShadow>
          <cylinderGeometry args={[0.13, 0.16, 0.52, 16]} />
          <meshStandardMaterial color={color.hex} roughness={color.roughness} />
        </mesh>

        {/* Elbow Joint */}
        <mesh position={[0.12, 0.58, -0.25]} castShadow>
          <sphereGeometry args={[0.15, 16, 16]} />
          <meshStandardMaterial color={color.hex} roughness={color.roughness} />
        </mesh>

        {/* Forearm Segment reaching over back */}
        <mesh position={[-0.14, 0.82, -0.38]} rotation={[-0.35, 0.25, 0.72]} castShadow>
          <cylinderGeometry args={[0.12, 0.14, 0.48, 16]} />
          <meshStandardMaterial color={color.hex} roughness={color.roughness} />
        </mesh>

        {/* Cute Paw / Hand gripping the wash stick */}
        <group position={[-0.32, 0.98, -0.48]}>
          <mesh castShadow>
            <sphereGeometry args={[0.16, 16, 16]} />
            <meshStandardMaterial color={color.hex} roughness={color.roughness} />
          </mesh>
          {/* Paw finger nubs */}
          {[-0.07, 0, 0.07].map((offset, idx) => (
            <mesh key={idx} position={[offset, 0.1, 0.03]} rotation={[0.3, 0, 0]}>
              <sphereGeometry args={[0.045, 8, 8]} />
              <meshStandardMaterial color={color.hex} roughness={color.roughness} />
            </mesh>
          ))}

          {/* THE WASH STICK (Long Bath Scrubber) */}
          {/* Bamboo / Wooden Handle */}
          <group rotation={[0.85, 0.15, 0.45]}>
            <mesh position={[0, -0.1, 0]} castShadow>
              <cylinderGeometry args={[0.032, 0.038, 1.45, 16]} />
              <meshStandardMaterial
                color="#E2B17B"
                roughness={0.45}
                metalness={0.05}
              />
            </mesh>
            {/* Wooden hanging ring at the top end of handle */}
            <mesh position={[0, -0.82, 0]}>
              <torusGeometry args={[0.05, 0.016, 8, 16]} />
              <meshStandardMaterial color="#C68B59" roughness={0.5} />
            </mesh>

            {/* Brush / Sponge Head at working end scrubbing the back */}
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

      {/* Rich Bubbly Foam Lather on the back and shoulder */}
      <group ref={foamRef} position={[0.62, 0.72, -0.55]}>
        {[
          { pos: [0, 0.1, 0], s: 0.14 },
          { pos: [0.14, 0.04, 0.02], s: 0.12 },
          { pos: [-0.12, 0.08, 0.01], s: 0.13 },
          { pos: [0.06, -0.12, 0.03], s: 0.13 },
          { pos: [-0.1, -0.08, 0.02], s: 0.11 },
          { pos: [0.18, -0.06, 0.04], s: 0.1 },
          { pos: [-0.02, 0.22, 0.02], s: 0.11 },
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
