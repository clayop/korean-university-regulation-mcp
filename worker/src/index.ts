import { McpAgent } from "agents/mcp";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import * as cheerio from "cheerio";

// Import all university indexes
import HANSUNG from "../../data/hansung.json";
import KAIST from "../../data/kaist.json";
import KOREA from "../../data/korea.json";
import KHU from "../../data/khu.json";
import KOOKMIN from "../../data/kookmin.json";
import KWANGWOON from "../../data/kwangwoon.json";
import SWU from "../../data/swu.json";
import INJE from "../../data/inje.json";
import MOKWON from "../../data/mokwon.json";
import KYONGGI from "../../data/kyonggi.json";
import DUKSUNG from "../../data/duksung.json";
import KOREATECH from "../../data/koreatech.json";
import KONYANG from "../../data/konyang.json";
import KONKUK from "../../data/konkuk.json";

// ─── Types ───────────────────────────────────────────────────────────

interface RegulationEntry {
  id: number;
  name: string;
  allVersions: number[];
  isLatest: boolean;
}

interface Chapter {
  title: string;
  articles: Article[];
}

interface Article {
  title: string;
  content: string[];
}

interface RegulationContent {
  name: string;
  chapters: Chapter[];
  supplementary: string[];
}

// ─── Universities Config ─────────────────────────────────────────────

interface UniversityConfig {
  id: string;
  name: string;
  domain: string;
  protocol: "http" | "https";
  regulations: RegulationEntry[];
}

const UNIVERSITIES: Record<string, UniversityConfig> = {
  hansung: { id: "hansung", name: "한성대학교", domain: "rule.hansung.ac.kr", protocol: "https", regulations: HANSUNG.regulations },
  kaist: { id: "kaist", name: "KAIST (한국과학기술원)", domain: "rule.kaist.ac.kr", protocol: "https", regulations: KAIST.regulations },
  korea: { id: "korea", name: "고려대학교", domain: "policies.korea.ac.kr", protocol: "https", regulations: KOREA.regulations },
  khu: { id: "khu", name: "경희대학교", domain: "rule.khu.ac.kr", protocol: "https", regulations: KHU.regulations },
  kookmin: { id: "kookmin", name: "국민대학교", domain: "rule.kookmin.ac.kr", protocol: "https", regulations: KOOKMIN.regulations },
  kwangwoon: { id: "kwangwoon", name: "광운대학교", domain: "rule.kwangwoon.ac.kr", protocol: "http", regulations: KWANGWOON.regulations },
  swu: { id: "swu", name: "서울여자대학교", domain: "rule.swu.ac.kr", protocol: "https", regulations: SWU.regulations },
  inje: { id: "inje", name: "인제대학교", domain: "rule.inje.ac.kr", protocol: "https", regulations: INJE.regulations },
  mokwon: { id: "mokwon", name: "목원대학교", domain: "rule.mokwon.ac.kr", protocol: "https", regulations: MOKWON.regulations },
  kyonggi: { id: "kyonggi", name: "경기대학교", domain: "rule.kyonggi.ac.kr", protocol: "http", regulations: KYONGGI.regulations },
  duksung: { id: "duksung", name: "덕성여자대학교", domain: "rule.duksung.ac.kr", protocol: "https", regulations: DUKSUNG.regulations },
  koreatech: { id: "koreatech", name: "한국기술교육대학교", domain: "rule.koreatech.ac.kr", protocol: "https", regulations: KOREATECH.regulations },
  konyang: { id: "konyang", name: "건양대학교", domain: "rule.konyang.ac.kr", protocol: "https", regulations: KONYANG.regulations },
  konkuk: { id: "konkuk", name: "건국대학교", domain: "rule.konkuk.ac.kr", protocol: "https", regulations: KONKUK.regulations },
};

const UNIVERSITY_IDS = Object.keys(UNIVERSITIES) as [string, ...string[]];

// ─── Index Functions ─────────────────────────────────────────────────

function searchRegulations(uniId: string, query: string): RegulationEntry[] {
  const uni = UNIVERSITIES[uniId];
  if (!uni) return [];
  const q = query.toLowerCase().replace(/\s+/g, "");
  return uni.regulations.filter((r) =>
    r.name.toLowerCase().replace(/\s+/g, "").includes(q),
  );
}

