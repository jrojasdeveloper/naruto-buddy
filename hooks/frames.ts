// Pixel-art Naruto sprites. Each string is one row of pixels and each
// character is a palette key ('.' is transparent). Two pixel rows are drawn
// per terminal row with half-block characters, so every sprite has an even
// number of rows and all rows in a sprite share the same width.
//
// The full-size body is a transcription of a graph-paper pixel-art Naruto:
// the reference image was sampled cell by cell (see the notes on each piece)
// and only the raised arm was swapped for an arm down for walking.

export type Pixels = readonly string[]

export const PALETTE: Readonly<Record<string, string>> = {
  K: '#10110c', // outline, black jacket, headband cloth and sandals
  Y: '#fbeb3b', // hair
  H: '#f3ba36', // hair shade
  M: '#b0b9b6', // headband plate and zipper, lit part
  N: '#9e9e9e', // headband plate and zipper, shaded part
  S: '#f8cbbc', // skin
  s: '#e9b7a8', // skin shade
  C: '#ea839e', // blush cheeks
  E: '#137bb8', // eyes and the blue edge of the Rasengan
  O: '#ee7956', // jacket panels and shorts
  F: '#cf5f41', // orange shade
  W: '#ffffff', // plate shine, shorts stripe, jutsu blades and smoke highlights
  L: '#bdf0ff', // light blue sphere core
  A: '#4c9cd7', // sky blue sphere body
  P: '#1c4fd1', // deep blue sphere edge
  G: '#d9dce1', // smoke
  g: '#8f96a3', // smoke shade
  R: '#ff5a1f', // sage mode eye markings
  V: '#ffe600', // sage mode eyes
  Q: '#fff3a0', // sage glow outline
}

export type Part = { x: number; y: number; art: Pixels }

// Stamps parts onto a transparent canvas, later parts on top. '.' leaves what
// is below, ' ' erases it, and anything outside the canvas is clipped.
export const compose = (width: number, height: number, parts: readonly Part[]): Pixels => {
  const grid = Array.from({ length: height }, () => Array<string>(width).fill('.'))
  for (const { x, y, art } of parts) {
    art.forEach((row, dy) => {
      const line = grid[y + dy]
      if (!line) return
      ;[...row].forEach((key, dx) => {
        if (x + dx < 0 || x + dx >= width || key === '.') return
        line[x + dx] = key === ' ' ? '.' : key
      })
    })
  }
  return grid.map(line => line.join(''))
}

export const WIDTH = 21
export const ROWS = 34

// Rows 0-28, transcribed cell by cell: spiky hair with its outline, the black
// headband with the grey plate, face with blue eyes and blush, black jacket
// with orange panels and the zipper, orange shorts with the light stripe.
// Both arms are left out; they are separate parts below.
const CORE: Pixels = [
  '..........K..........',
  '.....KK..KHK..KK.....',
  '...K.KHKKHYYKKHK.K...',
  '...KKKHHKHYYKHHKKK...',
  '...KYKHYYYYYHHYKYK...',
  '.KKKHYYYHYYYYYYYYKKK.',
  '.KHHHHHHYYYYYYHHYYYK.',
  '..KHHHHYYYYYHYYHHYK..',
  '...KHHHYKKKKKHYHHK...',
  '..KHHHYKNMMMWKHYHHK..',
  '.KKHKHKNNNMMMWKHKHKK.',
  '...KKKKNNNNMMWKKKK...',
  '...KKKKKKKKKKKKKKK...',
  '..KSHsSKSSSSSKSSYSK..',
  '..KSHsSESSSSSESSYSK..',
  '...KHsSESSSSSESSYK...',
  '....KCCSSSSSSSCCK....',
  '....KsSSSSSSSSSSK....',
  '.....KKKKKKKKKKK.....',
  '.....KKKKKMKKKKK.....',
  '.....KFOOKMKOOOK.....',
  '.....KFOOKNKOOOK.....',
  '.....KFOOKNKOOOK.....',
  '.....KFFFKNKFFFK.....',
  '.....KKKKKKKKKKK.....',
  '.....KFFFFFFFFFK.....',
  '.....KMWWWKFOOOK.....',
  '.....KFOOOKFOOOK.....',
  '.....KKKKKKKKKKK.....',
]

// Eyes shut: erases the open eyes and draws the closed lids.
export const EYES_OPEN: readonly Part[] = []
export const EYES_SHUT: readonly Part[] = [
  { x: 7, y: 13, art: ['S', 'S', 'K'] },
  { x: 13, y: 13, art: ['S', 'S', 'K'] },
]

// Rows 29-32: skin legs and black sandals.
export const PASSING: Pixels = [
  '......KsSK.KsSK......',
  '......KKKK.KKKK......',
  '.....KsSKK.KKsSK.....',
  '.....KKKKK.KKKKK.....',
]

export const STRIDE_LEFT: Pixels = [
  '.....KsSK...KsSK.....',
  '.....KKKK...KKKK.....',
  '....KsSKK...KKKKK....',
  '....KKKKK............',
]

export const STRIDE_RIGHT: Pixels = [
  '.....KSsK...KSsK.....',
  '.....KKKK...KKKK.....',
  '....KKKKK...KKSsK....',
  '............KKKKK....',
]

