export interface BlockLevelConfig {
  number: number;
  rows: number;
  cols: number;
  types: number;
  moves: number;
  targetScore: number;
  targetSpam: number;
  waveEvery: number;
  spamPerWave: number;
  startSpam: number;
}

export interface MatchGroup {
  indices: number[];
  horizontal: boolean;
}

export interface MoveResult {
  valid: boolean;
  board: number[];
  points: number;
  spamRemoved: number;
  cascades: number;
  shuffled: boolean;
}

export const SPAM = -1;
const EMPTY = -2;

/** Thirty progressive boards: size, available tiles, goals, and scam-wave timing change throughout. */
export const BLOCK_LEVELS: BlockLevelConfig[] = Array.from({ length: 30 }, (_, index) => {
  const number = index + 1;
  return {
    number,
    rows: 5 + (number % 3 === 0 ? 1 : 0),
    cols: 5 + Math.min(3, Math.floor(index / 5)),
    types: 4 + (number >= 4 ? 1 : 0) + (number >= 12 ? 1 : 0),
    moves: 24 - Math.min(6, Math.floor(index / 5)) + (number % 3 === 0 ? 1 : 0),
    targetScore: Math.min(500, 140 + number * 12),
    targetSpam: Math.max(1, Math.floor(number * 0.75)),
    waveEvery: Math.max(2, 8 - Math.floor(number / 5)),
    spamPerWave: number < 5 ? 1 : number < 15 ? 2 : 3,
    startSpam: Math.floor(index / 4),
  };
});

export function tileKind(value: number): number {
  return value >= 0 ? value % 10 : value;
}

export function isAdjacent(first: number, second: number, cols: number): boolean {
  const row = Math.floor(first / cols);
  const otherRow = Math.floor(second / cols);
  return (row === otherRow && Math.abs(first - second) === 1) || Math.abs(first - second) === cols;
}

export function findMatches(board: number[], rows: number, cols: number): MatchGroup[] {
  const groups: MatchGroup[] = [];
  for (let row = 0; row < rows; row += 1) {
    let start = 0;
    for (let col = 1; col <= cols; col += 1) {
      const index = row * cols + col;
      const same = col < cols && tileKind(board[index]) >= 0 && tileKind(board[index]) === tileKind(board[row * cols + start]);
      if (same) continue;
      if (col - start >= 3 && tileKind(board[row * cols + start]) >= 0) {
        groups.push({ indices: Array.from({ length: col - start }, (_, i) => row * cols + start + i), horizontal: true });
      }
      start = col;
    }
  }
  for (let col = 0; col < cols; col += 1) {
    let start = 0;
    for (let row = 1; row <= rows; row += 1) {
      const index = row * cols + col;
      const same = row < rows && tileKind(board[index]) >= 0 && tileKind(board[index]) === tileKind(board[start * cols + col]);
      if (same) continue;
      if (row - start >= 3 && tileKind(board[start * cols + col]) >= 0) {
        groups.push({ indices: Array.from({ length: row - start }, (_, i) => (start + i) * cols + col), horizontal: false });
      }
      start = row;
    }
  }
  return groups;
}

function randomBoard(level: BlockLevelConfig): number[] {
  const board: number[] = [];
  for (let row = 0; row < level.rows; row += 1) {
    for (let col = 0; col < level.cols; col += 1) {
      const options = Array.from({ length: level.types }, (_, kind) => kind).filter((kind) => {
        const horizontalMatch = col >= 2 && board[(row * level.cols) + col - 1] === kind && board[(row * level.cols) + col - 2] === kind;
        const verticalMatch = row >= 2 && board[((row - 1) * level.cols) + col] === kind && board[((row - 2) * level.cols) + col] === kind;
        return !horizontalMatch && !verticalMatch;
      });
      board.push(options[Math.floor(Math.random() * options.length)]);
    }
  }
  return board;
}

export function hasPossibleMove(board: number[], level: BlockLevelConfig): boolean {
  if (board.some((value) => value >= 10)) return true;
  for (let index = 0; index < board.length; index += 1) {
    for (const other of [index + 1, index + level.cols]) {
      if (other >= board.length || !isAdjacent(index, other, level.cols) || board[index] < 0 || board[other] < 0) continue;
      const next = [...board];
      [next[index], next[other]] = [next[other], next[index]];
      if (findMatches(next, level.rows, level.cols).length > 0) return true;
    }
  }
  return false;
}

function reshuffle(board: number[], level: BlockLevelConfig): number[] {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    const next = [...board];
    for (let index = next.length - 1; index > 0; index -= 1) {
      const swap = Math.floor(Math.random() * (index + 1));
      [next[index], next[swap]] = [next[swap], next[index]];
    }
    if (findMatches(next, level.rows, level.cols).length === 0 && hasPossibleMove(next, level)) return next;
  }
  return randomBoard(level);
}

export function createLevelBoard(level: BlockLevelConfig): number[] {
  let board = randomBoard(level);
  addSpam(board, level.startSpam);
  return hasPossibleMove(board, level) ? board : reshuffle(board, level);
}

