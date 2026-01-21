import { expect } from "https://deno.land/std@0.224.0/expect/mod.ts";
import { runNode } from "../../../utils/run-node.js";
import { costs, run } from "./script.js";

const ARTWORKS_USER = Deno.env.get("ARTWORKS_USER");
const ARTWORKS_PASSWORD = Deno.env.get("ARTWORKS_PASSWORD");

Deno.test(
  "ArtWorks Outpaint on Image: costs calculation with express performance",
  () => {
    const result = costs({
      env: { scope: {} },
      inputs: { performance: "express", batchSize: 1 },
    });
    expect(result).toBe(0.005);
  }
);

Deno.test(
  "ArtWorks Outpaint on Image: costs calculation with speed performance",
  () => {
    const result = costs({
      env: { scope: {} },
      inputs: { performance: "speed", batchSize: 1 },
    });
    expect(result).toBe(0.01);
  }
);

Deno.test(
  "ArtWorks Outpaint on Image: costs calculation with quality performance",
  () => {
    const result = costs({
      env: { scope: {} },
      inputs: { performance: "quality", batchSize: 1 },
    });
    expect(result).toBe(0.015);
  }
);

Deno.test(
  "ArtWorks Outpaint on Image: costs calculation with batch size 4",
  () => {
    const result = costs({
      env: { scope: {} },
      inputs: { performance: "speed", batchSize: 4 },
    });
    expect(result).toBe(0.04);
  }
);

Deno.test("ArtWorks Outpaint on Image: costs are zero for user scope", () => {
  const result = costs({
    env: { scope: { ARTWORKS_USER: "user" } },
    inputs: { performance: "speed", batchSize: 1 },
  });
  expect(result).toBe(0);
});

Deno.test({
  name: "ArtWorks Outpaint on Image: outpaint image with custom distances",
  fn: async () => {
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
        image:
          "https://cdn.jsdelivr.net/gh/my-piper/piper-nodes@main/assets/man_posing.jpg",
        prompt: "a beautiful man posing in nature, high detail, photorealistic",
        checkpoint: "juggernautXL_v9Rundiffusionphoto2.safetensors",
        performance: "express",
        batchSize: 2,
        denoisingStrength: 0.5,
        cfgScale: 7,
        distanceTop: 100,
        distanceRight: 100,
        distanceBottom: 100,
        distanceLeft: 100,
      },
    });
    console.log("Outpainted images:", images);
    expect(Array.isArray(images)).toBe(true);
    expect(images.length).toBe(2);
    expect(typeof images[0]).toBe("string");
    expect(images[0]).toMatch(/^https/);
    expect(resultCosts).toBe(0.01); // express performance * 2
  },
});
