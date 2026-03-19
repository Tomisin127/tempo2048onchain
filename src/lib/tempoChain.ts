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
    // 1. Get the confirmed nonce via direct RPC — ensures unique nonce per tx
    const nonceHex = await rpcCall('eth_getTransactionCount', [from, 'latest']);
    const nonce = hexToDecimal(nonceHex);

    // 2. Get gas price via direct RPC and apply 1.2x multiplier
    const gasPriceHex = await rpcCall('eth_gasPrice', []);
    const gasPrice = hexToBigInt(gasPriceHex);
    const maxFeePerGas = (gasPrice * BigInt(120)) / BigInt(100);
    const maxPriorityFeePerGas = gasPrice / BigInt(10);

    // 3. Encode move data as packed bytes (direction + moveCount + score)
    const moveData = encodeMoveData(moveDirection, moveCount, score);

    console.log('[v0] Sending tx — nonce:', nonce, 'direction:', moveDirection, 'moveCount:', moveCount, 'score:', score);

    // 4. Send transaction via MetaMask with all required EIP-1559 fields
    const txHash = await window.ethereum.request({
      method: 'eth_sendTransaction',
      params: [{
        from,
        to: GAME_RECIPIENT,
        value: '0x0',
        data: moveData,
        gas: '0x186a0', // 100,000 gas
        nonce: '0x' + nonce.toString(16),
        maxFeePerGas: '0x' + maxFeePerGas.toString(16),
        maxPriorityFeePerGas: '0x' + maxPriorityFeePerGas.toString(16),
      }],
    });

    console.log('[v0] Tx hash:', txHash, '| nonce used:', nonce);
    return txHash as string;
  } catch (err: any) {
    console.error('[v0] Transaction failed:', err?.code, err?.message);
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
