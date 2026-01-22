import { load } from "https://deno.land/std@0.224.0/dotenv/mod.ts";
import { expect } from "https://deno.land/std@0.224.0/expect/mod.ts";
import { runNode } from "../../../../utils/run-node.js";

const env = await load({
  envPath: ".env",
  export: true,
});

import { run } from "./script.js";

Deno.test("FLUX Kontext Fast: image-to-image", async () => {
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
      model: "fast",
      prompt: "transform into a watercolor painting",
      image: "https://picsum.photos/1024/1024",
      aspect_ratio: "1:1",
      seed: -1,
      safety_tolerance: 2,
      prompt_upsampling: false,
      output_format: "webp",
      output_quality: 80,
    },
  });
  console.log("Generated FLUX Kontext Fast image URL:", image);
  expect(image).toMatch(/^https/);
  expect(costs).toBe(0.01);
});

Deno.test("FLUX Kontext Dev: with prompt upsampling", async () => {
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
      model: "dev",
      prompt: "a futuristic cityscape at night",
      image: "https://picsum.photos/1920/1080",
      aspect_ratio: "16:9",
      seed: 42,
      safety_tolerance: 3,
      prompt_upsampling: false,
      output_format: "jpg",
      output_quality: 90,
    },
  });
  console.log("Generated FLUX Kontext Dev image URL:", image);
  expect(image).toMatch(/^https/);
  expect(costs).toBe(0.032);
});

Deno.test("FLUX Kontext Pro: high quality PNG", async () => {
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
      model: "pro",
      prompt: "a serene mountain landscape",
      image: "https://picsum.photos/1024/768",
      aspect_ratio: "4:3",
      seed: -1,
      safety_tolerance: 2,
      prompt_upsampling: true,
      output_format: "png",
      output_quality: 80,
    },
  });
  console.log("Generated FLUX Kontext Pro image URL:", image);
  expect(image).toMatch(/^https/);
  expect(costs).toBe(0.04);
});

Deno.test("FLUX Kontext Max: maximum quality", async () => {
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
      model: "max",
      prompt: "a professional portrait in natural lighting",
      image: "https://picsum.photos/800/1200",
      aspect_ratio: "2:3",
      seed: -1,
      safety_tolerance: 1,
      prompt_upsampling: true,
      output_format: "png",
      output_quality: 100,
    },
  });
  console.log("Generated FLUX Kontext Max image URL:", image);
  expect(image).toMatch(/^https/);
  expect(costs).toBe(0.08);
});

Deno.test("FLUX Kontext Fast: default settings", async () => {
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
      image: "https://picsum.photos/1024/1024",
    },
  });
  console.log("Generated FLUX Kontext Fast default settings image URL:", image);
  expect(image).toMatch(/^https/);
  expect(costs).toBe(0.01);
});
