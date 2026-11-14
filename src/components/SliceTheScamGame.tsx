import { useCallback, useEffect, useRef, useState } from "react";
import { Ban, Crown, Heart, LoaderCircle, MapPin, Play, RefreshCw, Sparkles, Trophy, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useI18n } from "@/i18n/I18nContext";
import { DISTRICTS } from "@/lib/community";
import { cn } from "@/lib/utils";

type MsgKind = "scam" | "real";

interface Msg {
  id: number;
  kind: MsgKind;
  lines: string[];
  w: number;
  h: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  rot: number;
  rotV: number;
  sliced: boolean;
  nearMissed: boolean;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  size: number;
  color: string;
}

interface FloatText {
  x: number;
  y: number;
  text: string;
  life: number;
  color: string;
}

interface SliceFx {
  x: number;
  y: number;
  angle: number;
  life: number;
}

interface TrailPoint {
  x: number;
  y: number;
}

interface GameState {
  msgs: Msg[];
  particles: Particle[];
  floats: FloatText[];
  slices: SliceFx[];
  trail: TrailPoint[];
  scamTexts: string[];
  realTexts: string[];
  nextId: number;
  score: number;
  lives: number;
  combo: number;
  comboTimer: number;
  elapsed: number;
  spawnTimer: number;
  slowUntil: number;
  goldUntil: number;
  shake: number;
  verifyUses: number;
  blockUses: number;
  pointerActive: boolean;
  lastPoint: { x: number; y: number } | null;
  over: boolean;
}

interface Hud {
  score: number;
  lives: number;
  combo: number;
  gold: boolean;
  slow: boolean;
  verifyUses: number;
  blockUses: number;
}

const MAX_LIVES = 3;
const START_USES = 2;
const COMBO_WINDOW = 1.6;
const GOLD_DURATION = 3.5;
const GRAVITY = 520;
const LINE_HEIGHT = 18;
const FONT_SIZE = 15;
const PADDING = 13;
const DISTRICT_KEY = "mausafe.kids.district";

