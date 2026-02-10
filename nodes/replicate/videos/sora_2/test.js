import { load } from "https://deno.land/std@0.224.0/dotenv/mod.ts";
import { expect } from "https://deno.land/std@0.224.0/expect/mod.ts";
import { runNode } from "../../../../utils/run-node.js";

const { REPLICATE_TOKEN } = await load({
  envPath: ".env",
  export: true,
});

import { run } from "./script.js";

Deno.test("Sora 2: text to video 4 seconds portrait", async () => {
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
      prompt: "a cat walking in a sunny meadow",
      seconds: 4,
      aspect_ratio: "portrait",
    },
  });
  console.log("Generated video URL:", video);
  expect(video).toMatch(/^https/);
  expect(costs).toBe(0.07);
});

Deno.test("Sora 2: text to video 8 seconds landscape", async () => {
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
      prompt: "a majestic eagle soaring over snowy mountains with cinematic quality",
      seconds: 8,
      aspect_ratio: "landscape",
    },
  });
  console.log("Generated video URL:", video);
  expect(video).toMatch(/^https/);
  expect(costs).toBe(0.14);
});

Deno.test("Sora 2: text to video 12 seconds with default settings", async () => {
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
      prompt: "a person dancing in a crowded city street with vibrant lights",
      seconds: 12,
      aspect_ratio: "landscape",
    },
  });
  console.log("Generated video URL:", video);
  expect(video).toMatch(/^https/);
  expect(costs).toBe(0.21);
});
