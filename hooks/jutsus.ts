// The jutsus Naruto performs between walks. Every cast frame is composed from
// the same body grids as the walk, so the art stays consistent; the effects
// sit beside him (frames may be wider than the walk frames).
import {
  EYES_OPEN,
  EYES_SHUT,
  PASSING,
  SMALL_STAND,
  STRIDE_LEFT,
  body,
  compose,
  small,
  type Part,
  type Pixels,
} from './frames'

export type CastSet = { full: readonly Pixels[]; small: readonly Pixels[] }

export type Jutsu = CastSet & {
  id: string
  // The spinner word, so the label always names the animated jutsu.
  name: string
  // Same cast with fewer effects, widest first, for narrow bodies.
  narrower?: readonly CastSet[]
}

const ROWS = 22
const SMALL_ROWS = 8
const STAND = body(EYES_OPEN, PASSING)

const at = (art: Pixels, y: number): string => art[y] ?? ''

// Clockwise quarter turn of a square grid: how spheres and swirls spin.
const rot = (art: Pixels): Pixels =>
  art.map((_, y) =>
    art
      .map(row => row[y] ?? '.')
      .reverse()
      .join(''),
  )

const spin = (art: Pixels, turns: number): Pixels =>
  Array.from({ length: turns }).reduce<Pixels>(rot, art)

// Checkerboard holes, so a smoke puff thins out and shows what is behind it.
const fade = (art: Pixels, parity: number): Pixels =>
  art.map((row, y) => [...row].map((key, x) => ((x + y) % 2 === parity ? '.' : key)).join(''))

// Pixels next to the art on its four sides, in one key: an outline flash.
const glow = (art: Pixels, key: string): Pixels =>
  art.map((row, y) =>
    [...row]
      .map((px, x) => {
        if (px !== '.') return px
        const next = [at(art, y - 1)[x], at(art, y + 1)[x], row[x - 1], row[x + 1]]
        return next.some(n => n !== undefined && n !== '.') ? key : '.'
      })
      .join(''),
  )

// Lumpy smoke: a row of tall ellipses, white on the lit edge, grey on the
// lower-right one. `phase` varies the lumps between frames.
const cloud = (width: number, height: number, phase = 0): Pixels => {
  const count = Math.max(1, Math.round(width / 8))
  const lumps = Array.from({ length: count }, (_, i) => {
    const k = (i + phase) % 3
    const rx = Math.max(1.5, (width / count) * [0.72, 0.62, 0.78][k]!)
    const ry = (height / 2) * [0.92, 0.78, 0.86][k]!
    const cy = height / 2 + [0, 1, -1][k]! * (height / 8)
    return { cx: ((i + 0.5) * width) / count, cy, rx, ry }
  })
  const inside = (x: number, y: number) =>
    lumps.some(l => ((x + 0.5 - l.cx) / l.rx) ** 2 + ((y + 0.5 - l.cy) / l.ry) ** 2 <= 1)
  return Array.from({ length: height }, (_, y) =>
    Array.from({ length: width }, (_, x) => {
      if (!inside(x, y)) return '.'
      if (!inside(x, y + 1) || !inside(x + 1, y)) return 'g'
      if (!inside(x, y - 1) || !inside(x - 1, y)) return 'W'
      return 'G'
    }).join(''),
  )
}

// ---- Rasengan: a blue sphere grows in his outstretched hand and spins.

const REACH: Part = { x: 13, y: 14, art: ['OOOSS', 'OOOSS', ' '] }
const SPHERE_X = 18
const RASENGAN_WIDTH = 26

const BALL_2: Pixels = ['LL', 'LL']
const BALL_4: Pixels = ['.PP.', 'PLAP', 'PALP', '.PP.']
const BALL_6: Pixels = ['.PPPP.', 'PAAAAP', 'PALLAP', 'PALAAP', 'PAAAAP', '.PPPP.']
const BALL_8: Pixels = [
  '..PPPP..',
  '.PAAAAP.',
  'PAAAAAAP',
  'PAALLAAP',
  'PAALLAAP',
  'PALAAAAP',
  '.PLAAAP.',
  '..PPPP..',
]