function todayLocal(): string {
  const d = new Date();
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width <= maxWidth || !line) {
      line = test;
    } else {
      lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function makeMessage(
  g: GameState,
  ctx: CanvasRenderingContext2D,
  kind: MsgKind,
  text: string,
  width: number,
  height: number,
): Msg {
  ctx.font = `700 ${FONT_SIZE}px system-ui, -apple-system, "Segoe UI", sans-serif`;
  const maxText = Math.min(width * 0.78, 240);
  const lines = wrapLines(ctx, text, maxText);
  let longest = 0;
  for (const l of lines) longest = Math.max(longest, ctx.measureText(l).width);
  const w = Math.max(96, Math.min(longest + PADDING * 2, width - 20));
  const h = lines.length * LINE_HEIGHT + PADDING * 2;
  const difficulty = Math.min(1, g.elapsed / 120);
  const speed = 320 + Math.random() * 200 + difficulty * 130;
  const margin = w / 2 + 14;
  const x = margin + Math.random() * Math.max(0, width - margin * 2);
  return {
    id: g.nextId++,
    kind,
    lines,
    w,
    h,
    x,
    y: height + h / 2 + 12,
    vx: (Math.random() - 0.5) * 280,
    vy: -speed,
    rot: (Math.random() - 0.5) * 0.5,
    rotV: (Math.random() - 0.5) * 2.4,
    sliced: false,
    nearMissed: false,
  };
}

function segDist(px: number, py: number, ax: number, ay: number, bx: number, by: number): number {
  const dx = bx - ax;
  const dy = by - ay;
  const l2 = dx * dx + dy * dy;
  let t = l2 === 0 ? 0 : ((px - ax) * dx + (py - ay) * dy) / l2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

function roundedRectPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

export function SliceTheScamGame() {
  const { t } = useI18n();
  const { user } = useAuth();
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const sizeRef = useRef({ w: 0, h: 0 });
  const gameRef = useRef<GameState | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastRef = useRef(0);
  const hudRef = useRef<Hud>({ score: 0, lives: MAX_LIVES, combo: 0, gold: false, slow: false, verifyUses: START_USES, blockUses: START_USES });
  const configRef = useRef({ t, user, district: "" });
  const tickRef = useRef<(now: number) => void>(() => {});

  const [phase, setPhase] = useState<"idle" | "playing" | "over">("idle");
  const [hud, setHud] = useState<Hud>(hudRef.current);
  const [district, setDistrict] = useState<string>(() => {
    try {
      return localStorage.getItem(DISTRICT_KEY) ?? DISTRICTS[0];
    } catch {
      return DISTRICTS[0];
    }
  });
  const [leaderboard, setLeaderboard] = useState<{ user_id: string; score: number }[]>([]);
  const [bestToday, setBestToday] = useState(0);
  const [loadingBoard, setLoadingBoard] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newHigh, setNewHigh] = useState(false);
  const [finalScore, setFinalScore] = useState(0);

  configRef.current = { t, user, district };

  const loadLeaderboard = useCallback(async () => {
    if (!user) return;
    setLoadingBoard(true);
    const today = todayLocal();
    const [board, own] = await Promise.all([
      supabase
        .from("kid_scam_scores")
        .select("user_id,score")
        .eq("district", district)
        .eq("played_on", today)
        .order("score", { ascending: false })
        .limit(6),
      supabase
        .from("kid_scam_scores")
        .select("score")
        .eq("user_id", user.id)
        .eq("district", district)
        .eq("played_on", today)
        .maybeSingle(),
    ]);
    setLeaderboard((board.data ?? []) as { user_id: string; score: number }[]);
    setBestToday((own.data as { score: number } | null)?.score ?? 0);
    setLoadingBoard(false);
  }, [district, user]);

  useEffect(() => { void loadLeaderboard(); }, [loadLeaderboard]);

  const syncHud = useCallback(() => {
    const g = gameRef.current;
    if (!g) return;
    const now = performance.now();
    const next: Hud = {
      score: g.score,
      lives: g.lives,
      combo: g.combo,
      gold: now < g.goldUntil,
      slow: now < g.slowUntil,
      verifyUses: g.verifyUses,
      blockUses: g.blockUses,
    };
    const prev = hudRef.current;
    if (
      next.score !== prev.score || next.lives !== prev.lives || next.combo !== prev.combo ||
      next.gold !== prev.gold || next.slow !== prev.slow || next.verifyUses !== prev.verifyUses ||
      next.blockUses !== prev.blockUses
    ) {
      hudRef.current = next;
      setHud(next);
    }
  }, []);

  const saveScore = useCallback(async (score: number) => {
    const { user: currentUser, district: currentDistrict } = configRef.current;
    if (!currentUser) return;
    setSaving(true);
    setNewHigh(false);
    try {
      const today = todayLocal();
      const { data: existing } = await supabase
        .from("kid_scam_scores")
        .select("score")
        .eq("user_id", currentUser.id)
        .eq("district", currentDistrict)
        .eq("played_on", today)
        .maybeSingle();
      const previous = (existing as { score: number } | null)?.score ?? 0;
      const best = Math.max(score, previous);
      setNewHigh(score > 0 && score > previous);
      const { error } = await supabase.from("kid_scam_scores").upsert(
        { user_id: currentUser.id, district: currentDistrict, played_on: today, score: best, updated_at: new Date().toISOString() },
        { onConflict: "user_id,district,played_on" },
      );
      if (error) throw error;
      await loadLeaderboard();
    } catch {
      // The score screen still works even if the network save fails.
    } finally {
      setSaving(false);
    }
  }, [loadLeaderboard]);

  const finishGame = useCallback(() => {
    const g = gameRef.current;
    if (!g) return;
    g.over = true;
    setFinalScore(g.score);
    setPhase("over");
    void saveScore(g.score);
  }, [saveScore]);

  const startGame = useCallback(() => {
    const ctx = ctxRef.current;
    const { w, h } = sizeRef.current;
    if (!ctx) return;
    const { t: currentT } = configRef.current;
    const g: GameState = {
      msgs: [],
      particles: [],
      floats: [],
      slices: [],
      trail: [],
      scamTexts: [1, 2, 3, 4, 5, 6].map((n) => currentT(`slice.scam.${n}`)),
      realTexts: [1, 2, 3, 4, 5].map((n) => currentT(`slice.real.${n}`)),
      nextId: 1,
      score: 0,
      lives: MAX_LIVES,
      combo: 0,
      comboTimer: 0,
      elapsed: 0,
      spawnTimer: 0.4,
      slowUntil: 0,
      goldUntil: 0,
      shake: 0,
      verifyUses: START_USES,
      blockUses: START_USES,
      pointerActive: false,
      lastPoint: null,
      over: false,
    };
    // Start with a couple of easy, guaranteed-real messages so kids learn the risk early.
    for (let i = 0; i < 2; i++) {
      g.msgs.push(makeMessage(g, ctx, "real", g.realTexts[i % g.realTexts.length], w, h));
      g.msgs[i].y = h + g.msgs[i].h / 2 + 60 + i * 90;
    }
    gameRef.current = g;
    hudRef.current = { score: 0, lives: MAX_LIVES, combo: 0, gold: false, slow: false, verifyUses: START_USES, blockUses: START_USES };
    setHud(hudRef.current);
    setFinalScore(0);
    setNewHigh(false);
    setPhase("playing");
    lastRef.current = performance.now();
  }, []);

  const useVerify = useCallback(() => {
    const g = gameRef.current;
    if (!g || g.over || g.verifyUses <= 0) return;
    g.verifyUses -= 1;
    g.slowUntil = Math.max(g.slowUntil, performance.now() + 3000);
    g.floats.push({ x: sizeRef.current.w / 2, y: sizeRef.current.h * 0.42, text: configRef.current.t("slice.verify"), life: 1.1, color: "#7DD3FC" });
    syncHud();
  }, [syncHud]);

  const useBlock = useCallback(() => {
    const g = gameRef.current;
    if (!g || g.over || g.blockUses <= 0) return;
    g.blockUses -= 1;
    const cleared = g.msgs.filter((m) => m.kind === "scam" && !m.sliced);
    for (const m of cleared) {
      m.sliced = true;
      g.score += 1;
      for (let i = 0; i < 8; i++) {
        const a = Math.random() * Math.PI * 2;
        const sp = 90 + Math.random() * 220;
        g.particles.push({ x: m.x, y: m.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 0.7, size: 3 + Math.random() * 4, color: "#F7C600" });
      }
    }
    g.msgs = g.msgs.filter((m) => !m.sliced);
    g.floats.push({ x: sizeRef.current.w / 2, y: sizeRef.current.h * 0.42, text: configRef.current.t("slice.block"), life: 1.1, color: "#A5B4FC" });
    g.shake = Math.max(g.shake, 10);
    syncHud();
  }, [syncHud]);

  const onSpawn = useCallback((g: GameState, ctx: CanvasRenderingContext2D) => {
    const { w, h } = sizeRef.current;
    const kind: MsgKind = Math.random() < 0.68 ? "scam" : "real";
    const pool = kind === "scam" ? g.scamTexts : g.realTexts;
    const text = pool[Math.floor(Math.random() * pool.length)];
    g.msgs.push(makeMessage(g, ctx, kind, text, w, h));
  }, []);

  const stepGame = useCallback((g: GameState, dt: number, now: number) => {
    g.elapsed += dt;
    g.comboTimer -= dt;
    if (g.comboTimer <= 0) g.combo = 0;

    const slowActive = now < g.slowUntil;
    const ts = slowActive ? 0.35 : 1;
    const difficulty = Math.min(1, g.elapsed / 120);

    g.spawnTimer -= dt;
    if (g.spawnTimer <= 0) {
      onSpawn(g, ctxRef.current!);
      g.spawnTimer = Math.max(0.38, 0.95 - g.elapsed * 0.005);
    }

    for (const m of g.msgs) {
      m.vy += GRAVITY * ts * dt;
      m.x += m.vx * ts * dt;
      m.y += m.vy * ts * dt;
      m.rot += m.rotV * ts * dt;
    }
    g.msgs = g.msgs.filter((m) => !m.sliced && m.y - m.h < sizeRef.current.h + 40 && m.y + m.h > -40);

    for (const p of g.particles) {
      p.vy += GRAVITY * 0.8 * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
    }
    g.particles = g.particles.filter((p) => p.life > 0);

    for (const f of g.floats) {
      f.y -= 34 * dt;
      f.life -= dt;
    }
    g.floats = g.floats.filter((f) => f.life > 0);

    for (const s of g.slices) s.life -= dt;
    g.slices = g.slices.filter((s) => s.life > 0);

    g.shake = g.shake * Math.exp(-7 * dt);
    if (g.lives <= 0) g.over = true;

    void difficulty;
  }, [onSpawn]);

  const draw = useCallback((g: GameState, ctx: CanvasRenderingContext2D, w: number, h: number, now: number) => {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#1E1B4B";
    ctx.fillRect(0, 0, w, h);

    ctx.save();
    if (g.shake > 0.2) {
      ctx.translate((Math.random() - 0.5) * g.shake, (Math.random() - 0.5) * g.shake);
    }

    ctx.fillStyle = "rgba(255,255,255,0.10)";
    for (let i = 0; i < 18; i++) {
      const sx = (i * 83 + 31) % w;
      const sy = (i * 137 + 47) % h;
      ctx.beginPath();
      ctx.arc(sx, sy, 1.4, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    for (const m of g.msgs) {
      ctx.save();
      ctx.translate(m.x, m.y);
      ctx.rotate(m.rot);
      const fill = m.kind === "scam" ? "#E11D48" : "#059669";
      const border = m.kind === "scam" ? "#9F1239" : "#047857";
      ctx.shadowColor = m.kind === "scam" ? "rgba(225,29,72,0.45)" : "rgba(5,150,105,0.45)";
      ctx.shadowBlur = 14;
      roundedRectPath(ctx, -m.w / 2, -m.h / 2, m.w, m.h, 16);
      ctx.fillStyle = fill;
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = border;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = "#FFFFFF";
      ctx.font = `700 ${FONT_SIZE}px system-ui, -apple-system, "Segoe UI", sans-serif`;
      const startY = -((m.lines.length - 1) * LINE_HEIGHT) / 2;
      m.lines.forEach((line, i) => ctx.fillText(line, 0, startY + i * LINE_HEIGHT));
      ctx.restore();
    }

    for (const p of g.particles) {
      ctx.globalAlpha = Math.max(0, Math.min(1, p.life / 0.7));
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    for (const s of g.slices) {
      ctx.globalAlpha = Math.max(0, Math.min(1, s.life / 0.28));
      ctx.strokeStyle = "#FFFFFF";
      ctx.lineWidth = 4;
      ctx.lineCap = "round";
      ctx.beginPath();
      const r = 34;
      ctx.moveTo(s.x - Math.cos(s.angle) * r, s.y - Math.sin(s.angle) * r);
      ctx.lineTo(s.x + Math.cos(s.angle) * r, s.y + Math.sin(s.angle) * r);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    for (const f of g.floats) {
      ctx.globalAlpha = Math.max(0, Math.min(1, f.life));
      ctx.font = "800 17px system-ui, -apple-system, 'Segoe UI', sans-serif";
      ctx.strokeStyle = "rgba(0,0,0,0.35)";
      ctx.lineWidth = 4;
      ctx.strokeText(f.text, f.x, f.y);
      ctx.fillStyle = f.color;
      ctx.fillText(f.text, f.x, f.y);
    }
    ctx.globalAlpha = 1;

    if (g.trail.length > 1) {
      ctx.strokeStyle = "rgba(255,255,255,0.7)";
      ctx.lineWidth = 3;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(g.trail[0].x, g.trail[0].y);
      for (let i = 1; i < g.trail.length; i++) ctx.lineTo(g.trail[i].x, g.trail[i].y);
      ctx.stroke();
    }

    const goldActive = now < g.goldUntil;
    if (goldActive) {
      ctx.fillStyle = "rgba(247,198,0,0.10)";
      ctx.fillRect(0, 0, w, h);
    }

    ctx.restore();
  }, []);

  useEffect(() => {
    tickRef.current = (now: number) => {
      const g = gameRef.current;
      const ctx = ctxRef.current;
      const { w, h } = sizeRef.current;
      if (!g || !ctx || w === 0 || h === 0) return;
      let dt = (now - lastRef.current) / 1000;
      lastRef.current = now;
      if (dt < 0) dt = 0;
      if (dt > 0.05) dt = 0.05;
      if (phase === "playing" && !g.over) {
        stepGame(g, dt, now);
        if (g.over) {
          finishGame();
          return;
        }
      }
      draw(g, ctx, w, h, now);
      syncHud();
    };
  }, [phase, stepGame, draw, syncHud, finishGame]);

  useEffect(() => {
    const loop = (now: number) => {
      tickRef.current(now);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;
    const resize = () => {
      const rect = wrap.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
      const ctx = canvas.getContext("2d");
      ctxRef.current = ctx;
      if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      sizeRef.current = { w: rect.width, h: rect.height };
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);
    return () => ro.disconnect();
  }, []);

  const getPos = (e: React.PointerEvent) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const sliceAt = useCallback((g: GameState, ax: number, ay: number, bx: number, by: number, now: number) => {
    const { t: currentT } = configRef.current;
    for (const m of g.msgs) {
      if (m.sliced) continue;
      const r = m.h * 0.72;
      const d = segDist(m.x, m.y, ax, ay, bx, by);
      if (d <= r) {
        m.sliced = true;
        if (m.kind === "scam") {
          g.combo += 1;
          g.comboTimer = COMBO_WINDOW;
          const goldActive = now < g.goldUntil;
          const gained = g.combo * (goldActive ? 2 : 1);
          g.score += gained;
          g.floats.push({ x: m.x, y: m.y, text: `+${gained}`, life: 0.8, color: goldActive ? "#FDE047" : "#FFFFFF" });
          g.floats.push({ x: m.x, y: m.y - 22, text: currentT("slice.slicedScam"), life: 0.7, color: "#FDA4AF" });
          g.slices.push({ x: m.x, y: m.y, angle: Math.atan2(by - ay, bx - ax), life: 0.28 });
          g.shake = Math.max(g.shake, 5 + Math.min(10, g.combo));
          for (let i = 0; i < 8; i++) {
            const a = Math.random() * Math.PI * 2;
            const sp = 90 + Math.random() * 240;
            g.particles.push({ x: m.x, y: m.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 0.7, size: 3 + Math.random() * 4, color: "#F7C600" });
          }
          if (g.combo > 0 && g.combo % 5 === 0) {
            g.goldUntil = now + GOLD_DURATION * 1000;
            g.floats.push({ x: m.x, y: m.y - 46, text: `✨ ${currentT("slice.combo", { n: g.combo })}`, life: 1.4, color: "#FDE047" });
            g.shake = Math.max(g.shake, 14);
          }
        } else {
          g.lives -= 1;
          g.combo = 0;
          g.comboTimer = 0;
          g.shake = Math.max(g.shake, 22);
          g.slowUntil = Math.max(g.slowUntil, now + 500);
          g.floats.push({ x: m.x, y: m.y, text: currentT("slice.slicedReal"), life: 1.2, color: "#F87171" });
          g.particles.push({ x: m.x, y: m.y, vx: 0, vy: 0, life: 0.6, size: 18, color: "#FCA5A5" });
        }
      } else if (m.kind === "scam" && !m.nearMissed && d <= r * 1.9) {
        m.nearMissed = true;
        g.slowUntil = Math.max(g.slowUntil, now + 420);
        g.floats.push({ x: m.x, y: m.y - 18, text: currentT("slice.nearMiss"), life: 0.8, color: "#93C5FD" });
      }
    }
    g.msgs = g.msgs.filter((m) => !m.sliced);
  }, []);

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const g = gameRef.current;
    if (!g || phase !== "playing" || g.over) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    const p = getPos(e);
    g.pointerActive = true;
    g.lastPoint = p;
    g.trail = [{ x: p.x, y: p.y }];
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const g = gameRef.current;
    if (!g || !g.pointerActive || phase !== "playing" || g.over) return;
    const p = getPos(e);
    if (g.lastPoint) {
      sliceAt(g, g.lastPoint.x, g.lastPoint.y, p.x, p.y, performance.now());
    }
    g.lastPoint = p;
    g.trail.push({ x: p.x, y: p.y });
    if (g.trail.length > 14) g.trail.shift();
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const g = gameRef.current;
    if (!g) return;
    g.pointerActive = false;
    g.lastPoint = null;
    g.trail = [];
  };

  const hearts = Array.from({ length: MAX_LIVES });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 font-display text-xl font-extrabold text-foreground">
            <Sparkles className="h-5 w-5 text-amber-500" aria-hidden="true" />
            {t("slice.title")}
          </h2>
          <p className="mt-1 max-w-xl text-sm leading-relaxed text-muted-foreground">{t("slice.subtitle")}</p>
        </div>
      </div>

      <div className="rounded-[1.75rem] border border-[#DDE6ED] bg-card p-4 shadow-premium sm:p-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-xs font-bold text-primary">
            <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
            {t("slice.district")}
          </span>
          <select
            value={district}
            onChange={(e) => {
              const next = e.target.value;
              setDistrict(next);
              try { localStorage.setItem(DISTRICT_KEY, next); } catch { /* ignore */ }
            }}
            className="h-10 rounded-xl border border-input bg-white px-3 text-sm font-semibold text-foreground focus:border-primary focus:outline-none"
            aria-label={t("slice.district")}
          >
            {DISTRICTS.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
          <span className="ml-auto text-xs font-semibold text-muted-foreground">{t("slice.resetDaily")}</span>
        </div>

        <div
          ref={wrapRef}
          className="relative mt-4 h-[26rem] overflow-hidden rounded-[1.5rem] border border-indigo-900/60 bg-[#1E1B4B] sm:h-[30rem]"
        >
          <canvas
            ref={canvasRef}
            className="absolute inset-0 h-full w-full touch-none"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onPointerLeave={handlePointerUp}
          />

          <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-3 p-4">
            <div className="rounded-2xl bg-black/30 px-3 py-2 backdrop-blur-sm">
              <p className="text-[10px] font-bold uppercase tracking-wide text-white/70">{t("slice.score")}</p>
              <p className="font-display text-2xl font-extrabold leading-none text-white">{hud.score}</p>
            </div>
            <div className="flex items-center gap-1 rounded-2xl bg-black/30 px-3 py-2 backdrop-blur-sm">
              {hearts.map((_, i) => (
                <Heart key={i} className={cn("h-5 w-5", i < hud.lives ? "text-rose-400" : "text-white/20")} fill={i < hud.lives ? "currentColor" : "none"} aria-hidden="true" />
              ))}
            </div>
            {hud.combo > 1 && (
              <div className="rounded-2xl bg-black/30 px-3 py-2 backdrop-blur-sm">
                <p className="text-[10px] font-bold uppercase tracking-wide text-white/70">{t("slice.combo", { n: hud.combo })}</p>
                <p className="font-display text-xl font-extrabold leading-none text-amber-300">🔥</p>
              </div>
            )}
          </div>

          {hud.gold && (
            <div className="pointer-events-none absolute inset-0 animate-pulse bg-amber-400/10" aria-hidden="true" />
          )}

          {phase === "playing" && (
            <div className="absolute inset-x-0 bottom-0 flex justify-center gap-3 p-4">
              <button
                type="button"
                onClick={useVerify}
                disabled={hud.verifyUses <= 0}
                className={cn(
                  "inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-extrabold shadow-lg transition-all",
                  hud.verifyUses > 0 ? "bg-sky-400 text-sky-950 hover:bg-sky-300" : "bg-white/10 text-white/40",
                )}
              >
                <Zap className="h-4 w-4" aria-hidden="true" />
                {t("slice.verify")} {hud.verifyUses > 0 ? `×${hud.verifyUses}` : `· ${t("slice.used")}`}
              </button>
              <button
                type="button"
                onClick={useBlock}
                disabled={hud.blockUses <= 0}
                className={cn(
                  "inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-extrabold shadow-lg transition-all",
                  hud.blockUses > 0 ? "bg-indigo-400 text-indigo-950 hover:bg-indigo-300" : "bg-white/10 text-white/40",
                )}
              >
                <Ban className="h-4 w-4" aria-hidden="true" />
                {t("slice.block")} {hud.blockUses > 0 ? `×${hud.blockUses}` : `· ${t("slice.used")}`}
              </button>
            </div>
          )}

          {phase === "idle" && (
            <div className="absolute inset-0 flex items-center justify-center bg-indigo-950/40 p-6 backdrop-blur-[2px]">
              <div className="w-full max-w-sm rounded-[1.5rem] bg-white p-6 text-center shadow-premium">
                <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary text-primary">
                  <Sparkles className="h-7 w-7" aria-hidden="true" />
                </span>
                <h3 className="mt-4 font-display text-2xl font-extrabold text-foreground">{t("slice.play")}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t("slice.howTo")}</p>
                <button
                  type="button"
                  onClick={startGame}
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-extrabold text-primary-foreground shadow-lg transition-transform hover:-translate-y-0.5"
                >
                  <Play className="h-4 w-4" aria-hidden="true" />
                  {t("slice.tapToStart")}
                </button>
              </div>
            </div>
          )}

          {phase === "over" && (
            <div className="absolute inset-0 flex items-center justify-center bg-indigo-950/60 p-6 backdrop-blur-[2px]">
              <div className="w-full max-w-sm rounded-[1.5rem] bg-white p-6 text-center shadow-premium">
                <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
                  <Trophy className="h-7 w-7" aria-hidden="true" />
                </span>
                <h3 className="mt-4 font-display text-2xl font-extrabold text-foreground">{t("slice.gameOver")}</h3>
                <p className="mt-2 font-display text-3xl font-extrabold text-amber-600">{t("slice.finalScore", { score: finalScore })}</p>
                {saving && <p className="mt-2 inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground"><LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />{t("slice.saving")}</p>}
                {!saving && newHigh && <p className="mt-2 text-sm font-extrabold text-emerald-600">{t("slice.newHighScore")}</p>}
                {!saving && !newHigh && <p className="mt-2 text-xs text-muted-foreground">{t("slice.savedScore")}</p>}
                <div className="mt-5 flex justify-center gap-2">
                  <button
                    type="button"
                    onClick={startGame}
                    className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-extrabold text-primary-foreground shadow-lg"
                  >
                    <RefreshCw className="h-4 w-4" aria-hidden="true" />
                    {t("slice.playAgain")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setPhase("idle")}
                    className="inline-flex items-center gap-2 rounded-xl border border-input bg-white px-5 py-2.5 text-sm font-extrabold text-foreground"
                  >
                    {t("slice.back")}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="rounded-[1.75rem] border border-[#DDE6ED] bg-card p-5 shadow-premium sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <h3 className="flex items-center gap-2 font-display text-lg font-extrabold text-foreground">
            <Crown className="h-5 w-5 text-amber-600" aria-hidden="true" />
            {t("slice.leaderboard")}
          </h3>
          <button type="button" onClick={() => void loadLeaderboard()} className="inline-flex items-center gap-1 rounded-lg px-2 text-xs font-bold text-primary hover:underline">
            <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </div>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          {t("slice.resetDaily")} · {t("slice.best")}: {bestToday}
        </p>
        {loadingBoard ? (
          <p className="mt-4 flex items-center gap-2 text-sm text-muted-foreground" role="status">
            <LoaderCircle className="h-4 w-4 animate-spin text-primary" aria-hidden="true" />
            {t("slice.loadingBoard")}
          </p>
        ) : leaderboard.length === 0 ? (
          <p className="mt-4 rounded-xl border border-dashed border-border p-4 text-center text-xs text-muted-foreground">{t("slice.noScores")}</p>
        ) : (
          <ol className="mt-4 space-y-2">
            {leaderboard.map((entry, index) => {
              const mine = entry.user_id === user?.id;
              return (
                <li key={`${entry.user_id}-${index}`} className={cn("flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5", mine ? "border-primary/30 bg-secondary text-primary" : "border-border bg-white")}>
                  <span className="flex items-center gap-2 text-sm font-semibold">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-xs font-extrabold">{index + 1}</span>
                    {mine ? t("slice.you") : t("slice.learner")}
                  </span>
                  <span className="text-xs font-extrabold">{entry.score} {t("slice.points")}</span>
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </div>
  );
}
