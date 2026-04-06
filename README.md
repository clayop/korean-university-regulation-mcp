# korean-university-regulation-mcp

한국 주요 대학교 규정관리시스템의 규정을 검색하고 조회할 수 있는 MCP(Model Context Protocol) 서버입니다.

동일한 규정관리시스템(lmxsrv)을 사용하는 14개 대학을 지원합니다.

## 지원 대학

| ID | 대학명 | 도메인 |
|----|--------|--------|
| `hansung` | 한성대학교 | rule.hansung.ac.kr |
| `kaist` | KAIST (한국과학기술원) | rule.kaist.ac.kr |
| `korea` | 고려대학교 | policies.korea.ac.kr |
| `khu` | 경희대학교 | rule.khu.ac.kr |
| `kookmin` | 국민대학교 | rule.kookmin.ac.kr |
| `kwangwoon` | 광운대학교 | rule.kwangwoon.ac.kr |
| `swu` | 서울여자대학교 | rule.swu.ac.kr |
| `inje` | 인제대학교 | rule.inje.ac.kr |
| `mokwon` | 목원대학교 | rule.mokwon.ac.kr |
| `kyonggi` | 경기대학교 | rule.kyonggi.ac.kr |
| `duksung` | 덕성여자대학교 | rule.duksung.ac.kr |
| `koreatech` | 한국기술교육대학교 | rule.koreatech.ac.kr |
| `konyang` | 건양대학교 | rule.konyang.ac.kr |
| `konkuk` | 건국대학교 | rule.konkuk.ac.kr |

## 설치

### Claude Desktop (로컬 stdio)

`claude_desktop_config.json`에 추가:

```json
{
  "mcpServers": {
    "korean-regulation": {
      "command": "npx",
      "args": ["-y", "korean-university-regulation-mcp"]
    }
  }
}
```

### Claude Desktop (Remote HTTP)

```json
{
  "mcpServers": {
    "korean-regulation": {
      "url": "https://korean-university-regulation-mcp.clayop.workers.dev/mcp"
    }
  }
}
```

### Claude Code

```bash
claude mcp add korean-regulation -- npx -y korean-university-regulation-mcp
```

### Claude Web / Claude Mobile

1. Settings > MCP Servers (or Integrations)
2. "Add MCP Server" 클릭
3. URL 입력: `https://korean-university-regulation-mcp.clayop.workers.dev/mcp`

### ChatGPT

1. Settings > MCP (또는 Connectors/Tools)
2. "Add MCP Server" 선택
3. URL 입력: `https://korean-university-regulation-mcp.clayop.workers.dev/mcp`

### Cursor / Windsurf 등 IDE

```json
{
  "mcpServers": {
    "korean-regulation": {
      "command": "npx",
      "args": ["-y", "korean-university-regulation-mcp"]
    }
  }
}
```

## 도구 (Tools)

### `search_regulations`
키워드로 규정을 검색합니다.

- `university` (string, required): 대학 ID (예: "kaist", "korea", "hansung")
- `query` (string): 검색 키워드 (예: "학칙", "장학금", "교원임용")

### `list_regulations`
규정 목록을 반환합니다. university를 생략하면 지원 대학 목록을 보여줍니다.

- `university` (string, optional): 대학 ID
- `includeOldVersions` (boolean, optional): true이면 구버전 포함

### `get_regulation`
특정 규정의 전문을 Markdown으로 조회합니다.

- `university` (string, required): 대학 ID
- `id` (number): 규정의 SEQ_HISTORY ID

### `get_regulation_article`
특정 규정의 특정 조항만 조회합니다.

- `university` (string, required): 대학 ID
- `id` (number): 규정의 SEQ_HISTORY ID
- `article` (string): 조항 번호 (예: "제5조", "5")

## 사용 예시

- "KAIST 학사규정을 검색해줘"
- "고려대학교 장학금 관련 규정을 찾아줘"
- "한성대학교 학칙 제5조를 보여줘"
- "지원하는 대학 목록을 알려줘"

## 데이터 업데이트

서버 시작 시 각 대학별로 자동으로 신규/개정 규정을 감지합니다.

인덱스를 수동으로 재빌드하려면:

```bash
npm run build-index              # 전체 대학
npx tsx scripts/build-index.ts kaist  # 특정 대학만
```

## 개발

```bash
npm install
npm run build
```

## 라이선스

MIT
