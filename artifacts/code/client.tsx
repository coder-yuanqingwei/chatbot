import { useCallback } from "react";
import { toast } from "sonner";
import { CodeEditor } from "@/components/chat/code-editor";
import {
  Console,
  type ConsoleOutput,
  type ConsoleOutputContent,
} from "@/components/chat/console";
import { Artifact } from "@/components/chat/create-artifact";
import {
  CopyIcon,
  LogsIcon,
  MessageIcon,
  PlayIcon,
  RedoIcon,
  UndoIcon,
} from "@/components/chat/icons";
import { generateUUID } from "@/lib/utils";

type CodeLanguage = "python" | "javascript" | "typescript";

function detectLanguage(code: string): CodeLanguage {
  if (
    code.trimStart().startsWith("#") ||
    (code.includes("def ") && code.includes(":")) ||
    (code.includes("from ") && code.includes(" import ")) ||
    (code.includes("import ") && code.includes("print(")) ||
    code.includes("elif ") ||
    code.includes("elif(")
  ) {
    return "python";
  }
  if (
    /:\s*(string|number|boolean)\b/.test(code) ||
    code.includes("interface ") ||
    (code.includes("type ") && code.includes("=")) ||
    code.includes(" as string") ||
    code.includes(" as number") ||
    (/<[A-Z]\w*>/.test(code) && code.includes("=>"))
  ) {
    return "typescript";
  }

  return "javascript";
}

const PYTHON_OUTPUT_HANDLERS = {
  basic: `
    # Basic output capture setup
  `,
  matplotlib: `
    import io
    import base64
    from matplotlib import pyplot as plt

    # Clear any existing plots
    plt.clf()
    plt.close('all')

    # Switch to agg backend
    plt.switch_backend('agg')

    def setup_matplotlib_output():
        def custom_show():
            if plt.gcf().get_size_inches().prod() * plt.gcf().dpi ** 2 > 25_000_000:
                print("Warning: Plot size too large, reducing quality")
                plt.gcf().set_dpi(100)

            png_buf = io.BytesIO()
            plt.savefig(png_buf, format='png')
            png_buf.seek(0)
            png_base64 = base64.b64encode(png_buf.read()).decode('utf-8')
            print(f'data:image/png;base64,{png_base64}')
            png_buf.close()

            plt.clf()
            plt.close('all')

        plt.show = custom_show
  `,
};

function detectRequiredPythonHandlers(code: string): string[] {
  const handlers: string[] = ["basic"];

  if (code.includes("matplotlib") || code.includes("plt.")) {
    handlers.push("matplotlib");
  }

  return handlers;
}

function executeJavaScript(
  code: string,
  onOutput: (output: ConsoleOutputContent) => void,
  isTS = false
): Promise<void> {
  return new Promise((resolve, reject) => {
    const workerCode = `
      self.onmessage = async function(e) {
        self.console.log = function(...args) {
          self.postMessage({ type: 'text', value: args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)).join(' ') });
        };
        self.console.error = function(...args) {
          self.postMessage({ type: 'text', value: '\\u274C ' + args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)).join(' ') });
        };
        self.console.warn = function(...args) {
          self.postMessage({ type: 'text', value: '\\u26A0 ' + args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)).join(' ') });
        };
        self.console.info = function(...args) {
          self.postMessage({ type: 'text', value: args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)).join(' ') });
        };

        try {
          let code = e.data;
          ${
            isTS
              ? `
          try {
            const sucrase = await import('https://esm.sh/sucrase@3.35.1');
            const result = sucrase.transform(code, { transforms: ['typescript'] });
            code = result.code;
          } catch (transpileErr) {
            self.postMessage({ type: 'error', value: 'TypeScript transpilation failed: ' + (transpileErr.message || String(transpileErr)) });
            return;
          }
          `
              : ""
          }
          const result = eval(code);
          if (result !== undefined) {
            self.postMessage({ type: 'text', value: typeof result === 'object' ? JSON.stringify(result, null, 2) : String(result) });
          }
          self.postMessage({ type: 'done' });
        } catch (error) {
          self.postMessage({ type: 'error', value: error.message || String(error) });
        }
      };
    `;

    const blob = new Blob([workerCode], { type: "application/javascript" });
    const url = URL.createObjectURL(blob);
    const worker = new Worker(url);

    const timeout = setTimeout(() => {
      worker.terminate();
      URL.revokeObjectURL(url);
      reject(new Error("Execution timed out (10s)"));
    }, 10_000);

    worker.onmessage = (e) => {
      const data = e.data;
      if (data.type === "done") {
        clearTimeout(timeout);
        worker.terminate();
        URL.revokeObjectURL(url);
        resolve();
      } else if (data.type === "error") {
        clearTimeout(timeout);
        worker.terminate();
        URL.revokeObjectURL(url);
        reject(new Error(data.value));
      } else {
        onOutput({ type: data.type as "text" | "image", value: data.value });
      }
    };

    worker.onerror = (e) => {
      clearTimeout(timeout);
      worker.terminate();
      URL.revokeObjectURL(url);
      reject(new Error(e.message || "Worker error"));
    };

    worker.postMessage(code);
  });
}

async function executeTypeScript(
  code: string,
  onOutput: (output: ConsoleOutputContent) => void
): Promise<void> {
  return executeJavaScript(code, onOutput, true);
}

