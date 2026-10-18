export type PetMood = 
  | 'idle' 
  | 'happy' 
  | 'super_happy' 
  | 'poked' 
  | 'eating' 
  | 'anticipating'
  | 'sleeping' 
  | 'sleepy'
  | 'dirty'
  | 'dizzy'
  | 'washing'

export type AccessoryType = 
  | 'none' 
  | 'crown' 
  | 'bunny_ears' 
  | 'chef_hat' 
  | 'cool_glasses' 
  | 'halo'
  | 'flower'
  | 'sleep_hat'

export interface PetColor {
  id: string
  name: string
  hex: string
  roughness: number
  blushHex: string
}

export interface PetStats {
  hunger: number       // 0 (starving) to 100 (full)
  happiness: number    // 0 (sad) to 100 (ecstatic)
  energy: number       // 0 (exhausted) to 100 (energetic)
  cleanliness: number  // 0 (dirty) to 100 (sparkling clean)
  level: number        // 1 to 99
  xp: number           // 0 to 100
}

export interface FloatingParticleData {
  id: number
  type: 'heart' | 'star' | 'bubble' | 'zzz' | 'crumb'
  position: [number, number, number]
  velocity: [number, number, number]
  scale: number
  opacity: number
  life: number
  maxLife: number
}
