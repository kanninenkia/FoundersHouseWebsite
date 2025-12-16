/**
 * Perlin Noise Generator
 * Generates a 512x512 Perlin noise texture for organic reveal animations
 * Based on the Chartogne-Taillet implementation
 */

export class PerlinNoiseGenerator {
  private permutation: number[] = []
  private size: number

  constructor(size: number = 512) {
    this.size = size
    this.initPermutation()
  }

  private initPermutation(): void {
    // Initialize permutation table
    const p: number[] = []
    for (let i = 0; i < 256; i++) {
      p[i] = Math.floor(Math.random() * 256)
    }

    // Duplicate to avoid buffer overflow
    for (let i = 0; i < 512; i++) {
      this.permutation[i] = p[i & 255]
    }
  }

  private fade(t: number): number {
    return t * t * t * (t * (t * 6 - 15) + 10)
  }

  private lerp(t: number, a: number, b: number): number {
    return a + t * (b - a)
  }

  private grad(hash: number, x: number, y: number): number {
    const h = hash & 3
    const u = h < 2 ? x : y
    const v = h < 2 ? y : x
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v)
  }

  private noise(x: number, y: number): number {
    // Find unit square that contains point
    const X = Math.floor(x) & 255
    const Y = Math.floor(y) & 255

    // Find relative x, y in square
    x -= Math.floor(x)
    y -= Math.floor(y)

    // Compute fade curves
    const u = this.fade(x)
    const v = this.fade(y)

    // Hash coordinates of square corners
    const a = this.permutation[X] + Y
    const aa = this.permutation[a]
    const ab = this.permutation[a + 1]
    const b = this.permutation[X + 1] + Y
    const ba = this.permutation[b]
    const bb = this.permutation[b + 1]

    // Blend results from corners
    return this.lerp(
      v,
      this.lerp(u, this.grad(this.permutation[aa], x, y), this.grad(this.permutation[ba], x - 1, y)),
      this.lerp(u, this.grad(this.permutation[ab], x, y - 1), this.grad(this.permutation[bb], x - 1, y - 1))
    )
  }

  /**
   * Generate Perlin noise texture data
   * Returns Uint8Array suitable for THREE.DataTexture
   */
  public generate(): Uint8Array {
    const data = new Uint8Array(this.size * this.size)
    const scale = 8.0 // Frequency of noise

    for (let y = 0; y < this.size; y++) {
      for (let x = 0; x < this.size; x++) {
        // Multi-octave noise for more detail
        let value = 0
        let amplitude = 1
        let frequency = 1
        let maxValue = 0

        // 4 octaves
        for (let octave = 0; octave < 4; octave++) {
          const sampleX = (x / this.size) * scale * frequency
          const sampleY = (y / this.size) * scale * frequency

          value += this.noise(sampleX, sampleY) * amplitude

          maxValue += amplitude
          amplitude *= 0.5
          frequency *= 2
        }

        // Normalize to 0-255
        value = value / maxValue
        value = (value + 1) * 0.5 // Convert from [-1, 1] to [0, 1]
        value = Math.max(0, Math.min(1, value)) // Clamp

        const index = y * this.size + x
        data[index] = Math.floor(value * 255)
      }
    }

    return data
  }
}
