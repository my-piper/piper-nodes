import { load } from "https://deno.land/std@0.224.0/dotenv/mod.ts";
import { expect } from "https://deno.land/std@0.224.0/expect/mod.ts";
import { runNode } from "../../../../utils/run-node.js";

const { REPLICATE_TOKEN } = await load({
  envPath: ".env",
  export: true,
});

import { run } from "./script.js";

Deno.test("Wan 2.6: text to video 720p landscape", async () => {
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
      prompt: "cat astronaut walking at a moon",
      duration: "5",
      resolution: "720p",
      orientation: "landscape",
      enable_prompt_expansion: true,
      multi_shots: false,
      seed: -1,
    },
  });
  console.log("Generated video URL:", video);
  expect(video).toMatch(/^https/);
  expect(costs).toBe(0.5); // 0.1 * 5 seconds
});

Deno.test("Wan 2.6: text to video 1080p portrait", async () => {
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
      prompt: "a beautiful sunset over the ocean with waves",
      duration: "10",
      resolution: "1080p",
      orientation: "portrait",
      enable_prompt_expansion: false,
      multi_shots: false,
      seed: 42,
    },
  });
  console.log("Generated video URL:", video);
  expect(video).toMatch(/^https/);
  expect(costs).toBe(1.5); // 0.15 * 10 seconds
});

Deno.test("Wan 2.6: image to video 720p", async () => {
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
      prompt: "zoom in slowly",
      image:
        "https://cdn.jsdelivr.net/gh/my-piper/piper-nodes@main/assets/man_posing.jpg",
      duration: "5",
      resolution: "720p",
      orientation: "landscape",
      enable_prompt_expansion: true,
      seed: -1,
    },
  });
  console.log("Generated video URL:", video);
  expect(video).toMatch(/^https/);
  expect(costs).toBe(0.5); // 0.1 * 5 seconds
});

Deno.test("Wan 2.6: default settings", async () => {
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
      prompt: "a futuristic cityscape with flying cars",
    },
  });
  console.log("Generated video URL:", video);
  expect(video).toMatch(/^https/);
  expect(costs).toBe(0.5); // 0.1 * 5 seconds (default: 720p, 5s)
});
