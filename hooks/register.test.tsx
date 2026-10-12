import { expect, test } from 'claude-code/testing'

import { FRAMES, SMALL_FRAMES, toRows } from './frames'

const band = (isWorking: boolean, maxRows = 20) =>
  ({
    component: 'AbovePrompt',
    props: { hasSurvey: false, isWorking, maxRows },
  }) as const

test('every sprite is a rectangle of known palette keys with an even height', async () => {
  for (const sprite of [...FRAMES, ...SMALL_FRAMES]) {
    expect(sprite.length % 2).toBe(0)
    expect(new Set(sprite.map(row => row.length)).size).toBe(1)
    expect(sprite.join('')).toMatch(/^[.KYBMSkEODW]+$/)
  }
})

test('two pixel rows fold into one half-block row', async () => {
  const [row] = toRows(['Y.', 'YB'])
  expect(row.map(span => span.text).join('')).toBe('█▄')
})

test('naruto runs above the prompt only while working', async ($, on) => {
  on('ui.render', ($$, e) => {
    const { Box } = $$.ui.resolve(e)
    return <Box key="engine" />
  })

  for (const surface of ['terminal', 'desktop'] as const) {
    const working = await $.ui.mount({ plugin: 'naruto-buddy', surface, ...band(true) })
    expect(await working.find({ key: 'naruto' })).toBeDefined()
    await working.unmount()

    const cramped = await $.ui.mount({ plugin: 'naruto-buddy', surface, ...band(true, 6) })
    expect(await cramped.find({ key: 'naruto' })).toBeUndefined()
    expect(await cramped.find({ key: 'naruto-small' })).toBeDefined()
    await cramped.unmount()

    const idle = await $.ui.mount({ plugin: 'naruto-buddy', surface, ...band(false) })
    expect(await idle.find({ key: 'naruto' })).toBeUndefined()
    expect(await idle.find({ key: 'naruto-small' })).toBeUndefined()
    await idle.unmount()
  }
})
