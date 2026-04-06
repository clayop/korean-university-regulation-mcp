import { z } from "zod";
import type { IndexManager } from "../lib/index-manager.js";
export declare const listInputSchema: {
    university: z.ZodOptional<z.ZodEnum<[string, ...string[]]>>;
    includeOldVersions: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
};
export declare function handleList(indexManager: IndexManager): ({ university, includeOldVersions, }: {
    university?: string;
    includeOldVersions?: boolean;
}) => Promise<{
    content: {
        type: "text";
        text: string;
    }[];
    isError?: undefined;
} | {
    content: {
        type: "text";
        text: string;
    }[];
    isError: boolean;
}>;
