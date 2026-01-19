import { load } from "https://deno.land/std@0.224.0/dotenv/mod.ts";
import { expect } from "https://deno.land/std@0.224.0/expect/mod.ts";
import { runNode } from "../../../../utils/run-node.js";

const env = await load({
  envPath: ".env",
  export: true,
});

import { run } from "./script.js";

Deno.test("Runway Gen4 Image Standard: text-to-image", async () => {
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
      model: "standard",
      prompt: "a futuristic cityscape at sunset",
      aspect_ratio: "16:9",
      resolution: "1080p",
      seed: -1,
    },
  });
  console.log("Generated Runway Gen4 Standard image URL:", image);
  expect(image).toMatch(/^https/);
  expect(costs).toBe(0.08);
});

Deno.test("Runway Gen4 Image Turbo: with reference image", async () => {
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
      model: "turbo",
      prompt: "change style to anime for @cat",
      images: ["https://picsum.photos/1024/1024"],
      tags: "@cat",
      aspect_ratio: "1:1",
      resolution: "720p",
      seed: 42,
    },
  });
  console.log("Generated Runway Gen4 Turbo image URL:", image);
  expect(image).toMatch(/^https/);
  expect(costs).toBe(0.05);
});

Deno.test("Runway Gen4 Image Standard: multiple reference images", async () => {
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
      model: "standard",
      prompt: "combine @cat and @dog in a fantasy scene",
      images: [
        "https://picsum.photos/1024/1024",
        "https://picsum.photos/1024/768",
      ],
      tags: "@cat @dog",
      aspect_ratio: "4:3",
      resolution: "1080p",
      seed: -1,
    },
  });
  console.log("Generated Runway Gen4 Standard multi-ref image URL:", image);
  expect(image).toMatch(/^https/);
  expect(costs).toBe(0.08);
});

Deno.test("Runway Gen4 Image Turbo: portrait aspect ratio", async () => {
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
      model: "turbo",
      prompt:
        "transform into a professional portrait in natural lighting for @person",
      images: ["https://picsum.photos/800/1200"],
      tags: "@person",
      aspect_ratio: "3:4",
      resolution: "1080p",
      seed: -1,
    },
  });
  console.log("Generated Runway Gen4 Turbo portrait image URL:", image);
  expect(image).toMatch(/^https/);
  expect(costs).toBe(0.05);
});

Deno.test("Runway Gen4 Image Standard: default settings", async () => {
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
      prompt: "change style to anime for @cat",
      images: ["https://picsum.photos/1024/1024"],
    },
  });
  console.log(
    "Generated Runway Gen4 Standard default settings image URL:",
    image
  );
  expect(image).toMatch(/^https/);
  expect(costs).toBe(0.08);
});
