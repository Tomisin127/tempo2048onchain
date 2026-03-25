// No external SDK imports — use direct RPC calls to avoid lock file conflicts

const RPC_URL = 'https://rpc.tempo.xyz';

// USDC contract on Tempo Mainnet (TIP-20 stablecoin)
export const USDC_ADDRESS = '0x9A40946455c5aEe19648C92261fC0AD24a7e44F2' as const;

// USDC.e (Stargate-bridged) on Tempo Mainnet
export const USDCE_ADDRESS = '0xbB5d04F616f00e1e3813b44c2b24756883c50D7C' as const;

export const CHAIN_ID_HEX = '0x1079';
export const CHAIN_ID = 4217;
export const EXPLORER_URL = 'https://explore.tempo.xyz';

export const MIN_FEE_USD = 0.001;

export const GAME_RECIPIENT = '0xEA549e458e77Fd93bf330e5EAEf730c50d8F5249' as const;

// Direct JSON-RPC helper — no SDK needed
async function rpcCall(method: string, params: any[] = []): Promise<any> {
  const res = await fetch(RPC_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
  });
  const json = await res.json();
  if (json.error) throw new Error(json.error.message);
  return json.result;
}

function hexToDecimal(hex: string): number {
  return parseInt(hex, 16);
}

function weiToEther(wei: bigint): string {
  return (Number(wei) / 1e18).toFixed(4);
}

function hexToBigInt(hex: string): bigint {
  return BigInt(hex);
}

// ERC-20 balanceOf selector: keccak256("balanceOf(address)") = 0x70a08231
function encodeBalanceOf(address: string): string {
  return '0x70a08231' + address.slice(2).padStart(64, '0');
}

export async function getBalance(address: string): Promise<string> {
  try {
    const result = await rpcCall('eth_getBalance', [address, 'latest']);
    const wei = hexToBigInt(result);
    return weiToEther(wei);
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

async function getTokenBalance(address: string, tokenAddress: string): Promise<string> {
  try {
    const data = encodeBalanceOf(address);
    const result = await rpcCall('eth_call', [{ to: tokenAddress, data }, 'latest']);
    const balance = hexToBigInt(result);
    return (Number(balance) / 1e6).toFixed(2);
  } catch {
    return '0.00';
  }
}

export async function estimateGasCost(): Promise<string> {
  try {
    const gasPrice = await rpcCall('eth_gasPrice', []);
    const gasPriceBig = hexToBigInt(gasPrice);
    const cost = gasPriceBig * BigInt(21000);
    return weiToEther(cost);
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
    console.log('[tempo] Sending move tx — direction:', moveDirection, 'moveCount:', moveCount, 'score:', score);

    // Send transaction with USDC as fee token
    // Tempo allows specifying feeToken to pay fees in any supported stablecoin
    const txHash = await window.ethereum.request({
      method: 'eth_sendTransaction',
      params: [{
        from,
        to: GAME_RECIPIENT,
        value: '0x0',
        feeToken: USDC_ADDRESS, // Use USDC for transaction fees
      }],
    });

    console.log('[tempo] Tx hash:', txHash);
    return txHash as string;
  } catch (err: any) {
    console.error('[tempo] Transaction failed:', err?.code, err?.message);
    return null;
  }
}

export async function getGasPrice(): Promise<string> {
  try {
    const gasPrice = await rpcCall('eth_gasPrice', []);
    const gasPriceBig = hexToBigInt(gasPrice);
    return (Number(gasPriceBig) / 1e9).toFixed(6);
  } catch {
    return '0.000000';
  }
}

export async function getBlockNumber(): Promise<number> {
  try {
    const result = await rpcCall('eth_blockNumber', []);
    return hexToDecimal(result);
  } catch {
    return 0;
  }
}

declare global {
  interface Window {
    ethereum?: any;
  }
}
