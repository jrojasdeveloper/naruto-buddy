export type Frame = number

declare module 'claude-code' {
  interface PluginState {
    'naruto-buddy': { frame: Frame }
  }
}
