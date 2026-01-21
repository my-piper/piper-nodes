import { load } from "https://deno.land/std@0.224.0/dotenv/mod.ts";
import { expect } from "https://deno.land/std@0.224.0/expect/mod.ts";
import { runNode } from "../../../utils/run-node.js";
import { costs, run } from "./script.js";

const { ARTWORKS_USER, ARTWORKS_PASSWORD } = await load({
  envPath: ".env",
  export: true,
});

Deno.test("ArtWorks Ask LLM Agent: costs calculation for regular scope", () => {
  const result = costs({
    env: { scope: {} },
    inputs: {},
  });
  expect(result).toBe(0.001);
});

Deno.test("ArtWorks Ask LLM Agent: costs are zero for user scope", () => {
  const result = costs({
    env: { scope: { ARTWORKS_USER: "user" } },
    inputs: {},
  });
  expect(result).toBe(0);
});

Deno.test(
  "ArtWorks Ask LLM Agent: ask question and get text answer",
  async () => {
    const {
      costs,
      outputs: { text },
    } = await runNode(run, {
      env: {
        scope: {},
        variables: {
          ARTWORKS_USER,
          ARTWORKS_PASSWORD,
        },
      },
      inputs: {
        model: "deepseek-r1:8b",
        question: "What is 2+2? Answer with just the number.",
        answerFormat: "text",
      },
    });
    console.log("LLM answer:", text);
    expect(typeof text).toBe("string");
    expect(text.length).toBeGreaterThan(0);
    expect(costs).toBe(0.001);
  }
);
