#!/bin/bash

# Setup and Run Script for Kasir-Node Application

echo "===================================="
echo "Sistem Peminjaman Alat - Setup"
echo "===================================="
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo "✓ Dependencies installed"
else
    echo "✓ Dependencies already installed"
fi

# Check if .env exists
if [ ! -f ".env" ]; then
    echo ""
    echo "⚠️  .env file not found. Creating default .env..."
    cat > .env << 'EOF'
NODE_ENV=development
PORT=3000
DATABASE_URL=mysql://root:root@localhost:3306/kasir_db
JWT_SECRET=your-secret-key-change-this-in-production
FORCE_SYNC=false
EOF
    echo "✓ .env created with defaults"
    echo "⚠️  Update DATABASE_URL with your actual database configuration"
fi

echo ""
echo "===================================="
echo "🚀 Starting application..."
echo "===================================="
echo ""

# Start the application
npm run dev
