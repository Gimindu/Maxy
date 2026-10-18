import * as THREE from 'three'
import { PetMood } from '../types/pet'

export class DynamicFaceTexture {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  public texture: THREE.CanvasTexture
  private blinkTimer: number = 0
  private isBlinking: boolean = false
  private chewState: number = 0
  private yawnTimer: number = 0

  constructor(size: number = 512) {
    this.canvas = document.createElement('canvas')
    this.canvas.width = size
    this.canvas.height = size
    this.ctx = this.canvas.getContext('2d', { willReadFrequently: true })!
    this.texture = new THREE.CanvasTexture(this.canvas)
    this.texture.needsUpdate = true
    this.texture.colorSpace = THREE.SRGBColorSpace
  }

  public update(
    mood: PetMood,
    gazeX: number, // -1 to 1
    gazeY: number, // -1 to 1
    delta: number,
    blushColor: string = '#FF9EAA'
  ) {
    // Blinking logic
    this.blinkTimer += delta
    if (!this.isBlinking && this.blinkTimer > 3.2 + Math.random() * 2) {
      this.isBlinking = true
      this.blinkTimer = 0
    } else if (this.isBlinking && this.blinkTimer > 0.15) {
      this.isBlinking = false
      this.blinkTimer = 0
    }

    if (mood === 'eating') {
      this.chewState += delta * 12
    }

    // Yawn cycle for sleepy mood
    let yawnPhase = 0
    if (mood === 'sleepy') {
      this.yawnTimer = (this.yawnTimer + delta) % 4.2
      if (this.yawnTimer >= 1.0 && this.yawnTimer <= 2.8) {
        yawnPhase = Math.sin(((this.yawnTimer - 1.0) / 1.8) * Math.PI)
      }
    } else {
      this.yawnTimer = 0
    }

    const { width, height } = this.canvas
    const ctx = this.ctx
    ctx.clearRect(0, 0, width, height)

    // Eye settings
    const leftEyeX = width * 0.34
    const rightEyeX = width * 0.66
    const eyeY = height * 0.44
    const eyeRadius = width * 0.075

    // Pupil offset from gaze (-1 to 1)
    const pupilOffsetX = THREE.MathUtils.clamp(gazeX, -1, 1) * 9
    const pupilOffsetY = THREE.MathUtils.clamp(-gazeY, -1, 1) * 7

    // Draw Cheeks (Blush)
    const cheekY = height * 0.55
    const leftCheekX = width * 0.24
    const rightCheekX = width * 0.76
    // Cheeks puff out rhythmically while munching
    const chewPuff = mood === 'eating' ? Math.sin(this.chewState) * 3.5 : 0
    const cheekRadius = width * 0.07 + chewPuff

    ctx.save()
    const blushAlpha = mood === 'super_happy' ? 0.85 : mood === 'happy' ? 0.7 : 0.45
    ctx.globalAlpha = blushAlpha
    ctx.fillStyle = blushColor

    // Left blush
    ctx.beginPath()
    ctx.ellipse(leftCheekX, cheekY, cheekRadius, cheekRadius * 0.65, 0, 0, Math.PI * 2)
    ctx.fill()

    // Right blush
    ctx.beginPath()
    ctx.ellipse(rightCheekX, cheekY, cheekRadius, cheekRadius * 0.65, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()

    // Dirt spots if dirty
    if (mood === 'dirty') {
      ctx.fillStyle = 'rgba(120, 80, 40, 0.55)'
      ctx.beginPath()
      ctx.arc(leftEyeX - 35, eyeY - 20, 12, 0, Math.PI * 2)
      ctx.arc(rightEyeX + 30, eyeY + 40, 16, 0, Math.PI * 2)
      ctx.arc(width * 0.5, eyeY - 50, 14, 0, Math.PI * 2)
      ctx.fill()
    }

    // Draw Eyes based on Mood
    if (mood === 'sleeping') {
      // Sleepy closed curved eyes: u_u
      ctx.strokeStyle = '#2B2129'
      ctx.lineWidth = 10
      ctx.lineCap = 'round'

      ctx.beginPath()
      ctx.arc(leftEyeX, eyeY - 5, eyeRadius * 0.8, 0.2, Math.PI - 0.2)
      ctx.stroke()

      ctx.beginPath()
      ctx.arc(rightEyeX, eyeY - 5, eyeRadius * 0.8, 0.2, Math.PI - 0.2)
      ctx.stroke()
    } else if (mood === 'eating') {
      // Joyful closed smiling eyes while munching: ^ ^
      const chewSquint = Math.sin(this.chewState) * 2.5
      ctx.strokeStyle = '#2B2129'
      ctx.lineWidth = 10
      ctx.lineCap = 'round'

      ctx.beginPath()
      ctx.arc(leftEyeX, eyeY + 4 + chewSquint, eyeRadius * 0.85, Math.PI + 0.25, -0.25)
      ctx.stroke()

      ctx.beginPath()
      ctx.arc(rightEyeX, eyeY + 4 + chewSquint, eyeRadius * 0.85, Math.PI + 0.25, -0.25)
      ctx.stroke()
    } else if (mood === 'anticipating') {
      // Big excited open sparkling eyes focused on incoming treat!
      ;[leftEyeX, rightEyeX].forEach((ex) => {
        ctx.fillStyle = '#231B26'
        ctx.beginPath()
        ctx.ellipse(ex + 4, eyeY + 4, eyeRadius * 1.1, eyeRadius * 1.15, 0, 0, Math.PI * 2)
        ctx.fill()

        // Excited large sparkles
        ctx.fillStyle = '#FFFFFF'
        ctx.beginPath()
        ctx.arc(ex + 1, eyeY, eyeRadius * 0.45, 0, Math.PI * 2)
        ctx.fill()
        ctx.beginPath()
        ctx.arc(ex + 9, eyeY + 8, eyeRadius * 0.2, 0, Math.PI * 2)
        ctx.fill()

        ctx.fillStyle = '#FFD166'
        ctx.beginPath()
        ctx.arc(ex - 3, eyeY + 8, eyeRadius * 0.16, 0, Math.PI * 2)
        ctx.fill()
      })
    } else if (mood === 'poked') {
      // Squished eyes: >.<
      ctx.strokeStyle = '#2B2129'
      ctx.lineWidth = 10
      ctx.lineCap = 'round'

      // Left '>'
      ctx.beginPath()
      ctx.moveTo(leftEyeX - 25, eyeY - 20)
      ctx.lineTo(leftEyeX + 15, eyeY)
      ctx.lineTo(leftEyeX - 25, eyeY + 20)
      ctx.stroke()

      // Right '<'
      ctx.beginPath()
      ctx.moveTo(rightEyeX + 25, eyeY - 20)
      ctx.lineTo(rightEyeX - 15, eyeY)
      ctx.lineTo(rightEyeX + 25, eyeY + 20)
      ctx.stroke()
    } else if (mood === 'dizzy') {
      // Dizzy spirals or @ @
      ctx.strokeStyle = '#2B2129'
      ctx.lineWidth = 7
      ;[leftEyeX, rightEyeX].forEach((xCenter) => {
        ctx.beginPath()
        for (let angle = 0; angle < Math.PI * 4; angle += 0.2) {
          const r = (angle / (Math.PI * 4)) * eyeRadius
          const px = xCenter + Math.cos(angle) * r
          const py = eyeY + Math.sin(angle) * r
          if (angle === 0) ctx.moveTo(px, py)
          else ctx.lineTo(px, py)
        }
        ctx.stroke()
      })
    } else if (mood === 'sleepy') {
      if (yawnPhase > 0.15) {
        // Eyes squished shut tightly during big yawn: > <
        ctx.strokeStyle = '#2B2129'
        ctx.lineWidth = 9
        ctx.lineCap = 'round'

        // Left eye squint >
        ctx.beginPath()
        ctx.moveTo(leftEyeX - 22, eyeY - 14)
        ctx.lineTo(leftEyeX + 12, eyeY)
        ctx.lineTo(leftEyeX - 22, eyeY + 14)
        ctx.stroke()

        // Right eye squint <
        ctx.beginPath()
        ctx.moveTo(rightEyeX + 22, eyeY - 14)
        ctx.lineTo(rightEyeX - 12, eyeY)
        ctx.lineTo(rightEyeX + 22, eyeY + 14)
        ctx.stroke()

        // Cute tiredness teardrop
        ctx.fillStyle = '#64DFDF'
        ctx.beginPath()
        ctx.arc(leftEyeX - 28, eyeY + 16, 5, 0, Math.PI * 2)
        ctx.fill()
      } else {
        // Droopy, half-closed sleepy eyes with heavy drooping eyelids
        ;[leftEyeX, rightEyeX].forEach((ex) => {
          ctx.save()
          // Clip to bottom 65% of the eye circle
          ctx.beginPath()
          ctx.rect(ex - eyeRadius * 1.3, eyeY - eyeRadius * 0.1, eyeRadius * 2.6, eyeRadius * 1.5)
          ctx.clip()

          // Dark pupil
          ctx.fillStyle = '#231B26'
          ctx.beginPath()
          ctx.ellipse(ex + pupilOffsetX * 0.3, eyeY + pupilOffsetY * 0.3, eyeRadius, eyeRadius, 0, 0, Math.PI * 2)
          ctx.fill()

          // Tired sleepy glint
          ctx.fillStyle = '#FFFFFF'
          ctx.beginPath()
          ctx.arc(ex + pupilOffsetX - 6, eyeY + pupilOffsetY + 5, eyeRadius * 0.25, 0, Math.PI * 2)
          ctx.fill()
          ctx.restore()

          // Heavy sleepy eyelid crease line
          ctx.strokeStyle = '#2B2129'
          ctx.lineWidth = 7
          ctx.lineCap = 'round'
          ctx.beginPath()
          ctx.arc(ex, eyeY - 2, eyeRadius * 1.05, 0.12, Math.PI - 0.12)
          ctx.stroke()
        })
      }
    } else if (this.isBlinking) {
      // Normal blinking line
      ctx.strokeStyle = '#2B2129'
      ctx.lineWidth = 8
      ctx.lineCap = 'round'

      ctx.beginPath()
      ctx.moveTo(leftEyeX - eyeRadius, eyeY)
      ctx.lineTo(leftEyeX + eyeRadius, eyeY)
      ctx.stroke()

      ctx.beginPath()
      ctx.moveTo(rightEyeX - eyeRadius, eyeY)
      ctx.lineTo(rightEyeX + eyeRadius, eyeY)
      ctx.stroke()
    } else {
      // Normal / Happy open shiny eyes
      ;[leftEyeX, rightEyeX].forEach((ex) => {
        // Main eye background
        ctx.fillStyle = '#231B26'
        ctx.beginPath()
        ctx.ellipse(ex + pupilOffsetX * 0.4, eyeY + pupilOffsetY * 0.4, eyeRadius, eyeRadius * 1.08, 0, 0, Math.PI * 2)
        ctx.fill()

        // Highlight 1 (big sparkle)
        ctx.fillStyle = '#FFFFFF'
        ctx.beginPath()
        ctx.arc(ex + pupilOffsetX - 11, eyeY + pupilOffsetY - 11, eyeRadius * 0.38, 0, Math.PI * 2)
        ctx.fill()

        // Highlight 2 (small sparkle)
        ctx.beginPath()
        ctx.arc(ex + pupilOffsetX + 12, eyeY + pupilOffsetY + 12, eyeRadius * 0.18, 0, Math.PI * 2)
        ctx.fill()

        if (mood === 'super_happy') {
          // Extra star sparkle in eye
          ctx.fillStyle = '#FFEB3B'
          ctx.beginPath()
          ctx.arc(ex + pupilOffsetX, eyeY + pupilOffsetY + 15, eyeRadius * 0.12, 0, Math.PI * 2)
          ctx.fill()
        }
      })
    }

    // Draw Mouth
    const mouthY = height * 0.56
    const mouthX = width * 0.5
    ctx.strokeStyle = '#2B2129'
    ctx.lineWidth = 8
    ctx.lineCap = 'round'

    if (mood === 'sleeping') {
      // Small relaxed tiny mouth
      ctx.beginPath()
      ctx.arc(mouthX, mouthY, 7, 0, Math.PI)
      ctx.stroke()
    } else if (mood === 'sleepy') {
      if (yawnPhase > 0.05) {
        // Yawning mouth: stretches open wide and tall!
        const yawnHeight = 10 + yawnPhase * 24
        const yawnWidth = 14 + yawnPhase * 8

        // Dark inner mouth cavern
        ctx.fillStyle = '#2B1D28'
        ctx.beginPath()
        ctx.ellipse(mouthX, mouthY + yawnPhase * 7, yawnWidth, yawnHeight, 0, 0, Math.PI * 2)
        ctx.fill()
        ctx.stroke()

        // Cute pink tongue at bottom of the yawn
        ctx.fillStyle = '#FF8FA3'
        ctx.beginPath()
        ctx.ellipse(mouthX, mouthY + yawnPhase * 7 + yawnHeight * 0.45, yawnWidth * 0.65, yawnHeight * 0.4, 0, 0, Math.PI)
        ctx.fill()
      } else {
        // Drowsy relaxed wavy mouth
        ctx.beginPath()
        ctx.arc(mouthX, mouthY + 2, 7, 0, Math.PI)
        ctx.stroke()
      }
    } else if (mood === 'anticipating') {
      // Mouth OPEN WIDE in anticipation! "Aaaah! :O"
      const mWidth = 19
      const mHeight = 24

      // Dark inner mouth cavern
      ctx.fillStyle = '#2B1D28'
      ctx.beginPath()
      ctx.ellipse(mouthX, mouthY + 8, mWidth, mHeight, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.stroke()

      // Pink tongue at bottom
      ctx.fillStyle = '#FF758F'
      ctx.beginPath()
      ctx.ellipse(mouthX, mouthY + 18, mWidth * 0.7, 9, 0, 0, Math.PI)
      ctx.fill()
    } else if (mood === 'eating') {
      // Dynamic rhythmic chewing & munching mouth!
      // Alternates between opening wide with food inside and biting shut: "om nom nom"
      const chewCycle = Math.sin(this.chewState) * 0.5 + 0.5 // 0 (bite shut) to 1 (mouth open)
      const mouthOpen = chewCycle > 0.22

      if (mouthOpen) {
        // Open munch cavern
        const openProgress = (chewCycle - 0.22) / 0.78
        const chewWidth = 14 + openProgress * 9
        const chewHeight = 6 + openProgress * 19

        // Dark inner mouth cavern
        ctx.fillStyle = '#2B1D28'
        ctx.beginPath()
        ctx.ellipse(mouthX, mouthY + 5, chewWidth, chewHeight, 0, 0, Math.PI * 2)
        ctx.fill()
        ctx.stroke()

        // Strawberry morsels inside mouth being chewed
        ctx.fillStyle = '#FF2A55'
        ctx.beginPath()
        ctx.arc(mouthX - 4, mouthY + 3, 3.5, 0, Math.PI * 2)
        ctx.arc(mouthX + 5, mouthY + 6, 3, 0, Math.PI * 2)
        ctx.fill()

        // Cute animated pink tongue
        ctx.fillStyle = '#FF758F'
        const tongueWiggle = Math.cos(this.chewState * 2) * 3
        ctx.beginPath()
        ctx.ellipse(mouthX + tongueWiggle, mouthY + 5 + chewHeight * 0.45, chewWidth * 0.7, chewHeight * 0.42, 0, 0, Math.PI)
        ctx.fill()
      } else {
        // Bite-down chomp! Closed wavy munching cat-lips :3
        ctx.strokeStyle = '#2B2129'
        ctx.lineWidth = 9
        ctx.lineCap = 'round'

        const curveR = 12
        ctx.beginPath()
        ctx.arc(mouthX - curveR + 1, mouthY + 5, curveR, 0.2, Math.PI * 0.85)
        ctx.stroke()

        ctx.beginPath()
        ctx.arc(mouthX + curveR - 1, mouthY + 5, curveR, 0.15, Math.PI * 0.8)
        ctx.stroke()
      }

      // Food strawberry crumbs jumping around mouth while munching!
      const crumbHop = Math.sin(this.chewState * 2) * 3
      ctx.fillStyle = '#FF2A55'
      ctx.beginPath()
      ctx.arc(mouthX - 22, mouthY + 2 + crumbHop, 3, 0, Math.PI * 2)
      ctx.arc(mouthX + 24, mouthY + 6 - crumbHop, 2.5, 0, Math.PI * 2)
      ctx.arc(mouthX + 18, mouthY - 7 + crumbHop, 2.2, 0, Math.PI * 2)
      ctx.arc(mouthX - 16, mouthY + 12 - crumbHop, 2, 0, Math.PI * 2)
      ctx.fill()
    } else if (mood === 'super_happy') {
      // Big open happy mouth with tongue
      ctx.fillStyle = '#FF5277'
      ctx.beginPath()
      ctx.arc(mouthX, mouthY - 4, 22, 0.1, Math.PI - 0.1)
      ctx.closePath()
      ctx.fill()
      ctx.stroke()

      // Little tongue
      ctx.fillStyle = '#FFAEC0'
      ctx.beginPath()
      ctx.arc(mouthX, mouthY + 8, 11, 0, Math.PI)
      ctx.fill()
    } else if (mood === 'poked') {
      // Cute squished small circle :o
      ctx.fillStyle = '#3A2E39'
      ctx.beginPath()
      ctx.arc(mouthX, mouthY + 4, 10, 0, Math.PI * 2)
      ctx.fill()
    } else {
      // Adorable Cat mouth / :3 smile
      const curveR = 14
      ctx.beginPath()
      ctx.arc(mouthX - curveR, mouthY - 4, curveR, 0.2, Math.PI * 0.85)
      ctx.stroke()

      ctx.beginPath()
      ctx.arc(mouthX + curveR, mouthY - 4, curveR, 0.15, Math.PI * 0.8)
      ctx.stroke()
    }

    this.texture.needsUpdate = true
  }

  public dispose() {
    this.texture.dispose()
  }
}
