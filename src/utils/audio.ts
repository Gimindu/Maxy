// Cute sound synthesizer using Web Audio API

class SoundManager {
  private ctx: AudioContext | null = null
  private isMuted: boolean = false

  private initCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      this.ctx = new AudioCtx()
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume()
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted
  }

  public getMuted(): boolean {
    return this.isMuted
  }

  public playPoke() {
    if (this.isMuted) return
    this.initCtx()
    if (!this.ctx) return

    const now = this.ctx.currentTime
    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()

    osc.type = 'sine'
    // Quick squishy pitch sweep up then drop
    osc.frequency.setValueAtTime(260, now)
    osc.frequency.exponentialRampToValueAtTime(520, now + 0.08)
    osc.frequency.exponentialRampToValueAtTime(330, now + 0.18)

    gain.gain.setValueAtTime(0.25, now)
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.22)

    osc.connect(gain)
    gain.connect(this.ctx.destination)

    osc.start(now)
    osc.stop(now + 0.22)
  }

  public playPet() {
    if (this.isMuted) return
    this.initCtx()
    if (!this.ctx) return

    const now = this.ctx.currentTime
    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()

    osc.type = 'triangle'
    osc.frequency.setValueAtTime(587.33, now) // D5
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.12) // A5

    gain.gain.setValueAtTime(0.15, now)
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25)

    osc.connect(gain)
    gain.connect(this.ctx.destination)

    osc.start(now)
    osc.stop(now + 0.25)
  }

  public playFeed() {
    if (this.isMuted) return
    this.initCtx()
    if (!this.ctx) return

    const now = this.ctx.currentTime
    // Extended rhythmic munching sequence: crunch, chew, chew, munch, gulp!
    const munchOffsets = [0, 0.28, 0.58, 0.90, 1.25, 1.62]
    munchOffsets.forEach((offset, idx) => {
      if (!this.ctx) return
      const osc = this.ctx.createOscillator()
      const gain = this.ctx.createGain()

      osc.type = idx % 2 === 0 ? 'triangle' : 'sine'
      const baseFreq = 300 + (idx % 3) * 60
      osc.frequency.setValueAtTime(baseFreq, now + offset)
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.7, now + offset + 0.06)
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.65, now + offset + 0.14)

      gain.gain.setValueAtTime(0.24, now + offset)
      gain.gain.exponentialRampToValueAtTime(0.01, now + offset + 0.15)

      osc.connect(gain)
      gain.connect(this.ctx.destination)

      osc.start(now + offset)
      osc.stop(now + offset + 0.15)
    })

    // Satisfied swallow gulp at 1.95s
    setTimeout(() => {
      if (!this.ctx || this.isMuted) return
      const gulpNow = this.ctx.currentTime
      const osc = this.ctx.createOscillator()
      const gain = this.ctx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(440, gulpNow)
      osc.frequency.exponentialRampToValueAtTime(620, gulpNow + 0.1)
      gain.gain.setValueAtTime(0.18, gulpNow)
      gain.gain.exponentialRampToValueAtTime(0.01, gulpNow + 0.18)
      osc.connect(gain)
      gain.connect(this.ctx.destination)
      osc.start(gulpNow)
      osc.stop(gulpNow + 0.18)
    }, 1950)
  }

  public playSleep() {
    if (this.isMuted) return
    this.initCtx()
    if (!this.ctx) return

    const now = this.ctx.currentTime
    const notes = [440, 493.88, 554.37, 659.25]
    notes.forEach((freq, i) => {
      if (!this.ctx) return
      const osc = this.ctx.createOscillator()
      const gain = this.ctx.createGain()

      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, now + i * 0.15)

      gain.gain.setValueAtTime(0.12, now + i * 0.15)
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.15 + 0.4)

      osc.connect(gain)
      gain.connect(this.ctx.destination)

      osc.start(now + i * 0.15)
      osc.stop(now + i * 0.15 + 0.4)
    })
  }

  public playWash() {
    if (this.isMuted) return
    this.initCtx()
    if (!this.ctx) return

    const now = this.ctx.currentTime
    // Pop bubbles
    ;[0, 0.08, 0.16].forEach((offset, i) => {
      if (!this.ctx) return
      const osc = this.ctx.createOscillator()
      const gain = this.ctx.createGain()

      osc.type = 'sine'
      const freq = 600 + i * 150
      osc.frequency.setValueAtTime(freq, now + offset)
      osc.frequency.exponentialRampToValueAtTime(freq * 1.5, now + offset + 0.05)

      gain.gain.setValueAtTime(0.15, now + offset)
      gain.gain.exponentialRampToValueAtTime(0.01, now + offset + 0.07)

      osc.connect(gain)
      gain.connect(this.ctx.destination)

      osc.start(now + offset)
      osc.stop(now + offset + 0.07)
    })
  }

  public playLevelUp() {
    if (this.isMuted) return
    this.initCtx()
    if (!this.ctx) return

    const now = this.ctx.currentTime
    const chord = [523.25, 659.25, 783.99, 1046.50] // C5, E5, G5, C6
    chord.forEach((freq, idx) => {
      if (!this.ctx) return
      const osc = this.ctx.createOscillator()
      const gain = this.ctx.createGain()

      osc.type = 'triangle'
      osc.frequency.setValueAtTime(freq, now + idx * 0.08)

      gain.gain.setValueAtTime(0.2, now + idx * 0.08)
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.5)

      osc.connect(gain)
      gain.connect(this.ctx.destination)

      osc.start(now + idx * 0.08)
      osc.stop(now + idx * 0.08 + 0.5)
    })
  }

  public playYawn() {
    if (this.isMuted) return
    this.initCtx()
    if (!this.ctx) return

    const now = this.ctx.currentTime
    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()

    osc.type = 'sine'
    // Gentle yawn pitch contour: rise, brief plateau, soft tired exhale drop
    osc.frequency.setValueAtTime(290, now)
    osc.frequency.exponentialRampToValueAtTime(430, now + 0.4)
    osc.frequency.exponentialRampToValueAtTime(390, now + 0.65)
    osc.frequency.exponentialRampToValueAtTime(220, now + 1.1)

    gain.gain.setValueAtTime(0.01, now)
    gain.gain.linearRampToValueAtTime(0.18, now + 0.35)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.15)

    osc.connect(gain)
    gain.connect(this.ctx.destination)

    osc.start(now)
    osc.stop(now + 1.15)
  }
}

export const sound = new SoundManager()
