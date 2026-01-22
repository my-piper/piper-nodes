import { load } from "https://deno.land/std@0.224.0/dotenv/mod.ts";
import { expect } from "https://deno.land/std@0.224.0/expect/mod.ts";
import { runNode } from "../../../../utils/run-node.js";

const env = await load({
  envPath: ".env",
  export: true,
});

import { run } from "./script.js";

Deno.test("Minimax Image 1: single image", async () => {
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
      prompt: "a futuristic cityscape at sunset",
      aspect_ratio: "16:9",
      number_of_images: 1,
      prompt_optimizer: true,
    },
  });
  console.log("Generated Minimax Image 1 single image URLs:", images);
  expect(Array.isArray(images)).toBe(true);
  expect(images.length).toBe(1);
  expect(images[0]).toMatch(/^https/);
  expect(costs).toBe(0.01);
});

Deno.test("Minimax Image 1: multiple images", async () => {
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
      prompt: "a serene mountain landscape",
      aspect_ratio: "4:3",
      number_of_images: 3,
      prompt_optimizer: true,
    },
  });
  console.log("Generated Minimax Image 1 multiple images URLs:", images);
  expect(Array.isArray(images)).toBe(true);
  expect(images.length).toBe(3);
  images.forEach((image) => {
    expect(image).toMatch(/^https/);
  });
  expect(costs).toBe(0.03);
});

Deno.test("Minimax Image 1: with character reference", async () => {
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
      prompt: "a professional portrait in natural lighting",
      aspect_ratio: "3:4",
      number_of_images: 1,
      prompt_optimizer: false,
      character: "https://picsum.photos/800/1200",
    },
  });
  console.log("Generated Minimax Image 1 with character reference URLs:", images);
  expect(Array.isArray(images)).toBe(true);
  expect(images.length).toBe(1);
  expect(images[0]).toMatch(/^https/);
  expect(costs).toBe(0.01);
});

Deno.test("Minimax Image 1: portrait aspect ratio", async () => {
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
      prompt: "a beautiful sunset over the ocean",
      aspect_ratio: "9:16",
      number_of_images: 2,
      prompt_optimizer: true,
    },
  });
  console.log("Generated Minimax Image 1 portrait aspect ratio URLs:", images);
  expect(Array.isArray(images)).toBe(true);
  expect(images.length).toBe(2);
  images.forEach((image) => {
    expect(image).toMatch(/^https/);
  });
  expect(costs).toBe(0.02);
});

Deno.test("Minimax Image 1: default settings", async () => {
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
  console.log("Generated Minimax Image 1 default settings URLs:", images);
  expect(Array.isArray(images)).toBe(true);
  expect(images.length).toBe(1);
  expect(images[0]).toMatch(/^https/);
  expect(costs).toBe(0.01);
});

