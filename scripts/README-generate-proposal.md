# Proposal Generator Script

A TypeScript script that generates professional business proposals from skill analysis reports.

## Overview

The `generate-proposal.ts` script takes a markdown-formatted skill analysis report and transforms it into a comprehensive business proposal document with:

- Executive summary
- Current situation analysis
- Solution recommendations with pricing
- Implementation timeline
- Investment plans and ROI calculations
- Quality guarantees
- Case studies
- Next steps

## Usage

```bash
# Basic usage
npx tsx scripts/generate-proposal.ts <analysis-report-path>

# With custom output path
npx tsx scripts/generate-proposal.ts <analysis-report-path> <output-path>

# Examples
npx tsx scripts/generate-proposal.ts data/miyagawa-skill-report.md
npx tsx scripts/generate-proposal.ts data/analysis.md output/proposal.md
```

## Input Format

The script expects an analysis report in markdown format with the following structure:

```markdown
# [Company Name] - スキル推薦レポート

## 企業プロファイル
**企業名**: Company Name
**業種**: Industry
**所在地**: Location
**従業員数**: Number
**創業**: Year

## ビジネス分析
### 強み（Win Indicators）
- ✅ Strength 1
- ✅ Strength 2

### 課題（Pain Points）
- ⚠️ Challenge 1
- ⚠️ Challenge 2

## 推奨スキル（優先順位順）
### 1. 🥇 **Skill Name** (Level N: Description)
**スコア**: XX/100

#### 概要
Overview text

#### 主要機能
- Feature 1
- Feature 2

#### 導入効果
- **効率性**: XX% improvement
- **品質**: XX% improvement
- **コスト**: ¥XX savings

## 実装ロードマップ
### Phase 1（1-3ヶ月）
1. Task 1
2. Task 2

## 期待される成果
### 定量的効果
- Effect 1
- Effect 2

### 定性的効果
- Effect 1
- Effect 2
```

## Output Format

The script generates a professional proposal document in Japanese including:

1. **Executive Summary**
   - Company overview
   - Challenge summary
   - Expected ROI

2. **Current Situation Analysis**
   - Company strengths
   - Challenges with business impact

3. **Solution Proposals**
   - Detailed system descriptions
   - Key features
   - Expected benefits
   - Pricing estimates

4. **Implementation Plan**
   - Phased rollout schedule
   - Project team structure

5. **Investment Plan**
   - Initial costs breakdown
   - Running costs
   - ROI calculations

6. **Success Factors**
   - Implementation approach
   - Quality guarantees
   - Support details

7. **Case Studies**
   - Similar industry examples
   - Success metrics

8. **Next Steps**
   - Action items
   - Timeline

## Pricing Logic

The script calculates pricing based on:

- **Base hourly rate**: ¥15,000
- **Complexity multipliers**:
  - Level 1: 0.8x (Simple)
  - Level 2: 1.0x (Standard)
  - Level 3: 1.5x (Complex)
  - Level 4: 2.0x (Advanced)
  - Level 5: 2.5x (Expert)

- **Implementation hours**:
  - Level 1: 40 hours (1 week)
  - Level 2: 80 hours (2 weeks)
  - Level 3: 160 hours (1 month)
  - Level 4: 320 hours (2 months)
  - Level 5: 480 hours (3 months)

## ROI Calculations

The script estimates ROI based on:

- **Labor savings**: 30% efficiency gain × employee count × average salary
- **Efficiency savings**: 50% of labor savings
- **Opportunity savings**: 30% of labor savings
- **Running costs**: 15% of initial investment (cloud) + 20% (support)

## Customization

To modify the proposal format or calculations, edit:

- `ProposalGenerator.createProposal()`: Change proposal structure
- `ProposalGenerator.calculateSkillCost()`: Adjust pricing logic
- `ProposalGenerator.calculate*Savings()`: Modify ROI calculations

## Dependencies

- Node.js 14+
- TypeScript
- tsx (TypeScript executor)

## Notes

- All prices are displayed in Japanese Yen (¥) without tax
- Proposal validity period is set to 1 month from generation date
- The script preserves the original analysis file and creates a new proposal file