import React, { useState } from 'react';
import { useWallet } from '@/hooks/useWallet';

interface HeaderProps {
  score: number;
  bestScore: number;
  onNewGame: () => void;
}

const Header: React.FC<HeaderProps> = ({ score, bestScore, onNewGame }) => {
  const wallet = useWallet();
  const [showMenu, setShowMenu] = useState(false);

  const totalStable = (parseFloat(wallet.balance) + parseFloat(wallet.usdcBalance) + parseFloat(wallet.usdceBalance)).toFixed(2);

  return (
    <header className="flex flex-col gap-3 mb-4 sm:mb-6">
      {/* Top row: title + connect */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="font-display font-black text-2xl sm:text-4xl text-foreground">
            <span className="text-primary">2048</span>
          </h1>
          <div className="flex items-center gap-1 bg-card border border-border rounded-full px-2 py-0.5">
            <div className={`w-1.5 h-1.5 rounded-full ${wallet.chainCorrect ? 'bg-primary' : wallet.connected ? 'bg-yellow-400' : 'bg-muted-foreground'}`} />
            <span className="font-mono text-[9px] sm:text-[10px] text-muted-foreground">Tempo</span>
          </div>
        </div>

        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            disabled={wallet.connecting}
            className={`
              font-display font-bold text-xs sm:text-sm px-3 sm:px-5 py-2 rounded-lg transition-all
              ${wallet.connected
                ? 'bg-card border border-border text-foreground hover:bg-muted'
                : 'bg-primary text-primary-foreground primary-glow hover:opacity-90'
              }
              ${wallet.connecting ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            {wallet.connecting ? '...' : wallet.connected ? `${wallet.address?.slice(0, 6)}...${wallet.address?.slice(-4)}` : 'Connect Wallet'}
          </button>

          {showMenu && !wallet.connected && (
            <div className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-lg shadow-lg z-10">
              <button
                onClick={() => {
                  wallet.connectMetaMask();
                  setShowMenu(false);
                }}
                className="w-full text-left px-4 py-2 hover:bg-muted text-sm font-semibold"
              >
                Connect MetaMask
              </button>
            </div>
          )}

          {showMenu && wallet.connected && (
            <div className="absolute right-0 mt-2 w-40 bg-card border border-border rounded-lg shadow-lg z-10">
              <button
                onClick={() => {
                  wallet.disconnect();
                  setShowMenu(false);
                }}
                className="w-full text-left px-4 py-2 hover:bg-destructive/10 text-sm font-semibold text-destructive"
              >
                Disconnect
              </button>
            </div>
          )}
        </div>
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

        {wallet.connected && (
          <div className="text-right">
            <div className="font-mono text-sm font-semibold text-primary">${totalStable}</div>
            <div className="font-mono text-[9px] text-muted-foreground flex gap-1 justify-end flex-wrap">
              {parseFloat(wallet.balance) > 0 && <span>{wallet.balance} USD</span>}
              {parseFloat(wallet.usdcBalance) > 0 && <span>{wallet.usdcBalance} USDC</span>}
              {parseFloat(wallet.usdceBalance) > 0 && <span>{wallet.usdceBalance} USDC.e</span>}
            </div>
            {!wallet.hasFees && (
              <div className="font-mono text-[9px] text-destructive">⚠ Low balance</div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
