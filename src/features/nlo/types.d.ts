declare global {
  interface INLOAgent {
    name: string;
    createdAt: string;
  }

  interface INLOStrategy {
    id: string;
    name: string;
    description: string;
    allocations: number;
    currentValue: number;
    invested: number;
    pnlPercent: number;
    pnlAmount: number;
    status: "running" | "paused" | "closed";
    icon: string;
  }

  interface INLOPosition {
    id: string;
    strategyId: string;
    strategyName: string;
    agentName: string;
    invested: number;
    currentValue: number;
    pnlPercent: number;
    pnlAmount: number;
    createdAt: string;
    closedAt?: string;
    closeReason?: string;
    status: "active" | "closed";
  }

  interface INLOPool {
    id: string;
    pair: string;
    apy: number;
    value: number;
    invested: number;
  }

  interface INLOActivity {
    id: string;
    description: string;
    icon: string;
    timestamp: string;
    type?: "deposit" | "rebalance" | "withdraw";
    amount?: number;
  }

  interface INLOPortfolio {
    totalHoldings: number;
    totalInvested: number;
    totalYield: number;
    strategies: INLOStrategy[];
  }

  interface INLOPerformancePoint {
    time: string;
    value: number;
  }
}
export {};
