# naruto-buddy

A Claude Code mod: an animated pixel-art Naruto runs above the prompt while Claude is working, and the spinner shows a random jutsu.

Sprites are pixel grids drawn with half-block characters (`▀ ▄ █`) in truecolor, with a smaller sprite for short terminals.

## Install

Type this at the prompt of a Claude Code terminal session:

```
/plugin install naruto-buddy --marketplace jrojasdeveloper/naruto-buddy
```

Answer `y` to add the marketplace, then pick a scope (user scope loads it in every session).

## Develop

```
claude plugin validate .
claude plugin test .
claude --plugin-dir .
```

Edit the pixel grids in `hooks/frames.ts`: each character is a `PALETTE` key and `.` is transparent. Sprites need an even number of rows of equal width.
