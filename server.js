const express = require("express");
const multer = require("multer");
const axios = require("axios");
const cors = require("cors");
const path = require("path");
require('dotenv').config();  // Load environment variables

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Set up Multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

app.post("/upload-resume", upload.single("resume"), async (req, res) => {
    try {
        const resumeFile = req.file;
        const language = req.body.language;

        if (!resumeFile) {
            return res.status(400).json({ error: "No file uploaded!" });
        }

        // Extract text from the resume (assuming it's a PDF)
        const extractedText = await extractTextFromPDF(resumeFile.buffer);

        // Create the roast prompt
        let roastPrompt = `Bro, absolutely DESTROY this resume in ${language}. No corporate nonsense—just pure, meme-level roasting like two best friends clowning each other.
        - Be brutally funny, sarcastic, and engaging.
        - Roast everything line by line
        - Use simple, everyday ${language}. No fancy words—just pure savage humor.
        - Make fun of achievements like they’re participation trophies.
        - Add emojis to make it hit harder.
        - Keep it short, punchy, and straight to the point.
        - Give an ATS score and roast the resume.
        *Here's the resume:*
        
        ${extractedText}
        
        - Roast brutally but in the end, give a funny rating.`;

        if (language.toLowerCase() === "hindi") {
            roastPrompt = `Bhai, is resume ki aisi taisi kar do, ekdum full roast chahiye!🔥
            -project ko bhi ganda roast krde.
            - Har ek line pe solid taunt maaro.
            - Achievements ko aise udaao jaise gully cricket trophy ho. 🏏🤣
            - Emojis aur memes ka proper use ho, taki roast aur mast lage. 💀😂
            - Chhota, mazedaar aur full tandoor level ka roast chahiye.
            - ATS score bhi do, lekin aise jaise school me ma'am ne aakhri bench wale ko bola ho - "Beta, next time better karo!" 😆
            *Yeh raha resume:*
            
            ${extractedText}
            
            - Aur last me, ek savage tareeke se rating dedo jaise kisi dost ko dete hain.`;
        }

        // Call to OpenRouter AI API
        const response = await fetch(
            "https://openrouter.ai/api/v1/chat/completions",
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    model: "meta-llama/llama-3.3-70b-instruct:free",
                    messages: [
                        {
                            role: "user",
                            content: roastPrompt,
                        },
                    ],
                    top_p: 1,
                    temperature: 1,
                    repetition_penalty: 1,
                }),
            }
        );

        const data = await response.json();
        const roastText = data.choices[0].message.content;

        res.json({ roast: roastText });

    } catch (error) {
        console.error("Error processing file:", error);
        res.status(500).json({ error: "Failed to process the resume. Please try again!" });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});

// Function to extract text from PDF (you'll need to implement this)
async function extractTextFromPDF(buffer) {
    // Implement your PDF text extraction logic here
    return "Extracted text from PDF";
}
