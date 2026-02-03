import { load } from "https://deno.land/std@0.224.0/dotenv/mod.ts";
import { expect } from "https://deno.land/std@0.224.0/expect/mod.ts";
import { runNode } from "../../../../utils/run-node.js";

const env = await load({
  envPath: ".env",
  export: true,
});

import { run } from "./script.js";

Deno.test("Chatterbox replicate: default generate audio", async () => {
  const text = "Hello, this is a test of the Chatterbox text to speech system.";
  const {
    costs,
    outputs: { audio },
  } = await runNode(run, {
    env: {
      scope: {},
      variables: {
        REPLICATE_TOKEN: env.REPLICATE_TOKEN,
      },
    },
    inputs: { text },
  });
  console.log("Generated audio URL:", audio);
  expect(audio).toMatch(/^https/);
  expect(costs).toBeCloseTo((text.length / 1000) * 0.025, 5);
});
