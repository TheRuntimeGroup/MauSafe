export type GameMode = "classic" | "zen" | "patrol";
type EntityKind = "fruit" | "bomb" | "scam" | "real";

export interface ArcadeCopy {
  scamTexts: string[];
  realTexts: string[];
  unknown: string;
  trusted: string;
  bomb: string;
  missed: string;
  safeMessage: string;
  scamSliced: string;
  golden: string;
}

interface Entity {
  id: number;
  kind: EntityKind;
  fruit: number;
  golden: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  angle: number;
  spin: number;
  w: number;
  h: number;
  lines: string[];
}

interface Fragment {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  fruit: number;
  golden: boolean;
  side: -1 | 1;
  angle: number;
  spin: number;
  life: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  life: number;
  maxLife: number;
}

interface FloatText {
  x: number;
  y: number;
  text: string;
  color: string;
  life: number;
}

export interface TrailPoint {
  x: number;
  y: number;
  time: number;
}

export interface FruitGame {
  mode: GameMode;
  entities: Entity[];
  fragments: Fragment[];
  particles: Particle[];
  floats: FloatText[];
  trail: TrailPoint[];
  nextId: number;
  score: number;
  lives: number;
  combo: number;
  comboTimer: number;
  elapsed: number;
  timeLeft: number;
  countdown: number;
  spawnTimer: number;
  over: boolean;
  shake: number;
  cue: "slice" | "bad" | "bonus" | null;
  lastPoint: { x: number; y: number } | null;
  pointerActive: boolean;
}

export const MODE_DURATION: Record<GameMode, number> = {
  classic: 45,
  zen: 60,
  patrol: 45,
};

export const FRUITS = [
  { skin: "#166534", flesh: "#F43F5E", accent: "#FECDD3", juice: "#FB7185", shape: "watermelon" },
  { skin: "#EA580C", flesh: "#FB923C", accent: "#FFEDD5", juice: "#FDBA74", shape: "orange" },
  { skin: "#854D0E", flesh: "#84CC16", accent: "#F7FEE7", juice: "#BEF264", shape: "kiwi" },
  { skin: "#CA8A04", flesh: "#FACC15", accent: "#FEF9C3", juice: "#FDE047", shape: "pineapple" },
  { skin: "#C2410C", flesh: "#F97316", accent: "#FFEDD5", juice: "#FB923C", shape: "mango" },
  { skin: "#BE185D", flesh: "#EC4899", accent: "#FBCFE8", juice: "#F472B6", shape: "dragonfruit" },
] as const;

const GRAVITY = 650;

export function createFruitGame(mode: GameMode): FruitGame {
  return {
    mode,
    entities: [],
    fragments: [],
    particles: [],
    floats: [],
    trail: [],
    nextId: 1,
    score: 0,
    lives: mode === "zen" ? 0 : 3,
    combo: 0,
    comboTimer: 0,
    elapsed: 0,
    timeLeft: MODE_DURATION[mode],
    countdown: 3,
    spawnTimer: 0.3,
    over: false,
    shake: 0,
    cue: null,
    lastPoint: null,
    pointerActive: false,
  };
}

function segmentDistance(px: number, py: number, ax: number, ay: number, bx: number, by: number): number {
  const dx = bx - ax;
  const dy = by - ay;
  const length = dx * dx + dy * dy;
  const amount = length === 0 ? 0 : Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / length));
  return Math.hypot(px - (ax + amount * dx), py - (ay + amount * dy));
}

function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const lines: string[] = [];
  let line = "";
  for (const word of text.split(" ")) {
    const test = line ? `${line} ${word}` : word;
    if (line && ctx.measureText(test).width > maxWidth) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines.slice(0, 4);
}

