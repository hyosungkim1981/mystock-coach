---
name: stock-research-workflow
description: Use when a stock coaching agent must research a Korean stock company, recent news, disclosures, growth drivers, risks, or dashboard research scores for mystock.
---

# Stock Research Workflow

## Overview

Use this skill to produce the research layer for the mystock agent chain. It is used mainly by `주식 리서치 전문가`, and as background by the analyst, portfolio operator, and validation agents.

## Required Sources

For changing market data, verify current information before giving current claims.

- Prefer official or primary sources: DART, KIND, KRX, company IR, business reports, quarterly reports, earnings materials.
- Use reputable news only for news momentum; separate confirmed facts from market rumors.
- Include `researchDate` and source names/URLs when claims depend on current data.
- If browsing is unavailable or blocked, set confidence lower and state which sources must be checked.

## Workflow

1. Identify the company, ticker, market, user holding weight, profit rate, and purpose.
2. Gather company profile, business segments, revenue drivers, recent results, news, disclosures, and sector conditions.
3. Separate growth drivers from risk factors.
4. Score dashboard inputs from `-100` to `100`.
5. Return concise research that downstream agents can consume without rewriting.

## Output Contract

| Field | Requirement |
|---|---|
| `researchDate` | 기준일 |
| `companySummary` | 회사 개요 |
| `businessSegments` | 주요 사업부 |
| `growthDrivers` | 성장 요인 |
| `newsMomentum` | 뉴스/공시 모멘텀 |
| `riskFactors` | 리스크 |
| `growthScore` | -100~100 |
| `newsScore` | -100~100 |
| `riskLevel` | 낮음/보통/높음 |
| `dashboardMemo` | 대시보드용 한두 문장 |

## Scoring Guide

| Score | Meaning |
|---:|---|
| 60 to 100 | 매우 긍정 |
| 20 to 59 | 긍정 |
| -19 to 19 | 중립 |
| -59 to -20 | 부정 |
| -100 to -60 | 매우 부정 |

## Safety Rules

- Do not tell the user to buy or sell with certainty.
- Do not ask for account numbers, real names, passwords, original MTS images, or full OCR raw text.
- Do not use unsourced latest news as a core reason.
- Treat the output as research context, not investment advice.

## Project References

- Agent definition: `docs/agents/stock-research-expert.md`
- Shared result schema: `docs/schemas/agent-analysis-result.md`
