# GHA Payment Portal - 프로젝트 전체 구조

## 프로젝트 개요

항공 화물 GHA(Ground Handling Agent)를 위한 결제 포털 시스템.
Forwarder(화물 운송 주선인)가 AWB(Air Waybill) 기반으로 화물 비용을 조회하고 결제하는 웹 애플리케이션.

## 기술 스택

| 영역 | 기술 |
|------|------|
| Frontend | React 18 + Vite 6 + TypeScript |
| UI | Tailwind CSS v4 + shadcn/ui (Radix UI) + Recharts |
| Backend | .NET 8 (ASP.NET Core Web API) |
| ORM | Entity Framework Core 8 |
| DB | SQLite (PaymentPortal.db) |
| 인증 | JWT + BCrypt |
| 디자인 | Figma Make (fileKey: `oF5IWDz6Xc73353tURjobg`) |

## 디렉토리 구조

```
C:\Source_GHA\
├── payment-portal/              # Frontend (React)
│   ├── src/app/
│   │   ├── components/          # UI 컴포넌트 (Figma Make 소유)
│   │   │   ├── Home.tsx         # 로그인 + Quick Payment 랜딩
│   │   │   ├── QuickPaymentSearch.tsx  # AWB 검색 (게스트)
│   │   │   ├── CargoStatus.tsx  # 화물 상태 + 요금 (게스트)
│   │   │   ├── CheckoutScreen.tsx     # 결제 (게스트, CC만)
│   │   │   ├── ConfirmationScreen.tsx # 결제 완료
│   │   │   ├── ForwarderDashboard.tsx # Forwarder 대시보드
│   │   │   ├── GHADashboard.tsx       # GHA Admin 대시보드
│   │   │   ├── SearchScreen.tsx       # 검색 화면 (미사용)
│   │   │   ├── auth/LoginModal.tsx    # 로그인 모달
│   │   │   ├── cart/Cart.tsx          # 장바구니
│   │   │   ├── watchlist/Watchlist.tsx # AWB 감시 목록
│   │   │   ├── dashboard/             # 대시보드 하위 컴포넌트
│   │   │   │   ├── PendingPayments.tsx    # 대기 결제 + 워치리스트
│   │   │   │   ├── AwbSearchResult.tsx    # AWB 상세 (요금/날짜)
│   │   │   │   ├── AwbDetailPage.tsx      # AWB 상세 래퍼
│   │   │   │   ├── DashboardCheckout.tsx  # 로그인 결제 (CC/ACH/크레딧)
│   │   │   │   ├── PaymentHistory.tsx     # 결제 이력
│   │   │   │   ├── TransactionReports.tsx # 거래 리포트 + 차트
│   │   │   │   └── UserManagement.tsx     # 사용자 관리
│   │   │   ├── gha/                   # GHA Admin 하위
│   │   │   │   ├── RevenueAnalytics.tsx   # 매출 분석
│   │   │   │   ├── CustomerManagement.tsx # 고객 관리
│   │   │   │   ├── DataIntegration.tsx    # AI 데이터 연동
│   │   │   │   └── ReportsManagement.tsx  # 보고서 관리
│   │   │   └── ui/                    # shadcn/ui 컴포넌트 (60+)
│   │   ├── routes.tsx           # 라우트 정의 (Figma Make 덮어쓰기 안전)
│   │   ├── routeWrappers.tsx    # API 호출 로직 (로컬 전용)
│   │   ├── hooks/               # 데이터 fetching hooks (로컬 전용)
│   │   │   ├── useCargoSearch.ts
│   │   │   └── useCargoLookup.ts
│   │   ├── services/            # API 클라이언트 (로컬 전용)
│   │   │   ├── apiClient.ts
│   │   │   └── billingCalculator.ts
│   │   ├── data/                # 상태 관리 + mock 데이터
│   │   │   ├── mockData.ts      # Figma Make 소유 (사용 안 함)
│   │   │   ├── cartState.ts     # 장바구니 전역 상태
│   │   │   ├── watchlistState.ts # 감시목록 전역 상태
│   │   │   └── accountState.ts  # 계정 크레딧 전역 상태
│   │   └── types/index.ts       # TypeScript 타입 정의
│   └── src/styles/              # CSS (Figma Make 소유)
│
├── payment-portal-api/          # Backend (.NET)
│   └── src/
│       ├── PaymentPortal.Api/           # Web API 진입점
│       ├── PaymentPortal.Application/   # DTO, 인터페이스, 밸리데이터
│       ├── PaymentPortal.Domain/        # 엔티티, Enum
│       └── PaymentPortal.Infrastructure/ # DB, 서비스 구현
│
├── md/                          # 프로젝트 문서
│   ├── project-overview.md      # 이 파일
│   ├── figma-make-sync.md       # Figma Make 동기화 가이드
│   └── workflow.md              # 작업 워크플로우 규칙
│
└── .claude/commands/            # 슬래시 커맨드 (로컬 전용)
    ├── make-sync.md             # /make-sync
    ├── commit-push.md           # /commit-push
    └── capture.md               # /capture
```

## 사용자 흐름

### 1. 게스트 Quick Pay
```
Home → /search → /cargo-status → /checkout → /confirmation
```
- 회원가입 불필요, 신용카드만 사용 가능
- AWB 번호로 화물 조회 → 요금 확인 → 결제 → 영수증

