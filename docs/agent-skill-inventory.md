# 현재 경로 에이전트 및 스킬 정리

## 기준

- 확인 경로: `/Users/a17341/Documents/mystock`
- 확인일: 2026-07-23
- 프로젝트명: `mystock-coach`
- 프로젝트 성격: 국내주식 보유 종목 이미지 OCR 기반 주식매매 코칭 대시보드

## 1. 현재 경로에 만들어진 에이전트

현재 프로젝트 안에는 실제 Workspace Agent 등록 파일이 아니라, 에이전트 정의 문서가 `docs/agents/` 아래 Markdown 파일로 저장되어 있다.

| 구분 | 에이전트 | 파일 | 역할 |
|---|---|---|---|
| 리서치 | 주식 리서치 전문가 | `docs/agents/stock-research-expert.md` | 회사 정보, 뉴스, 공시, 성장성, 리스크를 조사해 대시보드 점수 근거 제공 |
| 분석 | 주식 애널리스트 | `docs/agents/stock-analyst.md` | 리서치 결과를 바탕으로 투자의견, 목표주가, 밸류에이션, 가격 전략 작성 |
| 운영 | 포트폴리오 운영자 | `docs/agents/portfolio-operator.md` | 애널리스트 결과를 바탕으로 목표 비중, 리밸런싱, 현금 계획 제안 |
| 트레이딩 | 데이트레이딩 에이전트 | `docs/agents/day-trading-agent.md` | 당일 매수·당일 청산 원칙의 장중 기술분석과 트레일링 스톱 계획 |
| 트레이딩 | 스윙 트레이딩 에이전트 | `docs/agents/swing-trading-agent.md` | 며칠~몇 주 보유를 전제로 기술적 분석, 분할매수/매도, 손절 계획 |
| 트레이딩 | 프라이스 액션 스윙 트레이딩 에이전트 | `docs/agents/price-action-swing-trading-agent.md` | 보조지표 없이 캔들, 가격 구조, 지지/저항 기반 스윙 분석 |
| 검증 | 에이전트 검증 관리자 | `docs/agents/agent-validation-manager.md` | 에이전트 답변의 형식, 근거, 안전성, 대시보드 연동 가능성 검증 |
| 테스트 | 에이전트 테스트 시나리오 생성기 | `docs/agents/agent-test-scenario-generator.md` | 각 에이전트를 테스트할 정상/경계/위험/안전성 시나리오 생성 |

## 2. 에이전트 체인

현재 설계된 기본 체인은 다음 순서다.

1. `주식 리서치 전문가`
2. `주식 애널리스트`
3. `포트폴리오 운영자`
4. `에이전트 검증 관리자`
5. 대시보드 표시

트레이딩 관점이 필요할 때는 다음 중 하나가 별도 보조 체인으로 붙는다.

- `데이트레이딩 에이전트`
- `스윙 트레이딩 에이전트`
- `프라이스 액션 스윙 트레이딩 에이전트`

품질 검증은 다음 흐름으로 설계되어 있다.

1. `에이전트 테스트 시나리오 생성기`가 테스트 문제를 만든다.
2. 대상 에이전트가 답변한다.
3. `에이전트 검증 관리자`가 PASS/WARN/FAIL로 채점한다.
4. WARN 또는 FAIL이면 수정 요청 프롬프트를 만든다.

## 3. 에이전트 실행 및 테스트 산출물

| 파일 | 내용 |
|---|---|
| `docs/agent-test-runs/2026-07-17-first-scenario-set.md` | 전체 에이전트 스모크 테스트 7개 시나리오 |
| `docs/agent-run-samples/2026-07-17-samsung-electronics-e2e.md` | 삼성전자 1개 종목 end-to-end 실행 샘플 |
| `docs/agent-run-samples/2026-07-17-samsung-electronics-e2e.json` | 앱/서버가 참고할 수 있는 삼성전자 실행 샘플 JSON |
| `docs/schemas/agent-analysis-result.md` | 에이전트 분석 결과 공통 스키마 |

## 4. 현재 경로의 스킬 상태

프로젝트 내부에 에이전트들이 사용할 로컬 Codex 스킬을 추가했다.

