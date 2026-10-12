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

// The jutsu the spinner names, read through a stand-in for the engine's own Spinner.
const spinnerWord = async ($: any, on: any): Promise<() => Promise<string>> => {
  let word = ''
  on('session.start', ($$: any, e: any) => ({ cwd: e.cwd }))
  on('turn.start', ($$: any, e: any) => ({ turnId: e.turnId }))
  on('ui.render', { component: 'Spinner' }, ($$: any, e: any) => {
    word = e.props.word
    const { Box } = $$.ui.resolve(e)
    return <Box key="engine" />
  })

  return async () => {
    const mounted = await $.ui.mount({
      plugin: 'naruto-buddy',
      surface: 'terminal',
      component: 'Spinner',
      props: { word: 'Working', message: null, suffix: '�', mode: 'responding' },
    })
    await mounted.unmount()
    return word
  }
}

const runJutsu = async ($: any, args: string) =>
  $.command.run({ command: 'jutsu', args, origin: { kind: 'composer' }, presentation: { isFullscreen: false, columns: 80 } })

const startTurn = async ($: any, n: number) => $.turn.start({ text: 'go', turnId: `turn-${n}` })

test('/jutsu sets the next jutsu once: the next turn uses it, the one after is random again', async ($, on) => {
  const read = await spinnerWord($, on)
  await $.session.start({ cwd: '.', surface: 'terminal', isInteractive: true })

  const reply = await runJutsu($, 'Rasengan')
  expect(reply.text).toBe('Next jutsu: Rasengan')

  await startTurn($, 1)
  expect(await read()).toBe('Rasengan')

  // Cleared: later turns are drawn at random, so across many turns more than one jutsu shows.
  const seen = new Set<string>()
  for (let n = 2; n < 40; n++) {
    await startTurn($, n)
    seen.add(await read())
  }
  expect(seen.size).toBeGreaterThan(1)
})

test('/jutsu accepts ids and loose names, any case', async ($, on) => {
  const read = await spinnerWord($, on)
  await $.session.start({ cwd: '.', surface: 'terminal', isInteractive: true })
  const cases: [string, string][] = [
    ['kage-bunshin', 'Kage Bunshin no Jutsu'],
    ['KAGE', 'Kage Bunshin no Jutsu'],
    ['rasenshuriken', 'Rasenshuriken'],
    ['sage-mode', 'Sage Mode'],
    ['sexy', 'Sexy no Jutsu'],
    ['  Sexy no Jutsu ', 'Sexy no Jutsu'],
  ]
  let n = 100
  for (const [arg, name] of cases) {
    const reply = await runJutsu($, arg)
    expect(reply.text).toBe(`Next jutsu: ${name}`)
    await startTurn($, n)
    expect(await read()).toBe(name)
    n++
  }
})

test('/jutsu with no or an unknown argument lists the ids and sets nothing', async ($, on) => {
  const read = await spinnerWord($, on)
  await $.session.start({ cwd: '.', surface: 'terminal', isInteractive: true })

  for (const args of ['', 'chidori', 'rasen']) {
    const reply = await runJutsu($, args)
    for (const id of ['rasengan', 'kage-bunshin', 'rasenshuriken', 'sage-mode', 'sexy']) {
      expect(reply.text).toContain(id)
    }
    expect(reply.text).not.toContain('Next jutsu')
  }

  // Nothing was forced: turns stay random.
  const seen = new Set<string>()
  for (let n = 200; n < 240; n++) {
    await startTurn($, n)
    seen.add(await read())
  }
  expect(seen.size).toBeGreaterThan(1)
})