### 2. Forwarder (로그인 사용자)
```
Home (로그인) → /dashboard → /dashboard/awb/{awb} → /cart → /dashboard/checkout → /dashboard/confirmation
```
- 다중 AWB 결제 (장바구니)
- CC / ACH / Account Credit 결제 가능
- Pickup Date 선택으로 Storage Fee 동적 계산
- 워치리스트, 결제 이력, 거래 리포트

### 3. GHA Admin
```
Home (로그인) → /gha-dashboard
```
- 매출 분석 (KPI, 차트)
- 고객 관리
- AI 데이터 연동 설정
- 보고서 생성/관리

## 인증 체계

| 항목 | 값 |
|------|-----|
| 방식 | JWT (Access Token + Refresh Token) |
| 로그인 필드 | Username (email 아님) |
| 비밀번호 해싱 | BCrypt |
| Access Token 만료 | 설정값 (appsettings.json) |

### 테스트 계정

| Username | Password | Role | Company |
|----------|----------|------|---------|
| admin | 1234 | GHA Admin | - |
| john | 1234 | Forwarder | Global Freight Solutions |
| jane | 1234 | Forwarder | Pacific Logistics Inc. |
| mike | 1234 | Forwarder | Express Air Cargo |

## DB 스키마 (11 테이블)

| 테이블 | 용도 | 주요 관계 |
|--------|------|----------|
| Companies | 운송사 (계정 크레딧 보유) | → Users, Payments |
| Users | 사용자 (Username 고유) | → Company, RefreshTokens, Payments |
| RefreshTokens | JWT 리프레시 토큰 | → User |
| Cargo | AWB 화물 정보 | → BillingRecord, Payments |
| BillingRecords | 요금 명세 | → Cargo (1:1) |
| Payments | 결제 내역 | → Cargo, User, Company |
| Watchlists | 감시 목록 | → Company |
| WatchlistItems | 감시 목록 항목 | → Watchlist |
| Reports | 생성된 보고서 | → User |
| UploadHistory | 파일 업로드 이력 | - |
| AuditLogs | 감사 로그 | - |

## API 엔드포인트

### Auth
| Method | Path | 설명 |
|--------|------|------|
| POST | /api/auth/login | 로그인 (username + password) |
| POST | /api/auth/register | 회원가입 |
| GET | /api/auth/me | 현재 사용자 정보 |

### Cargo & Billing
| Method | Path | 설명 |
|--------|------|------|
| GET | /api/cargo/search?awbNumber= | AWB 검색 |
| GET | /api/billing/{awbNumber} | 요금 조회 |

### Payments
| Method | Path | 설명 |
|--------|------|------|
| POST | /api/payments | 게스트 결제 |
| POST | /api/payments/authenticated | 로그인 사용자 결제 |

### Forwarder
| Method | Path | 설명 |
|--------|------|------|
| GET | /api/forwarder/dashboard | 대시보드 요약 |
| GET | /api/forwarder/payments/pending | 대기 결제 목록 |
| GET | /api/forwarder/payments/history | 결제 이력 (페이징) |
| GET | /api/forwarder/reports/transactions | 거래 차트 데이터 |
| GET/POST | /api/forwarder/watchlist | 워치리스트 관리 |

### GHA Admin
| Method | Path | 설명 |
|--------|------|------|
| GET | /api/gha/revenue | 매출 통계 |
| GET | /api/gha/revenue/monthly-trend | 월별 추이 |
| GET | /api/gha/revenue/breakdown | 매출 구성 |
| GET | /api/gha/revenue/settlement | 정산 금액 |
| GET | /api/gha/revenue/top-customers | 상위 고객 |
| GET | /api/gha/customers | 고객 목록 (페이징) |

## 요금 계산 로직

```
Service Fee       = $250 (고정)
Storage Fee       = max(0, 총일수 - 무료기간) × $50 × (중량kg / 1000)
Other Charge      = Customs Hold일 때 $150
─────────────────────────────────────
Subtotal          = Service + Storage + Other
Processing Fee    = Subtotal × 2.5%
─────────────────────────────────────
Total             = Subtotal + Processing Fee

Credit Card Fee   = Subtotal × 2.9% (CC 결제 시 추가)
```

- 무료 보관 기간: Released 3일, PNF/Hold 5일
- Pickup Date 변경 시 Storage Fee 실시간 재계산 (client-side: `billingCalculator.ts`)

## Figma Make 동기화

자세한 내용은 [figma-make-sync.md](figma-make-sync.md) 참조.

핵심 원칙: **Figma Make가 UI를 소유하고, 로컬이 API 연동을 소유한다.**

| 소유자 | 파일 |
|--------|------|
| Figma Make | `components/**/*.tsx`, `routes.tsx`, `data/mockData.ts`, `styles/*.css` |
| 로컬 전용 | `routeWrappers.tsx`, `hooks/*.ts`, `services/*.ts` |

`/make-sync` 커맨드로 Figma Make 최신 UI를 반영하면서 API 연동을 보존.

## 실행 방법

```bash
# Backend (포트 5209)
cd payment-portal-api/src/PaymentPortal.Api
dotnet run

# Frontend (포트 5173, /api → 5209 프록시)
cd payment-portal
npm run dev
```

브라우저: http://localhost:5173
