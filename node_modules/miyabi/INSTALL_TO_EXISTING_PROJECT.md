# 📦 既存プロジェクトへのMiyabi追加ガイド

**既存のプロジェクトにMiyabiを追加する完全ガイド**

所要時間: **約5分** ⏱️

---

## 🎯 このガイドの目的

既にあるプロジェクト（GitHubリポジトリ）にMiyabiを追加して、AI自動化を導入する方法を説明します。

---

## ✅ 事前準備

以下が必要です：

1. **既存のGitHubリポジトリ** （ローカルにclone済み）
2. **GitHubトークン** （Miyabiで設定済み）
3. **ターミナル/コマンドプロンプト**

### まだMiyabiの設定をしていない方

先に設定を完了してください：

```bash
# どこでも良いので実行
npx miyabi

# メニューから「🌸 初めての方（セットアップガイド）」を選択
# または「⚙️ 設定」を選択
```

---

## 📝 手順

### ステップ1: 既存プロジェクトのフォルダに移動

**ターミナルを開いて、プロジェクトのフォルダに移動します:**

```bash
cd /path/to/your/existing-project
```

**例:**
```bash
# Macの場合
cd ~/Documents/my-app

# Windowsの場合
cd C:\Users\YourName\Documents\my-app
```

**💡 確認方法:**
```bash
# 現在のフォルダを表示
pwd  # Mac/Linux
cd   # Windows

# Git管理されているか確認
git status
# → "On branch main" などと表示されればOK
```

### ステップ2: Miyabi installコマンドを実行

プロジェクトフォルダで以下を実行：

```bash
npx miyabi install
```

**初回実行時の表示:**
```
Need to install the following packages:
miyabi@0.3.0
Ok to proceed? (y)
```
↑ `y` を入力してEnter

### ステップ3: メニューから「既存プロジェクトに追加」を選択

```
✨ Miyabi

一つのコマンドで全てが完結

? 何をしますか？
  🌸 初めての方（セットアップガイド）
  🆕 新しいプロジェクトを作成
❯ 📦 既存プロジェクトに追加  ← これを選択
  📊 ステータス確認
  ⚙️  設定
  ❌ 終了
```

**矢印キー（↑↓）で「📦 既存プロジェクトに追加」を選んでEnter**

### ステップ4: ドライラン（テスト実行）の選択

```
? ドライラン（実際には変更しない）で確認しますか？
```

**選択肢:**
- **Yes** - 何が追加されるか確認だけする（おすすめ - 初回）
- **No** - すぐに追加する

**🔰 初めての方は「Yes」を選んでください**

### ステップ5: プロジェクト解析結果の確認

Miyabiが自動的にプロジェクトを分析します：

```
🔍 プロジェクト解析中...

Analyzing your existing project...

✔ Project analysis complete

📊 Analysis Results:

  Repository: my-app
  Languages: TypeScript, JavaScript
  Framework: React
  Open Issues: 5
  Pull Requests: 2
```

**確認内容:**
- リポジトリ名が正しいか
- 言語・フレームワークが検出されているか
- Issue/PRの数が合っているか

### ステップ6: インストール確認

```
? Install Miyabi into this project? (Y/n)
```

**選択:**
- **Y** - インストールを実行
- **n** - キャンセル

**Yを入力してEnter**

### ステップ7: 自動インストール開始

以下が自動で実行されます：

```
🚀 Miyabiをインストール中...

✓ ラベルをデプロイしました（53個）
  - 既存ラベルは保持
  - 不足しているラベルのみ追加

✓ ワークフローをデプロイしました
  - .github/workflows/issue-opened.yml
  - .github/workflows/pr-opened.yml
  - .github/workflows/project-sync.yml
  既存ファイルは上書きしません

✓ 既存Issueを自動ラベリングしました（5件）
  - Issue #1: 🐛 type:bug, ⚠️ priority:P1-High
  - Issue #2: ✨ type:feature, 📊 priority:P2-Medium
  ...

✓ GitHub Projectsと連携しました

🎉 Miyabiのインストールが完了しました！
```

---

## 🔍 何が追加されたか確認する

### 追加されたファイル

```bash
# 追加されたファイルを確認
git status
```

**通常、以下が追加されます:**

```
新しいファイル:
  .github/workflows/issue-opened.yml
  .github/workflows/pr-opened.yml
  .github/workflows/project-sync.yml
  .miyabi.yml (既に存在する場合は追加されません)
```

### GitHubで確認

**ブラウザでGitHubを開いて確認:**

1. **ラベル:**
   - `https://github.com/あなたのユーザー名/プロジェクト名/labels`
   - 53個のラベルが追加されているはず

2. **ワークフロー:**
   - `https://github.com/あなたのユーザー名/プロジェクト名/actions`
   - 3つの新しいワークフローが表示されるはず

3. **既存Issueのラベル:**
   - `https://github.com/あなたのユーザー名/プロジェクト名/issues`
   - 既存のIssueに自動でラベルが付いているはず

---

## 📤 GitHubにプッシュする

追加されたファイルをGitHubにプッシュします：

```bash
# 変更を確認
git status

# 全ての変更を追加
git add .

# コミット
git commit -m "feat: Add Miyabi for AI automation"

# GitHubにプッシュ
git push origin main
```

**💡 ブランチ名が異なる場合:**
```bash
# 現在のブランチ名を確認
git branch

# mainの代わりに表示されたブランチ名を使う
git push origin <ブランチ名>
```

---

## 🎉 使ってみる

### 1. 新しいIssueを作成

```bash
gh issue create \
  --title "READMEを更新" \
  --body "プロジェクトの説明を分かりやすく書き直す"
```

