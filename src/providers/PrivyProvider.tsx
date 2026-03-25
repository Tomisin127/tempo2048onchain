import { PrivyProvider as PrivyProviderBase } from '@privy-io/react-auth';
import React from 'react';

interface PrivyProviderProps {
  children: React.ReactNode;
}

// Your actual Privy App ID
const APP_ID = import.meta.env.VITE_PRIVY_APP_ID;

export const PrivyProvider: React.FC<PrivyProviderProps> = ({ children }) => {
  // If no app ID, don't wrap with Privy - components will handle missing Privy gracefully
  if (!APP_ID) {
    console.log('[v0] VITE_PRIVY_APP_ID not set - Privy features disabled');
    return <>{children}</>;
  }

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
