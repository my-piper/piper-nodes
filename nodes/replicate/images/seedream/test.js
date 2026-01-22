import { load } from "https://deno.land/std@0.224.0/dotenv/mod.ts";
import { expect } from "https://deno.land/std@0.224.0/expect/mod.ts";
import { runNode } from "../../../../utils/run-node.js";

const env = await load({
  envPath: ".env",
  export: true,
});

import { run } from "./script.js";

Deno.test("Seedream 4: text-to-image 2K", async () => {
  const {
    costs,
    outputs: { images },
  } = await runNode(run, {
    env: {
      scope: {},
      variables: {
        REPLICATE_TOKEN: env.REPLICATE_TOKEN,
      },
    },
    inputs: {
      model: "seedream_4",
      prompt: "a beautiful mountain landscape at sunset",
      image_size: "2K",
      aspect_ratio: "16:9",
      sequential_image_generation: "disabled",
      max_images: 1,
      enhance_prompt: true,
      seed: -1,
    },
  });
  console.log("Generated Seedream 4 2K images:", images);
  expect(Array.isArray(images)).toBe(true);
  expect(images.length).toBeGreaterThan(0);
  expect(images[0]).toMatch(/^https/);
  expect(costs).toBe(0.03);
});

Deno.test("Seedream 4.5: text-to-image 4K", async () => {
  const {
    costs,
    outputs: { images },
  } = await runNode(run, {
    env: {
      scope: {},
      variables: {
        REPLICATE_TOKEN: env.REPLICATE_TOKEN,
      },
    },
    inputs: {
      model: "seedream_4_5",
      prompt: "a futuristic cityscape with flying cars",
      image_size: "4K",
      aspect_ratio: "16:9",
      sequential_image_generation: "disabled",
      max_images: 1,
      enhance_prompt: false,
      seed: 42,
    },
  });
  console.log("Generated Seedream 4.5 4K images:", images);
  expect(Array.isArray(images)).toBe(true);
  expect(images.length).toBeGreaterThan(0);
  expect(images[0]).toMatch(/^https/);
  expect(costs).toBe(0.04);
});

Deno.test("Seedream 4: custom size", async () => {
  const {
    costs,
    outputs: { images },
  } = await runNode(run, {
    env: {
      scope: {},
      variables: {
        REPLICATE_TOKEN: env.REPLICATE_TOKEN,
      },
    },
    inputs: {
      model: "seedream_4",
      prompt: "a serene lake with mountains",
      image_size: "custom",
      aspect_ratio: "1:1",
      width: 2048,
      height: 2048,
      sequential_image_generation: "disabled",
      max_images: 1,
      enhance_prompt: true,
      seed: -1,
    },
  });
  console.log("Generated Seedream 4 custom size images:", images);
  expect(Array.isArray(images)).toBe(true);
  expect(images.length).toBeGreaterThan(0);
  expect(images[0]).toMatch(/^https/);
  expect(costs).toBe(0.03);
});

Deno.test("Seedream 4.5: image-to-image", async () => {
  const {
    costs,
    outputs: { images },
  } = await runNode(run, {
    env: {
      scope: {},
      variables: {
        REPLICATE_TOKEN: env.REPLICATE_TOKEN,
      },
    },
    inputs: {
      model: "seedream_4_5",
      prompt: "transform into a watercolor painting",
      images: ["https://picsum.photos/1024/1024"],
      image_size: "2K",
      aspect_ratio: "match_input_image",
      sequential_image_generation: "disabled",
      max_images: 1,
      enhance_prompt: false,
      seed: -1,
    },
  });
  console.log("Generated Seedream 4.5 image-to-image:", images);
  expect(Array.isArray(images)).toBe(true);
  expect(images.length).toBeGreaterThan(0);
  expect(images[0]).toMatch(/^https/);
  expect(costs).toBe(0.04);
});

Deno.test("Seedream 4: default settings", async () => {
  const {
    costs,
    outputs: { images },
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
  console.log("Generated Seedream 4 default settings images:", images);
  expect(Array.isArray(images)).toBe(true);
  expect(images.length).toBeGreaterThan(0);
  expect(images[0]).toMatch(/^https/);
  expect(costs).toBe(0.03);
});

