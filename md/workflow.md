# 작업 워크플로우 규칙

## Auto Commit & Push

작업이 의미 있는 단위로 완료되면 자동으로 commit + push한다.

### 자동 커밋 시점
- 기능 추가/수정 완료 후
- 버그 수정 완료 후
- Figma Make 동기화 완료 후 (`/make-sync`)
- DB 스키마 변경 + 마이그레이션 완료 후
- 설정/문서 변경 후

### 커밋에서 제외할 파일
- `*.db` (SQLite 데이터베이스)
- `logs/` (로그 파일)
- `bin/`, `obj/` (.NET 빌드 산출물)
- `node_modules/`
- 임시 파일 (`/temp`, `.tmp`)

### 커밋 메시지 형식
```
[요약] (영문, 50자 이내)

[상세 변경 내역] (선택)

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>
```

### Push 실패 시
- 권한 문제: 사용자에게 계정/권한 확인 요청
- 충돌: pull 후 merge 시도, 실패 시 사용자에게 안내

## 슬래시 커맨드

| 커맨드 | 용도 |
|--------|------|
| `/make-sync` | Figma Make 최신 버전을 로컬에 반영 + commit + push |
| `/commit-push` | 현재 변경사항 커밋 + push |
| `/capture` | 클립보드 이미지 확인 |

## 참고 문서
- [Figma Make 동기화 가이드](figma-make-sync.md)
