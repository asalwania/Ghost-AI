import { z } from "zod";

export const AI_STATUS_FEED_ID = "ai-status-feed";

export const aiStatusFeedMessageSchema = z
  .object({
    runId: z.string().trim().min(1).optional(),
    task: z.enum(["design", "spec"]),
    level: z.enum(["info", "success", "error"]),
    phase: z.enum(["start", "processing", "applying", "complete", "error"]),
    text: z.string().trim().min(1).optional(),
  })
  .strict();

export type AiStatusFeedMessage = z.infer<
  typeof aiStatusFeedMessageSchema
>;
export type AiStatusLevel = AiStatusFeedMessage["level"];
export type AiStatusPhase = AiStatusFeedMessage["phase"];

export function isActiveAiStatusMessage(message: AiStatusFeedMessage) {
  return message.phase !== "complete" && message.phase !== "error";
}
