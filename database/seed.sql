-- SIGNAL/WATCH Seed Data
USE signal_watch;

-- Demo User
INSERT INTO users (id, name, email) 
VALUES ('demo-user-001', 'Demo User', 'demo@signalwatch.io')
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- Default Primary Watchlist
INSERT INTO watchlists (id, user_id, name)
VALUES (1, 'demo-user-001', 'Core Tech & Semis')
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- Default Watchlist Stocks
INSERT INTO watchlist_stocks (watchlist_id, symbol, company_name)
VALUES 
(1, 'NVDA', 'NVIDIA Corp'),
(1, 'AAPL', 'Apple Inc'),
(1, 'PLTR', 'Palantir Technologies Inc'),
(1, 'MSFT', 'Microsoft Corporation'),
(1, 'SMCI', 'Super Micro Computer Inc'),
(1, 'ARM', 'Arm Holdings plc'),
(1, 'TSLA', 'Tesla Inc'),
(1, 'AMD', 'Advanced Micro Devices Inc'),
(1, 'COIN', 'Coinbase Global Inc')
ON DUPLICATE KEY UPDATE company_name = VALUES(company_name);

-- Stock Metrics (Historical Baselines for Volatility and Volume)
INSERT INTO stock_metrics (symbol, average_volume, volatility, week_52_high, week_52_low, resistance_level, support_level)
VALUES 
('NVDA', 48500000, 2.45, 235.00, 85.00, 230.00, 180.00),
('AAPL', 55000000, 1.25, 245.00, 165.00, 240.00, 210.00),
('PLTR', 62000000, 3.80, 75.00, 20.00, 72.00, 48.00),
('MSFT', 22000000, 1.15, 468.00, 385.00, 460.00, 410.00),
('SMCI', 18000000, 5.60, 122.00, 18.00, 65.00, 25.00),
('ARM', 14000000, 3.20, 188.00, 95.00, 175.00, 120.00),
('TSLA', 85000000, 3.40, 360.00, 138.00, 345.00, 200.00),
('AMD', 52000000, 2.75, 185.00, 115.00, 165.00, 125.00),
('COIN', 12000000, 4.50, 340.00, 140.00, 320.00, 185.00)
ON DUPLICATE KEY UPDATE volatility = VALUES(volatility), average_volume = VALUES(average_volume);

-- Record Initial User Visit 4 hours ago for checkpointing
INSERT INTO user_visits (user_id, visited_at)
VALUES ('demo-user-001', DATE_SUB(NOW(), INTERVAL 4 HOUR));
