import { useState } from "react";
import Header from "../components/Header";
import CodeEditor from "../components/CodeEditor";
import type { ErrorResponse } from "../models/responseModel";
import parseErrorResponse from "../utils/parseErroeMessage";

function Home() {
  const [aiExplanation, setAiExplanation] = useState("");
  const [userCode, setUserCode] = useState("Start typing...");

  const handleSubmit = async () => {
    const response = await fetch("http://localhost:5000/api/debug/js", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: userCode }),
    });

    const data = await response.json();

    const modelErrorAnswer: ErrorResponse = parseErrorResponse(data.result);

    setAiExplanation(
      `🛠️ Error Type: ${modelErrorAnswer.errorType}

      🔍 Error in Code: ${modelErrorAnswer.errorInCode}

      ❓ What Went Wrong: ${modelErrorAnswer.whatWentWrong}

      ✅ Hint to Fix: ${modelErrorAnswer.hintToFix}`
    );
  };

  return (
    <>
      <Header></Header>
      <div className="flex flex-col items-start justify-center p-10 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full pt-20">
          {/* Editor */}
          <div className="space-y-2 w-full">
          <h1>Code Editor</h1>
          <CodeEditor code={userCode} setCode={setUserCode} />
          </div>

      {/* AI Output */}
      
        <div className="flex flex-col space-y-2 w-full">
          <h1>AI Explanation</h1>
          <div className="p-4 border rounded overflow-auto max-h-96 min-h-40 h-full">
  <pre className="whitespace-pre-wrap break-words font-mono text-black">
    {aiExplanation}
  </pre>
</div>
        </div>
      </div>

        {/*Editor buttons*/}
        <div className="flex items-start space-x-2">
          <button
            className="bg-green-400 border-2 h-15 w-20 rounded-2xl"
            onClick={handleSubmit}
          >
            Run
          </button>
          <button className="bg-amber-300 border-2 h-15 w-20 rounded-2xl">
            Clear
          </button>
        </div>
      </div>
    </>
  );
}

export default Home;
