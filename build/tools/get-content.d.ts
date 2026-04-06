import { z } from "zod";
export declare const getContentInputSchema: {
    university: z.ZodEnum<[string, ...string[]]>;
    id: z.ZodNumber;
};
export declare function handleGetContent(): ({ university, id }: {
    university: string;
    id: number;
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
