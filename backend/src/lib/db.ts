// lib/chromaGemini.native.ts
import { config } from "dotenv";
import { ChromaClient, type EmbeddingFunction, type Collection } from "chromadb";
import { GoogleGenAI } from "@google/genai";

config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY!;
if (!GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY is not set");
}

// Choose your model; gemini-embedding-001 or text-embedding-004
const MODEL_ID = process.env.GEMINI_EMBED_MODEL ?? "gemini-embedding-001";

/**
 * Embedding function using the new @google/genai SDK.
 */
class GeminiEmbeddingFunction implements EmbeddingFunction {
  private client = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

  async generate(texts: string[]): Promise<number[][]> {
    const embeddings: number[][] = [];

    for (const t of texts) {
      const res = await this.client.models.embedContent({
        model: MODEL_ID,
        contents: [t],
      });
      if (!res.embeddings || res.embeddings.length === 0) {
        throw new Error("No embeddings received from Gemini via @google/genai");
      }
      embeddings.push(res?.embeddings[0]?.values as number[]);
    }

    return embeddings;
  }
}

function chromaURLFromParams(opts: { host?: string; port?: number; ssl?: boolean }) {
  const host = opts.host ?? "localhost";
  const port = opts.port ?? 8000;
  const ssl = !!opts.ssl;
  const protocol = ssl ? "https" : "http";
  return `${protocol}://${host}:${port}`;
}

function splitText(text: string, { chunkSize, chunkOverlap }: { chunkSize: number; chunkOverlap: number } = { chunkSize: 1000, chunkOverlap: 200 }): string[] {
  const clean = text.replace(/\r\n/g, "\n");
  const chunks: string[] = [];
  if (chunkOverlap >= chunkSize) throw new Error("chunkOverlap must be < chunkSize");

  let start = 0;
  while (start < clean.length) {
    let end = Math.min(start + chunkSize, clean.length);
    let slice = clean.slice(start, end);
    if (end < clean.length) {
      const lastPeriod = slice.lastIndexOf(". ");
      if (lastPeriod > chunkSize * 0.6) {
        slice = slice.slice(0, lastPeriod + 1);
      }
    }
    chunks.push(slice.trim());
    start = Math.min(start + chunkSize - chunkOverlap, clean.length);
  }
  return chunks.filter(Boolean);
}

export async function initChroma(collectionName: string) {
  const host = process.env.CHROMA_HOST ?? "localhost";
  const port = Number(process.env.CHROMA_PORT ?? "8000");
  const ssl =  false;

  const client = new ChromaClient({ path: chromaURLFromParams({ host, port, ssl }) });
  const name = collectionName || "notess";

  const collection: Collection = await client.getOrCreateCollection({
    name,
    embeddingFunction: new GeminiEmbeddingFunction(),
  });

  return collection;
}

export async function addDocuments(id: string, text: string, user_id: string, collectionName: string) {
  try {
    console.log(id)
    console.log("Init vector...");
    const collection = await initChroma(collectionName);
    console.log("done.");

    console.log("splitting text...");
    const chunks = splitText(text);
    if (chunks.length === 0) return;

    console.log("adding chunks...");
    const baseId = id || cryptoRandomId(10);
    const ids = chunks.map((_, i) => `${baseId}:${i}`);
    const metadatas = chunks.map(() => ({ note_id: id }));

    await collection.add({ ids, documents: chunks, metadatas });
    console.log("done.");
  } catch (err: any) {
    throw new Error("Error in addDocuments", { cause: err });
  }
}

export async function similaritySearch(id: string, query: string, user_id: string, collectionName: string) {
  try {
    const collection = await initChroma(collectionName);
    const q = query.trim().length ? query : "dummy";

    const results = await collection.query({
      queryTexts: [q],
      nResults: 2,
      where: {
        note_id: { $eq: id },
      },
    });

    const out = (results.documents?.[0] ?? []).map((doc, i) => ({
      pageContent: doc,
      metadata: results.metadatas?.[0]?.[i] ?? {},
      id: results.ids?.[0]?.[i] ?? null,
    }));

    console.log(query.trim().length ? "search result:" : "search result for chat:", out);
    return out;
  } catch (err: any) {
    throw new Error("Error in similaritySearch", { cause: err });
  }
}

function cryptoRandomId(len = 16) {
  const A = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let s = "";
  for (let i = 0; i < len; i++) s += A[Math.floor(Math.random() * A.length)];
  return s;
}
// async function s() {
//     // await addDocuments("12","who are you","1234","notess")
//     // await addDocuments("12","whats your name","1234","notess")
//     // await addDocuments("12","i am abhishek","1234","notess")
//     await similaritySearch("12","who","1234","notess")
// }

// s()