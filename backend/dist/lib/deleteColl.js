import { ChromaClient } from "chromadb";
const client = new ChromaClient({ path: "http://localhost:8000" });
async function resetCollection(name) {
    try {
        await client.createCollection({
            name: "notes_"
        });
        console.log(`🗑️ Deleted collection: ${name}`);
    }
    catch (e) {
        console.log(e);
        console.log(`No collection named ${name} found`);
    }
}
resetCollection("notes_");
resetCollection("notes");
resetCollection("chat_history");
//# sourceMappingURL=deleteColl.js.map