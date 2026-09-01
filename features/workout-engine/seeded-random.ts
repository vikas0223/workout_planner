/**
 * Seeded Pseudo-Random Number Generator (Mulberry32)
 * Ensures deterministic, reproducible workout generation.
 */

export class SeededRandom {
  private state: number;

  constructor(seed?: number | string) {
    if (typeof seed === 'string') {
      let hash = 0;
      for (let i = 0; i < seed.length; i++) {
        hash = (hash << 5) - hash + seed.charCodeAt(i);
        hash |= 0;
      }
      this.state = hash >>> 0;
    } else if (typeof seed === 'number') {
      this.state = seed >>> 0;
    } else {
      this.state = 123456789;
    }
  }

  /**
   * Returns a pseudo-random float between 0 (inclusive) and 1 (exclusive)
   */
  public next(): number {
    let t = (this.state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /**
   * Returns a pseudo-random integer between min (inclusive) and max (inclusive)
   */
  public nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  /**
   * Shuffles an array in place deterministically using Fisher-Yates
   */
  public shuffle<T>(array: T[]): T[] {
    const copy = [...array];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  /**
   * Selects N random items from an array deterministically
   */
  public sample<T>(array: T[], count: number): T[] {
    return this.shuffle(array).slice(0, count);
  }
}
