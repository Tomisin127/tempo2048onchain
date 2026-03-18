import React from 'react';
import type { Tile } from '@/lib/gameEngine';
import GameTile from './GameTile';

interface GameBoardProps {
  tiles: Tile[];
  gameOver: boolean;
  won: boolean;
  onNewGame: () => void;
  walletConnected?: boolean;
  onConnect?: () => void;
}

const GameBoard: React.FC<GameBoardProps> = ({ tiles, gameOver, won, onNewGame, walletConnected = true, onConnect }) => {
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

      {/* Connect Wallet overlay */}
      {!walletConnected && (
        <div className="absolute inset-0 bg-background/85 backdrop-blur-sm rounded-xl flex flex-col items-center justify-center gap-4 p-6">
          <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-lg font-display font-bold text-foreground text-center">
            Connect Wallet to Play
          </h2>
          <p className="text-xs text-muted-foreground text-center max-w-[220px]">
            Every move is recorded on-chain on <span className="text-primary font-semibold">Tempo Mainnet</span>. Gas fees are paid in USD.
          </p>
          <button
            onClick={onConnect}
            className="px-6 py-2.5 bg-primary text-primary-foreground font-display font-bold rounded-lg primary-glow hover:opacity-90 transition-opacity text-sm"
          >
            Connect Wallet
          </button>
        </div>
      )}

      {/* Game Over overlay */}
      {gameOver && walletConnected && (
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
