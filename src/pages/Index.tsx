import React, { useState, useEffect, useCallback, useRef } from 'react';
import GameBoard from '@/components/GameBoard';
import Header from '@/components/Header';
import TransactionFeed, { type TxRecord } from '@/components/TransactionFeed';
import NetworkStatus from '@/components/NetworkStatus';
import { initGame, move, directionToNumber, type Direction, type GameState } from '@/lib/gameEngine';
import { sendMoveTransaction } from '@/lib/tempoChain';
import { useWallet } from '@/hooks/useWallet';
import { toast } from 'sonner';

const Index = () => {
  const [game, setGame] = useState<GameState>(initGame);
  const [transactions, setTransactions] = useState<TxRecord[]>([]);
  const [pendingTx, setPendingTx] = useState(false);
  const wallet = useWallet();
  const boardRef = useRef<HTMLDivElement>(null);

  const handleNewGame = useCallback(() => {
    setGame(initGame());
    toast('New game started!');
  }, []);

  const handleMove = useCallback(async (direction: Direction) => {
    if (!wallet.connected) {
      toast.error('Connect your wallet to play!', {
        description: 'Every move is an on-chain transaction on Tempo Mainnet.',
      });
      return;
    }
    if (!wallet.chainCorrect) {
      toast.error('Wrong network! Please switch to Tempo Mainnet.');
      return;
    }
    if (!wallet.hasFees) {
      toast.error('Insufficient stablecoin balance for fees.');
      return;
    }

    setGame(prev => {
      const result = move(prev, direction);
      if (!result) return prev;

      if (wallet.address) {
        setPendingTx(true);
        sendMoveTransaction(wallet.address, directionToNumber(direction), result.moveCount, result.score)
          .then(hash => {
            setPendingTx(false);
            if (hash) {
              const txRecord: TxRecord = {
                hash,
                direction,
                moveNumber: result.moveCount,
                score: result.score,
                timestamp: Date.now(),
                status: 'pending',
              };
              setTransactions(prev => [txRecord, ...prev].slice(0, 50));
              if (wallet.address) wallet.refreshBalance(wallet.address);
              setTimeout(() => {
                setTransactions(prev =>
                  prev.map(tx => tx.hash === hash ? { ...tx, status: 'confirmed' as const } : tx)
                );
              }, 3000);
            } else {
              toast.error('Transaction rejected or failed');
            }
          })
          .catch(() => {
            setPendingTx(false);
            toast.error('Transaction failed');
          });
      }

      return result;
    });
  }, [wallet.connected, wallet.address, wallet.chainCorrect, wallet.hasFees, wallet.connect, wallet.refreshBalance]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const keyMap: Record<string, Direction> = {
        ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
        w: 'up', s: 'down', a: 'left', d: 'right',
      };
      const dir = keyMap[e.key];
      if (dir) { e.preventDefault(); handleMove(dir); }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleMove]);

  // Touch/swipe controls — restricted to board area
  useEffect(() => {
    const board = boardRef.current;
    if (!board) return;

    let startX = 0, startY = 0;

    const handleTouchStart = (e: TouchEvent) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const dx = e.changedTouches[0].clientX - startX;
      const dy = e.changedTouches[0].clientY - startY;
      if (Math.max(Math.abs(dx), Math.abs(dy)) < 30) return;
      if (Math.abs(dx) > Math.abs(dy)) {
        handleMove(dx > 0 ? 'right' : 'left');
      } else {
        handleMove(dy > 0 ? 'down' : 'up');
      }
    };

    board.addEventListener('touchstart', handleTouchStart, { passive: true });
    board.addEventListener('touchend', handleTouchEnd, { passive: true });
    return () => {
      board.removeEventListener('touchstart', handleTouchStart);
      board.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleMove]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="max-w-6xl mx-auto w-full px-3 sm:px-4 py-4 sm:py-6">
        <Header score={game.score} bestScore={game.bestScore} onNewGame={handleNewGame} />

        <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 items-start">
          {/* Game area */}
          <div className="flex flex-col items-center gap-3 w-full lg:w-auto">
            {pendingTx && (
              <div className="flex items-center gap-2 text-xs font-mono text-primary">
                <div className="w-2 h-2 rounded-full bg-primary animate-mining-indicator" />
                <span className="animate-mining-indicator">Mining transaction...</span>
              </div>
            )}

            <div ref={boardRef} className="touch-none w-full max-w-[340px] sm:max-w-none">
              <GameBoard
                tiles={game.tiles}
                gameOver={game.gameOver}
                won={game.won}
                onNewGame={handleNewGame}
                walletConnected={wallet.connected}
                onConnect={wallet.connect}
              />
            </div>

            <div className="flex items-center gap-4 text-xs text-muted-foreground font-mono">
              <span>↑↓←→ or swipe</span>
              <span>•</span>
              <span>Moves: {game.moveCount}</span>
            </div>

            {wallet.connected && !wallet.hasFees && (
              <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 max-w-sm text-center">
                <p className="text-sm text-destructive font-display font-semibold">⚠️ Insufficient stablecoin for fees</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Fees can be paid in USD, USDC, or USDC.e (&lt; $0.001/move).
                </p>
              </div>
            )}
          </div>

          {/* Right sidebar */}
          <div className="w-full lg:w-80 flex flex-col gap-4">
            <NetworkStatus />
            <div className="lg:h-[360px]">
              <TransactionFeed transactions={transactions} />
            </div>
          </div>
        </div>
      </div>

      <footer className="mt-auto py-3 text-center">
        <p className="text-xs font-mono text-muted-foreground">
          On-Chain 2048 • Tempo Mainnet • Chain ID 4217 •{' '}
          <a href="https://docs.tempo.xyz" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Docs</a>
          {' • '}
          <a href="https://mpp.dev" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">MPP</a>
        </p>
      </footer>
    </div>
  );
};

export default Index;
