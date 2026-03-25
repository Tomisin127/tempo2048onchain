import React, { useState } from 'react';
import { useWallet } from '@/hooks/useWallet';
import { usePrivyWallet } from '@/hooks/usePrivyWallet';

interface HeaderProps {
  score: number;
  bestScore: number;
  onNewGame: () => void;
}

const Header: React.FC<HeaderProps> = ({ score, bestScore, onNewGame }) => {
  const metaMaskWallet = useWallet();
  const privyWallet = usePrivyWallet();
  const [showWalletOptions, setShowWalletOptions] = useState(false);

  // Check if Privy is available (app ID configured)
  const privyAvailable = import.meta.env.VITE_PRIVY_APP_ID ? true : false;

  // Determine which wallet is active
  const isMetaMaskConnected = metaMaskWallet.connected && metaMaskWallet.walletType === 'metamask';
  const isPrivyConnected = privyWallet.address !== null;
  
  const address = isMetaMaskConnected ? metaMaskWallet.address : isPrivyConnected ? privyWallet.address : null;
  const balance = isMetaMaskConnected ? metaMaskWallet.balance : isPrivyConnected ? privyWallet.balance : '0.00';
  const usdcBalance = isMetaMaskConnected ? metaMaskWallet.usdcBalance : isPrivyConnected ? privyWallet.usdcBalance : '0.00';
  const usdceBalance = isMetaMaskConnected ? metaMaskWallet.usdceBalance : isPrivyConnected ? privyWallet.usdceBalance : '0.00';
  const chainCorrect = isMetaMaskConnected ? metaMaskWallet.chainCorrect : isPrivyConnected;
  const hasFees = isMetaMaskConnected ? metaMaskWallet.hasFees : isPrivyConnected ? privyWallet.hasFees : false;
  const connecting = metaMaskWallet.connecting;
  const connected = isMetaMaskConnected || isPrivyConnected;
  const walletType = isMetaMaskConnected ? 'metamask' : isPrivyConnected ? 'privy' : null;

  const totalStable = (parseFloat(balance) + parseFloat(usdcBalance) + parseFloat(usdceBalance)).toFixed(2);

  const handleDisconnect = () => {
    if (isMetaMaskConnected) {
      metaMaskWallet.disconnect();
    } else if (isPrivyConnected) {
      privyWallet.logout();
    }
    setShowWalletOptions(false);
  };

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

        <div className="relative">
          <button
            onClick={() => setShowWalletOptions(!showWalletOptions)}
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

          {/* Wallet options dropdown */}
          {showWalletOptions && !connected && (
            <div className="absolute right-0 mt-2 w-48 bg-card border border-border rounded-lg shadow-lg z-10">
              <button
                onClick={() => {
                  metaMaskWallet.connectMetaMask();
                  setShowWalletOptions(false);
                }}
                className="w-full text-left px-4 py-2 hover:bg-muted text-sm font-semibold border-b border-border"
              >
                Connect MetaMask
              </button>
              {privyAvailable && (
                <button
                  onClick={() => {
                    privyWallet.login();
                    setShowWalletOptions(false);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-muted text-sm font-semibold"
                >
                  Login with Email (Privy)
                </button>
              )}
            </div>
          )}

          {/* Disconnect option when connected */}
          {showWalletOptions && connected && (
            <div className="absolute right-0 mt-2 w-40 bg-card border border-border rounded-lg shadow-lg z-10">
              <div className="px-4 py-2 text-xs text-muted-foreground border-b border-border">
                {walletType === 'privy' ? 'Privy Wallet' : 'MetaMask'}
              </div>
              <button
                onClick={handleDisconnect}
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
