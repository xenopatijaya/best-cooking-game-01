# Self-score — Dapur Kilat (best-cooking-game-20261125-0137)

Game: "Dapur Kilat", an original Indonesian street-kitchen rush game. Canvas 2D,
7 ingredients, 4 recipes, chop / wok / plate / serve loop, orders with
patience bars, day timer, score + tips + combos, win at 300 pts, lose at
3 failed orders. Keyboard (WASD/arrows + E/Q/P/Enter) and mouse
(click-to-walk, click-to-use). All art canvas-drawn, all sound WebAudio.

Play-tested headlessly: full serve flow verified in Node (grab → wok →
cooked → plate → serve, score 0 → 74); 4 screenshots rendered in Chromium
with zero console errors and visually inspected.

## Against the 5 judge criteria (1 = best)

1. **Complete cooking game in screenshots — STRONG.** Cover (1-cover.jpg)
   shows at once: kitchen + order board (4 tickets with patience bars),
   7 ingredient bins on the counter, a dish mid-assembly (plate checklist
   3/3 checked, "PIRING SIAP DIANTAR!"), a big day timer (0:54), and the
   serve window glowing green with "SIAP SAJI!". The other three shots show
   the title screen, live chopping + wok cooking, and the win screen.
2. **Fun / depth — GOOD.** 4 recipes combine 7 ingredients through 2 prep
   stages (chop, cook) in different orders; the player plans a route
   bins → board → wok → plate → window. Pressure grows (spawn interval
   11s → 7s, patience −25%) without adding chores; combos and speed tips
   reward planning. Tray cap 3 and wok cap 2 force real choices.
3. **Feel / polish — GOOD.** Chopping answers at once (mash E, live progress
   bar), wok shows cook/burn progress per item with MATANG/GOSONG warnings,
   serve gives an immediate ding + score flash + combo callout, the timer
   is the biggest element in the top bar and turns red under 20s, the
   urgent order card turns red with a shrinking patience bar.
4. **Look / originality — GOOD.** Original Indonesian warung theme, original
   names (Dapur Kilat, Bu Sari, Pak Budi…), all food drawn in canvas
   (no copied art, no Overcooked names/art/levels). Counters are readable
   at thumbnail size: big labels, high-contrast ticket cards, distinct
   ingredient colours. Emoji render as outline glyphs in headless Chromium
   but every label also carries plain text.
5. **Structure — STRONG.** Source split by job with descriptive names:
   config (tuning/recipes/layout), audio (WebAudio SFX), input
   (keyboard+mouse), world (orders/stations/rules), render (all drawing),
   shots (screenshot staging), main (loop/wiring). No vendored library;
   dossier text well under the 160 KiB cap.

## Verdict
Plausibly top-40 dev board (final-heat cut). The weakest spot vs. a
top-10 entry is art richness (flat canvas shapes vs. a fully dressed
kitchen) and only one cook / one kitchen layout. The strongest spots are
criterion 1 coverage in the cover shot and the genuinely playable,
verified loop. Submitting as-is; no further iteration before the
round-2 cutoff.
