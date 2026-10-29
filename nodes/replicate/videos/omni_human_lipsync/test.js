import { load } from "https://deno.land/std@0.224.0/dotenv/mod.ts";
import { expect } from "https://deno.land/std@0.224.0/expect/mod.ts";
import { runNode } from "../../../../utils/run-node.js";

const { REPLICATE_TOKEN } = await load({
  envPath: ".env",
  export: true,
});

import { run } from "./script.js";

Deno.test("Omni Human Lipsync: image + audio to video", async () => {
  const {
    costs,
    outputs: { video },
  } = await runNode(run, {
    env: {
      scope: {},
      variables: {
        REPLICATE_TOKEN,
      },
    },
    inputs: {
      image:
        "https://cdn.jsdelivr.net/gh/my-piper/piper-nodes@main/assets/man_posing.jpg",
      audio:
        "https://cdn.jsdelivr.net/gh/my-piper/piper-nodes@main/assets/speaking_man.wav",
    },
  });
  console.log("Generated video URL:", video);
  expect(video).toMatch(/^https/);
  expect(costs).toBeCloseTo(0.7, 1);
});
