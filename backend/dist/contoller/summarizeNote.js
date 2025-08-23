// controllers/summaryController.ts
import {} from "express";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { PromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";
import { AIMessage } from "@langchain/core/messages";
import { config } from "dotenv";
import mammoth from "mammoth"; // for .docx
import pdf from "pdf-parse";
import { addDocuments } from "../lib/db.js";
import { model } from "../lib/model.js";
import { handleFileType } from "../lib/handleFileType.js";
config();
export const summarizeNote = async (req, res) => {
    try {
        console.log("📩 Request received for summarization");
        const file = req.file; // multer adds this
        const { summaryLength, summaryType, user_id, note_id } = req.body;
        console.log("note_id : ", note_id);
        if (!file) {
            return res.status(400).json({ error: "File not provided" });
        }
        // 👇 Replace this with your own file reader util
        const textContent = await handleFileType(req.file);
        if (!textContent) {
            return res.status(500).json({ error: "Error while reading file content" });
        }
        // console.log("📄 Extracted content:", textContent.slice(0, 200));
        const prompt = PromptTemplate.fromTemplate(`
      You are an expert summarizer. 
      
      Summarize the following note in **{percent}%** of its original length.
      Style: {style}.
      
      Also, extract and return the **main key points** separately.
      And i want both key points and summary in separate JSON object.
      
      Note:
      {note}
    `);
        const chain = RunnableSequence.from([prompt, model]);
        const response = await chain.invoke({
            note: textContent,
            percent: summaryLength,
            style: summaryType,
        });
        const result = extractSummaryAndKeyPoints(response);
        // Save to chroma if needed
        await addDocuments(note_id, textContent, user_id, "notess");
        return res.status(200).json({
            summary: result.summary,
            keyPoints: result.key_points,
            answer: result.answer,
        });
    }
    catch (error) {
        console.error("❌ Error summarizing:", error);
        return res.status(500).json({ error: "Failed to summarize" });
    }
};
export function extractSummaryAndKeyPoints(message) {
    if (!message.content)
        return { summary: "", key_points: [] };
    let raw = typeof message.content === "string" ? message.content : "";
    raw = raw.replace(/```json|```/g, "").trim();
    try {
        const parsed = JSON.parse(raw);
        return {
            summary: parsed.summary ?? "",
            key_points: parsed.key_points ?? [],
            answer: parsed.answer || "",
        };
    }
    catch (e) {
        console.error("Failed to parse AIMessage content:", e);
        return { summary: "", key_points: [], answer: "" };
    }
}
//# sourceMappingURL=summarizeNote.js.map