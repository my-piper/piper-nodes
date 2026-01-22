import { load } from "https://deno.land/std@0.224.0/dotenv/mod.ts";
import { expect } from "https://deno.land/std@0.224.0/expect/mod.ts";
import { runNode } from "../../../../utils/run-node.js";

const { FAL_KEY } = await load({
  envPath: ".env",
  export: true,
});

import { run } from "./script.js";

Deno.test("Pixverse 5.5: text to video 720p 5s", async () => {
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
      prompt: "a cat astronaut walking on the moon",
      resolution: "720p",
      duration: "5",
      aspect_ratio: "16:9",
      generate_multi_clip_switch: false,
      generate_audio_switch: false,
    },
  });
  console.log("Generated video URL:", video);
  expect(video).toMatch(/^https/);
  expect(costs).toBeCloseTo(0.2, 2); // 0.2 * 1
});

Deno.test("Pixverse 5.5: text to video 720p 10s", async () => {
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
      prompt: "a beautiful sunset over the ocean with waves",
      resolution: "720p",
      duration: "10",
      aspect_ratio: "9:16",
      generate_multi_clip_switch: false,
      generate_audio_switch: false,
    },
  });
  console.log("Generated video URL:", video);
  expect(video).toMatch(/^https/);
  expect(costs).toBeCloseTo(0.44, 2); // 0.2 * 2.2
});

Deno.test("Pixverse 5.5: image to video with audio", async () => {
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
      prompt: "zoom in slowly",
      image:
        "https://cdn.jsdelivr.net/gh/my-piper/piper-nodes@main/assets/man_posing.jpg",
      resolution: "720p",
      duration: "5",
      aspect_ratio: "1:1",
      generate_multi_clip_switch: false,
      generate_audio_switch: true,
    },
  });
  console.log("Generated video URL:", video);
  expect(video).toMatch(/^https/);
  expect(costs).toBeCloseTo(0.25, 2); // (0.2 + 0.05) * 1
});

Deno.test("Pixverse 5.5: text to video with multi-clip", async () => {
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
      resolution: "720p",
      duration: "5",
      aspect_ratio: "16:9",
      generate_multi_clip_switch: true,
      generate_audio_switch: false,
    },
  });
  console.log("Generated video URL:", video);
  expect(video).toMatch(/^https/);
  expect(costs).toBeCloseTo(0.3, 2); // (0.2 + 0.1) * 1
});

Deno.test("Pixverse 5.5: text to video with multi-clip and audio", async () => {
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
      prompt: "a dragon flying through clouds",
      resolution: "720p",
      duration: "5",
      aspect_ratio: "16:9",
      generate_multi_clip_switch: true,
      generate_audio_switch: true,
      style: "anime",
    },
  });
  console.log("Generated video URL:", video);
  expect(video).toMatch(/^https/);
  expect(costs).toBeCloseTo(0.35, 2); // (0.2 + 0.15) * 1
});

Deno.test("Pixverse 5.5: text to video 1080p 8s", async () => {
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
      prompt: "a serene forest with sunlight filtering through trees",
      resolution: "1080p",
      duration: "8",
      aspect_ratio: "16:9",
      generate_multi_clip_switch: false,
      generate_audio_switch: false,
    },
  });
  console.log("Generated video URL:", video);
  expect(video).toMatch(/^https/);
  expect(costs).toBeCloseTo(0.8, 2); // 0.4 * 2
});
