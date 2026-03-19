export const mockAgent: INLOAgent = {
  name: "Jarvis",
  createdAt: "2025-02-01",
};

export const mockStrategies: INLOStrategy[] = [
  {
    id: "1",
    name: "Alpha-seeker",
    description: "Auto-Rebalancing",
    allocations: 5,
    currentValue: 3090.9,
    invested: 2800,
    pnlPercent: 2.1,
    pnlAmount: 290.9,
    status: "running",
    icon: "lightning",
  },
  {
    id: "2",
    name: "Balance-Yield",
    description: "Auto-Rebalancing",
    allocations: 3,
    currentValue: 2100.5,
    invested: 1500,
    pnlPercent: 1.8,
    pnlAmount: 600.5,
    status: "running",
    icon: "shield",
  },
  {
    id: "3",
    name: "Capital-Safe",
    description: "Auto-Rebalancing",
    allocations: 2,
    currentValue: 6808.69,
    invested: 700,
    pnlPercent: 3.5,
    pnlAmount: 6108.69,
    status: "running",
    icon: "lock",
  },
];

export const mockPortfolio: INLOPortfolio = {
  totalHoldings: 12000.09,
  totalInvested: 5000,
  totalYield: 7000.09,
  strategies: mockStrategies,
};

export const mockPositions: INLOPosition[] = [
  {
    id: "p1",
    strategyId: "1",
    strategyName: "Alpha-seeker",
    agentName: "Alpha-seeker",
    invested: 2800,
    currentValue: 3090.9,
    pnlPercent: 2.1,
    pnlAmount: 290.9,
    createdAt: "10 Days ago",
    status: "active",
  },
  {
    id: "p2",
    strategyId: "1",
    strategyName: "Alpha-seeker",
    agentName: "Dads-Fund",
    invested: 2800,
    currentValue: 3090.9,
    pnlPercent: 2.1,
    pnlAmount: 290.9,
    createdAt: "10 Days ago",
    status: "active",
  },
  {
    id: "p3",
    strategyId: "1",
    strategyName: "Alpha-seeker",
    agentName: "Alpha-seeker",
    invested: 2800,
    currentValue: 3000,
    pnlPercent: 2.1,
    pnlAmount: 200,
    createdAt: "12 Mar 2026",
    closedAt: "12 Mar 2026",
    closeReason: "Strategy reallocation",
    status: "closed",
  },
];

export const mockPools: INLOPool[] = [
  { id: "pool1", pair: "BNB/USDT", apy: 8.2, value: 1200, invested: 1000 },
  { id: "pool2", pair: "BNB/USDT", apy: 8.2, value: 1200, invested: 1000 },
  { id: "pool3", pair: "BNB/USDT", apy: 8.2, value: 1200, invested: 1000 },
];

export const mockActivities: INLOActivity[] = [
  {
    id: "a1",
    description: "Range boundaries stable",
    icon: "shield",
    timestamp: "2h ago",
    type: "rebalance",
  },
  {
    id: "a2",
    description: "Strategy shift: Volatility spike",
    icon: "trending",
    timestamp: "3h ago",
    type: "rebalance",
  },
  {
    id: "a3",
    description: "Allocation temporarily adjusted",
    icon: "adjust",
    timestamp: "12h ago",
    type: "rebalance",
  },
  {
    id: "a4",
    description: "Position on hold due to volatility",
    icon: "pause",
    timestamp: "12h ago",
    type: "withdraw",
  },
];

export const mockPerformanceData: INLOPerformancePoint[] = [
  { time: "12:00", value: 5000 },
  { time: "01:00", value: 4800 },
  { time: "02:00", value: 5200 },
  { time: "03:00", value: 8000 },
  { time: "04:00", value: 7500 },
  { time: "05:00", value: 6000 },
  { time: "06:00", value: 9000 },
  { time: "07:00", value: 12000 },
  { time: "08:00", value: 15000 },
  { time: "09:00", value: 50000 },
  { time: "10:00", value: 100000 },
  { time: "11:00", value: 200000 },
  { time: "12:00", value: 350000 },
];

export const mockFundDistribution = [
  { name: "Alpha-Seeker", defaultPercent: 40 },
  { name: "Balance-Yield", defaultPercent: 32 },
  { name: "Capital-Safe", defaultPercent: 28 },
];
