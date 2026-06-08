export type ExpertId = "tech" | "biz" | "mkt";

export interface Expert {
  id: ExpertId;
  name: string;
  role: string;
  emoji: string;
  color: string;
  systemPrompt: string;
}

export interface DevilCharacter {
  id: "devil";
  name: string;
  role: string;
  emoji: string;
  color: string;
  systemPrompt: string;
}

export type BattleMessageType =
  | "statement"
  | "attack"
  | "devil"
  | "rebuttal"
  | "verdict";

export interface BattleMessage {
  type: BattleMessageType;
  expertId?: ExpertId | "devil";
  expertName?: string;
  expertColor?: string;
  expertEmoji?: string;
  targetId?: ExpertId;
  targetName?: string;
  text: string;
  phase: number;
  choice?: "A" | "B";
}

export interface JudgeScoreEntry {
  expertId: ExpertId;
  specificity: number;
  evidence: number;
  originality: number;
  rebuttal_power: number;
  agreement_penalty: number;
  total: number;
  comment: string;
}

export interface JudgeScore {
  scores: JudgeScoreEntry[];
}

export type FatalFlawRating = "S" | "A" | "B" | "C";

export interface DevilVerdictEntry {
  expertId: ExpertId;
  survived: boolean;
  reason: string;
  fatal_flaw_rating: FatalFlawRating;
}

export interface GraveyardEntry {
  argument: string;
  killed_by: string;
  cause_of_death: string;
}

export interface DevilVerdict {
  verdicts: DevilVerdictEntry[];
  graveyard: GraveyardEntry[];
  overall_assessment: string;
}

export type ExpertTitle = "MVP" | "Survivor" | "Defeated";

export interface FinalScoreEntry {
  expertId: ExpertId;
  hp: number;
  breakdown: {
    base: number;
    phase1_bonus: number;
    phase2_bonus: number;
    agreement_penalty: number;
    boss_battle: number;
    pivot_bonus: number;
  };
  rank: number;
  title: ExpertTitle;
}

export interface FinalScores {
  final_scores: FinalScoreEntry[];
  mvp: string;
  mvp_reason: string;
}

export interface ProposalItem {
  title: string;
  description: string;
  impact: string;
  survived_from: string;
  battle_tested: string;
}

export interface RoadmapItem {
  phase: string;
  period: string;
  tasks: string;
}

export interface RiskItem {
  risk: string;
  mitigation: string;
  identified_by: string;
}

export interface SurvivedClaim {
  claim: string;
  supported_by: string;
  confidence: "high" | "medium";
  caveat: string;
}

export interface KilledClaim {
  claim: string;
  killed_by: string;
  cause_of_death: string;
}

export interface UnresolvedQuestion {
  question: string;
  why_unresolved: string;
  depends_on: string;
}

export interface NextQuest {
  quest: string;
  purpose: string;
  owner: string;
}

export interface HypothesisCard {
  hypothesis: string;
  required_evidence: string;
  verdict_criteria: string;
}

export interface DecisionMap {
  title: string;
  battle_summary: string;
  survived: SurvivedClaim[];
  killed: KilledClaim[];
  unresolved: UnresolvedQuestion[];
  next_quests: NextQuest[];
  hypothesis_cards: HypothesisCard[];
  mvp: { name: string; reason: string };
  battle_stats: {
    total_attacks: number;
    arguments_survived: number;
    arguments_killed: number;
    fiercest_moment: string;
  };
  graveyard_note: string;
}

export type StreamEvent =
  | { type: "phase_start"; phase: number; name: string; icon: string }
  | {
      type: "expert_start";
      expertId: ExpertId;
      expertName: string;
      phase: number;
    }
  | {
      type: "expert_response";
      expertId: ExpertId;
      text: string;
      phase: number;
    }
  | {
      type: "attack_start";
      attackerId: ExpertId;
      targetId: ExpertId;
      phase: number;
    }
  | {
      type: "attack_response";
      attackerId: ExpertId;
      targetId: ExpertId;
      text: string;
      phase: number;
    }
  | { type: "judge_scores"; scores: JudgeScore }
  | { type: "devil_attack"; text: string }
  | { type: "rebuttal_start"; expertId: ExpertId }
  | {
      type: "rebuttal_response";
      expertId: ExpertId;
      text: string;
      choice: "A" | "B";
    }
  | { type: "devil_verdict"; verdicts: DevilVerdict }
  | { type: "final_scores"; data: FinalScores }
  | { type: "proposal"; data: DecisionMap }
  | { type: "error"; message: string }
  | { type: "done" };
