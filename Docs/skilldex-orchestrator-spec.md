# スキル図鑑OS統合仕様書

## 概要
- **名称**: skilldex-orchestrator
- **バージョン**: 0.1.0
- **オーナー**: けんけん
- **目的**: 実務ヒアリング→Agent Skill化→GitHubプール→抽象化→推薦ランキングまでを一気通貫で回す"スキル図鑑OS"

## コンセプト
- **ポケモンゲット型**: 現場で知見を捕獲→育成→進化→配布/採用化
- **北極星**: 現場のWinポイントからのみスキルを生み、再現性で進化させ、汎用スキルへ昇華する

## 運用原則
1. 机上の正解より、現場で効いた勝ち筋（Win）を最優先する
2. 事実と仮説を分けて扱う（仮説は仮説と明示）
3. スキルは"代謝する知識"であり、完成品ではなく進化させる
4. 段階的開示（Progressive Disclosure）で、必要な情報だけを扱う
5. スキルは説明可能・再利用可能であること

## エージェント構成
1. **Win Point Hunter**: 実務の勝ちポイントを嗅ぎ分け、Win指標へ結晶化する
2. **Pain Abstractor**: 個別相談からペインパターン（業界/職種）を抽象化し、横展開可能に
3. **Skill Recommender**: スキル図鑑から候補抽出し、網羅→絞り込み→ランキングを行う
4. **Skill Evolution Judge**: スキル進化段階（Lv1-4）を判定し、次の進化条件を明文化する
5. **GitHub Packager**: SKILL.md/YAML/README/変更履歴/検証手順を整備し、プール投入可能にする

## 入力モード
1. **client_urls**: 単一または複数のクライアントURL（会社HP/LP/採用/サービスページ等）
2. **hearing_notes**: ヒアリングメモ（断片可）
3. **hybrid**: URL + ヒアリングの併用

## スキル進化レベル
### Level 1: 個別最適（個人特化）
- **定義**: 1人の現場で『助かった』が発生
- **進化バー**: [■□□□]
- **条件**: ヒアリング実施、現場での効果発生（1 case）

### Level 2: 再現性確認（業種特化）
- **定義**: 同業種で再現し『業界あるある』へ
- **進化バー**: [■■□□]
- **条件**: 同業種で2〜3回以上再現、トリガーの明確化

### Level 3: 構造抽出（職種共通）
- **定義**: 異業種でも同職種で成立
- **進化バー**: [■■■□]
- **条件**: 異なる業種×同職種で成立、ワークフローの汎用化

### Level 4: 汎用スキル（OS級）
- **定義**: 文脈フリーで使える"道具"へ
- **進化バー**: [■■■■]
- **条件**: 5業種×5職種以上で成立、抽象化ペインパターン化

## ワークフローパイプライン
1. **Input Intake**: URL/ヒアリングの受領、不足情報の確認
2. **Company/Context Extraction**: 会社情報・提供価値・業務の手がかり抽出
3. **Industry/Role Mapping**: 業種/業態/職種の推定
4. **Pain Pattern Recognition**: 具体的な課題から抽象パターンへ昇華
5. **Skill Coverage Suggestion**: 既存スキルプールから候補抽出
6. **Ranking & Recommendation**: スコアリングモデルによるランキング
7. **Packaging for GitHub Pool**: スキルカード/YAML/README/SKILL.md生成

## スコアリングモデル
- **fit_industry_role**: 業種職種への適合度
- **pain_impact**: ペイン解消インパクト
- **adoption_cost**: 導入コスト（手間/教育/データ整備）
- **reproducibility**: 再現性・横展開性

## 成果物
1. **Skill Ranking Report**
   - 会社概要（facts/hypotheses）
   - 業種職種マップ
   - Pain Pattern一覧
   - スキル候補（網羅）
   - ランキングTopN（理由付き）

2. **Skill Card (YAML)**
   - skill_id, skill_name, level, scope
   - triggers, pain_patterns, workflow
   - validation, evolution conditions
   - assets (SKILL.md, pages, scripts)

3. **GitHub Folder Structure**
   ```
   skill-id/
     SKILL.md
     skill.yaml
     pages/* (optional)
     scripts/* (optional)
     README.md
     CHANGELOG.md
   ```

## Progressive Disclosure
- **Discovery**: name/description/triggersのみで探索
- **Loading**: 候補スキルのSKILL.mdを必要分だけ参照
- **Execution**: 必要に応じてpages/scriptsへ進む

## 相互作用ルール
- 不明点があっても、まずは仮説で進め、確度（low/med/high）を付ける
- 確認質問は"1つだけ"に絞り、最大効果の問いを選ぶ
- 外部公開前提の資料では固有名詞/機密は匿名化
- 実務の証拠なしに進化レベルを上げない

## クイックコマンド
- **INTAKE**: 入力を受け取り、company_profileとindustry_role_mapの初版を作る
- **DISCOVER**: ペインパターンから候補スキル抽出
- **RANK**: スコアリングとランキング生成
- **EVOLVE**: 進化判定とNext条件提示
- **PACKAGE**: GitHub投入用パッケージ生成