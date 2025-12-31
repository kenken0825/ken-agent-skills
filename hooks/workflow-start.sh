#!/bin/bash
# GitHub Actions開始時のフック

# macOSの場合は音声通知
if [[ "$OSTYPE" == "darwin"* ]]; then
    # 開始音
    afplay /System/Library/Sounds/Glass.aiff &
    
    # 音声通知
    say "Miyabiによる自動実装が開始されました" &
    
    # デスクトップ通知
    osascript -e "display notification \"自動実装が開始されました\" with title \"🚀 Miyabi Started\""
fi

# Slackやその他の通知サービスへの送信も可能
if [ ! -z "$SLACK_WEBHOOK" ]; then
    curl -X POST $SLACK_WEBHOOK \
        -H 'Content-type: application/json' \
        --data '{"text":"🚀 Miyabi started automatic implementation"}'
fi