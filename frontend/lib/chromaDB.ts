
// lib/chromaGemini.ts
import { Chroma } from "@langchain/community/vectorstores/chroma";
import { Document } from "@langchain/core/documents";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";

const embeddings = new GoogleGenerativeAIEmbeddings({
  apiKey: process.env.GEMINI_API_KEY!,
  model: "embedding-001",
});

export async function initChroma(collectionName: string) {
  return new Chroma(embeddings, {
    collectionName,
    url: "http://localhost:8000",

  });
}

export async function addDocuments(id: string, text: string, user_id: string, collectionName: string) {
  const vectorStore = await initChroma(collectionName);

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
  });

  // Wrap text into a Document first
  const docs = [new Document({ pageContent: text, metadata: { user_id, note_id: id } })];

  // Actually split it into chunks
  const splitDocs = await splitter.splitDocuments(docs);

  // Add all chunks to the vector store
  await vectorStore.addDocuments(splitDocs);
}

export async function similaritySearch(id: string, query: string, user_id: string, collectionName: string) {
  const vectorStore = await initChroma(collectionName);
  if (query.length == 0) {
    const results = await vectorStore.similaritySearch('dummy', 2, {
      note_id: { $eq: id },

    });
    console.log("search result for chat : ", results)
    return results;
  }
  const results = await vectorStore.similaritySearch(query, 2, {

    note_id: { $eq: id },


  });
  console.log("search result : ", results)
  return results;
}
