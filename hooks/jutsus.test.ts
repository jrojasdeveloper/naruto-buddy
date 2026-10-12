import { expect, test } from 'claude-code/testing'

import { FRAMES, PALETTE, SMALL_FRAMES, compose } from './frames'
import { JUTSUS, castFrames, type Jutsu } from './jutsus'

const FULL_ROWS = 34
const SMALL_ROWS = 10
const FULL_WIDTH = 21
const SMALL_WIDTH = 10
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

// Light plate pixels in one Naruto: how many bodies a frame holds.
const PLATE = countOf(FRAMES[0] ?? [], 'M')

test('compose stamps parts over a transparent canvas, clipping and erasing', async () => {
  const out = compose(4, 2, [
    { x: 0, y: 0, art: ['YYY', 'YYY'] },
    { x: 1, y: 0, art: ['B.', ' B'] },
    { x: 3, y: 1, art: ['KK', 'KK'] },
  ])
  expect(out).toEqual(['YBY.', 'Y.BK'])
})

test('walk frames keep the 34-row and 10-row band heights at the chibi widths', async () => {
  expect(FRAMES.length).toBe(4)
  expect(SMALL_FRAMES.length).toBe(4)
  for (const sprite of FRAMES) {
    expect(sprite.length).toBe(FULL_ROWS)
    for (const row of sprite) expect(row.length).toBe(FULL_WIDTH)
  }
  for (const sprite of SMALL_FRAMES) {
    expect(sprite.length).toBe(SMALL_ROWS)
    for (const row of sprite) expect(row.length).toBe(SMALL_WIDTH)
  }
})

test('the base body is the programmatic transcription of the reference image', async () => {
  // Cell counts of the standing frame, read off the graph-paper reference.
  const stand = FRAMES[1] ?? []
  const counts: Record<string, number> = {
    Y: 47, // bright hair
    H: 48, // shaded hair
    M: 11, // plate and zipper, light
    N: 11, // plate and zipper, shaded
    W: 6, // plate shine and shorts stripe
    E: 4, // two blue eyes, two cells tall
    C: 4, // blush
    O: 24, // jacket and shorts panels
    F: 21, // orange shade
  }
  for (const [key, count] of Object.entries(counts)) expect(countOf(stand, key)).toBe(count)
  // Spiky hair above the headband, a black headband and a plate below the hair.
  expect(stand[0]).toMatch(/^\.+K\.+$/)
  const plate = stand.findIndex(row => row.includes('M'))
  expect(plate).toBeGreaterThanOrEqual(8)
  for (const row of stand.slice(0, plate)) expect(row).toMatch(/[YH]|K/)
  // Eyes sit symmetrically about the zipper column.
  const eyeRow = stand.findIndex(row => row.includes('E'))
  const eyes = [...(stand[eyeRow] ?? '')].flatMap((k, x) => (k === 'E' ? [x] : []))
  expect(eyes.length).toBe(2)
  expect((eyes[0] ?? 0) + (eyes[1] ?? 0)).toBe(FULL_WIDTH - 1)
})

test('the walk really moves: legs and arms change between frames, one frame blinks', async () => {
  expect(new Set(FRAMES.map(f => f.join('\n'))).size).toBe(3)
  expect(new Set(SMALL_FRAMES.map(f => f.join('\n'))).size).toBe(3)
  const eyes = FRAMES.map(f => countOf(f, 'E'))
  expect(Math.min(...eyes)).toBeLessThan(Math.max(...eyes))
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
        expect(frame[0]?.length).toBeLessThanOrEqual(14)
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
  const eyes = countOf(FRAMES[0] ?? [], 'E')
  const ras = byId('rasengan').full
  expect(countOf(ras[0] ?? [], 'A')).toBe(0)
  expect(countOf(ras[0] ?? [], 'E')).toBe(eyes)
  const last = ras[ras.length - 1] ?? []
  // The reference sphere: a blue ring around a light core.
  expect(countOf(last, 'A')).toBeGreaterThanOrEqual(3)
  expect(countOf(last, 'E')).toBeGreaterThanOrEqual(eyes + 8)
  const shu = byId('rasenshuriken').full
  const bodyWhite = countOf(FRAMES[0] ?? [], 'W') // plate shine and shorts stripe
  const effect = (f: readonly string[]) =>
    ['P', 'A', 'L', 'W'].reduce((sum, key) => sum + countOf(f, key), 0) - bodyWhite
  // Bigger than the rasengan, with white blades well beyond the body's white.
  expect(shu.some(f => effect(f) > effect(last))).toBe(true)
  expect(shu.some(f => countOf(f, 'W') > bodyWhite + 6)).toBe(true)
})

