-- ============================================================
-- Lost & Found Management System - Database Schema
-- Run this in MySQL Workbench to set up the database
-- ============================================================

CREATE DATABASE IF NOT EXISTS lostfounddb;
USE lostfounddb;

-- ==================== USERS TABLE ====================
CREATE TABLE IF NOT EXISTS users (
    user_id   INT AUTO_INCREMENT PRIMARY KEY,
    name      VARCHAR(100) NOT NULL,
    email     VARCHAR(150) NOT NULL UNIQUE,
    phone     VARCHAR(20),
    address   TEXT,
    password  VARCHAR(255)
);

-- Add password column if table already exists (safe to run again)
ALTER TABLE users ADD COLUMN IF NOT EXISTS password VARCHAR(255);

-- ==================== ITEMS TABLE ====================
CREATE TABLE IF NOT EXISTS items (
    item_id     INT AUTO_INCREMENT PRIMARY KEY,
    item_name   VARCHAR(100) NOT NULL,
    description TEXT,
    category    VARCHAR(50),
    color       VARCHAR(30)
);

-- ==================== LOST REPORTS TABLE ====================
CREATE TABLE IF NOT EXISTS lost_reports (
    lost_id       INT AUTO_INCREMENT PRIMARY KEY,
    user_id       INT,
    item_id       INT,
    date_lost     DATE,
    location_lost VARCHAR(200),
    status        VARCHAR(50) DEFAULT 'Pending',
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL,
    FOREIGN KEY (item_id) REFERENCES items(item_id) ON DELETE CASCADE
);

-- ==================== FOUND REPORTS TABLE ====================
CREATE TABLE IF NOT EXISTS found_reports (
    found_id       INT AUTO_INCREMENT PRIMARY KEY,
    user_id        INT,
    item_id        INT,
    date_found     DATE,
    location_found VARCHAR(200),
    status         VARCHAR(50) DEFAULT 'Unclaimed',
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL,
    FOREIGN KEY (item_id) REFERENCES items(item_id) ON DELETE CASCADE
);

-- ==================== CLAIMS TABLE ====================
CREATE TABLE IF NOT EXISTS claims (
    claim_id            INT AUTO_INCREMENT PRIMARY KEY,
    found_id            INT,
    user_id             INT,
    claim_date          DATE,
    verification_status VARCHAR(50) DEFAULT 'Pending',
    FOREIGN KEY (found_id) REFERENCES found_reports(found_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id)  REFERENCES users(user_id) ON DELETE SET NULL
);
