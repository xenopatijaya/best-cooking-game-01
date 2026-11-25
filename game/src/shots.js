// Dapur Kilat — screenshot staging. One job: put the kitchen into a fixed,
// readable state for each ?shot= scene so the screenshots show a complete
// cooking game: order board, ingredients, a dish mid-assembly, the timer
// and a plate ready to serve.

import { STATE, RECIPES } from './config.js';
import { PHASE } from './world.js';

function item(ing, state) {
  return { ing, state, chop: 0, cook: state === 'cooked' ? 4.2 : 0 };
}

function seedOrders(k, count) {
  k.orders = [];
  const picks = ['nasi-goreng', 'mie-goreng', 'sate-ayam', 'gado-gado'].slice(0, count);
  picks.forEach((recipeId, i) => {
    const max = 48 - i * 4;
    k.orders.push({
      id: 100 + i, recipeId, customer: ['Bu Sari', 'Pak Budi', 'Mbak Rina', 'Mas Joko'][i],
      patience: max - i * 9, maxPatience: max, bornAt: 0,
    });
  });
}

export function stageShot(k, name) {
  k.reset();
  if (name === 'start') {
    // Title screen over a dressed kitchen.
    k.phase = PHASE.TITLE;
    k.time = 0;
    seedOrders(k, 2);
    k.tray = [item('ayam', STATE.RAW), item('telur', STATE.RAW)];
    return;
  }
  k.phase = PHASE.PLAY;
  if (name === 'play') {
    // Busy mid-day: three orders, tray full, wok cooking, board chopping.
    k.time = 62;
    k.score = 145;
    k.coins = 150;
    k.served = 3;
    k.combo = 2;
    seedOrders(k, 3);
    k.tray = [item('nasi', STATE.COOKED), item('kecap', STATE.RAW)];
    k.board = item('ayam', STATE.RAW);
    k.board.chop = 0.55;
    k.wok = [item('telur', STATE.COOKED), item('mie', STATE.RAW)];
    k.wok[1].cook = 2.4;
    k.cook.x = 610; k.cook.y = 340; // standing at the chopping board
    k.flash = { text: 'Ayam sedang dicincang…', color: '#ffd94d', until: 9999 };
  } else if (name === 'serve') {
    // The money shot: a finished plate, ready to serve, timer running.
    k.time = 96;
    k.score = 260;
    k.coins = 240;
    k.served = 5;
    k.combo = 3;
    seedOrders(k, 4);
    k.plate = [item('nasi', STATE.COOKED), item('telur', STATE.COOKED), item('kecap', STATE.RAW)];
    k.tray = [item('sayur', STATE.CHOPPED)];
    k.wok = [item('ayam', STATE.COOKED)];
    k.cook.x = 960; k.cook.y = 650; // standing at the serve window
    k.flash = { text: '+80 — Nasi Goreng untuk Bu Sari! Kombo x3!', color: '#7ed957', until: 9999 };
  } else if (name === 'end') {
    // Winning day-end screen.
    k.time = 150;
    k.score = 340;
    k.coins = 320;
    k.served = 7;
    k.failed = 1;
    seedOrders(k, 1);
    k.phase = PHASE.WIN;
  }
  k.updateNearest();
}