function listRegulations(uniId: string, latestOnly: boolean): RegulationEntry[] {
  const uni = UNIVERSITIES[uniId];
  if (!uni) return [];
  if (latestOnly) return uni.regulations.filter((r) => r.isLatest);
  return uni.regulations;
}

// ─── Fetcher ─────────────────────────────────────────────────────────

async function fetchRegulationHtml(
  uniId: string,
  seqHistory: number,
): Promise<string | null> {
  const uni = UNIVERSITIES[uniId];
  if (!uni) return null;
  const url = `${uni.protocol}://${uni.domain}/lmxsrv/law/lawFullContent.do?SEQ_HISTORY=${seqHistory}`;
  const res = await fetch(url, {
    headers: { "User-Agent": "korean-university-regulation-mcp/0.2.0", Accept: "text/html" },
  });
  if (!res.ok) return null;
  const html = await res.text();
  if (!html.includes('class="lawname"')) return null;
  return html;
}

// ─── Parser ──────────────────────────────────────────────────────────

function parseRegulation(html: string): RegulationContent {
  const $ = cheerio.load(html);
  const name = $("div.lawname").first().text().trim().replace(/\s+/g, " ") || "Unknown";
  const result: RegulationContent = { name, chapters: [], supplementary: [] };
  let curChapter: Chapter = { title: "총칙", articles: [] };
  let curArticle: Article | null = null;
  let inSupplementary = false;

  $("div.chapter, table caption, td, div.none, div.hang, div.ho, div.buTitle").each((_, el) => {
    const $el = $(el);
    const tagName = (el as any).tagName as string;
    const classes = $el.attr("class") || "";

    if (classes.includes("chapter")) {
      if (curArticle) { curChapter.articles.push(curArticle); curArticle = null; }
      if (curChapter.articles.length > 0 || curChapter.title) result.chapters.push(curChapter);
      curChapter = { title: $el.text().trim().replace(/\s+/g, " "), articles: [] };
      inSupplementary = false;
      return;
    }
    if (classes.includes("buTitle")) {
      if (curArticle) { curChapter.articles.push(curArticle); curArticle = null; }
      if (curChapter.articles.length > 0 || curChapter.title) result.chapters.push(curChapter);
      curChapter = { title: $el.text().trim().replace(/\s+/g, " "), articles: [] };
      inSupplementary = true;
      return;
    }
    if (tagName === "td") {
      const text = $el.text().trim();
      if (/제\s*\d+\s*조/.test(text) || /제\s*\d+\s*조의\d+/.test(text)) {
        if (curArticle) curChapter.articles.push(curArticle);
        curArticle = { title: text.replace(/\s+/g, " ").trim(), content: [] };
      }
      return;
    }
    if (classes.includes("none") || classes.includes("hang") || classes.includes("ho")) {
      const text = $el.find("span").map((_, span) => $(span).text().trim()).get().join("");
      if (!text) return;
      const level = classes.includes("ho") ? 2 : classes.includes("hang") ? 1 : 0;
      const formatted = `${"  ".repeat(level)}${text}`;
      if (inSupplementary) result.supplementary.push(formatted);
      else if (curArticle) curArticle.content.push(formatted);
    }
  });

  if (curArticle) curChapter.articles.push(curArticle);
  if (curChapter.articles.length > 0 || curChapter.title) result.chapters.push(curChapter);
  return result;
}

function toMarkdown(reg: RegulationContent): string {
  const lines: string[] = [`# ${reg.name}`, ""];
  for (const ch of reg.chapters) {
    if (ch.title) lines.push(`## ${ch.title}`, "");
    for (const a of ch.articles) { lines.push(`### ${a.title}`, ""); for (const c of a.content) lines.push(c); lines.push(""); }
  }
  if (reg.supplementary.length > 0) { lines.push("## 부칙", ""); for (const s of reg.supplementary) lines.push(s); lines.push(""); }
  return lines.join("\n");
}

function findArticle(reg: RegulationContent, q: string): Article | null {
  const m = q.match(/(\d+)/);
  if (!m) return null;
  for (const ch of reg.chapters) for (const a of ch.articles) { const tm = a.title.match(/제\s*(\d+)\s*조/); if (tm && tm[1] === m[1]) return a; }
  return null;
}

