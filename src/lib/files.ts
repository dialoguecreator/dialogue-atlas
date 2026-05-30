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
  const data = await fileToBase64(file);
  const name = file.name || fallbackName || "Untitled";
  return {
    name,
    mime: inferMime({ name, type: file.type }),
    data,
    size: file.size,
  };
}
