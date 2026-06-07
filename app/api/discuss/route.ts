import Anthropic from "@anthropic-ai/sdk";
import {
  EXPERTS,
  ROUND_PROMPTS,
  SYNTHESIS_SYSTEM_PROMPT,
} from "@/lib/experts";
import { extractJSON } from "@/lib/extractJSON";
import type { Expert, StreamEvent } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MODEL = "claude-sonnet-4-20250514";

interface DiscussionRecord {
  expert: Expert;
  round: number;
  roundLabel: string;
  text: string;
}

function buildUserMessage(
  theme: string,
  roundPrompt: string,
  history: DiscussionRecord[],
): string {
  let msg = `テーマ:「${theme}」\n\n${roundPrompt}`;
  if (history.length > 0) {
    msg += "\n\nこれまでの議論:\n";
    for (const h of history) {
      msg += `【${h.expert.role}・${h.roundLabel}】${h.text}\n`;
    }
  }
  return msg;
}

function buildSynthesisMessage(
  theme: string,
  history: DiscussionRecord[],
): string {
  let msg = `テーマ:「${theme}」\n\n以下は3人の専門家による3ラウンドの議論です。これをもとにJSON形式の提案書を作成してください。\n\n`;
  for (const h of history) {
    msg += `【${h.expert.role}・${h.roundLabel}】${h.text}\n`;
  }
  return msg;
}

export async function POST(req: Request) {
  let theme: string;
  try {
    const body = await req.json();
    theme = (body?.theme ?? "").toString().trim();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
  if (!theme) {
    return new Response(JSON.stringify({ error: "theme is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: "ANTHROPIC_API_KEY is not set" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }

  const client = new Anthropic({ apiKey });
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: StreamEvent) => {
        const name = event.type === "done" ? "done" : event.type === "error" ? "error" : "message";
        controller.enqueue(
          encoder.encode(`event: ${name}\ndata: ${JSON.stringify(event)}\n\n`),
        );
      };

      const history: DiscussionRecord[] = [];

      try {
        for (let r = 0; r < ROUND_PROMPTS.length; r++) {
          const round = ROUND_PROMPTS[r];
          send({ type: "round_start", round: r, label: round.label });

          for (const expert of EXPERTS) {
            send({
              type: "expert_start",
              expertId: expert.id,
              expertName: expert.name,
            });

            const userMessage = buildUserMessage(theme, round.prompt, history);
            const resp = await client.messages.create({
              model: MODEL,
              max_tokens: 1024,
              system: expert.systemPrompt,
              messages: [{ role: "user", content: userMessage }],
            });

            const text = resp.content
              .filter((b): b is Anthropic.TextBlock => b.type === "text")
              .map((b) => b.text)
              .join("")
              .trim();

            const roundLabel = `R${r + 1}`;
            history.push({ expert, round: r, roundLabel, text });
            send({
              type: "expert_response",
              expertId: expert.id,
              text,
              round: r,
              roundLabel,
            });
          }
        }

        send({ type: "synthesis_start" });
        const synthMessage = buildSynthesisMessage(theme, history);
        const synthResp = await client.messages.create({
          model: MODEL,
          max_tokens: 4096,
          system: SYNTHESIS_SYSTEM_PROMPT,
          messages: [{ role: "user", content: synthMessage }],
        });
        const synthText = synthResp.content
          .filter((b): b is Anthropic.TextBlock => b.type === "text")
          .map((b) => b.text)
          .join("");
        const proposal = extractJSON(synthText);
        send({ type: "proposal", data: proposal });
        send({ type: "done" });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        send({ type: "error", message });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
