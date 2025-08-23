// controllers/chatController.ts
import {} from "express";
import { PromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";
import { model } from "../lib/model.js";
// import { addDocuments, similaritySearch } from "../lib/chromaDB";
import { extractSummaryAndKeyPoints } from "./summarizeNote.js";
import { similaritySearch } from "../lib/db.js";
export const chatWithNote = async (req, res) => {
    try {
        console.log(req.body);
        const { chat, user_id, note_id } = req.body;
        console.log("note id:", note_id);
        if (!chat) {
            return res.status(400).json({ error: "Chat is undefined" });
        }
        // Example: fetch note + history from ChromaDB
        const note = await similaritySearch(note_id, chat, user_id, "notess");
        const chat_history = await similaritySearch(note_id, "", user_id, "chat_history");
        // const note = "Dummy note content until Chroma is integrated";
        // const chat_history = "Previous conversation history here";
        const prompt = PromptTemplate.fromTemplate(`
      You are a helpful assistant that helps the user understand and interact with their uploaded notes or documents. 
 
      - Always answer based on the content of the provided note/document.  
      - If the user asks a question not related to the note, politely remind them that you can only answer from the document.  
      - Be clear, concise, and provide well-structured responses.  
 
      The conversation so far:
      {chat_history}
 
      User question:
      {question}
 
      Document/Note content:
      {note}
 
      Return your response in JSON format like this (always give answer in answer object no other object or nested object):
      {{
        "answer": "Your conversational response to the user’s question",
        "key_points": ["point1", "point2", "point3"],
        "reference": "Mention section or context from the note if available"
      }}
    `);
        const chain = RunnableSequence.from([prompt, model]);
        const response = await chain.invoke({
            note,
            chat_history,
            question: chat,
        });
        // Save chat to Chroma if needed
        // await addDocuments("123123", chat, user_id, "chat_history");
        const result = extractSummaryAndKeyPoints(response);
        return res.status(200).json({
            answer: result.answer,
            key_points: result.key_points,
        });
    }
    catch (error) {
        console.error("❌ Error in AI Chatting:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};
//# sourceMappingURL=chatWithNote.js.map