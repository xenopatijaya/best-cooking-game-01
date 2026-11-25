// Dapur Kilat — keyboard and mouse input. One job: turn raw events into
// a small, frame-stable input state the game loop reads.

export class Input {
  constructor(canvas) {
    this.keys = new Set();
    this.pressed = new Set(); // keys pressed since last frame was consumed
    this.mouse = { x: 0, y: 0, clicked: false, down: false };
    this.canvas = canvas;

    window.addEventListener('keydown', (e) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) e.preventDefault();
      if (!e.repeat) this.pressed.add(e.key.toLowerCase());
      this.keys.add(e.key.toLowerCase());
    });
    window.addEventListener('keyup', (e) => this.keys.delete(e.key.toLowerCase()));

    const toGame = (e) => {
      const r = canvas.getBoundingClientRect();
      return { x: (e.clientX - r.left) * (canvas.width / r.width), y: (e.clientY - r.top) * (canvas.height / r.height) };
    };
    canvas.addEventListener('pointermove', (e) => { const p = toGame(e); this.mouse.x = p.x; this.mouse.y = p.y; });
    canvas.addEventListener('pointerdown', (e) => {
      const p = toGame(e);
      this.mouse.x = p.x; this.mouse.y = p.y;
      this.mouse.down = true; this.mouse.clicked = true;
    });
    window.addEventListener('pointerup', () => { this.mouse.down = false; });
  }

  // Movement vector from WASD or arrow keys, normalised.
  moveVector() {
    let x = 0, y = 0;
    if (this.keys.has('a') || this.keys.has('arrowleft')) x -= 1;
    if (this.keys.has('d') || this.keys.has('arrowright')) x += 1;
    if (this.keys.has('w') || this.keys.has('arrowup')) y -= 1;
    if (this.keys.has('s') || this.keys.has('arrowdown')) y += 1;
    if (x && y) { x *= Math.SQRT1_2; y *= Math.SQRT1_2; }
    return { x, y };
  }

  wasPressed(...keys) {
    return keys.some((k) => this.pressed.has(k));
  }

  // Call at the end of each frame so a press is only seen once.
  endFrame() {
    this.pressed.clear();
    this.mouse.clicked = false;
  }
}
