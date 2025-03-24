const express = require("express");
const multer = require("multer");
const axios = require("axios");
const cors = require("cors");
const pdfParse = require("pdf-parse");
require('dotenv').config();  // Load environment variables

const app = express();
const port = process.env.PORT || 5000;

// Middleware
const corsOptions = {
    origin: "*", // Allow all origins for testing
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Authorization"],
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Set up Multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

app.post("/upload-resume", upload.single("resume"), async (req, res) => {
    try {
        const resumeFile = req.file;
        const language = req.body.language || "English";

        if (!resumeFile) {
            return res.status(400).json({ error: "No file uploaded!" });
        }

        // Extract text from the resume
        const extractedText = await extractTextFromPDF(resumeFile.buffer);

        let roastPrompt = `Roast this resume in ${language} with brutal humor. Here's the resume:\n${extractedText}`;

        // Call OpenRouter AI API
        const response = await axios.post(
            "https://openrouter.ai/api/v1/chat/completions",
            {
                model: "meta-llama/llama-3.3-70b-instruct:free",
                messages: [{ role: "user", content: roastPrompt }],
                top_p: 1,
                temperature: 1,
                repetition_penalty: 1,
            },
            {
                headers: {
                    Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
                    "Content-Type": "application/json",
                },
            }
        );

        // Log response for debugging
        console.log("AI API Response:", response.data);

        const roastText = response.data?.choices?.[0]?.message?.content || "No roast returned!";
        res.json({ roast: roastText });

    } catch (error) {
        console.error("Error processing file:", error);
        res.status(500).json({ error: `Failed to process the resume: ${error.message}` });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});

// Function to extract text from PDF
async function extractTextFromPDF(buffer) {
    try {
        const data = await pdfParse(buffer);
        return data.text;
    } catch (error) {
        console.error("Error extracting text from PDF:", error);
        throw new Error("Failed to extract text from PDF");
    }
}
