import { Tag } from "coachman-ui";
import { Brain, type BrainMode } from "../lib/brain";

export function BrainStatus({ brain }: { brain: BrainMode | "pending" }) {
  if (brain === "pending") return <Tag dot>Verbinden…</Tag>;
  if (brain === "artifact") return <Tag tone="success" dot>AI via je Claude-abonnement</Tag>;
  if (brain === "local") return <Tag tone="success" dot>{Brain.mock ? "Testmodus" : "AI via Claude Code"}</Tag>;
  return <Tag tone="danger" dot>Geen AI-verbinding</Tag>;
}
