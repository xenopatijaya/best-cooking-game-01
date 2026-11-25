// Dapur Kilat — game state and rules. One job: the kitchen simulation.
// Orders, the cook, the tray, the chopping board, the wok, the plate and
// the serve window all live here; rendering only reads this state.

import {
  VIEW, DAY_LENGTH_S, TARGET_SCORE, MAX_FAILED_ORDERS, TRAY_CAPACITY,
  WOK_CAPACITY, CHOP_SECONDS, COOK_SECONDS, BURN_SECONDS,
  ORDER_PATIENCE_S, ORDER_SPAWN_START_S, ORDER_SPAWN_END_S,
  MAX_OPEN_ORDERS, SCORE_BASE, SCORE_TIP_MAX, FAIL_PENALTY,
  STATE, INGREDIENTS, RECIPES, CUSTOMER_NAMES,
  STATIONS, BIN_ORDER, BIN_W, BIN_GAP, COOK_START, COOK_SPEED, COOK_RADIUS,
} from './config.js';

export const PHASE = { TITLE: 'title', PLAY: 'play', WIN: 'win', LOSE: 'lose' };

let orderId = 1;

function makeItem(ing, state = STATE.RAW) {
  return { ing, state, chop: 0, cook: 0 };
}

function recipeFor(id) {
  return RECIPES.find((r) => r.id === id);
}

function itemMatchesNeed(item, need) {
  return item.ing === need.ing && item.state === need.state;
}

// Does this plate exactly satisfy the recipe (same multiset of needs)?
export function plateMatchesRecipe(plate, recipe) {
  if (plate.length !== recipe.needs.length) return false;
  const rest = [...recipe.needs];
  for (const item of plate) {
    const i = rest.findIndex((n) => itemMatchesNeed(item, n));
    if (i < 0) return false;
    rest.splice(i, 1);
  }
  return true;
}

function plateMatchesAnyOrder(plate, orders) {
  return orders.find((o) => plateMatchesRecipe(plate, recipeFor(o.recipeId))) || null;
}

export class Kitchen {
  constructor(sound) {
    this.sound = sound;
    this.reset();
  }

  reset() {
    this.phase = PHASE.TITLE;
    this.time = 0; // seconds into the day
    this.score = 0;
    this.coins = 0;
    this.combo = 0;
    this.failed = 0;
    this.served = 0;
    this.orders = [];
    this.spawnTimer = 3.0;
    this.cook = { x: COOK_START.x, y: COOK_START.y, tx: null, ty: null, facing: 1 };
    this.tray = [];
    this.board = null; // item being chopped, or null
    this.wok = []; // items cooking
    this.plate = []; // items assembled on the plate
    this.flash = null; // { text, color, until }
    this.nearest = null; // station key nearest the cook
    this.nearBin = null; // ingredient id when near the bins
    this.paused = false;
    this.shake = 0;
  }

  get timeLeft() { return Math.max(0, DAY_LENGTH_S - this.time); }
  get dayProgress() { return Math.min(1, this.time / DAY_LENGTH_S); }

  spawnInterval() {
    return ORDER_SPAWN_START_S + (ORDER_SPAWN_END_S - ORDER_SPAWN_START_S) * this.dayProgress;
  }

  patienceFor() {
    return ORDER_PATIENCE_S * (1 - 0.25 * this.dayProgress);
  }

  startDay() {
    this.reset();
    this.phase = PHASE.PLAY;
    this.spawnOrder();
    this.spawnOrder();
  }

  spawnOrder() {
    if (this.orders.length >= MAX_OPEN_ORDERS) return;
    const recipe = RECIPES[Math.floor(Math.random() * RECIPES.length)];
    const name = CUSTOMER_NAMES[Math.floor(Math.random() * CUSTOMER_NAMES.length)];
    this.orders.push({
      id: orderId++, recipeId: recipe.id, customer: name,
      patience: this.patienceFor(), maxPatience: this.patienceFor(),
      bornAt: this.time,
    });
    this.sound.ding();
  }

