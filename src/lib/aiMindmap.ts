import { getSetting } from "./db";

const DEFAULT_MODEL = "claude-sonnet-4-5-20250929";

export interface AiNode {
  id: string;
  label: string;
}
export interface AiEdge {
  from: string;
  to: string;
  label?: string;
}
export interface AiGraph {
  nodes: AiNode[];
  edges: AiEdge[];
}

export class AiNotConfiguredError extends Error {
  constructor() {
    super("Anthropic API key not configured.");
    this.name = "AiNotConfiguredError";
  }
}

export async function getAiKey(): Promise<string | null> {
  return await getSetting("anthropic_api_key");
}

const SYSTEM_PROMPT = `You are a flowchart/mindmap generator. The user describes what they want; you respond with ONLY a valid JSON object — no prose, no markdown fences, no preamble.

Format:
{
  "nodes": [
    {"id": "n1", "label": "Step name"},
    {"id": "n2", "label": "Another step"}
  ],
  "edges": [
    {"from": "n1", "to": "n2", "label": "optional"}
  ]
}

Rules:
- Use short ids like n1, n2, n3.
- Labels: max ~6 words each. Concrete and specific.
- Aim for 5-20 nodes covering the user's request well.
- Use edges to connect nodes meaningfully — flowcharts have direction (cause → effect, step → step). Mindmaps have a central node with branches.
- Optional edge labels for transitions / conditions.
- Output ONLY the JSON object. No commentary.`;

export async function generateMindmap(prompt: string): Promise<AiGraph> {
  const apiKey = await getAiKey();
  if (!apiKey) throw new AiNotConfiguredError();

  const resp = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: DEFAULT_MODEL,
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(
      `Anthropic API error ${resp.status}: ${text.slice(0, 300)}`,
    );
  }

  const data = await resp.json();
  const content = data?.content?.[0]?.text;
  if (typeof content !== "string") {
    throw new Error("Unexpected API response shape.");
  }

  const json = extractJson(content);
  if (!json) throw new Error("Could not parse JSON from AI response.");
  const parsed = JSON.parse(json) as AiGraph;
  if (!parsed.nodes || !parsed.edges) {
    throw new Error("AI response missing nodes or edges.");
  }
  return parsed;
}

function extractJson(text: string): string | null {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) return fenced[1].trim();
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end === -1) return null;
  return text.slice(start, end + 1);
}
