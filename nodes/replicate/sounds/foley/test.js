import { load } from "https://deno.land/std@0.224.0/dotenv/mod.ts";
import { expect } from "https://deno.land/std@0.224.0/expect/mod.ts";
import { runNode } from "../../../../utils/run-node.js";

const { REPLICATE_TOKEN } = await load({
  envPath: ".env",
  export: true,
});

import { costs, run } from "./script.js";

const SAMPLE_VIDEO =
  "https://cdn.jsdelivr.net/gh/my-piper/piper-nodes@main/assets/girl_camera_posing.mp4";

Deno.test("Foley: costs with platform token", () => {
  const result = costs({
    env: { scope: {} },
  });
  expect(result).toBe(0.023);
});

Deno.test("Foley: costs with user token", () => {
  const result = costs({
    env: { scope: { REPLICATE_TOKEN: "user" } },
  });
  expect(result).toBe(0);
});

Deno.test("Foley: generate video with foley sound", async () => {
  const {
    costs: runCosts,
    outputs: { video },
  } = await runNode(run, {
    env: {
      scope: {},
      variables: {
        REPLICATE_TOKEN,
      },
    },
    inputs: {
      video: SAMPLE_VIDEO,
      prompt: "footsteps, ambient sounds",
      return_audio: false,
    },
  });
  console.log("Generated video with foley:", video);
  expect(video).toBeDefined();
  expect(runCosts).toBe(0.023);
});

Deno.test("Foley: generate audio only", async () => {
  const {
    costs: runCosts,
    outputs: { audio },
  } = await runNode(run, {
    env: {
      scope: {},
      variables: {
        REPLICATE_TOKEN,
      },
    },
    inputs: {
      video: SAMPLE_VIDEO,
      prompt: "footsteps, ambient sounds",
      return_audio: true,
    },
  });
  console.log("Generated audio:", audio);
  expect(audio).toBeDefined();
  expect(runCosts).toBe(0.023);
});
