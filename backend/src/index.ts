import multer from "multer"
import { summarizeNote } from "./contoller/summarizeNote.js"
import { upload } from "./lib/multer.js"
import { chatWithNote } from "./contoller/chatWithNote.js"
import { config } from "dotenv"
import cors from 'cors'
config()
import  express from 'express'

const app =  express()
app.use(cors({
     origin: ['http://localhost:5173'], // Adjust this to your frontend URL
     credentials: true // Allow credentials (cookies)
 }))
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true , limit:"10mb"}));
app.get('/v1/',(req,res)=>{res.send("Welcome to note Summarizer")})
app.post("/v1/summarize", upload.single('file'), summarizeNote)
app.post("/v1/api/chat", chatWithNote);

app.listen(3000,()=>{
console.log("Server running on port 3000")

})

