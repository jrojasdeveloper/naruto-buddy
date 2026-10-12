export type Frame = number
// The id of the jutsu `/jutsu` picked for the next turn, until that turn starts.

declare module 'claude-code' {
  interface PluginState {
    'naruto-buddy': { frame: Frame; next: string | null }
  }
}
