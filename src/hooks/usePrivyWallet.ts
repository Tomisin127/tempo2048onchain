import { usePrivy } from '@privy-io/react-auth';
import { useState, useEffect, useCallback } from 'react';
import { getBalance, getUSDCBalance, getUSDCeBalance, switchToTempo } from '@/lib/tempoChain';

interface PrivyWalletInfo {
  address: string | null;
  balance: string;
  usdcBalance: string;
  usdceBalance: string;
  hasFees: boolean;
}

const EMPTY_STATE: PrivyWalletInfo = {
  address: null,
  balance: '0.00',
  usdcBalance: '0.00',
  usdceBalance: '0.00',
  hasFees: false,
};

export function usePrivyWallet() {
  const { user, login, logout } = usePrivy();
  const [walletInfo, setWalletInfo] = useState<PrivyWalletInfo>(EMPTY_STATE);

  const computeHasFees = (a: string, b: string, c: string) =>
    parseFloat(a) + parseFloat(b) + parseFloat(c) >= 0.01;

  const handleLogin = useCallback(async () => {
    try {
      await login({
        onComplete: async (u: any) => {
          const addr = u?.wallet?.address;
          if (!addr) return;
          try {
            await switchToTempo();
            const [bal, usdcBal, usdceBal] = await Promise.all([
              getBalance(addr), getUSDCBalance(addr), getUSDCeBalance(addr),
            ]);
            setWalletInfo({ address: addr, balance: bal, usdcBalance: usdcBal, usdceBalance: usdceBal, hasFees: computeHasFees(bal, usdcBal, usdceBal) });
          } catch (err) {
            console.error('[v0] Privy wallet setup error:', err);
          }
        },
      });
    } catch (err) {
      console.error('[v0] Privy login error:', err);
    }
  }, [login]);

  const handleLogout = useCallback(async () => {
    try { await logout(); } catch { /* ignore */ }
    setWalletInfo(EMPTY_STATE);
  }, [logout]);

  useEffect(() => {
    const addr = user?.wallet?.address;
    if (addr && !walletInfo.address) {
      (async () => {
        try {
          const [bal, usdcBal, usdceBal] = await Promise.all([
            getBalance(addr), getUSDCBalance(addr), getUSDCeBalance(addr),
          ]);
          setWalletInfo({ address: addr, balance: bal, usdcBalance: usdcBal, usdceBalance: usdceBal, hasFees: computeHasFees(bal, usdcBal, usdceBal) });
        } catch (err) {
          console.error('[v0] Privy balance fetch error:', err);
        }
      })();
    } else if (!addr && walletInfo.address) {
      setWalletInfo(EMPTY_STATE);
    }
  }, [user?.wallet?.address, walletInfo.address]);

  return { ...walletInfo, login: handleLogin, logout: handleLogout };
}
