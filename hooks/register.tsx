import { atom, read, update } from 'claude-code'
import type { Register, Timer } from 'claude-code'

import { FRAMES, JUTSUS, SMALL_FRAMES, TRACK_WIDTH, toRows } from './frames'

const frame = atom({ plugin: 'naruto-buddy', key: 'frame' } as const, 0)

const TICK_MS = 150

// Pixel rows are pre-folded into half-block terminal rows once at load.
const FULL_ROWS = FRAMES.map(toRows)
const SMALL_ROWS = SMALL_FRAMES.map(toRows)

export const register: Register = on => {
  let tick: Timer | undefined
  let jutsu = JUTSUS[0] ?? 'Rasengan'

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

  on('ui.render', { component: 'Spinner' }, ($, e, next) =>
    next({ ...e, props: { ...e.props, word: jutsu } }),
  )

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    if (!e.props.isWorking || e.props.hasSurvey) {
      return next(e)
    }

    const n = await read($, frame)
    const full = e.props.maxRows >= (FULL_ROWS[0]?.length ?? Infinity)
    const frames = full ? FULL_ROWS : SMALL_ROWS
    const sprite = frames[n % frames.length] ?? []
    const offset = ' '.repeat(n % TRACK_WIDTH)
    const { Box, Text } = $.ui.resolve(e)

    return (
      <Box key={full ? 'naruto' : 'naruto-small'} flexDirection="column">
        {sprite.map((spans, i) => (
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
