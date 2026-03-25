import { PrivyProvider as PrivyProviderBase } from '@privy-io/react-auth';
import React from 'react';

interface PrivyProviderProps {
  children: React.ReactNode;
}

export const PrivyProvider: React.FC<PrivyProviderProps> = ({ children }) => {
  return (
    <PrivyProviderBase
      appId={import.meta.env.VITE_PRIVY_APP_ID || ''}
      config={{
        embeddedWallets: {
          createOnLogin: 'users-without-wallets',
        },
        defaultChain: {
          chainId: 4217,
          chainName: 'Tempo Mainnet',
        },
        networks: [
          {
            chainId: 4217,
            name: 'Tempo Mainnet',
            rpcUrl: 'https://rpc.tempo.xyz',
            chainName: 'Tempo Mainnet',
            nativeCurrency: {
              name: 'USD',
              symbol: 'USD',
              decimals: 18,
            },
          },
        ],
      }}
    >
      {children}
    </PrivyProviderBase>
  );
};
