#!/bin/bash
# GitHub Actions終了時のフック

STATUS=$1  # success or failure

# macOSの場合は音声通知
if [[ "$OSTYPE" == "darwin"* ]]; then
    if [ "$STATUS" = "success" ]; then
        # 成功音
        afplay /System/Library/Sounds/Hero.aiff &
        say "Miyabiによる自動実装が成功しました" &
        osascript -e "display notification \"自動実装が完了しました\" with title \"✅ Miyabi Success\""
    else
        # 失敗音
        afplay /System/Library/Sounds/Basso.aiff &
        say "Miyabiによる自動実装が失敗しました" &
        osascript -e "display notification \"自動実装に失敗しました\" with title \"❌ Miyabi Failed\""
    fi
fi

# Slackやその他の通知サービスへの送信も可能
if [ ! -z "$SLACK_WEBHOOK" ]; then
    if [ "$STATUS" = "success" ]; then
        MESSAGE="✅ Miyabi completed automatic implementation successfully"
    else
        MESSAGE="❌ Miyabi automatic implementation failed"
    fi
    
    curl -X POST $SLACK_WEBHOOK \
        -H 'Content-type: application/json' \
        --data "{\"text\":\"$MESSAGE\"}"
fi