function spawnEntity(game: FruitGame, ctx: CanvasRenderingContext2D, width: number, height: number, copy: ArcadeCopy) {
  const roll = Math.random();
  let kind: EntityKind = "fruit";
  if (game.mode === "classic" && roll < Math.min(0.10, 0.025 + game.elapsed / 700)) kind = "bomb";
  if (game.mode === "patrol" && roll < 0.60) kind = Math.random() < 0.60 ? "scam" : "real";

  const isMessage = kind === "scam" || kind === "real";
  const radius = Math.max(32, Math.min(50, width * 0.06));
  const fruit = Math.floor(Math.random() * FRUITS.length);
  const golden = kind === "fruit" && Math.random() < 0.10;
  let w = radius * 2;
  let h = radius * 2;
  let lines: string[] = [];
  if (isMessage) {
    ctx.font = "700 14px Manrope, system-ui, sans-serif";
    w = Math.min(240, Math.max(170, width * 0.42));
    const pool = kind === "scam" ? copy.scamTexts : copy.realTexts;
    lines = wrapLines(ctx, pool[Math.floor(Math.random() * pool.length)], w - 32);
    h = 46 + lines.length * 19;
  }

  const halfWidth = isMessage ? w / 2 : radius;
  const margin = halfWidth + 18;
  const x = margin + Math.random() * Math.max(1, width - margin * 2);
  game.entities.push({
    id: game.nextId++,
    kind,
    fruit,
    golden,
    x,
    y: height + halfWidth + 24,
    vx: (width / 2 - x) * (0.08 + Math.random() * 0.20) + (Math.random() - 0.5) * width * 0.12,
    vy: -Math.sqrt(2 * 900 * height * (0.74 + Math.random() * 0.28)) * (game.mode === "zen" ? 0.76 : 0.80),
    r: isMessage ? Math.min(w, h) * 0.56 : radius,
    angle: (Math.random() - 0.5) * 0.45,
    spin: (Math.random() - 0.5) * 1.8,
    w,
    h,
    lines,
  });
}

function addJuice(game: FruitGame, x: number, y: number, color: string, amount: number) {
  for (let index = 0; index < amount; index += 1) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 55 + Math.random() * 240;
    const life = 0.45 + Math.random() * 0.4;
    game.particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 55,
      radius: 2 + Math.random() * 5,
      color,
      life,
      maxLife: life,
    });
  }
}

function addFloat(game: FruitGame, entity: Entity, text: string, color = "#FFFFFF") {
  game.floats.push({ x: entity.x, y: entity.y - entity.r * 0.4, text, color, life: 1 });
}

function updateEffects(game: FruitGame, dt: number) {
  for (const fragment of game.fragments) {
    fragment.vy += GRAVITY * 0.85 * dt;
    fragment.x += fragment.vx * dt;
    fragment.y += fragment.vy * dt;
    fragment.angle += fragment.spin * dt;
    fragment.life -= dt;
  }
  game.fragments = game.fragments.filter((fragment) => fragment.life > 0);
  for (const particle of game.particles) {
    particle.vy += GRAVITY * 0.65 * dt;
    particle.x += particle.vx * dt;
    particle.y += particle.vy * dt;
    particle.life -= dt;
  }
  game.particles = game.particles.filter((particle) => particle.life > 0);
  for (const float of game.floats) {
    float.y -= 42 * dt;
    float.life -= dt;
  }
  game.floats = game.floats.filter((float) => float.life > 0);
  game.shake *= Math.exp(-8 * dt);
}

export function stepFruitGame(
  game: FruitGame,
  dt: number,
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  copy: ArcadeCopy,
) {
  game.trail = game.trail.filter((point) => performance.now() - point.time < 170);
  if (game.countdown > 0) {
    game.countdown = Math.max(0, game.countdown - dt);
    updateEffects(game, dt);
    return;
  }

  game.elapsed += dt;
  game.timeLeft = Math.max(0, MODE_DURATION[game.mode] - game.elapsed);
  game.comboTimer -= dt;
  if (game.comboTimer <= 0) game.combo = 0;

  game.spawnTimer -= dt;
  if (game.spawnTimer <= 0) {
    const count = Math.random() < 0.10 ? 3 : Math.random() < 0.45 ? 2 : 1;
    for (let index = 0; index < count; index += 1) spawnEntity(game, ctx, width, height, copy);
    game.spawnTimer = Math.max(0.7, (game.mode === "zen" ? 1.25 : 1.05) - game.elapsed * 0.0025);
  }

  for (const entity of game.entities) {
    entity.vy += GRAVITY * dt;
    entity.x += entity.vx * dt;
    entity.y += entity.vy * dt;
    entity.angle += entity.spin * dt;
    const edge = entity.kind === "scam" || entity.kind === "real" ? entity.w / 2 : entity.r;
    if (entity.x < edge && entity.vx < 0) entity.vx *= -0.85;
    if (entity.x > width - edge && entity.vx > 0) entity.vx *= -0.85;
  }

  const remaining: Entity[] = [];
  for (const entity of game.entities) {
    const missed = entity.y - entity.r > height + 45 && entity.vy > 0;
    if (missed && game.mode === "classic" && entity.kind === "fruit") {
      game.lives -= 1;
      game.combo = 0;
      game.comboTimer = 0;
      game.cue = "bad";
      addFloat(game, entity, copy.missed, "#FDA4AF");
    }
    if (!missed) remaining.push(entity);
  }
  game.entities = remaining;
  updateEffects(game, dt);
  if (game.timeLeft <= 0 || (game.mode !== "zen" && game.lives <= 0)) game.over = true;
}

