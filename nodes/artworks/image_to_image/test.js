import { load } from "https://deno.land/std@0.224.0/dotenv/mod.ts";
import { expect } from "https://deno.land/std@0.224.0/expect/mod.ts";
import { runNode } from "../../../utils/run-node.js";

const { ARTWORKS_USER, ARTWORKS_PASSWORD } = await load({
  envPath: ".env",
  export: true,
});

import { costs, run } from "./script.js";

Deno.test(
  "ArtWorks Image to Image: costs calculation with express performance",
  () => {
    const result = costs({
      env: {
        scope: {},
      },
      inputs: {
        performance: "express",
        batchSize: 1,
      },
    });
    expect(result).toBe(0.005);
  }
);

Deno.test(
  "ArtWorks Image to Image: costs calculation with speed performance",
  () => {
    const result = costs({
      env: {
        scope: {},
      },
      inputs: {
        performance: "speed",
        batchSize: 1,
      },
    });
    expect(result).toBe(0.01);
  }
);

Deno.test(
  "ArtWorks Image to Image: costs calculation with quality performance",
  () => {
    const result = costs({
      env: {
        scope: {},
      },
      inputs: {
        performance: "quality",
        batchSize: 1,
      },
    });
    expect(result).toBe(0.015);
  }
);

Deno.test(
  "ArtWorks Image to Image: costs calculation with batch size 4",
  () => {
    const result = costs({
      env: {
        scope: {},
      },
      inputs: {
        performance: "speed",
        batchSize: 4,
      },
    });
    expect(result).toBe(0.04); // 0.01 * 4
  }
);

Deno.test("ArtWorks Image to Image: costs are zero for user scope", () => {
  const result = costs({
    env: {
      scope: {
        ARTWORKS_USER: "user",
      },
    },
    inputs: {
      performance: "quality",
      batchSize: 2,
    },
  });
  expect(result).toBe(0);
});

Deno.test("ArtWorks Image to Image: run function exists and is async", () => {
  expect(typeof run).toBe("function");
  expect(run.constructor.name).toBe("AsyncFunction");
});

Deno.test("ArtWorks Image to Image: costs function is not async", () => {
  expect(typeof costs).toBe("function");
  expect(costs.constructor.name).toBe("Function");
});

Deno.test(
  "ArtWorks Image to Image: generate image from image with prompt",
  async () => {
    const {
      costs: resultCosts,
      outputs: { images },
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
        prompt: "a beautiful sunset over mountains",
        checkpoint: "juggernautXL_v9Rundiffusionphoto2.safetensors",
        performance: "express",
        batchSize: 2,
        denoisingStrength: 1,
        cfgScale: 7,
      },
    });
    console.log("Generated images:", images);
    expect(Array.isArray(images)).toBe(true);
    expect(images.length).toBe(2);
    expect(typeof images[0]).toBe("string");
    expect(images[0]).toMatch(/^https/);
    expect(resultCosts).toBe(0.01); // express performance * 2
  }
);

Deno.test(
  "ArtWorks Image to Image: generate with custom imageSize",
  async () => {
    const {
      costs: resultCosts,
      outputs: { images },
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
        prompt: "a beautiful landscape",
        checkpoint: "juggernautXL_v9Rundiffusionphoto2.safetensors",
        performance: "express",
        denoisingStrength: 0.5,
        imageSize: "512:auto",
        cfgScale: 7,
      },
    });
    console.log("Generated images with custom size:", images);
    expect(Array.isArray(images)).toBe(true);
    expect(images.length).toBeGreaterThan(0);
    expect(typeof images[0]).toBe("string");
    expect(images[0]).toMatch(/^https/);
    // Cost depends on actual batch size returned by API
    expect(typeof resultCosts).toBe("number");
  }
);
