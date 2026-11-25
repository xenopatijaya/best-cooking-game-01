// Dapur Kilat — tuning, recipes and ingredient data.
// One job: every number and name the rest of the game reads.

export const VIEW = { w: 1280, h: 720 };

export const DAY_LENGTH_S = 150;
export const TARGET_SCORE = 300;
export const MAX_FAILED_ORDERS = 3;
export const TRAY_CAPACITY = 3;
export const WOK_CAPACITY = 2;

export const CHOP_SECONDS = 1.6; // seconds of mashing to finish a chop
export const COOK_SECONDS = 4.0; // wok time until perfectly cooked
export const BURN_SECONDS = 8.5; // wok time until the item burns

export const ORDER_PATIENCE_S = 48;
export const ORDER_SPAWN_START_S = 11;
export const ORDER_SPAWN_END_S = 7;
export const MAX_OPEN_ORDERS = 4;

export const SCORE_BASE = 50;
export const SCORE_TIP_MAX = 30;
export const FAIL_PENALTY = 10;

// Ingredient states an item can be in while it travels the kitchen.
export const STATE = { RAW: 'raw', CHOPPED: 'chopped', COOKED: 'cooked', BURNT: 'burnt' };

// prep: what a raw ingredient needs before it may go on a plate.
export const INGREDIENTS = {
  nasi:   { name: 'Nasi',   color: '#fff3d6', dark: '#c9a86a', prep: ['cook'],       chop: false, cook: true,  icon: 'rice' },
  mie:    { name: 'Mie',    color: '#ffd94d', dark: '#b98a1d', prep: ['cook'],       chop: false, cook: true,  icon: 'noodle' },
  ayam:   { name: 'Ayam',   color: '#ff9d6b', dark: '#a34d1d', prep: ['chop', 'cook'], chop: true, cook: true, icon: 'chicken' },
  telur:  { name: 'Telur',  color: '#ffe9a8', dark: '#b98a1d', prep: ['cook'],       chop: false, cook: true,  icon: 'egg' },
  sayur:  { name: 'Sayur',  color: '#7ed957', dark: '#2f7d32', prep: ['chop'],       chop: true,  cook: false, icon: 'veg' },
  kecap:  { name: 'Kecap',  color: '#5b3a1e', dark: '#2e1c0e', prep: [],              chop: false, cook: false, icon: 'sauce' },
  kacang: { name: 'Kacang', color: '#d9a066', dark: '#7a4a1d', prep: ['chop'],       chop: true,  cook: false, icon: 'peanut' },
};

// A dish is the list of ingredient states the plate must hold.
export const RECIPES = [
  {
    id: 'nasi-goreng', name: 'Nasi Goreng', price: 50, color: '#e2574c',
    needs: [ { ing: 'nasi', state: STATE.COOKED }, { ing: 'telur', state: STATE.COOKED }, { ing: 'kecap', state: STATE.RAW } ],
  },
  {
    id: 'mie-goreng', name: 'Mie Goreng', price: 50, color: '#f2a541',
    needs: [ { ing: 'mie', state: STATE.COOKED }, { ing: 'sayur', state: STATE.CHOPPED }, { ing: 'telur', state: STATE.COOKED } ],
  },
  {
    id: 'sate-ayam', name: 'Sate Ayam', price: 60, color: '#c96a2e',
    needs: [ { ing: 'ayam', state: STATE.COOKED }, { ing: 'kecap', state: STATE.RAW }, { ing: 'sayur', state: STATE.CHOPPED } ],
  },
  {
    id: 'gado-gado', name: 'Gado-Gado', price: 60, color: '#7ed957',
    needs: [ { ing: 'sayur', state: STATE.CHOPPED }, { ing: 'telur', state: STATE.COOKED }, { ing: 'kacang', state: STATE.CHOPPED } ],
  },
];

export const CUSTOMER_NAMES = ['Bu Sari', 'Pak Budi', 'Mbak Rina', 'Mas Joko', 'Bu Ani', 'Pak Slamet', 'Dek Putri', 'Mas Agus'];

// Kitchen layout, in canvas pixels. Stations are rectangles the cook walks up to.
export const STATIONS = {
  bins:   { x: 24,  y: 196, w: 420, h: 96,  label: 'Bahan Mentah' },
  board:  { x: 500, y: 196, w: 220, h: 96,  label: 'Talenan' },
  wok:    { x: 776, y: 196, w: 240, h: 96,  label: 'Wajan' },
  plate:  { x: 300, y: 520, w: 480, h: 110, label: 'Piring Saji' },
  serve:  { x: 860, y: 520, w: 200, h: 110, label: 'Jendela Saji' },
  trash:  { x: 1120, y: 520, w: 136, h: 110, label: 'Tong Sampah' },
};

// One bin per ingredient along the ingredient counter, left to right.
export const BIN_ORDER = ['nasi', 'mie', 'ayam', 'telur', 'sayur', 'kecap', 'kacang'];
export const BIN_W = 56;
export const BIN_GAP = 4;

export const COOK_START = { x: 640, y: 430 };
export const COOK_SPEED = 260; // px per second
export const COOK_RADIUS = 26;
