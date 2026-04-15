# CLAUDE.md

## General Guidelines

- When the user asks to fix a specific issue and suggests a specific approach, prioritize the user's suggested solution over alternative approaches. Do not propose workarounds the user has not asked for.

## Platform Notes

- This project targets Windows. Always use `\r\n` for line breaks in text output, use Windows-specific path and environment behavior.
- Frontend: Vite + TypeScript (`payment-portal/`)
- Backend: .NET (`payment-portal-api/PaymentPortal.sln`)
- Windows Git Bash는 `/subscriptions/...` 같은 leading-slash 인자를 파일 경로로 변환함. Azure CLI에서 scope 지정 시 `MSYS_NO_PATHCONV=1` 필요.

## 개인 문서 (`md/` 폴더) — gitignore됨

다중 개발자 환경에서 각자 노트가 충돌하지 않도록 `md/` 전체가 `.gitignore`에 등록됨. 다른 세션은 이 디렉토리에 접근할 수 있으나, git에는 올라가지 않음. 아래 파일들은 **이번 장치에서만** 참조 가능:

- `md/history.md` — 2026-04-15 Azure 배포 구축 작업 전체 기록 (리소스 이름, 설계 결정, 검증 결과)
- `md/plan.md` — 향후 작업 우선순위 목록
- `md/flow.md` — 웹사이트 시나리오 트리, URL ↔ 입력 ↔ 상태 매핑
- `md/project-overview.md`, `md/figma-make-sync.md`, `md/workflow.md` — 기존 문서

**세션 시작 시**: `md/history.md`를 먼저 읽으면 배포 구조와 선행 결정을 빠르게 파악할 수 있음.

## Azure 배포 (GitHub Actions 자동)

- **Backend**: https://gha-payment-api-nex01.azurewebsites.net (App Service F1, Korea Central, `rg-gha`)
- **Frontend**: https://wonderful-tree-0b4f0e700.7.azurestaticapps.net (Static Web App Free, East Asia)
- **트리거**: `main` push + 경로 필터 (`payment-portal-api/**` → backend, `payment-portal/**` → frontend)
- **인증**: Service Principal (`AZURE_CREDENTIALS` secret) + SWA deployment token (`AZURE_STATIC_WEB_APPS_API_TOKEN`)
- **Publish Profile 방식은 실패함**: Azure CLI 2.80+ 에서 credential이 REDACTED로 반환되므로 SP 방식이 정답.

## SQLite 배포 정책 (개발 단계 한정)

- `payment-portal-api/src/PaymentPortal.Api/PaymentPortal.db`를 git에 커밋하여 배포 아티팩트로 사용.
- `.csproj`에 `<Content Include="PaymentPortal.db"><CopyToPublishDirectory>PreserveNewest</CopyToPublishDirectory></Content>` 설정됨.
- 매 배포 시 서버 DB가 덮어씌워짐 (의도된 동작). 운영 전환 시 Azure SQL로 이관 필요 (`md/plan.md` 9번 참조).
- 아래 "DB 파일 commit 금지" 규칙의 **예외**. 변경 시 이 블록도 함께 업데이트.

## Custom Agents

- `.claude/agents/flow.md` — Payment Portal 사용자 시나리오 전문가. URL 플로우, 입력 추적, 페이지 전이 질문 시 자동 호출됨.

## Debugging Guidelines

- When debugging performance or runtime issues, always investigate the actual root cause before proposing fixes. Do not apply speculative fixes. Instead, add logging/profiling first to identify the bottleneck, then propose a targeted fix.
- When adding new event handlers or code paths, always include logging statements from the start. Do not rely on testing without observability.

## .NET / Async

- Never use `GetAwaiter().GetResult()` or `.Result` in async contexts — this causes deadlocks. Always use proper async/await patterns with `ConfigureAwait` when calling async methods.

## Auto Commit & Push

- 의미 있는 작업 단위가 완료되면 자동으로 commit하고 push한다.
- commit 메시지는 한국어/영어 혼용 가능하며, 변경 내용을 간결하게 요약한다.
- push 실패 시 사용자에게 알리고 원인을 안내한다.
- DB 파일(.db), 로그 파일(logs/), 임시 파일은 commit하지 않는다.