| 스킬 | 파일 | 주 사용 에이전트 | 용도 |
|---|---|---|---|
| `stock-research-workflow` | `skills/stock-research-workflow/SKILL.md` | 주식 리서치 전문가 | 회사, 뉴스, 공시, 성장성, 리스크 조사 |
| `stock-analyst-reporting` | `skills/stock-analyst-reporting/SKILL.md` | 주식 애널리스트 | 투자의견, 목표가, 매수/매도 참고 구간, 밸류에이션 |
| `portfolio-rebalancing` | `skills/portfolio-rebalancing/SKILL.md` | 포트폴리오 운영자 | 목표 비중, 리밸런싱 액션, 현금 계획 |
| `trading-plan-generation` | `skills/trading-plan-generation/SKILL.md` | 데이트레이딩, 스윙, 프라이스 액션 스윙 | 진입, 청산, 손절, 트레일링 스톱 계획 |
| `agent-response-validation` | `skills/agent-response-validation/SKILL.md` | 에이전트 검증 관리자 | 답변 형식, 근거, 안전성, 대시보드 사용 가능성 검증 |
| `agent-test-scenario-design` | `skills/agent-test-scenario-design/SKILL.md` | 에이전트 테스트 시나리오 생성기 | 정상/경계/위험/안전성 테스트 케이스 생성 |
| `stock-coach-agent-chain` | `skills/stock-coach-agent-chain/SKILL.md` | 전체 체인 실행 | 보유 종목 → 리서치 → 애널리스트 → 운영자 → 검증 → 대시보드 JSON |

현재 프로젝트 내부 확인 결과:

- `skills/` 폴더 있음
- 프로젝트 내부 `SKILL.md` 7개 있음
- 각 스킬에 `agents/openai.yaml` UI 메타데이터 있음
- `.agents/` 폴더 없음
- `.codex/` 폴더 없음
- 프로젝트 내부 `AGENTS.md` 없음

즉, 주식 관련 역할은 `docs/agents/*.md`의 에이전트 정의 문서와 `skills/*/SKILL.md`의 로컬 스킬 정의로 나뉜다.

## 5. 현재 세션에서 사용한 스킬

현재 답변을 작성할 때 사용한 스킬:

| 스킬 | 위치 | 사용 이유 |
|---|---|---|
| `workspace-surface-audit` | `/Users/a17341/.agents/skills/workspace-surface-audit/SKILL.md` | 현재 프로젝트에 실제로 어떤 에이전트/스킬/설정이 존재하는지 확인하기 위해 사용 |

이 스킬은 프로젝트 내부가 아니라 사용자 전역 Codex/ECC 스킬 경로에 있다.

## 6. 현재 세션에서 사용 가능하지만 프로젝트 내부에 저장된 것은 아닌 스킬

Codex 세션에는 많은 전역 스킬이 로드되어 있지만, 이들은 `/Users/a17341/Documents/mystock` 내부 파일이 아니다. 이 프로젝트와 특히 관련 있는 전역 스킬은 다음 정도다.

| 스킬 | 쓰임 |
|---|---|
| `workspace-agents:workspace-agents-build-agent` | Workspace Agent를 실제 등록/수정할 때 사용 |
| `workspace-agents:workspace-agents-manage-agent` | 등록된 Workspace Agent를 조회/점검할 때 사용 |
| `market-research` | 시장/기업 리서치 업무 보조 |
| `deep-research` | 여러 출처 기반 심층 리서치 |
| `frontend-patterns` | 현재 HTML/JS 대시보드 UI 개선 |
| `e2e-testing` | Playwright 기반 브라우저 흐름 검증 |
| `verification-loop` | 테스트, 빌드, 정적 검증 루프 |
| `security-review` | 이미지 업로드, API 키, 개인정보 처리 보안 점검 |
| `sites:sites-building` | 사이트 형태의 프론트엔드 구축 |
| `sites:sites-hosting` | Sites 배포 기능 사용 시 필요 |

## 6-1. Superpowers 플러그인 적용 상태

`superpowers` 플러그인은 현재 Codex 세션의 전역 플러그인/스킬 캐시에는 적용되어 있다.

확인된 전역 위치:

- `/Users/a17341/.codex/plugins/cache/openai-curated-remote/superpowers/6.1.1/skills`

현재 로드된 대표 스킬:

- `superpowers:brainstorming`
- `superpowers:writing-plans`
- `superpowers:executing-plans`
- `superpowers:test-driven-development`
- `superpowers:systematic-debugging`
- `superpowers:verification-before-completion`
- `superpowers:requesting-code-review`
- `superpowers:subagent-driven-development`
- `superpowers:using-git-worktrees`
- `superpowers:writing-skills`

단, 이 플러그인은 프로젝트 내부에 저장된 것은 아니다.

현재 프로젝트 내부 확인 결과:

- `/Users/a17341/Documents/mystock/skills`: 있음. mystock 전용 로컬 스킬 7개 저장
- `/Users/a17341/Documents/mystock/.codex`: 없음
- `/Users/a17341/Documents/mystock/.agents`: 없음
- 프로젝트 내부 `superpowers` 관련 파일: 없음

정리하면, `mystock` 프로젝트에서 Codex를 실행할 때 전역 `superpowers` 스킬을 사용할 수는 있지만, 프로젝트 저장소 자체에 `superpowers` 플러그인이 포함되어 있지는 않다.

