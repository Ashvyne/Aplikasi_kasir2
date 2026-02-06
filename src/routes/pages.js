/**
 * SETUP HALAMAN-HALAMAN UNTUK SISTEM KASIR BARU
 * 
 * Routing untuk halaman-halaman HTML yang baru dengan design modern
 */

const express = require('express');
const router = express.Router();
const path = require('path');

// ============ PUBLIC PAGES (No Authentication Required) ============

// Login page (new system)
router.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/login.html'));
});

// Redirect /login.html to /login
router.get('/login.html', (req, res) => {
  res.redirect('/login');
});

// Sign Up page
router.get('/signup', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/signup.html'));
});

// Redirect /signup.html to /signup
router.get('/signup.html', (req, res) => {
  res.redirect('/signup');
});

// ============ PROTECTED PAGES (Authentication Required) ============

// Admin Dashboard
router.get('/dashboard', (req, res) => {
  // Frontend akan handle authentication check
  res.sendFile(path.join(__dirname, '../public/dashboard-admin.html'));
});

router.get('/admin', (req, res) => {
  res.redirect('/dashboard');
});

// Cashier Dashboard
router.get('/cashier', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/dashboard-cashier.html'));
});

router.get('/pos', (req, res) => {
  res.redirect('/cashier');
});

// Index/Home redirect to dashboard
router.get('/', (req, res) => {
  res.redirect('/dashboard');
});

// Root index.html
router.get('/index.html', (req, res) => {
  res.redirect('/dashboard');
});

module.exports = router;
