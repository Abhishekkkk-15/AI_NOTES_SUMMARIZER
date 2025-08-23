// utils/handleFileType.ts
import mammoth from "mammoth";
import pdf from "pdf-parse";
export async function handleFileType(file) {
    // console.log(file)
    if (!file)
        throw new Error("No file provided");
    const mimeType = file.mimetype;
    let textContent = "";
    if (mimeType === "application/pdf") {
        // parse PDF from buffer
        const data = await pdf(file.buffer);
        textContent = data.text;
    }
    else if (mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
        // parse .docx
        const result = await mammoth.extractRawText({ buffer: file.buffer });
        textContent = result.value;
    }
    else if (mimeType === "text/plain") {
        // parse .txt
        textContent = file.buffer.toString("utf-8");
    }
    else {
        throw new Error("Unsupported file type");
    }
    return textContent.trim();
}
//# sourceMappingURL=handleFileType.js.map