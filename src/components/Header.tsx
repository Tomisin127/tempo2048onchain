import React from 'react';
import { useWallet } from '@/hooks/useWallet';

interface HeaderProps {
  score: number;
  bestScore: number;
  onNewGame: () => void;
}

const Header: React.FC<HeaderProps> = ({ score, bestScore, onNewGame }) => {
  const { address, balance, usdcBalance, usdceBalance, connected, connecting, connect, disconnect, chainCorrect, hasFees } = useWallet();

  // All balances are in USD equivalent (balance is native USD, USDC and USDC.e are 1:1 with USD)
  const totalStable = (parseFloat(balance) + parseFloat(usdcBalance) + parseFloat(usdceBalance)).toFixed(2);

  return (
    <header className="flex flex-col gap-3 mb-4 sm:mb-6">
      {/* Top row: title + connect */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="font-display font-black text-2xl sm:text-4xl text-foreground">
            <span className="text-primary">2048</span>
          </h1>
          <div className="flex items-center gap-1 bg-card border border-border rounded-full px-2 py-0.5">
            <div className={`w-1.5 h-1.5 rounded-full ${chainCorrect ? 'bg-primary' : connected ? 'bg-yellow-400' : 'bg-muted-foreground'}`} />
            <span className="font-mono text-[9px] sm:text-[10px] text-muted-foreground">Tempo</span>
          </div>
        </div>

        <button
          onClick={connected ? disconnect : connect}
          disabled={connecting}
          className={`
            font-display font-bold text-xs sm:text-sm px-3 sm:px-5 py-2 rounded-lg transition-all
            ${connected
              ? 'bg-card border border-border text-foreground hover:bg-muted'
              : 'bg-primary text-primary-foreground primary-glow hover:opacity-90'
            }
            ${connecting ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          {connecting ? '...' : connected ? `${address?.slice(0, 6)}...${address?.slice(-4)}` : 'Connect Wallet'}
        </button>
      </div>

      {/* Scores + balance row */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="bg-card border border-border rounded-lg px-3 py-1.5 text-center">
            <div className="text-[9px] font-display font-semibold text-muted-foreground uppercase tracking-wider">Score</div>
            <div className="font-display font-black text-base sm:text-lg text-foreground">{score.toLocaleString()}</div>
          </div>
          <div className="bg-card border border-border rounded-lg px-3 py-1.5 text-center">
            <div className="text-[9px] font-display font-semibold text-muted-foreground uppercase tracking-wider">Best</div>
            <div className="font-display font-black text-base sm:text-lg text-foreground">{bestScore.toLocaleString()}</div>
          </div>
          <button
            onClick={onNewGame}
            className="bg-muted hover:bg-muted/80 text-foreground font-display font-bold text-xs px-3 py-2.5 rounded-lg transition-colors"
          >
            New
          </button>
        </div>

        {connected && (
          <div className="text-right">
            <div className="font-mono text-sm font-semibold text-primary">${totalStable}</div>
            <div className="font-mono text-[9px] text-muted-foreground flex gap-1 justify-end flex-wrap">
              {parseFloat(balance) > 0 && <span>{balance} USD</span>}
              {parseFloat(usdcBalance) > 0 && <span>{usdcBalance} USDC</span>}
              {parseFloat(usdceBalance) > 0 && <span>{usdceBalance} USDC.e</span>}
            </div>
            {!hasFees && (
              <div className="font-mono text-[9px] text-destructive">⚠ Low balance</div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
