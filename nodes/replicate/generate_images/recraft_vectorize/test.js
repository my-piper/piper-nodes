import { load } from "https://deno.land/std@0.224.0/dotenv/mod.ts";
import { expect } from "https://deno.land/std@0.224.0/expect/mod.ts";
import { runNode } from "../../../../utils/run-node.js";

const env = await load({
  envPath: ".env",
  export: true,
});

import { run } from "./script.js";

Deno.test("Recraft Vectorize: convert raster image to SVG", async () => {
  const {
    costs,
    outputs: { svg },
  } = await runNode(run, {
    env: {
      scope: {},
      variables: {
        REPLICATE_TOKEN: env.REPLICATE_TOKEN,
      },
    },
    inputs: {
      image: "https://picsum.photos/512/512",
    },
  });
  console.log("Generated SVG URL:", svg);
  expect(svg).toMatch(/^https/);
  expect(costs).toBe(0.01);
});

Deno.test("Recraft Vectorize: convert landscape image to SVG", async () => {
  const {
    costs,
    outputs: { svg },
  } = await runNode(run, {
    env: {
      scope: {},
      variables: {
        REPLICATE_TOKEN: env.REPLICATE_TOKEN,
      },
    },
    inputs: {
      image: "https://picsum.photos/800/600",
    },
  });
  console.log("Generated SVG from landscape image:", svg);
  expect(svg).toMatch(/^https/);
  expect(costs).toBe(0.01);
});

Deno.test("Recraft Vectorize: convert portrait image to SVG", async () => {
  const {
    costs,
    outputs: { svg },
  } = await runNode(run, {
    env: {
      scope: {},
      variables: {
        REPLICATE_TOKEN: env.REPLICATE_TOKEN,
      },
    },
    inputs: {
      image: "https://picsum.photos/600/800",
    },
  });
  console.log("Generated SVG from portrait image:", svg);
  expect(svg).toMatch(/^https/);
  expect(costs).toBe(0.01);
});
