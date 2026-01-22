import { load } from "https://deno.land/std@0.224.0/dotenv/mod.ts";
import { expect } from "https://deno.land/std@0.224.0/expect/mod.ts";
import { runNode } from "../../../../utils/run-node.js";

const env = await load({
  envPath: ".env",
  export: true,
});

import { run } from "./script.js";

Deno.test("Nano Banana: text-to-image generation", async () => {
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
      prompt: "a cute cat sitting on a windowsill",
      aspect_ratio: "1:1",
      output_format: "png",
    },
  });
  console.log("Generated image URL:", image);
  expect(image).toMatch(/^https/);
  expect(costs).toBe(0.04);
});

Deno.test("Nano Banana: image-to-image with reference", async () => {
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
      prompt: "a beautiful sunset landscape",
      images: ["https://picsum.photos/512/512"],
      aspect_ratio: "16:9",
      output_format: "jpg",
    },
  });
  console.log("Generated image with reference URL:", image);
  expect(image).toMatch(/^https/);
  expect(costs).toBe(0.04);
});
