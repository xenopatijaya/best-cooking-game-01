# Dapur Kilat

[![make.fun · best-cooking-game-20261125-0137](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![rank](https://make.fun/badge/best-cooking-game-20261125-0137/xenopatijaya/best-cooking-game-01/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![reward](https://make.fun/badge/best-cooking-game-20261125-0137/xenopatijaya/best-cooking-game-01/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)

**Dapur Kilat** is an original Indonesian street-kitchen rush game. You are the
cook at the busiest warung in town: customers order nasi goreng, mie goreng,
sate ayam and gado-gado, and you run the route — grab ingredients from the
counter, chop them on the board, fry them in the wok (before they burn!),
assemble the plate to the recipe, and serve it at the window before the
customer's patience runs out. Built for the
[make.fun best cooking game bounty](https://make.fun/bounty/best-cooking-game-20261125-0137).

## How to play

Serve the game and open it in a desktop browser:

```sh
node serve.ts
# open http://localhost:8080/
```

No build step, no network requests, no files beyond `game/` — plain HTML
and ES modules on a canvas, with procedural WebAudio sound.

## Controls

| Key / mouse | Action |
| --- | --- |
| WASD / arrows | Move the cook |
| Click a station | Walk over to it and use it |
| E / Space | Use the nearest station (grab, chop, cook, plate, serve) |
| Q | Throw away a burnt item / wrong plate |
| P | Pause |
| Enter | Start / play again |

## The day

- A day lasts 2½ minutes. Reach **300 points** to win the day.
- Each served dish scores 50 + a speed tip (up to 30) + combo bonuses.
- Orders arrive faster and patience shrinks as the day goes on.
- **3 failed orders** and the warung closes early — game over.

## Recipes

- **Nasi Goreng** — nasi (wok) + telur (wok) + kecap
- **Mie Goreng** — mie (wok) + sayur (chop) + telur (wok)
- **Sate Ayam** — ayam (chop, then wok) + kecap + sayur (chop)
- **Gado-Gado** — sayur (chop) + telur (wok) + kacang (chop)
