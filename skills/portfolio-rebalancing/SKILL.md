---
name: portfolio-rebalancing
description: Use when a stock coaching agent must turn analyst outputs and holdings into target weights, rebalancing actions, cash plans, concentration risk, and portfolio operation notes.
---

# Portfolio Rebalancing

## Overview

Use this skill to convert stock-level opinions into portfolio-level operation. It is used mainly by `포트폴리오 운영자`.

## Inputs

- holdings: name, ticker, profitRate, marketValue, portfolioWeight
- analystResult: analystOpinion, targetPrice, upside, valuationScore, riskScore
- researchResult: growthScore, newsScore, riskLevel
- user constraints: risk profile, max stock weight, target cash weight, sector limits

## Workflow

1. Diagnose concentration first, then individual opportunity.
2. Classify each holding as core, satellite, event, high-risk, or watch.
3. Set a target weight using analyst opinion, upside, risk, current weight, and user constraints.
4. Choose one action: 비중확대, 소폭확대, 유지, 일부축소, 대폭축소, 정리검토.
5. Create staged execution conditions rather than one-shot all-in/all-out instructions.
6. Include cash plan and portfolio risk memo.

## Target Weight Guide

| Case | Typical target |
|---|---:|
| 핵심 우량/고확신 | 10~20% |
| 성장성 높고 변동성 큼 | 5~12% |
| 턴어라운드/이벤트 | 3~8% |
| 고위험/실적 불확실 | 0~5% |
| 관찰 | 0~3% |

## Output Contract

| Field | Requirement |
|---|---|
| `currentWeight` | 현재 비중 |
| `targetWeight` | 목표 비중 |
| `rebalanceAction` | 조정 액션 |
| `rebalancePriority` | 1~5 |
| `rebalanceDelta` | 목표 - 현재 |
| `cashPlan` | 현금 비중 계획 |
| `concentrationRisk` | 집중 위험 |
| `operatorSummary` | 대시보드용 운영 코멘트 |

## Safety Rules

- Do not execute orders.
- Do not recommend margin, leverage, or concentrated buying.
- Do not average down purely because a stock is down.
- Do not sell purely because a stock is up; combine upside, valuation, and weight.
- High current weight plus large profit should usually trigger at least 일부축소 review.

## Project References

- Agent definition: `docs/agents/portfolio-operator.md`
- Shared result schema: `docs/schemas/agent-analysis-result.md`
