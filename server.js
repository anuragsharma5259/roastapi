const express = require("express");
const multer = require("multer");
const axios = require("axios");
const cors = require("cors");
const pdfParse = require("pdf-parse");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 5000;

const corsOptions = {
  origin: "https://resumeroaster-theta.vercel.app",
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

app.post("/upload-resume", upload.single("resume"), async (req, res) => {
  try {
    const resumeFile = req.file;
    const language = req.body.language;

    if (!resumeFile || resumeFile.mimetype !== "application/pdf") {
      return res.status(400).json({ error: "Please upload a valid PDF file." });
    }

    const extractedText = await extractTextFromPDF(resumeFile.buffer);
    if (!extractedText || extractedText.trim().length === 0) {
      return res
        .status(400)
        .json({ error: "No text could be extracted from the PDF." });
    }

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

    const aiResponse = await axios.post(
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

    const roastText = aiResponse.data?.choices?.[0]?.message?.content;
    if (!roastText) {
      throw new Error("Invalid response format from AI API");
    }

    res.json({ roast: roastText, extractedText });
  } catch (error) {
    console.error("Error processing file:", error);
    res.status(500).json({
      error: `Failed to process the resume. Please try again! Error: ${error.message}`,
    });
  }
});

app.get("/", (req, res) => {
  res.send("This is roast-application backend!");
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

async function extractTextFromPDF(buffer) {
  try {
    const data = await pdfParse(buffer);
    return data.text;
  } catch (error) {
    console.error("Error extracting text from PDF:", error);
    throw new Error("Failed to extract text from PDF");
  }
}
