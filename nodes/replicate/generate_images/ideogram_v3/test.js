import { load } from "https://deno.land/std@0.224.0/dotenv/mod.ts";
import { expect } from "https://deno.land/std@0.224.0/expect/mod.ts";
import { runNode } from "../../../../utils/run-node.js";

const env = await load({
  envPath: ".env",
  export: true,
});

import { run } from "./script.js";

Deno.test("Ideogram V3 Turbo: text-to-image", async () => {
  const {
    costs,
    outputs: { image },
  } = await runNode(run, {
    env: {
      scope: {},
      variables: {
        REPLICATE_TOKEN: env.REPLICATE_TOKEN,
      },
    },
    inputs: {
      model: "turbo",
      prompt: "a beautiful mountain landscape at sunset",
      aspect_ratio: "16:9",
      resolution: "None",
      style_type: "None",
      style_preset: "None",
      seed: -1,
    },
  });
  console.log("Generated Ideogram V3 Turbo image URL:", image);
  expect(image).toMatch(/^https/);
  expect(costs).toBe(0.03);
});

Deno.test("Ideogram V3 Balanced: with style preset", async () => {
  const {
    costs,
    outputs: { image },
  } = await runNode(run, {
    env: {
      scope: {},
      variables: {
        REPLICATE_TOKEN: env.REPLICATE_TOKEN,
      },
    },
    inputs: {
      model: "balanced",
      prompt: "a futuristic cityscape with flying cars",
      aspect_ratio: "1:1",
      resolution: "None",
      style_type: "Auto",
      style_preset: "Dramatic Cinema",
      seed: 42,
    },
  });
  console.log("Generated Ideogram V3 Balanced image URL:", image);
  expect(image).toMatch(/^https/);
  expect(costs).toBe(0.06);
});

Deno.test("Ideogram V3 Quality: with specific resolution", async () => {
  const {
    costs,
    outputs: { image },
  } = await runNode(run, {
    env: {
      scope: {},
      variables: {
        REPLICATE_TOKEN: env.REPLICATE_TOKEN,
      },
    },
    inputs: {
      model: "quality",
      prompt: "a professional portrait in natural lighting",
      aspect_ratio: "1:1",
      resolution: "1024x1024",
      style_type: "Realistic",
      style_preset: "None",
      seed: -1,
    },
  });
  console.log("Generated Ideogram V3 Quality image URL:", image);
  expect(image).toMatch(/^https/);
  expect(costs).toBe(0.09);
});

Deno.test("Ideogram V3 Turbo: with style reference", async () => {
  const {
    costs,
    outputs: { image },
  } = await runNode(run, {
    env: {
      scope: {},
      variables: {
        REPLICATE_TOKEN: env.REPLICATE_TOKEN,
      },
    },
    inputs: {
      model: "turbo",
      prompt: "a serene lake with mountains",
      aspect_ratio: "16:9",
      resolution: "None",
      style_type: "General",
      style_preset: "None",
      seed: -1,
      style_reference_images: ["https://picsum.photos/1024/1024"],
    },
  });
  console.log("Generated Ideogram V3 with style reference URL:", image);
  expect(image).toMatch(/^https/);
  expect(costs).toBe(0.03);
});

Deno.test("Ideogram V3 Turbo: default settings", async () => {
  const {
    costs,
    outputs: { image },
  } = await runNode(run, {
    env: {
      scope: {},
      variables: {
        REPLICATE_TOKEN: env.REPLICATE_TOKEN,
      },
    },
    inputs: {
      prompt: "cat astronaut walking at a moon",
    },
  });
  console.log("Generated Ideogram V3 default settings image URL:", image);
  expect(image).toMatch(/^https/);
  expect(costs).toBe(0.03);
});
