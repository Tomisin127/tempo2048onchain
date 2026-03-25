export type WalletType = 'metamask' | 'privy';

export interface WalletState {
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
