// utils/balanceRefresh.js
// Global utility for managing balance refreshes across components

/**
 * Global Balance Refresh Utility
 * 
 * This utility provides centralized balance refresh functionality
 * that can be used from any component or after any transaction.
 */

class BalanceRefreshManager {
  constructor() {
    this.refreshInProgress = false;
    this.lastRefreshTime = 0;
    this.refreshQueue = [];
    this.REFRESH_COOLDOWN = 2000; // 2 seconds between refreshes
  }

  /**
   * Force refresh balance across all components
   * @param {Object} options - Refresh options
   * @param {boolean} options.immediate - Skip cooldown period
   * @param {number} options.delay - Delay before refresh (ms)
   * @param {string} options.reason - Reason for refresh (for debugging)
   */
  forceRefresh(options = {}) {
    const { immediate = false, delay = 0, reason = 'manual' } = options;
    
    console.log(`🔄 Global Balance Refresh triggered - Reason: ${reason}`);
    
    const executeRefresh = () => {
      const now = Date.now();
      
      // Check cooldown unless immediate
      if (!immediate && now - this.lastRefreshTime < this.REFRESH_COOLDOWN) {
        console.log("⏸️ Skipping refresh - cooldown period active");
        return false;
      }
      
      this.lastRefreshTime = now;
      this.refreshInProgress = true;
      
      // Dispatch refresh events
      const refreshEvents = [
        'refreshBalance',
        'refreshWalletBalance',
        'forceBalanceRefetch'
      ];
      
      refreshEvents.forEach(eventName => {
        window.dispatchEvent(new CustomEvent(eventName, {
          detail: { reason, timestamp: now }
        }));
      });
      
      // Set flag for components that check localStorage
      localStorage.setItem('balanceNeedsRefresh', 'true');
      localStorage.setItem('refreshReason', reason);
      localStorage.setItem('refreshTimestamp', now.toString());
      
      // Clear refresh in progress after a delay
      setTimeout(() => {
        this.refreshInProgress = false;
      }, 1000);
      
      console.log("✅ Balance refresh events dispatched");
      return true;
    };
    
    if (delay > 0) {
      setTimeout(executeRefresh, delay);
    } else {
      return executeRefresh();
    }
  }

  /**
   * Refresh balance after successful staking
   * @param {string} txHash - Transaction hash
   * @param {string} amount - Staked amount
   */
  refreshAfterStake(txHash, amount) {
    console.log(`🎯 Refreshing balance after stake: ${amount} STIM`);
    
    // Immediate refresh
    this.forceRefresh({
      immediate: true,
      reason: `stake_success_${amount}`
    });
    
    // Additional refreshes to ensure balance updates
    const refreshDelays = [3000, 6000, 10000]; // 3s, 6s, 10s
    
    refreshDelays.forEach((delay, index) => {
      this.forceRefresh({
        delay,
        reason: `stake_followup_${index + 1}`
      });
    });
    
    // Dispatch stake-specific event
    window.dispatchEvent(new CustomEvent('stakeSuccess', {
      detail: { txHash, amount, timestamp: Date.now() }
    }));
  }

  /**
   * Refresh balance after successful transaction
   * @param {string} type - Transaction type (stake, claim, transfer, etc.)
   * @param {Object} details - Transaction details
   */
  refreshAfterTransaction(type, details = {}) {
    console.log(`🔄 Refreshing balance after ${type} transaction`);
    
    const refreshSchedule = {
      stake: [1000, 3000, 6000], // Quick succession for stakes
      claim: [2000, 5000], // Moderate for claims
      transfer: [1000, 4000], // Standard for transfers
      approval: [500] // Quick for approvals
    };
    
    const delays = refreshSchedule[type] || [2000];
    
    delays.forEach((delay, index) => {
      this.forceRefresh({
        delay,
        reason: `${type}_${index + 1}`,
        ...details
      });
    });
  }

  /**
   * Schedule periodic balance refresh
   * @param {number} interval - Refresh interval in ms (default: 30s)
   */
  startPeriodicRefresh(interval = 30000) {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
    
    this.refreshInterval = setInterval(() => {
      this.forceRefresh({ reason: 'periodic' });
    }, interval);
    
    console.log(`📅 Periodic balance refresh started (${interval}ms)`);
  }

  /**
   * Stop periodic refresh
   */
  stopPeriodicRefresh() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
      console.log("⏹️ Periodic balance refresh stopped");
    }
  }

  /**
   * Get refresh status
   */
  getStatus() {
    return {
      refreshInProgress: this.refreshInProgress,
      lastRefreshTime: this.lastRefreshTime,
      timeSinceLastRefresh: Date.now() - this.lastRefreshTime,
      periodicRefreshActive: !!this.refreshInterval
    };
  }

  /**
   * Clear refresh flags and reset state
   */
  reset() {
    this.refreshInProgress = false;
    this.lastRefreshTime = 0;
    this.stopPeriodicRefresh();
    localStorage.removeItem('balanceNeedsRefresh');
    localStorage.removeItem('refreshReason');
    localStorage.removeItem('refreshTimestamp');
    console.log("🧹 Balance refresh manager reset");
  }
}

// Create global instance
const balanceRefreshManager = new BalanceRefreshManager();

// Export convenience functions
export const forceBalanceRefresh = (options) => balanceRefreshManager.forceRefresh(options);
export const refreshAfterStake = (txHash, amount) => balanceRefreshManager.refreshAfterStake(txHash, amount);
export const refreshAfterTransaction = (type, details) => balanceRefreshManager.refreshAfterTransaction(type, details);
export const startPeriodicRefresh = (interval) => balanceRefreshManager.startPeriodicRefresh(interval);
export const stopPeriodicRefresh = () => balanceRefreshManager.stopPeriodicRefresh();
export const getRefreshStatus = () => balanceRefreshManager.getStatus();
export const resetRefreshManager = () => balanceRefreshManager.reset();

// Attach to window for debugging
if (typeof window !== 'undefined') {
  window.balanceRefreshManager = balanceRefreshManager;
  window.forceGlobalBalanceRefresh = (options) => balanceRefreshManager.forceRefresh(options);
}

export default balanceRefreshManager;

// Usage Examples:
/*
// In your Prediction component after successful stake:
import { refreshAfterStake } from './utils/balanceRefresh';

// After stake success
refreshAfterStake(transactionHash, stakeAmount);

// In any component for manual refresh:
import { forceBalanceRefresh } from './utils/balanceRefresh';

const handleRefresh = () => {
  forceBalanceRefresh({ reason: 'user_request' });
};

// In app initialization:
import { startPeriodicRefresh } from './utils/balanceRefresh';

useEffect(() => {
  if (isConnected) {
    startPeriodicRefresh(30000); // Every 30 seconds
  }
  return () => stopPeriodicRefresh();
}, [isConnected]);

// For debugging in console:
window.forceGlobalBalanceRefresh({ immediate: true, reason: 'debug' });
window.balanceRefreshManager.getStatus();
*/