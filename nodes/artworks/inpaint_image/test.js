import { load } from "https://deno.land/std@0.224.0/dotenv/mod.ts";
import { expect } from "https://deno.land/std@0.224.0/expect/mod.ts";
import { runNode } from "../../../utils/run-node.js";
import { costs, run } from "./script.js";

const { ARTWORKS_USER, ARTWORKS_PASSWORD } = await load({
  envPath: ".env",
  export: true,
});

Deno.test(
  "ArtWorks Inpaint Image: costs calculation for express performance",
  () => {
    const result = costs({
      env: { scope: {} },
      inputs: { performance: "express" },
    });
    expect(result).toBe(0.0032);
  }
);

Deno.test(
  "ArtWorks Inpaint Image: costs calculation for speed performance",
  () => {
    const result = costs({
      env: { scope: {} },
      inputs: { performance: "speed" },
    });
    expect(result).toBe(0.0043);
  }
);

Deno.test(
  "ArtWorks Inpaint Image: costs calculation for quality performance",
  () => {
    const result = costs({
      env: { scope: {} },
      inputs: { performance: "quality" },
    });
    expect(result).toBe(0.0054);
  }
);

Deno.test("ArtWorks Inpaint Image: costs are zero for user scope", () => {
  const result = costs({
    env: { scope: { ARTWORKS_USER: "user" } },
    inputs: { performance: "speed" },
  });
  expect(result).toBe(0);
});

Deno.test("ArtWorks Inpaint Image: inpaint image with mask", async () => {
  const {
    costs,
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
        "https://cdn.jsdelivr.net/gh/my-piper/piper-nodes@main/assets/girl_posing.jpg",
      mask: "https://cdn.jsdelivr.net/gh/my-piper/piper-nodes@main/assets/girl_posing_mask.png",
      prompt: "reddress fashionable clothes",
      checkpoint: "juggernautXL_v9Rundiffusionphoto2.safetensors",
      performance: "express",
      denoisingStrength: 0.9,
      cfgScale: 7,
      batchSize: 1,
      imageSize: "auto:auto",
    },
  });
  console.log("Inpainted images:", images);
  expect(Array.isArray(images)).toBe(true);
  expect(images.length).toBeGreaterThan(0);
  expect(typeof images[0]).toBe("string");
  expect(costs).toBe(0.0032);
});