// The cast frames of one jutsu that show blades: more white than the body has.
const charged = (id: string) => {
  const white = countOf(FRAMES[0] ?? [], 'W')
  return byId(id).full.filter(f => countOf(f, 'W') > white)
}

const whitePixels = (frame: readonly string[]) =>
  frame.flatMap((row, y) => [...row].flatMap((k, x) => (k === 'W' && x >= FULL_WIDTH - 5 ? [`${x},${y}`] : [])))

test('rasenshuriken: the sphere sits right on the raised hand, no gap', async () => {
  const frames = byId('rasenshuriken').full
  const frame = frames[frames.length - 1] ?? []
  const beyond = frame.map(row => row.slice(FULL_WIDTH - 2))
  const handTop = beyond.findIndex(row => row.includes('S'))
  const sphere = beyond.flatMap((row, y) => (/[PAL]/.test(row) ? [y] : []))
  expect(handTop).toBeGreaterThanOrEqual(18)
  expect(Math.max(...sphere)).toBeGreaterThanOrEqual(handTop - 2)
  expect(Math.max(...sphere)).toBeLessThanOrEqual(handTop)
})

test('rasenshuriken: blades touch the sphere in every charged frame and turn between frames', async () => {
  const frames = charged('rasenshuriken')
  expect(frames.length).toBeGreaterThanOrEqual(3)
  for (const frame of frames) {
    // A blade pixel (white) right next to the blue sphere.
    const touching = frame.some((row, y) =>
      [...row].some(
        (k, x) =>
          k === 'W' &&
          x >= FULL_WIDTH - 5 &&
          [frame[y - 1]?.[x], frame[y + 1]?.[x], row[x - 1], row[x + 1]].some(n => n !== undefined && /[PAL]/.test(n)),
      ),
    )
    expect(touching).toBe(true)
    // Blades are outlined in black so they read against a light background.
    expect(countOf(frame, 'K')).toBeGreaterThan(countOf(FRAMES[0] ?? [], 'K'))
  }
  const shapes = frames.map(f => whitePixels(f).join(';'))
  expect(new Set(shapes).size).toBeGreaterThanOrEqual(2)
  for (let i = 1; i < shapes.length; i++) expect(shapes[i]).not.toBe(shapes[i - 1])
})

test('the raised arm is bent from the shoulder: the hand sits beside the chest with the sphere above it', async () => {
  for (const id of ['rasengan', 'rasenshuriken']) {
    const frame = byId(id).full[byId(id).full.length - 1] ?? []
    // Skin beyond the body is the raised hand, at chin-to-chest height.
    const handRows = frame.flatMap((row, y) => (row.slice(FULL_WIDTH - 1).includes('S') ? [y] : []))
    expect(handRows.length).toBeGreaterThan(0)
    const hand = Math.min(...handRows)
    expect(hand).toBeGreaterThanOrEqual(18)
    expect(hand).toBeLessThanOrEqual(24)
    // The sphere (blue or white) sits above the hand.
    const sphere = frame.findIndex((row, y) => y < hand && /[AELPW]/.test(row.slice(FULL_WIDTH - 1)))
    expect(sphere).toBeGreaterThanOrEqual(0)
  }
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
  const allowed = new Set([...'.KYHMNSsCEOFW', 'G', 'g'])
  for (const frame of [...sexy.full, ...sexy.small]) {
    for (const key of frame.join('')) expect(allowed.has(key)).toBe(true)
  }
  const covered = sexy.full.some(f => countOf(f, 'M') === 0)
  expect(covered).toBe(true)
  expect(countOf(sexy.full[sexy.full.length - 1] ?? [], 'M')).toBe(PLATE)
})

const narutos = (frame: readonly string[]) => countOf(frame, 'M') / PLATE

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
