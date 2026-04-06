import { z } from "zod";
import { UNIVERSITIES } from "../lib/universities.js";
const universityIds = Object.keys(UNIVERSITIES);
export const searchInputSchema = {
    university: z
        .enum(universityIds)
        .describe("대학 ID (예: 'hansung', 'kaist', 'korea', 'khu')"),
    query: z.string().describe("검색 키워드 (예: '학칙', '장학금', '교원임용')"),
};
export function handleSearch(indexManager) {
    return async ({ university, query }) => {
        const uni = UNIVERSITIES[university];
        if (!uni) {
            return {
                content: [{ type: "text", text: `알 수 없는 대학 ID: ${university}` }],
                isError: true,
            };
        }
        const results = indexManager.search(university, query);
        if (results.length === 0) {
            return {
                content: [
                    {
                        type: "text",
                        text: `${uni.name}에서 "${query}"에 대한 검색 결과가 없습니다.`,
                    },
                ],
            };
        }
        const lines = results.map((r) => `- [id=${r.id}] ${r.name} (버전 ${r.allVersions.length}개)`);
        return {
            content: [
                {
                    type: "text",
                    text: `${uni.name} "${query}" 검색 결과 (${results.length}건):\n\n${lines.join("\n")}\n\n규정 내용을 보려면 get_regulation 도구에 university="${university}"와 id를 전달하세요.`,
                },
            ],
        };
    };
}
