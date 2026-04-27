import { jsonrepair } from "jsonrepair";

const parseDebugResponse = (rawDebugResponse = "") => {
  const cleaned = rawDebugResponse
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  try {
    return {
      parsed: JSON.parse(cleaned),
      raw: rawDebugResponse,
      warning: null,
    };
  } catch {
    try {
      const repaired = jsonrepair(cleaned);

      return {
        parsed: JSON.parse(repaired),
        raw: rawDebugResponse,
        warning:
          "Model returned malformed JSON, but it was repaired successfully.",
      };
    } catch {
      return {
        parsed: null,
        raw: rawDebugResponse,
        warning: "Model did not return valid JSON.",
      };
    }
  }
};

export default parseDebugResponse;