  flashMessage(text, color = '#ffffff') {
    this.flash = { text, color, until: this.time + 1.6 };
  }

  // ---- movement -------------------------------------------------------

  moveCook(dt, input) {
    const v = input.moveVector();
    if (v.x || v.y) {
      this.cook.tx = null; this.cook.ty = null;
      this.cook.x += v.x * COOK_SPEED * dt;
      this.cook.y += v.y * COOK_SPEED * dt;
      if (v.x) this.cook.facing = v.x > 0 ? 1 : -1;
    } else if (this.cook.tx !== null) {
      const dx = this.cook.tx - this.cook.x, dy = this.cook.ty - this.cook.y;
      const d = Math.hypot(dx, dy);
      if (d < 6) { this.cook.tx = null; this.cook.ty = null; }
      else {
        this.cook.x += (dx / d) * COOK_SPEED * dt;
        this.cook.y += (dy / d) * COOK_SPEED * dt;
        this.cook.facing = dx > 0 ? 1 : -1;
      }
    }
    // Keep the cook inside the walkable kitchen floor.
    this.cook.x = Math.max(40, Math.min(VIEW.w - 40, this.cook.x));
    this.cook.y = Math.max(320, Math.min(VIEW.h - 30, this.cook.y));
  }

  // ---- stations --------------------------------------------------------

  stationAt(x, y) {
    for (const [key, s] of Object.entries(STATIONS)) {
      // The cook stands in front of (below) a counter to use it.
      if (x >= s.x - 14 && x <= s.x + s.w + 14 && y >= s.y - 70 && y <= s.y + s.h + 60) return key;
    }
    return null;
  }

  binAt(x, y) {
    const b = STATIONS.bins;
    if (y < b.y - 70 || y > b.y + b.h + 60) return null;
    for (let i = 0; i < BIN_ORDER.length; i++) {
      const bx = b.x + 8 + i * (BIN_W + BIN_GAP);
      if (x >= bx - 6 && x <= bx + BIN_W + 6) return BIN_ORDER[i];
    }
    return null;
  }

  updateNearest() {
    this.nearest = this.stationAt(this.cook.x, this.cook.y);
    this.nearBin = this.nearest === 'bins' ? this.binAt(this.cook.x, this.cook.y) : null;
  }

  // The one interaction key/button: E, Space or a click on a station.
  interact() {
    if (this.phase !== PHASE.PLAY || this.paused) return;
    this.updateNearest();
    const key = this.nearest;
    if (!key) return;
    if (key === 'bins') this.grabIngredient();
    else if (key === 'board') this.useBoard();
    else if (key === 'wok') this.useWok();
    else if (key === 'plate') this.usePlate();
    else if (key === 'serve') this.servePlate();
    else if (key === 'trash') this.useTrash();
  }

  grabIngredient() {
    const ing = this.nearBin || BIN_ORDER[0];
    if (this.tray.length >= TRAY_CAPACITY) { this.flashMessage('Nampan penuh!', '#ffb347'); return; }
    this.tray.push(makeItem(ing));
    this.sound.pickup();
  }

  useBoard() {
    if (this.board) {
      if (this.board.state === STATE.CHOPPED) { this.takeBoardItem(); return; }
      // Mash to chop; progress is added by mashBoard() on each press.
      this.mashBoard();
      return;
    }
    const idx = this.tray.findIndex((it) => INGREDIENTS[it.ing].chop && it.state === STATE.RAW);
    if (idx < 0) { this.flashMessage('Butuh bahan mentah yang bisa dicincang', '#ffb347'); return; }
    this.board = this.tray.splice(idx, 1)[0];
    this.sound.place();
  }