// ─── MCP Agent ───────────────────────────────────────────────────────

type Env = { MCP_OBJECT: DurableObjectNamespace };

export class HansungRegulationMCP extends McpAgent<Env> {
  server = new McpServer({ name: "korean-university-regulation-mcp", version: "0.2.0" });

  async init() {
    this.server.tool(
      "search_regulations",
      "대학 규정을 키워드로 검색합니다.",
      {
        university: z.enum(UNIVERSITY_IDS).describe("대학 ID (예: 'hansung', 'kaist', 'korea', 'khu')"),
        query: z.string().describe("검색 키워드 (예: '학칙', '장학금', '교원임용')"),
      },
      async ({ university, query }) => {
        const uni = UNIVERSITIES[university];
        const results = searchRegulations(university, query);
        if (results.length === 0) return { content: [{ type: "text", text: `${uni?.name}에서 "${query}" 검색 결과가 없습니다.` }] };
        const lines = results.map((r) => `- [id=${r.id}] ${r.name} (버전 ${r.allVersions.length}개)`);
        return { content: [{ type: "text", text: `${uni?.name} "${query}" 검색 결과 (${results.length}건):\n\n${lines.join("\n")}` }] };
      },
    );

    this.server.tool(
      "list_regulations",
      "대학 규정 목록을 반환합니다. university를 생략하면 지원 대학 목록을 보여줍니다.",
      {
        university: z.enum(UNIVERSITY_IDS).optional().describe("대학 ID. 생략하면 지원 대학 목록 반환"),
        includeOldVersions: z.boolean().optional().default(false).describe("true이면 구버전 포함"),
      },
      async ({ university, includeOldVersions }) => {
        if (!university) {
          const lines = Object.values(UNIVERSITIES).map((u) => `- ${u.id}: ${u.name}`);
          return { content: [{ type: "text", text: `지원 대학 목록 (${lines.length}개):\n\n${lines.join("\n")}` }] };
        }
        const uni = UNIVERSITIES[university];
        const results = listRegulations(university, !includeOldVersions);
        const lines = results.map((r) => `- [${r.id}] ${r.name}`);
        return { content: [{ type: "text", text: `${uni?.name} 규정 목록 (${results.length}건):\n\n${lines.join("\n")}` }] };
      },
    );

    this.server.tool(
      "get_regulation",
      "특정 규정의 전문을 조회합니다.",
      {
        university: z.enum(UNIVERSITY_IDS).describe("대학 ID"),
        id: z.number().int().positive().describe("규정의 SEQ_HISTORY ID"),
      },
      async ({ university, id }) => {
        const html = await fetchRegulationHtml(university, id);
        if (!html) return { content: [{ type: "text", text: `규정을 찾을 수 없습니다 (${university}, id=${id})` }], isError: true };
        return { content: [{ type: "text", text: toMarkdown(parseRegulation(html)) }] };
      },
    );

    this.server.tool(
      "get_regulation_article",
      "특정 규정의 특정 조항만 조회합니다.",
      {
        university: z.enum(UNIVERSITY_IDS).describe("대학 ID"),
        id: z.number().int().positive().describe("규정의 SEQ_HISTORY ID"),
        article: z.string().describe("조항 번호 (예: '제5조', '5')"),
      },
      async ({ university, id, article }) => {
        const html = await fetchRegulationHtml(university, id);
        if (!html) return { content: [{ type: "text", text: `규정을 찾을 수 없습니다 (${university}, id=${id})` }], isError: true };
        const parsed = parseRegulation(html);
        const found = findArticle(parsed, article);
        if (!found) {
          const available = parsed.chapters.flatMap((c) => c.articles.map((a) => `- ${a.title}`)).join("\n");
          return { content: [{ type: "text", text: `"${article}" 조항을 찾을 수 없습니다.\n\n사용 가능한 조항:\n${available}` }], isError: true };
        }
        return { content: [{ type: "text", text: `# ${parsed.name}\n\n## ${found.title}\n\n${found.content.join("\n")}` }] };
      },
    );
  }
}

export default HansungRegulationMCP.serve("/mcp");
