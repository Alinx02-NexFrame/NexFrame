# Figma Make 동기화 가이드

## 개요

Figma Make 파일(`oF5IWDz6Xc73353tURjobg`)의 UI 변경사항을 로컬 프로젝트(`payment-portal/`)에 반영하는 절차.
핵심: **UI 컴포넌트는 Figma Make 코드를 적용하되, API 연동 코드는 보존**한다.

## 아키텍처

```
[Figma Make 소유]                    [로컬 전용 - 절대 덮어쓰지 않음]
─────────────────                    ─────────────────────────────────
components/*.tsx (UI)                routeWrappers.tsx (API 호출 로직)
data/mockData.ts (mock 데이터)       hooks/*.ts (데이터 fetching hooks)
routes.tsx (라우트 정의)              services/apiClient.ts (API 클라이언트)
styles/*.css (테마/스타일)            services/billingCalculator.ts (billing 계산)
```

### 파일 소유 관계

| 파일 | 소유자 | Figma 덮어쓰기 | 비고 |
|------|--------|:-------------:|------|
| `components/**/*.tsx` | Figma Make | O | props 기반 UI |
| `data/mockData.ts` | Figma Make | O | fallback 데이터 |
| `routes.tsx` | Figma Make | O | 순수 라우트 정의 |
| `styles/*.css` | Figma Make | O | 테마/스타일 |
| `routeWrappers.tsx` | 로컬 | **X** | API 호출 + 전역 상태 |
| `hooks/*.ts` | 로컬 | **X** | 데이터 fetching |
| `services/apiClient.ts` | 로컬 | **X** | API 클라이언트 |
| `services/billingCalculator.ts` | 로컬 | **X** | billing 계산 |
| `data/cartState.ts` | 공유 | 확인 필요 | 동일할 수 있음 |
| `data/watchlistState.ts` | 공유 | 확인 필요 | 동일할 수 있음 |
| `data/accountState.ts` | 공유 | 확인 필요 | 동일할 수 있음 |

## 동기화 절차

### 1단계: Figma Make 최신 소스 조회
- `mcp__figma__get_design_context`로 Make 파일의 전체 소스 리스트 조회
- 각 리소스 URI를 `ReadMcpResourceTool`로 읽어서 내용 확인

### 2단계: 로컬 파일과 diff 비교
- Figma Make 소스와 로컬 파일을 비교
- **UI 컴포넌트**(components/)의 변경사항만 식별
- 로컬 전용 파일(routeWrappers, hooks, services)은 비교 대상에서 제외

### 3단계: UI 변경사항 적용
- 변경된 컴포넌트만 선별 업데이트
- React 18 + forwardRef 패턴 유지 확인
- 새로운 컴포넌트가 추가된 경우 props 기반인지 확인

### 4단계: import 경로 수정
적용 후 반드시 확인할 import 패턴:

```typescript
// BAD (Figma Make 원본) - mockData 직접 import
import { mockCargoData, generateBillingInfo } from '../../data/mockData';
import { setCheckoutData } from '../../routes';

// GOOD (로컬) - API/hooks/billingCalculator 사용
import { cargoApi, billingApi } from '../../services/apiClient';
import { calculateBilling } from '../../services/billingCalculator';
import { setCheckoutData } from '../../routeWrappers';
```

### 5단계: routes.tsx 복원
Figma Make가 routes.tsx를 덮어쓴 경우, `routeWrappers.tsx`에서 import하도록 복원:

```typescript
// routes.tsx는 이 구조를 유지해야 함
import { SearchWrapper, CargoStatusWrapper, ... } from './routeWrappers';
export { setCheckoutData, getLoginRedirectAwb } from './routeWrappers';
```

### 6단계: 빌드 검증
```bash
cd payment-portal && npx tsc --noEmit && npm run build
```

## 컴포넌트별 mock→API 대응표

| 컴포넌트 | Figma (mock) | 로컬 (API) |
|---------|-------------|-----------|
| AwbSearchResult | `mockCargoData[awb]` | `cargoApi.search(awb)` |
| AwbSearchResult | `generateBillingInfo(awb, date)` | `calculateBilling(cargo, date)` |
| Cart | `mockCargoData[awb]` | `cargoApi.search(awb)` (bulk) |
| Cart | `generateBillingInfo(awb, date)` | `calculateBilling(cargo, date)` |
| PendingPayments | `mockCargoData[awb]` | AWB 상세 페이지로 바로 이동 |
| Watchlist | `mockCargoData[awb]` | `cargoApi.search(awb)` (bulk) |
| CargoStatus | `generateBillingInfo(awb)` | `calculateBilling(cargo)` |
| TransactionReports | `mockCompletedPayments` | `forwarderApi.getPaymentHistory()` |
| routes/SearchWrapper | `mockCargoData + generateBillingInfo` | `cargoApi.search + billingApi.getByAwb` |
| routes/Checkout | `setTimeout` mock | `paymentApi.process()` |

## 주의사항

- **React 18**: shadcn/ui v2 컴포넌트는 React 19용. React 18에서는 `React.forwardRef` 필수
- **Figma Make 원본이 forwardRef를 사용함** → 항상 원본 소스 우선 사용
- 백엔드 DB: SQLite + EF Core 8.0 (`PaymentPortal.db`)
