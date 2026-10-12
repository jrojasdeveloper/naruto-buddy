import { atom, read, update } from 'claude-code'
import type { Register, Timer } from 'claude-code'

import { FRAMES, SMALL_FRAMES, toRows } from './frames'
import type { Pixels, Span } from './frames'
import { JUTSUS, castFrames } from './jutsus'
import { clampOffset, pose } from './timeline'

const frame = atom({ plugin: 'naruto-buddy', key: 'frame' } as const, 0)

const TICK_MS = 150

// Pixel rows are folded into half-block terminal rows once per grid.
const rowCache = new WeakMap<Pixels, Span[][]>()
const rowsOf = (pixels: Pixels): Span[][] => {
  const cached = rowCache.get(pixels)
  if (cached) return cached
  const rows = toRows(pixels)
  rowCache.set(pixels, rows)
  return rows
}

const widthOf = (frames: readonly Pixels[]): number =>
  Math.max(...frames.map(f => f[0]?.length ?? 0))

// The full sprite needs 17 terminal rows (34 pixel rows); shorter bands get the small one.
const FULL_ROWS = FRAMES[0] ? toRows(FRAMES[0]).length : Infinity

export const register: Register = on => {
  let tick: Timer | undefined
  let jutsu = JUTSUS[0]

  on('turn.start', async ($, e, next) => {
    jutsu = JUTSUS[Math.floor(Math.random() * JUTSUS.length)] ?? jutsu
    await update($, frame, () => 0)
    tick?.cancel()
    tick = $.clock.every(TICK_MS, () => {
      void update($, frame, n => n + 1)
    })

    return next(e)
  })

  on('turn.complete', ($, e, next) => {
    tick?.cancel()
    tick = undefined

    return next(e)
  })

  // The spinner word always names the jutsu being animated.
  on('ui.render', { component: 'Spinner' }, ($, e, next) =>
    next({ ...e, props: { ...e.props, word: jutsu.name } }),
  )

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    if (!e.props.isWorking || e.props.hasSurvey) {
      return next(e)
    }

    const n = await read($, frame)
    const full = e.props.maxRows >= FULL_ROWS
    const columns = e.props.bodyColumns
    const walk = full ? FRAMES : SMALL_FRAMES
    const cast = castFrames(jutsu, !full, columns)
    const p = pose(n, cast.length)
    const casting = p.phase === 'cast'
    const pixels = (casting ? cast[p.frame] : walk[p.frame]) ?? walk[0] ?? []
    // While casting, reserve room for the widest cast frame so he stays put.
    const offset = ' '.repeat(clampOffset(p.offset, widthOf(casting ? cast : walk), columns))
    const { Box, Text } = $.ui.resolve(e)

    return (
      <Box key={full ? 'naruto' : 'naruto-small'} flexDirection="column">
        {rowsOf(pixels).map((spans, i) => (
          <Text key={`row-${i}`}>
            {offset}
            {spans.map((span, j) => (
              <Text key={`px-${i}-${j}`} color={span.color} backgroundColor={span.backgroundColor}>
                {span.text}
              </Text>
            ))}
          </Text>
        ))}
      </Box>
    )
  })
}
