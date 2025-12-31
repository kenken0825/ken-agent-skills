# Miyabi自動セットアップ

このコマンドは、プログラミング初心者の方がMiyabiを簡単にセットアップできるように、Claude Codeが全自動で設定を行います。

## 実行内容

1. GitHubトークンの確認・案内
2. `npx miyabi config` を実行して設定
3. 最初のプロジェクト作成をサポート

## 手順

### ステップ1: GitHubトークンの準備

ユーザーに以下を案内してください：

```
🌸 Miyabiのセットアップを開始します！

まず、GitHubトークンが必要です。
以下の手順で作成してください：

1. このリンクを開いてください：
   https://github.com/settings/tokens/new

2. 以下の項目を入力：
   - Note: 「Miyabi用トークン」
   - Expiration: 「90 days」

3. 以下にチェック✅を入れる：
   ✅ repo
   ✅ workflow
   ✅ write:packages
   ✅ delete:packages
   ✅ admin:org
   ✅ project

4. 一番下の「Generate token」をクリック

5. 表示されたトークン（ghp_xxxxx...）をコピー
   ⚠️ 1回しか表示されないので必ずコピー！

トークンを作成したら、このチャットに貼り付けてください。
```

### ステップ2: トークンを受け取る

ユーザーがトークンを貼り付けたら：

1. トークンの形式を確認（`ghp_` または `github_pat_` で始まる）
2. 環境変数に設定：
   ```bash
   export GITHUB_TOKEN=<ユーザーが貼り付けたトークン>
   ```

### ステップ3: Miyabiの設定

以下のコマンドを実行して、設定ファイルを作成：

```bash
npx miyabi config
```

インタラクティブな質問には、ユーザーに確認しながら答えてください：

- **GitHub トークンを設定しますか？** → `Y`
- **GitHub トークン:** → 先ほどのトークンを入力
- **新規プロジェクトをデフォルトでプライベートにしますか？** → ユーザーに確認（おすすめは `Y`）
- **CLI の言語:** → 日本語（おすすめ）
- **詳細なエラーメッセージを表示しますか？** → 初心者は `N`
- **Issue の自動ラベリングを有効にしますか？** → `Y`
- **PR の自動レビューを有効にしますか？** → `Y`
- **GitHub Projects との自動同期を有効にしますか？** → ユーザーに確認

### ステップ4: 最初のプロジェクト作成

設定が完了したら、ユーザーに聞く：

```
✅ 設定完了！

最初のプロジェクトを作成しますか？
（練習用のテストプロジェクトをおすすめします）
```

ユーザーが「はい」と答えたら：

```bash
npx miyabi init my-first-miyabi-project
```

以下の質問に答える：
- **プロジェクト名:** → ユーザーに確認（デフォルト: my-first-miyabi-project）
- **プライベートリポジトリにしますか？** → ユーザーに確認

### ステップ5: 完了メッセージ

セットアップが完了したら：

```
🎉 おめでとうございます！

Miyabiのセットアップが完了しました。

次は何をする？

1. **Issueを作成してAIに実装してもらう**
   cd my-first-miyabi-project
   gh issue create --title "README.mdを作成" --body "プロジェクトのREADME.mdを作成してください"

   → 数分後、AIが自動でコードを書いてPRを作成します！

2. **エージェントの動きを見る**
   npx miyabi status --watch

   → リアルタイムでAIエージェントの動きを確認できます

3. **ヘルプを見る**
   npx miyabi --help

困ったときは SETUP_GUIDE.md を参照してください：
https://github.com/ShunsukeHayashi/Autonomous-Operations/blob/main/packages/cli/SETUP_GUIDE.md
```

## 注意事項

- **トークンは絶対に公開しないでください**
- チャット履歴からトークンを削除するようユーザーに案内
- セキュリティのため、トークンは環境変数またはローカルの設定ファイルのみに保存

## トラブルシューティング

### トークンエラーが出た場合

```bash
# トークンが正しく設定されているか確認
echo $GITHUB_TOKEN

# 設定ファイルを確認
cat .miyabi.yml
```

### コマンドが見つからない場合

```bash
# Node.jsがインストールされているか確認
node --version

# インストールされていない場合
# → https://nodejs.org/ からインストール
```
