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
  const [autoSleepSecondsLeft, setAutoSleepSecondsLeft] = useState<number | null>(null)
  const [pokeStreak, setPokeStreak] = useState(0)
  const lastPokeTimeRef = useRef(0)
  const angerCooloffTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const wasCryingBeforeFeedRef = useRef(false)

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
      const isTear = type === 'tear'
      const isAnger = type === 'anger'
      const spreadX = isCrumb ? 0.25 : (isTear || isAnger) ? 0.45 : 1.2
      const spreadY = isCrumb ? 0.2 : (isTear || isAnger) ? 0.35 : 0.8
      const spreadZ = isCrumb ? 0.2 : 0.6

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
            : isTear
            ? [
                (Math.random() - 0.5) * 0.008,
                -0.018 - Math.random() * 0.016,
                0.01 + Math.random() * 0.01,
              ]
            : isAnger
            ? [
                (Math.random() - 0.5) * 0.02,
                0.018 + Math.random() * 0.02,
                (Math.random() - 0.5) * 0.01,
              ]
            : [
                (Math.random() - 0.5) * 0.015,
                0.02 + Math.random() * 0.02,
                (Math.random() - 0.5) * 0.015,
              ],
          scale: (isCrumb ? 0.45 : isTear ? 0.75 : 0.6) + Math.random() * 0.4,
          opacity: 1,
          life: 0,
          maxLife: (isCrumb ? 50 : isTear ? 65 : 60) + Math.random() * 30,
        })
      }
      setParticles((prev) => [...prev.slice(-35), ...newParticles])
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
          // Natural depletion (gentle and relaxed energy consumption)
          const newHunger = Math.max(0, prev.hunger - 0.4)
          const newEnergy = Math.max(0, prev.energy - 0.08)
          const newClean = Math.max(0, prev.cleanliness - 0.2)
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
    if (
      mood === 'eating' ||
      mood === 'anticipating' ||
      mood === 'poked' ||
      mood === 'super_happy' ||
      mood === 'washing' ||
      mood === 'full' ||
      mood === 'waking_up' ||
      mood === 'annoyed' ||
      mood === 'angry' ||
      mood === 'crying'
    ) {
      return
    }
    if (stats.cleanliness < 35) {
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

  // Low energy yawning audio & floating Zzz effects for moderate sleepiness (16-29 energy)
  useEffect(() => {
    if (isSleeping || stats.energy >= 30 || stats.energy <= 15 || mood === 'crying') return

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
  }, [isSleeping, stats.energy >= 30, stats.energy <= 15, petName, showMessage, spawnParticles])

  // Auto-sleep timer when energy is fully low (<= 15)
  const isFullyExhausted = !isSleeping && stats.energy <= 15

  useEffect(() => {
    if (!isFullyExhausted) {
      setAutoSleepSecondsLeft(null)
      return
    }

    // Start 30-second countdown
    setAutoSleepSecondsLeft(30)
    sound.playYawn()
    showMessage(`*Yaaawn...* ${petName} is completely out of energy! Auto-sleeping in 30s... 💤`, 4500)
    spawnParticles('zzz', 2, [0.35, 0.7, 0.2])

    const interval = setInterval(() => {
      setAutoSleepSecondsLeft((prev) => {
        if (prev === null) return 30
        if (prev <= 1) return 0
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [isFullyExhausted, petName, showMessage, spawnParticles])

  // Trigger auto-sleep when countdown hits 0, with a warning at 10s
  useEffect(() => {
    if (autoSleepSecondsLeft === 0 && !isSleeping) {
      setIsSleeping(true)
      sound.playSleep()
      setMood('sleeping')
      showMessage(`*Doze...* ${petName} couldn't stay awake any longer and drifted off to sleep! 💤😴`, 5000)
      spawnParticles('zzz', 5, [0, 0.6, 0.2])
      setAutoSleepSecondsLeft(null)
    } else if (autoSleepSecondsLeft === 10) {
      sound.playYawn()
      showMessage(`*Heavy eyelids...* ${petName} is nodding off (10s until sleep)! 🥱`, 3000)
      spawnParticles('zzz', 2, [0.35, 0.7, 0.2])
    }
  }, [autoSleepSecondsLeft, isSleeping, petName, showMessage, spawnParticles])

  // Periodic weeping tears and whimpering sound while crying
  useEffect(() => {
    if (mood !== 'crying' || isSleeping) return
    const interval = setInterval(() => {
      sound.playCry()
      spawnParticles('tear', 2, [0, 0.45, 0.3])
    }, 4200)
    return () => clearInterval(interval)
  }, [mood, isSleeping, spawnParticles])

  // Clean up cooloff timer
  useEffect(() => {
    return () => {
      if (angerCooloffTimeoutRef.current) clearTimeout(angerCooloffTimeoutRef.current)
    }
  }, [])

  // Interactions
  const handlePoke = useCallback(() => {
    if (isSleeping) {
      sound.playPoke()
      setIsSleeping(false)
      setMood('waking_up')
      spawnParticles('star', 4, [0, 0.6, 0.3])
      showMessage(`*Poke!* ${petName} woke up with a big morning stretch! ☀️`, 3200)
      setTimeout(() => {
        sound.playPet()
      }, 700)
      setTimeout(() => {
        if (stats.energy < 30) {
          setMood('sleepy')
        } else {
          setMood(stats.happiness > 80 ? 'happy' : 'idle')
        }
      }, 1900)
      return
    }

    // If Maxy is already crying: poking hurts his feelings more and does NOT cheer him up
    // (after cry only get happy when feed)
    if (mood === 'crying') {
      sound.playCry()
      spawnParticles('tear', 3, [0, 0.45, 0.3])
      showMessage(`*Sob... Sniffle!* 😭 Poking only hurts ${petName}'s feelings! Feed them a sweet strawberry treat! 🍓💔`, 3500)
      return
    }

    const now = Date.now()
    const elapsed = now - lastPokeTimeRef.current
    lastPokeTimeRef.current = now

    // Streak increments if poked rapidly within 5.5 seconds
    const newStreak = elapsed < 5500 ? pokeStreak + 1 : 1
    setPokeStreak(newStreak)

    if (angerCooloffTimeoutRef.current) {
      clearTimeout(angerCooloffTimeoutRef.current)
      angerCooloffTimeoutRef.current = null
    }

    if (newStreak >= 7) {
      // Stage 3: Still poked while angry -> CRYING!
      sound.playCry()
      setMood('crying')
      spawnParticles('tear', 6, [0, 0.45, 0.3])
      setStats((prev) => ({
        ...prev,
        happiness: Math.max(10, prev.happiness - 20),
      }))
      showMessage(`*Waaaah!* 😭 ${petName} is heartbroken and crying! (Only a sweet treat will cheer them up!)`, 5500)
      // Maxy stays crying until fed a treat!
    } else if (newStreak >= 5) {
      // Stage 2: Still poked while annoyed -> ANGRY!
      sound.playAngry()
      setMood('angry')
      spawnParticles('anger', 4, [0.35, 0.65, 0.2])
      setStats((prev) => ({
        ...prev,
        happiness: Math.max(15, prev.happiness - 8),
      }))
      showMessage(`*Grrr!* 💢 ${petName} is really mad now! STOP poking! 😾`, 3500)

      // Cool off if left alone for 5.5s
      angerCooloffTimeoutRef.current = setTimeout(() => {
        setPokeStreak(0)
        setMood((current) => (current === 'angry' ? (stats.happiness > 80 ? 'happy' : 'idle') : current))
        showMessage(`*Phew...* ${petName} calmed down. 😌`, 2500)
      }, 5500)
    } else if (newStreak >= 3) {
      // Stage 1: Poked a lot -> ANNOYED!
      sound.playAnnoyed()
      setMood('annoyed')
      spawnParticles('crumb', 2, [0, 0.5, 0.2])
      setStats((prev) => ({
        ...prev,
        happiness: Math.max(20, prev.happiness - 4),
      }))
      showMessage(`*Hmph!* 😾 ${petName} is getting annoyed from all the poking!`, 3000)

      // Cool off if left alone for 5.0s
      angerCooloffTimeoutRef.current = setTimeout(() => {
        setPokeStreak(0)
        setMood((current) => (current === 'annoyed' ? (stats.happiness > 80 ? 'happy' : 'idle') : current))
        showMessage(`*Phew...* ${petName} calmed down. 😌`, 2500)
      }, 5000)
    } else {
      // Normal cute poke
      sound.playPoke()
      setMood('poked')
      spawnParticles('star', 2, [0, 0.4, 0.5])
      setStats((prev) => ({
        ...prev,
        happiness: Math.min(100, prev.happiness + 2),
      }))
      addXP(1)
      showMessage(newStreak === 1 ? `*Boing!* ${petName} wiggles cutely!` : `*Giggle!* ${petName} giggles from the tickles! ✨`)
      setTimeout(() => {
        setMood((current) => (current === 'poked' ? (stats.energy < 30 ? 'sleepy' : stats.happiness > 80 ? 'happy' : 'idle') : current))
      }, 700)
    }
  }, [isSleeping, mood, pokeStreak, stats.energy, stats.happiness, addXP, showMessage, spawnParticles, petName])

  const handlePet = useCallback(() => {
    if (isSleeping) {
      sound.playPet()
      setIsSleeping(false)
      showMessage(`*Purr...* ${petName} woke up with love! 💖`)
      return
    }

    // If crying: petting does not cure crying (only feeding does)
    if (mood === 'crying') {
      sound.playCry()
      spawnParticles('tear', 2, [0, 0.45, 0.3])
      showMessage(`*Sniffle...* 🥺 ${petName} is too sad to be petted right now. A sweet strawberry treat will cheer them up! 🍓`, 3500)
      return
    }

    // If annoyed or angry, gentle petting calms them down
    if (mood === 'annoyed' || mood === 'angry') {
      sound.playPet()
      setPokeStreak(0)
      if (angerCooloffTimeoutRef.current) clearTimeout(angerCooloffTimeoutRef.current)
      setMood('happy')
      spawnParticles('heart', 4, [0, 0.5, 0.2])
      showMessage(`*Purr...* The gentle pets soothed ${petName}! All calm now. 💖`, 3000)
      setStats((prev) => ({
        ...prev,
        happiness: Math.min(100, prev.happiness + 6),
      }))
      addXP(2)
      return
    }

    sound.playPet()
    showMessage(`${petName} loves the gentle affection! 💖`)
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
  }, [isSleeping, mood, stats.energy, addXP, showMessage, spawnParticles, petName])

  const handleFeed = useCallback(() => {
    if (isSleeping) {
      showMessage(`${petName} is fast asleep! Wake them first.`)
      return
    }
    const isCrying = mood === 'crying'
    wasCryingBeforeFeedRef.current = isCrying

    // Normal full tummy refusal (bypassed if crying for comfort!)
    if (stats.hunger >= 85 && !isCrying) {
      sound.playPet()
      setMood('full')
      spawnParticles('heart', 4, [0, 0.45, 0.3])
      spawnParticles('star', 3, [0, 0.25, 0.4])
      showMessage(`*Pats tummy* ${petName} is completely full and shakes their head: "No more please, I'm stuffed!" 🍓💕`, 3500)
      setTimeout(() => {
        if (!isSleeping) {
          setMood(stats.energy < 30 ? 'sleepy' : stats.happiness > 80 ? 'happy' : 'idle')
        }
      }, 2500)
      return
    }

    setIsTreatActive(true)
    setMood('anticipating')
    if (isCrying) {
      sound.playCheerUp()
      showMessage(`Look ${petName}! A yummy comfort strawberry just for you! 🍓✨`, 3000)
    } else {
      showMessage(`Tossing a strawberry! ${petName} opens wide! 🍓`)
    }
  }, [isSleeping, mood, stats.hunger, stats.energy, stats.happiness, petName, showMessage, spawnParticles])

  const handleTreatEaten = useCallback(() => {
    setIsTreatActive(false)
    sound.playFeed()
    const wasCrying = wasCryingBeforeFeedRef.current
    wasCryingBeforeFeedRef.current = false
    setPokeStreak(0)
    if (angerCooloffTimeoutRef.current) clearTimeout(angerCooloffTimeoutRef.current)

    setMood('eating')
    spawnParticles('heart', wasCrying ? 6 : 4, [0, 0.35, 0.4])
    spawnParticles('star', wasCrying ? 6 : 3, [0, 0.15, 0.5])
    if (wasCrying) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      })
    }

    setStats((prev) => ({
      ...prev,
      hunger: Math.min(100, prev.hunger + 30),
      energy: Math.min(100, prev.energy + 8),
      happiness: Math.min(100, prev.happiness + (wasCrying ? 35 : 10)),
    }))
    addXP(wasCrying ? 10 : 5)

    if (wasCrying) {
      sound.playCheerUp()
      showMessage(`*Sniffle... Gulp!* 🍓 ${petName} loved the sweet strawberry and cheered right up! All smiles again! 🥰💖`, 4000)
    } else {
      showMessage(`*Mmm!* ${petName} loves the sweet strawberry! 🍓✨`, 3000)
    }

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
    if (mood === 'crying') {
      sound.playCry()
      spawnParticles('tear', 2, [0, 0.45, 0.3])
      showMessage(`*Sniffle...* 🥺 ${petName} is crying too hard to play right now. Give them a treat to cheer them up! 🍓`, 3500)
      return
    }
    setIsToyActive((prev) => !prev)
    if (!isToyActive) {
      showMessage(`Spawned a red toy ball! Hold & drag to throw it at ${petName}! 🔴`)
      sound.playPoke()
    } else {
      showMessage(`Put the toy ball away.`)
    }
  }, [isSleeping, isToyActive, mood, petName, showMessage, spawnParticles])

  const handleToyBounced = useCallback(() => {
    sound.playPoke()
    spawnParticles('star', 2, [1.5, -0.8, 0])
    setStats((prev) => ({
      ...prev,
      happiness: Math.min(100, prev.happiness + 5),
      energy: Math.max(0, prev.energy - 0.4),
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

    // Smoothly dissolve dirt and increase cleanliness step-by-step
    const startClean = stats.cleanliness
    const washDuration = 2100
    const startTime = performance.now()

    const washProgInterval = setInterval(() => {
      const elapsed = performance.now() - startTime
      const progress = Math.min(1, elapsed / washDuration)
      // Ease out quad: dirt shrinks smoothly as sponge scrubs
      const ease = 1 - (1 - progress) * (1 - progress)
      const currentClean = Math.min(100, Math.round(startClean + (100 - startClean) * ease))
      setStats((prev) => ({
        ...prev,
        cleanliness: currentClean,
      }))
      if (progress >= 1) {
        clearInterval(washProgInterval)
      }
    }, 45)

    setTimeout(() => {
      clearInterval(bubbleInterval)
      clearInterval(washProgInterval)
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
  }, [isSleeping, stats.cleanliness, stats.energy, addXP, showMessage, spawnParticles, petName])

  const handleWakeUp = useCallback(() => {
    if (isSleeping) {
      setIsSleeping(false)
      sound.playPoke()
      setMood('waking_up')
      spawnParticles('star', 6, [0, 0.7, 0.2])
      spawnParticles('heart', 3, [0.2, 0.8, 0.2])
      showMessage(`*Tug!* You pulled off ${petName}'s nightcap! Good morning! ☀️`, 3500)
      addXP(4)

      setTimeout(() => {
        sound.playPet()
        spawnParticles('star', 4, [0, 0.5, 0.3])
      }, 700)

      setTimeout(() => {
        if (!isSleeping) {
          setMood(stats.energy < 30 ? 'sleepy' : stats.happiness > 80 ? 'happy' : 'idle')
        }
      }, 1900)
    }
  }, [isSleeping, stats.energy, stats.happiness, petName, showMessage, spawnParticles, addXP])

  const handleSleep = useCallback(() => {
    if (isSleeping) {
      // Wake up
      setIsSleeping(false)
      sound.playPoke()
      setMood('waking_up')
      spawnParticles('star', 5, [0, 0.7, 0.2])
      showMessage(`Good morning, ${petName}! Ready to play! ☀️`, 3200)
      setTimeout(() => {
        sound.playPet()
      }, 700)
      setTimeout(() => {
        if (!isSleeping) {
          setMood(stats.energy < 30 ? 'sleepy' : 'happy')
        }
      }, 1900)
    } else {
      // Go to sleep
      setIsSleeping(true)
      sound.playSleep()
      setMood('sleeping')
      showMessage(`Shh... ${petName} is falling fast asleep. 💤`)
    }
  }, [isSleeping, stats.energy, petName, showMessage, spawnParticles])

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

  const handleUpdateStat = useCallback(
    (key: 'happiness' | 'hunger' | 'energy' | 'cleanliness', value: number) => {
      setStats((prev) => ({
        ...prev,
        [key]: Math.max(0, Math.min(100, Math.round(value))),
      }))
    },
    []
  )

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
        onWakeUp={handleWakeUp}
        cleanliness={stats.cleanliness}
        energy={stats.energy}
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
        onUpdateStat={handleUpdateStat}
        autoSleepSecondsLeft={autoSleepSecondsLeft}
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
