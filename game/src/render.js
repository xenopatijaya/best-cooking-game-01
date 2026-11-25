// Dapur Kilat — canvas rendering. One job: draw everything the player sees.
// All art is drawn with canvas paths; no image files, no fonts beyond the
// system sans stack. Big labels and strong contrast so the kitchen reads
// at a glance, even shrunk to a thumbnail.

import {
  VIEW, TARGET_SCORE, MAX_FAILED_ORDERS, STATE, COOK_SECONDS, BURN_SECONDS,
  INGREDIENTS, RECIPES, STATIONS, BIN_ORDER, BIN_W, BIN_GAP, COOK_RADIUS,
} from './config.js';
import { PHASE, plateMatchesRecipe } from './world.js';

const FONT = "'Trebuchet MS', 'Segoe UI', sans-serif";

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, s, x, y, size, color, align = 'center', weight = 'bold') {
  ctx.font = `${weight} ${size}px ${FONT}`;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(s, x, y);
}

function stateTag(state) {
  if (state === STATE.CHOPPED) return 'cincang';
  if (state === STATE.COOKED) return 'matang';
  if (state === STATE.BURNT) return 'gosong';
  return 'mentah';
}

// ---- food icons, drawn with canvas shapes -------------------------------

export function drawIngredientIcon(ctx, ing, x, y, r, state = STATE.RAW) {
  const def = INGREDIENTS[ing];
  ctx.save();
  ctx.translate(x, y);
  if (state === STATE.BURNT) {
    ctx.fillStyle = '#2b2b2b';
    ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#555';
    ctx.beginPath(); ctx.arc(-r * 0.3, -r * 0.2, r * 0.25, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    return;
  }
  ctx.fillStyle = def.color;
  ctx.strokeStyle = def.dark;
  ctx.lineWidth = 2;
  if (ing === 'nasi' || ing === 'mie') {
    // A mound of rice / a swirl of noodles.
    ctx.beginPath(); ctx.ellipse(0, r * 0.25, r, r * 0.62, 0, Math.PI, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = def.dark; ctx.lineWidth = 1.5;
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath(); ctx.arc(i * r * 0.28, -r * 0.1, r * 0.3, Math.PI * 0.15, Math.PI * 0.85); ctx.stroke();
    }
  } else if (ing === 'ayam') {
    // Drumstick.
    ctx.beginPath(); ctx.ellipse(-r * 0.1, -r * 0.05, r * 0.75, r * 0.55, -0.4, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(r * 0.45, r * 0.35); ctx.lineTo(r * 0.9, r * 0.8); ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(r * 0.95, r * 0.85, r * 0.2, 0, Math.PI * 2); ctx.fill();
  } else if (ing === 'telur') {
    ctx.beginPath(); ctx.ellipse(0, 0, r * 0.7, r * 0.9, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    if (state === STATE.COOKED) {
      ctx.fillStyle = '#ffcf3f';
      ctx.beginPath(); ctx.arc(0, 0, r * 0.38, 0, Math.PI * 2); ctx.fill();
    }
  } else if (ing === 'sayur') {
    ctx.fillStyle = def.color;
    ctx.beginPath(); ctx.ellipse(0, 0, r * 0.85, r * 0.55, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = def.dark; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, -r * 0.5); ctx.lineTo(0, r * 0.5); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-r * 0.5, 0); ctx.lineTo(r * 0.5, 0); ctx.stroke();
  } else if (ing === 'kecap') {
    // Little sauce bottle.
    ctx.fillStyle = '#3a2410';
    rr(ctx, -r * 0.35, -r * 0.2, r * 0.7, r * 0.9, r * 0.2); ctx.fill();
    ctx.fillStyle = '#c0392b';
    rr(ctx, -r * 0.25, -r * 0.75, r * 0.5, r * 0.6, r * 0.15); ctx.fill();
    ctx.fillStyle = def.color;
    ctx.beginPath(); ctx.ellipse(0, r * 0.45, r * 0.45, r * 0.25, 0, 0, Math.PI * 2); ctx.fill();
  } else if (ing === 'kacang') {
    ctx.beginPath(); ctx.ellipse(-r * 0.3, 0, r * 0.4, r * 0.6, 0.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(r * 0.35, -r * 0.1, r * 0.4, r * 0.6, -0.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  }
  if (state === STATE.CHOPPED) {
    // Chop marks: three small cut lines across the icon.
    ctx.strokeStyle = 'rgba(0,0,0,0.55)'; ctx.lineWidth = 2;
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath(); ctx.moveTo(i * r * 0.5 - r * 0.2, -r * 0.7); ctx.lineTo(i * r * 0.5 + r * 0.2, r * 0.7); ctx.stroke();
    }
  }
  ctx.restore();
}

function drawDishIcon(ctx, recipe, x, y, r) {
  ctx.save();
  ctx.translate(x, y);
  // Plate.
  ctx.fillStyle = '#fdfdfd';
  ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#c9c9c9'; ctx.lineWidth = 2; ctx.stroke();
  ctx.fillStyle = recipe.color;
  ctx.beginPath(); ctx.arc(0, 0, r * 0.72, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.beginPath(); ctx.arc(-r * 0.2, -r * 0.2, r * 0.28, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

// ---- stations ------------------------------------------------------------

function stationShell(ctx, s, active, label, sub) {
  ctx.save();
  ctx.fillStyle = '#8a5a33';
  rr(ctx, s.x - 4, s.y - 4, s.w + 8, s.h + 8, 12); ctx.fill();
  ctx.fillStyle = '#a9713f';
  rr(ctx, s.x, s.y, s.w, s.h, 10); ctx.fill();
  // Active station: a bright gold border, never a pale fill (white labels
  // must stay readable on the brown counter).
  ctx.strokeStyle = active ? '#ffd94d' : '#6b4423';
  ctx.lineWidth = active ? 4 : 2;
  rr(ctx, s.x, s.y, s.w, s.h, 10); ctx.stroke();
  text(ctx, label, s.x + s.w / 2, s.y - 16, 15, '#fff');
  if (sub) text(ctx, sub, s.x + s.w / 2, s.y + s.h + 16, 12, '#ffd9a0', 'center', 'normal');
  ctx.restore();
}

function drawBins(ctx, k) {
  const b = STATIONS.bins;
  const active = k.nearest === 'bins';
  stationShell(ctx, b, active, '🥘 BAHAN MENTAH — tekan E / klik untuk ambil', null);
  for (let i = 0; i < BIN_ORDER.length; i++) {
    const ing = BIN_ORDER[i];
    const bx = b.x + 8 + i * (BIN_W + BIN_GAP);
    const hot = k.nearBin === ing;
    ctx.fillStyle = hot ? '#fff3d6' : '#f7e8c9';
    rr(ctx, bx, b.y + 8, BIN_W, b.h - 16, 8); ctx.fill();
    ctx.strokeStyle = hot ? '#e2a63d' : '#c9a86a'; ctx.lineWidth = hot ? 3 : 1.5;
    rr(ctx, bx, b.y + 8, BIN_W, b.h - 16, 8); ctx.stroke();
    drawIngredientIcon(ctx, ing, bx + BIN_W / 2, b.y + 34, 16);
    text(ctx, INGREDIENTS[ing].name, bx + BIN_W / 2, b.y + b.h - 22, 11, '#5b3a1e');
  }
}

function drawBoard(ctx, k) {
  const s = STATIONS.board;
  stationShell(ctx, s, k.nearest === 'board', '🔪 TALENAN — cincang', 'E / tahan E untuk mencincang');
  // Wooden board.
  ctx.fillStyle = '#e8c88f';
  rr(ctx, s.x + 20, s.y + 14, s.w - 40, s.h - 28, 8); ctx.fill();
  ctx.strokeStyle = '#b98a4d'; ctx.lineWidth = 2;
  rr(ctx, s.x + 20, s.y + 14, s.w - 40, s.h - 28, 8); ctx.stroke();
  if (k.board) {
    drawIngredientIcon(ctx, k.board.ing, s.x + s.w / 2, s.y + s.h / 2 - 6, 26, k.board.state);
    if (k.board.state === STATE.RAW) {
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      rr(ctx, s.x + 24, s.y + s.h - 24, s.w - 48, 12, 6); ctx.fill();
      ctx.fillStyle = '#7ed957';
      rr(ctx, s.x + 24, s.y + s.h - 24, (s.w - 48) * Math.min(1, k.board.chop), 12, 6); ctx.fill();
    } else {
      text(ctx, 'SIAP!', s.x + s.w / 2, s.y + s.h - 18, 13, '#2f7d32');
    }
  } else {
    text(ctx, 'taruh bahan di sini', s.x + s.w / 2, s.y + s.h / 2, 13, '#8a6a3f', 'center', 'normal');
  }
}

function drawWok(ctx, k) {
  const s = STATIONS.wok;
  stationShell(ctx, s, k.nearest === 'wok', '🍳 WAJAN — masak di api', 'jangan sampai gosong!');
  // Stove flame.
  const flick = Math.sin(performance.now() / 90) * 3;
  ctx.fillStyle = '#ff7b2f';
  ctx.beginPath();
  ctx.moveTo(s.x + 60, s.y + s.h - 12);
  ctx.quadraticCurveTo(s.x + 120 + flick, s.y + s.h - 44, s.x + 180, s.y + s.h - 12);
  ctx.closePath(); ctx.fill();
  // Wok bowl.
  ctx.fillStyle = '#3a3a3a';
  ctx.beginPath(); ctx.ellipse(s.x + s.w / 2, s.y + s.h - 22, 86, 22, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#555';
  ctx.beginPath(); ctx.ellipse(s.x + s.w / 2, s.y + s.h - 28, 78, 16, 0, 0, Math.PI * 2); ctx.fill();
  k.wok.forEach((it, i) => {
    const cx = s.x + s.w / 2 + (i === 0 ? -34 : 34);
    const cy = s.y + s.h - 30;
    drawIngredientIcon(ctx, it.ing, cx, cy, 20, it.state);
    const ratio = Math.min(1, it.cook / COOK_SECONDS);
    const burnRatio = Math.max(0, (it.cook - COOK_SECONDS) / (BURN_SECONDS - COOK_SECONDS));
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    rr(ctx, cx - 22, cy + 22, 44, 8, 4); ctx.fill();
    ctx.fillStyle = it.state === STATE.BURNT ? '#ff6b6b' : (it.state === STATE.COOKED ? '#7ed957' : '#ffd94d');
    rr(ctx, cx - 22, cy + 22, 44 * (it.state === STATE.BURNT ? 1 : ratio), 8, 4); ctx.fill();
    if (burnRatio > 0 && it.state !== STATE.BURNT && it.state !== STATE.COOKED) text(ctx, 'GOSONG!', cx, cy - 30, 11, '#ff6b6b');
    else if (it.state === STATE.COOKED) text(ctx, 'MATANG', cx, cy - 30, 11, '#7ed957');
  });
  if (!k.wok.length) text(ctx, 'wajan kosong', s.x + s.w / 2, s.y + s.h - 30, 12, '#d9c9a8', 'center', 'normal');
}

function drawPlateArea(ctx, k) {
  const s = STATIONS.plate;
  stationShell(ctx, s, k.nearest === 'plate', '🍽️ PIRING SAJI — rakit pesanan', null);
  // The plate itself.
  const px = s.x + 90, py = s.y + s.h / 2;
  ctx.fillStyle = '#fdfdfd';
  ctx.beginPath(); ctx.arc(px, py, 52, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#c9c9c9'; ctx.lineWidth = 3; ctx.stroke();
  ctx.fillStyle = '#f2ead8';
  ctx.beginPath(); ctx.arc(px, py, 42, 0, Math.PI * 2); ctx.fill();
  k.plate.forEach((it, i) => {
    const a = -Math.PI / 2 + (i / Math.max(1, k.plate.length)) * Math.PI * 2;
    drawIngredientIcon(ctx, it.ing, px + Math.cos(a) * 22, py + Math.sin(a) * 22, 15, it.state);
  });
  // Recipe checklist for the oldest open order.
  const order = k.orders[0];
  const lx = s.x + 170;
  if (order) {
    const recipe = RECIPES.find((r) => r.id === order.recipeId);
    const match = plateMatchesRecipe(k.plate, recipe);
    if (match) text(ctx, '✓ PIRING SIAP DIANTAR!', lx, s.y + 20, 14, '#7ed957');
    else text(ctx, `Rakit: ${recipe.name}`, lx, s.y + 20, 15, '#fff', 'left');
    recipe.needs.forEach((need, i) => {
      const got = k.plate.some((p) => p.ing === need.ing && p.state === need.state);
      const y = s.y + 46 + i * 22;
      ctx.fillStyle = got ? '#7ed957' : '#ffd94d';
      ctx.beginPath(); ctx.arc(lx + 8, y, 7, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = got ? '#7ed957' : '#fff';
      text(ctx, `${got ? '✓' : '○'} ${INGREDIENTS[need.ing].name} (${stateTag(need.state)})`, lx + 22, y, 13, got ? '#b8f0a0' : '#ffffff', 'left', got ? 'bold' : 'normal');
    });
  } else {
    text(ctx, 'Belum ada pesanan', lx, s.y + 40, 14, '#fff', 'left', 'normal');
  }
}

function drawServe(ctx, k) {
  const s = STATIONS.serve;
  const ready = k.plate.length > 0 && k.orders.some((o) => plateMatchesRecipe(k.plate, RECIPES.find((r) => r.id === o.recipeId)));
  stationShell(ctx, s, k.nearest === 'serve', '🔔 JENDELA SAJI', ready ? 'PIRING SIAP — antar sekarang!' : 'antar piring yang cocok');
  // Counter window + bell.
  ctx.fillStyle = '#7a4a21';
  rr(ctx, s.x + 14, s.y + 16, s.w - 28, 34, 6); ctx.fill();
  ctx.fillStyle = '#ffd94d';
  ctx.beginPath(); ctx.arc(s.x + s.w / 2, s.y + 62, 20, Math.PI, 0); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#c9a227';
  rr(ctx, s.x + s.w / 2 - 26, s.y + 60, 52, 6, 3); ctx.fill();
  if (ready) {
    const pulse = 1 + Math.sin(performance.now() / 150) * 0.08;
    ctx.save();
    ctx.translate(s.x + s.w / 2, s.y + 62); ctx.scale(pulse, pulse); ctx.translate(-(s.x + s.w / 2), -(s.y + 62));
    ctx.strokeStyle = '#7ed957'; ctx.lineWidth = 4;
    rr(ctx, s.x + 6, s.y + 6, s.w - 12, s.h - 12, 10); ctx.stroke();
    ctx.restore();
    text(ctx, 'SIAP SAJI!', s.x + s.w / 2, s.y + s.h - 12, 14, '#7ed957');
  }
}

function drawTrash(ctx, k) {
  const s = STATIONS.trash;
  stationShell(ctx, s, k.nearest === 'trash', '🗑️ SAMPAH', 'buang gosong / salah');
  ctx.fillStyle = '#5b6b7a';
  rr(ctx, s.x + s.w / 2 - 26, s.y + 22, 52, 52, 8); ctx.fill();
  ctx.fillStyle = '#3d4a56';
  rr(ctx, s.x + s.w / 2 - 30, s.y + 14, 60, 12, 6); ctx.fill();
}

function drawCook(ctx, k) {
  const c = k.cook;
  ctx.save();
  ctx.translate(c.x, c.y);
  // Shadow.
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath(); ctx.ellipse(0, COOK_RADIUS + 4, 24, 8, 0, 0, Math.PI * 2); ctx.fill();
  // Body: white chef coat + apron.
  ctx.fillStyle = '#fdfdfd';
  rr(ctx, -20, -8, 40, 34, 12); ctx.fill();
  ctx.strokeStyle = '#c9c9c9'; ctx.lineWidth = 2;
  rr(ctx, -20, -8, 40, 34, 12); ctx.stroke();
  ctx.fillStyle = '#e2574c';
  rr(ctx, -12, 2, 24, 24, 6); ctx.fill();
  // Head + chef hat.
  ctx.fillStyle = '#ffcf9e';
  ctx.beginPath(); ctx.arc(0, -22, 14, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath(); ctx.arc(-8, -34, 8, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(0, -38, 9, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(8, -34, 8, 0, Math.PI * 2); ctx.fill();
  rr(ctx, -14, -36, 28, 8, 3); ctx.fill();
  // Eyes look the way the cook faces.
  ctx.fillStyle = '#222';
  ctx.beginPath(); ctx.arc(c.facing * 4 - 4, -22, 2, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(c.facing * 4 + 4, -22, 2, 0, Math.PI * 2); ctx.fill();
  // Tray in hand when carrying.
  if (k.tray.length) {
    ctx.fillStyle = '#c9a227';
    rr(ctx, c.facing * 18 - 14, -6, 28, 8, 4); ctx.fill();
    k.tray.forEach((it, i) => drawIngredientIcon(ctx, it.ing, c.facing * 18 - 8 + i * 10, -14, 8, it.state));
  }
  ctx.restore();
}

function drawTrayHud(ctx, k) {
  const x = 24, y = 648;
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  rr(ctx, x - 8, y - 8, 320, 56, 10); ctx.fill();
  text(ctx, 'NAMPAN (maks 3):', x + 4, y + 8, 13, '#ffd94d', 'left');
  if (!k.tray.length) text(ctx, 'kosong — ambil bahan di counter', x + 4, y + 30, 12, '#fff', 'left', 'normal');
  k.tray.forEach((it, i) => {
    const ix = x + 150 + i * 52;
    drawIngredientIcon(ctx, it.ing, ix, y + 26, 15, it.state);
    text(ctx, stateTag(it.state), ix, y + 48, 9, '#fff', 'center', 'normal');
  });
}

function drawOrderBoard(ctx, k) {
  const bx = 24, by = 76, bw = VIEW.w - 48, bh = 104;
  ctx.fillStyle = '#2b1d12';
  rr(ctx, bx, by, bw, bh, 12); ctx.fill();
  ctx.strokeStyle = '#8a5a33'; ctx.lineWidth = 2;
  rr(ctx, bx, by, bw, bh, 12); ctx.stroke();
  text(ctx, '📋 PAPAN PESANAN', bx + 16, by + 18, 16, '#ffd94d', 'left');
  if (!k.orders.length) {
    text(ctx, 'Belum ada pelanggan — pesanan pertama segera datang…', bx + 200, by + 58, 15, '#d9c9a8', 'left', 'normal');
    return;
  }
  const cw = 288, gap = 12;
  k.orders.forEach((o, i) => {
    const recipe = RECIPES.find((r) => r.id === o.recipeId);
    const x = bx + 16 + i * (cw + gap);
    const y = by + 30;
    const ratio = Math.max(0, o.patience / o.maxPatience);
    const urgent = ratio < 0.35;
    ctx.fillStyle = urgent ? '#5b1d1d' : '#fff6d8';
    rr(ctx, x, y, cw, 62, 10); ctx.fill();
    ctx.strokeStyle = urgent ? '#ff6b6b' : '#c9a86a'; ctx.lineWidth = urgent ? 3 : 2;
    rr(ctx, x, y, cw, 62, 10); ctx.stroke();
    drawDishIcon(ctx, recipe, x + 26, y + 22, 18);
    text(ctx, recipe.name, x + 52, y + 12, 14, urgent ? '#fff' : '#5b3a1e', 'left');
    text(ctx, o.customer, x + 52, y + 30, 11, urgent ? '#ffd9d9' : '#8a6a3f', 'left', 'normal');
    // Needed ingredients as mini icons.
    recipe.needs.forEach((need, j) => {
      drawIngredientIcon(ctx, need.ing, x + 200 + j * 26, y + 14, 10, need.state);
    });
    // Patience bar.
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    rr(ctx, x + 10, y + 46, cw - 20, 9, 4); ctx.fill();
    ctx.fillStyle = ratio > 0.5 ? '#7ed957' : ratio > 0.25 ? '#ffd94d' : '#ff6b6b';
    rr(ctx, x + 10, y + 46, (cw - 20) * ratio, 9, 4); ctx.fill();
    text(ctx, `${Math.ceil(o.patience)} dtk`, x + cw - 12, y + 30, 11, urgent ? '#ff6b6b' : '#5b3a1e', 'right');
  });
}

function drawTopBar(ctx, k) {
  ctx.fillStyle = '#1d120a';
  ctx.fillRect(0, 0, VIEW.w, 64);
  text(ctx, 'DAPUR KILAT', 24, 32, 26, '#ffd94d', 'left');
  text(ctx, 'Masak cepat, antar panas-panas!', 250, 36, 13, '#d9c9a8', 'left', 'normal');
  // Day timer — big and central.
  const left = Math.ceil(k.timeLeft);
  const mm = Math.floor(left / 60), ss = String(left % 60).padStart(2, '0');
  const urgent = left <= 20;
  ctx.fillStyle = urgent ? '#ff6b6b' : '#fff6d8';
  rr(ctx, VIEW.w / 2 - 110, 8, 220, 48, 10); ctx.fill();
  text(ctx, `⏱ ${mm}:${ss}`, VIEW.w / 2, 32, 26, urgent ? '#a11' : '#5b3a1e');
  // Score / target / hearts.
  text(ctx, `SKOR ${k.score} / ${TARGET_SCORE}`, VIEW.w - 330, 24, 16, '#fff', 'left');
  text(ctx, `💰 Rp ${k.coins}rb   ✅ ${k.served}   ❌ ${k.failed}/${MAX_FAILED_ORDERS}`, VIEW.w - 330, 46, 13, '#ffd9a0', 'left', 'normal');
  // Day progress bar under the top bar.
  ctx.fillStyle = 'rgba(255,255,255,0.15)';
  ctx.fillRect(0, 64, VIEW.w, 6);
  ctx.fillStyle = '#e2574c';
  ctx.fillRect(0, 64, VIEW.w * k.dayProgress, 6);
}

function drawFloor(ctx, k) {
  // Warm tiled floor.
  ctx.fillStyle = '#c98f4e';
  ctx.fillRect(0, 180, VIEW.w, VIEW.h - 180);
  ctx.strokeStyle = 'rgba(0,0,0,0.08)';
  ctx.lineWidth = 2;
  for (let y = 200; y < VIEW.h; y += 52) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(VIEW.w, y); ctx.stroke(); }
  for (let x = 0; x < VIEW.w; x += 86) { ctx.beginPath(); ctx.moveTo(x, 180); ctx.lineTo(x, VIEW.h); ctx.stroke(); }
  // Wall band with a menu poster.
  ctx.fillStyle = '#7a3b1e';
  ctx.fillRect(0, 180, VIEW.w, 10);
  ctx.fillStyle = '#fff6d8';
  rr(ctx, 1060, 196, 196, 84, 8); ctx.fill();
  text(ctx, 'MENU HARI INI', 1158, 212, 13, '#a11');
  text(ctx, 'Nasi Goreng • Mie Goreng', 1158, 234, 12, '#5b3a1e', 'center', 'normal');
  text(ctx, 'Sate Ayam • Gado-Gado', 1158, 254, 12, '#5b3a1e', 'center', 'normal');
}

function drawHint(ctx, k) {
  if (k.phase !== PHASE.PLAY) return;
  let hint = 'WASD / panah: jalan • E / klik: pakai stasiun • Q: buang • P: jeda';
  if (k.nearest === 'bins') hint = `Ambil ${k.nearBin ? INGREDIENTS[k.nearBin].name : 'bahan'} — tekan E atau klik bin`;
  else if (k.nearest === 'board') hint = k.board ? 'Tahan / tekan E berulang untuk mencincang!' : 'Taruh bahan mentah yang bisa dicincang (ayam / sayur / kacang)';
  else if (k.nearest === 'wok') hint = 'Taruh bahan di wajan — angkat saat MATANG, jangan gosong';
  else if (k.nearest === 'plate') hint = 'Taruh bahan dari nampan ke piring sesuai resep';
  else if (k.nearest === 'serve') hint = 'Antar piring yang sudah cocok dengan pesanan!';
  else if (k.nearest === 'trash') hint = 'Buang bahan gosong atau piring yang salah';
  text(ctx, hint, VIEW.w / 2, VIEW.h - 14, 14, '#fff');
  if (k.flash && k.time < k.flash.until) {
    ctx.font = `bold 15px ${FONT}`;
    const w = ctx.measureText(k.flash.text).width + 36;
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    rr(ctx, VIEW.w / 2 - w / 2, 428, w, 34, 10); ctx.fill();
    text(ctx, k.flash.text, VIEW.w / 2, 446, 15, k.flash.color);
  }
}

function drawTitle(ctx, k) {
  ctx.fillStyle = 'rgba(20,10,4,0.82)';
  ctx.fillRect(0, 0, VIEW.w, VIEW.h);
  text(ctx, '🍳', VIEW.w / 2, 130, 84, '#ffd94d');
  text(ctx, 'DAPUR KILAT', VIEW.w / 2, 220, 64, '#ffd94d');
  text(ctx, 'Warung jalanan paling sibuk di kota — masak, rakit, antar!', VIEW.w / 2, 268, 20, '#fff', 'center', 'normal');
  const lines = [
    '1. Ambil bahan di counter BAHAN MENTAH (E / klik)',
    '2. Cincang ayam, sayur & kacang di TALENAN',
    '3. Masak di WAJAN — angkat sebelum gosong!',
    '4. Rakit di PIRING SAJI sesuai resep, antar di JENDELA SAJI',
    'Capai 300 poin sebelum hari berakhir. 3 pesanan gagal = warung tutup.',
  ];
  lines.forEach((l, i) => text(ctx, l, VIEW.w / 2, 320 + i * 30, 16, '#ffe9a8', 'center', 'normal'));
  const pulse = 1 + Math.sin(performance.now() / 250) * 0.06;
  ctx.save();
  ctx.translate(VIEW.w / 2, 520); ctx.scale(pulse, pulse); ctx.translate(-VIEW.w / 2, -520);
  ctx.fillStyle = '#e2574c';
  rr(ctx, VIEW.w / 2 - 180, 492, 360, 56, 14); ctx.fill();
  text(ctx, '▶  MULAI MASAK  (Enter / klik)', VIEW.w / 2, 521, 20, '#fff');
  ctx.restore();
  text(ctx, 'WASD / panah untuk jalan • klik stasiun untuk menghampiri • suara: WebAudio', VIEW.w / 2, 590, 13, '#d9c9a8', 'center', 'normal');
}

function drawEnd(ctx, k, won) {
  ctx.fillStyle = won ? 'rgba(20,60,20,0.85)' : 'rgba(60,15,10,0.88)';
  ctx.fillRect(0, 0, VIEW.w, VIEW.h);
  text(ctx, won ? '🎉 HARI BERHASIL!' : '😖 WARUNG TUTUP', VIEW.w / 2, 200, 56, won ? '#7ed957' : '#ff6b6b');
  text(ctx, won ? 'Target tercapai — pelanggan pulang kenyang!' : 'Terlalu banyak pesanan gagal / skor di bawah target.', VIEW.w / 2, 260, 20, '#fff', 'center', 'normal');
  text(ctx, `Skor akhir: ${k.score} / ${TARGET_SCORE}    •    Pesanan disajikan: ${k.served}    •    Gagal: ${k.failed}`, VIEW.w / 2, 320, 20, '#ffd94d');
  text(ctx, `Uang hari ini: Rp ${k.coins}rb`, VIEW.w / 2, 360, 18, '#fff', 'center', 'normal');
  ctx.fillStyle = '#e2574c';
  rr(ctx, VIEW.w / 2 - 180, 420, 360, 56, 14); ctx.fill();
  text(ctx, '↻  MASAK LAGI  (Enter / klik)', VIEW.w / 2, 449, 20, '#fff');
}

export function render(ctx, k) {
  ctx.save();
  if (k.shake > 0) ctx.translate((Math.random() - 0.5) * k.shake * 10, (Math.random() - 0.5) * k.shake * 10);
  drawTopBar(ctx, k);
  drawOrderBoard(ctx, k);
  drawFloor(ctx, k);
  drawBins(ctx, k);
  drawBoard(ctx, k);
  drawWok(ctx, k);
  drawPlateArea(ctx, k);
  drawServe(ctx, k);
  drawTrash(ctx, k);
  drawCook(ctx, k);
  drawTrayHud(ctx, k);
  drawHint(ctx, k);
  ctx.restore();
  if (k.phase === PHASE.TITLE) drawTitle(ctx, k);
  else if (k.phase === PHASE.WIN) drawEnd(ctx, k, true);
  else if (k.phase === PHASE.LOSE) drawEnd(ctx, k, false);
  else if (k.paused) {
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, VIEW.w, VIEW.h);
    text(ctx, '⏸ JEDA — tekan P untuk lanjut', VIEW.w / 2, VIEW.h / 2, 32, '#fff');
  }
}
