# 에이전트 분석 결과 스키마

## 목적

주식매매 코칭 봇에서 종목별 에이전트 실행 결과를 대시보드, 서버 저장, 카톡 공유 링크에 일관되게 연결하기 위한 표준 스키마다.

이 스키마는 실제 주문 실행용이 아니다. 사용자가 검토할 수 있는 리서치, 애널리스트 분석, 포트폴리오 운영, 검증 결과를 구조화한다.

## 최상위 구조

| 필드 | 타입 | 설명 |
|---|---|---|
| schemaVersion | string | 스키마 버전 |
| runId | string | 에이전트 실행 ID |
| runDate | string | 실행 기준일 |
| purpose | string | 실행 목적 |
| holding | object | 보유 종목 기본 정보 |
| appScore | object | 기존 앱 점수 계산 결과 |
| agentAnalysis | object | 에이전트 체인 분석 결과 |
| dashboardResult | object | 대시보드 표시용 최종 결과 |
| sources | array | 확인 출처 |
| safetyNotice | string | 투자 안전 고지 |

## holding

| 필드 | 타입 | 설명 |
|---|---|---|
| name | string | 종목명 |
| ticker | string | 종목코드 |
| market | string | 시장 |
| currentPrice | number | 기준 현재가 |
| marketValue | number | 평가금액 |
| profitLoss | number | 평가손익 |
| profitRate | number | 수익률 |
| portfolioWeight | number | 포트폴리오 비중 |
| source | string | 보유 정보 출처 |

## appScore

| 필드 | 타입 | 설명 |
|---|---|---|
| score | number | 기존 앱 계산 점수 |
| action | string | 기존 앱 액션 |
| signals | object | profit, weight, risk, momentum, news, growth 점수 |
| memo | string | 기존 점수 해석 |

## agentAnalysis.researchResult

| 필드 | 타입 | 설명 |
|---|---|---|
| researchDate | string | 리서치 기준일 |
| companySummary | string | 회사 개요 |
| businessSegments | array | 주요 사업부 |
| growthDrivers | array | 성장 요인 |
| newsMomentum | string | 뉴스/공시 모멘텀 |
| riskFactors | array | 주요 리스크 |
| growthScore | number | 성장성 점수 -100~100 |
| newsScore | number | 뉴스 점수 -100~100 |
| riskLevel | string | 낮음/보통/높음 |
| dashboardMemo | string | 대시보드용 요약 |

## agentAnalysis.analystResult

| 필드 | 타입 | 설명 |
|---|---|---|
| analystDate | string | 분석 기준일 |
| analystOpinion | string | 매수/보유/매도/관찰 |
| targetPrice | number | 참고 목표가 또는 적정가치 중간값 |
| targetPriceRange | object | low, high |
| buyReferenceRange | object | low, high |
| sellReferenceRange | object | low, high |
| valuationMethod | string | 사용한 방식 |
| upsideFromCurrent | number | 현재가 대비 참고 상승여력 |
| valuationScore | number | 밸류에이션 점수 -100~100 |
| riskScore | number | 리스크 점수 -100~100 |
| analystSummary | string | 대시보드용 애널리스트 요약 |
| confidenceLevel | string | 낮음/보통/높음 |

## agentAnalysis.portfolioOperationResult

| 필드 | 타입 | 설명 |
|---|---|---|
| currentWeight | number | 현재 비중 |
| targetWeight | number | 목표 비중 |
| rebalanceAction | string | 비중확대/소폭확대/유지/일부축소/대폭축소/정리검토 |
| rebalancePriority | number | 1~5 우선순위 |
| rebalanceDelta | number | 목표 비중 - 현재 비중 |
| cashPlan | string | 현금 관리 계획 |
| concentrationRisk | string | 집중 리스크 설명 |
| operatorSummary | string | 운영자 요약 |

## agentAnalysis.validationResult

| 필드 | 타입 | 설명 |
|---|---|---|
| validationStatus | string | PASS/WARN/FAIL |
| validationScore | number | 0~100 |
| missingFields | array | 누락 필드 |
| safetyWarnings | array | 안전성 경고 |
| sourceCheck | string | 출처/기준일 점검 |
| numericEvidenceCheck | string | 숫자 근거 점검 |
| usableForDashboard | boolean | 대시보드 사용 가능 여부 |
| revisionPrompt | string | 보완 요청 문장 |

## dashboardResult

| 필드 | 타입 | 설명 |
|---|---|---|
| displayScore | number | 대시보드 최종 표시 점수 |
| displayAction | string | 대시보드 최종 액션 |
| actionReason | string | 액션 근거 |
| primaryBadges | array | 요약 배지 |
| detailText | string | 종목별 내용 펼침 영역 텍스트 |
| buyReferenceText | string | 매수 참고 구간 문장 |
| sellReferenceText | string | 매도 참고 구간 문장 |
| riskText | string | 리스크 문장 |
| validationBadge | string | PASS/WARN/FAIL |

## 액션 결정 원칙

- 기존 앱 점수는 `appScore`에 유지한다.
- 에이전트 체인이 비중 과다, 급등 후 변동성, 데이터 부족 같은 리스크를 발견하면 `dashboardResult.displayScore`를 보수적으로 조정할 수 있다.
- 최종 액션은 사용자가 직접 검토할 참고값이며 자동 주문으로 연결하지 않는다.
- 목표가, 매수가, 매도가가 제공되어도 기준일, 출처, 산정 한계, 리스크 문장을 함께 표시한다.

## 개인정보 및 안전 원칙

- 원본 잔고 이미지, 계좌번호, 실명, 인증정보는 저장하지 않는다.
- 공유 링크에는 종목명, 점수, 액션, 요약만 포함하고 민감한 보유 원문은 제외한다.
- 최신 주가, 뉴스, 공시, 실적은 실행 시점마다 다시 확인한다.
- 출처 확인이 실패하면 `validationResult.validationStatus`를 최소 WARN으로 표시한다.
