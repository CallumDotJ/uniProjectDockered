import express from "express";
import OpenAI from "openai";
import dotenv from "dotenv";
import multer from "multer";
import { jsonrepair } from "jsonrepair";

dotenv.config();

const router = express.Router();

// store im memory so can send to OpenAI
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

// create object
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// create get test endpoint
router.get("/debug", (req, res) => {
  res.json({
    message: "Debug endpoint is working. POST an image + notes to test.",
  });
});

//
router.post("/debug", upload.single("image"), async (req, res) => {
  try {
    const notes = req.body?.notes || "";
    const file = req.file;

    if (!file) {
      return res
        .status(400)
        .json({ error: "No image uploaded. Expected field name: image" });
    }

    const base64 = file.buffer.toString("base64"); //  base64 to convert so api can read

    const dataUrl = `data:${file.mimetype};base64,${base64}`; // mimetype = image/png for eg.

    const response = await client.chat.completions.create({
      // chat 4o mini .completion instead of response.create
      model: "gpt-4o-mini",
      response_format: { type: "json_object" }, // enforce json output
      messages: [
        {
          role: "system",
          content:
            /* CONTEXT FOR THE AI */

            "You are an expert block-based programming debugging tutor (  Scratch/ Blockly/ EduBlocks style ). " +
            "The user provides a screenshot of block code and optional notes. " +
            "Your job: identify likely logic and/or structural issues, explain what the blocks do in pseudocode, " +
            "and give guided, educational fixes and a final corrected solution.\n\n" +
            "you make ask for a resubmission if unsure - or more context within the notes area - you can ask this in the summary area. \n" +
            "return ONLY valid JSON, do not include markdown, backticks, commentary, or extra text.\n\n" + // to ensure parsable
            // top level view of returned object -- seemed to help enforce it?
            "Output must be ONLY a single JSON object with exactly these top-level keys:\n" +
            "- summary\n" +
            "- assumptions\n" +
            "- identifiedIssues\n" +
            "- issueLocation\n" +
            "- pseudocodeLocation\n" +
            "- hints\n" +
            "- officialAnswer\n\n" +
            /* RULES FOR THE AI API*/

            "rules:\n" +
            "1) even if the screenshot is unclear, still make best effort assumptions and state them in assumptions.\n" + // encourage best effort
            "2) Be specific about where the issue is [e.g. 'inside the forever loop', 'in the if branch that checks 'condition', 'after setting variable X'].\n" + // location specificity
            "3) Keep hints incremental, therefore it's more educationally biased : hint 1 minimal, hint 2 more direct, hint 3 near-solution.\n" + // scaffolded hints
            "4) Never output anything except the JSON object." + // enforce parsable
            "5) issueLocation MUST be present and MUST be render-ready for a block preview UI.\n" + // needs to be in the block preview UI garunteed.
            "6) Do NOT invent blocks if not visible. If unclear, include fewer blocks and set confidence <= 0.5.\n" + //confidence score to be integrated to meet eval
            "7) blocks must be ordered top-to-bottom and include depth for nesting (0 top-level, +1 per nesting).\n" + // ensure nestable in UI - neeed to know layer
            "8) problemBlockId must match one of the blocks[].id.\n", // ensure that valid - not made up
        },
        {
          role: "user",
          content: [
            {
              type: "text",

              /* TRUE TO BE RETUNED JSON IN DEPTH*/
              text:
                `Debug this block program from the screenshot. Notes (might be empty): ${notes}\n\n` + // Give user chance to give their own notes as hints
                "Required output details:\n" +
                "- summary: 1-2 sentences describing what the program appears intended to do.\n" +
                "- assumptions: array of strings.\n" + // assumptions togive context
                "- identifiedIssues: array of objects {id, title, severity, evidence, whyItBreaks, fix}. Severity: 'low' | 'medium' | 'high'.\n" + // explain why it breaks - use severity ratings
                "- pseudocodeLocation: object {currentBehaviorPseudocode, whereItGoesWrong, correctedLogicPseudocode}.Ensure to keep indentation correct in the pseudocode\n" + // to be removed - psuedo
                "- hints: array of 3 objects {level, hint} where level is 1,2,3.\n" + // 3 hints - tiered structure
                "- officialAnswer: object {finalPseudocode, blockFixSteps, commonMistakesToAvoid[ARRAY]}.\n" + // Fully fixed solution
                /* UI OBJECT MATERIAL */

                "- issueLocation: object { blockPath, blocks, problemBlockId, confidence, notes }.\n" + // top level obj
                "  - blockPath: array of strings like ['when green flag clicked','forever','if <condition>'].\n" + // eg
                "  - blocks: array of 4–12 objects {id, type, label, depth}.\n" + // max 12 for scope
                "    type must be one of: 'event'|'loop'|'condition'|'action'|'variable'|'operator'|'other'.\n" + // ensure workable scope
                "  - problemBlockId: string matching one blocks[].id.\n" + // matches specific bllock
                "  - confidence: number 0..1.\n" + /// to be integrated
                "  - notes: short string explaining uncertainty (empty string if confident).\n\n", // confidence string
            },
            { type: "image_url", image_url: { url: dataUrl } }, // image transfer
          ],
        },
      ],
    });

    const raw = response.choices[0]?.message?.content?.trim() || ""; // get raw text - trim whitespace

    const cleaned = raw
      .replace(/^```(?:json)?\s*/i, "") // middle parsing now included
      .replace(/\s*```$/i, "")
      .trim();

    let parsed = null;

    try {
      // try convert
      parsed = JSON.parse(cleaned);
    } catch (err1) {
      try {
        // TRY REPAIR using jsonrepair
        const repaired = jsonrepair(cleaned);
        parsed = JSON.parse(repaired);
      } catch (err2) {
        // failure to repair
        console.error("Failed to parse or repair JSON from model output", {
          raw,
          cleaned,
        });
        return res.status(200).json({
          output: null,
          raw,
          warning: "model did not return valid JSON, see raw.",
        });
      }
    }

    return res.json({ output: parsed }); // MAIN HAPPY RETURN
  } catch (err) {
    // top-level error
    console.error("OpenAI Error", err);
    res.status(500).json({
      error: "failed to generate study material", // generic message
      message: err?.message,
      status: err?.status,
      type: err?.type,
    });
  }
});

