import Anthropic from "@anthropic-ai/sdk";
import {
  DEVIL,
  DEVIL_ATTACK_PROMPT,
  DEVIL_VERDICT_PROMPT,
  DEVIL_VERDICT_SYSTEM_PROMPT,
  EXPERTS,
  FINAL_SCORE_PROMPT,
  FINAL_SCORE_SYSTEM_PROMPT,
  JUDGE_PHASE2_PROMPT,
  JUDGE_SYSTEM_PROMPT,
  PHASE1_USER_PROMPT,
  PHASE2_ATTACK_PROMPT,
  PHASES,
  PROPOSAL_PROMPT,
  PROPOSAL_SYSTEM_PROMPT,
  REBUTTAL_PROMPT,
  expertById,
} from "@/lib/experts";
import { extractJSON } from "@/lib/extractJSON";
import type {
  BattleProposal,
  DevilVerdict,
  ExpertId,
  FinalScores,
  JudgeScore,
  StreamEvent,
} from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MODEL = "claude-sonnet-4-6";

interface Statement {
  expertId: ExpertId;
  expertName: string;
  text: string;
}

interface Attack {
  attackerId: ExpertId;
  targetId: ExpertId;
  attackerName: string;
  targetName: string;
  text: string;
}

interface Rebuttal {
  expertId: ExpertId;
  expertName: string;
  choice: "A" | "B";
  text: string;
}

const CROSSFIRE_PAIRS: [ExpertId, ExpertId][] = [
  ["tech", "biz"],
  ["biz", "mkt"],
  ["mkt", "tech"],
];

function textOf(resp: Anthropic.Messages.Message): string {
  return resp.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("")
    .trim();
}

function parseRebuttalChoice(text: string): "A" | "B" {
  const head = text.slice(0, 30);
  if (/^\s*[BＢ][:：]/.test(head) || /ピボット/.test(head)) return "B";
  return "A";
}

function formatStatements(statements: Statement[]): string {
  return statements
    .map((s) => `【${s.expertName}】${s.text}`)
    .join("\n");
}

function formatAttacks(attacks: Attack[]): string {
  return attacks
    .map(
      (a) => `【${a.attackerName} → ${a.targetName} への攻撃】${a.text}`,
    )
    .join("\n");
}

