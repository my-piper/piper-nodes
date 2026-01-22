import { load } from "https://deno.land/std@0.224.0/dotenv/mod.ts";
import { expect } from "https://deno.land/std@0.224.0/expect/mod.ts";
import { runNode } from "../../../../utils/run-node.js";

const { FAL_KEY } = await load({
  envPath: ".env",
  export: true,
});

import { run } from "./script.js";

Deno.test("Kling 2.6: text to video with audio", async () => {
  const {
    costs,
    outputs: { video },
  } = await runNode(run, {
    env: {
      scope: {},
      variables: {
        FAL_KEY,
      },
    },
    inputs: {
      model: "2_6",
      prompt: "cat astronaut walking at a moon",
      duration: "5",
      aspect_ratio: "16:9",
      generate_audio: true,
      cfg_scale: 0.5,
      negative_prompt: "blur, distort, and low quality",
    },
  });
  console.log("Generated video URL:", video);
  expect(video).toMatch(/^https/);
  expect(costs).toBe(0.7); // 0.14 * 5 seconds
});

Deno.test("Kling 2.6: text to video without audio", async () => {
  const {
    costs,
    outputs: { video },
  } = await runNode(run, {
    env: {
      scope: {},
      variables: {
        FAL_KEY,
      },
    },
    inputs: {
      model: "2_6",
      prompt: "a beautiful sunset over the ocean with waves",
      duration: "10",
      aspect_ratio: "9:16",
      generate_audio: false,
      cfg_scale: 0.5,
    },
  });
  console.log("Generated video URL:", video);
  expect(video).toMatch(/^https/);
  expect(costs).toBe(0.7); // 0.07 * 10 seconds
});

Deno.test("Kling 2.5: image to video", async () => {
  const {
    costs,
    outputs: { video },
  } = await runNode(run, {
    env: {
      scope: {},
      variables: {
        FAL_KEY,
      },
    },
    inputs: {
      model: "2_5",
      prompt: "zoom in slowly",
      image:
        "https://cdn.jsdelivr.net/gh/my-piper/piper-nodes@main/assets/man_posing.jpg",
      duration: "5",
      aspect_ratio: "1:1",
      generate_audio: false,
      cfg_scale: 0.5,
    },
  });
  console.log("Generated video URL:", video);
  expect(video).toMatch(/^https/);
  expect(costs).toBe(0.35); // 0.07 * 5 seconds
});

Deno.test("Kling 2.1: image to video", async () => {
  const {
    costs,
    outputs: { video },
  } = await runNode(run, {
    env: {
      scope: {},
      variables: {
        FAL_KEY,
      },
    },
    inputs: {
      model: "2_1",
      prompt: "pan camera to the right",
      image:
        "https://cdn.jsdelivr.net/gh/my-piper/piper-nodes@main/assets/man_posing.jpg",
      duration: "5",
      aspect_ratio: "16:9",
      generate_audio: false,
      cfg_scale: 0.5,
    },
  });
  console.log("Generated video URL:", video);
  expect(video).toMatch(/^https/);
  expect(costs).toBe(0.25); // 0.05 * 5 seconds
});

Deno.test("Kling 2.6: default settings", async () => {
  const {
    costs,
    outputs: { video },
  } = await runNode(run, {
    env: {
      scope: {},
      variables: {
        FAL_KEY,
      },
    },
    inputs: {
      prompt: "a futuristic cityscape with flying cars",
    },
  });
  console.log("Generated video URL:", video);
  expect(video).toMatch(/^https/);
  expect(costs).toBe(0.7); // 0.14 * 5 seconds (default: 2_6, 5s, audio on)
});

