import { load } from "https://deno.land/std@0.224.0/dotenv/mod.ts";
import { expect } from "https://deno.land/std@0.224.0/expect/mod.ts";
import { runNode } from "../../../utils/run-node.js";
import { costs, run } from "./script.js";

const { ARTWORKS_USER, ARTWORKS_PASSWORD } = await load({
  envPath: ".env",
  export: true,
});

Deno.test(
  "ArtWorks Describe Image: costs calculation for regular scope",
  () => {
    const result = costs({
      env: { scope: {} },
      inputs: {},
    });
    expect(result).toBe(0.0013);
  }
);

Deno.test("ArtWorks Describe Image: costs are zero for user scope", () => {
  const result = costs({
    env: { scope: { ARTWORKS_USER: "user" } },
    inputs: {},
  });
  expect(result).toBe(0);
});

Deno.test(
  "ArtWorks Describe Image: describe image with high detail",
  async () => {
    const {
      costs: actualCosts,
      outputs: { text },
    } = await runNode(run, {
      env: {
        scope: {},
        variables: {
          ARTWORKS_USER,
          ARTWORKS_PASSWORD,
        },
      },
      inputs: {
        image: "https://httpbin.org/image/jpeg",
        details: "high",
      },
    });
    console.log("Image description (high detail):", text);
    expect(typeof text).toBe("string");
    expect(text.length).toBeGreaterThan(0);
    expect(actualCosts).toBe(0.0013);
  }
);
