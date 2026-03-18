import { useState, useEffect, useCallback } from 'react';
import { getBalance, getUSDCBalance, switchToTempo, CHAIN_ID_HEX, MIN_GAS_USD } from '@/lib/tempoChain';

interface WalletState {
  address: string | null;
  balance: string;
  usdcBalance: string;
  connected: boolean;
  connecting: boolean;
  chainCorrect: boolean;
  hasGas: boolean;
}

export function useWallet() {
  const [state, setState] = useState<WalletState>({
    address: null,
    balance: '0.0000',
    usdcBalance: '0.00',
    connected: false,
    connecting: false,
    chainCorrect: false,
    hasGas: false,
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

  const refreshBalance = useCallback(async (addr: string) => {
    const [bal, usdcBal] = await Promise.all([
      getBalance(addr),
      getUSDCBalance(addr),
    ]);
    const hasGas = parseFloat(bal) >= MIN_GAS_USD;
    setState(s => ({ ...s, balance: bal, usdcBalance: usdcBal, hasGas }));
  }, []);

  const connect = useCallback(async () => {
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
      const [bal, usdcBal] = await Promise.all([
        getBalance(address),
        getUSDCBalance(address),
      ]);
      const hasGas = parseFloat(bal) >= MIN_GAS_USD;

      setState({
        address,
        balance: bal,
        usdcBalance: usdcBal,
        connected: true,
        connecting: false,
        chainCorrect: switched,
        hasGas,
      });
    } catch {
      setState(s => ({ ...s, connecting: false }));
    }
  }, []);

  const disconnect = useCallback(() => {
    setState({
      address: null,
      balance: '0.0000',
      usdcBalance: '0.00',
      connected: false,
      connecting: false,
      chainCorrect: false,
      hasGas: false,
    });
  }, []);

  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = async (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnect();
      } else {
        const [bal, usdcBal] = await Promise.all([
          getBalance(accounts[0]),
          getUSDCBalance(accounts[0]),
        ]);
        const correct = await checkChain();
        const hasGas = parseFloat(bal) >= MIN_GAS_USD;
        setState({ address: accounts[0], balance: bal, usdcBalance: usdcBal, connected: true, connecting: false, chainCorrect: correct, hasGas });
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
  }, [state.address, checkChain, disconnect, refreshBalance]);

  return { ...state, connect, disconnect, refreshBalance };
}
