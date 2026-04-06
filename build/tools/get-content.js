import { z } from "zod";
import { fetchRegulationHtml } from "../lib/fetcher.js";
import { parseRegulation, toMarkdown } from "../lib/parser.js";
import { UNIVERSITIES } from "../lib/universities.js";
const universityIds = Object.keys(UNIVERSITIES);
export const getContentInputSchema = {
    university: z
        .enum(universityIds)
        .describe("대학 ID (예: 'hansung', 'kaist', 'korea')"),
    id: z
        .number()
        .int()
        .positive()
        .describe("규정의 SEQ_HISTORY ID (search_regulations 또는 list_regulations 결과에서 확인)"),
};
export function handleGetContent() {
    return async ({ university, id }) => {
        const html = await fetchRegulationHtml(university, id);
        if (!html) {
            return {
                content: [
                    {
                        type: "text",
                        text: `${UNIVERSITIES[university]?.name || university}에서 id=${id}에 해당하는 규정을 찾을 수 없습니다.`,
                    },
                ],
                isError: true,
            };
        }
        const parsed = parseRegulation(html);
        const markdown = toMarkdown(parsed);
        return {
            content: [{ type: "text", text: markdown }],
        };
    };
}
