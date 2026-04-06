# Implementation Plan: Hansung University Regulation MCP Server

## Task Type
- [x] Backend (Node.js/TypeScript MCP Server)
- [ ] Frontend
- [ ] Fullstack

---

## Project Overview

공개 배포용 MCP 서버로, 한성대학교 규정관리시스템(rule.hansung.ac.kr)의 규정을 검색하고 조회할 수 있는 도구를 제공합니다.

---

## Technical Analysis

### Data Source Findings

1. **Primary Endpoint**: `https://rule.hansung.ac.kr/lmxsrv/law/lawFullContent.do?SEQ_HISTORY={id}`
   - `SEQ_HISTORY` 파라미터만으로 규정 내용 조회 가능 (SEQ 불필요)
   - 유효 범위: 1 ~ ~1629 (일부 gap 존재)
   - 응답: 서버사이드 렌더링 HTML

2. **Data Structure**:
   - 동일 규정이 여러 `SEQ_HISTORY` 값을 가짐 (버전/개정별)
   - 예: "한성대학교 학칙"은 약 21개의 SEQ_HISTORY 존재
   - 최신(가장 큰) SEQ_HISTORY가 현행 규정
   - 총 유효 항목: ~1000+개, 고유 규정명: ~300개

3. **HTML Structure**:
   - `div.lawname` → 규정명
   - `div.chapter` → 장(Chapter) 제목
   - `td` (조항 테이블 내) → 조(Article) 제목
   - `div.none`, `div.hang`, `div.ho` → 조문 내용 (level0, level1, level2로 계층 구분)

4. **Site Limitations**:
   - 메인 페이지/목록/검색 API는 세션 기반으로 직접 호출 불가
   - `lawFullContent.do`는 세션 없이 직접 접근 가능 (핵심!)

### Architecture Decision

**Hybrid Approach: Static Index + Live Content Fetch**

| Component | Strategy | Rationale |
|-----------|----------|-----------|
| 규정 목록/인덱스 | JSON 파일로 번들 (빌드 타임 생성) | 빠른 검색, 오프라인에서도 목록 조회 가능 |
| 규정 내용 | 실시간 HTTP fetch | 최신 내용 보장, 패키지 크기 최소화 |
| 인덱스 업데이트 | 런타임 자동 delta scan (서버 시작 시) | 사용자 개입 없이 신규/개정 규정 자동 감지 |

---

## Technical Solution

### Tech Stack
- **Runtime**: Node.js 18+ (TypeScript, ESM `"type": "module"`)
- **MCP SDK**: `@modelcontextprotocol/sdk` (import from `sdk/server/mcp.js`, `sdk/server/stdio.js`) + `zod@3`
- **HTTP Client**: Built-in `fetch` (Node 18+)
- **HTML Parser**: `cheerio` (경량 HTML 파서)
- **Build**: `tsc` (TypeScript compiler) → `build/index.js` (shebang `#!/usr/bin/env node`)
- **Package**: npm 배포 (`bin` + `files: ["build", "data"]`)

### Project Structure
```
hansung-university-regulation-mcp/
├── src/
│   ├── index.ts              # MCP 서버 엔트리포인트
│   ├── tools/
│   │   ├── search.ts         # 규정 검색 도구
│   │   ├── list.ts           # 규정 목록 도구
│   │   ├── get-content.ts    # 규정 내용 조회 도구
│   │   └── get-article.ts    # 특정 조항 조회 도구
│   ├── lib/
│   │   ├── fetcher.ts        # HTTP fetch + HTML 파싱 로직
│   │   ├── parser.ts         # HTML → 구조화된 텍스트 변환
│   │   └── index-manager.ts  # 인덱스 로딩 + delta scan + 업데이트
│   └── data/
│       └── regulations.json  # 빌드 타임에 생성되는 규정 인덱스
├── scripts/
│   └── build-index.ts        # 규정 인덱스 빌드 스크립트
├── package.json
├── tsconfig.json
├── tsup.config.ts
└── README.md
```

---

## Implementation Steps

