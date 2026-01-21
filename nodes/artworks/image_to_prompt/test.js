import { load } from "https://deno.land/std@0.224.0/dotenv/mod.ts";
import { expect } from "https://deno.land/std@0.224.0/expect/mod.ts";
import { runNode } from "../../../utils/run-node.js";
import { costs, run } from "./script.js";

const { ARTWORKS_USER, ARTWORKS_PASSWORD } = await load({
  envPath: ".env",
  export: true,
});

Deno.test(
  "ArtWorks Image to Prompt: costs calculation for regular scope",
  () => {
    const result = costs({
      env: { scope: {} },
      inputs: {},
    });
    expect(result).toBe(0.001);
  }
);

Deno.test("ArtWorks Image to Prompt: costs are zero for user scope", () => {
  const result = costs({
    env: { scope: { ARTWORKS_USER: "user" } },
    inputs: {},
  });
  expect(result).toBe(0);
});

Deno.test(
  "ArtWorks Image to Prompt: generate prompt from image (photo type)",
  async () => {
    const {
      costs,
      outputs: { prompt },
    } = await runNode(run, {
      env: {
        scope: {},
        variables: {
          ARTWORKS_USER,
          ARTWORKS_PASSWORD,
        },
      },
      inputs: {
        image:
          "https://cdn.jsdelivr.net/gh/my-piper/piper-nodes@main/assets/man_posing.jpg",
        type: "photo",
      },
    });
    console.log("Generated prompt:", prompt);
    expect(typeof prompt).toBe("string");
    expect(prompt.length).toBeGreaterThan(0);
    expect(costs).toBe(0.001);
  }
);
