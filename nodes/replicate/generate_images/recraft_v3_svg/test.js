import { load } from "https://deno.land/std@0.224.0/dotenv/mod.ts";
import { expect } from "https://deno.land/std@0.224.0/expect/mod.ts";
import { runNode } from "../../../../utils/run-node.js";

const env = await load({
  envPath: ".env",
  export: true,
});

import { run } from "./script.js";

Deno.test("Recraft V3 SVG: default generate SVG", async () => {
  const {
    costs,
    outputs: { svg },
  } = await runNode(run, {
    env: {
      scope: {},
      variables: {
        REPLICATE_TOKEN: env.REPLICATE_TOKEN,
      },
    },
    inputs: {
      prompt: "a cute cat astronaut walking on the moon",
    },
  });
  console.log("Generated SVG URL:", svg);
  expect(svg).toMatch(/^https/);
  expect(costs).toBe(0.08);
});

Deno.test("Recraft V3 SVG: line art style", async () => {
  const {
    costs,
    outputs: { svg },
  } = await runNode(run, {
    env: {
      scope: {},
      variables: {
        REPLICATE_TOKEN: env.REPLICATE_TOKEN,
      },
    },
    inputs: {
      prompt: "a modern office building at sunset",
      style: "line_art",
      aspect_ratio: "16:9",
    },
  });
  console.log("Generated line art SVG URL:", svg);
  expect(svg).toMatch(/^https/);
  expect(costs).toBe(0.08);
});

Deno.test("Recraft V3 SVG: engraving style", async () => {
  const {
    costs,
    outputs: { svg },
  } = await runNode(run, {
    env: {
      scope: {},
      variables: {
        REPLICATE_TOKEN: env.REPLICATE_TOKEN,
      },
    },
    inputs: {
      prompt: "a fantasy castle in the clouds",
      style: "engraving",
      aspect_ratio: "3:4",
    },
  });
  console.log("Generated engraving SVG URL:", svg);
  expect(svg).toMatch(/^https/);
  expect(costs).toBe(0.08);
});
