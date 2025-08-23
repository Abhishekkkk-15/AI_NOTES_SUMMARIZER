// utils/multer.ts
import multer from "multer";
// Store files in memory (so we can process with pdf-lib, mammoth, etc.)
const storage = multer.memoryStorage();
export const upload = multer({ storage,
    limits: { fileSize: 25 * 1024 * 1024 },
});
//# sourceMappingURL=multer.js.map