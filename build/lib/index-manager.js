import { readFileSync, existsSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { probeRegulationName } from "./fetcher.js";
import { UNIVERSITIES } from "./universities.js";
const __dirname = dirname(fileURLToPath(import.meta.url));
export class IndexManager {
    indexes = new Map();
    maxScannedIds = new Map();
    scanning = new Set();
    scanComplete = new Set();
    constructor() {
        this.loadAllBundledIndexes();
    }
    loadAllBundledIndexes() {
        for (const uniId of Object.keys(UNIVERSITIES)) {
            this.loadBundledIndex(uniId);
        }
    }
    loadBundledIndex(universityId) {
        try {
            const dataPath = join(__dirname, "..", "..", "data", `${universityId}.json`);
            if (!existsSync(dataPath)) {
                this.indexes.set(universityId, []);
                this.maxScannedIds.set(universityId, 0);
                return;
            }
            const raw = readFileSync(dataPath, "utf-8");
            const index = JSON.parse(raw);
            this.indexes.set(universityId, index.regulations);
            this.maxScannedIds.set(universityId, index.maxScannedId);
            console.error(`[index] ${universityId}: Loaded ${index.regulations.length} regulations`);
        }
        catch {
            this.indexes.set(universityId, []);
            this.maxScannedIds.set(universityId, 0);
        }
    }
    /**
     * Start background delta scan for a specific university.
     */
    startDeltaScan(universityId) {
        if (this.scanning.has(universityId))
            return;
        this.scanning.add(universityId);
        const maxId = this.maxScannedIds.get(universityId) || 0;
        console.error(`[index] ${universityId}: Starting delta scan from SEQ_HISTORY=${maxId + 1}...`);
        this.runDeltaScan(universityId).catch((err) => {
            console.error(`[index] ${universityId}: Delta scan error:`, err);
            this.scanning.delete(universityId);
        });
    }
    /**
     * Start delta scans for all universities.
     */
    startAllDeltaScans() {
        for (const uniId of Object.keys(UNIVERSITIES)) {
            this.startDeltaScan(uniId);
        }
    }
    async runDeltaScan(universityId) {
        let consecutiveEmpty = 0;
        const MAX_CONSECUTIVE_EMPTY = 50;
        let newFound = 0;
        let id = (this.maxScannedIds.get(universityId) || 0) + 1;
        while (consecutiveEmpty < MAX_CONSECUTIVE_EMPTY) {
            try {
                const name = await probeRegulationName(universityId, id);
                if (name) {
                    consecutiveEmpty = 0;
                    this.mergeEntry(universityId, id, name);
                    newFound++;
                }
                else {
                    consecutiveEmpty++;
                }
            }
            catch {
                consecutiveEmpty++;
            }
            id++;
            await new Promise((resolve) => setTimeout(resolve, 100));
        }
        this.maxScannedIds.set(universityId, id - MAX_CONSECUTIVE_EMPTY - 1);
        this.scanning.delete(universityId);
        this.scanComplete.add(universityId);
        console.error(`[index] ${universityId}: Delta scan complete. +${newFound} new. Total: ${this.indexes.get(universityId)?.length}`);
    }
    mergeEntry(universityId, seqHistory, name) {
        const regulations = this.indexes.get(universityId) || [];
        const existing = regulations.find((r) => r.name === name);
        if (existing) {
            if (!existing.allVersions.includes(seqHistory)) {
                existing.allVersions.push(seqHistory);
                existing.allVersions.sort((a, b) => a - b);
            }
            if (seqHistory > existing.id) {
                existing.id = seqHistory;
            }
        }
        else {
            regulations.push({
                id: seqHistory,
                name,
                allVersions: [seqHistory],
                isLatest: true,
            });
            this.indexes.set(universityId, regulations);
        }
    }
    search(universityId, query) {
        const regulations = this.indexes.get(universityId) || [];
        const q = query.toLowerCase().replace(/\s+/g, "");
        return regulations.filter((r) => r.name.toLowerCase().replace(/\s+/g, "").includes(q));
    }
    list(universityId, latestOnly = true) {
        const regulations = this.indexes.get(universityId) || [];
        if (latestOnly) {
            return regulations.filter((r) => r.isLatest);
        }
        return regulations;
    }
    findById(universityId, id) {
        const regulations = this.indexes.get(universityId) || [];
        const direct = regulations.find((r) => r.id === id);
        if (direct)
            return direct;
        for (const reg of regulations) {
            if (reg.allVersions.includes(id)) {
                return {
                    ...reg,
                    id,
                    isLatest: id === reg.allVersions[reg.allVersions.length - 1],
                };
            }
        }
        return undefined;
    }
    getStats(universityId) {
        return {
            total: (this.indexes.get(universityId) || []).length,
            maxScannedId: this.maxScannedIds.get(universityId) || 0,
            scanning: this.scanning.has(universityId),
        };
    }
}