function expandSpecials(board: number[], initial: Set<number>, newSpecials: Map<number, number>, rows: number, cols: number) {
  const cleared = new Set(initial);
  const queue = [...initial];
  for (let index = 0; index < queue.length; index += 1) {
    const position = queue[index];
    if (newSpecials.has(position) || board[position] < 10) continue;
    const kind = board[position];
    const add = (target: number) => {
      if (!cleared.has(target)) {
        cleared.add(target);
        queue.push(target);
      }
    };
    if (kind < 20) {
      const row = Math.floor(position / cols);
      for (let col = 0; col < cols; col += 1) add(row * cols + col);
    } else if (kind < 30) {
      for (let row = 0; row < rows; row += 1) add(row * cols + (position % cols));
    } else {
      const color = tileKind(kind);
      board.forEach((value, index) => { if (tileKind(value) === color) add(index); });
    }
  }
  for (const position of [...cleared]) {
    if (board[position] >= 0) continue;
    const row = Math.floor(position / cols);
    const col = position % cols;
    for (const [rowOffset, colOffset] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
      const nextRow = row + rowOffset;
      const nextCol = col + colOffset;
      if (nextRow >= 0 && nextRow < rows && nextCol >= 0 && nextCol < cols && board[nextRow * cols + nextCol] >= 0) cleared.add(nextRow * cols + nextCol);
    }
  }
  return cleared;
}

function resolveBoard(initial: number[], level: BlockLevelConfig, forcedClear?: Set<number>, from?: number, to?: number) {
  let board = [...initial];
  let forced = forcedClear;
  let points = 0;
  let spamRemoved = 0;
  let cascades = 0;
  while (cascades < 18) {
    const groups = findMatches(board, level.rows, level.cols);
    if (groups.length === 0 && (!forced || forced.size === 0)) break;
    const initialClear = forced ?? new Set<number>();
    const nextSpecials = new Map<number, number>();
    for (const group of groups) {
      if (group.indices.length < 4) continue;
      const base = tileKind(board[group.indices[0]]);
      const preferred = to !== undefined && group.indices.includes(to) ? to
        : from !== undefined && group.indices.includes(from) ? from
        : group.indices[Math.floor(group.indices.length / 2)];
      nextSpecials.set(preferred, base + (group.indices.length >= 5 ? 30 : group.horizontal ? 10 : 20));
    }
    for (const group of groups) for (const index of group.indices) initialClear.add(index);
    const cleared = expandSpecials(board, initialClear, nextSpecials, level.rows, level.cols);
    const normalCount = [...cleared].filter((index) => board[index] >= 0).length;
    const waveCount = [...cleared].filter((index) => board[index] === SPAM).length;
    spamRemoved += waveCount;
    points += normalCount * 8 + waveCount * 25 + cascades * 12;
    for (const index of cleared) board[index] = EMPTY;
    for (const [position, kind] of nextSpecials) board[position] = kind;

    for (let col = 0; col < level.cols; col += 1) {
      let bottom = level.rows - 1;
      for (let row = level.rows - 1; row >= 0; row -= 1) {
        const index = row * level.cols + col;
        if (board[index] === EMPTY) continue;
        const target = bottom * level.cols + col;
        board[target] = board[index];
        if (target !== index) board[index] = EMPTY;
        bottom -= 1;
      }
      for (let row = bottom; row >= 0; row -= 1) board[row * level.cols + col] = Math.floor(Math.random() * level.types);
    }
    cascades += 1;
    forced = undefined;
  }
  return { board, points, spamRemoved, cascades };
}

export function performMove(board: number[], level: BlockLevelConfig, from: number, to: number): MoveResult {
  if (!isAdjacent(from, to, level.cols) || board[from] < 0 || board[to] < 0) {
    return { valid: false, board, points: 0, spamRemoved: 0, cascades: 0, shuffled: false };
  }
  const next = [...board];
  [next[from], next[to]] = [next[to], next[from]];
  const rainbow = next[to] >= 30 ? to : next[from] >= 30 ? from : null;
  const blaster = rainbow === null && (next[to] >= 10 || next[from] >= 10) ? (next[to] >= 10 ? to : from) : null;
  const forced = new Set<number>();
  if (rainbow !== null) {
    const color = tileKind(next[rainbow === to ? from : to]);
    next.forEach((value, index) => {
      if (tileKind(value) === color) forced.add(index);
      if (next[index] >= 10 && tileKind(value) === color) forced.add(index);
    });
    forced.add(rainbow);
  } else if (blaster !== null) {
    forced.add(blaster);
  } else if (findMatches(next, level.rows, level.cols).length === 0) {
    return { valid: false, board, points: 0, spamRemoved: 0, cascades: 0, shuffled: false };
  }
  const result = resolveBoard(next, level, forced, from, to);
  const shuffled = !hasPossibleMove(result.board, level);
  return { valid: true, ...result, board: shuffled ? reshuffle(result.board, level) : result.board, shuffled };
}

export function addSpam(board: number[], amount: number): number {
  const targets = board.map((value, index) => value >= 0 ? index : -1).filter((index) => index >= 0);
  const count = Math.min(amount, targets.length);
  for (let index = 0; index < count; index += 1) {
    const targetIndex = index + Math.floor(Math.random() * (targets.length - index));
    [targets[index], targets[targetIndex]] = [targets[targetIndex], targets[index]];
    board[targets[index]] = SPAM;
  }
  return count;
}

export function starsForMoves(remaining: number, total: number): number {
  if (remaining >= Math.ceil(total * 0.45)) return 3;
  if (remaining >= Math.ceil(total * 0.2)) return 2;
  return 1;
}
