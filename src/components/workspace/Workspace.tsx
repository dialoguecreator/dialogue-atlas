import { useCallback, useState } from "react";
import { useStore } from "../../lib/store";
import { Canvas } from "../canvas/Canvas";
import { ContentMap } from "../canvas/ContentMap";
import { Editor } from "../editor/Editor";
import { FileViewer } from "../files/FileViewer";
import { ShareDialog } from "../share/ShareDialog";
import { EmptyState } from "./EmptyState";
import { NodeHeader } from "./NodeHeader";

export function Workspace() {
  const selectedId = useStore((s) => s.selectedId);
  const node = useStore((s) => (s.selectedId ? s.nodes[s.selectedId] : null));
  const setDocContent = useStore((s) => s.setDocContent);
  const setCanvasContent = useStore((s) => s.setCanvasContent);
  const updateFileData = useStore((s) => s.updateFileData);
  const [shareOpen, setShareOpen] = useState(false);

  const handleDocChange = useCallback(
    (content: string) => {
      if (selectedId) setDocContent(selectedId, content);
    },
    [selectedId, setDocContent],
  );

  const handleCanvasChange = useCallback(
    (content: string) => {
      if (selectedId) setCanvasContent(selectedId, content);
    },
    [selectedId, setCanvasContent],
  );

  const handleFileChange = useCallback(
    (data: string, mime: string, name: string) => {
      if (selectedId) updateFileData(selectedId, data, mime, name);
    },
    [selectedId, updateFileData],
  );

  if (!node) {
    return (
      <main className="flex-1 overflow-hidden">
        <EmptyState />
      </main>
    );
  }

  const view = node.view_mode;
  const isFile = node.kind === "file";

  return (
    <main className="flex flex-1 flex-col overflow-hidden">
      <NodeHeader nodeId={node.id} onShareClick={() => setShareOpen(true)} />
      <div className="relative flex flex-1 overflow-hidden">
        {isFile && (
          <div className="flex-1 overflow-hidden">
            <FileViewer node={node} onChange={handleFileChange} />
          </div>
        )}
        {!isFile && view === "doc" && (
          <div className="flex-1 overflow-hidden">
            <Editor
              nodeId={node.id}
              initialContent={node.doc_content}
              onChange={handleDocChange}
            />
          </div>
        )}
        {!isFile && view === "canvas" && (
          <div className="flex-1 overflow-hidden">
            <ContentMap parentId={node.id} />
          </div>
        )}
        {!isFile && view === "mindmap" && (
          <div className="flex-1 overflow-hidden">
            <Canvas
              nodeId={node.id}
              initialContent={node.canvas_content}
              onChange={handleCanvasChange}
            />
          </div>
        )}
        {!isFile && view === "split" && (
          <>
            <div className="flex-1 overflow-hidden border-r border-line">
              <Editor
                nodeId={node.id}
                initialContent={node.doc_content}
                onChange={handleDocChange}
              />
            </div>
            <div className="flex-1 overflow-hidden">
              <ContentMap parentId={node.id} />
            </div>
          </>
        )}
      </div>

      {shareOpen && (
        <ShareDialog
          nodeId={node.id}
          onClose={() => setShareOpen(false)}
        />
      )}
    </main>
  );
}
