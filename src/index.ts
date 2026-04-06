#!/usr/bin/env node
// Some university sites have invalid SSL certificates
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { IndexManager } from "./lib/index-manager.js";
import { searchInputSchema, handleSearch } from "./tools/search.js";
import { listInputSchema, handleList } from "./tools/list.js";
import { getContentInputSchema, handleGetContent } from "./tools/get-content.js";
import { getArticleInputSchema, handleGetArticle } from "./tools/get-article.js";

const indexManager = new IndexManager();

const server = new McpServer({
  name: "korean-university-regulation-mcp",
  version: "0.2.0",
});

server.registerTool(
  "search_regulations",
  {
    description:
      "대학 규정을 키워드로 검색합니다. 규정명에서 키워드를 찾아 매칭되는 규정 목록을 반환합니다.",
    inputSchema: searchInputSchema,
  },
  handleSearch(indexManager),
);

server.registerTool(
  "list_regulations",
  {
    description:
      "대학 규정 목록을 반환합니다. university를 생략하면 지원 대학 목록을 보여줍니다.",
    inputSchema: listInputSchema,
  },
  handleList(indexManager),
);

server.registerTool(
  "get_regulation",
  {
    description:
      "특정 규정의 전문을 조회합니다. search_regulations 또는 list_regulations에서 얻은 id(SEQ_HISTORY)를 사용하세요.",
    inputSchema: getContentInputSchema,
  },
  handleGetContent(),
);

server.registerTool(
  "get_regulation_article",
  {
    description:
      "특정 규정의 특정 조항만 조회합니다. 규정 id와 조항 번호(예: '제5조')를 입력하세요.",
    inputSchema: getArticleInputSchema,
  },
  handleGetArticle(),
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("[server] Korean University Regulation MCP server started");

  // Start background delta scans for all universities
  indexManager.startAllDeltaScans();
}

main().catch((error) => {
  console.error("[server] Fatal error:", error);
  process.exit(1);
});
