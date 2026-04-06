import { z } from "zod";
import type { IndexManager } from "../lib/index-manager.js";
export declare const searchInputSchema: {
    university: z.ZodEnum<[string, ...string[]]>;
    query: z.ZodString;
};
export declare function handleSearch(indexManager: IndexManager): ({ university, query }: {
    university: string;
    query: string;
}) => Promise<{
    content: {
        type: "text";
        text: string;
    }[];
    isError: boolean;
} | {
    content: {
        type: "text";
        text: string;
    }[];
    isError?: undefined;
}>;
