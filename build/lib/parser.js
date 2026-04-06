import * as cheerio from "cheerio";
/**
 * Extract regulation name from HTML.
 */
export function extractName(html) {
    const $ = cheerio.load(html);
    const name = $("div.lawname").first().text().trim().replace(/\s+/g, " ");
    return name || null;
}
/**
 * Parse full regulation HTML into structured content.
 */
export function parseRegulation(html) {
    const $ = cheerio.load(html);
    const name = $("div.lawname").first().text().trim().replace(/\s+/g, " ") || "Unknown";
    const chapters = [];
    const supplementary = [];
    let currentChapter = { title: "", articles: [] };
    let inSupplementary = false;
    // Walk through the main content area
    // The structure is: lawname → then chapters with articles inside
    // Each chapter is div.chapter, each article is a table with caption "조항"
    // Article content follows in div.none, div.hang, div.ho
    const contentArea = $("body");
    // Collect all top-level structural elements
    const elements = [];
    contentArea.find("div.chapter, div.lawname").each((_, el) => {
        const $el = $(el);
        if ($el.hasClass("chapter")) {
            elements.push({
                type: "chapter",
                text: $el.text().trim().replace(/\s+/g, " "),
            });
        }
    });
    // Strategy: iterate through all content blocks in order
    // Find chapters, articles, and content divs
    const allChapters = $("div.chapter");
    const allArticleTables = $('table:has(caption:contains("조항"))');
    // Simple approach: parse the entire content linearly
    const result = { name, chapters: [], supplementary: [] };
    let curChapter = { title: "총칙", articles: [] };
    let curArticle = null;
    // Process all relevant divs in document order
    $("div.chapter, table caption, td, div.none, div.hang, div.ho, div.buTitle")
        .each((_, el) => {
        const $el = $(el);
        const tagName = el.tagName;
        const classes = $el.attr("class") || "";
        if (classes.includes("chapter")) {
            // New chapter
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
            // 부칙 (supplementary provisions)
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
            // Check if this is an article title (e.g., "제 1 조 (목적)")
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
        // Content divs
        if (classes.includes("none") ||
            classes.includes("hang") ||
            classes.includes("ho")) {
            const text = $el
                .find("span")
                .map((_, span) => $(span).text().trim())
                .get()
                .join("");
            if (!text)
                return;
            const level = classes.includes("ho")
                ? 2
                : classes.includes("hang")
                    ? 1
                    : 0;
            const indent = "  ".repeat(level);
            const formatted = `${indent}${text}`;
            if (inSupplementary) {
                result.supplementary.push(formatted);
            }
            else if (curArticle) {
                curArticle.content.push(formatted);
            }
            return;
        }
    });
    // Flush remaining
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
export function toMarkdown(reg) {
    const lines = [];
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
export function findArticle(reg, articleQuery) {
    // Normalize query: extract just the number
    const numMatch = articleQuery.match(/(\d+)/);
    if (!numMatch)
        return null;
    const articleNum = numMatch[1];
    for (const chapter of reg.chapters) {
        for (const article of chapter.articles) {
            // Match "제 5 조" or "제5조" etc.
            const titleNumMatch = article.title.match(/제\s*(\d+)\s*조/);
            if (titleNumMatch && titleNumMatch[1] === articleNum) {
                return article;
            }
        }
    }
    return null;
}