export function sliceFruitGame(
  game: FruitGame,
  ax: number,
  ay: number,
  bx: number,
  by: number,
  copy: ArcadeCopy,
) {
  if (game.countdown > 0 || game.over) return;
  const slicedIds = new Set<number>();
  for (const entity of game.entities) {
    if (segmentDistance(entity.x, entity.y, ax, ay, bx, by) > entity.r + 5) continue;
    slicedIds.add(entity.id);

    if (entity.kind === "bomb") {
      game.lives -= 1;
      game.combo = 0;
      game.comboTimer = 0;
      game.shake = 24;
      game.cue = "bad";
      addFloat(game, entity, copy.bomb, "#FDA4AF");
      addJuice(game, entity.x, entity.y, "#94A3B8", 18);
      continue;
    }

    if (entity.kind === "real") {
      game.lives -= 1;
      game.combo = 0;
      game.comboTimer = 0;
      game.shake = 16;
      game.cue = "bad";
      addFloat(game, entity, copy.safeMessage, "#FDA4AF");
      addJuice(game, entity.x, entity.y, "#7DD3FC", 12);
      continue;
    }

    game.combo += 1;
    game.comboTimer = 1.45;
    const multiplier = 1 + Math.min(3, Math.floor((game.combo - 1) / 4));
    let points = (entity.kind === "scam" ? 3 : 1) * multiplier;
    if (entity.golden) points += 5;
    game.score += points;
    game.cue = entity.golden || game.combo % 5 === 0 ? "bonus" : "slice";
    game.shake = Math.max(game.shake, entity.golden ? 12 : 4);
    addFloat(game, entity, `+${points}`, entity.golden ? "#FDE047" : "#FFFFFF");

    if (entity.kind === "scam") {
      addFloat(game, { ...entity, y: entity.y + 25 }, copy.scamSliced, "#6EE7B7");
      addJuice(game, entity.x, entity.y, "#34D399", 12);
    } else {
      const fruit = FRUITS[entity.fruit];
      addJuice(game, entity.x, entity.y, entity.golden ? "#FDE047" : fruit.juice, entity.golden ? 24 : 14);
      for (const side of [-1, 1] as const) {
        game.fragments.push({
          x: entity.x,
          y: entity.y,
          vx: entity.vx + side * (80 + Math.random() * 70),
          vy: entity.vy * 0.2 - 70,
          r: entity.r,
          fruit: entity.fruit,
          golden: entity.golden,
          side,
          angle: entity.angle,
          spin: entity.spin + side * 2.5,
          life: 1.25,
        });
      }
      if (entity.golden) addFloat(game, { ...entity, y: entity.y + 32 }, copy.golden, "#FDE047");
    }
  }
  game.entities = game.entities.filter((entity) => !slicedIds.has(entity.id));
  if (game.mode !== "zen" && game.lives <= 0) game.over = true;
}

function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

