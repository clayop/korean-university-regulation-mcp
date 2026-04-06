import * as cheerio from "cheerio";

export interface RegulationContent {
  name: string;
  chapters: Chapter[];
  supplementary: string[];
}

export interface Chapter {
  title: string;
  articles: Article[];
}

export interface Article {
  title: string;
  content: string[];
}

/**
 * Extract regulation name from HTML.
 */
export function extractName(html: string): string | null {
  const $ = cheerio.load(html);
  const name = $("div.lawname").first().text().trim().replace(/\s+/g, " ");
  return name || null;
}

/**
 * Parse full regulation HTML into structured content.
 */
export function parseRegulation(html: string): RegulationContent {
  const $ = cheerio.load(html);

  const name =
    $("div.lawname").first().text().trim().replace(/\s+/g, " ") || "Unknown";

  const result: RegulationContent = { name, chapters: [], supplementary: [] };
  let curChapter: Chapter = { title: "총칙", articles: [] };
  let curArticle: Article | null = null;
  let inSupplementary = false;

  $(
    "div.chapter, table caption, td, div.none, div.hang, div.ho, div.buTitle",
  ).each((_, el) => {
    const $el = $(el);
    const tagName = (el as any).tagName as string;
    const classes = $el.attr("class") || "";

    if (classes.includes("chapter")) {
      if (curArticle) {
        curChapter.articles.push(curArticle);
        curArticle = null;
      }
      if (curChapter.articles.length > 0 || curChapter.title) {
        result.chapters.push(curChapter);
      }
      curChapter = {
        title: $el.text().trim().replace(/\s+/g, " "),
        articles: [],
      };
      inSupplementary = false;
      return;
    }

    if (classes.includes("buTitle")) {
      if (curArticle) {
        curChapter.articles.push(curArticle);
        curArticle = null;
      }
      if (curChapter.articles.length > 0 || curChapter.title) {
        result.chapters.push(curChapter);
      }
      curChapter = {
        title: $el.text().trim().replace(/\s+/g, " "),
        articles: [],
      };
      inSupplementary = true;
      return;
    }

    if (tagName === "td") {
      const text = $el.text().trim();
      if (/제\s*\d+\s*조/.test(text) || /제\s*\d+\s*조의\d+/.test(text)) {
        if (curArticle) {
          curChapter.articles.push(curArticle);
        }
        curArticle = {
          title: text.replace(/\s+/g, " ").trim(),
          content: [],
        };
      }
      return;
    }

    if (
      classes.includes("none") ||
      classes.includes("hang") ||
      classes.includes("ho")
    ) {
      const text = $el
        .find("span")
        .map((_, span) => $(span).text().trim())
        .get()
        .join("");

      if (!text) return;

      const level = classes.includes("ho")
        ? 2
        : classes.includes("hang")
          ? 1
          : 0;
      const indent = "  ".repeat(level);
      const formatted = `${indent}${text}`;

      if (inSupplementary) {
        result.supplementary.push(formatted);
      } else if (curArticle) {
        curArticle.content.push(formatted);
      }
      return;
    }
  });

  if (curArticle) {
    curChapter.articles.push(curArticle);
  }
  if (curChapter.articles.length > 0 || curChapter.title) {
    result.chapters.push(curChapter);
  }

  return result;
}

/**
 * Convert parsed regulation to Markdown text.
 */
export function toMarkdown(reg: RegulationContent): string {
  const lines: string[] = [];
  lines.push(`# ${reg.name}`);
  lines.push("");

  for (const chapter of reg.chapters) {
    if (chapter.title) {
      lines.push(`## ${chapter.title}`);
      lines.push("");
    }

    for (const article of chapter.articles) {
      lines.push(`### ${article.title}`);
      lines.push("");
      for (const content of article.content) {
        lines.push(content);
      }
      lines.push("");
    }
  }

  if (reg.supplementary.length > 0) {
    lines.push("## 부칙");
    lines.push("");
    for (const s of reg.supplementary) {
      lines.push(s);
    }
    lines.push("");
  }

  return lines.join("\n");
}

/**
 * Find a specific article by number (e.g., "제5조", "5") from parsed content.
 */
export function findArticle(
  reg: RegulationContent,
  articleQuery: string,
): Article | null {
  const numMatch = articleQuery.match(/(\d+)/);
  if (!numMatch) return null;
  const articleNum = numMatch[1];

  for (const chapter of reg.chapters) {
    for (const article of chapter.articles) {
      const titleNumMatch = article.title.match(/제\s*(\d+)\s*조/);
      if (titleNumMatch && titleNumMatch[1] === articleNum) {
        return article;
      }
    }
  }
  return null;
}
