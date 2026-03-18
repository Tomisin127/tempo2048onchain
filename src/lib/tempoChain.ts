import { createPublicClient, http, defineChain, formatEther, type PublicClient } from 'viem';

export const tempoMainnet = defineChain({
  id: 4217,
  name: 'Tempo Mainnet',
  nativeCurrency: {
    decimals: 18,
    name: 'USD',
    symbol: 'USD',
  },
  rpcUrls: {
    default: {
      http: ['https://rpc.tempo.xyz'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Tempo Explorer',
      url: 'https://explorer.tempo.xyz',
    },
  },
});

export const CHAIN_ID_HEX = '0x1079';
export const CHAIN_ID = 4217;

let publicClient: PublicClient | null = null;

export function getPublicClient(): PublicClient {
  if (!publicClient) {
    publicClient = createPublicClient({
      chain: tempoMainnet,
      transport: http(),
    }) as PublicClient;
  }
  return publicClient;
}

export async function getBalance(address: string): Promise<string> {
  const client = getPublicClient();
  try {
    const balance = await client.getBalance({ address: address as `0x${string}` });
    return parseFloat(formatEther(balance)).toFixed(4);
  } catch {
    return '0.0000';
  }
}

export async function switchToTempo(): Promise<boolean> {
  if (!window.ethereum) return false;

  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: CHAIN_ID_HEX }],
    });
    return true;
  } catch (switchError: any) {
    if (switchError.code === 4902) {
      try {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: CHAIN_ID_HEX,
            chainName: 'Tempo Mainnet',
            nativeCurrency: { name: 'USD', symbol: 'USD', decimals: 18 },
            rpcUrls: ['https://rpc.tempo.xyz'],
            blockExplorerUrls: ['https://explorer.tempo.xyz'],
          }],
        });
        return true;
      } catch {
        return false;
      }
    }
    return false;
  }
}

export async function sendMoveTransaction(
  from: string,
  moveDirection: number,
  moveCount: number,
  score: number,
): Promise<string | null> {
  if (!window.ethereum) return null;

  try {
    // Encode move data in the transaction data field
    const moveData = `0x2048${moveDirection.toString(16).padStart(2, '0')}${moveCount.toString(16).padStart(8, '0')}${score.toString(16).padStart(16, '0')}`;

    const txHash = await window.ethereum.request({
      method: 'eth_sendTransaction',
      params: [{
        from,
        to: from, // self-transfer to record move on-chain
        value: '0x0',
        data: moveData,
      }],
    });

    return txHash as string;
  } catch (err) {
    console.error('Transaction failed:', err);
    return null;
  }
}

declare global {
  interface Window {
    ethereum?: any;
  }
}
