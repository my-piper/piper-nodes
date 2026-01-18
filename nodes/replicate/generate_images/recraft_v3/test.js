import { load } from "https://deno.land/std@0.224.0/dotenv/mod.ts";
import { expect } from "https://deno.land/std@0.224.0/expect/mod.ts";
import { runNode } from "../../../../utils/run-node.js";

const env = await load({
  envPath: ".env",
  export: true,
});

import { run } from "./script.js";

Deno.test("Recraft V3: default generate image", async () => {
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
      prompt: "a cute cat astronaut walking on the moon",
      style: "any",
      aspect_ratio: "Not set",
      image_size: "1024x1024",
    },
  });
  console.log("Generated image URL:", image);
  expect(image).toMatch(/^https/);
  expect(costs.costs).toBe(0.04);
});

Deno.test("Recraft V3: realistic image style", async () => {
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
      prompt: "a modern office building at sunset",
      style: "realistic_image",
      aspect_ratio: "16:9",
    },
  });
  console.log("Generated realistic image URL:", image);
  expect(image).toMatch(/^https/);
  expect(costs.costs).toBe(0.04);
});

Deno.test("Recraft V3: digital illustration style", async () => {
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
      prompt: "a fantasy castle in the clouds",
      style: "digital_illustration",
      aspect_ratio: "3:4",
      image_size: "1024x1365",
    },
  });
  console.log("Generated digital illustration URL:", image);
  expect(image).toMatch(/^https/);
  expect(costs.costs).toBe(0.04);
});
