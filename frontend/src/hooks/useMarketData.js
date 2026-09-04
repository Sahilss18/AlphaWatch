import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../services/api';

export function useMarketData() {
  const [watchlist, setWatchlist] = useState(null);
  const [signals, setSignals] = useState(null);
  const [marketSummary, setMarketSummary] = useState(null);
  const [apiStatus, setApiStatus] = useState({
    feed_status: 'LIVE',
    is_live: true,
    is_stale: false,
    message: 'Connecting to market stream...',
    data_age_seconds: 0,
    last_snapshot_time: null,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [lastRefreshedAt, setLastRefreshedAt] = useState(new Date());

  const isMounted = useRef(true);

  const fetchAllData = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) {
      setIsRefreshing(true);
    }

    try {
      setError(null);
      // Fetch concurrently
      const [wlData, sigData, mktData, statusData] = await Promise.all([
        api.getWatchlist(),
        api.getSignals(),
        api.getMarketSummary(),
        api.getStatus().catch(() => ({
          feed_status: 'DELAYED',
          is_live: false,
          is_stale: true,
          message: 'Unable to check live feed status',
          data_age_seconds: 60,
          last_snapshot_time: new Date().toISOString(),
        })),
      ]);

      if (isMounted.current) {
        setWatchlist(wlData);
        setSignals(sigData);
        setMarketSummary(mktData);
        if (statusData) setApiStatus(statusData);
        setLastRefreshedAt(new Date());
      }
    } catch (err) {
      console.error('Failed to load market data:', err);
      if (isMounted.current) {
        setError(err.message || 'Failed to communicate with AlphaWatch backend.');
      }
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    }
  }, []);

  // Initial load
  useEffect(() => {
    isMounted.current = true;
    fetchAllData();

    // Auto refresh every 45 seconds
    const interval = setInterval(() => {
      fetchAllData();
    }, 45000);

    return () => {
      isMounted.current = false;
      clearInterval(interval);
    };
  }, [fetchAllData]);

  // Add stock ticker
  const addTicker = async (symbol, companyName = null) => {
    try {
      const res = await api.addTicker(symbol, companyName);
      try {
        await fetchAllData(true);
      } catch (refreshErr) {
        console.warn('Background refresh after addTicker had minor delay:', refreshErr);
      }
      return res || { success: true };
    } catch (err) {
      console.error('Failed to add ticker:', err);
      throw err;
    }
  };

  // Remove stock ticker
  const removeTicker = async (symbol) => {
    try {
      const res = await api.removeTicker(symbol);
      try {
        await fetchAllData(true);
      } catch (refreshErr) {
        console.warn('Background refresh after removeTicker had minor delay:', refreshErr);
      }
      return res || { success: true };
    } catch (err) {
      console.error('Failed to remove ticker:', err);
      throw err;
    }
  };

  // Record a fresh visit checkpoint (resets baseline for "Since your last visit")
  const recordVisitCheckpoint = async () => {
    try {
      setIsRefreshing(true);
      const res = await api.recordVisit();
      await fetchAllData(true);
      return res;
    } catch (err) {
      console.error('Failed to record visit checkpoint:', err);
      throw err;
    } finally {
      setIsRefreshing(false);
    }
  };

  return {
    watchlist,
    signals,
    marketSummary,
    apiStatus,
    isLoading,
    isRefreshing,
    error,
    lastRefreshedAt,
    refreshData: () => fetchAllData(true),
    addTicker,
    removeTicker,
    recordVisitCheckpoint,
  };
}
