import { load } from "https://deno.land/std@0.224.0/dotenv/mod.ts";
import { expect } from "https://deno.land/std@0.224.0/expect/mod.ts";
import { runNode } from "../../../utils/run-node.js";
import { costs, run } from "./script.js";

const { ARTWORKS_USER, ARTWORKS_PASSWORD } = await load({
  envPath: ".env",
  export: true,
});

Deno.test(
  "ArtWorks Face Swap on image: costs calculation for regular scope",
  () => {
    const result = costs({
      env: { scope: {} },
      inputs: {},
    });
    expect(result).toBe(0.005);
  }
);

Deno.test("ArtWorks Face Swap on image: costs are zero for user scope", () => {
  const result = costs({
    env: { scope: { ARTWORKS_USER: "user" } },
    inputs: {},
  });
  expect(result).toBe(0);
});

Deno.test("ArtWorks Face Swap on image: swap face on image", async () => {
  const {
    costs,
    outputs: { image },
  } = await runNode(run, {
    env: {
      scope: {},
      variables: {
        ARTWORKS_USER,
        ARTWORKS_PASSWORD,
      },
    },
    inputs: {
      face: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d",
      image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80",
    },
  });
  console.log("Face swap result:", image);
  expect(image).toMatch(/^https/);
  expect(costs).toBe(0.005);
});
