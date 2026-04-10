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
