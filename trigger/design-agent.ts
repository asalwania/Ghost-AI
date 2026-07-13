import { task } from "@trigger.dev/sdk";

interface DesignAgentPayload {
  prompt: string;
  roomId: string;
}

// Minimal design task — backend wiring only.
// AI generation logic will be added in a later feature.
export const designAgentTask = task({
  id: "design-agent",
  run: async (payload: DesignAgentPayload) => {
    console.log("[design-agent] received payload", {
      prompt: payload.prompt,
      roomId: payload.roomId,
    });

    return { received: true, prompt: payload.prompt, roomId: payload.roomId };
  },
});
