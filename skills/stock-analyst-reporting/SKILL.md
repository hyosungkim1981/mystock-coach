---
name: stock-analyst-reporting
description: Use when a stock coaching agent must convert research into an analyst-style report, investment opinion, target price range, buy zone, sell zone, valuation, or risk score.
---

# Stock Analyst Reporting

## Overview

Use this skill to create the analyst layer after the research layer. It is used mainly by `주식 애널리스트` and by validation agents checking valuation quality.

## Inputs

Use the research result plus any available:

- company/ticker/market
- current price, market cap, holding profit rate, holding weight
- recent results, guidance, consensus, EPS, BPS, EBITDA, net cash/debt
- research scores and risk notes

## Workflow

1. State the analysis date and data limitations.
2. Choose the valuation method: PER, PBR, EV/EBITDA, DCF, SOTP, peer comparison, or scenario range.
3. If required financial data is missing, do not invent a precise target price. Use a conditional range and list missing data.
4. Produce an opinion: 매수, 보유, 매도, or 관찰.
5. Provide buy/sell reference ranges with rationale and risk limits.
6. Return dashboard-ready fields.

## Output Contract

| Field | Requirement |
|---|---|
| `analystDate` | 기준일 |
| `analystOpinion` | 매수/보유/매도/관찰 |
| `targetPrice` | 근거 있는 참고값, 없으면 null 또는 제한적 |
| `targetPriceRange` | low/high |
| `buyReferenceRange` | low/high |
| `sellReferenceRange` | low/high |
| `valuationMethod` | 산정 방식과 한계 |
| `upsideFromCurrent` | 현재가 대비 참고 여력 |
| `valuationScore` | -100~100 |
| `riskScore` | -100~100 |
| `analystSummary` | 대시보드용 요약 |
| `confidenceLevel` | 낮음/보통/높음 |

## Valuation Guardrails

- PER: expected EPS x target PER.
- PBR: expected BPS x target PBR.
- EV/EBITDA: expected EBITDA x multiple minus net debt.
- DCF: FCF, discount rate, terminal growth assumptions.
- SOTP: sum segment values with assumptions.
- Use ranges when uncertainty is high.

## Safety Rules

- Do not present analyst output as official investment advice.
- Do not use definitive language such as 확실히, 무조건, 보장.
- Do not recommend leverage, margin, concentrated buying, or averaging down without risk limits.
- Always include downside risks and data limitations.

## Project References

- Agent definition: `docs/agents/stock-analyst.md`
- Shared result schema: `docs/schemas/agent-analysis-result.md`
