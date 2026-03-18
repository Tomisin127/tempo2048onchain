import React, { useState, useEffect, useCallback } from 'react';
import GameBoard from '@/components/GameBoard';
import Header from '@/components/Header';
import TransactionFeed, { type TxRecord } from '@/components/TransactionFeed';
import { initGame, move, directionToNumber, type Direction, type GameState } from '@/lib/gameEngine';
import { sendMoveTransaction } from '@/lib/tempoChain';
import { useWallet } from '@/hooks/useWallet';
import { toast } from 'sonner';

const Index = () => {
  const [game, setGame] = useState<GameState>(initGame);
  const [transactions, setTransactions] = useState<TxRecord[]>([]);
  const [pendingTx, setPendingTx] = useState(false);
  const wallet = useWallet();

  const handleNewGame = useCallback(() => {
    setGame(initGame());
    toast('New game started!');
  }, []);

  const handleMove = useCallback(async (direction: Direction) => {
    setGame(prev => {
      const result = move(prev, direction);
      if (!result) return prev;

      // Fire transaction in background (optimistic UI)
      if (wallet.connected && wallet.address) {
        setPendingTx(true);
        const moveNum = result.moveCount;
        const score = result.score;

        sendMoveTransaction(
          wallet.address,
          directionToNumber(direction),
          moveNum,
          score,
        ).then(hash => {
          setPendingTx(false);
          if (hash) {
            const txRecord: TxRecord = {
              hash,
              direction,
              moveNumber: moveNum,
              score,
              timestamp: Date.now(),
              status: 'pending',
            };
            setTransactions(prev => [txRecord, ...prev].slice(0, 50));

            // Mark confirmed after delay (optimistic)
            setTimeout(() => {
              setTransactions(prev =>
                prev.map(tx => tx.hash === hash ? { ...tx, status: 'confirmed' as const } : tx)
              );
            }, 3000);
          }
        }).catch(() => {
          setPendingTx(false);
        });
      }

      return result;
    });
  }, [wallet.connected, wallet.address]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const keyMap: Record<string, Direction> = {
        ArrowUp: 'up',
        ArrowDown: 'down',
        ArrowLeft: 'left',
        ArrowRight: 'right',
        w: 'up',
        s: 'down',
        a: 'left',
        d: 'right',
      };

      const dir = keyMap[e.key];
      if (dir) {
        e.preventDefault();
        handleMove(dir);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleMove]);

  // Touch/swipe controls
  useEffect(() => {
    let startX = 0;
    let startY = 0;

    const handleTouchStart = (e: TouchEvent) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const dx = e.changedTouches[0].clientX - startX;
      const dy = e.changedTouches[0].clientY - startY;
      const absDx = Math.abs(dx);
      const absDy = Math.abs(dy);

      if (Math.max(absDx, absDy) < 30) return;

      if (absDx > absDy) {
        handleMove(dx > 0 ? 'right' : 'left');
      } else {
        handleMove(dy > 0 ? 'down' : 'up');
      }
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });
    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleMove]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="max-w-6xl mx-auto w-full px-4 py-6">
        <Header
          score={game.score}
          bestScore={game.bestScore}
          onNewGame={handleNewGame}
        />

        <div className="flex flex-col lg:flex-row gap-6 items-start">
          {/* Game area */}
          <div className="flex flex-col items-center gap-4">
            {/* Pending tx indicator */}
            {pendingTx && (
              <div className="flex items-center gap-2 text-xs font-mono text-primary animate-pulse">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                Mining transaction...
              </div>
            )}

            <GameBoard
              tiles={game.tiles}
              gameOver={game.gameOver}
              won={game.won}
              onNewGame={handleNewGame}
            />

            {/* Controls hint */}
            <div className="flex items-center gap-4 text-xs text-muted-foreground font-mono">
              <span>↑↓←→ or WASD to move</span>
              <span>•</span>
              <span>Moves: {game.moveCount}</span>
            </div>

            {!wallet.connected && (
              <div className="bg-card border border-border rounded-lg p-4 max-w-sm text-center">
                <p className="text-sm text-muted-foreground font-display">
                  Connect your wallet to record every move as a transaction on{' '}
                  <span className="text-primary font-semibold">Tempo Mainnet</span>
                </p>
              </div>
            )}
          </div>

          {/* Transaction feed */}
          <div className="w-full lg:w-80 lg:h-[500px]">
            <TransactionFeed transactions={transactions} />
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-auto py-4 text-center">
        <p className="text-xs font-mono text-muted-foreground">
          On-Chain 2048 • Tempo Mainnet • Chain ID 4217 (0x1079)
        </p>
      </footer>
    </div>
  );
};

export default Index;
