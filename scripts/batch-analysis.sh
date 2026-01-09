#!/bin/bash
# Skilldex Batch Analysis Script

# 複数企業のURL分析を並列実行
echo "🚀 Starting batch analysis for multiple companies..."

# 企業リスト
COMPANIES=(
    "miyagawa-gyousei|https://miyagawa-gyousei.com/"
    "company2|https://example2.com/"
    "company3|https://example3.com/"
)

# 並列実行
for company in "${COMPANIES[@]}"; do
    IFS='|' read -r name url <<< "$company"
    echo "📊 Analyzing $name..."
    
    # バックグラウンドで実行
    npx tsx scripts/skilldex-cli.ts analyze -u "$url" -o "reports/${name}-report.md" &
done

# 全ての処理が完了するまで待機
wait

echo "✅ All analyses complete!"
echo "📁 Reports saved in ./reports/ directory"