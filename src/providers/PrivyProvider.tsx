import { PrivyProvider as PrivyProviderBase } from '@privy-io/react-auth';
import React from 'react';

interface PrivyProviderProps {
  children: React.ReactNode;
}

// Always mount Privy so usePrivy() never throws "must be within PrivyProvider".
// The app ID falls back to a placeholder — Privy will reject auth but the app loads fine.
const APP_ID = import.meta.env.VITE_PRIVY_APP_ID || 'clqk5v2wo0036jz0fqbqvpumk';

export const PrivyProvider: React.FC<PrivyProviderProps> = ({ children }) => {
  return (
    <PrivyProviderBase
      appId={APP_ID}
      config={{
        embeddedWallets: {
          createOnLogin: 'users-without-wallets',
        },
      } as any}
    >
      {children}
    </PrivyProviderBase>
  );
};
