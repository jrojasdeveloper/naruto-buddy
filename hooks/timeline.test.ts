import { expect, test } from 'claude-code/testing'

import { TRACK_WIDTH } from './frames'
import { HOLD_TICKS, WALK_TICKS, clampOffset, pose } from './timeline'

const CAST = 5
const CAST_TICKS = CAST * HOLD_TICKS

test('he walks first: frames cycle and the offset advances one column per tick', async () => {
  expect(pose(0, CAST)).toEqual({ phase: 'walk', frame: 0, offset: 0 })
  expect(pose(1, CAST)).toEqual({ phase: 'walk', frame: 1, offset: 1 })
  expect(pose(5, CAST)).toEqual({ phase: 'walk', frame: 1, offset: 5 })
  expect(pose(WALK_TICKS - 1, CAST).phase).toBe('walk')
})

test('after the walk he stops and casts each frame for HOLD_TICKS with a frozen offset', async () => {
  const stop = pose(WALK_TICKS, CAST).offset
  for (let t = 0; t < CAST_TICKS; t++) {
    const p = pose(WALK_TICKS + t, CAST)
    expect(p.phase).toBe('cast')
    expect(p.frame).toBe(Math.floor(t / HOLD_TICKS))
    expect(p.offset).toBe(stop)
  }
})

test('after the cast he resumes walking from where he stopped', async () => {
  const stop = pose(WALK_TICKS, CAST).offset
  const resumed = pose(WALK_TICKS + CAST_TICKS, CAST)
  expect(resumed.phase).toBe('walk')
  expect(resumed.offset).toBe(stop)
  expect(pose(WALK_TICKS + CAST_TICKS + 3, CAST).offset).toBe((stop + 3) % TRACK_WIDTH)
})

test('the timeline repeats and the offset stays inside the track', async () => {
  const cycle = WALK_TICKS + CAST_TICKS
  expect(pose(cycle * 3 + 5, CAST).phase).toBe('walk')
  expect(pose(cycle * 3 + WALK_TICKS, CAST).phase).toBe('cast')
  for (let n = 0; n < cycle * 6; n++) {
    expect(pose(n, CAST).offset).toBeLessThan(TRACK_WIDTH)
  }
})

test('without cast frames he only walks', async () => {
  for (let n = 0; n < 100; n++) {
    expect(pose(n, 0).phase).toBe('walk')
  }
})

test('clampOffset keeps the sprite inside the body columns', async () => {
  expect(clampOffset(10, 16, 80)).toBe(10)
  expect(clampOffset(23, 26, 40)).toBe(14)
  expect(clampOffset(5, 30, 20)).toBe(0)
})
