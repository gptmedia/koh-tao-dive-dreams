#!/bin/bash
# Clean install script for koh-tao-dive-dreams

echo "🧹 Cleaning up old dependencies..."
rm -rf node_modules
rm -f package-lock.json

echo "📦 Installing fresh dependencies..."
npm install

echo "🔍 Verifying installation..."
npm list rolldown 2>/dev/null | head -5

echo "✅ Clean install complete!"
echo ""
echo "Next steps:"
echo "1. Test locally: npm run dev"
echo "2. Build: npm run build"
echo "3. Push to GitHub: git add . && git commit -m 'Clean npm install' && git push"
