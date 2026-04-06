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
export declare function extractName(html: string): string | null;
/**
 * Parse full regulation HTML into structured content.
 */
export declare function parseRegulation(html: string): RegulationContent;
/**
 * Convert parsed regulation to Markdown text.
 */
export declare function toMarkdown(reg: RegulationContent): string;
/**
 * Find a specific article by number (e.g., "제5조", "5") from parsed content.
 */
export declare function findArticle(reg: RegulationContent, articleQuery: string): Article | null;
