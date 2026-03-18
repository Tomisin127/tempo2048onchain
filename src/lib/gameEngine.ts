export type Direction = 'up' | 'down' | 'left' | 'right';

export interface Tile {
  id: number;
  value: number;
  row: number;
  col: number;
  isNew?: boolean;
  isMerged?: boolean;
}

export interface GameState {
  tiles: Tile[];
  score: number;
  bestScore: number;
  gameOver: boolean;
  won: boolean;
  moveCount: number;
}

let nextTileId = 1;

function createTile(value: number, row: number, col: number, isNew = false): Tile {
  return { id: nextTileId++, value, row, col, isNew };
}

export function initGame(): GameState {
  nextTileId = 1;
  const tiles: Tile[] = [];
  addRandomTile(tiles);
  addRandomTile(tiles);
  const bestScore = parseInt(localStorage.getItem('tempo2048_best') || '0', 10);
  return { tiles, score: 0, bestScore, gameOver: false, won: false, moveCount: 0 };
}

function getEmptyCells(tiles: Tile[]): [number, number][] {
  const occupied = new Set(tiles.map(t => `${t.row},${t.col}`));
  const empty: [number, number][] = [];
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      if (!occupied.has(`${r},${c}`)) empty.push([r, c]);
    }
  }
  return empty;
}

function addRandomTile(tiles: Tile[]): void {
  const empty = getEmptyCells(tiles);
  if (empty.length === 0) return;
  const [row, col] = empty[Math.floor(Math.random() * empty.length)];
  const value = Math.random() < 0.9 ? 2 : 4;
  tiles.push(createTile(value, row, col, true));
}

function getGrid(tiles: Tile[]): (Tile | null)[][] {
  const grid: (Tile | null)[][] = Array.from({ length: 4 }, () => Array(4).fill(null));
  for (const t of tiles) {
    grid[t.row][t.col] = t;
  }
  return grid;
}

function slideLine(line: (Tile | null)[]): { result: Tile[]; scoreGain: number } {
  const filtered = line.filter(Boolean) as Tile[];
  const result: Tile[] = [];
  let scoreGain = 0;
  let i = 0;

  while (i < filtered.length) {
    if (i + 1 < filtered.length && filtered[i].value === filtered[i + 1].value) {
      const newVal = filtered[i].value * 2;
      result.push({ ...filtered[i], value: newVal, isMerged: true, id: nextTileId++ });
      scoreGain += newVal;
      i += 2;
    } else {
      result.push({ ...filtered[i], isMerged: false });
      i++;
    }
  }

  return { result, scoreGain };
}

export function move(state: GameState, direction: Direction): GameState | null {
  if (state.gameOver) return null;

  const grid = getGrid(state.tiles);
  let totalScore = 0;
  const newTiles: Tile[] = [];
  let moved = false;

  for (let i = 0; i < 4; i++) {
    let line: (Tile | null)[] = [];

    switch (direction) {
      case 'left':
        line = grid[i];
        break;
      case 'right':
        line = [...grid[i]].reverse();
        break;
      case 'up':
        line = [grid[0][i], grid[1][i], grid[2][i], grid[3][i]];
        break;
      case 'down':
        line = [grid[3][i], grid[2][i], grid[1][i], grid[0][i]];
        break;
    }

    const { result, scoreGain } = slideLine(line);
    totalScore += scoreGain;

    // Place back
    for (let j = 0; j < 4; j++) {
      const tile = result[j] || null;
      if (!tile) continue;

      let row: number, col: number;
      switch (direction) {
        case 'left': row = i; col = j; break;
        case 'right': row = i; col = 3 - j; break;
        case 'up': row = j; col = i; break;
        case 'down': row = 3 - j; col = i; break;
      }

      if (tile.row !== row || tile.col !== col) moved = true;
      newTiles.push({ ...tile, row, col, isNew: false });
    }
  }

  // Check if tiles changed position or merged
  if (!moved && totalScore === 0) {
    // Check if any merge happened
    if (newTiles.length === state.tiles.length) return null;
  }

  if (!moved && totalScore === 0) return null;

  addRandomTile(newTiles);

  const newScore = state.score + totalScore;
  const bestScore = Math.max(newScore, state.bestScore);
  localStorage.setItem('tempo2048_best', bestScore.toString());

  const won = newTiles.some(t => t.value >= 2048);
  const gameOver = isGameOver(newTiles);

  return {
    tiles: newTiles,
    score: newScore,
    bestScore,
    gameOver,
    won: won || state.won,
    moveCount: state.moveCount + 1,
  };
}

function isGameOver(tiles: Tile[]): boolean {
  if (getEmptyCells(tiles).length > 0) return false;
  const grid = getGrid(tiles);
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      const val = grid[r][c]?.value;
      if (c < 3 && grid[r][c + 1]?.value === val) return false;
      if (r < 3 && grid[r + 1][c]?.value === val) return false;
    }
  }
  return true;
}

export function directionToNumber(d: Direction): number {
  switch (d) {
    case 'up': return 0;
    case 'right': return 1;
    case 'down': return 2;
    case 'left': return 3;
  }
}
