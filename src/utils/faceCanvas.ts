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
    blushColor: string = '#FF9EAA',
    cleanliness: number = 100
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

    // Mouth center coordinates
    const mouthX = width * 0.5
    const mouthY = height * 0.56

    // Draw Cheeks (Blush)
    const cheekY = height * 0.55
    const leftCheekX = width * 0.24
    const rightCheekX = width * 0.76
    // Cheeks puff out rhythmically while munching
    const chewPuff = mood === 'eating' ? Math.sin(this.chewState) * 3.5 : 0
    const cheekRadius = width * 0.07 + chewPuff

    ctx.save()
    const blushAlpha = mood === 'super_happy' || mood === 'full' ? 0.88 : mood === 'happy' ? 0.7 : 0.45
    ctx.globalAlpha = blushAlpha
    ctx.fillStyle = blushColor

    const fullPuff = mood === 'full' ? 7 : 0
    // Left blush
    ctx.beginPath()
    ctx.ellipse(leftCheekX, cheekY, cheekRadius + fullPuff, (cheekRadius + fullPuff) * 0.65, 0, 0, Math.PI * 2)
    ctx.fill()

    // Right blush
    ctx.beginPath()
    ctx.ellipse(rightCheekX, cheekY, cheekRadius + fullPuff, (cheekRadius + fullPuff) * 0.65, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()

    // Calculate dirt intensity smoothly scaling down to 95% cleanliness
    let dirtFactor = Math.max(0, Math.min(1, (95 - cleanliness) / 75))
    if (mood === 'dirty' && cleanliness < 35) {
      dirtFactor = Math.max(dirtFactor, 0.45)
    }

    // Dirt spots and mud smudges when hygiene is low (shrinks smoothly down to tiny specks)
    if (dirtFactor > 0.005) {
      const shrinkScale = Math.pow(dirtFactor, 1.35)
      const smudgeOpacity = Math.min(0.92, dirtFactor * 1.05)

      // 1. Left cheek mud smudge & splatters
      ctx.fillStyle = `rgba(102, 68, 34, ${0.65 * smudgeOpacity})`
      ctx.beginPath()
      ctx.ellipse(leftCheekX - 10, cheekY - 4, 18 * shrinkScale, 12 * shrinkScale, 0.35, 0, Math.PI * 2)
      ctx.fill()

      // Darker core
      ctx.fillStyle = `rgba(74, 46, 20, ${0.8 * smudgeOpacity})`
      ctx.beginPath()
      ctx.ellipse(leftCheekX - 10, cheekY - 4, 10 * shrinkScale, 6 * shrinkScale, 0.35, 0, Math.PI * 2)
      ctx.fill()

      // Speckles near left cheek
      ctx.fillStyle = `rgba(90, 58, 28, ${0.7 * smudgeOpacity})`
      ctx.beginPath()
      ctx.arc(leftCheekX - 28, cheekY - 14, 3.5 * shrinkScale, 0, Math.PI * 2)
      ctx.arc(leftCheekX - 4, cheekY + 12, 4 * shrinkScale, 0, Math.PI * 2)
      ctx.arc(leftCheekX - 24, cheekY + 8, 2.5 * shrinkScale, 0, Math.PI * 2)
      ctx.fill()

      // 2. Right cheek grimy smudge & scratch streaks
      ctx.fillStyle = `rgba(102, 68, 34, ${0.58 * smudgeOpacity})`
      ctx.beginPath()
      ctx.ellipse(rightCheekX + 10, cheekY - 6, 16 * shrinkScale, 10 * shrinkScale, -0.3, 0, Math.PI * 2)
      ctx.fill()

      // Cute cartoon dirt scratch streaks on right cheek
      if (shrinkScale > 0.15) {
        ctx.strokeStyle = `rgba(80, 50, 22, ${0.75 * smudgeOpacity})`
        ctx.lineWidth = Math.max(1, 3.5 * shrinkScale)
        ctx.lineCap = 'round'
        ctx.beginPath()
        ctx.moveTo(rightCheekX + 2, cheekY - 14)
        ctx.lineTo(rightCheekX + 22, cheekY - 5)
        ctx.moveTo(rightCheekX + 4, cheekY - 2)
        ctx.lineTo(rightCheekX + 25, cheekY + 7)
        ctx.stroke()
      }

      // 3. Forehead mud dab & speckles
      ctx.fillStyle = `rgba(95, 62, 30, ${0.62 * smudgeOpacity})`
      ctx.beginPath()
      ctx.ellipse(width * 0.44, eyeY - 46, 18 * shrinkScale, 9 * shrinkScale, -0.15, 0, Math.PI * 2)
      ctx.fill()

      ctx.beginPath()
      ctx.arc(width * 0.54, eyeY - 40, 4.5 * shrinkScale, 0, Math.PI * 2)
      ctx.arc(width * 0.36, eyeY - 42, 3.5 * shrinkScale, 0, Math.PI * 2)
      ctx.fill()

      // 4. Little snout / chin mud dab
      ctx.fillStyle = `rgba(90, 56, 26, ${0.65 * smudgeOpacity})`
      ctx.beginPath()
      ctx.arc(mouthX - 20, mouthY + 14, 5 * shrinkScale, 0, Math.PI * 2)
      ctx.arc(mouthX + 22, mouthY + 12, 4.5 * shrinkScale, 0, Math.PI * 2)
      ctx.fill()

      // 5. Comical cartoon grime cross on forehead when very dirty
      if (dirtFactor > 0.6) {
        ctx.strokeStyle = `rgba(70, 42, 18, ${0.85 * smudgeOpacity})`
        ctx.lineWidth = Math.max(1, 3 * shrinkScale)
        ctx.beginPath()
        ctx.moveTo(width * 0.62 - 7, eyeY - 44)
        ctx.lineTo(width * 0.62 + 7, eyeY - 44)
        ctx.moveTo(width * 0.62, eyeY - 51)
        ctx.lineTo(width * 0.62, eyeY - 37)
        ctx.stroke()
      }
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

      // Left eye
      ctx.beginPath()
      ctx.arc(leftEyeX, eyeY + 4 + chewSquint, eyeRadius * 0.85, Math.PI + 0.25, -0.25)
      ctx.stroke()

      // Right eye
      ctx.beginPath()
      ctx.arc(rightEyeX, eyeY + 4 + chewSquint, eyeRadius * 0.85, Math.PI + 0.25, -0.25)
      ctx.stroke()

    } else if (mood === 'full') {
      // Contented stuffed eyes: joyful curved smiling arcs ^ ^ with sweet sparkles
      ctx.strokeStyle = '#2B2129'
      ctx.lineWidth = 10
      ctx.lineCap = 'round'

      // Left eye: cheerful curve ^
      ctx.beginPath()
      ctx.arc(leftEyeX, eyeY + 4, eyeRadius * 0.88, Math.PI + 0.25, -0.25)
      ctx.stroke()

      // Right eye: cheerful curve ^
      ctx.beginPath()
      ctx.arc(rightEyeX, eyeY + 4, eyeRadius * 0.88, Math.PI + 0.25, -0.25)
      ctx.stroke()

      // Tiny happy sparkle near the right eye
      ctx.fillStyle = '#FFD166'
      ctx.beginPath()
      ctx.arc(rightEyeX + 22, eyeY - 8, 4, 0, Math.PI * 2)
      ctx.fill()
    } else if (mood === 'washing') {
      // Blissful bath eyes: joyful curved smiling eyes ^ ^ with pure relaxation
      ctx.strokeStyle = '#2B2129'
      ctx.lineWidth = 10
      ctx.lineCap = 'round'

      // Left eye: cheerful curve ^
      ctx.beginPath()
      ctx.arc(leftEyeX, eyeY + 4, eyeRadius * 0.85, Math.PI + 0.25, -0.25)
      ctx.stroke()

      // Right eye: cheerful curve ^
      ctx.beginPath()
      ctx.arc(rightEyeX, eyeY + 4, eyeRadius * 0.85, Math.PI + 0.25, -0.25)
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
    } else if (mood === 'dirty') {
      // Troubled unkempt eyes with slight inner brow furrow and sweat drop
      ;[leftEyeX, rightEyeX].forEach((ex) => {
        ctx.fillStyle = '#231B26'
        ctx.beginPath()
        ctx.ellipse(ex + pupilOffsetX * 0.4, eyeY + pupilOffsetY * 0.4, eyeRadius * 0.95, eyeRadius * 0.95, 0, 0, Math.PI * 2)
        ctx.fill()

        // Highlight
        ctx.fillStyle = '#FFFFFF'
        ctx.beginPath()
        ctx.arc(ex + pupilOffsetX - 7, eyeY + pupilOffsetY - 7, eyeRadius * 0.3, 0, Math.PI * 2)
        ctx.fill()
      })

      // Little cute troubled inner brow twitches \ /
      ctx.strokeStyle = '#2B2129'
      ctx.lineWidth = 5
      ctx.lineCap = 'round'
      ctx.beginPath()
      ctx.moveTo(leftEyeX - 16, eyeY - 26)
      ctx.lineTo(leftEyeX + 10, eyeY - 22)
      ctx.stroke()

      ctx.beginPath()
      ctx.moveTo(rightEyeX + 16, eyeY - 26)
      ctx.lineTo(rightEyeX - 10, eyeY - 22)
      ctx.stroke()

      // Comical blue sweat-drop near left temple
      ctx.fillStyle = '#48CAE4'
      ctx.beginPath()
      ctx.moveTo(leftEyeX - 38, eyeY - 14)
      ctx.quadraticCurveTo(leftEyeX - 44, eyeY - 2, leftEyeX - 38, eyeY + 4)
      ctx.arc(leftEyeX - 34, eyeY + 4, 5, Math.PI * 0.8, 0.2)
      ctx.closePath()
      ctx.fill()
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
      // Adorable, clean, wholesome closed-mouth nibble!
      // Gentle cheerful :3 cat mouth that softly wiggles with joyful chewing
      const nibbleWiggle = Math.sin(this.chewState * 1.6) * 1.8
      const curveR = 13

      ctx.strokeStyle = '#2B2129'
      ctx.lineWidth = 8
      ctx.lineCap = 'round'

      // Left cute smile arc
      ctx.beginPath()
      ctx.arc(mouthX - curveR + 1, mouthY - 3 + nibbleWiggle, curveR, 0.2, Math.PI * 0.85)
      ctx.stroke()

      // Right cute smile arc
      ctx.beginPath()
      ctx.arc(mouthX + curveR - 1, mouthY - 3 - nibbleWiggle, curveR, 0.15, Math.PI * 0.8)
      ctx.stroke()
    } else if (mood === 'washing') {
      // Sweet contented cat smile with an adorable floating bath soap bubble near the cheek
      const curveR = 14
      ctx.beginPath()
      ctx.arc(mouthX - curveR, mouthY - 4, curveR, 0.2, Math.PI * 0.85)
      ctx.stroke()

      ctx.beginPath()
      ctx.arc(mouthX + curveR, mouthY - 4, curveR, 0.15, Math.PI * 0.8)
      ctx.stroke()

      // Cute iridescent soap bubble near the cheek
      ctx.fillStyle = 'rgba(112, 214, 255, 0.75)'
      ctx.beginPath()
      ctx.arc(mouthX + 34, mouthY - 14, 9, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#FFFFFF'
      ctx.beginPath()
      ctx.arc(mouthX + 31, mouthY - 17, 3, 0, Math.PI * 2)
      ctx.fill()
    } else if (mood === 'full') {
      // Contented stuffed cat smile :3
      const curveR = 13
      ctx.strokeStyle = '#2B2129'
      ctx.lineWidth = 8
      ctx.lineCap = 'round'

      // Left cute smile arc
      ctx.beginPath()
      ctx.arc(mouthX - curveR + 1, mouthY - 3, curveR, 0.2, Math.PI * 0.85)
      ctx.stroke()

      // Right cute smile arc
      ctx.beginPath()
      ctx.arc(mouthX + curveR - 1, mouthY - 3, curveR, 0.15, Math.PI * 0.8)
      ctx.stroke()
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
    } else if (mood === 'dirty' || (cleanliness < 25 && mood === 'idle')) {
      // Adorable comical grimy squiggly mouth / pout ~
      ctx.strokeStyle = '#2B2129'
      ctx.lineWidth = 8
      ctx.lineCap = 'round'
      ctx.beginPath()
      ctx.moveTo(mouthX - 18, mouthY + 2)
      ctx.quadraticCurveTo(mouthX - 9, mouthY - 6, mouthX, mouthY + 1)
      ctx.quadraticCurveTo(mouthX + 9, mouthY + 8, mouthX + 18, mouthY + 2)
      ctx.stroke()
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
