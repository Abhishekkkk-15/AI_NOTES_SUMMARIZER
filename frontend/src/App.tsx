import React, { useState, useRef, useEffect } from "react";
import {
  Upload,
  FileText,
  MessageCircle,
  Send,
  Bot,
  User,
  Trash2,
  Settings,
  Sparkles,
  File,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { v4 as uuidv4 } from "uuid";
import mammoth from "mammoth";
import { AIService } from "./services/aiService";
import axios from "axios";

interface UploadedFile {
  name: string;
  size: number;
  type: string;
  content?: string;
  pages?: number;
  id?: string;
  file?: File;
}

interface SummaryResult {
  summary: string;
  keyPoints: string[];
  wordCount: number;
  originalWordCount: number;
  readingTime: number;
}

interface ChatMessage {
  id: string;
  type: "user" | "ai";
  content: string;
  timestamp: Date;
}

export default function AIDocumentSummarizer() {
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [summaryResult, setSummaryResult] = useState<SummaryResult | null>(
    null
  );
  const [summaryLength, setSummaryLength] = useState([50]);
  const [summaryType, setSummaryType] = useState("comprehensive");
  const [isDragOver, setIsDragOver] = useState(false);
  const [activeTab, setActiveTab] = useState("upload");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [noteId, setNoteId] = useState<string | null>(null);
  const [guestId, setGuestId] = useState<string | null>(null);

  const aiService = new AIService();

  useEffect(() => {
    let id = localStorage.getItem("guest_id");
    if (!id) {
      id = uuidv4();
      localStorage.setItem("guest_id", id);
    }
    setGuestId(id);
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const handleFileUpload = async (file: File) => {
    if (!file) return;
    const noteID = uuidv4();
    setNoteId((prev) => noteID);
    setUploadedFile({
      name: file.name,
      size: file.size,
      type: file.type,
      file: file,
    });
    setActiveTab("summary");
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = e.dataTransfer.files;
    if (files[0]) {
      handleFileUpload(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const simulateProcessing = async (e: React.FormEvent) => {
    e.preventDefault();
    e.preventDefault();

    const formData = new FormData();
    if (!uploadedFile) return;

    if (uploadedFile) {
      formData.append("file", uploadedFile?.file as File);
      formData.append("name", uploadedFile.name);
      formData.append("type", uploadedFile.type);
      formData.append("user_id", guestId as string);
      formData.append("summaryLength", summaryLength.toLocaleString());
      formData.append("summartType", summaryType);
      formData.append("note_id", noteId as string);
    }

    console.log(noteId);

    setIsProcessing(true);
    setProgress(0);

    let interval: NodeJS.Timeout | null = null;

    try {
      // Start progress simulation
      interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 95) return 95;
          return prev + 5;
        });
      }, 200);

      // Call AI service
      const result = await axios.post(
        "http://localhost:3000/v1/summarize",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      console.log(result.data)

      // Stop interval and complete progress
      clearInterval(interval);
      setProgress(100);
      setIsProcessing(false);

      // Calculate words properly
      const originalWords = uploadedFile.content
        ? uploadedFile.content.split(/\s+/).length
        : 500;

      const summaryWords = Math.floor(originalWords * (summaryLength[0] / 100));

      setSummaryResult({
        summary: result?.data.summary,
        keyPoints: result?.data.keyPoints,
        wordCount: summaryWords,
        originalWordCount: originalWords,
        readingTime: Math.ceil(summaryWords / 200),
      });
    } catch (error) {
      console.error("Error summarizing:", error);
      if (interval) {
        clearInterval(interval);
      }
      setIsProcessing(false);
      setProgress(0);
    }
  };

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("first");
    // if (!chatInput.trim() || !uploadedFile || !guestId || !noteId) return;
    console.log("second");

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: "user",
      content: chatInput,
      timestamp: new Date(),
    };

    setChatMessages((prev) => [...prev, userMessage]);
    setChatInput("");
    setIsChatLoading(true);

    try {
      const response = await axios.post("http://localhost:3000/v1/api/chat", {
        chat: userMessage.content,
        note_id: noteId,
      });

      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: "ai",
        content: response?.data.answer,
        timestamp: new Date(),
      };
      setChatMessages((prev) => [...prev, aiMessage]);
    } catch (err) {
      console.error(err);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 2).toString(),
        type: "ai",
        content: "Sorry, something went wrong. Please try again.",
        timestamp: new Date(),
      };
      setChatMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getFileIcon = (type: string) => {
    if (type === "application/pdf")
      return <FileText className="h-5 w-5 text-red-500" />;
    return <File className="h-5 w-5 text-blue-500" />;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl p-2.5 shadow-lg">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">AI DocChat</h1>
                <p className="text-sm text-gray-500">
                  Intelligent Document Analysis & Chat
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {uploadedFile && (
                <Badge
                  variant="outline"
                  className="flex items-center space-x-1"
                >
                  {getFileIcon(uploadedFile.type)}
                  <span>{uploadedFile.name}</span>
                </Badge>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList className="grid w-full grid-cols-3 bg-white shadow-sm">
            <TabsTrigger value="upload" className="flex items-center space-x-2">
              <Upload className="h-4 w-4" />
              <span>Upload</span>
            </TabsTrigger>
            <TabsTrigger
              value="summary"
              disabled={!uploadedFile}
              className="flex items-center space-x-2"
            >
              <FileText className="h-4 w-4" />
              <span>Summary</span>
            </TabsTrigger>
            <TabsTrigger
              value="chat"
              disabled={!uploadedFile}
              className="flex items-center space-x-2"
            >
              <MessageCircle className="h-4 w-4" />
              <span>Chat</span>
            </TabsTrigger>
          </TabsList>

          {/* Upload Tab */}
          <TabsContent value="upload" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Card className="shadow-lg border-0 bg-white">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center space-x-2 text-gray-800">
                      <Upload className="h-5 w-5 text-blue-600" />
                      <span>Upload Your Document</span>
                    </CardTitle>
                    <p className="text-sm text-gray-600">
                      Upload PDF files or text documents to get AI-powered
                      summaries and chat with your content
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div
                      className={`relative border-2 border-dashed rounded-xl p-12 text-center transition-all duration-300 ${
                        isDragOver
                          ? "border-blue-500 bg-blue-50 scale-[1.02]"
                          : uploadedFile
                          ? "border-green-500 bg-green-50"
                          : "border-gray-300 bg-gray-50/50 hover:border-gray-400 hover:bg-gray-100/50"
                      }`}
                      onDrop={handleDrop}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        accept=".txt,.pdf,.doc,.docx"
                        onChange={(e) =>
                          e.target.files?.[0] &&
                          handleFileUpload(e.target.files[0])
                        }
                      />

                      {uploadedFile ? (
                        <div className="space-y-4">
                          <div className="bg-white rounded-lg p-4 shadow-sm border">
                            <div className="flex items-center space-x-3">
                              {getFileIcon(uploadedFile.type)}
                              <div className="flex-1 text-left">
                                <p className="font-medium text-gray-900">
                                  {uploadedFile.name}
                                </p>
                                <div className="flex items-center space-x-4 text-sm text-gray-500">
                                  <span>
                                    {formatFileSize(uploadedFile.size)}
                                  </span>
                                  {uploadedFile.pages && (
                                    <span>{uploadedFile.pages} pages</span>
                                  )}
                                  <span>
                                    {uploadedFile.type.includes("pdf")
                                      ? "PDF"
                                      : "Text"}
                                  </span>
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setUploadedFile(null)}
                                className="text-gray-500 hover:text-red-500"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          <div className="flex space-x-3">
                            <Button
                              onClick={() => setActiveTab("summary")}
                              className="flex-1 bg-blue-600 hover:bg-blue-700"
                            >
                              <Sparkles className="h-4 w-4 mr-2" />
                              Generate Summary
                            </Button>
                            <Button
                              onClick={() => setActiveTab("chat")}
                              variant="outline"
                              className="flex-1"
                            >
                              <MessageCircle className="h-4 w-4 mr-2" />
                              Start Chat
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="bg-gradient-to-br from-blue-100 to-purple-100 rounded-full p-6 w-24 h-24 mx-auto flex items-center justify-center">
                            <Upload className="h-10 w-10 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-xl font-semibold text-gray-900 mb-2">
                              Drop your document here
                            </p>
                            <p className="text-gray-600 mb-4">
                              or click to browse files
                            </p>
                            <div className="flex flex-wrap justify-center gap-2 text-xs text-gray-500">
                              <Badge variant="secondary">PDF</Badge>
                              <Badge variant="secondary">TXT</Badge>
                              <Badge variant="secondary">DOC</Badge>
                              <Badge variant="secondary">DOCX</Badge>
                            </div>
                            <p className="text-xs text-gray-400 mt-3">
                              Maximum file size: 25MB
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Quick Actions */}
              <div className="space-y-4">
                <Card className="shadow-lg border-0 bg-white">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg text-gray-800">
                      Quick Actions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Browse Files
                    </Button>
                  </CardContent>
                </Card>

                <Card className="shadow-lg border-0 bg-gradient-to-br from-blue-50 to-purple-50">
                  <CardContent className="p-4">
                    <div className="text-center space-y-2">
                      <Bot className="h-8 w-8 text-blue-600 mx-auto" />
                      <h3 className="font-semibold text-gray-800">
                        AI-Powered Analysis
                      </h3>
                      <p className="text-sm text-gray-600">
                        Get intelligent summaries and chat with your documents
                        using advanced AI
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Summary Tab */}
          <TabsContent value="summary" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                {/* Summary Settings */}
                <Card className="shadow-lg border-0 bg-white">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2 text-gray-800">
                      <Settings className="h-5 w-5 text-blue-600" />
                      <span>Summary Configuration</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <Label htmlFor="summary-type">Summary Style</Label>
                        <Select
                          value={summaryType}
                          onValueChange={setSummaryType}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="comprehensive">
                              Comprehensive Analysis
                            </SelectItem>
                            <SelectItem value="bullet-points">
                              Key Points
                            </SelectItem>
                            <SelectItem value="abstract">
                              Academic Abstract
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-3">
                        <Label>Summary Length: {summaryLength[0]}%</Label>
                        <Slider
                          value={summaryLength}
                          onValueChange={setSummaryLength}
                          max={80}
                          min={10}
                          step={5}
                          className="w-full"
                        />
                        <div className="flex justify-between text-xs text-gray-500">
                          <span>Concise</span>
                          <span>Detailed</span>
                        </div>
                      </div>
                    </div>

                    <Button
                      onClick={(e) => simulateProcessing(e)}
                      disabled={!uploadedFile || isProcessing}
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                      size="lg"
                    >
                      {isProcessing ? (
                        <>
                          <Bot className="h-4 w-4 mr-2 animate-pulse" />
                          AI is analyzing...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4 mr-2" />
                          Generate AI Summary
                        </>
                      )}
                    </Button>

                    {isProcessing && (
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm text-gray-600">
                          <span>Processing document with AI...</span>
                          <span>{progress}%</span>
                        </div>
                        <Progress value={progress} className="w-full h-2" />
                        <p className="text-xs text-gray-500 text-center">
                          Analyzing content • Extracting key insights •
                          Generating summary
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Summary Results */}
                {summaryResult && (
                  <Card className="shadow-lg border-0 bg-white">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span className="text-gray-800">
                          AI Summary Results
                        </span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Tabs defaultValue="summary" className="space-y-4">
                        <TabsList className="grid w-full grid-cols-2">
                          <TabsTrigger value="summary">Summary</TabsTrigger>
                          <TabsTrigger value="keypoints">
                            Key Insights
                          </TabsTrigger>
                        </TabsList>

                        <TabsContent value="summary" className="space-y-4">
                          <div className="bg-gradient-to-br from-gray-50 to-blue-50/30 rounded-lg p-6 border">
                            <p className="text-gray-700 leading-relaxed text-base">
                              {Array.isArray(summaryResult.summary)
                                ? summaryResult.summary.map(
                                    (point: any, idx: number) => (
                                      <div
                                        key={idx}
                                        className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg border-l-4 border-blue-500 mb-3"
                                      >
                                        <div className="bg-blue-100 text-blue-800 rounded-full text-xs font-semibold px-2.5 py-1 mt-0.5">
                                          {idx + 1}
                                        </div>

                                        <p className="text-gray-700 flex-1 leading-relaxed">
                                          {typeof point === "object"
                                            ? Object.entries(point).map(
                                                ([key, value]) => (
                                                  <div
                                                    key={key}
                                                    className="mb-2"
                                                  >
                                                    <span className="font-semibold capitalize">
                                                      {key}:
                                                    </span>{" "}
                                                    {String(value)}
                                                  </div>
                                                )
                                              )
                                            : point}
                                        </p>
                                      </div>
                                    )
                                  )
                                : summaryResult?.summary}
                            </p>
                          </div>
                          <div className="flex items-center justify-between text-sm text-gray-500 bg-gray-50 rounded-lg p-3">
                            <span>
                              Summary: {summaryResult.wordCount} words
                            </span>
                            <span>
                              Reading time: ~{summaryResult.readingTime} min
                            </span>
                            <span>
                              Compression:{" "}
                              {Math.round(
                                (1 -
                                  summaryResult.wordCount /
                                    summaryResult.originalWordCount) *
                                  100
                              )}
                              %
                            </span>
                          </div>
                        </TabsContent>

                        <TabsContent value="keypoints" className="space-y-3">
                          <div className="space-y-3">
                            {summaryResult.keyPoints.map((point, index) => (
                              <div
                                key={index}
                                className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg border-l-4 border-blue-500"
                              >
                                <div className="bg-blue-100 text-blue-800 rounded-full text-xs font-semibold px-2.5 py-1 mt-0.5">
                                  {index + 1}
                                </div>
                                <p className="text-gray-700 flex-1 leading-relaxed">
                                  {point}
                                </p>
                              </div>
                            ))}
                          </div>
                        </TabsContent>
                      </Tabs>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Document Info Sidebar */}
              <div className="space-y-6">
                {uploadedFile && (
                  <Card className="shadow-lg border-0 bg-white">
                    <CardHeader>
                      <CardTitle className="text-lg text-gray-800">
                        Document Info
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">
                            File Size
                          </span>
                          <span className="text-sm font-medium">
                            {formatFileSize(uploadedFile.size)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Type</span>
                          <span className="text-sm font-medium">
                            {uploadedFile.type.includes("pdf")
                              ? "PDF Document"
                              : "Text Document"}
                          </span>
                        </div>
                        {uploadedFile.pages && (
                          <div className="flex justify-between">
                            <span className="text-sm text-gray-600">Pages</span>
                            <span className="text-sm font-medium">
                              {uploadedFile.pages}
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">
                            Est. Words
                          </span>
                          <span className="text-sm font-medium">
                            {Math.floor(uploadedFile.size / 5).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <Card className="shadow-lg border-0 bg-gradient-to-br from-purple-50 to-blue-50">
                  <CardContent className="p-6">
                    <div className="text-center space-y-3">
                      <div className="bg-gradient-to-br from-purple-100 to-blue-100 rounded-full p-3 w-16 h-16 mx-auto flex items-center justify-center">
                        <Bot className="h-8 w-8 text-purple-600" />
                      </div>
                      <h3 className="font-semibold text-gray-800">
                        AI Features
                      </h3>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>• Intelligent summarization</li>
                        <li>• Key point extraction</li>
                        <li>• Interactive document chat</li>
                        <li>• Context-aware responses</li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Chat Tab */}
          <TabsContent value="chat" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-200px)]">
              {/* Chat Interface */}
              <div className="lg:col-span-3">
                <Card className="shadow-lg border-0 bg-white h-full flex flex-col">
                  <CardHeader className="pb-4 border-b bg-gradient-to-r from-blue-50 to-purple-50">
                    <CardTitle className="flex items-center space-x-2 text-gray-800">
                      <MessageCircle className="h-5 w-5 text-blue-600" />
                      <span>Chat with Your Document</span>
                    </CardTitle>
                    <p className="text-sm text-gray-600">
                      Ask questions about your document and get AI-powered
                      answers
                    </p>
                  </CardHeader>

                  <CardContent className="flex-1 flex flex-col p-0">
                    {/* Chat Messages */}
                    <ScrollArea className="flex-1 p-4">
                      <div className="space-y-4">
                        {chatMessages.length === 0 ? (
                          <div className="text-center py-12">
                            <Bot className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-500 mb-2">
                              Start a conversation with your document
                            </p>
                            <p className="text-sm text-gray-400">
                              Ask questions like "What are the main points?" or
                              "Explain this concept"
                            </p>
                          </div>
                        ) : (
                          chatMessages.map((message) => (
                            <div
                              key={message.id}
                              className={`flex items-start space-x-3 ${
                                message.type === "user"
                                  ? "justify-end"
                                  : "justify-start"
                              }`}
                            >
                              {message.type === "ai" && (
                                <Avatar className="h-8 w-8 bg-gradient-to-br from-blue-500 to-purple-500">
                                  <AvatarFallback>
                                    <Bot className="h-4 w-4 text-white" />
                                  </AvatarFallback>
                                </Avatar>
                              )}

                              <div
                                className={`max-w-[80%] rounded-lg px-4 py-3 ${
                                  message.type === "user"
                                    ? "bg-blue-600 text-white"
                                    : "bg-gray-100 text-gray-800 border"
                                }`}
                              >
                                <p className="text-sm leading-relaxed">
                                  {message.content}
                                </p>
                                <p
                                  className={`text-xs mt-2 ${
                                    message.type === "user"
                                      ? "text-blue-100"
                                      : "text-gray-500"
                                  }`}
                                >
                                  {message.timestamp.toLocaleTimeString()}
                                </p>
                              </div>

                              {message.type === "user" && (
                                <Avatar className="h-8 w-8 bg-gray-600">
                                  <AvatarFallback>
                                    <User className="h-4 w-4 text-white" />
                                  </AvatarFallback>
                                </Avatar>
                              )}
                            </div>
                          ))
                        )}

                        {isChatLoading && (
                          <div className="flex items-start space-x-3">
                            <Avatar className="h-8 w-8 bg-gradient-to-br from-blue-500 to-purple-500">
                              <AvatarFallback>
                                <Bot className="h-4 w-4 text-white" />
                              </AvatarFallback>
                            </Avatar>
                            <div className="bg-gray-100 rounded-lg px-4 py-3 border">
                              <div className="flex space-x-1">
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                <div
                                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                                  style={{ animationDelay: "0.1s" }}
                                ></div>
                                <div
                                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                                  style={{ animationDelay: "0.2s" }}
                                ></div>
                              </div>
                            </div>
                          </div>
                        )}
                        <div ref={chatEndRef} />
                      </div>
                    </ScrollArea>

                    {/* Chat Input */}
                    <div className="border-t bg-gray-50/50 p-4">
                      <form
                        onSubmit={(e) => handleChatSubmit(e)}
                        className="flex space-x-3"
                      >
                        <Input
                          value={chatInput}
                          onChange={(e) => setChatInput(e.target.value)}
                          placeholder="Ask a question about your document..."
                          className="flex-1 bg-white"
                          disabled={isChatLoading}
                        />
                        <Button
                          type="submit"
                          disabled={!chatInput.trim() || isChatLoading}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                      </form>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Chat Sidebar */}
              <div className="space-y-4">
                <Card className="shadow-lg border-0 bg-white">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg text-gray-800">
                      Suggested Questions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {[
                      "What are the main topics?",
                      "Summarize key findings",
                      "What conclusions are drawn?",
                      "Explain technical concepts",
                      "What are the recommendations?",
                    ].map((question, index) => (
                      <Button
                        key={index}
                        variant="ghost"
                        className="w-full justify-start text-left h-auto p-3 text-sm"
                        onClick={() => setChatInput(question)}
                      >
                        {question}
                      </Button>
                    ))}
                  </CardContent>
                </Card>

                {uploadedFile && (
                  <Card className="shadow-lg border-0 bg-white">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg text-gray-800">
                        Document Context
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3 text-sm">
                        <div className="flex items-center space-x-2">
                          {getFileIcon(uploadedFile.type)}
                          <span className="font-medium text-gray-700">
                            {uploadedFile.name}
                          </span>
                        </div>
                        <div className="text-gray-600">
                          <p>
                            The AI has full context of your document and can
                            answer specific questions about its content, themes,
                            and details.
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
