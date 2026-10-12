// Pixel-art Naruto sprites. Each string is one row of pixels and each
// character is a palette key ('.' is transparent). Two pixel rows are drawn
// per terminal row with half-block characters, so every sprite has an even
// number of rows and all rows in a sprite share the same width.

export type Pixels = readonly string[]

export const PALETTE: Readonly<Record<string, string>> = {
  K: '#1a1a1a', // outline, eyes, mouth
  Y: '#ffd23f', // hair
  B: '#2b4c9b', // headband cloth
  M: '#c9ced6', // headband plate
  S: '#ffcc99', // skin
  k: '#8a5a3c', // whiskers
  E: '#1e90ff', // eyes
  O: '#ff7a00', // jacket and pants
  D: '#1f2a44', // shoulders and sandals
  W: '#f2f2f2', // zipper
}

const HEAD_TOP: Pixels = [
  '...Y..Y...Y.....',
  '..YYY.YY.YYY.Y..',
  '.YYYYYYYYYYYYY..',
  'YYYYYYYYYYYYYYY.',
  '.YBBBBBBBBBBBY..',
  '.YBBBMMMMMBBBY..',
  '.YBBBBBBBBBBBY..',
  '..SSSSSSSSSSS...',
]

const EYES_OPEN = '..SESSSSSSESS...'
const EYES_SHUT = '..SKSSSSSSKSS...'

const HEAD_BOTTOM: Pixels = [
  '..SSSSSSSSSSS...',
  '..SkSSSSSSSkS...',
  '...SSSKKKSSS....',
  '....SSSSSSS.....',
  '...DDOOWOODD....',
  '..DOOOOWOOOOD...',
  '.SOOOOOWOOOOOS..',
  '.SOOOOOWOOOOOS..',
  '..OOOOOWOOOOO...',
]

const STRIDE_LEFT: Pixels = [
  '...OOO..OOO.....',
  '..OOO....OOO....',
  '..OO......OO....',
  '.DDD......DDD...',
]

const PASSING: Pixels = [
  '....OOO.OOO.....',
  '....OOO.OOO.....',
  '....OO...OO.....',
  '....DD...DD.....',
]

const STRIDE_RIGHT: Pixels = [
  '....OOO..OOO....',
  '...OOO....OOO...',
  '...OO......OO...',
  '...DDD......DDD.',
]

const body = (eyes: string, legs: Pixels): Pixels => [
  ...HEAD_TOP,
  eyes,
  ...HEAD_BOTTOM,
  ...legs,
]

export const FRAMES: readonly Pixels[] = [
  body(EYES_OPEN, STRIDE_LEFT),
  body(EYES_OPEN, PASSING),
  body(EYES_SHUT, STRIDE_RIGHT),
  body(EYES_OPEN, PASSING),
]

// Fallback for short terminals where the band cannot fit the full sprite.
const small = (eyes: string, feet: string): Pixels => [
  '.Y.YY.Y.',
  'YYYYYYYY',
  'BBMMMMBB',
  eyes,
  '.SSKKSS.',
  '.OOWWOO.',
  'SOOWWOOS',
  feet,
]

export const SMALL_FRAMES: readonly Pixels[] = [
  small('.SESSES.', '.D....D.'),
  small('.SESSES.', '..D..D..'),
  small('.SKSSKS.', '.D....D.'),
  small('.SESSES.', '..D..D..'),
]

export const JUTSUS: readonly string[] = [
  'Rasengan',
  'Kage Bunshin no Jutsu',
  'Sexy no Jutsu',
  'Rasenshuriken',
  'Sage Mode',
  'Believe it',
]

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
    rows.push(toSpans(toCells(pixels[y], pixels[y + 1] ?? '')))
  }
  return rows
}
