/**
 * Fetch regulation HTML by university and SEQ_HISTORY id.
 */
export declare function fetchRegulationHtml(universityId: string, seqHistory: number): Promise<string | null>;
/**
 * Quickly check if a SEQ_HISTORY has content.
 */
export declare function probeRegulationName(universityId: string, seqHistory: number): Promise<string | null>;
