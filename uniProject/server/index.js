import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const app = express();
const port = 5000;

app.use(cors());
app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.get("/", (req, res) => {
  res.send("Server is running!");
})

app.post("/api/debug/js", async (req, res) => {
  const { code } = req.body;

    console.log("Received request to /api/debug/js"); // 
  console.log("Request body:", req.body); // 

  try {
 const response = await openai.chat.completions.create({
  model: "gpt-3.5-turbo",
  messages: [
   {
  role: "system",
  content: `
    You are a helpful assistant teaching JavaScript to kids around 10 years old.

    IMPORTANT RULES:
- NEVER use triple backticks (\`\`\`) or Markdown formatting.
- DO NOT say "run this code", "print", or "console". Avoid all techy words.
- Only show plain JavaScript code as-is, with no formatting.
- Keep your explanation short, friendly, and step-by-step.
- No big words or jargon.

FORMAT your answer like this:
1. Error Type: (use a simple name like "Missing quote" or "Unknown name")
2. Error in Code: (show the broken line as plain text)
3. What Went Wrong: (explain in simple words)
4. Hint to Fix: (show the fixed line and explain it simply)
`
}, 
    {
      role: "user",
      content: `Please help me understand what's wrong with this code, like I'm new to programming:\n\n${code}`,
    },
  ],
});


    const result = response.choices[0].message.content;
    res.json({ result });

    console.log("Result sent: ", result); 

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "error 500" });
  }
});

app.listen(port, () =>
  console.log(`server running on http://localhost:${port}`)
);
