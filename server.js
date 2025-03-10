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
    origin: 'https://resume-roast-three.vercel.app', // Your frontend URL
    optionsSuccessStatus: 200,
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
        const response = await axios.post(
            "https://openrouter.ai/api/v1/chat/completions",
            {
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
            },
            {
                headers: {
                    Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
                    "Content-Type": "application/json",
                },
            }
        );

        // Log the full response for debugging
        console.log("AI API Response:", response.data);

        if (!response.data || !response.data.choices || !response.data.choices[0] || !response.data.choices[0].message || !response.data.choices[0].message.content) {
            throw new Error("Invalid response format from AI API");
        }

        const roastText = response.data.choices[0].message.content;

        res.json({ roast: roastText });

    } catch (error) {
        console.error("Error processing file:", error);
        res.status(500).json({ error: `Failed to process the resume. Please try again! Error details: ${error.message}` });
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
