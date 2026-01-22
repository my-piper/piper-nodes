import { load } from "https://deno.land/std@0.224.0/dotenv/mod.ts";
import { expect } from "https://deno.land/std@0.224.0/expect/mod.ts";
import { runNode } from "../../../../utils/run-node.js";

const env = await load({
  envPath: ".env",
  export: true,
});

import { run } from "./script.js";

Deno.test("Qwen Image: text-to-image with quality optimization", async () => {
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
      prompt: "a beautiful mountain landscape at sunset",
      aspect_ratio: "16:9",
      image_size: "optimize_for_quality",
      num_inference_steps: 30,
      guidance: 3,
      negative_prompt: " ",
      seed: -1,
      output_format: "webp",
      output_quality: 80,
      go_fast: true,
      enhance_prompt: false,
      disable_safety_checker: true,
    },
  });
  console.log("Generated Qwen Image (quality) URL:", image);
  expect(image).toMatch(/^https/);
  expect(costs).toBe(0.03);
});

Deno.test("Qwen Image: text-to-image with speed optimization", async () => {
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
      prompt: "a futuristic cityscape with flying cars",
      aspect_ratio: "1:1",
      image_size: "optimize_for_speed",
      num_inference_steps: 20,
      guidance: 2.5,
      seed: 42,
      output_format: "jpg",
      output_quality: 90,
      go_fast: true,
      enhance_prompt: true,
      disable_safety_checker: true,
    },
  });
  console.log("Generated Qwen Image (speed) URL:", image);
  expect(image).toMatch(/^https/);
  expect(costs).toBe(0.03);
});

Deno.test("Qwen Image: portrait with PNG format", async () => {
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
      prompt: "a professional portrait in natural lighting",
      aspect_ratio: "9:16",
      image_size: "optimize_for_quality",
      num_inference_steps: 30,
      guidance: 3.5,
      negative_prompt: "blurry, low quality",
      seed: -1,
      output_format: "png",
      output_quality: 80,
      go_fast: false,
      enhance_prompt: false,
      disable_safety_checker: true,
    },
  });
  console.log("Generated Qwen Image portrait URL:", image);
  expect(image).toMatch(/^https/);
  expect(costs).toBe(0.03);
});

Deno.test("Qwen Image: default settings", async () => {
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
    },
  });
  console.log("Generated Qwen Image default settings URL:", image);
  expect(image).toMatch(/^https/);
  expect(costs).toBe(0.03);
});
