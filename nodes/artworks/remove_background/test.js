import { load } from "https://deno.land/std@0.224.0/dotenv/mod.ts";
import { expect } from "https://deno.land/std@0.224.0/expect/mod.ts";
import { runNode } from "../../../utils/run-node.js";

const { ARTWORKS_USER, ARTWORKS_PASSWORD } = await load({
  envPath: ".env",
  export: true,
});

import { costs, run } from "./script.js";

Deno.test("ArtWorks Remove Background: costs calculation", () => {
  const result = costs({
    env: {
      scope: {},
      variables: {
        ARTWORKS_USER,
        ARTWORKS_PASSWORD,
      },
    },
    inputs: {},
  });
  expect(result).toBe(0.005);
});

Deno.test("ArtWorks Remove Background: costs are zero for user scope", () => {
  const result = costs({
    env: {
      scope: {
        ARTWORKS_USER: "user",
      },
      variables: {
        ARTWORKS_USER,
        ARTWORKS_PASSWORD,
      },
    },
    inputs: {},
  });
  expect(result).toBe(0);
});

Deno.test(
  "ArtWorks Remove Background: run function exists and is async",
  () => {
    expect(typeof run).toBe("function");
    expect(run.constructor.name).toBe("AsyncFunction");
  }
);

Deno.test("ArtWorks Remove Background: costs function is not async", () => {
  expect(typeof costs).toBe("function");
  expect(costs.constructor.name).toBe("Function");
});

Deno.test(
  "ArtWorks Remove Background: remove background from image",
  async () => {
    const {
      costs: resultCosts,
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
        image: "https://httpbin.org/image/jpeg",
      },
    });
    console.log("Background removed image URL:", image);
    expect(typeof image).toBe("string");
    expect(image).toMatch(/^https/);
    expect(resultCosts).toBe(0.005);
  }
);
