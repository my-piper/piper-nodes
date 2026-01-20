import { load } from "https://deno.land/std@0.224.0/dotenv/mod.ts";
import { expect } from "https://deno.land/std@0.224.0/expect/mod.ts";
import { runNode } from "../../../utils/run-node.js";

const { ARTWORKS_USER, ARTWORKS_PASSWORD } = await load({
  envPath: ".env",
  export: true,
});

import { costs, run } from "./script.js";

Deno.test("ArtWorks Upscale Image: costs calculation with 2x resize", () => {
  const result = costs({
    env: {
      scope: {},
      variables: {
        ARTWORKS_USER,
        ARTWORKS_PASSWORD,
      },
    },
    inputs: {
      upscalingResize: 2,
    },
  });
  expect(result).toBe(0.01); // 0.005 * 2
});

Deno.test("ArtWorks Upscale Image: costs calculation with 4x resize", () => {
  const result = costs({
    env: {
      scope: {},
      variables: {
        ARTWORKS_USER,
        ARTWORKS_PASSWORD,
      },
    },
    inputs: {
      upscalingResize: 4,
    },
  });
  expect(result).toBe(0.02); // 0.005 * 4
});

Deno.test("ArtWorks Upscale Image: costs calculation with 1.5x resize", () => {
  const result = costs({
    env: {
      scope: {},
      variables: {
        ARTWORKS_USER,
        ARTWORKS_PASSWORD,
      },
    },
    inputs: {
      upscalingResize: 1.5,
    },
  });
  expect(result).toBe(0.0075); // 0.005 * 1.5
});

Deno.test("ArtWorks Upscale Image: costs are zero for user scope", () => {
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
    inputs: {
      upscalingResize: 2,
    },
  });
  expect(result).toBe(0);
});

Deno.test("ArtWorks Upscale Image: run function exists and is async", () => {
  expect(typeof run).toBe("function");
  expect(run.constructor.name).toBe("AsyncFunction");
});

Deno.test("ArtWorks Upscale Image: costs function is not async", () => {
  expect(typeof costs).toBe("function");
  expect(costs.constructor.name).toBe("Function");
});

Deno.test("ArtWorks Upscale Image: upscale image with 2x resize", async () => {
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
      upscalingResize: 2,
    },
  });
  console.log("Upscaled image URL:", image);
  expect(typeof image).toBe("string");
  expect(image).toMatch(/^https/);
  expect(resultCosts).toBe(0.01); // 0.005 * 2
});