// The arm down at his side, transcribed from the reference (viewer's right);
// the left one is its mirror. `y` is the top row, so a swing is the same arm
// one row higher or lower.
const ARM_RIGHT: Pixels = [
  'K....',
  'KK...',
  'KKK..',
  'KKKK.',
  'KKsSK',
  '.KsSK',
  '..KK.',
]
const ARM_LEFT: Pixels = [
  '....K',
  '...KK',
  '..KKK',
  '.KKKK',
  'KSsKK',
  'KSsK.',
  '.KK..',
]

export const ARM_TOP = 19
export const LEFT_ARM: Part = { x: 0, y: ARM_TOP, art: ARM_LEFT }
const RIGHT_ARM: Part = { x: 16, y: ARM_TOP, art: ARM_RIGHT }

export const ARMS_DOWN: readonly Part[] = [LEFT_ARM, RIGHT_ARM]
export const ARMS_SWING_A: readonly Part[] = [
  { ...LEFT_ARM, y: ARM_TOP - 1 },
  { ...RIGHT_ARM, y: ARM_TOP + 1 },
]
export const ARMS_SWING_B: readonly Part[] = [
  { ...LEFT_ARM, y: ARM_TOP + 1 },
  { ...RIGHT_ARM, y: ARM_TOP - 1 },
]

// The raised arm of the reference (the hand that held the Rasengan), mirrored
// to his right so the effect grows to the right of the walking sprite.
export const RAISED_ARM: Part = {
  x: 16,
  y: 19,
  art: [
    'K.......',
    'KK.KKK..',
    'KKKSKsK.',
    'KKKSSsK.',
    'KKKKKK..',
  ],
}

// The sphere of the reference: a blue ring with a light core, resting above
// the raised hand.
export const BALL_REF: Part = {
  x: 18,
  y: 15,
  art: [
    '..KK..',
    '.KEEK.',
    'KEAAEK',
    'KEAAEK',
    '.KEEK.',
  ],
}

export const body = (eyes: readonly Part[], legs: Pixels, arms: readonly Part[] = ARMS_DOWN): Pixels =>
  compose(WIDTH, ROWS, [{ x: 0, y: 0, art: CORE }, ...eyes, { x: 0, y: 29, art: legs }, ...arms])

export const FRAMES: readonly Pixels[] = [
  body(EYES_OPEN, STRIDE_LEFT, ARMS_SWING_A),
  body(EYES_OPEN, PASSING),
  body(EYES_SHUT, STRIDE_RIGHT, ARMS_SWING_B),
  body(EYES_OPEN, PASSING),
]

// Fallback for short terminals where the band cannot fit the full sprite:
// the same chibi in 10 x 10 pixels.
export const SMALL_WIDTH = 10
export const SMALL_ROWS = 10

export const SMALL_EYES_OPEN = 'KHSESSESHK'
export const SMALL_EYES_SHUT = 'KHSKSSKSHK'
export const SMALL_STRIDE = 'KKKK..KKKK'
export const SMALL_PASSING = '.KKKKKKKK.'

export const small = (eyes: string, feet: string): Pixels => [
  '..K..K.K..',
  '.KYKKYKYK.',
  'KYYHYYYYYK',
  'KKMMMMMMKK',
  eyes,
  '.KCSSSSCK.',
  '.KKKNNKKK.',
  'KOOKNNKOOK',
  'KSKOWWOKSK',
  feet,
]

export const SMALL_FRAMES: readonly Pixels[] = [
  small(SMALL_EYES_OPEN, SMALL_STRIDE),
  small(SMALL_EYES_OPEN, SMALL_PASSING),
  small(SMALL_EYES_SHUT, SMALL_STRIDE),
  small(SMALL_EYES_OPEN, SMALL_PASSING),
]

export const SMALL_STAND: Pixels = small(SMALL_EYES_OPEN, SMALL_PASSING)

export const TRACK_WIDTH = 24

export type Cell = { char: string; color?: string; backgroundColor?: string }

// Folds two pixel rows into one terminal row of half-block cells: the upper
// pixel is the foreground of '▀' and the lower one its background.
export const toCells = (top: string, bottom: string): Cell[] =>
  [...top].map((t, i) => {
    const upper = PALETTE[t]
    const lower = PALETTE[bottom[i] ?? '.']
    if (upper && lower) {
      return upper === lower ? { char: '█', color: upper } : { char: '▀', color: upper, backgroundColor: lower }
    }
    if (upper) return { char: '▀', color: upper }
    if (lower) return { char: '▄', color: lower }
    return { char: ' ' }
  })

export type Span = Cell & { text: string }

// Merges neighbouring cells that share colors so each row draws few elements.
export const toSpans = (cells: Cell[]): Span[] =>
  cells.reduce<Span[]>((spans, cell) => {
    const last = spans[spans.length - 1]
    if (last && last.color === cell.color && last.backgroundColor === cell.backgroundColor) {
      last.text += cell.char
    } else {
      spans.push({ ...cell, text: cell.char })
    }
    return spans
  }, [])

export const toRows = (pixels: Pixels): Span[][] => {
  const rows: Span[][] = []
  for (let y = 0; y < pixels.length; y += 2) {
    rows.push(toSpans(toCells(pixels[y] ?? '', pixels[y + 1] ?? '')))
  }
  return rows
}
