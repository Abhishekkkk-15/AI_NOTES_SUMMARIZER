import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { PromptTemplate } from "@langchain/core/prompts";
import { RunnableSequence } from "@langchain/core/runnables";
import { AIMessage } from "@langchain/core/messages";

interface SummarizeRequest {
  text: string;
  summaryLength: number;
  summaryType: string;
  userId: string;
  noteId: string;
}

interface ChatRequest {
  chat: string;
  userId: string;
  noteId: string;
}

interface SummaryResponse {
  summary: string;
  keyPoints: string[];
}

interface ChatResponse {
  answer: string;
}

export class AIService {
  private model: ChatGoogleGenerativeAI;
  private documents: Map<string, string> = new Map();
  private chatHistory: Map<string, string[]> = new Map();

  constructor() {
    // You'll need to set your API key in environment variables
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    
    if (!apiKey) {
      console.warn("VITE_GEMINI_API_KEY not found. AI features will not work.");
    }

    this.model = new ChatGoogleGenerativeAI({
      model: "gemini-1.5-pro",
      apiKey: apiKey,
    });
  }

  async summarizeDocument(request: SummarizeRequest): Promise<SummaryResponse> {
    try {
      // Store document for later chat use
      this.documents.set(request.noteId, request.text);

      const prompt = PromptTemplate.fromTemplate(`
        You are an expert summarizer. 
        
        Summarize the following note in **{percent}%** of its original length.
        Style: {style}.
        
        Also, extract and return the **main key points** separately.
        Return your response in JSON format with "summary" and "key_points" fields.
        
        Note:
        {note}
      `);

      const chain = RunnableSequence.from([prompt, this.model]);
      const response = await chain.invoke({
        note: request.text,
        percent: request.summaryLength,
        style: request.summaryType,
      });

      return this.extractSummaryAndKeyPoints(response);
    } catch (error) {
      console.error("Error in summarizeDocument:", error);
      throw new Error("Failed to summarize document");
    }
  }

  async chatWithDocument(request: ChatRequest): Promise<ChatResponse> {
    try {
      const document = this.documents.get(request.noteId);
      if (!document) {
        throw new Error("Document not found. Please upload and summarize a document first.");
      }

      // Get or initialize chat history
      const historyKey = `${request.userId}-${request.noteId}`;
      const history = this.chatHistory.get(historyKey) || [];

      // Add user message to history
      history.push(`User: ${request.chat}`);

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

        Return your response in JSON format like this:
        {{
          "answer": "Your conversational response to the user's question"
        }}
      `);

      const chain = RunnableSequence.from([prompt, this.model]);
      const response = await chain.invoke({
        note: document,
        chat_history: history.join('\n'),
        question: request.chat,
      });

      const result = this.extractChatResponse(response);

      // Add AI response to history
      history.push(`AI: ${result.answer}`);
      
      // Keep only last 10 exchanges to prevent context from getting too long
      if (history.length > 20) {
        history.splice(0, history.length - 20);
      }
      
      this.chatHistory.set(historyKey, history);

      return result;
    } catch (error) {
      console.error("Error in chatWithDocument:", error);
      throw new Error("Failed to chat with document");
    }
  }

  private extractSummaryAndKeyPoints(message: AIMessage): SummaryResponse {
    if (!message.content) return { summary: "", keyPoints: [] };

    let raw = typeof message.content === "string" ? message.content : "";
    raw = raw.replace(/```json|```/g, "").trim();

    try {
      const parsed = JSON.parse(raw);
      return {
        summary: parsed.summary ?? "",
        keyPoints: parsed.key_points ?? [],
      };
    } catch (e) {
      console.error("Failed to parse summary response:", e);
      // Fallback: return the raw content as summary
      return {
        summary: raw,
        keyPoints: [],
      };
    }
  }

  private extractChatResponse(message: AIMessage): ChatResponse {
    if (!message.content) return { answer: "I'm sorry, I couldn't generate a response." };

    let raw = typeof message.content === "string" ? message.content : "";
    raw = raw.replace(/```json|```/g, "").trim();

    try {
      const parsed = JSON.parse(raw);
      return {
        answer: parsed.answer ?? raw,
      };
    } catch (e) {
      console.error("Failed to parse chat response:", e);
      // Fallback: return the raw content as answer
      return {
        answer: raw,
      };
    }
  }
}