import { BlockNoteEditor } from "@blocknote/core";
import JSZip from "jszip";
import type { AtlasNode } from "../types";
import { getMindmapEditor } from "./mindmapRegistry";
import { useStore } from "./store";

function sanitizeFileName(name: string): string {
  return name.replace(/[/\\?%*:|"<>]/g, "_").slice(0, 200) || "Untitled";
}

export function downloadBlob(name: string, blob: Blob): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function downloadText(name: string, text: string, mime: string): void {
  downloadBlob(name, new Blob([text], { type: mime }));
}

// ---------- Doc exports (BlockNote) ----------

async function blocksFromNode(node: AtlasNode) {
  if (!node.doc_content) return null;
  try {
    const blocks = JSON.parse(node.doc_content);
    if (!Array.isArray(blocks) || blocks.length === 0) return null;
    return blocks;
  } catch {
    return null;
  }
}

export async function exportDocAsMarkdown(node: AtlasNode): Promise<void> {
  const blocks = await blocksFromNode(node);
  if (!blocks) throw new Error("This document is empty.");
  const editor = BlockNoteEditor.create({ initialContent: blocks });
  const md = await editor.blocksToMarkdownLossy();
  downloadText(`${sanitizeFileName(node.title)}.md`, md, "text/markdown");
}

export async function exportDocAsHtml(node: AtlasNode): Promise<void> {
  const blocks = await blocksFromNode(node);
  if (!blocks) throw new Error("This document is empty.");
  const editor = BlockNoteEditor.create({ initialContent: blocks });
  const html = await editor.blocksToHTMLLossy();
  const wrapped = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${escapeHtml(node.title)}</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, "Inter", sans-serif; max-width: 760px; margin: 2.5rem auto; padding: 0 1.25rem; color: #1B1B1A; line-height: 1.6; }
  h1 { font-size: 2rem; margin: 1.5rem 0 0.75rem; }
  h2 { font-size: 1.5rem; margin: 1.25rem 0 0.5rem; }
  h3 { font-size: 1.25rem; margin: 1rem 0 0.5rem; }
  p { margin: 0.5rem 0; }
  ul, ol { padding-left: 1.5rem; }
  table { border-collapse: collapse; width: 100%; margin: 1rem 0; }
  th, td { border: 1px solid #D9D6CD; padding: 0.4rem 0.6rem; text-align: left; }
  code { background: #F2F1EC; padding: 0.1em 0.3em; border-radius: 3px; font-family: ui-monospace, monospace; }
  pre { background: #F2F1EC; padding: 0.75rem; border-radius: 6px; overflow-x: auto; }
</style>
</head>
<body>
<h1>${escapeHtml(node.title)}</h1>
${html}
</body>
</html>`;
  downloadText(`${sanitizeFileName(node.title)}.html`, wrapped, "text/html");
}

export async function exportDocAsPdf(node: AtlasNode): Promise<void> {
  const blocks = await blocksFromNode(node);
  if (!blocks) throw new Error("This document is empty.");
  const editor = BlockNoteEditor.create({ initialContent: blocks });
  const html = await editor.blocksToHTMLLossy();
  const printable = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${escapeHtml(node.title)}</title>
<style>
  @page { margin: 2cm; }
  body { font-family: -apple-system, BlinkMacSystemFont, "Inter", sans-serif; color: #111; line-height: 1.55; }
  h1 { font-size: 1.8rem; margin: 0 0 0.5rem; }
  h2 { font-size: 1.35rem; margin: 1.1rem 0 0.4rem; }
  h3 { font-size: 1.15rem; margin: 0.9rem 0 0.3rem; }
  p { margin: 0.4rem 0; }
  ul, ol { padding-left: 1.4rem; }
  table { border-collapse: collapse; width: 100%; margin: 0.75rem 0; }
  th, td { border: 1px solid #ccc; padding: 0.3rem 0.5rem; }
  code { background: #f0f0ee; padding: 0.05em 0.25em; border-radius: 3px; font-family: ui-monospace, monospace; }
  pre { background: #f0f0ee; padding: 0.6rem; border-radius: 4px; }
</style>
</head>
<body>
<h1>${escapeHtml(node.title)}</h1>
${html}
<script>
  window.addEventListener("load", () => {
    setTimeout(() => window.print(), 100);
  });
</script>
</body>
</html>`;
  const blob = new Blob([printable], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  // Open in a new window which will auto-print, letting the user "Save as PDF"
  // from the system print dialog.
  const win = window.open(url, "_blank");
  if (!win) {
    URL.revokeObjectURL(url);
    throw new Error(
      "Could not open print window. Allow popups or use the Markdown / HTML export instead.",
    );
  }
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

// ---------- Mindmap exports (tldraw) ----------

export async function exportMindmapAsPng(node: AtlasNode): Promise<void> {
  const editor = getMindmapEditor(node.id);
  if (!editor) {
    throw new Error(
      "Open the Mindmap (click the node, switch to Mindmap view) before exporting.",
    );
  }
  const shapeIds = Array.from(editor.getCurrentPageShapeIds());
  if (shapeIds.length === 0) {
    throw new Error("Mindmap is empty — nothing to export.");
  }
  const result = await editor.toImage(shapeIds, {
    format: "png",
    background: true,
    padding: 20,
  });
  downloadBlob(`${sanitizeFileName(node.title)}.png`, result.blob);
}

export async function exportMindmapAsSvg(node: AtlasNode): Promise<void> {
  const editor = getMindmapEditor(node.id);
  if (!editor) {
    throw new Error("Open the Mindmap before exporting.");
  }
  const shapeIds = Array.from(editor.getCurrentPageShapeIds());
  if (shapeIds.length === 0) {
    throw new Error("Mindmap is empty — nothing to export.");
  }
  const result = await editor.toImage(shapeIds, {
    format: "svg",
    background: true,
    padding: 20,
  });
  downloadBlob(`${sanitizeFileName(node.title)}.svg`, result.blob);
}

// ---------- Whole-subtree exports (ZIP / multi-doc PDF) ----------

function extFromMime(mime: string | null | undefined, fileName: string | null | undefined): string {
  if (fileName) {
    const m = fileName.match(/\.([a-z0-9]+)$/i);
    if (m) return "." + m[1].toLowerCase();
  }
  if (!mime) return ".bin";
  if (mime.startsWith("image/png")) return ".png";
  if (mime.startsWith("image/jpeg")) return ".jpg";
  if (mime.startsWith("image/gif")) return ".gif";
  if (mime.startsWith("image/webp")) return ".webp";
  if (mime.startsWith("image/svg")) return ".svg";
  if (mime === "application/pdf") return ".pdf";
  if (mime === "text/csv") return ".csv";
  if (mime === "text/markdown") return ".md";
  if (mime.startsWith("text/")) return ".txt";
  if (mime.includes("spreadsheet")) return ".xlsx";
  if (mime.includes("wordprocessingml")) return ".docx";
  return ".bin";
}

function base64ToUint8Array(b64: string): Uint8Array {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

interface TreeNode {
  node: AtlasNode;
  children: TreeNode[];
}

function buildTree(rootId: string): TreeNode | null {
  const s = useStore.getState();
  const node = s.nodes[rootId];
  if (!node) return null;
  const childIds = s.childrenByParent[rootId] ?? [];
  return {
    node,
    children: childIds
      .map((id) => buildTree(id))
      .filter((c): c is TreeNode => c !== null),
  };
}

function dedupePath(base: string, used: Set<string>): string {
  if (!used.has(base)) {
    used.add(base);
    return base;
  }
  let i = 2;
  while (used.has(`${base} (${i})`)) i++;
  const out = `${base} (${i})`;
  used.add(out);
  return out;
}

async function blocksToMarkdownText(content: string): Promise<string | null> {
  try {
    const blocks = JSON.parse(content);
    if (!Array.isArray(blocks) || blocks.length === 0) return null;
    const ed = BlockNoteEditor.create({ initialContent: blocks });
    return await ed.blocksToMarkdownLossy();
  } catch {
    return null;
  }
}

async function addTreeToZip(zip: JSZip, tree: TreeNode, parentDir: string): Promise<void> {
  const safeName = sanitizeFileName(tree.node.title || "Untitled");
  const isLeaf = tree.children.length === 0;
  let nodePath: string;

  if (tree.node.kind === "file") {
    // File leaf — write directly into parent folder
    const used = new Set<string>();
    const ext = extFromMime(tree.node.file_mime, tree.node.file_name);
    const fileName = dedupePath(
      tree.node.file_name?.replace(/[/\\?%*:|"<>]/g, "_") || `${safeName}${ext}`,
      used,
    );
    if (tree.node.file_data) {
      const bytes = base64ToUint8Array(tree.node.file_data);
      zip.file(`${parentDir}/${fileName}`, bytes);
    }
    return;
  }

  if (isLeaf) {
    // Doc/Map/Mindmap leaf — write as .md (preferred for docs)
    const md = tree.node.doc_content
      ? await blocksToMarkdownText(tree.node.doc_content)
      : null;
    if (md !== null) {
      zip.file(`${parentDir}/${safeName}.md`, `# ${tree.node.title}\n\n${md}`);
    } else {
      // Empty leaf — still create a placeholder file so structure is preserved
      zip.file(`${parentDir}/${safeName}.md`, `# ${tree.node.title}\n\n_(empty)_`);
    }
    return;
  }

  // Container with children — make a folder
  nodePath = parentDir ? `${parentDir}/${safeName}` : safeName;
  zip.folder(nodePath);

  // If the container itself also has doc content, save it as _index.md inside
  if (tree.node.doc_content) {
    const md = await blocksToMarkdownText(tree.node.doc_content);
    if (md !== null) {
      zip.file(`${nodePath}/_index.md`, `# ${tree.node.title}\n\n${md}`);
    }
  }

  for (const child of tree.children) {
    await addTreeToZip(zip, child, nodePath);
  }
}

export async function exportSubtreeAsZip(rootId: string): Promise<void> {
  const tree = buildTree(rootId);
  if (!tree) throw new Error("Could not find this node.");

  const zip = new JSZip();
  // Always wrap in a single top-level folder named after the root
  const rootName = sanitizeFileName(tree.node.title || "Workspace");
  if (tree.children.length === 0 && tree.node.kind !== "file") {
    // Single empty node — still wrap in folder
    zip.folder(rootName);
    if (tree.node.doc_content) {
      const md = await blocksToMarkdownText(tree.node.doc_content);
      if (md !== null) {
        zip.file(`${rootName}/${rootName}.md`, `# ${tree.node.title}\n\n${md}`);
      }
    }
  } else if (tree.node.kind === "file") {
    // File root — just put it directly in zip
    if (tree.node.file_data) {
      const ext = extFromMime(tree.node.file_mime, tree.node.file_name);
      const fileName = tree.node.file_name || `${rootName}${ext}`;
      zip.file(fileName, base64ToUint8Array(tree.node.file_data));
    }
  } else {
    // Container — write content + recurse children
    zip.folder(rootName);
    if (tree.node.doc_content) {
      const md = await blocksToMarkdownText(tree.node.doc_content);
      if (md !== null) {
        zip.file(`${rootName}/_index.md`, `# ${tree.node.title}\n\n${md}`);
      }
    }
    for (const child of tree.children) {
      await addTreeToZip(zip, child, rootName);
    }
  }

  // README with metadata
  const exportedAt = new Date().toISOString();
  zip.file(
    `${rootName}/README.txt`,
    `Dialogue Atlas export\n` +
      `Root: ${tree.node.title}\n` +
      `Exported: ${exportedAt}\n\n` +
      `Folders mirror the workspace hierarchy. Each Doc/Map page is saved as\n` +
      `Markdown (.md). File attachments are saved in their original format.\n` +
      `Mindmaps are NOT included — open each mindmap and use the Export → PNG\n` +
      `button in the header to save them.\n`,
  );

  const blob = await zip.generateAsync({ type: "blob", compression: "DEFLATE" });
  downloadBlob(`${rootName}.zip`, blob);
}

export async function exportSubtreeAsPdf(rootId: string): Promise<void> {
  const tree = buildTree(rootId);
  if (!tree) throw new Error("Could not find this node.");

  const sections: string[] = [];

  async function visit(t: TreeNode, depth: number): Promise<void> {
    const titleHtml = escapeHtml(t.node.title || "Untitled");
    sections.push(
      `<section class="atlas-section depth-${depth}"><h${Math.min(depth + 1, 6)}>${titleHtml}</h${Math.min(depth + 1, 6)}>`,
    );
    if (t.node.kind === "file") {
      sections.push(
        `<p class="atlas-file">📎 ${escapeHtml(t.node.file_name ?? "(file attachment)")}</p>`,
      );
    } else if (t.node.doc_content) {
      try {
        const blocks = JSON.parse(t.node.doc_content);
        if (Array.isArray(blocks) && blocks.length > 0) {
          const ed = BlockNoteEditor.create({ initialContent: blocks });
          const html = await ed.blocksToHTMLLossy();
          sections.push(html);
        }
      } catch {
        /* skip invalid */
      }
    }
    for (const child of t.children) {
      await visit(child, depth + 1);
    }
    sections.push(`</section>`);
  }

  await visit(tree, 0);

  const printable = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${escapeHtml(tree.node.title)}</title>
<style>
  @page { margin: 1.8cm; }
  body { font-family: -apple-system, BlinkMacSystemFont, "Inter", sans-serif; color: #111; line-height: 1.5; }
  .atlas-section { page-break-inside: avoid; margin: 0 0 1.5rem; }
  h1 { font-size: 1.9rem; margin: 0 0 0.5rem; }
  h2 { font-size: 1.5rem; margin: 1.2rem 0 0.4rem; page-break-before: always; }
  h3 { font-size: 1.25rem; margin: 1rem 0 0.3rem; }
  h4 { font-size: 1.1rem; margin: 0.8rem 0 0.2rem; }
  p { margin: 0.35rem 0; }
  ul, ol { padding-left: 1.4rem; }
  table { border-collapse: collapse; width: 100%; margin: 0.6rem 0; }
  th, td { border: 1px solid #ccc; padding: 0.3rem 0.5rem; }
  .atlas-file { color: #555; font-style: italic; }
  code { background: #f0f0ee; padding: 0.05em 0.25em; border-radius: 3px; font-family: ui-monospace, monospace; }
</style>
</head>
<body>
${sections.join("\n")}
<script>
  window.addEventListener("load", () => setTimeout(() => window.print(), 100));
</script>
</body>
</html>`;

  const blob = new Blob([printable], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, "_blank");
  if (!win) {
    URL.revokeObjectURL(url);
    throw new Error(
      "Could not open print window. Try ZIP export instead.",
    );
  }
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

// ---------- Map / outline export ----------

export function exportNodeOutlineAsMarkdown(
  node: AtlasNode,
  children: AtlasNode[][],
): void {
  // children[depth] would be wrong — caller passes a flat list traversal.
  // Simpler: caller passes pre-built lines.
  const lines: string[] = [`# ${node.title}`, ""];
  function visit(depth: number, group: AtlasNode[]) {
    for (const c of group) {
      lines.push(`${"  ".repeat(depth)}- ${c.icon ? c.icon + " " : ""}${c.title}`);
    }
  }
  for (let i = 0; i < children.length; i++) visit(i, children[i]);
  downloadText(
    `${sanitizeFileName(node.title)}.md`,
    lines.join("\n"),
    "text/markdown",
  );
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
