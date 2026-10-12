import { expect, test } from 'claude-code/testing'

import { FRAMES, PALETTE, SMALL_FRAMES, compose } from './frames'
import { JUTSUS, castFrames, type Jutsu } from './jutsus'

const FULL_ROWS = 22
const SMALL_ROWS = 8
const NARROW = 1
const WIDE = 500

const byId = (id: string): Jutsu => {
  const found = JUTSUS.find(j => j.id === id)
  if (!found) throw new Error(`missing jutsu ${id}`)
  return found
}

// Every size variant of a jutsu: the widest first, then the narrower fallbacks.
const variants = (j: Jutsu) => [{ full: j.full, small: j.small }, ...(j.narrower ?? [])]

const countOf = (frame: readonly string[], key: string) =>
  frame.join('').split(key).length - 1

test('compose stamps parts over a transparent canvas, clipping and erasing', async () => {
  const out = compose(4, 2, [
    { x: 0, y: 0, art: ['YYY', 'YYY'] },
    { x: 1, y: 0, art: ['B.', ' B'] },
    { x: 3, y: 1, art: ['KK', 'KK'] },
  ])
  expect(out).toEqual(['YBY.', 'Y.BK'])
})

test('walk frames use only palette keys and keep the 22-row band height', async () => {
  for (const sprite of FRAMES) expect(sprite.length).toBe(FULL_ROWS)
  for (const sprite of SMALL_FRAMES) expect(sprite.length).toBe(SMALL_ROWS)
})

test('five jutsus, each with an id, a spinner name and matching full/small cast lengths', async () => {
  expect(JUTSUS.map(j => j.id)).toEqual(['rasengan', 'kage-bunshin', 'rasenshuriken', 'sage-mode', 'sexy'])
  expect(JUTSUS.map(j => j.name)).toEqual([
    'Rasengan',
    'Kage Bunshin no Jutsu',
    'Rasenshuriken',
    'Sage Mode',
    'Sexy no Jutsu',
  ])
  for (const j of JUTSUS) {
    for (const v of variants(j)) {
      expect(v.full.length).toBe(j.full.length)
      expect(v.small.length).toBe(j.full.length)
    }
    expect(j.full.length).toBeGreaterThanOrEqual(4)
  }
})

test('every cast frame is a rectangle of palette keys with the band height', async () => {
  for (const j of JUTSUS) {
    for (const v of variants(j)) {
      for (const frame of v.full) {
        expect(frame.length).toBe(FULL_ROWS)
        expect(new Set(frame.map(row => row.length)).size).toBe(1)
        expect(frame[0]?.length).toBeGreaterThanOrEqual(16)
        for (const key of frame.join('')) {
          if (key !== '.') expect(PALETTE[key]).toBeDefined()
        }
      }
      for (const frame of v.small) {
        expect(frame.length).toBe(SMALL_ROWS)
        expect(new Set(frame.map(row => row.length)).size).toBe(1)
        expect(frame[0]?.length).toBeGreaterThanOrEqual(8)
        expect(frame[0]?.length).toBeLessThanOrEqual(12)
        for (const key of frame.join('')) {
          if (key !== '.') expect(PALETTE[key]).toBeDefined()
        }
      }
    }
  }
})

test('each cast really animates: consecutive frames differ', async () => {
  for (const j of JUTSUS) {
    expect(new Set(j.full.map(f => f.join('\n'))).size).toBeGreaterThanOrEqual(4)
    expect(new Set(j.small.map(f => f.join('\n'))).size).toBeGreaterThanOrEqual(3)
  }
})

test('rasengan grows a blue sphere; rasenshuriken adds white blades', async () => {
  const ras = byId('rasengan').full
  expect(countOf(ras[0] ?? [], 'L')).toBe(0)
  expect(countOf(ras[ras.length - 1] ?? [], 'L')).toBeGreaterThan(2)
  expect(countOf(ras[ras.length - 1] ?? [], 'P')).toBeGreaterThan(10)
  const shu = byId('rasenshuriken').full
  const zipper = countOf(FRAMES[0] ?? [], 'W')
  const effect = (f: readonly string[]) =>
    ['P', 'A', 'L', 'W'].reduce((sum, key) => sum + countOf(f, key), 0) - zipper
  // Bigger than the rasengan, with white blades well beyond the zipper's white.
  expect(shu.some(f => effect(f) > effect(ras[ras.length - 1] ?? []))).toBe(true)
  expect(shu.some(f => countOf(f, 'W') > zipper + 6)).toBe(true)
})

test('sage mode turns the eyes yellow with orange markings', async () => {
  const sage = byId('sage-mode')
  const last = sage.full[sage.full.length - 1] ?? []
  expect(countOf(last, 'V')).toBeGreaterThanOrEqual(2)
  expect(countOf(last, 'R')).toBeGreaterThanOrEqual(4)
  expect(countOf(sage.full[0] ?? [], 'V')).toBe(0)
  expect(sage.small.some(f => countOf(f, 'V') >= 2)).toBe(true)
})

test('sexy no jutsu is only a smoke puff: nothing but body and smoke colours', async () => {
  const sexy = byId('sexy')
  const allowed = new Set([...'.KYBMSkEODW', 'G', 'g'])
  for (const frame of [...sexy.full, ...sexy.small]) {
    for (const key of frame.join('')) expect(allowed.has(key)).toBe(true)
  }
  const covered = sexy.full.some(f => countOf(f, 'M') === 0)
  expect(covered).toBe(true)
  expect(countOf(sexy.full[sexy.full.length - 1] ?? [], 'M')).toBe(5)
})

const narutos = (frame: readonly string[]) => countOf(frame, 'M') / 5

test('kage bunshin ends with three narutos and drops clones to fit narrow bodies', async () => {
  const kage = byId('kage-bunshin')
  const last = (columns: number) => {
    const frames = castFrames(kage, false, columns)
    return frames[frames.length - 1] ?? []
  }
  expect(narutos(last(WIDE))).toBe(3)
  const threeWide = last(WIDE)[0]?.length ?? 0
  expect(narutos(last(threeWide - 1))).toBe(2)
  const twoWide = last(threeWide - 1)[0]?.length ?? 0
  expect(narutos(last(twoWide - 1))).toBe(1)
  expect(twoWide).toBeLessThan(threeWide)
  // Hopelessly narrow: still the narrowest variant, never a crash.
  expect(narutos(last(NARROW))).toBe(1)
})

test('castFrames keeps the full cast length at every width and size', async () => {
  for (const j of JUTSUS) {
    for (const columns of [NARROW, 20, 40, WIDE]) {
      expect(castFrames(j, false, columns).length).toBe(j.full.length)
      expect(castFrames(j, true, columns).length).toBe(j.full.length)
    }
  }
})
