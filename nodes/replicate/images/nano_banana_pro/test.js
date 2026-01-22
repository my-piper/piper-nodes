import { load } from "https://deno.land/std@0.224.0/dotenv/mod.ts";
import { expect } from "https://deno.land/std@0.224.0/expect/mod.ts";
import { runNode } from "../../../../utils/run-node.js";

const env = await load({
  envPath: ".env",
  export: true,
});

import { run } from "./script.js";

Deno.test("Nano Banana Pro: text-to-image 2K resolution", async () => {
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
      resolution: "2K",
      output_format: "png",
      safety_filter_level: "block_only_high",
    },
  });
  console.log("Generated 2K image URL:", image);
  expect(image).toMatch(/^https/);
  expect(costs).toBe(0.14);
});

Deno.test("Nano Banana Pro: image-to-image with 4K resolution", async () => {
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
      prompt: "a futuristic cityscape",
      images: ["https://picsum.photos/1024/1024"],
      aspect_ratio: "1:1",
      resolution: "4K",
      output_format: "jpg",
      safety_filter_level: "block_medium_and_above",
    },
  });
  console.log("Generated 4K image URL:", image);
  expect(image).toMatch(/^https/);
  expect(costs).toBe(0.24);
});

Deno.test("Nano Banana Pro: portrait with 1K resolution", async () => {
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
      resolution: "1K",
      output_format: "png",
      safety_filter_level: "block_low_and_above",
    },
  });
  console.log("Generated 1K portrait URL:", image);
  expect(image).toMatch(/^https/);
  expect(costs).toBe(0.14);
});

Deno.test("Nano Banana Pro: landscape with default resolution", async () => {
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
      aspect_ratio: "16:9",
      output_format: "jpg",
    },
  });
  console.log("Generated default resolution image URL:", image);
  expect(image).toMatch(/^https/);
  expect(costs).toBe(0.14); // Default is 2K
});
