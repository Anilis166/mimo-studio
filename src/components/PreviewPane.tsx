"use client";
import {
  Sandpack,
  type SandpackPredefinedTemplate,
} from "@codesandbox/sandpack-react";

interface PreviewPaneProps {
  files: Record<string, string>;
}

export function PreviewPane({ files }: PreviewPaneProps) {
  const template: SandpackPredefinedTemplate = "react";
  return (
    <div className="rounded-xl overflow-hidden border border-white/10 bg-zinc-950">
      <Sandpack
        template={template}
        files={files}
        theme="dark"
        options={{
          showTabs: true,
          showLineNumbers: true,
          showInlineErrors: true,
          wrapContent: true,
          editorHeight: 540,
          showConsole: true,
          showConsoleButton: true,
        }}
        customSetup={{
          dependencies: {
            "@testing-library/react": "^14.0.0",
            "@testing-library/dom": "^9.3.0",
            "@testing-library/user-event": "^14.5.1",
          },
        }}
      />
    </div>
  );
}
