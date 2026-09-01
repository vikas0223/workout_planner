import { describe, it, expect } from 'vitest';
import { SeededRandom } from '@/features/workout-engine/seeded-random';

describe('SeededRandom', () => {
  it('produces identical sequences given identical seeds', () => {
    const rng1 = new SeededRandom(12345);
    const rng2 = new SeededRandom(12345);

    for (let i = 0; i < 10; i++) {
      expect(rng1.next()).toBe(rng2.next());
    }
  });

  it('produces different sequences given different seeds', () => {
    const rng1 = new SeededRandom(111);
    const rng2 = new SeededRandom(999);

    const seq1 = Array.from({ length: 5 }, () => rng1.next());
    const seq2 = Array.from({ length: 5 }, () => rng2.next());

    expect(seq1).not.toEqual(seq2);
  });

  it('shuffles arrays deterministically', () => {
    const items = ['a', 'b', 'c', 'd', 'e', 'f', 'g'];
    const rng1 = new SeededRandom('test-seed');
    const rng2 = new SeededRandom('test-seed');

    const shuffled1 = rng1.shuffle(items);
    const shuffled2 = rng2.shuffle(items);

    expect(shuffled1).toEqual(shuffled2);
    expect(shuffled1.length).toBe(items.length);
  });
});
