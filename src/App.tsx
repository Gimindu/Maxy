import { useState, useEffect, useRef, useCallback } from 'react'
import confetti from 'canvas-confetti'
import {
  PetMood,
  PetStats,
  PetColor,
  AccessoryType,
  FloatingParticleData,
} from './types/pet'
import { sound } from './utils/audio'
import { Scene } from './components/Scene'
import { UIOverlay } from './components/UIOverlay'
import { CustomizerModal, PET_COLORS } from './components/CustomizerModal'

const INITIAL_STATS: PetStats = {
  hunger: 80,
  happiness: 85,
  energy: 90,
  cleanliness: 95,
  level: 1,
  xp: 15,
}

export default function App() {
  const [petName, setPetName] = useState(() => {
    return localStorage.getItem('maxy_pet_name') || 'Maxy'
  })
  const [stats, setStats] = useState<PetStats>(() => {
    try {
      const saved = localStorage.getItem('maxy_pet_stats')
      return saved ? JSON.parse(saved) : INITIAL_STATS
    } catch {
      return INITIAL_STATS
    }
  })
  const [mood, setMood] = useState<PetMood>('idle')
  const [color, setColor] = useState<PetColor>(PET_COLORS[0])
  const [accessory, setAccessory] = useState<AccessoryType>('none')
  const [isNightMode, setIsNightMode] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [isSleeping, setIsSleeping] = useState(false)
  const [isTreatActive, setIsTreatActive] = useState(false)
  const [isToyActive, setIsToyActive] = useState(false)
  const [isCustomizerOpen, setIsCustomizerOpen] = useState(false)
  const [statusMessage, setStatusMessage] = useState('Maxy is happy to see you! 💕')
  const [particles, setParticles] = useState<FloatingParticleData[]>([])

  const messageTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const nextParticleId = useRef(1)

  // Save changes to localStorage
  useEffect(() => {
    localStorage.setItem('maxy_pet_name', petName)
  }, [petName])

  useEffect(() => {
    localStorage.setItem('maxy_pet_stats', JSON.stringify(stats))
  }, [stats])

  const showMessage = useCallback((msg: string, duration = 3000) => {
    setStatusMessage(msg)
    if (messageTimeoutRef.current) clearTimeout(messageTimeoutRef.current)
    messageTimeoutRef.current = setTimeout(() => {
      setStatusMessage('')
    }, duration)
  }, [])

  // Particle spawner helper
  const spawnParticles = useCallback(
    (type: FloatingParticleData['type'], count = 3, center: [number, number, number] = [0, 0.4, 0]) => {
      const newParticles: FloatingParticleData[] = []
      const isCrumb = type === 'crumb'
      const spreadX = isCrumb ? 0.25 : 1.2
      const spreadY = isCrumb ? 0.2 : 0.8
      const spreadZ = isCrumb ? 0.2 : 0.8

      for (let i = 0; i < count; i++) {
        newParticles.push({
          id: nextParticleId.current++,
          type,
          position: [
            center[0] + (Math.random() - 0.5) * spreadX,
            center[1] + (Math.random() - 0.5) * spreadY,
            center[2] + (Math.random() - 0.5) * spreadZ,
          ],
          velocity: isCrumb
            ? [
                (Math.random() - 0.5) * 0.025,
                0.01 + Math.random() * 0.025,
                0.015 + Math.random() * 0.02,
              ]
            : [
                (Math.random() - 0.5) * 0.015,
                0.02 + Math.random() * 0.02,
                (Math.random() - 0.5) * 0.015,
              ],
          scale: (isCrumb ? 0.45 : 0.6) + Math.random() * 0.5,
          opacity: 1,
          life: 0,
          maxLife: (isCrumb ? 50 : 60) + Math.random() * 40,
        })
      }
      setParticles((prev) => [...prev.slice(-30), ...newParticles])
    },
    []
  )

  // Particle update loop
  useEffect(() => {
    let animId: number
    const updateParticles = () => {
      setParticles((prev) =>
        prev
          .map((p) => ({
            ...p,
            position: [
              p.position[0] + p.velocity[0],
              p.position[1] + p.velocity[1],
              p.position[2] + p.velocity[2],
            ] as [number, number, number],
            life: p.life + 1,
            scale: p.scale * 0.992,
          }))
          .filter((p) => p.life < p.maxLife)
      )
      animId = requestAnimationFrame(updateParticles)
    }
    animId = requestAnimationFrame(updateParticles)
    return () => cancelAnimationFrame(animId)
  }, [])

  // XP & Level-up helper
  const addXP = useCallback(
    (amount: number) => {
      setStats((prev) => {
        let newXp = prev.xp + amount
        let newLevel = prev.level
        if (newXp >= 100) {
          newXp -= 100
          newLevel += 1
          sound.playLevelUp()
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
          })
          showMessage(`🎉 Level Up! ${petName} reached Level ${newLevel}!`)
          spawnParticles('star', 8, [0, 0.5, 0])
        }
        return {
          ...prev,
          xp: newXp,
          level: newLevel,
        }
      })
    },
    [petName, showMessage, spawnParticles]
  )

  // Natural state changes over time
  useEffect(() => {
    const interval = setInterval(() => {
      setStats((prev) => {
        if (isSleeping) {
          // Recharge energy, stabilize happiness
          const newEnergy = Math.min(100, prev.energy + 2.5)
          const newHunger = Math.max(0, prev.hunger - 0.2)
          return { ...prev, energy: newEnergy, hunger: newHunger }
        } else {
          // Natural depletion
          const newHunger = Math.max(0, prev.hunger - 0.6)
          const newEnergy = Math.max(0, prev.energy - 0.4)
          const newClean = Math.max(0, prev.cleanliness - 0.3)
          let newHappy = prev.happiness

          if (newHunger < 20 || newClean < 20) {
            newHappy = Math.max(0, prev.happiness - 0.8)
          }

          return {
            ...prev,
            hunger: newHunger,
            energy: newEnergy,
            cleanliness: newClean,
            happiness: newHappy,
          }
        }
      })
    }, 3000)

    return () => clearInterval(interval)
  }, [isSleeping])

  // Sleeping Zzz particles
  useEffect(() => {
    if (!isSleeping) return
    const interval = setInterval(() => {
      spawnParticles('zzz', 1, [0.4, 0.9, 0.2])
    }, 1800)
    return () => clearInterval(interval)
  }, [isSleeping, spawnParticles])

  // Update mood based on conditions
  useEffect(() => {
    if (isSleeping) {
      setMood('sleeping')
      return
    }
    // Protect active transient moods from being erased by stat changes
    if (mood === 'eating' || mood === 'anticipating' || mood === 'poked' || mood === 'super_happy' || mood === 'washing') {
      return
    }
    if (stats.cleanliness < 25) {
      setMood('dirty')
      return
    }
    if (stats.energy < 30) {
      setMood('sleepy')
      return
    }
    if (stats.hunger < 25) {
      setMood('idle')
      return
    }
    if (stats.happiness > 80) {
      setMood('happy')
    } else {
      setMood('idle')
    }
  }, [isSleeping, stats.cleanliness, stats.energy, stats.hunger, stats.happiness, mood])

  // Low energy yawning audio & floating Zzz effects
  useEffect(() => {
    if (isSleeping || stats.energy >= 30) return

    // Immediately trigger initial yawn
    sound.playYawn()
    showMessage(`*Yaaawn...* ${petName} is very sleepy! Put them to bed to recharge. 🥱`, 4500)
    spawnParticles('zzz', 1, [0.35, 0.7, 0.2])

    // Periodic yawn while energy remains low
    const yawnInterval = setInterval(() => {
      sound.playYawn()
      spawnParticles('zzz', 1, [0.35, 0.7, 0.2])
    }, 8500)

    return () => clearInterval(yawnInterval)
  }, [isSleeping, stats.energy < 30, petName, showMessage, spawnParticles])

  // Interactions
  const handlePoke = useCallback(() => {
    sound.playPoke()
    if (isSleeping) {
      setIsSleeping(false)
      setMood('poked')
      showMessage(`*Poke!* ${petName} woke up! ☀️`)
      setTimeout(() => {
        if (stats.energy < 30) {
          setMood('sleepy')
        } else {
          setMood(stats.happiness > 80 ? 'happy' : 'idle')
        }
      }, 700)
    } else {
      setMood('poked')
      setTimeout(() => {
        if (stats.energy < 30) {
          setMood('sleepy')
        } else {
          setMood(stats.happiness > 80 ? 'happy' : 'idle')
        }
      }, 700)
      showMessage(`*Boing!* ${petName} wiggles cutely!`)
    }
    spawnParticles('star', 2, [0, 0.4, 0.5])
    setStats((prev) => ({
      ...prev,
      happiness: Math.min(100, prev.happiness + 2),
    }))
    addXP(1)
  }, [isSleeping, stats.energy, stats.happiness, addXP, showMessage, spawnParticles, petName])

  const handlePet = useCallback(() => {
    sound.playPet()
    if (isSleeping) {
      setIsSleeping(false)
      showMessage(`*Purr...* ${petName} woke up with love! 💖`)
    } else {
      showMessage(`${petName} loves the gentle affection! 💖`)
    }
    setMood('super_happy')
    spawnParticles('heart', 3, [0, 0.5, 0.2])
    setStats((prev) => ({
      ...prev,
      happiness: Math.min(100, prev.happiness + 4),
    }))
    addXP(2)
    setTimeout(() => {
      setMood(stats.energy < 30 ? 'sleepy' : 'happy')
    }, 1200)
  }, [isSleeping, stats.energy, addXP, showMessage, spawnParticles, petName])

  const handleFeed = useCallback(() => {
    if (isSleeping) {
      showMessage(`${petName} is fast asleep! Wake them first.`)
      return
    }
    if (stats.hunger >= 98) {
      showMessage(`${petName} is completely full and happy! 🍓`)
      return
    }
    setIsTreatActive(true)
    setMood('anticipating')
    showMessage(`Tossing a strawberry! ${petName} opens wide! 🍓`)
  }, [isSleeping, stats.hunger, petName, showMessage])

  const handleTreatEaten = useCallback(() => {
    setIsTreatActive(false)
    sound.playFeed()
    setMood('eating')
    spawnParticles('heart', 4, [0, 0.35, 0.4])
    spawnParticles('star', 3, [0, 0.15, 0.5])
    setStats((prev) => ({
      ...prev,
      hunger: Math.min(100, prev.hunger + 30),
      happiness: Math.min(100, prev.happiness + 10),
    }))
    addXP(5)
    showMessage(`*Mmm!* ${petName} loves the sweet strawberry! 🍓✨`, 3000)
    setTimeout(() => {
      setMood('super_happy')
      showMessage(`Yum! ${petName} is full and delighted! ✨`, 2500)
      setTimeout(() => {
        if (!isSleeping) {
          setMood(stats.energy < 30 ? 'sleepy' : 'happy')
        }
      }, 1200)
    }, 1800)
  }, [isSleeping, stats.energy, addXP, showMessage, spawnParticles, petName])

  const handlePlay = useCallback(() => {
    if (isSleeping) {
      showMessage(`${petName} is sleeping peacefully.`)
      return
    }
    setIsToyActive((prev) => !prev)
    if (!isToyActive) {
      showMessage(`Spawned a bouncy beach ball! Click it to bounce! 🎾`)
      sound.playPoke()
    } else {
      showMessage(`Put the toy ball away.`)
    }
  }, [isSleeping, isToyActive, showMessage])

  const handleToyBounced = useCallback(() => {
    sound.playPoke()
    spawnParticles('star', 2, [1.5, -0.8, 0])
    setStats((prev) => ({
      ...prev,
      happiness: Math.min(100, prev.happiness + 5),
      energy: Math.max(0, prev.energy - 3),
    }))
    addXP(3)
  }, [addXP, spawnParticles])

  const handleWash = useCallback(() => {
    if (isSleeping) {
      showMessage(`${petName} is fast asleep! Wake them first.`)
      return
    }
    sound.playWash()
    setMood('washing')
    showMessage(`Scrub scrub! Washing ${petName}'s back with the bath stick! 🧼🛁✨`, 3500)

    // Stream bubbles continuously off the body during scrubbing
    const bubbleInterval = setInterval(() => {
      spawnParticles('bubble', 3, [0.55, 0.68, -0.35])
    }, 320)

    setTimeout(() => {
      clearInterval(bubbleInterval)
      setStats((prev) => ({
        ...prev,
        cleanliness: 100,
        happiness: Math.min(100, prev.happiness + 12),
      }))
      addXP(5)
      setMood('super_happy')
      sound.playLevelUp()
      spawnParticles('star', 6, [0, 0.4, 0.3])
      spawnParticles('bubble', 8, [0, 0.2, 0])
      showMessage(`✨ Squeaky clean! ${petName}'s back is sparkling fresh! 🛁💖`, 3000)

      setTimeout(() => {
        if (!isSleeping) {
          setMood(stats.energy < 30 ? 'sleepy' : 'happy')
        }
      }, 1500)
    }, 2400)
  }, [isSleeping, stats.energy, addXP, showMessage, spawnParticles, petName])

  const handleSleep = useCallback(() => {
    if (isSleeping) {
      // Wake up
      setIsSleeping(false)
      sound.playPoke()
      setMood('happy')
      showMessage(`Good morning, ${petName}! Ready to play! ☀️`)
    } else {
      // Go to sleep
      setIsSleeping(true)
      sound.playSleep()
      setMood('sleeping')
      showMessage(`Shh... ${petName} is falling fast asleep. 💤`)
    }
  }, [isSleeping, petName, showMessage])

  const handleToggleSound = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev
      sound.setMuted(next)
      return next
    })
  }, [])

  const handleToggleNightMode = useCallback(() => {
    setIsNightMode((prev) => !prev)
  }, [])

  const handleResetStats = useCallback(() => {
    if (window.confirm('Reset all pet stats to defaults?')) {
      setStats(INITIAL_STATS)
      showMessage('Maxy has been refreshed!')
    }
  }, [showMessage])

  return (
    <div
      className={`app-container ${isNightMode ? 'night-theme' : 'day-theme'} ${
        isSleeping ? 'pet-sleeping-env' : ''
      }`}
    >
      {/* 3D Scene */}
      <Scene
        mood={mood}
        color={color}
        accessory={accessory}
        particles={particles}
        isTreatActive={isTreatActive}
        isToyActive={isToyActive}
        isSleeping={isSleeping}
        isNightMode={isNightMode}
        onPoke={handlePoke}
        onPet={handlePet}
        onTreatEaten={handleTreatEaten}
        onToyBounced={handleToyBounced}
      />

      {/* Responsive Glass UI Overlay */}
      <UIOverlay
        petName={petName}
        stats={stats}
        mood={mood}
        isNightMode={isNightMode}
        isMuted={isMuted}
        statusMessage={statusMessage}
        isSleeping={isSleeping}
        onToggleSound={handleToggleSound}
        onToggleNightMode={handleToggleNightMode}
        onOpenCustomizer={() => setIsCustomizerOpen(true)}
        onFeed={handleFeed}
        onPet={handlePet}
        onPlay={handlePlay}
        onWash={handleWash}
        onSleep={handleSleep}
        onResetStats={handleResetStats}
      />

      {/* Wardrobe & Customization Modal */}
      <CustomizerModal
        isOpen={isCustomizerOpen}
        onClose={() => setIsCustomizerOpen(false)}
        selectedColor={color}
        onSelectColor={setColor}
        selectedAccessory={accessory}
        onSelectAccessory={setAccessory}
        petName={petName}
        onChangePetName={setPetName}
      />
    </div>
  )
}
