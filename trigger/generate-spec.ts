import { createGoogle } from "@ai-sdk/google";
import { logger, metadata, task } from "@trigger.dev/sdk";
import { generateText } from "ai";
import { z } from "zod";
import { put } from "@vercel/blob";

import { prisma } from "../lib/prisma";

const specPayloadSchema = z.object({
  projectId: z.string().min(1),
  roomId: z.string().min(1),
  chatHistory: z.array(
    z.object({
      role: z.string(),
      content: z.string(),
    })
  ).optional(),
  nodes: z.array(z.any()).optional(),
  edges: z.array(z.any()).optional(),
});

type SpecPayload = z.infer<typeof specPayloadSchema>;

function createGeminiModel() {
  const apiKey =
    process.env.GOOGLE_AI_API_KEY ??
    process.env.GOOGLE_GENERATIVE_AI_API_KEY ??
    process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error(
      "GOOGLE_AI_API_KEY, GOOGLE_GENERATIVE_AI_API_KEY, or GEMINI_API_KEY is required for the spec generation agent."
    );
  }

  return createGoogle({ apiKey })("gemini-2.5-pro");
}

function buildPrompt(payload: SpecPayload) {
  const chatContext = payload.chatHistory?.length
    ? `Chat History:\n${JSON.stringify(payload.chatHistory, null, 2)}`
    : "No chat history provided.";

  const canvasContext = `Canvas Nodes:\n${JSON.stringify(
    payload.nodes ?? [],
    null,
    2
  )}\n\nCanvas Edges:\n${JSON.stringify(payload.edges ?? [], null, 2)}`;

  return [
    `You are an expert software architect. Your task is to generate a comprehensive Markdown technical specification based on the provided canvas diagram and chat context.`,
    `Project ID: ${payload.projectId}`,
    `Room ID: ${payload.roomId}`,
    chatContext,
    canvasContext,
    `Please write a detailed, well-structured technical specification in Markdown. Include sections like Overview, Architecture, Data Model, API, and Implementation Details as appropriate based on the canvas and chat context. Do not wrap the entire response in a markdown code fence, just return the raw markdown content.`,
  ].join("\n\n");
}

export const generateSpecTask = task({
  id: "generate-spec",
  retry: { maxAttempts: 1 },
  run: async (rawPayload: unknown, { ctx }) => {
    metadata.set("status", "starting");

    try {
      const payload = specPayloadSchema.parse(rawPayload);
      metadata.set("roomId", payload.roomId);
      metadata.set("status", "processing");

      logger.info("Generating spec with Gemini", { roomId: payload.roomId });

      const generation = await generateText({
        model: createGeminiModel(),
        prompt: buildPrompt(payload),
        temperature: 0.3,
        maxOutputTokens: 8192,
        timeout: 120_000,
      });

      const blob = await put(`specs/${payload.projectId}/${ctx.run.id}.md`, generation.text, {
        access: "private",
        addRandomSuffix: false,
        contentType: "text/markdown",
      });

      const projectSpec = await prisma.projectSpec.create({
        data: {
          projectId: payload.projectId,
          filePath: blob.url,
        }
      });

      metadata.set("status", "complete");
      metadata.set("specId", projectSpec.id);
      
      return {
        success: true,
        spec: generation.text,
        specId: projectSpec.id,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      
      logger.error("Spec generation failed", {
        error: message,
      });
      
      metadata.set("status", "error").set("error", message);

      return {
        success: false,
        error: message,
      };
    }
  },
});
