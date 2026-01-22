import { load } from "https://deno.land/std@0.224.0/dotenv/mod.ts";
import { expect } from "https://deno.land/std@0.224.0/expect/mod.ts";
import { runNode } from "../../../../utils/run-node.js";

const env = await load({
  envPath: ".env",
  export: true,
});

import { run } from "./script.js";

Deno.test("Z-Image Turbo: text-to-image 1024x1024", async () => {
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
      width: 1024,
      height: 1024,
      num_inference_steps: 8,
      guidance_scale: 0,
      seed: -1,
      output_format: "jpg",
      output_quality: 80,
    },
  });
  console.log("Generated Z-Image Turbo 1024x1024 image URL:", image);
  expect(image).toMatch(/^https/);
  expect(costs).toBe(0.01);
});

Deno.test("Z-Image Turbo: portrait 768x1024 PNG", async () => {
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
      width: 768,
      height: 1024,
      num_inference_steps: 8,
      guidance_scale: 0,
      seed: 42,
      output_format: "png",
      output_quality: 80,
    },
  });
  console.log("Generated Z-Image Turbo portrait image URL:", image);
  expect(image).toMatch(/^https/);
  expect(costs).toBe(0.01);
});

Deno.test("Z-Image Turbo: wide 1440x816 WebP", async () => {
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
      width: 1440,
      height: 816,
      num_inference_steps: 12,
      guidance_scale: 0,
      seed: -1,
      output_format: "webp",
      output_quality: 90,
    },
  });
  console.log("Generated Z-Image Turbo wide image URL:", image);
  expect(image).toMatch(/^https/);
  expect(costs).toBe(0.01);
});

Deno.test("Z-Image Turbo: default settings", async () => {
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
  console.log("Generated Z-Image Turbo default settings image URL:", image);
  expect(image).toMatch(/^https/);
  expect(costs).toBe(0.01);
});
