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

export function usePrivyWallet() {
  const { user, login, logout } = usePrivy();
  const [walletInfo, setWalletInfo] = useState<PrivyWalletInfo>({
    address: null,
    balance: '0.00',
    usdcBalance: '0.00',
    usdceBalance: '0.00',
    hasFees: false,
  });

  const computeHasFees = (nativeBal: string, usdcBal: string, usdceBal: string) => {
    const total = parseFloat(nativeBal) + parseFloat(usdcBal) + parseFloat(usdceBal);
    return total >= 0.01; // Minimum 0.01 USD
  };

  const handleLogin = useCallback(async () => {
    try {
      await login({
        onComplete: async (user) => {
          if (user?.wallet?.address) {
            try {
              const address = user.wallet.address;
              await switchToTempo();
              const [bal, usdcBal, usdceBal] = await Promise.all([
                getBalance(address),
                getUSDCBalance(address),
                getUSDCeBalance(address),
              ]);
              const hasFees = computeHasFees(bal, usdcBal, usdceBal);
              setWalletInfo({ address, balance: bal, usdcBalance: usdcBal, usdceBalance: usdceBal, hasFees });
            } catch (err) {
              console.error('[v0] Error setting up privy wallet:', err);
            }
          }
        },
      });
    } catch (err) {
      console.error('[v0] Privy login error:', err);
    }
  }, [login]);

  const handleLogout = useCallback(async () => {
    try {
      await logout();
    } catch (err) {
      console.error('[v0] Privy logout error:', err);
    }
    setWalletInfo({
      address: null,
      balance: '0.00',
      usdcBalance: '0.00',
      usdceBalance: '0.00',
      hasFees: false,
    });
  }, [logout]);

  // Monitor user changes
  useEffect(() => {
    if (user?.wallet?.address && !walletInfo.address) {
      const setupWallet = async () => {
        try {
          const [bal, usdcBal, usdceBal] = await Promise.all([
            getBalance(user.wallet.address),
            getUSDCBalance(user.wallet.address),
            getUSDCeBalance(user.wallet.address),
          ]);
          const hasFees = computeHasFees(bal, usdcBal, usdceBal);
          setWalletInfo({
            address: user.wallet.address,
            balance: bal,
            usdcBalance: usdcBal,
            usdceBalance: usdceBal,
            hasFees,
          });
        } catch (err) {
          console.error('[v0] Error fetching Privy wallet balance:', err);
        }
      };
      setupWallet();
    } else if (!user?.wallet?.address && walletInfo.address) {
      setWalletInfo({
        address: null,
        balance: '0.00',
        usdcBalance: '0.00',
        usdceBalance: '0.00',
        hasFees: false,
      });
    }
  }, [user?.wallet?.address, walletInfo.address]);

  return { ...walletInfo, login: handleLogin, logout: handleLogout };
}
