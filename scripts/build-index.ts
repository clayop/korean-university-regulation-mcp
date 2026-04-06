/**
 * Build regulation index for one or all universities.
 * Usage:
 *   npx tsx scripts/build-index.ts           # build all
 *   npx tsx scripts/build-index.ts kaist      # build one
 */

// Some university sites have invalid SSL certificates
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

import { writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

interface UniversityConfig {
  id: string;
  name: string;
  domain: string;
  protocol: "http" | "https";
  maxScanId: number;
}

const UNIVERSITIES: Record<string, UniversityConfig> = {
  hansung: { id: "hansung", name: "한성대학교", domain: "rule.hansung.ac.kr", protocol: "https", maxScanId: 1700 },
  kaist: { id: "kaist", name: "KAIST", domain: "rule.kaist.ac.kr", protocol: "https", maxScanId: 3500 },
  korea: { id: "korea", name: "고려대학교", domain: "policies.korea.ac.kr", protocol: "https", maxScanId: 2500 },
  khu: { id: "khu", name: "경희대학교", domain: "rule.khu.ac.kr", protocol: "https", maxScanId: 2500 },
  kookmin: { id: "kookmin", name: "국민대학교", domain: "rule.kookmin.ac.kr", protocol: "https", maxScanId: 2500 },
  kwangwoon: { id: "kwangwoon", name: "광운대학교", domain: "rule.kwangwoon.ac.kr", protocol: "http", maxScanId: 1000 },
  swu: { id: "swu", name: "서울여자대학교", domain: "rule.swu.ac.kr", protocol: "https", maxScanId: 2000 },
  inje: { id: "inje", name: "인제대학교", domain: "rule.inje.ac.kr", protocol: "https", maxScanId: 2000 },
  mokwon: { id: "mokwon", name: "목원대학교", domain: "rule.mokwon.ac.kr", protocol: "https", maxScanId: 2000 },
  kyonggi: { id: "kyonggi", name: "경기대학교", domain: "rule.kyonggi.ac.kr", protocol: "http", maxScanId: 1000 },
  duksung: { id: "duksung", name: "덕성여자대학교", domain: "rule.duksung.ac.kr", protocol: "https", maxScanId: 1500 },
  koreatech: { id: "koreatech", name: "한국기술교육대학교", domain: "rule.koreatech.ac.kr", protocol: "https", maxScanId: 1000 },
  konyang: { id: "konyang", name: "건양대학교", domain: "rule.konyang.ac.kr", protocol: "https", maxScanId: 2000 },
  konkuk: { id: "konkuk", name: "건국대학교", domain: "rule.konkuk.ac.kr", protocol: "https", maxScanId: 1000 },
};

const CONCURRENCY = 5;
const DELAY_MS = 100;

async function probeName(uni: UniversityConfig, seqHistory: number): Promise<string | null> {
  try {
    const url = `${uni.protocol}://${uni.domain}/lmxsrv/law/lawFullContent.do?SEQ_HISTORY=${seqHistory}`;
    const res = await fetch(url, {
      headers: { "User-Agent": "korean-university-regulation-mcp-indexer/0.2.0" },
    });
    if (!res.ok) return null;
    const html = await res.text();
    const match = html.match(/class="lawname"[^>]*?>([^<]+)</);
    if (!match) return null;
    return match[1].trim().replace(/\s+/g, " ");
  } catch {
    return null;
  }
}

async function buildIndex(uniId: string) {
  const uni = UNIVERSITIES[uniId];
  if (!uni) {
    console.error(`Unknown university: ${uniId}`);
    return;
  }

  console.log(`\n=== Building index for ${uni.name} (${uniId}) ===`);
  console.log(`Scanning SEQ_HISTORY 1 to ${uni.maxScanId}...`);

  const byName = new Map<string, number[]>();
  let scanned = 0;

  for (let start = 1; start <= uni.maxScanId; start += CONCURRENCY) {
    const batch = Array.from(
      { length: Math.min(CONCURRENCY, uni.maxScanId - start + 1) },
      (_, i) => start + i,
    );

    const results = await Promise.all(
      batch.map(async (id) => ({ id, name: await probeName(uni, id) })),
    );

    for (const { id, name } of results) {
      if (name) {
        if (!byName.has(name)) byName.set(name, []);
        byName.get(name)!.push(id);
      }
    }

    scanned += batch.length;
    if (scanned % 100 === 0) {
      console.log(`  ${uniId}: ${scanned}/${uni.maxScanId} (${byName.size} unique)`);
    }

    await new Promise((resolve) => setTimeout(resolve, DELAY_MS));
  }

  const regulations = Array.from(byName.entries()).map(([name, versions]) => {
    versions.sort((a, b) => a - b);
    return { id: versions[versions.length - 1], name, allVersions: versions, isLatest: true };
  }).sort((a, b) => b.id - a.id);

  const index = {
    lastUpdated: new Date().toISOString(),
    maxScannedId: uni.maxScanId,
    totalRegulations: regulations.length,
    regulations,
  };

  const outPath = join(__dirname, "..", "data", `${uniId}.json`);
  writeFileSync(outPath, JSON.stringify(index, null, 2), "utf-8");
  console.log(`${uniId}: ${regulations.length} regulations saved to ${outPath}`);
}

async function main() {
  const target = process.argv[2];

  if (target) {
    await buildIndex(target);
  } else {
    for (const uniId of Object.keys(UNIVERSITIES)) {
      await buildIndex(uniId);
    }
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