  mashBoard() {
    if (!this.board) return;
    this.board.chop += 1 / (CHOP_SECONDS * 8);
    this.sound.chop();
    if (this.board.chop >= 1) {
      this.board.state = STATE.CHOPPED;
      this.board.chop = 0;
      if (this.tray.length < TRAY_CAPACITY) {
        this.tray.push(this.board);
        this.flashMessage(`${INGREDIENTS[this.board.ing].name} sudah dicincang!`, '#7ed957');
      } else {
        // Tray full: leave it on the board, chopped, ready to pick up later.
        this.flashMessage('Cincangan siap — kosongkan nampan dulu', '#ffb347');
        return;
      }
      this.board = null;
      this.sound.chopDone();
    }
  }

  // Pick a finished chopped item off the board when the tray has room.
  takeBoardItem() {
    if (this.board && this.board.state === STATE.CHOPPED && this.tray.length < TRAY_CAPACITY) {
      this.tray.push(this.board);
      this.board = null;
      this.sound.pickup();
    }
  }

  useWok() {
    // Take out a finished item first if one is ready.
    const ready = this.wok.find((it) => it.state === STATE.COOKED);
    if (ready && this.tray.length < TRAY_CAPACITY) {
      this.wok.splice(this.wok.indexOf(ready), 1);
      this.tray.push(ready);
      this.sound.pickup();
      return;
    }
    if (this.wok.length >= WOK_CAPACITY) { this.flashMessage('Wajan penuh!', '#ffb347'); return; }
    const idx = this.tray.findIndex((it) => INGREDIENTS[it.ing].cook && (it.state === STATE.RAW || it.state === STATE.CHOPPED) && (!INGREDIENTS[it.ing].chop || it.state === STATE.CHOPPED));
    if (idx < 0) { this.flashMessage('Butuh bahan yang harus dimasak', '#ffb347'); return; }
    const item = this.tray.splice(idx, 1)[0];
    item.cook = 0;
    this.wok.push(item);
    this.sound.sizzle();
  }

  usePlate() {
    if (this.tray.length === 0) { this.flashMessage('Nampan kosong — ambil bahan dulu', '#ffb347'); return; }
    // Prefer an item some open order still needs.
    let idx = -1;
    for (let i = 0; i < this.tray.length; i++) {
      const it = this.tray[i];
      const wanted = this.orders.some((o) => recipeFor(o.recipeId).needs.some((n) => itemMatchesNeed(it, n) && !this.plate.some((p) => itemMatchesNeed(p, n))));
      if (wanted) { idx = i; break; }
    }
    if (idx < 0) idx = 0;
    const item = this.tray.splice(idx, 1)[0];
    this.plate.push(item);
    this.sound.place();
    const match = plateMatchesAnyOrder(this.plate, this.orders);
    if (match) this.flashMessage(`Piring cocok: ${recipeFor(match.recipeId).name} — antar ke Jendela Saji!`, '#7ed957');
  }

  servePlate() {
    if (this.plate.length === 0) { this.flashMessage('Piring masih kosong', '#ffb347'); return; }
    const order = plateMatchesAnyOrder(this.plate, this.orders);
    if (!order) {
      this.plate = [];
      this.combo = 0;
      this.sound.fail();
      this.flashMessage('Pesanan salah! Piring dibuang.', '#ff6b6b');
      return;
    }
    const recipe = recipeFor(order.recipeId);
    const patienceRatio = Math.max(0, order.patience / order.maxPatience);
    const tip = Math.round(SCORE_TIP_MAX * patienceRatio);
    const comboBonus = this.combo >= 2 ? 10 * (this.combo - 1) : 0;
    const gained = SCORE_BASE + tip + comboBonus;
    this.score += gained;
    this.coins += recipe.price;
    this.served += 1;
    this.combo += 1;
    this.orders.splice(this.orders.indexOf(order), 1);
    this.plate = [];
    this.sound.serve();
    this.flashMessage(`+${gained} — ${recipe.name} untuk ${order.customer}!${this.combo >= 2 ? ` Kombo x${this.combo}!` : ''}`, '#7ed957');
  }