export function drawFruit(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  fruitIndex: number,
  golden = false,
  angle = 0,
) {
  const fruit = FRUITS[fruitIndex % FRUITS.length];
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.shadowColor = "rgba(0,0,0,0.35)";
  ctx.shadowBlur = radius * 0.35;
  ctx.shadowOffsetY = radius * 0.13;

  if (fruit.shape === "pineapple") {
    ctx.fillStyle = "#65A30D";
    for (const direction of [-1, 0, 1]) {
      ctx.save();
      ctx.rotate(direction * 0.38);
      ctx.beginPath();
      ctx.ellipse(0, -radius * 1.02, radius * 0.18, radius * 0.52, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  ctx.beginPath();
  ctx.ellipse(0, 0, radius * (fruit.shape === "mango" ? 0.86 : 1), radius * (fruit.shape === "pineapple" ? 0.94 : 1), fruit.shape === "mango" ? 0.35 : 0, 0, Math.PI * 2);
  ctx.fillStyle = golden ? "#FBBF24" : fruit.skin;
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.lineWidth = Math.max(2, radius * 0.065);
  ctx.strokeStyle = golden ? "#FEF08A" : "rgba(255,255,255,0.22)";
  ctx.stroke();

  const innerRadius = radius * 0.79;
  ctx.beginPath();
  ctx.arc(0, 0, innerRadius, 0, Math.PI * 2);
  ctx.fillStyle = golden ? "#FDE047" : fruit.flesh;
  ctx.fill();

  if (fruit.shape === "watermelon") {
    ctx.lineWidth = radius * 0.065;
    ctx.strokeStyle = "#DCFCE7";
    ctx.stroke();
    ctx.fillStyle = "#3F2D20";
    for (let index = 0; index < 7; index += 1) {
      const angle = index * 2.4;
      ctx.beginPath();
      ctx.ellipse(Math.cos(angle) * radius * 0.42, Math.sin(angle) * radius * 0.42, radius * 0.045, radius * 0.09, angle, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (fruit.shape === "orange") {
    ctx.strokeStyle = fruit.accent;
    ctx.lineWidth = Math.max(1, radius * 0.035);
    for (let index = 0; index < 8; index += 1) {
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(index * Math.PI / 4) * innerRadius, Math.sin(index * Math.PI / 4) * innerRadius);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.09, 0, Math.PI * 2);
    ctx.fillStyle = fruit.accent;
    ctx.fill();
  } else if (fruit.shape === "kiwi") {
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.22, 0, Math.PI * 2);
    ctx.fillStyle = fruit.accent;
    ctx.fill();
    ctx.fillStyle = "#27331A";
    for (let index = 0; index < 12; index += 1) {
      const angle = index * Math.PI / 6;
      ctx.beginPath();
      ctx.ellipse(Math.cos(angle) * radius * 0.43, Math.sin(angle) * radius * 0.43, 1.3, 2.3, angle, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (fruit.shape === "pineapple") {
    ctx.strokeStyle = "rgba(133,77,14,0.5)";
    ctx.lineWidth = Math.max(1, radius * 0.04);
    for (let index = -3; index <= 3; index += 1) {
      ctx.beginPath();
      ctx.moveTo(-radius, index * radius * 0.3 - radius * 0.5);
      ctx.lineTo(radius, index * radius * 0.3 + radius * 0.5);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-radius, index * radius * 0.3 + radius * 0.5);
      ctx.lineTo(radius, index * radius * 0.3 - radius * 0.5);
      ctx.stroke();
    }
  } else if (fruit.shape === "dragonfruit") {
    ctx.fillStyle = "#FDF2F8";
    for (let index = 0; index < 25; index += 1) {
      const angle = index * 2.4;
      const distance = Math.sqrt(index / 25) * radius * 0.67;
      ctx.beginPath();
      ctx.arc(Math.cos(angle) * distance, Math.sin(angle) * distance, 1.25, 0, Math.PI * 2);
      ctx.fillStyle = "#831843";
      ctx.fill();
    }
  }

  ctx.beginPath();
  ctx.ellipse(-radius * 0.32, -radius * 0.4, radius * 0.16, radius * 0.075, -0.6, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.fill();
  ctx.restore();
}

export function drawFruitBackdrop(ctx: CanvasRenderingContext2D, width: number, height: number) {
  ctx.fillStyle = "#071E26";
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = "#092630";
  for (let x = 0; x < width; x += Math.max(82, width / 12)) ctx.fillRect(x, 0, 2, height);
  ctx.strokeStyle = "rgba(94,234,212,0.075)";
  ctx.lineWidth = 1;
  for (let radius = 100; radius < Math.max(width, height); radius += 110) {
    ctx.beginPath();
    ctx.arc(width / 2, height * 0.52, radius, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.fillStyle = "#0B3036";
  ctx.fillRect(0, height - 18, width, 18);
  ctx.fillStyle = "#134E4A";
  ctx.fillRect(0, height - 18, width, 2);
}

export function drawAttractMode(ctx: CanvasRenderingContext2D, width: number, height: number, now: number) {
  drawFruitBackdrop(ctx, width, height);
  const fruits = [
    { x: 0.1, y: 0.28, r: 52, fruit: 0 },
    { x: 0.88, y: 0.25, r: 42, fruit: 1 },
    { x: 0.82, y: 0.82, r: 62, fruit: 2 },
    { x: 0.12, y: 0.8, r: 46, fruit: 5 },
  ];
  for (const item of fruits) {
    drawFruit(ctx, width * item.x, height * item.y + Math.sin(now / 800 + item.fruit) * 9, item.r, item.fruit, false, now / 5000 + item.fruit);
  }
}

export function drawFruitGame(ctx: CanvasRenderingContext2D, game: FruitGame, width: number, height: number, copy: ArcadeCopy) {
  drawFruitBackdrop(ctx, width, height);
  ctx.save();
  if (game.shake > 0.2) ctx.translate((Math.random() - 0.5) * game.shake, (Math.random() - 0.5) * game.shake);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  for (const entity of game.entities) {
    if (entity.kind === "fruit") {
      drawFruit(ctx, entity.x, entity.y, entity.r, entity.fruit, entity.golden, entity.angle);
      if (entity.golden) {
        ctx.fillStyle = "#FEF9C3";
        ctx.font = `800 ${Math.max(12, entity.r * 0.35)}px Manrope, system-ui, sans-serif`;
        ctx.fillText("BONUS", entity.x, entity.y);
      }
      continue;
    }
    ctx.save();
    ctx.translate(entity.x, entity.y);
    ctx.rotate(entity.angle);
    if (entity.kind === "bomb") {
      ctx.shadowColor = "rgba(251,113,133,0.35)";
      ctx.shadowBlur = 18;
      ctx.fillStyle = "#17202B";
      ctx.beginPath();
      ctx.arc(0, 0, entity.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = "#64748B";
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.strokeStyle = "#A16207";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(entity.r * 0.45, -entity.r * 0.72);
      ctx.quadraticCurveTo(entity.r * 0.85, -entity.r * 1.35, entity.r * 1.05, -entity.r * 0.85);
      ctx.stroke();
      ctx.fillStyle = "#FDE047";
      ctx.beginPath();
      ctx.arc(entity.r * 1.05, -entity.r * 0.85, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#F8FAFC";
      ctx.font = `900 ${entity.r}px Manrope, system-ui, sans-serif`;
      ctx.fillText("!", 0, 2);
    } else {
      const scam = entity.kind === "scam";
      ctx.shadowColor = "rgba(0,0,0,0.3)";
      ctx.shadowBlur = 16;
      roundedRect(ctx, -entity.w / 2, -entity.h / 2, entity.w, entity.h, 18);
      ctx.fillStyle = "#F8FAFC";
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.lineWidth = 3;
      ctx.strokeStyle = scam ? "#F43F5E" : "#14B8A6";
      ctx.stroke();
      roundedRect(ctx, -entity.w / 2 + 12, -entity.h / 2 + 10, entity.w - 24, 22, 11);
      ctx.fillStyle = scam ? "#FFE4E6" : "#CCFBF1";
      ctx.fill();
      ctx.fillStyle = scam ? "#BE123C" : "#0F766E";
      ctx.font = "800 10px Manrope, system-ui, sans-serif";
      ctx.fillText(scam ? copy.unknown : copy.trusted, 0, -entity.h / 2 + 21);
      ctx.fillStyle = "#16303B";
      ctx.font = "700 14px Manrope, system-ui, sans-serif";
      entity.lines.forEach((line, index) => {
        ctx.fillText(line, 0, -entity.h / 2 + 49 + index * 19);
      });
    }
    ctx.restore();
  }

  for (const fragment of game.fragments) {
    ctx.save();
    ctx.globalAlpha = Math.min(1, fragment.life * 1.5);
    ctx.translate(fragment.x, fragment.y);
    ctx.rotate(fragment.angle);
    ctx.beginPath();
    if (fragment.side === -1) ctx.rect(-fragment.r * 1.25, -fragment.r * 1.7, fragment.r * 1.25, fragment.r * 3.4);
    else ctx.rect(0, -fragment.r * 1.7, fragment.r * 1.25, fragment.r * 3.4);
    ctx.clip();
    drawFruit(ctx, 0, 0, fragment.r, fragment.fruit, fragment.golden);
    ctx.restore();
  }

  ctx.globalAlpha = 1;
  for (const particle of game.particles) {
    ctx.globalAlpha = Math.max(0, particle.life / particle.maxLife);
    ctx.fillStyle = particle.color;
    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
    ctx.fill();
  }

  if (game.trail.length > 1) {
    ctx.globalAlpha = 1;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.shadowColor = "#A7F3D0";
    ctx.shadowBlur = 18;
    ctx.strokeStyle = "rgba(167,243,208,0.45)";
    ctx.lineWidth = 12;
    ctx.beginPath();
    ctx.moveTo(game.trail[0].x, game.trail[0].y);
    for (const point of game.trail.slice(1)) ctx.lineTo(point.x, point.y);
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 3;
    ctx.stroke();
  }

  for (const float of game.floats) {
    ctx.globalAlpha = Math.min(1, float.life * 1.5);
    ctx.font = "900 23px Manrope, system-ui, sans-serif";
    ctx.lineWidth = 5;
    ctx.strokeStyle = "rgba(3,20,27,0.6)";
    ctx.strokeText(float.text, float.x, float.y);
    ctx.fillStyle = float.color;
    ctx.fillText(float.text, float.x, float.y);
  }
  ctx.restore();
  ctx.globalAlpha = 1;
}
