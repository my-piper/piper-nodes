import { load } from "https://deno.land/std@0.224.0/dotenv/mod.ts";
import { expect } from "https://deno.land/std@0.224.0/expect/mod.ts";
import { runNode } from "../../../../utils/run-node.js";

const { FAL_KEY } = await load({
  envPath: ".env",
  export: true,
});

import { run } from "./script.js";

Deno.test("Hailuo 2.3: text to video 6 seconds", async () => {
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
      model: "2_3",
      prompt: "a cat astronaut walking on the moon",
      duration: "6",
      prompt_optimizer: true,
    },
  });
  console.log("Generated video URL:", video);
  expect(video).toMatch(/^https/);
  expect(costs).toBeCloseTo(0.28, 2); // 0.28 for 6 seconds
});
