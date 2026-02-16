import CodeMirror from "@uiw/react-codemirror";
import { javascript } from "@codemirror/lang-javascript";

interface CodeEditorProps {
  code: string;
  setCode: (value: string) => void;
}

function CodeEditor({ code, setCode }: CodeEditorProps) {
  return (
    <div className="border-2">
      <CodeMirror
        value={code}
        height="350px"
        extensions={[javascript()]}
        onChange={(value) => setCode(value)}
        theme="dark"
      />
    </div>
  );
}

export default CodeEditor;