async function executePython(
  code: string,
  setMetadata: (fn: (m: Metadata) => Metadata) => void,
  runId: string,
  outputContent: ConsoleOutputContent[]
): Promise<void> {
  // @ts-expect-error - loadPyodide is not defined
  const currentPyodideInstance = await globalThis.loadPyodide({
    indexURL: "https://cdn.jsdelivr.net/pyodide/v0.23.4/full/",
  });

  currentPyodideInstance.setStdout({
    batched: (output: string) => {
      outputContent.push({
        type: output.startsWith("data:image/png;base64") ? "image" : "text",
        value: output,
      });
    },
  });

  await currentPyodideInstance.loadPackagesFromImports(code, {
    messageCallback: (message: string) => {
      setMetadata((metadata) => ({
        ...metadata,
        outputs: [
          ...metadata.outputs.filter((output) => output.id !== runId),
          {
            contents: [{ type: "text", value: message }],
            id: runId,
            status: "loading_packages",
          },
        ],
      }));
    },
  });

  const requiredHandlers = detectRequiredPythonHandlers(code);
  await requiredHandlers.reduce<Promise<void>>(async (previous, handler) => {
    await previous;

    if (
      !PYTHON_OUTPUT_HANDLERS[handler as keyof typeof PYTHON_OUTPUT_HANDLERS]
    ) {
      return;
    }

    await currentPyodideInstance.runPythonAsync(
      PYTHON_OUTPUT_HANDLERS[handler as keyof typeof PYTHON_OUTPUT_HANDLERS]
    );

    if (handler === "matplotlib") {
      await currentPyodideInstance.runPythonAsync("setup_matplotlib_output()");
    }
  }, Promise.resolve());

  await currentPyodideInstance.runPythonAsync(code);
}

type Metadata = {
  outputs: ConsoleOutput[];
};

const codeArtifactContent: Artifact<"code", Metadata>["content"] =
  function CodeArtifactContent({ metadata, setMetadata, ...props }) {
    const clearConsoleOutputs = useCallback(() => {
      setMetadata((currentMetadata) => ({
        ...currentMetadata,
        outputs: [],
      }));
    }, [setMetadata]);

    return (
      <>
        <div className="relative min-h-[200px]">
          <CodeEditor {...props} />
        </div>

        {metadata?.outputs ? (
          <Console
            consoleOutputs={metadata.outputs}
            setConsoleOutputs={clearConsoleOutputs}
          />
        ) : null}
      </>
    );
  };

export const codeArtifact = new Artifact<"code", Metadata>({
  actions: [
    {
      description: "Execute code",
      icon: <PlayIcon size={18} />,
      label: "Run",
      onClick: async ({ content, setMetadata }) => {
        const runId = generateUUID();
        const outputContent: ConsoleOutputContent[] = [];

        setMetadata((metadata) => ({
          ...metadata,
          outputs: [
            ...metadata.outputs,
            {
              contents: [],
              id: runId,
              status: "in_progress",
            },
          ],
        }));

        try {
          const lang = detectLanguage(content);

          if (lang === "typescript") {
            await executeTypeScript(content, (output) => {
              outputContent.push(output);
            });
          } else if (lang === "javascript") {
            await executeJavaScript(content, (output) => {
              outputContent.push(output);
            });
          } else {
            await executePython(content, setMetadata, runId, outputContent);
          }

          setMetadata((metadata) => ({
            ...metadata,
            outputs: [
              ...metadata.outputs.filter((output) => output.id !== runId),
              {
                contents: outputContent,
                id: runId,
                status: "completed",
              },
            ],
          }));
        } catch (error: unknown) {
          setMetadata((metadata) => ({
            ...metadata,
            outputs: [
              ...metadata.outputs.filter((output) => output.id !== runId),
              {
                contents: [
                  {
                    type: "text",
                    value:
                      error instanceof Error ? error.message : String(error),
                  },
                ],
                id: runId,
                status: "failed",
              },
            ],
          }));
        }
      },
    },
    {
      description: "View Previous version",
      icon: <UndoIcon size={18} />,
      isDisabled: ({ currentVersionIndex }) => {
        if (currentVersionIndex === 0) {
          return true;
        }

        return false;
      },
      onClick: ({ handleVersionChange }) => {
        handleVersionChange("prev");
      },
    },
    {
      description: "View Next version",
      icon: <RedoIcon size={18} />,
      isDisabled: ({ isCurrentVersion }) => {
        if (isCurrentVersion) {
          return true;
        }

        return false;
      },
      onClick: ({ handleVersionChange }) => {
        handleVersionChange("next");
      },
    },
    {
      description: "Copy code to clipboard",
      icon: <CopyIcon size={18} />,
      onClick: ({ content }) => {
        navigator.clipboard.writeText(content);
        toast.success("Copied to clipboard!");
      },
    },
  ],
  content: codeArtifactContent,
  description:
    "Useful for code generation. Supports Python (via Pyodide), JavaScript, and TypeScript (via browser execution).",
  initialize: ({ setMetadata }) => {
    setMetadata({
      outputs: [],
    });
  },
  kind: "code",
  onStreamPart: ({ streamPart, setArtifact }) => {
    if (streamPart.type === "data-codeDelta") {
      setArtifact((draftArtifact) => ({
        ...draftArtifact,
        content: streamPart.data,
        isVisible:
          draftArtifact.status === "streaming" &&
          draftArtifact.content.length > 300 &&
          draftArtifact.content.length < 310
            ? true
            : draftArtifact.isVisible,
        status: "streaming",
      }));
    }
  },
  toolbar: [
    {
      description: "Add comments",
      icon: <MessageIcon />,
      onClick: ({ sendMessage }) => {
        sendMessage({
          parts: [
            {
              text: "Add comments to the code snippet for understanding",
              type: "text",
            },
          ],
          role: "user",
        });
      },
    },
    {
      description: "Add logs",
      icon: <LogsIcon />,
      onClick: ({ sendMessage }) => {
        sendMessage({
          parts: [
            {
              text: "Add logs to the code snippet for debugging",
              type: "text",
            },
          ],
          role: "user",
        });
      },
    },
  ],
});
