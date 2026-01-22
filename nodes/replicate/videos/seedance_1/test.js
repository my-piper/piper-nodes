import { load } from "https://deno.land/std@0.224.0/dotenv/mod.ts";
import { expect } from "https://deno.land/std@0.224.0/expect/mod.ts";
import { runNode } from "../../../../utils/run-node.js";

const { REPLICATE_TOKEN } = await load({
  envPath: ".env",
  export: true,
});

import { run } from "./script.js";

Deno.test("Seedance 1: text to video 720p", async () => {
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
      mode: "lite",
      prompt: "a beautiful sunset over the ocean with waves",
      duration: 3,
      resolution: "720p",
      aspect_ratio: "16:9",
      camera_fixed: true,
      seed: 42,
    },
  });
  console.log("Generated video URL:", video);
  expect(video).toMatch(/^https/);
  expect(costs).toBeCloseTo(0.108, 2);
});

Deno.test("Seedance 1: image to video 480p", async () => {
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
      mode: "lite",
      prompt: "zoom in slowly",
      image:
        "https://cdn.jsdelivr.net/gh/my-piper/piper-nodes@main/assets/man_posing.jpg",
      duration: 4,
      resolution: "480p",
      aspect_ratio: "1:1",
      camera_fixed: false,
    },
  });
  console.log("Generated video URL:", video);
  expect(video).toMatch(/^https/);
  expect(costs).toBe(0.072);
});
