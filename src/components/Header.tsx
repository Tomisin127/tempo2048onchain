import React from 'react';
import { useWallet } from '@/hooks/useWallet';

interface HeaderProps {
  score: number;
  bestScore: number;
  onNewGame: () => void;
}

const Header: React.FC<HeaderProps> = ({ score, bestScore, onNewGame }) => {
  const { address, balance, usdcBalance, usdceBalance, connected, connecting, connect, disconnect, chainCorrect, hasFees } = useWallet();

  // Total stablecoin balance available for fees
  const totalStable = (parseFloat(balance) + parseFloat(usdcBalance) + parseFloat(usdceBalance)).toFixed(4);

  return (
    <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
      {/* Left: Branding */}
      <div className="flex items-center gap-3">
        <h1 className="font-display font-black text-3xl sm:text-4xl text-foreground">
          <span className="text-primary">2048</span>
        </h1>
        <div className="flex items-center gap-1.5 bg-card border border-border rounded-full px-3 py-1">
          <div className={`w-2 h-2 rounded-full ${chainCorrect ? 'bg-primary' : connected ? 'bg-yellow-400' : 'bg-muted-foreground'}`} />
          <span className="font-mono text-[10px] text-muted-foreground">
            Tempo Mainnet (4217)
          </span>
        </div>
      </div>

      {/* Center: Scores */}
      <div className="flex items-center gap-3">
        <div className="bg-card border border-border rounded-lg px-4 py-2 text-center min-w-[80px]">
          <div className="text-[10px] font-display font-semibold text-muted-foreground uppercase tracking-wider">Score</div>
          <div className="font-display font-black text-lg text-foreground">{score.toLocaleString()}</div>
        </div>
        <div className="bg-card border border-border rounded-lg px-4 py-2 text-center min-w-[80px]">
          <div className="text-[10px] font-display font-semibold text-muted-foreground uppercase tracking-wider">Best</div>
          <div className="font-display font-black text-lg text-foreground">{bestScore.toLocaleString()}</div>
        </div>
        <button
          onClick={onNewGame}
          className="bg-muted hover:bg-muted/80 text-foreground font-display font-bold text-sm px-4 py-3 rounded-lg transition-colors"
        >
          New Game
        </button>
      </div>

      {/* Right: Wallet */}
      <div className="flex items-center gap-3">
        {connected && (
          <div className="text-right mr-2">
            <div className="font-mono text-xs text-muted-foreground">
              {address?.slice(0, 6)}...{address?.slice(-4)}
            </div>
            <div className="font-mono text-sm font-semibold text-primary">
              ${totalStable} USD
            </div>
            <div className="font-mono text-[10px] text-muted-foreground space-x-2">
              {parseFloat(balance) > 0 && <span>{balance} native</span>}
              {parseFloat(usdcBalance) > 0 && <span>{usdcBalance} USDC</span>}
              {parseFloat(usdceBalance) > 0 && <span>{usdceBalance} USDC.e</span>}
            </div>
            {!hasFees && (
              <div className="font-mono text-[10px] text-destructive">
                ⚠ Insufficient stablecoin for fees
              </div>
            )}
          </div>
        )}
        <button
          onClick={connected ? disconnect : connect}
          disabled={connecting}
          className={`
            font-display font-bold text-sm px-5 py-2.5 rounded-lg transition-all
            ${connected
              ? 'bg-card border border-border text-foreground hover:bg-muted'
              : 'bg-primary text-primary-foreground primary-glow hover:opacity-90'
            }
            ${connecting ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          {connecting ? 'Connecting...' : connected ? 'Disconnect' : 'Connect Wallet'}
        </button>
      </div>
    </header>
  );
};

export default Header;