### Step 1: Project Scaffolding
- `package.json` 생성 (name: `hansung-university-regulation-mcp`)
- TypeScript, tsup, MCP SDK, cheerio, zod 의존성 설정
- `tsconfig.json` 설정
- `tsup.config.ts` 설정 (CJS/ESM 빌드)

**Expected deliverable**: 빌드 가능한 빈 프로젝트

### Step 2: Index Builder Script (`scripts/build-index.ts`)
- SEQ_HISTORY 1~1700 범위를 스캔
- 각 값에 대해 `lawFullContent.do` 호출 → 규정명 추출
- 동일 규정명의 가장 큰 SEQ_HISTORY를 최신 버전으로 식별
- 결과를 `src/data/regulations.json`에 저장:
  ```json
  {
    "lastUpdated": "2026-04-02T00:00:00Z",
    "maxScannedId": 1700,
    "regulations": [
      {
        "id": 1622,
        "name": "학교법인 한성학원 정관",
        "allVersions": [1, 700, 1622],
        "isLatest": true
      },
      ...
    ]
  }
  ```
- 동시 요청 제한 (rate limiting: 5 concurrent)
- 진행 상황 로그 출력
- `maxScannedId` 필드: 런타임 delta scan의 시작점으로 활용

**Expected deliverable**: 실행 가능한 인덱스 빌드 스크립트, 규정 인덱스 JSON

### Step 3: HTML Parser (`src/lib/parser.ts`)
- `cheerio`로 HTML 파싱
- 규정명 추출: `div.lawname`
- 장(Chapter) 추출: `div.chapter`
- 조(Article) 추출: 조항 테이블 내 `td` 텍스트
- 조문 내용 추출: `div.none`, `div.hang`, `div.ho` + span 텍스트
- 부칙 추출
- 출력 포맷: 구조화된 Markdown 텍스트

**Expected deliverable**: HTML → Markdown 변환 모듈

### Step 4: HTTP Fetcher (`src/lib/fetcher.ts`)
- `fetch`로 `lawFullContent.do` 호출
- 응답 HTML을 parser로 전달
- 에러 핸들링 (네트워크 오류, 빈 응답)
- 캐시 (선택적, Map 기반 in-memory)

**Expected deliverable**: 규정 내용 fetch 모듈

### Step 4.5: Index Manager (`src/lib/index-manager.ts`)
- **번들 인덱스 로딩**: `src/data/regulations.json`을 읽어 메모리에 적재
- **자동 Delta Scan (서버 시작 시 백그라운드)**:
  - 번들 인덱스의 `maxScannedId` 이후부터 빈 응답이 연속 50회 나올 때까지 스캔
  - 새로 발견된 규정을 메모리 인덱스에 병합
  - 기존 규정의 새 버전이면 `isLatest` 플래그 갱신
  - 비동기로 실행 → 서버 시작을 블로킹하지 않음
  - 스캔 완료 전에도 번들 인덱스 기반으로 도구 사용 가능
- **인메모리 관리**: 런타임 중 발견된 신규 규정은 메모리에만 저장 (파일 쓰기 없음)

**Expected deliverable**: 인덱스 로딩 + 자동 delta scan 매니저

### Step 5: MCP Tools 구현

#### Tool 1: `search_regulations`
- **Input**: `{ query: string }` - 검색 키워드
- **Logic**: 번들된 인덱스에서 규정명 fuzzy match
- **Output**: 매칭된 규정 목록 (id, name, isLatest)

#### Tool 2: `list_regulations`
- **Input**: `{ includeOldVersions?: boolean }` - 구버전 포함 여부
- **Logic**: 번들된 인덱스에서 전체/최신 목록 반환
- **Output**: 규정 목록

#### Tool 3: `get_regulation`
- **Input**: `{ id: number }` - SEQ_HISTORY ID
- **Logic**: 실시간 fetch → HTML 파싱 → Markdown 변환
- **Output**: 규정 전문 (Markdown 텍스트)

