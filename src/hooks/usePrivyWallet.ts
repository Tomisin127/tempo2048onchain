import { usePrivy } from '@privy-io/react-auth';
import { useState, useEffect, useCallback } from 'react';
import { getBalance, getUSDCBalance, getUSDCeBalance, switchToTempo } from '@/lib/tempoChain';

export interface PrivyWalletInfo {
  address: string | null;
  balance: string;
  usdcBalance: string;
  usdceBalance: string;
  hasFees: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
}

const EMPTY_STATE: PrivyWalletInfo = {
  address: null,
  balance: '0.00',
  usdcBalance: '0.00',
  usdceBalance: '0.00',
  hasFees: false,
  login: async () => {},
  logout: async () => {},
};

export function usePrivyWallet(): PrivyWalletInfo {
  // Check if we have a Privy App ID - if not, return empty state
  const hasPrivyAppId = !!import.meta.env.VITE_PRIVY_APP_ID;
  
  // Only call usePrivy if we have an app ID
  // Otherwise just return empty state to avoid "usePrivy must be within PrivyProvider" error
  if (!hasPrivyAppId) {
    return EMPTY_STATE;
  }

  const { user, login, logout, isReady } = usePrivy();
  const [wallet, setWallet] = useState<PrivyWalletInfo>(EMPTY_STATE);

  const computeHasFees = (a: string, b: string, c: string) =>
    parseFloat(a) + parseFloat(b) + parseFloat(c) >= 0.01;

  const handleLogin = useCallback(async () => {
    if (!login) return;
    try {
      await login({
        onComplete: async (u: any) => {
          const addr = u?.wallet?.address;
          if (!addr) return;
          try {
            await switchToTempo();
            const [bal, usdcBal, usdceBal] = await Promise.all([
              getBalance(addr),
              getUSDCBalance(addr),
              getUSDCeBalance(addr),
            ]);
            setWallet({
              address: addr,
              balance: bal,
              usdcBalance: usdcBal,
              usdceBalance: usdceBal,
              hasFees: computeHasFees(bal, usdcBal, usdceBal),
              login: handleLogin,
              logout: handleLogout,
            });
          } catch (err) {
            console.error('[v0] Setup:', err);
          }
        },
      });
    } catch (err) {
      console.error('[v0] Login:', err);
    }
  }, [login]);

  const handleLogout = useCallback(async () => {
    if (!logout) return;
    try {
      await logout();
    } catch (err) {
      console.error('[v0] Logout:', err);
    }
    setWallet(EMPTY_STATE);
  }, [logout]);

  useEffect(() => {
    const addr = user?.wallet?.address;
    if (addr && !wallet.address && isReady) {
      (async () => {
        try {
          const [bal, usdcBal, usdceBal] = await Promise.all([
            getBalance(addr),
            getUSDCBalance(addr),
            getUSDCeBalance(addr),
          ]);
          setWallet({
            address: addr,
            balance: bal,
            usdcBalance: usdcBal,
            usdceBalance: usdceBal,
            hasFees: computeHasFees(bal, usdcBal, usdceBal),
            login: handleLogin,
            logout: handleLogout,
          });
        } catch (err) {
          console.error('[v0] Balance:', err);
        }
      })();
    } else if (!addr && wallet.address && isReady) {
      setWallet(EMPTY_STATE);
    }
  }, [user?.wallet?.address, wallet.address, isReady, handleLogin, handleLogout]);

  return {
    ...wallet,
    login: handleLogin,
    logout: handleLogout,
  };
}
