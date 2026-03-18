import React, { useState, useEffect } from 'react';
import { getBlockNumber, getGasPrice, EXPLORER_URL } from '@/lib/tempoChain';

const NetworkStatus: React.FC = () => {
  const [blockNumber, setBlockNumber] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const block = await getBlockNumber();
        setBlockNumber(block);
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 12000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <h3 className="font-display font-bold text-sm text-muted-foreground mb-3 uppercase tracking-wider">
        Tempo Network
      </h3>
      
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground font-mono">Status</span>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-xs font-mono text-primary">Live</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground font-mono">Chain ID</span>
          <span className="text-xs font-mono text-foreground">4217</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground font-mono">Block</span>
          <a
            href={`${EXPLORER_URL}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-mono text-primary hover:underline"
          >
            {loading ? '...' : `#${blockNumber.toLocaleString()}`}
          </a>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground font-mono">Gas Token</span>
          <span className="text-xs font-mono text-foreground">Any Stablecoin</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground font-mono">Fee Model</span>
          <span className="text-xs font-mono text-foreground">&lt; $0.001/tx</span>
        </div>
      </div>
    </div>
  );
};

export default NetworkStatus;
