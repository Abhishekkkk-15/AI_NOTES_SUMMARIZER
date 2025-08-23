import { type Response } from "express";
import { AIMessage } from "@langchain/core/messages";
export declare const summarizeNote: (req: any, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare function extractSummaryAndKeyPoints(message: AIMessage): {
    summary: string;
    key_points: never[];
    answer?: never;
} | {
    summary: any;
    key_points: any;
    answer: any;
};
//# sourceMappingURL=summarizeNote.d.ts.map