// DEPREC
// Was used to generate undetsanding of the API
router.post("/chat", async (req, res) => {
  // generic chat endpoint // testing purpose
  try {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({
        error: "invalid messages formaat, expected an array of messages",
      });
    }
    const response = await client.chat.completions.create({
      model: "gpt-4o", // least to give image understanding
      messages: messages,
    });
    res.json({ output: response.choices[0].message });
  } catch (err) {
    console.error("open ai error", err);
    res.status(500).json({ error: "Failed to generate chat response" });
  }
});

// Created to extract learning issues from the users past conversation messages.
router.post("/learn", async (req, res) => {
  // extract issues for learning purposes
  try {
    const { messages } = req.body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({
        error: "Invalid messages format, expected an array of messages",
      });
    }

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        ...messages,
        {
          role: "system",
          content:
            "You are an educational assistant that's job is to find the specific weak area of a student based on a problem they have had resolved." +
            "You will be given a conversation between a student and a tutor. The student has had a problem resolved, but its your job to identify what specific concept or skill the student is struggling with." +
            "Based on the conversation, identify the most likely weak area of the student and return it in a single sentence. Be specific and focus on one main issue, not multiple." +
            "Return only the weak area in a single sentence, do not include any other text or explanation." +
            "Example output: 'The student is struggling with understanding how variables work in loops, specifically how variable values update with each iteration.'" +
            "return ONLY valid JSON, do not include markdown, backticks, commentary, or extra text.", // to ensure parsable
        },
      ],
    });

    res.json({ output: response.choices[0].message });
  } catch (err) {
    console.error("OpenAI error", err);
    res.status(500).json({ error: "Failed to generate learning response" });
  }
});

// router.post("/extract", async (req, res) => { // extract issues for learning purposes
//   try {
//     const { messages } = req.body;
//     if (!messages || !Array.isArray(messages)) {
//       return res.status(400).json({ error: "Invalid messages format, expected an array of messages" });
//     }

export default router;
