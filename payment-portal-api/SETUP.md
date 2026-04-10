# GHA Payment Portal - Backend Setup Guide

## 현재 상태

| 항목 | 상태 |
|---|---|
| Solution 구조 | ✅ 완료 (5 프로젝트) |
| Domain Layer | ✅ 11 entities, 9 enums, BillingCalculationService |
| Application Layer | ✅ 14 DTOs, 3 validators, AutoMapper, 6 interfaces |
| Infrastructure Layer | ✅ DbContext, 6 EF configs, seed data, 6 services |
| API Layer | ✅ 6 controllers (31 endpoints), middleware, Swagger |
| Unit Tests | ✅ 5 tests passed (BillingCalculationService) |
| EF Migration | ✅ InitialCreate 생성됨 |
| **DB 연결** | ⏳ **Connection String 필요** |
| **실제 구동 확인** | ⏳ DB 연결 후 진행 |
| **Frontend 연동** | ⏳ Backend 검증 후 진행 |

---

## 프로젝트 경로

```
C:\Source_GHA\payment-portal-api\
├── PaymentPortal.sln
├── src\
│   ├── PaymentPortal.Api\              (.NET 8 Web API)
│   ├── PaymentPortal.Application\      (DTOs, Validators, Mappings)
│   ├── PaymentPortal.Domain\           (Entities, Enums, Services)
│   └── PaymentPortal.Infrastructure\   (EF Core, JWT, PDF/Excel, Seed)
└── tests\
    └── PaymentPortal.Tests\            (xUnit)
```

---

## 다음 단계: Connection String 설정

### 1. appsettings.json 수정

파일: `src/PaymentPortal.Api/appsettings.json`

현재값 (LocalDB):
```json
"ConnectionStrings": {
  "DefaultConnection": "Server=localhost;Database=PaymentPortal;Trusted_Connection=True;TrustServerCertificate=True;"
}
```

Azure SQL Server로 변경 시:
```json
"ConnectionStrings": {
  "DefaultConnection": "Server=tcp:<서버>.database.windows.net,1433;Initial Catalog=PaymentPortal;Persist Security Info=False;User ID=<user>;Password=<password>;MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;"
}
```

### 2. Azure SQL 방화벽 설정

Azure Portal에서:
- SQL Server → Networking → Firewall rules
- 현재 클라이언트 IP 허용 추가

### 3. DB 마이그레이션 + 실행

```bash
cd C:\Source_GHA\payment-portal-api

# 마이그레이션 적용 (테이블 생성)
dotnet ef database update --project src/PaymentPortal.Infrastructure --startup-project src/PaymentPortal.Api

# 서버 실행
dotnet run --project src/PaymentPortal.Api
```

### 4. 검증

- Swagger UI: `https://localhost:5001/swagger`
- AWB 검색: `GET /api/cargo/search?awbNumber=020-12345678`
- 로그인: `POST /api/auth/login` → `{ "email": "admin@gha.com", "password": "Password123!" }`

---

## Seed Data (자동 생성)

앱 최초 실행 시 아래 데이터가 자동 삽입됨:

### Companies (3)
| Name | Email |
|---|---|
| Global Freight Solutions | contact@globalfreight.com |
| Pacific Logistics Inc. | info@pacificlog.com |
| Express Air Cargo | support@expressair.com |

### Users (4) - 비밀번호: `Password123!`
| Email | Role |
|---|---|
| admin@gha.com | GHA Admin |
| john@globalfreight.com | Forwarder |
| jane@pacificlog.com | Forwarder |
| mike@expressair.com | Forwarder |

### Cargo (8 AWBs)
| AWB | Origin | Customs |
|---|---|---|
| 020-12345678 | ICN → LAX | Released |
| 020-87654321 | PVG → JFK | Hold |
| 020-11223344 | HKG → ORD | PNF |
| + 5개 추가 (결제 이력용) | | |

### Completed Payments (4)
| Confirmation | AWB | Amount |
|---|---|---|
| PMT-2026010801 | 020-99887766 | $456.25 |
| PMT-2026010701 | 020-44556677 | $678.90 |
| PMT-2026010601 | 020-33445566 | $321.50 |
| PMT-2026010501 | 020-22334455 | $892.00 |

---

## API Endpoints (31개)

### Auth (Public)
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `GET  /api/auth/me` [JWT]

### Cargo & Billing (Public)
- `GET /api/cargo/search?awbNumber=`
- `GET /api/billing/{awbNumber}`

### Payment
- `POST /api/payments` (게스트)
- `POST /api/payments/authenticated` [JWT]
- `POST /api/payments/bulk` [JWT:forwarder]
- `GET  /api/payments/{confirmationNumber}/receipt` (PDF)

### Forwarder [JWT:forwarder]
- `GET    /api/forwarder/dashboard`
- `GET    /api/forwarder/payments/pending`
- `GET    /api/forwarder/payments/history`
- `GET    /api/forwarder/reports/transactions`
- `GET    /api/forwarder/reports/export?format=pdf|excel`
- `GET    /api/forwarder/watchlist`
- `POST   /api/forwarder/watchlist`
- `DELETE /api/forwarder/watchlist/{itemId}`
- `GET    /api/forwarder/users`
- `POST   /api/forwarder/users`
- `PUT    /api/forwarder/users/{id}`
- `DELETE /api/forwarder/users/{id}`

### GHA Admin [JWT:gha_admin]
- `GET  /api/gha/revenue`
- `GET  /api/gha/revenue/monthly-trend`
- `GET  /api/gha/revenue/breakdown`
- `GET  /api/gha/revenue/settlement`
- `GET  /api/gha/revenue/top-customers`
- `GET  /api/gha/customers`
- `GET  /api/gha/customers/activity`
- `POST /api/gha/reports/generate`
- `POST /api/gha/data/upload`

---

## Tech Stack

| 구분 | 버전 |
|---|---|
| .NET | 8.0 |
| EF Core | 8.0.23 |
| JWT Bearer | 8.0.23 |
| Swashbuckle | 6.9.0 |
| QuestPDF | 2025.12.4 |
| ClosedXML | 0.105.0 |
| BCrypt.Net | 4.0.3 |
| FluentValidation | 12.1.1 |
| AutoMapper | 12.0.1 |
| Serilog | 10.0.0 |
