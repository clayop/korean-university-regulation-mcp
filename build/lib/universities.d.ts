export interface UniversityConfig {
    id: string;
    name: string;
    domain: string;
    protocol: "http" | "https";
    maxScanId: number;
}
export declare const UNIVERSITIES: Record<string, UniversityConfig>;
export declare function getUniversityBaseUrl(uni: UniversityConfig): string;
export declare function getUniversityIds(): string[];
export declare function getUniversityList(): {
    id: string;
    name: string;
}[];
