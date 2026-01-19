import { load } from "https://deno.land/std@0.224.0/dotenv/mod.ts";
import { expect } from "https://deno.land/std@0.224.0/expect/mod.ts";
import { runNode } from "../../../../utils/run-node.js";

const env = await load({
  envPath: ".env",
  export: true,
});

import { run } from "./script.js";

Deno.test("Hunyuan Image: text-to-image with Hunyuan 2.1", async () => {
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
      model: "hunyuan-2.1",
      prompt: "a beautiful mountain landscape at sunset",
      aspect_ratio: "16:9",
      seed: -1,
      go_fast: true,
      output_format: "webp",
      output_quality: 95,
      disable_safety_checker: false,
    },
  });
  console.log("Generated Hunyuan 2.1 image URL:", image);
  expect(image).toMatch(/^https/);
  expect(costs).toBe(0.02);
});

Deno.test("Hunyuan Image: text-to-image with Hunyuan 3", async () => {
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
      model: "hunyuan-3",
      prompt: "a futuristic cityscape with flying cars",
      aspect_ratio: "1:1",
      seed: 42,
      go_fast: true,
      output_format: "png",
      output_quality: 95,
      disable_safety_checker: false,
    },
  });
  console.log("Generated Hunyuan 3 image URL:", image);
  expect(image).toMatch(/^https/);
  expect(costs).toBe(0.08);
});

Deno.test("Hunyuan Image 2.1: portrait with JPG format", async () => {
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
      model: "hunyuan-2.1",
      prompt: "a professional portrait in natural lighting",
      aspect_ratio: "9:16",
      seed: -1,
      go_fast: false,
      output_format: "jpg",
      output_quality: 90,
      disable_safety_checker: false,
    },
  });
  console.log("Generated portrait image URL:", image);
  expect(image).toMatch(/^https/);
  expect(costs).toBe(0.02);
});

Deno.test("Hunyuan Image 2.1: square image with default settings", async () => {
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
  expect(costs).toBe(0.02); // Default model is hunyuan-2.1
});
