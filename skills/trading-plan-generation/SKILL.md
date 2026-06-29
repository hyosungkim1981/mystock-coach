---
name: trading-plan-generation
description: Use when a trading agent must create day trading, swing trading, or price action plans with entry, exit, stop loss, trailing stop, invalidation, and risk notes.
---

# Trading Plan Generation

## Overview

Use this skill for the three trading agents: `데이트레이딩`, `스윙 트레이딩`, and `프라이스 액션 스윙 트레이딩`.

## Select Trading Mode

| Mode | Use |
|---|---|
| day | Intraday only. No overnight. |
| swing | Days to weeks. Technical indicators allowed. |
| price-action-swing | Days to weeks. No indicators; use candles and market structure only. |

## Workflow

1. Confirm mode, timeframe, current price, OHLCV, support/resistance, trend, and event risks.
2. If data is missing, state that the plan is conditional and list required data.
3. Define entry trigger, invalidation price, stop loss, profit-taking zones, and trailing stop.
4. Include position sizing limits and holding period.
5. Return dashboard-ready fields.

## Mode Rules

### Day Trading

- Must include `noOvernightPolicy`.
- Must include intraday exit plan and time stop.
- Never recommend carrying the position overnight.

### Swing Trading

- Use candles, moving averages, volume, trend, support, and resistance.
- Include staged buy/sell plan, stop loss, trailing stop, and expected holding period.

### Price Action Swing

- Do not use moving averages, RSI, MACD, or other indicators as core evidence.
- Use candle shape, swing highs/lows, support/resistance, breakout, retest, failure, and market structure.

## Output Contract

| Field | Requirement |
|---|---|
| `tradingMode` | day/swing/price-action-swing |
| `bias` | 상승/중립/하락 or 관찰 |
| `entryTrigger` | 진입 조건 |
| `initialStop` | 최초 손절 |
| `invalidationPrice` | 무효화 가격 |
| `profitTakingPlan` | 분할 청산 |
| `trailingStopRule` | 트레일링 스톱 |
| `holdingPeriod` | 예상 보유 기간 |
| `riskMemo` | 리스크 |
| `dashboardAction` | 대시보드 참고 액션 |

## Safety Rules

- Do not execute or automate orders.
- Do not omit stop loss.
- Do not recommend leverage, margin, or all-in entries.
- Do not promise recovery from losses.
- Day trading answers that recommend overnight holding are invalid.

## Project References

- Agent definitions: `docs/agents/day-trading-agent.md`, `docs/agents/swing-trading-agent.md`, `docs/agents/price-action-swing-trading-agent.md`
