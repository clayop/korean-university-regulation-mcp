import { z } from "zod";
import type { IndexManager } from "../lib/index-manager.js";
import { UNIVERSITIES, getUniversityList } from "../lib/universities.js";

const universityIds = Object.keys(UNIVERSITIES);

export const listInputSchema = {
  university: z
    .enum(universityIds as [string, ...string[]])
    .optional()
    .describe("대학 ID. 생략하면 지원 대학 목록을 반환합니다."),
  includeOldVersions: z
    .boolean()
    .optional()
    .default(false)
    .describe("true이면 구버전 포함, false이면 최신 버전만 표시"),
};

export function handleList(indexManager: IndexManager) {
  return async ({
    university,
    includeOldVersions,
  }: {
    university?: string;
    includeOldVersions?: boolean;
  }) => {
    // If no university specified, list supported universities
    if (!university) {
      const uniList = getUniversityList();
      const lines = uniList.map((u) => `- ${u.id}: ${u.name}`);
      return {
        content: [
          {
            type: "text" as const,
            text: `지원 대학 목록 (${uniList.length}개):\n\n${lines.join("\n")}\n\n특정 대학의 규정을 보려면 university 파라미터에 대학 ID를 전달하세요.`,
          },
        ],
      };
    }

    const uni = UNIVERSITIES[university];
    if (!uni) {
      return {
        content: [{ type: "text" as const, text: `알 수 없는 대학 ID: ${university}` }],
        isError: true,
      };
    }

    const results = indexManager.list(university, !includeOldVersions);
    const stats = indexManager.getStats(university);
    const statusLine = stats.scanning ? "\n(인덱스 업데이트 스캔 진행 중...)" : "";

    const lines = results.map((r) => `- [${r.id}] ${r.name}`);

    return {
      content: [
        {
          type: "text" as const,
          text: `${uni.name} 규정 목록 (${results.length}건):${statusLine}\n\n${lines.join("\n")}`,
        },
      ],
    };
  };
}
