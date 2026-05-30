export const MAX_FILE_BYTES = 25 * 1024 * 1024; // 25 MB

export class FileTooLargeError extends Error {
  fileName: string;
  size: number;
  constructor(fileName: string, size: number) {
    super(
      `File "${fileName}" is too large — 25MB maximum. Try splitting it or compressing it first.`,
    );
    this.name = "FileTooLargeError";
    this.fileName = fileName;
    this.size = size;
  }
}

/**
 * Throws FileTooLargeError if the file exceeds MAX_FILE_BYTES.
 * Call this at every entry point that ingests an external file
 * (paste, Finder drop, file-picker upload) BEFORE base64-encoding,
 * to avoid blowing up SQLite / Supabase with huge blobs.
 */
export function assertFileSize(file: File): void {
  if (file.size > MAX_FILE_BYTES) {
    throw new FileTooLargeError(file.name || "Untitled", file.size);
  }
}

/**
 * Partition a list of files into (validFiles, oversized). For each oversized
 * file, logs a warning and shows a single alert with that file's name.
 * Use this in user-facing handlers (paste, drop, file-picker) so the rest
 * of the batch still goes through after a too-large file is skipped.
 */
export function filterFilesBySize(files: File[]): File[] {
  const valid: File[] = [];
  for (const file of files) {
    if (file.size > MAX_FILE_BYTES) {
      const name = file.name || "Untitled";
      console.warn(
        `[files] Skipping oversize file "${name}" (${file.size} bytes, max ${MAX_FILE_BYTES}).`,
      );
      alert(
        `File "${name}" is too large — 25MB maximum. Try splitting it or compressing it first.`,
      );
    } else {
      valid.push(file);
    }
  }
  return valid;
}

export async function fileToBase64(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode.apply(
      null,
      Array.from(bytes.subarray(i, i + chunkSize)),
    );
  }
  return btoa(binary);
}

function extFromName(name: string): string {
  const m = name.match(/\.([a-z0-9]+)$/i);
  return m ? m[1].toLowerCase() : "";
}

const EXT_TO_MIME: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
  svg: "image/svg+xml",
  pdf: "application/pdf",
  csv: "text/csv",
  txt: "text/plain",
  md: "text/markdown",
  json: "application/json",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  xls: "application/vnd.ms-excel",
};

export function inferMime(file: { name?: string; type?: string }): string {
  if (file.type && file.type !== "application/octet-stream") return file.type;
  const ext = file.name ? extFromName(file.name) : "";
  return EXT_TO_MIME[ext] ?? "application/octet-stream";
}

export interface UploadedFile {
  name: string;
  mime: string;
  data: string;
  size: number;
}

export async function fileToUpload(file: File, fallbackName?: string): Promise<UploadedFile> {
  assertFileSize(file);
  const data = await fileToBase64(file);
  const name = file.name || fallbackName || "Untitled";
  return {
    name,
    mime: inferMime({ name, type: file.type }),
    data,
    size: file.size,
  };
}
