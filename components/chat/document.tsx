import { memo, useCallback } from "react";
import { toast } from "sonner";
import { useArtifact } from "@/hooks/use-artifact";
import { useI18n } from "@/lib/i18n/provider";
import type { ArtifactKind } from "./artifact";
import { FileIcon, LoaderIcon, MessageIcon, PencilEditIcon } from "./icons";

const getActionKey = (
  type: "create" | "update" | "request-suggestions",
  tense: "present" | "past"
) => {
  switch (type) {
    case "create":
      return tense === "present" ? "chat.doc.creating" : "chat.doc.created";
    case "update":
      return tense === "present" ? "chat.doc.updating" : "chat.doc.updated";
    case "request-suggestions":
      return tense === "present"
        ? "chat.doc.adding_suggestions"
        : "chat.doc.added_suggestions";
    default:
      return null;
  }
};

type DocumentToolResultProps = {
  type: "create" | "update" | "request-suggestions";
  result: { id: string; title: string; kind: ArtifactKind };
  isReadonly: boolean;
};

function PureDocumentToolResult({
  type,
  result,
  isReadonly,
}: DocumentToolResultProps) {
  const { setArtifact } = useArtifact();
  const { t } = useI18n();
  const handleClick = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      if (isReadonly) {
        toast.error(t("chat.doc.shared_not_supported"));
        return;
      }

      const rect = event.currentTarget.getBoundingClientRect();

      const boundingBox = {
        height: rect.height,
        left: rect.left,
        top: rect.top,
        width: rect.width,
      };

      setArtifact((currentArtifact) => ({
        boundingBox,
        content: currentArtifact.content,
        documentId: result.id,
        isVisible: true,
        kind: result.kind,
        status: "idle",
        title: result.title,
      }));
    },
    [isReadonly, result, setArtifact, t]
  );

  return (
    <button
      className="flex w-fit cursor-pointer flex-row items-center gap-2 rounded-xl border bg-background px-3 py-2"
      onClick={handleClick}
      type="button"
    >
      <div className="text-muted-foreground">
        {type === "create" ? (
          <FileIcon />
        ) : type === "update" ? (
          <PencilEditIcon />
        ) : type === "request-suggestions" ? (
          <MessageIcon />
        ) : null}
      </div>
      <div className="text-left">
        {`${t(getActionKey(type, "past") || "")} "${result.title}"`}
      </div>
    </button>
  );
}

export const DocumentToolResult = memo(PureDocumentToolResult, () => true);

type DocumentToolCallProps = {
  type: "create" | "update" | "request-suggestions";
  args:
    | { title: string; kind: ArtifactKind }
    | { id: string; description: string }
    | { documentId: string };
  isReadonly: boolean;
};
function PureDocumentToolCall({
  type,
  args,
  isReadonly,
}: DocumentToolCallProps) {
  const { setArtifact } = useArtifact();
  const { t } = useI18n();
  const handleClick = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      if (isReadonly) {
        toast.error(t("chat.doc.shared_not_supported"));
        return;
      }

      const rect = event.currentTarget.getBoundingClientRect();

      const boundingBox = {
        height: rect.height,
        left: rect.left,
        top: rect.top,
        width: rect.width,
      };

      setArtifact((currentArtifact) => ({
        ...currentArtifact,
        boundingBox,
        isVisible: true,
      }));
    },
    [isReadonly, setArtifact, t]
  );

  return (
    <button
      className="cursor pointer flex w-fit flex-row items-start justify-between gap-3 rounded-xl border px-3 py-2"
      onClick={handleClick}
      type="button"
    >
      <div className="flex flex-row items-start gap-3">
        <div className="mt-1 text-neutral-500">
          {type === "create" ? (
            <FileIcon />
          ) : type === "update" ? (
            <PencilEditIcon />
          ) : type === "request-suggestions" ? (
            <MessageIcon />
          ) : null}
        </div>

        <div className="text-left">
          {`${t(getActionKey(type, "present") || "")} ${
            type === "create" && "title" in args && args.title
              ? `"${args.title}"`
              : type === "update" && "description" in args
                ? `"${args.description}"`
                : type === "request-suggestions"
                  ? t("chat.doc.for_document")
                  : ""
          }`}
        </div>
      </div>

      <div className="mt-1 animate-spin">{<LoaderIcon />}</div>
    </button>
  );
}

export const DocumentToolCall = memo(PureDocumentToolCall, () => true);
