#!/usr/bin/env bash
# === Gride X Central - Data Refresh Script ===
# Run this to pull latest data from Google Sheet and regenerate the site
# Usage: bash scripts/refresh-data.sh

set -e

echo "🔄 Pulling latest data from Google Sheet..."
maton google-sheets values get 1CEHLo22Sm6TJ9ng4EphXSYf7ywgfr5PN6KQle1Dv_Mc --range 'A:I' 2>&1 > /tmp/raw_sheet.txt

echo "📊 Generating data.json and app pages..."
python scripts/generate-site.py

echo "✅ Data refreshed! Now commit and deploy:"
echo "   git add -A && git commit -m \"Update data from sheet\" && git push"