または、GitHubのWebから作成：
- `https://github.com/あなたのユーザー名/プロジェクト名/issues/new`

### 2. 自動ラベリングを確認

数秒後、自動的にラベルが付きます：

```
✨ type:feature
📊 priority:P2-Medium
📥 state:pending
🎯 phase:planning
```

### 3. エージェントの動きを確認

```bash
# ステータス確認
npx miyabi status

# または
cd プロジェクトフォルダ
npx miyabi
# → 「📊 ステータス確認」を選択
```

---

## ❓ よくある質問

### Q1: 既存のファイルが上書きされませんか？

**A:** いいえ、上書きされません。

- 既存ファイルは保持されます
- 同名のワークフローがある場合、スキップされます
- ラベルも既存のものは残ります

### Q2: 既存のラベルはどうなりますか？

**A:** 既存ラベルは保持されます。

- Miyabiのラベルが追加されるだけ
- 既存ラベルは削除されません
- 同名のラベルがある場合、そのまま使われます

### Q3: Miyabiが不要になったら削除できますか？

**A:** はい、簡単に削除できます。

```bash
# 追加されたファイルを削除
rm -rf .github/workflows/issue-opened.yml
rm -rf .github/workflows/pr-opened.yml
rm -rf .github/workflows/project-sync.yml

# ラベルは手動で削除するか、そのまま残してもOK
```

### Q4: チーム開発で使えますか？

**A:** はい、使えます。

1. あなたがMiyabiをインストール
2. 変更をプッシュ
3. チームメンバーがpull
4. 全員が恩恵を受けられます

**チームメンバーはMiyabiをインストール不要です**
- Issueを作るだけで自動化が動きます

### Q5: 複数のプロジェクトに追加できますか？

**A:** はい、できます。

各プロジェクトで同じ手順を繰り返すだけです：

```bash
# プロジェクト1
cd ~/project1
npx miyabi install

# プロジェクト2
cd ~/project2
npx miyabi install
```

### Q6: エラーが出ました

**A:** よくあるエラーと解決方法

#### エラー1: "GITHUB_TOKEN not found"

```bash
# トークンを設定し直す
npx miyabi config
```

#### エラー2: "Not a git repository"

```bash
# Gitリポジトリか確認
git status

# Gitリポジトリでない場合
git init
git remote add origin https://github.com/ユーザー名/リポジトリ名.git
```

#### エラー3: "Repository not found"

GitHubリポジトリが存在しない、またはアクセス権限がありません：

```bash
# リモートURLを確認
git remote -v

# リポジトリがGitHubに存在するか確認
gh repo view
```

---

## 🎯 何が自動化されるか

Miyabiをインストールすると、以下が自動化されます：

### 1. Issue作成時

```
ユーザー: Issueを作成
    ↓
Miyabi: 自動でラベル付与
    - タイプ（bug/feature/docs）
    - 優先度（P0-P3）
    - 状態（pending）
    - フェーズ（planning）
    ↓
Miyabi: エージェント自動起動（将来）
    ↓
Miyabi: PR自動作成（将来）
```

### 2. PR作成時

```
ユーザー: PRを作成
    ↓
Miyabi: 自動でラベル付与
    - state:reviewing
    - phase:review
    ↓
Miyabi: レビューコメント自動投稿
```

### 3. Projects同期（オプション）

```
Issue/PR作成
    ↓
自動でGitHub Projectsに追加
    ↓
ステータスが自動更新
```

---

## 📚 さらに詳しく

### ドキュメント

- [README.md](./README.md) - 全機能の説明
- [SETUP_GUIDE.md](./SETUP_GUIDE.md) - 初回セットアップガイド
- [FOR_NON_PROGRAMMERS.md](./FOR_NON_PROGRAMMERS.md) - 初心者向けガイド

### コミュニティ

- GitHub Discussions: https://github.com/ShunsukeHayashi/Autonomous-Operations/discussions
- Issues（質問・バグ報告）: https://github.com/ShunsukeHayashi/Autonomous-Operations/issues

---

## 🎬 実際の使用例

### 例1: Next.jsプロジェクトに追加

```bash
# プロジェクトフォルダに移動
cd ~/my-nextjs-app

# Miyabiをインストール
npx miyabi install
# → メニューから「📦 既存プロジェクトに追加」を選択

# 結果確認
git status

# GitHubにプッシュ
git add .
git commit -m "feat: Add Miyabi automation"
git push

# テスト
gh issue create --title "トップページのデザイン改善" --body "もっとモダンなデザインにしたい"

# → 自動でラベルが付く！
```

### 例2: 既存の大規模プロジェクトに追加

```bash
# プロジェクトフォルダに移動
cd ~/large-project

# ドライランで確認（テスト）
npx miyabi install
# → 「Yes」でドライラン実行

# 問題なければ本番実行
npx miyabi install
# → 「No」を選択して実行

# 既存の100個のIssueに自動ラベリング
# → 数分待つ

# 確認
gh issue list --limit 10
# → ラベルが付いている！
```

---

## ✨ まとめ

**既存プロジェクトへのMiyabi追加は超簡単：**

1. プロジェクトフォルダに `cd`
2. `npx miyabi install` を実行
3. メニューから「📦 既存プロジェクトに追加」を選択
4. 完了！

**所要時間: 5分**

**既存ファイルは保持されます。安心してお試しください！** 🎉

---

**何か質問がありますか？**

気軽にIssueを立ててください：
https://github.com/ShunsukeHayashi/Autonomous-Operations/issues/new

**楽しい開発ライフを！** 🚀✨
