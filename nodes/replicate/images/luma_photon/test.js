import { load } from "https://deno.land/std@0.224.0/dotenv/mod.ts";
import { expect } from "https://deno.land/std@0.224.0/expect/mod.ts";
import { runNode } from "../../../../utils/run-node.js";

const env = await load({
  envPath: ".env",
  export: true,
});

import { run } from "./script.js";

Deno.test("Luma Photon: text-to-image", async () => {
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
      prompt: "a futuristic cityscape at sunset",
      aspect_ratio: "16:9",
      seed: -1,
    },
  });
  console.log("Generated Luma Photon text-to-image URL:", image);
  expect(image).toMatch(/^https/);
  expect(costs).toBe(0.03);
});

Deno.test("Luma Photon: with image reference", async () => {
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
      prompt: "transform into a watercolor painting",
      aspect_ratio: "1:1",
      seed: 42,
      image_reference: "https://picsum.photos/1024/1024",
      image_reference_weight: 0.85,
    },
  });
  console.log("Generated Luma Photon with image reference URL:", image);
  expect(image).toMatch(/^https/);
  expect(costs).toBe(0.03);
});

Deno.test("Luma Photon: with style reference", async () => {
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
      prompt: "a serene mountain landscape",
      aspect_ratio: "4:3",
      seed: -1,
      style_reference: "https://picsum.photos/1024/768",
      style_reference_weight: 0.7,
    },
  });
  console.log("Generated Luma Photon with style reference URL:", image);
  expect(image).toMatch(/^https/);
  expect(costs).toBe(0.03);
});

Deno.test("Luma Photon: with character reference", async () => {
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
      aspect_ratio: "3:4",
      seed: -1,
      character_reference: "https://picsum.photos/800/1200",
    },
  });
  console.log("Generated Luma Photon with character reference URL:", image);
  expect(image).toMatch(/^https/);
  expect(costs).toBe(0.03);
});

Deno.test("Luma Photon: all references combined", async () => {
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
      prompt: "a fantasy scene with magical elements",
      aspect_ratio: "21:9",
      seed: -1,
      image_reference: "https://picsum.photos/1920/1080",
      image_reference_weight: 0.6,
      style_reference: "https://picsum.photos/1024/1024",
      style_reference_weight: 0.5,
      character_reference: "https://picsum.photos/800/1200",
    },
  });
  console.log("Generated Luma Photon with all references URL:", image);
  expect(image).toMatch(/^https/);
  expect(costs).toBe(0.03);
});

Deno.test("Luma Photon: default settings", async () => {
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
    },
  });
  console.log("Generated Luma Photon default settings image URL:", image);
  expect(image).toMatch(/^https/);
  expect(costs).toBe(0.03);
});

