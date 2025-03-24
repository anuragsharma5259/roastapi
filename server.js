const express = require("express");
const multer = require("multer");
const axios = require("axios");
const cors = require("cors");
const pdfParse = require("pdf-parse");
require("dotenv").config(); // Load environment variables

const app = express();
const port = process.env.PORT || 5000;

// CORS Configuration - Allow all origins for now
const corsOptions = {
    origin: "*",  // Temporarily allow all, restrict in production
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Authorization"],
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Multer storage setup for handling file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Route for uploading and processing resumes
app.post("/upload-resume", upload.single("resume"), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "No file uploaded!" });
        }

        const language = req.body.language || "English";
        const extractedText = await extractTextFromPDF(req.file.buffer);

        // Create the roast prompt
        let roastPrompt = generateRoastPrompt(extractedText, language);

        // Call OpenRouter API
        const roastText = await callOpenRouterAI(roastPrompt);
        
        res.json({ roast: roastText });

    } catch (error) {
        console.error("Error processing request:", error);
        res.status(500).json({ error: `Failed to process the resume. Try again! ${error.message}` });
    }
});

// Start server on all interfaces (IPv4 & IPv6 support)
app.listen(port, "0.0.0.0", () => {
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

// Function to generate roast prompt
function generateRoastPrompt(resumeText, language) {
    if (language.toLowerCase() === "hindi") {
        return `Bhai, is resume ki aisi taisi kar do, ekdum full roast chahiye!🔥
        - Har ek line pe solid taunt maaro.
        - Achievements ko aise udaao jaise gully cricket trophy ho. 🏏🤣
        - Emojis aur memes ka proper use ho. 💀😂
        - Chhota, mazedaar aur full tandoor level ka roast chahiye.
        - ATS score bhi do, lekin aise jaise school me ma'am ne aakhri bench wale ko bola ho - "Beta, next time better karo!" 😆
        *Yeh raha resume:*
        
        ${resumeText}
        
        - Aur last me, ek savage tareeke se rating dedo jaise kisi dost ko dete hain.`;
    }

    return `Bro, absolutely DESTROY this resume in ${language}. No corporate nonsense—just pure, meme-level roasting like two best friends clowning each other.
    - Be brutally funny, sarcastic, and engaging.
    - Roast everything line by line.
    - Use simple, everyday ${language}. No fancy words—just pure savage humor.
    - Make fun of achievements like they’re participation trophies.
    - Add emojis to make it hit harder.
    - Keep it short, punchy, and straight to the point.
    - Give an ATS score and roast the resume.
    
    *Here's the resume:*
    
    ${resumeText}
    
    - Roast brutally but in the end, give a funny rating.`;
}

// Function to call OpenRouter AI
async function callOpenRouterAI(prompt) {
    try {
        const response = await axios.post(
            "https://openrouter.ai/api/v1/chat/completions",
            {
                model: "meta-llama/llama-3.3-70b-instruct:free",
                messages: [{ role: "user", content: prompt }],
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

        if (
            !response.data ||
            !response.data.choices ||
            !response.data.choices[0]?.message?.content
        ) {
            throw new Error("Invalid response from AI API");
        }

        return response.data.choices[0].message.content;
    } catch (error) {
        console.error("Error calling AI API:", error);
        throw new Error("Failed to fetch roast from AI API.");
    }
}