#### Tool 4: `get_regulation_article`
- **Input**: `{ id: number, article: string }` - SEQ_HISTORY + 조 번호 (예: "제5조")
- **Logic**: 규정 fetch 후 특정 조항만 추출
- **Output**: 해당 조항 텍스트

**Expected deliverable**: 4개의 MCP 도구

### Step 6: MCP Server Entry Point (`src/index.ts`)
- `McpServer` 인스턴스 생성
- 4개 도구 등록 (`search_regulations`, `list_regulations`, `get_regulation`, `get_regulation_article`)
- `StdioServerTransport` 연결
- 서버 연결 후 `indexManager.startDeltaScan()` 비동기 호출
- package.json의 `bin` 필드 설정

**Expected deliverable**: 실행 가능한 MCP 서버 (시작 시 자동 delta scan)

### Step 7: Build & Package Configuration
- `tsup.config.ts` 설정: `src/index.ts` → `dist/index.js`
- `package.json` 설정:
  - `bin`: `{ "hansung-regulation-mcp": "dist/index.js" }`
  - `files`: `["dist", "src/data"]`
  - `scripts`: `build`, `build-index`, `prepublishOnly`
- README.md 작성 (설치/사용법)

**Expected deliverable**: npm publish 가능한 패키지

### Step 8: Testing & Validation
- MCP Inspector로 도구 테스트
- 규정 검색, 조회 E2E 검증
- 에지 케이스: 빈 응답, 네트워크 오류, 없는 ID

**Expected deliverable**: 검증 완료된 MCP 서버

---

## Key Files

| File | Operation | Description |
|------|-----------|-------------|
| `package.json` | Create | 프로젝트 설정, 의존성, bin 필드 |
| `tsconfig.json` | Create | TypeScript 설정 |
| `tsup.config.ts` | Create | 번들러 설정 |
| `src/index.ts` | Create | MCP 서버 메인 엔트리포인트 |
| `src/tools/search.ts` | Create | 검색 도구 |
| `src/tools/list.ts` | Create | 목록 도구 |
| `src/tools/get-content.ts` | Create | 내용 조회 도구 |
| `src/tools/get-article.ts` | Create | 조항 조회 도구 |
| `src/lib/fetcher.ts` | Create | HTTP fetch 로직 |
| `src/lib/parser.ts` | Create | HTML 파싱 로직 |
| `src/lib/index-loader.ts` | Create | 인덱스 로딩 |
| `src/data/regulations.json` | Generate | 규정 인덱스 (빌드 시 생성) |
| `scripts/build-index.ts` | Create | 인덱스 빌드 스크립트 |
| `README.md` | Create | 사용 문서 |

---

## Risks and Mitigation

| Risk | Mitigation |
|------|------------|
| 사이트 구조 변경 시 파서 깨짐 | cheerio 셀렉터를 유연하게 작성, 에러 시 raw HTML fallback |
| 대량 요청 시 IP 차단 | 인덱스 빌드 시 rate limiting (5 concurrent, 200ms delay), 런타임은 단건 요청 |
| SEQ_HISTORY 범위 확장 | 런타임 delta scan이 자동으로 새 범위 감지 (연속 50회 빈 응답까지) |
| 패키지 크기 증가 | 인덱스 JSON만 번들 (~50KB 예상), 내용은 실시간 fetch |
| Node.js 18 미만 환경 | package.json engines 필드로 Node 18+ 명시 |

---

## Usage (After Implementation)

### Installation
```json
// claude_desktop_config.json
{
  "mcpServers": {
    "hansung-regulation": {
      "command": "npx",
      "args": ["-y", "hansung-university-regulation-mcp"]
    }
  }
}
```

### Example Queries
- "한성대학교 학칙에서 수강신청 관련 조항을 찾아줘"
- "교원 임용 관련 규정 목록을 보여줘"
- "장학금규정 제3조 내용이 뭐야?"

---

## SESSION_ID (for /ccg:execute use)
- CODEX_SESSION: N/A (codeagent-wrapper not available)
- GEMINI_SESSION: N/A (codeagent-wrapper not available)
