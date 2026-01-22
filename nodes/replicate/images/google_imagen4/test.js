import { load } from "https://deno.land/std@0.224.0/dotenv/mod.ts";
import { expect } from "https://deno.land/std@0.224.0/expect/mod.ts";
import { runNode } from "../../../../utils/run-node.js";

const env = await load({
  envPath: ".env",
  export: true,
});

import { run } from "./script.js";

Deno.test("Google Imagen 4: text-to-image with Imagen 4", async () => {
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
      model: "imagen-4",
      prompt: "a beautiful mountain landscape at sunset",
      aspect_ratio: "16:9",
      output_format: "jpg",
      safety_filter_level: "block_only_high",
    },
  });
  console.log("Generated Imagen 4 image URL:", image);
  expect(image).toMatch(/^https/);
  expect(costs).toBe(0.04);
});

Deno.test("Google Imagen 4 Fast: text to image", async () => {
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
      model: "imagen-4-fast",
      prompt: "a futuristic cityscape with flying cars",
      aspect_ratio: "1:1",
      output_format: "png",
      safety_filter_level: "block_medium_and_above",
    },
  });
  console.log("Generated Imagen 4 Fast image URL:", image);
  expect(image).toMatch(/^https/);
  expect(costs).toBe(0.02);
});

Deno.test("Google Imagen 4 Ultra: portrait", async () => {
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
      model: "imagen-4-ultra",
      prompt: "a professional portrait in natural lighting",
      aspect_ratio: "9:16",
      output_format: "jpg",
      safety_filter_level: "block_low_and_above",
    },
  });
  console.log("Generated Imagen 4 Ultra image URL:", image);
  expect(image).toMatch(/^https/);
  expect(costs).toBe(0.06);
});

Deno.test("Google Imagen 4: square with default settings", async () => {
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
      prompt: "a serene lake with mountains in the background",
      aspect_ratio: "1:1",
    },
  });
  console.log("Generated default settings image URL:", image);
  expect(image).toMatch(/^https/);
  expect(costs).toBe(0.04); // Default model is imagen-4
});
