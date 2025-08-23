// import { ChromaClient, type EmbeddingFunction } from "chromadb";
// import { GoogleGenAI } from "@google/genai";
// import { config } from "dotenv";
// config()
export {};
// const ai = new GoogleGenAI({});
// async function generateEmbeddings(data: string[]) {
//     const response = await ai.models.embedContent({
//         model: 'gemini-embedding-001',
//         contents: data,
//     });
//     return response.embeddings
// }
// const chromaClient = new ChromaClient({
//     host: "localhost",
//     port: 8000
// });
// export class GeminiEmbedding implements EmbeddingFunction {
//     async generate(texts: string[]): Promise<number[][]> {
//         const response = await await ai.models.embedContent({
//             model: 'gemini-embedding-001',
//             contents: texts,
//         });
//         if (!response.embeddings) {
//             throw new Error("No embeddings returned from Gemini API.");
//         }
//         return response.embeddings.map(embedding => embedding.values ?? []); 
//     }
// }
// async function init() {
//     const embedder = new GeminiEmbedding();
//     const collection = await chromaClient.getOrCreateCollection({
//         name:"notess",
//         embeddingFunction:embedder
//     })
//     return collection
// }
// async function addMessage(id:string,text:string) {
//     const collection = await init()
//     await collection.add({
//         ids:[id],
//         documents:[text]
//     })
//     console.log(`Added text ${text} `)
// }
// async function getSimmilarMessage(text:string,limit:number) {
//     const collection = await init()
//     const result = await collection.query({
//         queryTexts:[text],
//         nResults:limit
//     })
//     console.log(result.documents[0])
//     return result.documents[0]
// }
// async function main() {
//     await addMessage("1","Hello, how can i help you")
//     await addMessage("2","Sure, i can book you appoiment")
//     await addMessage("3","The weather is sunny today")
//     await getSimmilarMessage("what's weather today",2)
// }
// main()
//# sourceMappingURL=chroma.js.map