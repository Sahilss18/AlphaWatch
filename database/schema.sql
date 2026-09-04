-- SIGNAL/WATCH Database Schema
-- MySQL 8.0+

CREATE DATABASE IF NOT EXISTS signal_watch CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE signal_watch;

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- User Visits Table
CREATE TABLE IF NOT EXISTS user_visits (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL,
    visited_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    checkpoint_snapshot_id INT NULL,
    INDEX idx_user_visits_user_time (user_id, visited_at),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Watchlists Table
CREATE TABLE IF NOT EXISTS watchlists (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL,
    name VARCHAR(255) NOT NULL DEFAULT 'Primary Watchlist',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_watchlists_user (user_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Watchlist Stocks Table
CREATE TABLE IF NOT EXISTS watchlist_stocks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    watchlist_id INT NOT NULL,
    symbol VARCHAR(20) NOT NULL,
    company_name VARCHAR(255) NULL,
    sector VARCHAR(100) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_watchlist_symbol (watchlist_id, symbol),
    INDEX idx_watchlist_stocks_sym (symbol),
    FOREIGN KEY (watchlist_id) REFERENCES watchlists(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Market Snapshots Table
CREATE TABLE IF NOT EXISTS market_snapshots (
    id INT AUTO_INCREMENT PRIMARY KEY,
    symbol VARCHAR(20) NOT NULL,
    price DECIMAL(14, 4) NOT NULL,
    previous_close DECIMAL(14, 4) NOT NULL,
    change_amount DECIMAL(14, 4) NOT NULL,
    change_percent DECIMAL(8, 4) NOT NULL,
    day_high DECIMAL(14, 4) NULL,
    day_low DECIMAL(14, 4) NULL,
    open_price DECIMAL(14, 4) NULL,
    volume BIGINT NULL DEFAULT 0,
    timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    source VARCHAR(50) NOT NULL DEFAULT 'finnhub',
    is_stale BOOLEAN NOT NULL DEFAULT FALSE,
    INDEX idx_snapshots_sym_time (symbol, timestamp DESC)
) ENGINE=InnoDB;

-- Stock Metrics Table (Baselines & Volatilities)
CREATE TABLE IF NOT EXISTS stock_metrics (
    id INT AUTO_INCREMENT PRIMARY KEY,
    symbol VARCHAR(20) NOT NULL UNIQUE,
    sector VARCHAR(100) NULL,
    average_volume BIGINT NULL DEFAULT 0,
    volatility DECIMAL(8, 4) NULL DEFAULT 1.8,
    week_52_high DECIMAL(14, 4) NULL,
    week_52_low DECIMAL(14, 4) NULL,
    resistance_level DECIMAL(14, 4) NULL,
    support_level DECIMAL(14, 4) NULL,
    calculated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_metrics_symbol (symbol)
) ENGINE=InnoDB;

-- Change Events Table
CREATE TABLE IF NOT EXISTS change_events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    watchlist_id INT NOT NULL,
    symbol VARCHAR(20) NOT NULL,
    event_type VARCHAR(50) NOT NULL,
    old_value DECIMAL(14, 4) NULL,
    new_value DECIMAL(14, 4) NULL,
    percentage_change DECIMAL(8, 4) NOT NULL,
    attention_score INT NOT NULL,
    attention_level VARCHAR(20) NOT NULL,
    reason TEXT NOT NULL,
    detected_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_change_events_wl_time (watchlist_id, detected_at DESC),
    INDEX idx_change_events_score (attention_score DESC),
    FOREIGN KEY (watchlist_id) REFERENCES watchlists(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Signal Lifecycles Table
CREATE TABLE IF NOT EXISTS signal_lifecycles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    watchlist_id INT NOT NULL,
    symbol VARCHAR(20) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'DETECTED', -- DETECTED, DEVELOPING, CONFIRMED, FADING, CLOSED
    initial_score INT NOT NULL,
    peak_score INT NOT NULL,
    current_score INT NOT NULL,
    detected_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    closed_at DATETIME NULL,
    INDEX idx_lifecycles_sym_status (symbol, status),
    INDEX idx_lifecycles_wl (watchlist_id),
    FOREIGN KEY (watchlist_id) REFERENCES watchlists(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Signal Lifecycle Events Table (Timeline History)
CREATE TABLE IF NOT EXISTS signal_lifecycle_events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    lifecycle_id INT NOT NULL,
    symbol VARCHAR(20) NOT NULL,
    from_status VARCHAR(30) NULL,
    to_status VARCHAR(30) NOT NULL,
    score INT NOT NULL,
    reason VARCHAR(255) NOT NULL,
    timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_lifecycle_events_sym_time (symbol, timestamp DESC),
    INDEX idx_lifecycle_events_parent (lifecycle_id),
    FOREIGN KEY (lifecycle_id) REFERENCES signal_lifecycles(id) ON DELETE CASCADE
) ENGINE=InnoDB;