function formatFullContext(
  statements: Statement[],
  attacks: Attack[],
  devilAttack: string,
  rebuttals: Rebuttal[],
): string {
  const parts: string[] = [];
  parts.push("[Phase 1 立場表明]");
  parts.push(formatStatements(statements));
  parts.push("\n[Phase 2 相互攻撃]");
  parts.push(formatAttacks(attacks));
  if (devilAttack) {
    parts.push("\n[Phase 3 悪魔の攻撃]");
    parts.push(`【${DEVIL.name}】${devilAttack}`);
  }
  if (rebuttals.length > 0) {
    parts.push("\n[Phase 3 各専門家の反論]");
    parts.push(
      rebuttals
        .map(
          (r) =>
            `【${r.expertName}・選択${r.choice}(${r.choice === "A" ? "防御" : "ピボット"})】${r.text}`,
        )
        .join("\n"),
    );
  }
  return parts.join("\n");
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
        const name =
          event.type === "done"
            ? "done"
            : event.type === "error"
              ? "error"
              : "message";
        controller.enqueue(
          encoder.encode(
            `event: ${name}\ndata: ${JSON.stringify(event)}\n\n`,
          ),
        );
      };

      const call = async (params: Anthropic.Messages.MessageCreateParamsNonStreaming) => {
        return await client.messages.create(params);
      };

      try {
        // ===== Phase 1: Opening Statements =====
        send({
          type: "phase_start",
          phase: 1,
          name: PHASES[0].name,
          icon: PHASES[0].icon,
        });
        const statements: Statement[] = [];
        for (const expert of EXPERTS) {
          send({
            type: "expert_start",
            expertId: expert.id,
            expertName: expert.name,
            phase: 1,
          });
          const resp = await call({
            model: MODEL,
            max_tokens: 1024,
            system: expert.systemPrompt,
            messages: [
              { role: "user", content: PHASE1_USER_PROMPT(theme) },
            ],
          });
          const text = textOf(resp);
          statements.push({
            expertId: expert.id,
            expertName: expert.name,
            text,
          });
          send({
            type: "expert_response",
            expertId: expert.id,
            text,
            phase: 1,
          });
        }

        // ===== Phase 2: Cross-Fire =====
        send({
          type: "phase_start",
          phase: 2,
          name: PHASES[1].name,
          icon: PHASES[1].icon,
        });
        const attacks: Attack[] = [];
        const phase1Context = formatStatements(statements);
        for (const [attackerId, targetId] of CROSSFIRE_PAIRS) {
          const attacker = expertById(attackerId);
          const target = expertById(targetId);
          const targetStatement = statements.find(
            (s) => s.expertId === targetId,
          )!.text;
          send({
            type: "attack_start",
            attackerId,
            targetId,
            phase: 2,
          });
          const resp = await call({
            model: MODEL,
            max_tokens: 1024,
            system: attacker.systemPrompt,
            messages: [
              {
                role: "user",
                content: PHASE2_ATTACK_PROMPT(
                  theme,
                  phase1Context,
                  target.name,
                  targetStatement,
                ),
              },
            ],
          });
          const text = textOf(resp);
          attacks.push({
            attackerId,
            targetId,
            attackerName: attacker.name,
            targetName: target.name,
            text,
          });
          send({
            type: "attack_response",
            attackerId,
            targetId,
            text,
            phase: 2,
          });
        }

        // Judge scoring
        const judgeContext =
          `[Phase 1 立場表明]\n${formatStatements(statements)}\n\n[Phase 2 相互攻撃]\n${formatAttacks(attacks)}`;
        const judgeResp = await call({
          model: MODEL,
          max_tokens: 2048,
          system: JUDGE_SYSTEM_PROMPT,
          messages: [
            {
              role: "user",
              content: JUDGE_PHASE2_PROMPT(judgeContext),
            },
          ],
        });
        const judgeScores = extractJSON<JudgeScore>(textOf(judgeResp));
        send({ type: "judge_scores", scores: judgeScores });

        // ===== Phase 3: Boss Battle =====
        send({
          type: "phase_start",
          phase: 3,
          name: PHASES[2].name,
          icon: PHASES[2].icon,
        });

        const devilAttackResp = await call({
          model: MODEL,
          max_tokens: 1536,
          system: DEVIL.systemPrompt,
          messages: [
            {
              role: "user",
              content: DEVIL_ATTACK_PROMPT(
                theme,
                judgeContext,
                JSON.stringify(judgeScores),
              ),
            },
          ],
        });
        const devilAttackText = textOf(devilAttackResp);
        send({ type: "devil_attack", text: devilAttackText });

        const rebuttals: Rebuttal[] = [];
        for (const expert of EXPERTS) {
          send({ type: "rebuttal_start", expertId: expert.id });
          const resp = await call({
            model: MODEL,
            max_tokens: 1024,
            system: expert.systemPrompt,
            messages: [
              {
                role: "user",
                content: REBUTTAL_PROMPT(theme, devilAttackText),
              },
            ],
          });
          const text = textOf(resp);
          const choice = parseRebuttalChoice(text);
          rebuttals.push({
            expertId: expert.id,
            expertName: expert.name,
            choice,
            text,
          });
          send({
            type: "rebuttal_response",
            expertId: expert.id,
            text,
            choice,
          });
        }

        const fullContext = formatFullContext(
          statements,
          attacks,
          devilAttackText,
          rebuttals,
        );

        const verdictResp = await call({
          model: MODEL,
          max_tokens: 2048,
          system: DEVIL_VERDICT_SYSTEM_PROMPT,
          messages: [
            {
              role: "user",
              content: DEVIL_VERDICT_PROMPT(theme, fullContext),
            },
          ],
        });
        const verdict = extractJSON<DevilVerdict>(textOf(verdictResp));
        send({ type: "devil_verdict", verdicts: verdict });

        // ===== Phase 4: Final Scoring =====
        send({
          type: "phase_start",
          phase: 4,
          name: PHASES[3].name,
          icon: PHASES[3].icon,
        });
        const finalResp = await call({
          model: MODEL,
          max_tokens: 2048,
          system: FINAL_SCORE_SYSTEM_PROMPT,
          messages: [
            {
              role: "user",
              content: FINAL_SCORE_PROMPT(
                fullContext,
                JSON.stringify(judgeScores),
                JSON.stringify(verdict),
              ),
            },
          ],
        });
        const finalScores = extractJSON<FinalScores>(textOf(finalResp));
        send({ type: "final_scores", data: finalScores });

        // ===== Phase 5: Synthesis =====
        send({
          type: "phase_start",
          phase: 5,
          name: PHASES[4].name,
          icon: PHASES[4].icon,
        });
        const proposalResp = await call({
          model: MODEL,
          max_tokens: 4096,
          system: PROPOSAL_SYSTEM_PROMPT,
          messages: [
            {
              role: "user",
              content: PROPOSAL_PROMPT(
                theme,
                fullContext,
                JSON.stringify(verdict),
                JSON.stringify(finalScores),
              ),
            },
          ],
        });
        const proposal = extractJSON<BattleProposal>(textOf(proposalResp));
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