const rasengan = (ball?: Pixels): Pixels =>
  compose(RASENGAN_WIDTH, ROWS, [
    { x: 0, y: 0, art: STAND },
    REACH,
    ...(ball ? [{ x: SPHERE_X, y: 15 - ball.length / 2, art: ball }] : []),
  ])

const RASENGAN_FULL: readonly Pixels[] = [
  rasengan(),
  rasengan(BALL_2),
  rasengan(BALL_4),
  rasengan(BALL_6),
  ...[0, 1, 2, 3].map(turns => rasengan(spin(BALL_8, turns))),
]

const SMALL_REACH: Part = { x: 8, y: 6, art: ['S'] }

const rasenganSmall = (ball?: Pixels): Pixels =>
  compose(12, SMALL_ROWS, [
    { x: 0, y: 0, art: SMALL_STAND },
    SMALL_REACH,
    ...(ball ? [{ x: 9, y: 6 - Math.floor(ball.length / 2), art: ball }] : []),
  ])

const RASENGAN_SMALL: readonly Pixels[] = [
  rasenganSmall(),
  rasenganSmall(['L']),
  rasenganSmall(['AL', 'LA']),
  rasenganSmall(['.A.', 'ALA', '.A.']),
  rasenganSmall(['.P.', 'PLP', '.P.']),
  rasenganSmall(['.L.', 'LAL', '.L.']),
  rasenganSmall(['.A.', 'ALA', '.A.']),
  rasenganSmall(['.P.', 'PLP', '.P.']),
]

// ---- Kage Bunshin no Jutsu: a smoke puff, then clones stand beside him.

const CLONE_STEP = 15

// `clones` extra Narutos to his right; with none, only the puff beside him.
const kageBunshin = (clones: number): CastSet => {
  const slots = Array.from({ length: clones }, (_, i) => CLONE_STEP * (i + 1))
  const width = clones > 0 ? CLONE_STEP * clones + 16 : 24
  const areaX = CLONE_STEP
  const areaW = width - areaX
  const hero: Part = { x: 0, y: 0, art: STAND }
  const crowd = (legs: Pixels): Part[] => slots.map(x => ({ x, y: 0, art: body(EYES_OPEN, legs) }))
  const wisps = (phase: number): Part[] =>
    (clones > 0 ? slots.map(x => x + 4) : [areaX + 1]).map(x => ({ x, y: 17, art: cloud(8, 5, phase) }))
  const mass = (phase: number, thin?: number): Part => ({
    x: areaX,
    y: 1,
    art: thin === undefined ? cloud(areaW, 21, phase) : fade(cloud(areaW, 21, phase), thin),
  })

  const full = [
    [hero, ...wisps(0)],
    [hero, mass(0)],
    [hero, ...crowd(STRIDE_LEFT), mass(1, 0)],
    [hero, ...crowd(STRIDE_LEFT), ...wisps(1)],
    [hero, ...crowd(PASSING)],
  ].map(parts => compose(width, ROWS, parts))

  const puff = (w: number, h: number, x: number, y: number, thin?: number): Part[] => [
    { x: 0, y: 0, art: SMALL_STAND },
    { x, y, art: thin === undefined ? cloud(w, h) : fade(cloud(w, h, 1), thin) },
  ]
  const tiny = [
    puff(3, 3, 8, 5),
    puff(4, 5, 8, 3),
    puff(4, 7, 8, 1),
    puff(4, 7, 8, 1, 0),
    puff(3, 2, 9, 6),
  ].map(parts => compose(12, SMALL_ROWS, parts))

  return { full, small: tiny }
}

// ---- Rasenshuriken: a bigger sphere with white blades, above his raised hand.

const RAISED: Part = {
  x: 13,
  y: 12,
  art: ['........SS', '........SS', 'OOOOOOOOOO', 'OOOOOOOOOO', ' .........'],
}
const SHURIKEN_X = 16
const SHURIKEN_WIDTH = 28

const PLUS_BLADES: Pixels = [
  '.....WW.....',
  '.....WW.....',
  '............',
  '............',
  '............',
  'WW........WW',
  'WW........WW',
  '............',
  '............',
  '............',
  '.....WW.....',
  '.....WW.....',
]

