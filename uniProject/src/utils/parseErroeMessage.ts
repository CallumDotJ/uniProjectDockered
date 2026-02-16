import type { ErrorResponse } from "../models/responseModel";

function parseErrorResponse(rawText: string): ErrorResponse {
  const lines = rawText.split('\n');

    let currentSection: keyof ErrorResponse | "" = "";

  const errorResponse: ErrorResponse = {
    errorType: "",
    errorInCode: "",
    whatWentWrong: "",
    hintToFix: ""
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (line.startsWith("1. Error Type:")) {
      currentSection = "errorType";

      errorResponse.errorType = line.replace("1. Error Type:", "").trim();
    } else if (line.startsWith("2. Error in Code:")) {
      currentSection = "errorInCode";
      errorResponse.errorInCode = line.replace("2. Error in Code:", "").trim();
    } else if (line.startsWith("3. What Went Wrong:")) {
      currentSection = "whatWentWrong";
      errorResponse.whatWentWrong = line.replace("3. What Went Wrong:", "").trim();
    } else if (line.startsWith("4. Hint to Fix:")) {
      currentSection = "hintToFix";
      errorResponse.hintToFix = line.replace("4. Hint to Fix:", "").trim();
    } else {
      
      if (currentSection && line !== "") {
        errorResponse[currentSection] += (errorResponse[currentSection] ? "" : "") + line;
      }
    }
  }

  return errorResponse;
}

export default parseErrorResponse;
