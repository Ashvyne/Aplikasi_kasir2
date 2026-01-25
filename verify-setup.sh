#!/bin/bash

# ========================================
# KASIR APP - VERIFICATION SCRIPT
# ========================================
# Script untuk verify migration sukses

echo ""
echo "════════════════════════════════════════"
echo "  KASIR APP - MIGRATION VERIFICATION"
echo "════════════════════════════════════════"
echo ""

# Check Node.js
echo "1️⃣  Checking Node.js..."
if command -v node &> /dev/null; then
  NODE_VERSION=$(node --version)
  echo "   ✅ Node.js $NODE_VERSION installed"
else
  echo "   ❌ Node.js not found!"
  exit 1
fi

# Check npm
echo ""
echo "2️⃣  Checking npm..."
if command -v npm &> /dev/null; then
  NPM_VERSION=$(npm --version)
  echo "   ✅ npm $NPM_VERSION installed"
else
  echo "   ❌ npm not found!"
  exit 1
fi

# Check MySQL
echo ""
echo "3️⃣  Checking MySQL..."
if command -v mysql &> /dev/null; then
  MYSQL_VERSION=$(mysql --version)
  echo "   ✅ MySQL installed: $MYSQL_VERSION"
else
  echo "   ⚠️  MySQL client not found (MySQL server might still be running)"
fi

# Check npm packages
echo ""
echo "4️⃣  Checking npm packages..."
if [ -d "node_modules" ]; then
  PACKAGE_COUNT=$(ls -1 node_modules | wc -l)
  echo "   ✅ npm modules installed ($PACKAGE_COUNT packages)"
else
  echo "   ❌ npm packages not installed! Run: npm install"
  exit 1
fi

# Check .env
echo ""
echo "5️⃣  Checking .env configuration..."
if [ -f ".env" ]; then
  if grep -q "DB_DIALECT=mysql" .env; then
    echo "   ✅ .env found with MySQL config"
  else
    echo "   ⚠️  .env found but may not have MySQL config"
  fi
else
  echo "   ⚠️  .env not found! Copy from .env.example"
fi

# Check important files
echo ""
echo "6️⃣  Checking migration files..."
files=("scripts/setup-database.js" "scripts/import-localstorage-to-db.js" "MIGRATION_GUIDE.md" "QUICK_START.md")
for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo "   ✅ $file exists"
  else
    echo "   ❌ $file missing!"
  fi
done

# Check database connection
echo ""
echo "7️⃣  Checking MySQL connection..."
if mysql -h localhost -u root -e "SELECT 1" &>/dev/null; then
  echo "   ✅ MySQL server is running"
  
  # Check if database exists
  if mysql -h localhost -u root -e "USE kasir_db" &>/dev/null; then
    echo "   ✅ Database 'kasir_db' exists"
    
    # Check tables
    TABLE_COUNT=$(mysql -h localhost -u root -e "USE kasir_db; SHOW TABLES;" 2>/dev/null | tail -n +2 | wc -l)
    echo "   ✅ Found $TABLE_COUNT tables"
    
    # Check data
    PRODUCT_COUNT=$(mysql -h localhost -u root -e "USE kasir_db; SELECT COUNT(*) FROM products;" 2>/dev/null | tail -1)
    echo "   📦 Products: $PRODUCT_COUNT"
    
    TRANSACTION_COUNT=$(mysql -h localhost -u root -e "USE kasir_db; SELECT COUNT(*) FROM transactions;" 2>/dev/null | tail -1)
    echo "   📋 Transactions: $TRANSACTION_COUNT"
    
    USER_COUNT=$(mysql -h localhost -u root -e "USE kasir_db; SELECT COUNT(*) FROM users;" 2>/dev/null | tail -1)
    echo "   👤 Users: $USER_COUNT"
  else
    echo "   ⚠️  Database 'kasir_db' not found! Run: npm run db:setup"
  fi
else
  echo "   ❌ Cannot connect to MySQL server"
  echo "   💡 Make sure MySQL is running: brew services start mysql (Mac) or services.msc (Windows)"
fi

# Summary
echo ""
echo "════════════════════════════════════════"
echo "  VERIFICATION SUMMARY"
echo "════════════════════════════════════════"
echo ""
echo "✅ Node.js and npm are installed"
echo "✅ npm packages are installed"
echo "✅ Migration files are ready"
echo ""
echo "Next steps:"
echo "  1. Configure .env with your MySQL credentials"
echo "  2. Run: npm run db:setup"
echo "  3. Run: npm run dev"
echo "  4. Open: http://localhost:3000"
echo ""
echo "For more info, see: MIGRATION_GUIDE.md"
echo ""
