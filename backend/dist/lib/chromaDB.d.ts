import { Chroma } from "@langchain/community/vectorstores/chroma";
export declare function initChroma(collectionName: string): Promise<Chroma>;
export declare function addDocuments(id: string, text: string, user_id: string, collectionName: string): Promise<void>;
export declare function similaritySearch(id: string, query: string, user_id: string, collectionName: string): Promise<import("@langchain/core/documents").DocumentInterface<Record<string, any>>[]>;
//# sourceMappingURL=chromaDB.d.ts.map