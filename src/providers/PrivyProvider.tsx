import { PrivyProvider as PrivyProviderBase } from '@privy-io/react-auth';
import React from 'react';

interface PrivyProviderProps {
  children: React.ReactNode;
}

export const PrivyProvider: React.FC<PrivyProviderProps> = ({ children }) => {
  const appId = import.meta.env.VITE_PRIVY_APP_ID;
  
  // If no Privy App ID is configured, just render children without Privy provider
  if (!appId) {
    console.warn('[v0] VITE_PRIVY_APP_ID not configured. Privy login will be unavailable.');
    return <>{children}</>;
  }

  return (
    <PrivyProviderBase
      appId={appId}
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
