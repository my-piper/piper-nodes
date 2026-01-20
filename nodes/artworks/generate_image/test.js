import { load } from "https://deno.land/std@0.224.0/dotenv/mod.ts";
import { expect } from "https://deno.land/std@0.224.0/expect/mod.ts";
import { runNode } from "../../../utils/run-node.js";

const { ARTWORKS_USER, ARTWORKS_PASSWORD } = await load({
  envPath: ".env",
  export: true,
});

import { costs, run } from "./script.js";

Deno.test(
  "ArtWorks Generate Image: costs calculation for express performance",
  () => {
    const result = costs({
      env: {
        scope: {},
        variables: {
          ARTWORKS_USER,
          ARTWORKS_PASSWORD,
        },
      },
      inputs: {
        batchSize: 4,
        performance: "express",
      },
    });
    expect(result.costs).toBe(0.01); // 4 * 0.0025
    expect(result.details).toBe("en=For express;ru=Экспресс");
  }
);

Deno.test(
  "ArtWorks Generate Image: costs calculation for speed performance",
  () => {
    const result = costs({
      env: {
        scope: {},
        variables: {
          ARTWORKS_USER,
          ARTWORKS_PASSWORD,
        },
      },
      inputs: {
        batchSize: 2,
        performance: "speed",
      },
    });
    expect(result.costs).toBe(0.01); // 2 * 0.005
    expect(result.details).toBe("en=For speed;ru=Скорость");
  }
);

Deno.test(
  "ArtWorks Generate Image: costs calculation for quality performance",
  () => {
    const result = costs({
      env: {
        scope: {},
        variables: {
          ARTWORKS_USER,
          ARTWORKS_PASSWORD,
        },
      },
      inputs: {
        performance: "quality",
      },
    });
    expect(result.costs).toBe(0.01); // 1 * 0.01
    expect(result.details).toBe("en=For quality;ru=Качество");
  }
);

Deno.test("ArtWorks Generate Image: costs are zero for user scope", () => {
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
      batchSize: 10,
      performance: "quality",
    },
  });
  expect(result).toBe(0);
});

Deno.test(
  "ArtWorks Generate Image: generation with express performance",
  async () => {
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
        prompt: "a beautiful sunset over mountains",
        negativePrompt: "blurry, low quality",
        checkpoint: "PonyASDF_0.4_f6cosineb.fp16.safetensors",
        cfgScale: 10,
        imageSize: "1024x1024",
        performance: "express",
      },
    });
    console.log("Generated images:", images);
    expect(Array.isArray(images)).toBe(true);
    expect(images.length).toBeGreaterThan(0);
    expect(images[0]).toMatch(/^https/);
    expect(costs.costs).toBe(0.0025);
  }
);

Deno.test(
  "ArtWorks Generate Image: text-to-image with quality performance",
  async () => {
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
        prompt: "a futuristic cityscape at night",
        checkpoint: "anikurender_0.4b.fp16.safetensors",
        cfgScale: 7.5,
        imageSize: "1024x1024",
        performance: "quality",
        sharpness: 3,
        seed: 42,
      },
    });
    console.log("Generated quality images:", images);
    expect(Array.isArray(images)).toBe(true);
    expect(images.length).toBeGreaterThan(0);
    expect(images[0]).toMatch(/^https/);
    expect(costs.costs).toBe(0.01);
  }
);

Deno.test(
  "ArtWorks Generate Image: batch generation with speed performance",
  async () => {
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
        prompt: "cute cat playing with yarn",
        negativePrompt: "ugly, distorted",
        checkpoint: "aniku_0.2.fp16.safetensors",
        imageSize: "704x1408",
        performance: "speed",
      },
    });
    console.log("Generated batch images:", images);
    expect(Array.isArray(images)).toBe(true);
    images.forEach((image) => {
      expect(image).toMatch(/^https/);
    });
    expect(costs.costs).toBe(0.005);
  }
);