const X_BLADES: Pixels = [
  'WW........WW',
  'WW........WW',
  '..W......W..',
  '............',
  '............',
  '............',
  '............',
  '............',
  '............',
  '..W......W..',
  'WW........WW',
  'WW........WW',
]

const STAR_BLADES: Pixels = compose(12, 12, [
  { x: 0, y: 0, art: PLUS_BLADES },
  { x: 0, y: 0, art: X_BLADES },
])

const shuriken = (core?: Pixels, blades?: Pixels): Pixels => {
  const offset = core ? (12 - core.length) / 2 : 0
  return compose(SHURIKEN_WIDTH, ROWS, [
    { x: 0, y: 0, art: STAND },
    RAISED,
    ...(blades ? [{ x: SHURIKEN_X, y: 0, art: blades }] : []),
    ...(core ? [{ x: SHURIKEN_X + offset, y: offset, art: core }] : []),
  ])
}

const SHURIKEN_FULL: readonly Pixels[] = [
  shuriken(),
  shuriken(BALL_4),
  shuriken(spin(BALL_6, 1)),
  shuriken(spin(BALL_8, 0), PLUS_BLADES),
  shuriken(spin(BALL_8, 1), STAR_BLADES),
  shuriken(spin(BALL_8, 2), X_BLADES),
  shuriken(spin(BALL_8, 3), STAR_BLADES),
  shuriken(spin(BALL_8, 0), PLUS_BLADES),
]

const SMALL_RAISED: Part = { x: 7, y: 5, art: ['S', ' '] }

const shurikenSmall = (ball?: Pixels): Pixels =>
  compose(12, SMALL_ROWS, [
    { x: 0, y: 0, art: SMALL_STAND },
    SMALL_RAISED,
    ...(ball ? [{ x: 8, y: 0, art: ball }] : []),
  ])

const SHURIKEN_SMALL: readonly Pixels[] = [
  shurikenSmall(),
  shurikenSmall(['L']),
  shurikenSmall(['.PP.', 'PLAP', 'PALP', '.PP.']),
  shurikenSmall(['.WW.', 'WLAW', 'WALW', '.WW.']),
  shurikenSmall(['WWWW', 'WLAW', 'WALW', 'WWWW']),
  shurikenSmall(['W..W', '.LA.', '.AL.', 'W..W']),
  shurikenSmall(['WWWW', 'WLAW', 'WALW', 'WWWW']),
  shurikenSmall(['.WW.', 'WLAW', 'WALW', '.WW.']),
]

// ---- Sage Mode: yellow eyes with orange markings, and a glow flash.

const SAGE_EYES: Part[] = [
  { x: 3, y: 7, art: ['R'] },
  { x: 10, y: 7, art: ['R'] },
  { x: 2, y: 8, art: ['RVR'] },
  { x: 9, y: 8, art: ['RVR'] },
  { x: 3, y: 9, art: ['R'] },
  { x: 10, y: 9, art: ['R'] },
]

const SAGE_WIDTH = 17

const sage = (eyes: 'shut' | 'sage', aura: boolean): Pixels => {
  const art = compose(SAGE_WIDTH, ROWS, [
    { x: 0, y: 0, art: body(eyes === 'shut' ? EYES_SHUT : EYES_OPEN, PASSING) },
    ...(eyes === 'sage' ? SAGE_EYES : []),
  ])
  return aura ? glow(art, 'Q') : art
}

const SAGE_FULL: readonly Pixels[] = [
  sage('shut', false),
  sage('shut', true),
  sage('sage', true),
  sage('sage', false),
  sage('sage', true),
  sage('sage', false),
]

type Spark = readonly [number, number]

const SPARKS_A: readonly Spark[] = [[8, 1], [9, 4], [8, 6]]
const SPARKS_B: readonly Spark[] = [[9, 2], [8, 4], [9, 6]]

const sageSmall = (awake: boolean, sparks: readonly Spark[]): Pixels =>
  compose(10, SMALL_ROWS, [
    { x: 0, y: 0, art: awake ? small('.RVSSVR.', '..D..D..') : small('.SKSSKS.', '..D..D..') },
    ...sparks.map(([x, y]) => ({ x, y, art: ['Q'] })),
  ])

