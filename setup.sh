#!/bin/bash
echo "=== MiniC Compiler Setup ==="

echo ""
echo "→ Setting up Backend..."
cd backend
pip install -r requirements.txt --quiet
cd ..

echo ""
echo "→ Setting up Frontend..."
cd frontend
npm install --silent
cd ..

echo ""
echo "✓ Setup complete!"
echo ""
echo "Run backend:  cd backend && python app.py"
echo "Run frontend: cd frontend && npm run dev"
