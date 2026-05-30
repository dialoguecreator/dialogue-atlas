import { useStore } from "../../lib/store";
import { NodeItem } from "./NodeItem";

const EMPTY_IDS: readonly string[] = Object.freeze([]) as unknown as readonly string[];

interface NodeTreeProps {
  parentId: string | null;
  depth?: number;
  filteredIds: string[] | null;
  draggingId?: string | null;
}

export function NodeTree({ parentId, depth = 0, filteredIds, draggingId }: NodeTreeProps) {
  const ids = useStore((s) =>
    parentId === null
      ? s.rootIds
      : s.childrenByParent[parentId] ?? EMPTY_IDS,
  );

  const visibleIds = filteredIds
    ? ids.filter((id) => filteredIds.includes(id))
    : ids;

  if (visibleIds.length === 0) return null;

  return (
    <ul className="flex flex-col">
      {visibleIds.map((id) => (
        <NodeItem
          key={id}
          id={id}
          depth={depth}
          filteredIds={filteredIds}
          draggingId={draggingId ?? null}
        />
      ))}
    </ul>
  );
}
