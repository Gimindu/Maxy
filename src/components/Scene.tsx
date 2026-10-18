import { Canvas } from '@react-three/fiber'
import { ContactShadows } from '@react-three/drei'
import { PetColor, PetMood, AccessoryType, FloatingParticleData } from '../types/pet'
import { PetMesh } from './PetMesh'
import { Treat3D } from './Treat3D'
import { ToyBall } from './ToyBall'
import { Particles3D } from './Particles3D'

interface SceneProps {
  mood: PetMood
  color: PetColor
  accessory: AccessoryType
  particles: FloatingParticleData[]
  isTreatActive: boolean
  isToyActive: boolean
  isSleeping: boolean
  isNightMode: boolean
  onPoke: () => void
  onPet: () => void
  onTreatEaten: () => void
  onToyBounced: () => void
}

export function Scene({
  mood,
  color,
  accessory,
  particles,
  isTreatActive,
  isToyActive,
  isSleeping,
  isNightMode,
  onPoke,
  onPet,
  onTreatEaten,
  onToyBounced,
}: SceneProps) {
  return (
    <div className="canvas-container">
      <Canvas
        camera={{ position: [0, 0.2, 5.2], fov: 46 }}
        dpr={[1, 2]}
        shadows
        gl={{ antialias: true, alpha: true }}
      >
        {/* Ambient lighting adjusted for Day/Night and Sleep */}
        <ambientLight 
          intensity={isNightMode ? 0.4 : isSleeping ? 0.6 : 0.85} 
          color={isNightMode ? '#7E8BA8' : '#FFF3E8'} 
        />

        {/* Key Directional Light */}
        <directionalLight
          position={[4, 6, 4]}
          intensity={isNightMode ? 0.7 : 1.3}
          color={isNightMode ? '#93A5CF' : '#FFF9F0'}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
          shadow-bias={-0.0001}
        />

        {/* Soft Colored Rim Light for 3D depth */}
        <directionalLight
          position={[-4, 2, -3]}
          intensity={isNightMode ? 0.5 : 0.6}
          color={isNightMode ? '#5E60CE' : '#FFD6BA'}
        />

        {/* Floor bounce light */}
        <directionalLight
          position={[0, -4, 2]}
          intensity={0.2}
          color="#FFE5D9"
        />

        {/* Pet Character */}
        <PetMesh
          mood={mood}
          color={color}
          accessory={accessory}
          onPoke={onPoke}
          onPet={onPet}
          isSleeping={isSleeping}
        />

        {/* Flying Treat */}
        <Treat3D active={isTreatActive} onEaten={onTreatEaten} />

        {/* Interactive Toy */}
        <ToyBall active={isToyActive} onBounced={onToyBounced} />

        {/* 3D Floating Particles */}
        <Particles3D particles={particles} />

        {/* Soft Contact Ground Shadow */}
        <ContactShadows
          position={[0, -1.4, 0]}
          opacity={isNightMode ? 0.35 : 0.42}
          scale={7}
          blur={2.4}
          far={3.5}
          color="#3A2E39"
        />
      </Canvas>
    </div>
  )
}
