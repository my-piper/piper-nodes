import { load } from "https://deno.land/std@0.224.0/dotenv/mod.ts";
import { expect } from "https://deno.land/std@0.224.0/expect/mod.ts";
import { runNode } from "../../../../utils/run-node.js";

const { FAL_KEY } = await load({
  envPath: ".env",
  export: true,
});

import { run } from "./script.js";

Deno.test("Vidu Q2: text to video 720p 4s", async () => {
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
      duration: "4",
      aspect_ratio: "16:9",
      movement_amplitude: "auto",
    },
  });
  console.log("Generated video URL:", video);
  expect(video).toMatch(/^https/);
  expect(costs).toBeCloseTo(0.3, 3); // 0.3 + 4*0
});

Deno.test("Vidu Q2: text to video 1080p 4s", async () => {
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
      resolution: "1080p",
      duration: "4",
      aspect_ratio: "9:16",
      movement_amplitude: "medium",
    },
  });
  console.log("Generated video URL:", video);
  expect(video).toMatch(/^https/);
  expect(costs).toBeCloseTo(0.6, 3); // 0.2 + 4*0.1
});

Deno.test("Vidu Q2: image to video 720p 4s", async () => {
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
      duration: "4",
      movement_amplitude: "small",
    },
  });
  console.log("Generated video URL:", video);
  expect(video).toMatch(/^https/);
  expect(costs).toBeCloseTo(0.3, 3); // 0.1 + 4*0.05
});

Deno.test("Vidu Q2: image to video 1080p 6s", async () => {
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
      prompt: "camera pans around the subject",
      image:
        "https://cdn.jsdelivr.net/gh/my-piper/piper-nodes@main/assets/man_posing.jpg",
      resolution: "1080p",
      duration: "6",
      movement_amplitude: "large",
    },
  });
  console.log("Generated video URL:", video);
  expect(video).toMatch(/^https/);
  expect(costs).toBeCloseTo(0.9, 3); // 0.3 + 6*0.1
});

Deno.test("Vidu Q2: video extension 720p 4s", async () => {
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
      prompt: "continue the motion smoothly",
      video:
        "https://cdn.jsdelivr.net/gh/my-piper/piper-nodes@main/assets/girl_camera_posing.mp4",
      resolution: "720p",
      duration: "4",
      movement_amplitude: "auto",
    },
  });
  console.log("Generated video URL:", video);
  expect(video).toMatch(/^https/);
  expect(costs).toBeCloseTo(0.525, 3); // 0.075 + 4*0.1125
});

Deno.test("Vidu Q2: video extension 1080p 4s", async () => {
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
      prompt: "extend the video with smooth transitions",
      video:
        "https://cdn.jsdelivr.net/gh/my-piper/piper-nodes@main/assets/girl_camera_posing.mp4",
      resolution: "1080p",
      duration: "4",
      movement_amplitude: "medium",
    },
  });
  console.log("Generated video URL:", video);
  expect(video).toMatch(/^https/);
  expect(costs).toBeCloseTo(0.825, 3); // 0.375 + 4*0.1125
});

