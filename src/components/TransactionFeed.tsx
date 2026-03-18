import React from 'react';
import { EXPLORER_URL } from '@/lib/tempoChain';

export interface TxRecord {
  hash: string;
  direction: string;
  moveNumber: number;
  score: number;
  timestamp: number;
  status: 'pending' | 'confirmed' | 'failed';
}

interface TransactionFeedProps {
  transactions: TxRecord[];
}

const statusColors: Record<string, string> = {
  pending: 'text-yellow-400',
  confirmed: 'text-primary',
  failed: 'text-destructive',
};

const statusDot: Record<string, string> = {
  pending: 'bg-yellow-400 animate-pulse',
  confirmed: 'bg-primary',
  failed: 'bg-destructive',
};

const TransactionFeed: React.FC<TransactionFeedProps> = ({ transactions }) => {
  return (
    <div className="bg-card border border-border rounded-xl p-4 h-full flex flex-col">
      <h3 className="font-display font-bold text-sm text-muted-foreground mb-3 uppercase tracking-wider">
        Transaction Feed
      </h3>

      <div className="flex-1 overflow-y-auto space-y-2 min-h-0 scrollbar-thin">
        {transactions.length === 0 && (
          <p className="text-muted-foreground text-xs font-mono text-center py-8">
            No transactions yet.
            <br />
            Connect wallet & play to record moves on-chain.
          </p>
        )}

        {transactions.map((tx, i) => (
          <div
            key={tx.hash + i}
            className="bg-muted rounded-lg p-3 animate-slide-in"
          >
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${statusDot[tx.status]}`} />
                <span className="font-display text-xs font-semibold text-foreground">
                  Move #{tx.moveNumber}
                </span>
              </div>
              <span className={`text-xs font-mono ${statusColors[tx.status]}`}>
                {tx.status}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground font-mono">
                {tx.direction.toUpperCase()}
              </span>
              <span className="text-xs text-muted-foreground font-mono">
                Score: {tx.score}
              </span>
            </div>

            <div className="mt-1">
              <a
                href={`${EXPLORER_URL}/tx/${tx.hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] font-mono text-primary hover:underline truncate block"
              >
                {tx.hash.slice(0, 10)}...{tx.hash.slice(-8)}
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TransactionFeed;
