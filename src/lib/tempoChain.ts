import { createPublicClient, http, defineChain, formatEther, formatUnits, type PublicClient } from 'viem';

// USDC contract on Tempo Mainnet (TIP-20 stablecoin)
export const USDC_ADDRESS = '0x9A40946455c5aEe19648C92261fC0AD24a7e44F2' as const;

// USDC.e (Stargate-bridged) on Tempo Mainnet
export const USDCE_ADDRESS = '0xbB5d04F616f00e1e3813b44c2b24756883c50D7C' as const;

// Minimal ERC20 ABI for balance reading
const ERC20_ABI = [
  {
    name: 'balanceOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const;

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
      url: 'https://explore.tempo.xyz',
    },
  },
});

export const CHAIN_ID_HEX = '0x1079';
export const CHAIN_ID = 4217;
export const EXPLORER_URL = 'https://explore.tempo.xyz';

// Minimum fee for a transaction — Tempo uses stablecoin fees, < $0.001 per TIP-20 transfer
export const MIN_FEE_USD = 0.001;

// Game contract / recipient address for move transactions
export const GAME_RECIPIENT = '0xEA549e458e77Fd93bf330e5EAEf730c50d8F5249' as const;

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

export async function getUSDCBalance(address: string): Promise<string> {
  return getTokenBalance(address, USDC_ADDRESS);
}

export async function getUSDCeBalance(address: string): Promise<string> {
  return getTokenBalance(address, USDCE_ADDRESS);
}

async function getTokenBalance(address: string, tokenAddress: `0x${string}`): Promise<string> {
  const client = getPublicClient();
  try {
    const balance = await (client as any).readContract({
      address: tokenAddress,
      abi: ERC20_ABI,
      functionName: 'balanceOf',
      args: [address as `0x${string}`],
    });
    return parseFloat(formatUnits(balance as bigint, 6)).toFixed(2);
  } catch {
    return '0.00';
  }
}

export async function estimateGasCost(): Promise<string> {
  const client = getPublicClient();
  try {
    const gasPrice = await client.getGasPrice();
    // Simple transaction gas limit ~21000
    const cost = gasPrice * BigInt(21000);
    return parseFloat(formatEther(cost)).toFixed(6);
  } catch {
    return '0.000001';
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
            blockExplorerUrls: ['https://explore.tempo.xyz'],
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
    const client = getPublicClient();
    
    // 1. Get the CONFIRMED nonce (not 'pending') to ensure sequential ordering
    // This ensures each transaction has a unique, incrementing nonce
    const nonce = await client.getTransactionCount({
      address: from as `0x${string}`,
      blockTag: 'latest',
    });
    console.log('[2048] Current nonce for', from, ':', nonce);

    // 2. Get current gas prices from the network
    const gasPrice = await client.getGasPrice();
    // Use 1.2x current gas price for safety
    const maxFeePerGas = (gasPrice * BigInt(120)) / BigInt(100);
    const maxPriorityFeePerGas = (gasPrice / BigInt(10)); // 10% priority bump

    // 3. Encode move data - This is the calldata sent to the game contract
    // Standard ABI encoding with function selector + parameters
    const moveData = encodeAbiParameters(
      [
        { type: 'uint8', name: 'direction' },
        { type: 'uint32', name: 'moveCount' },
        { type: 'uint32', name: 'score' },
      ],
      [moveDirection, moveCount, score]
    );

    console.log('[v0] Preparing transaction:', { 
      from, 
      to: GAME_RECIPIENT, 
      nonce,
      direction: moveDirection, 
      moveCount, 
      score,
      gasPrice: gasPrice.toString(),
      maxFeePerGas: maxFeePerGas.toString(),
      maxPriorityFeePerGas: maxPriorityFeePerGas.toString(),
      dataLength: moveData.length,
    });

    // 4. Send transaction with all required parameters
    // The key is to use 'latest' blockTag for nonce to ensure proper sequencing
    const txHash = await window.ethereum.request({
      method: 'eth_sendTransaction',
      params: [{
        from,
        to: GAME_RECIPIENT,
        value: '0x0',
        data: moveData,
        gas: '0x186a0', // 100,000 gas (standard for contract calls)
        nonce: '0x' + nonce.toString(16),
        maxFeePerGas: '0x' + maxFeePerGas.toString(16),
        maxPriorityFeePerGas: '0x' + maxPriorityFeePerGas.toString(16),
      }],
    });

    console.log('[v0] Transaction sent with hash:', txHash, 'nonce:', nonce);
    return txHash as string;
  } catch (err: any) {
    console.error('[v0] Transaction failed:', err?.code, err?.message, err);
    return null;
  }
}

// Helper to encode ABI parameters following Solidity's packed encoding format
function encodeAbiParameters(
  types: Array<{ type: string; name: string }>,
  values: any[]
): string {
  let encoded = '0x';
  
  for (let i = 0; i < types.length; i++) {
    const type = types[i].type;
    const value = values[i];
    
    if (type === 'uint8') {
      // uint8: 1 byte, padded to 2 hex chars
      encoded += value.toString(16).padStart(2, '0');
    } else if (type === 'uint32') {
      // uint32: 4 bytes, padded to 8 hex chars
      encoded += value.toString(16).padStart(8, '0');
    } else if (type === 'uint256') {
      // uint256: 32 bytes, padded to 64 hex chars
      encoded += BigInt(value).toString(16).padStart(64, '0');
    } else if (type === 'address') {
      // address: 20 bytes, remove 0x prefix and pad to 40 hex chars
      encoded += value.slice(2).padStart(40, '0').toLowerCase();
    }
  }
  
  return encoded;
}

export async function getGasPrice(): Promise<string> {
  const client = getPublicClient();
  try {
    const gasPrice = await client.getGasPrice();
    return parseFloat(formatEther(gasPrice * BigInt(1e9))).toFixed(6);
  } catch {
    return '0.000000';
  }
}

export async function getBlockNumber(): Promise<number> {
  const client = getPublicClient();
  try {
    const block = await client.getBlockNumber();
    return Number(block);
  } catch {
    return 0;
  }
}

declare global {
  interface Window {
    ethereum?: any;
  }
}
