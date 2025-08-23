import { config } from "dotenv"
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
config()
export const model = new ChatGoogleGenerativeAI({
    model: "gemini-1.5-pro",
    apiKey: process.env.GEMINI_API_KEY,
});