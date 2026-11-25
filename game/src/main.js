// Dapur Kilat — entrypoint. One job: wire the canvas, the loop and the
// screens together, and stage ?shot= scenes for screenshots.

import { VIEW } from './config.js';
import { SoundBank } from './audio.js';
import { Input } from './input.js';
import { Kitchen, PHASE } from './world.js';
import { render } from './render.js';
import { stageShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = VIEW.w;
canvas.height = VIEW.h;

const sound = new SoundBank();
const input = new Input(canvas);
const kitchen = new Kitchen(sound);

const params = new URLSearchParams(location.search);
const shot = params.get('shot');
if (shot) {
  // Screenshots are the bare canvas: hide the page help strip below it.
  const help = document.getElementById('help');
  if (help) help.style.display = 'none';
  stageShot(kitchen, shot);
  // Paint twice so fonts and the first frame settle before the capture.
  render(ctx, kitchen);
  render(ctx, kitchen);
  window.__shotReady = true;
}

let last = performance.now();

function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;

  if (!shot) {
    if (input.wasPressed('enter', ' ')) {
      sound.unlock();
      if (kitchen.phase === PHASE.TITLE || kitchen.phase === PHASE.WIN || kitchen.phase === PHASE.LOSE) {
        kitchen.startDay();
        sound.click();
      }
    }
    if (input.wasPressed('p') && kitchen.phase === PHASE.PLAY) kitchen.paused = !kitchen.paused;
    if (input.wasPressed('e') || input.wasPressed(' ')) {
      if (kitchen.phase === PHASE.PLAY) kitchen.interact();
    }
    if (input.wasPressed('q') && kitchen.phase === PHASE.PLAY) kitchen.useTrash();
    if (input.mouse.clicked && kitchen.phase !== PHASE.PLAY) {
      sound.unlock();
      if (kitchen.phase === PHASE.TITLE || kitchen.phase === PHASE.WIN || kitchen.phase === PHASE.LOSE) kitchen.startDay();
    }
    if (input.mouse.clicked && kitchen.phase === PHASE.PLAY) {
      // Clicking the cook's own station uses it immediately; clicking
      // elsewhere walks there (handled inside Kitchen.update).
      sound.unlock();
    }
    kitchen.update(dt, input);
    render(ctx, kitchen);
  }

  input.endFrame();
  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);
