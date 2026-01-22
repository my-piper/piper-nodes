import { load } from "https://deno.land/std@0.224.0/dotenv/mod.ts";
import { expect } from "https://deno.land/std@0.224.0/expect/mod.ts";
import { runNode } from "../../../../utils/run-node.js";

const { REPLICATE_TOKEN } = await load({
  envPath: ".env",
  export: true,
});

import { run } from "./script.js";

Deno.test("Wan 2.5: text to video 480p standard", async () => {
  const {
    costs,
    outputs: { video },
  } = await runNode(run, {
    env: {
      scope: {},
      variables: {
        REPLICATE_TOKEN,
      },
    },
    inputs: {
      mode: "standard",
      prompt: "a futuristic cityscape with flying cars",
      duration: "5",
      resolution: "480p",
      negative_prompt: "blur, distortion, low quality",
      enable_prompt_expansion: true,
    },
  });
  console.log("Generated video URL:", video);
  expect(video).toMatch(/^https/);
  expect(costs).toBe(0.25); // 0.05 * 5 seconds
});

Deno.test("Wan 2.5: image to video 720p standard", async () => {
  const {
    costs,
    outputs: { video },
  } = await runNode(run, {
    env: {
      scope: {},
      variables: {
        REPLICATE_TOKEN,
      },
    },
    inputs: {
      mode: "standard",
      prompt: "zoom in slowly",
      image:
        "https://cdn.jsdelivr.net/gh/my-piper/piper-nodes@main/assets/man_posing.jpg",
      duration: "5",
      resolution: "720p",
      enable_prompt_expansion: true,
    },
  });
  console.log("Generated video URL:", video);
  expect(video).toMatch(/^https/);
  expect(costs).toBe(0.5); // 0.1 * 5 seconds
});
