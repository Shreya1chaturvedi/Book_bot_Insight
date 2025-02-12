const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const { spawn } = require("child_process");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// MongoDB Connection
const dbURI = "mongodb://localhost:27017/bookbot";
mongoose.connect(dbURI, { 
    useNewUrlParser: true, 
    useUnifiedTopology: true 
})
.then(() => console.log("Connected to MongoDB"))
.catch((err) => console.error("MongoDB Connection Error:", err));

// Question Schema
const QuestionSchema = new mongoose.Schema({
    question: { type: String, required: true },
    answer: { type: String, default: null },
    pdfPath: { type: String, default: null },
    retrievedDocs: { type: [String], default: [] }
}, { timestamps: true });

const Question = mongoose.model("Question", QuestionSchema);

// File Upload Configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, "uploads/"),
    filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`),
});

const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        const fileExt = path.extname(file.originalname).toLowerCase();
        const mimeType = file.mimetype;
        if (fileExt !== ".pdf" || mimeType !== "application/pdf") {
            return cb(new Error("Only PDF files are allowed"), false);
        }
        cb(null, true);
    },
});

// PDF Processing Route
app.post("/process-pdf", upload.single("pdf"), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: "No PDF file uploaded" });
    }

    const filePath = req.file.path;

    // Spawn Python process to process PDF
    const pythonProcess = spawn("python", ["rag_helper.py", "process_pdf", filePath]);

    pythonProcess.stdout.on("data", (data) => {
        const response = JSON.parse(data.toString());
        res.status(200).json(response);
    });

    pythonProcess.stderr.on("data", (data) => {
        console.error("PDF Processing Error:", data.toString());
        res.status(500).json({ error: "Failed to process PDF" });
    });
});

// Query Route
app.post("/query", async (req, res) => {
    const { query } = req.body;

    if (!query) {
        return res.status(400).json({ error: "Query is required" });
    }

    // Spawn Python process to handle query
    const pythonProcess = spawn("python", ["rag_helper.py", "query", query]);

    pythonProcess.stdout.on("data", async (data) => {
        try {
            const response = JSON.parse(data.toString());
            
            // Optional: Save query and result to MongoDB
            const newQuestion = new Question({
                question: query,
                answer: response.answer,
                retrievedDocs: response.retrieved_docs
            });
            await newQuestion.save();

            res.status(200).json(response);
        } catch (error) {
            console.error("Response Parsing Error:", error);
            res.status(500).json({ error: "Failed to process query response" });
        }
    });

    pythonProcess.stderr.on("data", (data) => {
        console.error("Query Processing Error:", data.toString());
        res.status(500).json({ error: "Failed to query the model" });
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});