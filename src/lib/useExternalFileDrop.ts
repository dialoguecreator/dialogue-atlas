import { useCallback, useRef, useState } from "react";

interface UseExternalFileDropOptions {
  onFiles: (files: File[]) => void | Promise<void>;
  disabled?: boolean;
}

export function useExternalFileDrop({ onFiles, disabled }: UseExternalFileDropOptions) {
  const [isOver, setIsOver] = useState(false);
  const counter = useRef(0);

  const hasFiles = (e: React.DragEvent) => {
    const types = e.dataTransfer.types;
    if (!types) return false;
    for (let i = 0; i < types.length; i++) {
      if (types[i] === "Files") return true;
    }
    return false;
  };

  const onDragOver = useCallback(
    (e: React.DragEvent) => {
      if (disabled) return;
      if (!hasFiles(e)) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = "copy";
    },
    [disabled],
  );

  const onDragEnter = useCallback(
    (e: React.DragEvent) => {
      if (disabled) return;
      if (!hasFiles(e)) return;
      e.preventDefault();
      counter.current += 1;
      setIsOver(true);
    },
    [disabled],
  );

  const onDragLeave = useCallback(
    (e: React.DragEvent) => {
      if (disabled) return;
      if (!hasFiles(e)) return;
      counter.current = Math.max(0, counter.current - 1);
      if (counter.current === 0) setIsOver(false);
    },
    [disabled],
  );

  const onDrop = useCallback(
    async (e: React.DragEvent) => {
      if (disabled) return;
      if (!hasFiles(e)) return;
      e.preventDefault();
      e.stopPropagation();
      counter.current = 0;
      setIsOver(false);
      const fileList = Array.from(e.dataTransfer.files);
      if (fileList.length === 0) return;
      await onFiles(fileList);
    },
    [onFiles, disabled],
  );

  return {
    isExternalDragOver: isOver,
    dropHandlers: { onDragOver, onDragEnter, onDragLeave, onDrop },
  };
}
