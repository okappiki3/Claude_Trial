export type ExpertId = "tech" | "biz" | "mkt";

export interface Expert {
  id: ExpertId;
  name: string;
  role: string;
  emoji: string;
  color: string;
  systemPrompt: string;
}

export interface Message {
  expert: Expert;
  text: string;
  round: number;
  roundLabel: string;
}

export interface ProposalItem {
  title: string;
  description: string;
  impact: string;
}

export interface RoadmapItem {
  phase: string;
  period: string;
  tasks: string;
}

export interface RiskItem {
  risk: string;
  mitigation: string;
}

export interface Proposal {
  title: string;
  summary: string;
  background: string;
  proposals: ProposalItem[];
  roadmap: RoadmapItem[];
  risks: RiskItem[];
  conclusion: string;
}

export type StreamEvent =
  | { type: "round_start"; round: number; label: string }
  | { type: "expert_start"; expertId: ExpertId; expertName: string }
  | {
      type: "expert_response";
      expertId: ExpertId;
      text: string;
      round: number;
      roundLabel: string;
    }
  | { type: "synthesis_start" }
  | { type: "proposal"; data: Proposal }
  | { type: "error"; message: string }
  | { type: "done" };
