import { load } from "https://deno.land/std@0.224.0/dotenv/mod.ts";
import { expect } from "https://deno.land/std@0.224.0/expect/mod.ts";
import { runNode } from "../../../utils/run-node.js";
import { costs, run } from "./script.js";

const { ARTWORKS_USER, ARTWORKS_PASSWORD } = await load({
  envPath: ".env",
  export: true,
});

Deno.test(
  "ArtWorks Classify Image: costs calculation for regular scope",
  () => {
    const result = costs({
      env: { scope: {} },
      inputs: {},
    });
    expect(result).toBe(0.0001);
  }
);

Deno.test("ArtWorks Classify Image: costs are zero for user scope", () => {
  const result = costs({
    env: { scope: { ARTWORKS_USER: "user" } },
    inputs: {},
  });
  expect(result).toBe(0);
});

Deno.test(
  "ArtWorks Classify Image: classify image with custom labels",
  async () => {
    const {
      costs: actualCosts,
      outputs: { labels },
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
        labels: {
          male: "man posing",
          female: "girl posing",
        },
      },
    });
    console.log("Classification results:", labels);
    expect(typeof labels).toBe("object");
    expect(labels).toHaveProperty("male");
    expect(labels).toHaveProperty("female");
    expect(typeof labels.male).toBe("number");
    expect(typeof labels.female).toBe("number");
    expect(actualCosts).toBe(0.0001);
  }
);