  useTrash() {
    // Throw away a burnt wok item, a bad plate, or the last tray item.
    const burnt = this.wok.find((it) => it.state === STATE.BURNT);
    if (burnt) { this.wok.splice(this.wok.indexOf(burnt), 1); this.sound.place(); this.flashMessage('Bahan gosong dibuang', '#ffb347'); return; }
    if (this.plate.length) { this.plate = []; this.sound.place(); this.flashMessage('Piring dikosongkan', '#ffb347'); return; }
    if (this.tray.length) { this.tray.pop(); this.sound.place(); this.flashMessage('Bahan dibuang', '#ffb347'); return; }
    this.flashMessage('Tidak ada yang dibuang', '#ffb347');
  }

  // ---- per-frame update -------------------------------------------------

  update(dt, input) {
    if (this.phase !== PHASE.PLAY || this.paused) return;
    this.time += dt;
    this.shake = Math.max(0, this.shake - dt * 3);

    // Orders: spawn, tick patience, expire.
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      this.spawnOrder();
      this.spawnTimer = this.spawnInterval();
    }
    for (let i = this.orders.length - 1; i >= 0; i--) {
      const o = this.orders[i];
      o.patience -= dt;
      if (o.patience <= 0) {
        this.orders.splice(i, 1);
        this.failed += 1;
        this.combo = 0;
        this.sound.fail();
        this.shake = 0.6;
        this.flashMessage(`${o.customer} pergi kecewa — pesanan gagal!`, '#ff6b6b');
        if (this.failed >= MAX_FAILED_ORDERS) { this.endDay(false); return; }
      }
    }

    // Wok: cook, then burn.
    for (const it of this.wok) {
      if (it.state === STATE.BURNT) continue;
      it.cook += dt;
      if (it.cook >= BURN_SECONDS) { it.state = STATE.BURNT; this.sound.fail(); this.flashMessage('Gosong! Buang ke tong sampah', '#ff6b6b'); }
      else if (it.cook >= COOK_SECONDS && it.state !== STATE.COOKED) { it.state = STATE.COOKED; this.sound.cooked(); }
    }

    // Chopping finishes by mashing; holding E also mashes slowly.
    if (this.board && this.board.state === STATE.RAW && (input.keys.has('e') || input.mouse.down)) {
      this.board.chop += dt / CHOP_SECONDS;
      if (this.board.chop >= 1) {
        this.board.state = STATE.CHOPPED;
        this.board.chop = 0;
        this.takeBoardItem();
        if (this.board) this.flashMessage('Cincangan siap di talenan', '#7ed957');
        this.sound.chopDone();
      }
    }

    this.moveCook(dt, input);
    this.updateNearest();

    // Click a station to walk to it and use it on arrival is handled in main;
    // a direct click on the cook's nearest station uses it at once.
    if (input.mouse.clicked) {
      const key = this.stationAt(input.mouse.x, input.mouse.y);
      if (key) {
        const s = STATIONS[key];
        this.cook.tx = Math.max(40, Math.min(VIEW.w - 40, s.x + s.w / 2));
        this.cook.ty = Math.max(320, s.y + s.h + 30);
        this.cook.pendingUse = key;
      } else {
        this.cook.tx = input.mouse.x;
        this.cook.ty = Math.max(320, input.mouse.y);
        this.cook.pendingUse = null;
      }
    }
    if (this.cook.pendingUse && this.nearest === this.cook.pendingUse) {
      this.cook.pendingUse = null;
      this.cook.tx = null; this.cook.ty = null;
      this.interact();
    }

    if (this.timeLeft <= 0) this.endDay(this.score >= TARGET_SCORE);
  }

  endDay(won) {
    this.phase = won ? PHASE.WIN : PHASE.LOSE;
    if (won) this.sound.win(); else this.sound.fail();
  }
}
