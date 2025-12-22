/**
 * Portfolio History Storage Service
 * Stores periodic snapshots of portfolio value in Chrome local storage
 */

import { loadFromChromeLocalStorage, saveInChromeLocalStorage } from './storageChromeLocal';

const PORTFOLIO_HISTORY_KEY = 'portfolio_history';
const MAX_HISTORY_ENTRIES = 90; // Keep 90 days of history
const SNAPSHOT_INTERVAL_MS = 1000 * 60 * 60; // 1 hour minimum between snapshots

export interface PortfolioSnapshot {
  timestamp: number;
  value: number; // Total portfolio value in USD
  xrpBalance: number; // XRP balance (for reference)
  xrpPrice: number; // XRP price at snapshot time
}

export interface PortfolioHistoryData {
  [walletAddress: string]: PortfolioSnapshot[];
}

/**
 * Load portfolio history from Chrome local storage
 */
export const loadPortfolioHistory = async (): Promise<PortfolioHistoryData> => {
  try {
    const data = await loadFromChromeLocalStorage(PORTFOLIO_HISTORY_KEY);
    return (data as PortfolioHistoryData) || {};
  } catch {
    return {};
  }
};

/**
 * Save portfolio history to Chrome local storage
 */
export const savePortfolioHistory = async (data: PortfolioHistoryData): Promise<void> => {
  await saveInChromeLocalStorage(PORTFOLIO_HISTORY_KEY, data);
};

/**
 * Add a new portfolio snapshot for a wallet
 */
export const addPortfolioSnapshot = async (
  walletAddress: string,
  value: number,
  xrpBalance: number,
  xrpPrice: number
): Promise<void> => {
  const history = await loadPortfolioHistory();
  const walletHistory = history[walletAddress] || [];

  // Check if enough time has passed since last snapshot
  const lastSnapshot = walletHistory[walletHistory.length - 1];
  const now = Date.now();

  if (lastSnapshot && now - lastSnapshot.timestamp < SNAPSHOT_INTERVAL_MS) {
    // Update the last snapshot instead of adding a new one
    walletHistory[walletHistory.length - 1] = {
      timestamp: now,
      value,
      xrpBalance,
      xrpPrice
    };
  } else {
    // Add new snapshot
    walletHistory.push({
      timestamp: now,
      value,
      xrpBalance,
      xrpPrice
    });
  }

  // Trim history to max entries
  if (walletHistory.length > MAX_HISTORY_ENTRIES) {
    walletHistory.splice(0, walletHistory.length - MAX_HISTORY_ENTRIES);
  }

  history[walletAddress] = walletHistory;
  await savePortfolioHistory(history);
};

/**
 * Get portfolio history for a specific wallet
 */
export const getWalletPortfolioHistory = async (
  walletAddress: string
): Promise<PortfolioSnapshot[]> => {
  const history = await loadPortfolioHistory();
  return history[walletAddress] || [];
};

/**
 * Clear portfolio history for a wallet
 */
export const clearWalletPortfolioHistory = async (walletAddress: string): Promise<void> => {
  const history = await loadPortfolioHistory();
  delete history[walletAddress];
  await savePortfolioHistory(history);
};

/**
 * Get percentage change between first and last snapshot
 */
export const getPortfolioChange = (snapshots: PortfolioSnapshot[]): number => {
  if (snapshots.length < 2) return 0;

  const firstValue = snapshots[0].value;
  const lastValue = snapshots[snapshots.length - 1].value;

  if (firstValue === 0) return 0;

  return ((lastValue - firstValue) / firstValue) * 100;
};

/**
 * Format portfolio data for chart display
 */
export const formatPortfolioDataForChart = (
  snapshots: PortfolioSnapshot[]
): { time: string; value: number; date: Date }[] => {
  return snapshots.map((snapshot) => {
    const date = new Date(snapshot.timestamp);
    return {
      time: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      value: snapshot.value,
      date
    };
  });
};
