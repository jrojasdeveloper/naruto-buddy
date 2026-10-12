// The jutsus Naruto performs between walks. Every cast frame is composed from
// the same body grids as the walk, so the art stays consistent; the effects
// sit beside him (frames may be wider than the walk frames).
import {
  BALL_REF,
  EYES_OPEN,
  EYES_SHUT,
  LEFT_ARM,
  PASSING,
  RAISED_ARM,
  ROWS,
  SMALL_EYES_SHUT,
  SMALL_PASSING,
  SMALL_ROWS,
  SMALL_STAND,
  SMALL_WIDTH,
  STRIDE_LEFT,
  WIDTH,
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

const STAND = body(EYES_OPEN, PASSING)
// Standing with his right arm free: the raised arm is stamped on top.
const ONE_ARM = body(EYES_OPEN, PASSING, [LEFT_ARM])

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

// The raised arm and the sphere are transcribed from the reference (mirrored
// to his right). Growing spheres rest on the raised hand, like the reference
// sphere: centred on x = HAND_X and ending on row HAND_BOTTOM.
const HAND_X = 21
const HAND_BOTTOM = 20
const RASENGAN_WIDTH = 24

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

const rasengan = (ball?: Pixels | Part): Pixels => {
  const effect: Part[] = !ball
    ? []
    : 'art' in ball
      ? [ball]
      : [{ x: HAND_X - ball.length / 2, y: HAND_BOTTOM - ball.length, art: ball }]
  return compose(RASENGAN_WIDTH, ROWS, [{ x: 0, y: 0, art: ONE_ARM }, RAISED_ARM, ...effect])
}

// The reference sphere with its light core turning around the ring.
const REF_CORES = [
  [2, 2],
  [2, 3],
  [3, 3],
  [3, 2],
]
const turnedBall = (turn: number): Part => {
  const [row = 2, col = 2] = REF_CORES[turn % REF_CORES.length] ?? []
  return {
    ...BALL_REF,
    art: BALL_REF.art.map((line, y) =>
      y === row ? `${line.slice(0, col)}L${line.slice(col + 1)}` : line,
    ),
  }
}

const RASENGAN_FULL: readonly Pixels[] = [
  rasengan(),
  rasengan(BALL_2),
  rasengan(BALL_4),
  rasengan(BALL_6),
  ...[0, 1, 2, 3].map(turn => rasengan(turnedBall(turn))),
]

// Small raised hand: one skin pixel past the jacket, the sphere right above.
const SMALL_HAND: Part = { x: 9, y: 6, art: ['SSK'] }
const SMALL_BALL_X = 10
const SMALL_CAST_WIDTH = 14

const rasenganSmall = (ball?: Pixels): Pixels =>
  compose(SMALL_CAST_WIDTH, SMALL_ROWS, [
    { x: 0, y: 0, art: SMALL_STAND },
    SMALL_HAND,
    ...(ball ? [{ x: SMALL_BALL_X, y: 6 - ball.length, art: ball }] : []),
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

const CLONE_STEP = WIDTH

// `clones` extra Narutos to his right; with none, only the puff beside him.
const kageBunshin = (clones: number): CastSet => {
  const slots = Array.from({ length: clones }, (_, i) => CLONE_STEP * (i + 1))
  const width = clones > 0 ? CLONE_STEP * clones + WIDTH : 28
  const areaX = CLONE_STEP
  const areaW = width - areaX
  const hero: Part = { x: 0, y: 0, art: STAND }
  const crowd = (legs: Pixels): Part[] => slots.map(x => ({ x, y: 0, art: body(EYES_OPEN, legs) }))
  const wisps = (phase: number): Part[] =>
    (clones > 0 ? slots.map(x => x + 7) : [areaX + 1]).map(x => ({ x, y: ROWS - 5, art: cloud(8, 5, phase) }))
  const mass = (phase: number, thin?: number): Part => ({
    x: areaX,
    y: 1,
    art: thin === undefined ? cloud(areaW, ROWS - 1, phase) : fade(cloud(areaW, ROWS - 1, phase), thin),
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
    puff(3, 3, 10, 7),
    puff(4, 5, 10, 5),
    puff(4, 8, 10, 2),
    puff(4, 8, 10, 2, 0),
    puff(3, 3, 11, 7),
  ].map(parts => compose(SMALL_CAST_WIDTH, SMALL_ROWS, parts))

  return { full, small: tiny }
}

// ---- Rasenshuriken: a bigger sphere with white blades, above his raised hand.

// The blades sit above the raised hand, clear of his hair.
const SHURIKEN_X = 20
const SHURIKEN_TOP = 8
const SHURIKEN_WIDTH = 32

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
    { x: 0, y: 0, art: ONE_ARM },
    RAISED_ARM,
    ...(blades ? [{ x: SHURIKEN_X, y: SHURIKEN_TOP, art: blades }] : []),
    ...(core ? [{ x: SHURIKEN_X + offset, y: SHURIKEN_TOP + offset, art: core }] : []),
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

const shurikenSmall = (ball?: Pixels): Pixels =>
  compose(SMALL_CAST_WIDTH, SMALL_ROWS, [
    { x: 0, y: 0, art: SMALL_STAND },
    SMALL_HAND,
    ...(ball ? [{ x: SMALL_BALL_X, y: 6 - ball.length, art: ball }] : []),
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

// Markings frame each blue eye (x 7 and 13, rows 14-15) around yellow pupils.
const SAGE_EYES: Part[] = [
  { x: 6, y: 13, art: ['RRR', 'RVR', 'RVR', 'RRR'] },
  { x: 12, y: 13, art: ['RRR', 'RVR', 'RVR', 'RRR'] },
]

const SAGE_WIDTH = 23

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

const SPARKS_A: readonly Spark[] = [[10, 1], [11, 4], [10, 7]]
const SPARKS_B: readonly Spark[] = [[11, 2], [10, 5], [11, 8]]

const SMALL_SAGE_WIDTH = 12
const SMALL_EYES_SAGE = 'KRVVSSVVRK'

const sageSmall = (awake: boolean, sparks: readonly Spark[]): Pixels =>
  compose(SMALL_SAGE_WIDTH, SMALL_ROWS, [
    { x: 0, y: 0, art: small(awake ? SMALL_EYES_SAGE : SMALL_EYES_SHUT, SMALL_PASSING) },
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

const SEXY_WIDTH = 24

const sexy = (parts: readonly Part[]): Pixels => compose(SEXY_WIDTH, ROWS, parts)

const SEXY_FULL: readonly Pixels[] = [
  sexy([{ x: 0, y: 0, art: STAND }, { x: 4, y: ROWS - 7, art: cloud(14, 7) }]),
  sexy([{ x: 0, y: 0, art: STAND }, { x: 1, y: 11, art: cloud(22, 23, 1) }]),
  sexy([{ x: 0, y: 0, art: cloud(SEXY_WIDTH, ROWS) }]),
  sexy([{ x: 0, y: 0, art: cloud(SEXY_WIDTH, ROWS, 1) }]),
  sexy([{ x: 0, y: 0, art: STAND }, { x: 0, y: 0, art: fade(cloud(SEXY_WIDTH, ROWS, 2), 0) }]),
  sexy([
    { x: 0, y: 0, art: STAND },
    { x: 0, y: ROWS - 6, art: cloud(6, 6, 1) },
    { x: 15, y: ROWS - 7, art: cloud(7, 7, 2) },
  ]),
]

const sexySmall = (parts: readonly Part[]): Pixels => compose(SMALL_WIDTH, SMALL_ROWS, parts)

const SEXY_SMALL: readonly Pixels[] = [
  sexySmall([{ x: 0, y: 0, art: SMALL_STAND }, { x: 1, y: 7, art: cloud(8, 3) }]),
  sexySmall([{ x: 0, y: 0, art: SMALL_STAND }, { x: 0, y: 4, art: cloud(10, 6, 1) }]),
  sexySmall([{ x: 0, y: 0, art: cloud(SMALL_WIDTH, SMALL_ROWS) }]),
  sexySmall([{ x: 0, y: 0, art: cloud(SMALL_WIDTH, SMALL_ROWS, 1) }]),
  sexySmall([{ x: 0, y: 0, art: SMALL_STAND }, { x: 0, y: 0, art: fade(cloud(SMALL_WIDTH, SMALL_ROWS, 2), 0) }]),
  sexySmall([{ x: 0, y: 0, art: SMALL_STAND }, { x: 7, y: 7, art: cloud(3, 3) }]),
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
