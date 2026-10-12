import { TRACK_WIDTH } from './frames'

export const WALK_TICKS = 16 // ~2.4s of walking at 150ms per tick
export const HOLD_TICKS = 2 // ticks each cast frame stays on screen
const WALK_FRAMES = 4

export type Pose = {
  phase: 'walk' | 'cast'
  // Index into the walk frames, or into the jutsu's cast frames.
  frame: number
  // Columns walked along the track; frozen while casting.
  offset: number
}

// Walk, stop and cast, walk again. Walked ticks accumulate across cycles, so
// he resumes exactly where he stopped.
export const pose = (n: number, castLength: number): Pose => {
  const castTicks = castLength * HOLD_TICKS
  const cycle = WALK_TICKS + castTicks
  const done = Math.floor(n / cycle)
  const t = n % cycle
  const walked = done * WALK_TICKS + Math.min(t, WALK_TICKS)

  if (t < WALK_TICKS) {
    return { phase: 'walk', frame: walked % WALK_FRAMES, offset: walked % TRACK_WIDTH }
  }
  return {
    phase: 'cast',
    frame: Math.floor((t - WALK_TICKS) / HOLD_TICKS),
    offset: walked % TRACK_WIDTH,
  }
}

// Never draw past the body: offset + sprite width must fit in its columns.
export const clampOffset = (offset: number, spriteWidth: number, columns: number): number =>
  Math.max(0, Math.min(offset, columns - spriteWidth))
