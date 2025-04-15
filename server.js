const express = require("express");
const multer = require("multer");
const axios = require("axios");
const cors = require("cors");
const pdfParse = require("pdf-parse");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 5000;

// CORS for your frontend
const corsOptions = {
  origin: "https://resumeroaster-theta.vercel.app", // ✅ update if frontend URL changes
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Multer to handle file uploads (in memory)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// ➖ No need for frontend to send API key anymore

// 🔥 Resume roasting route
app.post("/upload-resume", upload.single("resume"), async (req, res) => {
  try {
    const resumeFile = req.file;
    const language = req.body.language || "English";

    if (!resumeFile || resumeFile.mimetype !== "application/pdf") {
      return res.status(400).json({ error: "Please upload a valid PDF file." });
    }

    const extractedText = await extractTextFromPDF(resumeFile.buffer);
    if (!extractedText || extractedText.trim().length === 0) {
      return res.status(400).json({ error: "Could not extract any text from the PDF." });
    }

    const safeText = extractedText.slice(0, 5000);

    // 🔥 Prompt for roast
    let roastPrompt = `
Bro, absolutely DESTROY this resume in ${language}. No corporate nonsense—just pure, meme-level roasting like two best friends clowning each other.
- Be brutally funny, sarcastic, and engaging.
- Roast everything line by line.
- Use simple, everyday ${language}. No fancy words—just pure savage humor.
- Make fun of achievements like they’re participation trophies.
- Add emojis to make it hit harder.
- Keep it short, punchy, and straight to the point.
- Give an ATS score and roast the resume.
*Here's the resume:*

${safeText}

- Roast brutally but in the end, give a funny rating.
`;

    if (language.toLowerCase() === "hindi") {
      roastPrompt = `
Bhai, is resume ki aisi taisi kar do, ekdum full roast chahiye!🔥
- Har ek line pe solid taunt maaro.
- Achievements ko aise udaao jaise gully cricket trophy ho. 🏏🤣
- Emojis aur memes ka proper use ho, taki roast aur mast lage. 💀😂
- Chhota, mazedaar aur full tandoor level ka roast chahiye.
- ATS score bhi do, lekin aise jaise school me ma'am ne bola ho - "Beta, next time better karo!" 😆
*Yeh raha resume:*

${safeText}

- Aur last me, ek savage tareeke se rating dedo jaise kisi dost ko dete hain.`;
    }


    console.log("API Key:", process.env.OPENROUTER_API_KEY); // just for debugging (remove later)


    // 🔐 Secure backend OpenRouter call
    const aiResponse = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "meta-llama/llama-3.3-70b-instruct:free",
        messages: [{ role: "user", content: roastPrompt }],
        temperature: 1,
        top_p: 1,
        repetition_penalty: 1,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const roastText = aiResponse?.data?.choices?.[0]?.message?.content;
     console.log(roastText);
     

    if (!roastText) {
      throw new Error("AI response is empty or not in expected format.");
    }

    res.status(200).json({ roast: roastText, extractedText: safeText });
  } catch (error) {
    console.error("🔥 Error:", error.response?.data || error.message || error);
    res.status(500).json({
      error:
        error.response?.data?.error ||
        error.message ||
        "Something went wrong while roasting the resume.",
    });
  }
});

// Health check route
app.get("/", (req, res) => {
  res.send("🔥 Roast My Resume - Backend is live!");
});

// Start server
app.listen(port, () => {
  console.log(`🔥 Server running on http://localhost:${port}`);
});

// PDF text extraction
async function extractTextFromPDF(buffer) {
  try {
    const data = await pdfParse(buffer);
    return data.text;
  } catch (err) {
    console.error("❌ Failed to extract text from PDF:", err);
    throw new Error("Text extraction failed.");
  }
}
