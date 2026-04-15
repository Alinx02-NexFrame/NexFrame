# CLAUDE.md

## General Guidelines

- When the user asks to fix a specific issue and suggests a specific approach, prioritize the user's suggested solution over alternative approaches. Do not propose workarounds the user has not asked for.

## Platform Notes

- This project targets Windows. Always use `\r\n` for line breaks in text output, use Windows-specific path and environment behavior.
- Frontend: Vite + TypeScript (`payment-portal/`)
- Backend: .NET (`payment-portal-api/PaymentPortal.sln`)

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
