import { task } from "@trigger.dev/sdk";

// A minimal example task — replace with your real background jobs.
// See: https://trigger.dev/docs/tasks/overview
export const helloWorldTask = task({
  id: "hello-world",
  run: async (payload: { message: string }) => {
    console.log("Hello from Trigger.dev!", payload.message);
    return { success: true, echo: payload.message };
  },
});
