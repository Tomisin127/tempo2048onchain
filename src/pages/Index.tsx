import React, { useState, useEffect, useCallback, useRef } from 'react';
import GameBoard from '@/components/GameBoard';
import Header from '@/components/Header';
import TransactionFeed, { type TxRecord } from '@/components/TransactionFeed';
import NetworkStatus from '@/components/NetworkStatus';
import { initGame, move, directionToNumber, type Direction, type GameState } from '@/lib/gameEngine';
import { sendMoveTransaction } from '@/lib/tempoChain';
import { useWallet } from '@/hooks/useWallet';
import { usePrivyWallet } from '@/hooks/usePrivyWallet';
import { toast } from 'sonner';

const Index = () => {
  const [game, setGame] = useState<GameState>(initGame);
  const [transactions, setTransactions] = useState<TxRecord[]>([]);
  const [pendingTx, setPendingTx] = useState(false);
  const metaMaskWallet = useWallet();
  const privyWallet = usePrivyWallet();
  const boardRef = useRef<HTMLDivElement>(null);

  // Determine which wallet is active
  const isMetaMaskConnected = metaMaskWallet.connected && metaMaskWallet.walletType === 'metamask';
  const isPrivyConnected = privyWallet.address !== null;
  const wallet = {
    connected: isMetaMaskConnected || isPrivyConnected,
    address: isMetaMaskConnected ? metaMaskWallet.address : isPrivyConnected ? privyWallet.address : null,
    walletType: isMetaMaskConnected ? 'metamask' : isPrivyConnected ? 'privy' : null,
    chainCorrect: isMetaMaskConnected ? metaMaskWallet.chainCorrect : isPrivyConnected,
    hasFees: isMetaMaskConnected ? metaMaskWallet.hasFees : isPrivyConnected ? privyWallet.hasFees : false,
    refreshBalance: isMetaMaskConnected ? metaMaskWallet.refreshBalance : async () => {},
  };

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
        const isSilent = wallet.walletType === 'privy';
        if (!isSilent) setPendingTx(true);
        
        console.log('[v0] Initiating transaction with address:', wallet.address, 'wallet type:', wallet.walletType);
        sendMoveTransaction(wallet.address, directionToNumber(direction), result.moveCount, result.score, (wallet.walletType || 'metamask') as 'metamask' | 'privy')
          .then(hash => {
            console.log('[v0] Transaction response received:', hash);
            if (!isSilent) setPendingTx(false);
            if (hash) {
              console.log('[v0] Transaction sent, hash:', hash);
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
              console.error('[v0] Transaction rejected - hash is null');
              if (!isSilent) {
                toast.error('Transaction rejected or failed', {
                  description: 'Check your wallet for details',
                });
              }
            }
          })
          .catch((err) => {
            console.error('[v0] Transaction error caught:', err);
            if (!isSilent) setPendingTx(false);
            if (!isSilent) {
              toast.error('Transaction failed', {
                description: err?.message || 'Unknown error',
              });
            }
          });
      }

      return result;
    });
  }, [wallet.connected, wallet.address, wallet.chainCorrect, wallet.hasFees, wallet.walletType, wallet.refreshBalance]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const keyMap: Record<string, Direction> = {
        ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
        w: 'up', s: 'down', a: 'left', d: 'right',
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

  return (
    <div className="min-h-screen flex flex-col gap-6 p-4 sm:p-6">
      <Header score={game.score} bestScore={game.bestScore} onNewGame={handleNewGame} />
      <div className="flex flex-col gap-2">
        <NetworkStatus connected={wallet.connected} chainCorrect={wallet.chainCorrect} />
      </div>
      <div ref={boardRef} className="flex justify-center">
        <GameBoard board={game.board} onMove={handleMove} />
      </div>
      <TransactionFeed transactions={transactions} pendingTx={pendingTx} />
    </div>
  );
};

export default Index;
