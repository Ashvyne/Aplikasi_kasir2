#!/bin/bash

# CaféPOS Setup & Initialization Script
# This script helps set up both backend and frontend

echo "================================"
echo "🍽️  CaféPOS - Setup & Initialize"
echo "================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_step() {
    echo -e "${BLUE}▶${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Check Node.js
print_step "Checking Node.js..."
if ! command -v node &> /dev/null; then
    print_warning "Node.js not found! Please install Node.js 18+"
    exit 1
fi
NODE_VERSION=$(node -v)
print_success "Node.js $NODE_VERSION found"

# Backend Setup
echo ""
print_step "Setting up Backend..."
cd src

# Install backend dependencies
if [ ! -d "node_modules" ]; then
    print_step "Installing backend dependencies..."
    npm install
    print_success "Backend dependencies installed"
else
    print_success "Backend dependencies already installed"
fi

# Frontend Setup
echo ""
print_step "Setting up Frontend..."
cd ../frontend

# Install frontend dependencies
if [ ! -d "node_modules" ]; then
    print_step "Installing frontend dependencies..."
    npm install
    print_success "Frontend dependencies installed"
else
    print_success "Frontend dependencies already installed"
fi

# Check .env files
echo ""
print_step "Checking configuration files..."

if [ ! -f "../.env" ]; then
    print_warning ".env file not found in root"
    print_step "Creating .env from .env.example..."
    cp "../.env.example" "../.env"
    print_success ".env created - Please update database credentials"
else
    print_success ".env file exists"
fi

if [ ! -f ".env" ]; then
    print_warning ".env file not found in frontend/"
    print_step "Creating .env from .env.example..."
    cp ".env.example" ".env"
    print_success ".env created for frontend"
else
    print_success ".env file exists in frontend"
fi

# Summary
echo ""
echo "================================"
echo -e "${GREEN}✓ Setup Complete!${NC}"
echo "================================"
echo ""
echo "Next Steps:"
echo ""
echo "1. Backend:"
echo "   cd src"
echo "   npm run dev"
echo "   └─ Server will run on http://localhost:3000"
echo ""
echo "2. Frontend (in another terminal):"
echo "   cd frontend"
echo "   npm run dev"
echo "   └─ Frontend will run on http://localhost:5173"
echo ""
echo "3. Open http://localhost:5173/login"
echo "   Username: admin"
echo "   Password: 123456"
echo ""
echo "================================"
echo "Documentation: See CAFEPOD_README.md"
echo "================================"
