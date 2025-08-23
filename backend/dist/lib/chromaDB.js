// lib/chromaGemini.ts
import { Chroma } from "@langchain/community/vectorstores/chroma";
import { Document } from "@langchain/core/documents";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { config } from "dotenv";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
config();
const embedding = new GoogleGenerativeAIEmbeddings({
    apiKey: process.env.GEMINI_API_KEY,
    model: "gemini-embedding-001",
});
export async function initChroma(collectionName) {
    return new Chroma(embedding, {
        collectionName: "notess",
        clientParams: {
            host: 'localhost',
            port: 8000,
            ssl: false,
        }
    });
}
export async function addDocuments(id, text, user_id, collectionName) {
    try {
        console.log("Init vector");
        const vectorStore = await initChroma(collectionName);
        console.log("done");
        const splitter = new RecursiveCharacterTextSplitter({
            chunkSize: 1000,
            chunkOverlap: 200,
        });
        console.log("addind ");
        // Wrap text into a Document first
        const docs = [new Document({ pageContent: text, metadata: { user_id, note_id: id } })];
        console.log("done");
        // Actually split it into chunks
        const splitDocs = await splitter.splitDocuments(docs);
        // Add all chunks to the vector store
        await vectorStore.addDocuments(splitDocs);
        console.log("done");
    }
    catch (error) {
        throw Error("Error in add document", error);
    }
}
export async function similaritySearch(id, query, user_id, collectionName) {
    try {
        const vectorStore = await initChroma(collectionName);
        if (query.length == 0) {
            const results = await vectorStore.similaritySearch('dummy', 2, {
                note_id: { $eq: id },
            });
            console.log("search result for chat : ", results);
            return results;
        }
        const results = await vectorStore.similaritySearch(query, 2, {
            note_id: { $eq: id },
        });
        console.log("search result : ", results);
        return results;
    }
    catch (err) {
        throw Error("Error in similaritySearch", err.message);
    }
}
//# sourceMappingURL=chromaDB.js.map