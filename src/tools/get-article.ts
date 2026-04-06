import { z } from "zod";
import { fetchRegulationHtml } from "../lib/fetcher.js";
import { parseRegulation, findArticle } from "../lib/parser.js";
import { UNIVERSITIES } from "../lib/universities.js";

const universityIds = Object.keys(UNIVERSITIES);

export const getArticleInputSchema = {
  university: z
    .enum(universityIds as [string, ...string[]])
    .describe("대학 ID"),
  id: z.number().int().positive().describe("규정의 SEQ_HISTORY ID"),
  article: z.string().describe("조항 번호 (예: '제5조', '5', '제12조')"),
};

export function handleGetArticle() {
  return async ({
    university,
    id,
    article,
  }: {
    university: string;
    id: number;
    article: string;
  }) => {
    const html = await fetchRegulationHtml(university, id);

    if (!html) {
      return {
        content: [
          {
            type: "text" as const,
            text: `${UNIVERSITIES[university]?.name || university}에서 id=${id}에 해당하는 규정을 찾을 수 없습니다.`,
          },
        ],
        isError: true,
      };
    }

    const parsed = parseRegulation(html);
    const found = findArticle(parsed, article);

    if (!found) {
      return {
        content: [
          {
            type: "text" as const,
            text: `"${parsed.name}"에서 "${article}"에 해당하는 조항을 찾을 수 없습니다.\n\n사용 가능한 조항:\n${parsed.chapters
              .flatMap((c) => c.articles.map((a) => `- ${a.title}`))
              .join("\n")}`,
          },
        ],
        isError: true,
      };
    }

    const contentText = found.content.join("\n");
    return {
      content: [
        {
          type: "text" as const,
          text: `# ${parsed.name}\n\n## ${found.title}\n\n${contentText}`,
        },
      ],
    };
  };
}
