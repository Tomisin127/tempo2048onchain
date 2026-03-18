import React from 'react';
import type { Tile } from '@/lib/gameEngine';
import GameTile from './GameTile';

interface GameBoardProps {
  tiles: Tile[];
  gameOver: boolean;
  won: boolean;
  onNewGame: () => void;
}

const GameBoard: React.FC<GameBoardProps> = ({ tiles, gameOver, won, onNewGame }) => {
  return (
    <div className="relative">
      {/* Grid background */}
      <div className="grid grid-cols-4 gap-2 p-2 bg-card rounded-xl border border-border">
        {Array.from({ length: 16 }).map((_, i) => (
          <div
            key={i}
            className="w-[72px] h-[72px] sm:w-[80px] sm:h-[80px] rounded-lg bg-muted"
          />
        ))}
      </div>

      {/* Tiles overlay */}
      <div className="absolute inset-0 p-2">
        {tiles.map(tile => (
          <div
            key={tile.id}
            className="absolute transition-all duration-100 ease-out"
            style={{
              width: 'calc((100% - 40px) / 4)',
              height: 'calc((100% - 40px) / 4)',
              left: `calc(8px + ${tile.col} * ((100% - 40px) / 4 + 8px))`,
              top: `calc(8px + ${tile.row} * ((100% - 40px) / 4 + 8px))`,
            }}
          >
            <GameTile value={tile.value} isNew={tile.isNew} isMerged={tile.isMerged} />
          </div>
        ))}
      </div>

      {/* Game Over overlay */}
      {gameOver && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm rounded-xl flex flex-col items-center justify-center gap-4">
          <h2 className="text-2xl font-display font-bold text-foreground">
            {won ? '🎉 You reached 2048!' : 'Game Over'}
          </h2>
          <button
            onClick={onNewGame}
            className="px-6 py-2 bg-primary text-primary-foreground font-display font-bold rounded-lg primary-glow hover:opacity-90 transition-opacity"
          >
            New Game
          </button>
        </div>
      )}
    </div>
  );
};

export default GameBoard;