const SAGE_SMALL: readonly Pixels[] = [
  sageSmall(false, []),
  sageSmall(false, SPARKS_A),
  sageSmall(true, SPARKS_B),
  sageSmall(true, []),
  sageSmall(true, SPARKS_A),
  sageSmall(true, []),
]

// ---- Sexy no Jutsu: only a smoke puff that covers him, then clears.

const SEXY_WIDTH = 18

const sexy = (parts: readonly Part[]): Pixels => compose(SEXY_WIDTH, ROWS, parts)

const SEXY_FULL: readonly Pixels[] = [
  sexy([{ x: 0, y: 0, art: STAND }, { x: 3, y: 16, art: cloud(12, 6) }]),
  sexy([{ x: 0, y: 0, art: STAND }, { x: 1, y: 8, art: cloud(16, 14, 1) }]),
  sexy([{ x: 0, y: 0, art: cloud(SEXY_WIDTH, ROWS) }]),
  sexy([{ x: 0, y: 0, art: cloud(SEXY_WIDTH, ROWS, 1) }]),
  sexy([{ x: 0, y: 0, art: STAND }, { x: 0, y: 0, art: fade(cloud(SEXY_WIDTH, ROWS, 2), 0) }]),
  sexy([
    { x: 0, y: 0, art: STAND },
    { x: 0, y: 17, art: cloud(5, 5, 1) },
    { x: 12, y: 16, art: cloud(6, 6, 2) },
  ]),
]

const sexySmall = (parts: readonly Part[]): Pixels => compose(10, SMALL_ROWS, parts)

const SEXY_SMALL: readonly Pixels[] = [
  sexySmall([{ x: 0, y: 0, art: SMALL_STAND }, { x: 1, y: 5, art: cloud(7, 3) }]),
  sexySmall([{ x: 0, y: 0, art: SMALL_STAND }, { x: 0, y: 3, art: cloud(9, 5, 1) }]),
  sexySmall([{ x: 0, y: 0, art: cloud(10, SMALL_ROWS) }]),
  sexySmall([{ x: 0, y: 0, art: cloud(10, SMALL_ROWS, 1) }]),
  sexySmall([{ x: 0, y: 0, art: SMALL_STAND }, { x: 0, y: 0, art: fade(cloud(10, SMALL_ROWS, 2), 0) }]),
  sexySmall([{ x: 0, y: 0, art: SMALL_STAND }, { x: 7, y: 5, art: cloud(3, 3) }]),
]

const KAGE_BUNSHIN = [kageBunshin(2), kageBunshin(1), kageBunshin(0)] as const

export const JUTSUS: readonly [Jutsu, ...Jutsu[]] = [
  { id: 'rasengan', name: 'Rasengan', full: RASENGAN_FULL, small: RASENGAN_SMALL },
  {
    id: 'kage-bunshin',
    name: 'Kage Bunshin no Jutsu',
    ...KAGE_BUNSHIN[0],
    narrower: [KAGE_BUNSHIN[1], KAGE_BUNSHIN[2]],
  },
  { id: 'rasenshuriken', name: 'Rasenshuriken', full: SHURIKEN_FULL, small: SHURIKEN_SMALL },
  { id: 'sage-mode', name: 'Sage Mode', full: SAGE_FULL, small: SAGE_SMALL },
  { id: 'sexy', name: 'Sexy no Jutsu', full: SEXY_FULL, small: SEXY_SMALL },
]

const widthOf = (frames: readonly Pixels[]): number =>
  Math.max(...frames.map(frame => frame[0]?.length ?? 0))

// The cast frames for the widest variant that fits `columns`, else the
// narrowest one.
export const castFrames = (jutsu: Jutsu, isSmall: boolean, columns: number): readonly Pixels[] => {
  const variants: readonly CastSet[] = [jutsu, ...(jutsu.narrower ?? [])]
  const pick = isSmall ? 'small' : 'full'
  const fit = variants.find(v => widthOf(v[pick]) <= columns) ?? variants[variants.length - 1] ?? jutsu
  return fit[pick]
}
