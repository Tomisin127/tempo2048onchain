import { useState, useEffect, useCallback } from 'react';
import { getBalance, getUSDCBalance, getUSDCeBalance, switchToTempo, CHAIN_ID_HEX, MIN_FEE_USD } from '@/lib/tempoChain';
import type { WalletType } from '@/types/wallet';

interface WalletState {
  walletType: WalletType | null;
  address: string | null;
  balance: string;
  usdcBalance: string;
  usdceBalance: string;
  connected: boolean;
  connecting: boolean;
  chainCorrect: boolean;
  hasFees: boolean;
}

export function useWallet() {
  const [state, setState] = useState<WalletState>({
    walletType: null,
    address: null,
    balance: '0.0000',
    usdcBalance: '0.00',
    usdceBalance: '0.00',
    connected: false,
    connecting: false,
    chainCorrect: false,
    hasFees: false,
  });

  const checkChain = useCallback(async () => {
    if (!window.ethereum) return false;
    try {
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      return chainId === CHAIN_ID_HEX;
    } catch {
      return false;
    }
  }, []);

  const computeHasFees = (nativeBal: string, usdcBal: string, usdceBal: string) => {
    const total = parseFloat(nativeBal) + parseFloat(usdcBal) + parseFloat(usdceBal);
    return total >= MIN_FEE_USD;
  };

  const refreshBalance = useCallback(async (addr: string) => {
    try {
      const [bal, usdcBal, usdceBal] = await Promise.all([
        getBalance(addr),
        getUSDCBalance(addr),
        getUSDCeBalance(addr),
      ]);
      const hasFees = computeHasFees(bal, usdcBal, usdceBal);
      setState(s => ({ ...s, balance: bal, usdcBalance: usdcBal, usdceBalance: usdceBal, hasFees }));
    } catch (err) {
      console.error('[v0] Error refreshing balance:', err);
    }
  }, []);

  const connectMetaMask = useCallback(async () => {
    if (!window.ethereum) {
      window.open('https://metamask.io', '_blank');
      return;
    }

    setState(s => ({ ...s, connecting: true }));

    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      if (accounts.length === 0) {
        setState(s => ({ ...s, connecting: false }));
        return;
      }

      const switched = await switchToTempo();
      const address = accounts[0];
      const [bal, usdcBal, usdceBal] = await Promise.all([
        getBalance(address),
        getUSDCBalance(address),
        getUSDCeBalance(address),
      ]);
      const hasFees = computeHasFees(bal, usdcBal, usdceBal);

      setState({
        walletType: 'metamask',
        address,
        balance: bal,
        usdcBalance: usdcBal,
        usdceBalance: usdceBal,
        connected: true,
        connecting: false,
        chainCorrect: switched,
        hasFees,
      });
    } catch (err) {
      console.error('[v0] MetaMask connection error:', err);
      setState(s => ({ ...s, connecting: false }));
    }
  }, []);

  const connectPrivy = useCallback(async () => {
    try {
      setState(s => ({ ...s, connecting: true }));
      // Import Privy hook dynamically to use it inside the callback
      const { usePrivy } = await import('@privy-io/react-auth');
      // Note: This won't work because hooks can't be called in callbacks
      // Instead, we'll signal that Privy login should be triggered from the component
      console.log('[v0] Privy connection requested - should be handled by Privy UI');
      setState(s => ({ ...s, connecting: false }));
    } catch (err) {
      console.error('[v0] Privy setup error:', err);
      setState(s => ({ ...s, connecting: false }));
    }
  }, []);

  const connect = useCallback(async () => {
    await connectMetaMask();
  }, [connectMetaMask]);

  const disconnect = useCallback(async () => {
    setState({
      walletType: null,
      address: null,
      balance: '0.0000',
      usdcBalance: '0.00',
      usdceBalance: '0.00',
      connected: false,
      connecting: false,
      chainCorrect: false,
      hasFees: false,
    });
  }, []);

  // Monitor MetaMask account/chain changes
  useEffect(() => {
    if (state.walletType !== 'metamask' || !window.ethereum) return;

    const handleAccountsChanged = async (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnect();
      } else {
        const [bal, usdcBal, usdceBal] = await Promise.all([
          getBalance(accounts[0]),
          getUSDCBalance(accounts[0]),
          getUSDCeBalance(accounts[0]),
        ]);
        const correct = await checkChain();
        const hasFees = computeHasFees(bal, usdcBal, usdceBal);
        setState({ 
          walletType: 'metamask',
          address: accounts[0], 
          balance: bal, 
          usdcBalance: usdcBal, 
          usdceBalance: usdceBal, 
          connected: true, 
          connecting: false, 
          chainCorrect: correct, 
          hasFees 
        });
      }
    };

    const handleChainChanged = async () => {
      const correct = await checkChain();
      setState(s => ({ ...s, chainCorrect: correct }));
      if (state.address) refreshBalance(state.address);
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    return () => {
      window.ethereum?.removeListener('accountsChanged', handleAccountsChanged);
      window.ethereum?.removeListener('chainChanged', handleChainChanged);
    };
  }, [state.walletType, state.address, checkChain, disconnect, refreshBalance]);

  return { 
    ...state, 
    connect, 
    connectMetaMask,
    connectPrivy,
    disconnect, 
    refreshBalance 
  };
}