## 6-2. 전역 플러그인/스킬과 프로젝트 저장 스킬의 차이

| 구분 | 전역 Codex 플러그인/스킬 | 프로젝트에 저장된 스킬/설정 |
|---|---|---|
| 저장 위치 | 보통 `/Users/a17341/.codex` 또는 `/Users/a17341/.agents` 아래 | 프로젝트 내부. 예: `skills/`, `.codex/`, `.agents/`, `AGENTS.md` |
| 적용 범위 | 같은 사용자 Codex 환경의 여러 프로젝트에서 사용 가능 | 해당 프로젝트를 열었을 때 프로젝트 맥락으로 사용 |
| Git 포함 여부 | 기본적으로 프로젝트 Git에 포함되지 않음 | 프로젝트 저장소에 포함 가능 |
| 팀 공유 | 같은 플러그인을 각자 설치해야 동일하게 사용 가능 | 저장소를 받으면 문서/스킬/규칙을 함께 공유 가능 |
| 프로젝트 맞춤성 | 범용 워크플로우에 강함 | mystock 전용 업무 흐름, 용어, 데이터 스키마, 검증 기준을 담기 좋음 |
| 유지보수 | 플러그인 업데이트에 따라 전역으로 바뀔 수 있음 | 프로젝트 버전과 함께 변경 이력을 관리 가능 |
| 재현성 | 다른 환경에서 동일하게 재현하려면 설치 상태 확인 필요 | 저장소에 있으면 재현성이 높음 |

현재 `superpowers`는 전역 플러그인/스킬로 로드되어 있으므로 이 프로젝트에서 사용할 수는 있다. 하지만 `mystock` 저장소 자체에 포함된 것은 아니어서, 다른 컴퓨터나 다른 사용자가 이 저장소만 받아서는 같은 `superpowers` 환경이 자동으로 생기지 않는다.

`mystock`에 가장 적합한 방향은 다음과 같다.

1. `superpowers` 같은 범용 개발 워크플로우는 전역 플러그인으로 계속 사용한다.
2. `주식 코칭 에이전트 체인`, `종목 리서치 결과 스키마`, `검증 관리자 채점 기준`처럼 mystock 전용인 것은 프로젝트 내부 문서나 로컬 스킬로 저장한다.
3. 반복 실행이 많아지면 `skills/stock-coach-agent-chain/SKILL.md`를 만들어 프로젝트 전용 스킬로 승격한다.

## 6-3. Frontend Design 플러그인 확인 상태

현재 프로젝트와 전역 Codex 플러그인 캐시를 확인한 결과, `Frontend Design`이라는 정확한 이름의 플러그인은 설치된 상태로 확인되지 않았다.

확인 결과:

- 프로젝트 내부 `Frontend Design` 플러그인/스킬: 없음
- 전역 플러그인 캐시의 `Frontend Design` 플러그인: 없음
- 프로젝트 내부에서 발견된 `design` 이름 포함 항목: `skills/agent-test-scenario-design`
- 전역에서 사용할 수 있는 관련 기능: `frontend-patterns`, `sites:sites-building`, `sites:sites-hosting`, `visualize:visualize`
- 추천 가능하지만 현재 설치되지 않은 관련 플러그인: `Figma (figma@openai-curated-remote)`

정리하면, 현재 `mystock`에는 `Frontend Design`이라는 플러그인이 프로젝트 내부에 적용되어 있지 않고, 전역 플러그인으로도 설치 흔적이 없다. 다만 프론트엔드 UI 개선 작업은 전역 `frontend-patterns` 스킬과 `sites`/`visualize` 계열 기능을 활용해 진행할 수 있다.

## 7. 실제 Workspace Agent 등록 상태

이전 작업 중 Workspace Agent 생성 도구 호출을 시도했지만 `Not found`로 실패했다.

따라서 현재 상태는 다음과 같다.

- 실제 Workspace Agent로 등록된 상태: 확인되지 않음
- 프로젝트 내부 문서로 정의된 에이전트: 8개
- 추후 Workspace Agent 기능이 활성화되면 `docs/agents/*.md`의 시스템 지시문을 사용해 등록 가능

## 8. 다음 추천 작업

우선순위는 다음과 같다.

1. 현재 `docs/agents/*.md` 문서를 실제 Workspace Agent로 등록 가능한지 다시 확인한다.
2. 등록이 가능하면 8개 에이전트를 Workspace Agent로 생성한다.
3. 등록이 계속 실패하면 현재 만든 로컬 스킬 7개를 기준으로 에이전트 체인을 수동 실행한다.
4. 앱에는 `agentAnalysis` JSON을 붙여 종목별 내용 영역에 리서치/분석/운영/검증 결과를 표시한다.
5. 테스트 시나리오 3개를 실제 검증 루프로 실행해 회귀 테스트 기준으로 삼는다.
