---
name: stock-coach-agent-chain
description: Use when running the mystock end-to-end agent chain from holdings/OCR data through research, analyst report, portfolio operation, validation, and dashboard JSON.
---

# Stock Coach Agent Chain

## Overview

Use this skill to orchestrate the whole mystock agent workflow. It combines research, analyst, portfolio, trading when needed, validation, and the dashboard schema.

## Required Sub-Skills

- Use `stock-research-workflow` for `researchResult`.
- Use `stock-analyst-reporting` for `analystResult`.
- Use `portfolio-rebalancing` for `portfolioOperationResult`.
- Use `trading-plan-generation` only when the user asks for day/swing/price action trading.
- Use `agent-response-validation` before presenting dashboard-ready output.

## Workflow

1. Normalize holding data from OCR, manual input, or sample JSON.
2. Preserve the existing app score in `appScore`; do not overwrite it silently.
3. Build `researchResult`.
4. Build `analystResult`.
5. Build `portfolioOperationResult`.
6. Add `tradingResult` only if requested.
7. Validate the combined result.
8. Produce `dashboardResult` using the shared schema.
9. Save planning or run artifacts to Markdown when the user asks to keep project planning history.

## Dashboard Decision Rules

- Show `dashboardResult.displayScore`, `displayAction`, and `validationBadge` first.
- Keep `appScore` visible as the baseline score.
- If validation is WARN, allow dashboard display with warning.
- If validation is FAIL, do not present buy/sell prices as usable.
- If portfolio concentration is high, let portfolio risk override a bullish research tone.

## Output Contract

Use `docs/schemas/agent-analysis-result.md` as the source of truth:

- `schemaVersion`
- `runId`
- `runDate`
- `holding`
- `appScore`
- `agentAnalysis.researchResult`
- `agentAnalysis.analystResult`
- `agentAnalysis.portfolioOperationResult`
- `agentAnalysis.validationResult`
- `dashboardResult`
- `sources`
- `safetyNotice`

## Safety Rules

- Treat every result as coaching/reference, not actual investment advice.
- Never ask for account credentials or original private account images.
- Use current sources for current data.
- Do not hide data limitations.
- Do not automate order execution.

## Project References

- Schema: `docs/schemas/agent-analysis-result.md`
- Example run: `docs/agent-run-samples/2026-07-17-samsung-electronics-e2e.md`
- Plan history: `docs/stock-coach-plan.md`
