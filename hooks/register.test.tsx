import { expect, test } from 'claude-code/testing'

import { FRAMES, PALETTE, SMALL_FRAMES, toRows } from './frames'

const band = (isWorking: boolean, maxRows = 20, bodyColumns = 80) =>
  ({
    component: 'AbovePrompt',
    props: {
      hasSurvey: false,
      isWorking,
      maxRows,
      bodyColumns,
      scroll: { offset: 0, bodyRows: maxRows },
      view: {},
    },
  }) as const

test('every sprite is a rectangle of known palette keys with an even height', async () => {
  for (const sprite of [...FRAMES, ...SMALL_FRAMES]) {
    expect(sprite.length % 2).toBe(0)
    expect(new Set(sprite.map(row => row.length)).size).toBe(1)
    for (const key of sprite.join('')) {
      if (key !== '.') expect(PALETTE[key]).toBeDefined()
    }
  }
})

test('two pixel rows fold into one half-block row', async () => {
  const row = toRows(['Y.', 'YE'])[0] ?? []
  expect(row.map(span => span.text).join('')).toBe('█▄')
})

test('the full sprite needs 17 terminal rows, else the small one is drawn', async ($, on) => {
  on('ui.render', ($$, e) => {
    const { Box } = $$.ui.resolve(e)
    return <Box key="engine" />
  })

  const fits = await $.ui.mount({ plugin: 'naruto-buddy', surface: 'terminal', ...band(true, 17) })
  expect(await fits.find({ key: 'naruto' })).toBeDefined()
  await fits.unmount()

  const short = await $.ui.mount({ plugin: 'naruto-buddy', surface: 'terminal', ...band(true, 16) })
  expect(await short.find({ key: 'naruto' })).toBeUndefined()
  expect(await short.find({ key: 'naruto-small' })).toBeDefined()
  await short.unmount()
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

    // Narrower than any cast frame: still drawn, never past the body.
    const narrow = await $.ui.mount({ plugin: 'naruto-buddy', surface, ...band(true, 20, 12) })
    expect(await narrow.find({ key: 'naruto' })).toBeDefined()
    await narrow.unmount()
  }
})
