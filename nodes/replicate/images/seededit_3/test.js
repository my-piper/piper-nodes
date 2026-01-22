import { load } from "https://deno.land/std@0.224.0/dotenv/mod.ts";
import { expect } from "https://deno.land/std@0.224.0/expect/mod.ts";
import { runNode } from "../../../../utils/run-node.js";

const env = await load({
  envPath: ".env",
  export: true,
});

import { run } from "./script.js";

Deno.test("Seededit 3: change style to anime", async () => {
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
      image: "https://picsum.photos/1024/1024",
      prompt: "change style to anime",
      guidance_scale: 5.5,
      seed: -1,
    },
  });
  console.log("Generated Seededit 3 anime style image URL:", image);
  expect(image).toMatch(/^https/);
  expect(costs).toBe(0.03);
});

Deno.test("Seededit 3: add sunglasses with high guidance", async () => {
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
      image: "https://picsum.photos/800/600",
      prompt: "add sunglasses",
      guidance_scale: 8.0,
      seed: 42,
    },
  });
  console.log("Generated Seededit 3 sunglasses image URL:", image);
  expect(image).toMatch(/^https/);
  expect(costs).toBe(0.03);
});

Deno.test("Seededit 3: change to watercolor with low guidance", async () => {
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
      image: "https://picsum.photos/1024/768",
      prompt: "change to watercolor painting style",
      guidance_scale: 3.0,
      seed: -1,
    },
  });
  console.log("Generated Seededit 3 watercolor image URL:", image);
  expect(image).toMatch(/^https/);
  expect(costs).toBe(0.03);
});

Deno.test("Seededit 3: default settings", async () => {
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
      image: "https://picsum.photos/1024/1024",
      prompt: "make it more vibrant",
    },
  });
  console.log("Generated Seededit 3 default settings image URL:", image);
  expect(image).toMatch(/^https/);
  expect(costs).toBe(0.03);
});
