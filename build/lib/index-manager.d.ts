export interface RegulationEntry {
    id: number;
    name: string;
    allVersions: number[];
    isLatest: boolean;
}
export interface RegulationIndex {
    lastUpdated: string;
    maxScannedId: number;
    totalRegulations: number;
    regulations: RegulationEntry[];
}
export declare class IndexManager {
    private indexes;
    private maxScannedIds;
    private scanning;
    private scanComplete;
    constructor();
    private loadAllBundledIndexes;
    private loadBundledIndex;
    /**
     * Start background delta scan for a specific university.
     */
    startDeltaScan(universityId: string): void;
    /**
     * Start delta scans for all universities.
     */
    startAllDeltaScans(): void;
    private runDeltaScan;
    private mergeEntry;
    search(universityId: string, query: string): RegulationEntry[];
    list(universityId: string, latestOnly?: boolean): RegulationEntry[];
    findById(universityId: string, id: number): RegulationEntry | undefined;
    getStats(universityId: string): {
        total: number;
        maxScannedId: number;
        scanning: boolean;
    };
}
