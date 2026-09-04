const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (import.meta.env.PROD ? '' : 'http://localhost:8000');
const DEMO_USER_ID = 'demo-user-001';

async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL.replace(/\/$/, '')}${endpoint}`;
  
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      let errorMessage = `HTTP Error ${response.status}: ${response.statusText}`;
      try {
        const errorData = await response.json();
        if (errorData.detail) {
          errorMessage = typeof errorData.detail === 'string' 
            ? errorData.detail 
            : JSON.stringify(errorData.detail);
        }
      } catch {
        // ignore json parse error
      }
      throw new Error(errorMessage);
    }

    return await response.json();
  } catch (error) {
    console.error(`API Request to ${url} failed:`, error);
    throw error;
  }
}

export const api = {
  // Watchlist
  getWatchlist: (userId = DEMO_USER_ID) => 
    request(`/api/watchlist?user_id=${encodeURIComponent(userId)}`),

  getWatchlistHealth: (userId = DEMO_USER_ID) =>
    request(`/api/watchlist/health?user_id=${encodeURIComponent(userId)}`),

  addTicker: (symbol, companyName = null, userId = DEMO_USER_ID) =>
    request(`/api/watchlist?user_id=${encodeURIComponent(userId)}`, {
      method: 'POST',
      body: JSON.stringify({ symbol: symbol.toUpperCase().trim(), company_name: companyName }),
    }),

  removeTicker: (symbol, userId = DEMO_USER_ID) =>
    request(`/api/watchlist/${encodeURIComponent(symbol.toUpperCase().trim())}?user_id=${encodeURIComponent(userId)}`, {
      method: 'DELETE',
    }),

  // Signals & Differentiators
  getSignals: (userId = DEMO_USER_ID) =>
    request(`/api/signals?user_id=${encodeURIComponent(userId)}`),

  getSignalDetail: (symbol, userId = DEMO_USER_ID) =>
    request(`/api/signals/${encodeURIComponent(symbol.toUpperCase().trim())}?user_id=${encodeURIComponent(userId)}`),

  getSignalLifecycle: (symbol, userId = DEMO_USER_ID) =>
    request(`/api/signals/${encodeURIComponent(symbol.toUpperCase().trim())}/lifecycle?user_id=${encodeURIComponent(userId)}`),

  getSignalContext: (symbol, userId = DEMO_USER_ID) =>
    request(`/api/signals/${encodeURIComponent(symbol.toUpperCase().trim())}/context?user_id=${encodeURIComponent(userId)}`),

  getSignalScoreBreakdown: (symbol, userId = DEMO_USER_ID) =>
    request(`/api/signals/${encodeURIComponent(symbol.toUpperCase().trim())}/score-breakdown?user_id=${encodeURIComponent(userId)}`),

  // Market Summary & Search
  getMarketSummary: () =>
    request('/api/market/summary'),

  searchSymbols: (query) =>
    request(`/api/market/search/${encodeURIComponent(query)}`),

  getStockHistory: (symbol, userId = DEMO_USER_ID) =>
    request(`/api/history/${encodeURIComponent(symbol.toUpperCase().trim())}?user_id=${encodeURIComponent(userId)}`),

  // Visits & Checkpoints
  recordVisit: (userId = DEMO_USER_ID) =>
    request(`/api/visit?user_id=${encodeURIComponent(userId)}`, {
      method: 'POST',
      body: JSON.stringify({ user_id: userId }),
    }),

  // Status & Health
  getStatus: () =>
    request('/api/status'),

  getHealth: () =>
    request('/api/health'),
};

export default api;
