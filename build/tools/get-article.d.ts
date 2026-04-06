import { z } from "zod";
export declare const getArticleInputSchema: {
    university: z.ZodEnum<[string, ...string[]]>;
    id: z.ZodNumber;
    article: z.ZodString;
};
export declare function handleGetArticle(): ({ university, id, article, }: {
    university: string;
    id: number;
    article: string;
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
