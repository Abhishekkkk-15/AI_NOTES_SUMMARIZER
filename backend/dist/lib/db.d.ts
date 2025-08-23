import { type Collection } from "chromadb";
export declare function initChroma(collectionName: string): Promise<Collection>;
export declare function addDocuments(id: string, text: string, user_id: string, collectionName: string): Promise<void>;
export declare function similaritySearch(id: string, query: string, user_id: string, collectionName: string): Promise<{
    pageContent: string | null;
    metadata: import("chromadb").Metadata;
    id: string | null;
}[]>;
//# sourceMappingURL=db.d.ts.map