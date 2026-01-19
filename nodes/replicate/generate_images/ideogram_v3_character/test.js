import { load } from "https://deno.land/std@0.224.0/dotenv/mod.ts";
import { expect } from "https://deno.land/std@0.224.0/expect/mod.ts";
import { runNode } from "../../../../utils/run-node.js";

const env = await load({
  envPath: ".env",
  export: true,
});

import { run } from "./script.js";

Deno.test("Ideogram V3 Character: Turbo speed", async () => {
  const {
    costs,
    outputs: { image },
  } = await runNode(run, {
    env: {
      scope: {},
      variables: {
        REPLICATE_TOKEN: env.REPLICATE_TOKEN,
      },
    },
    inputs: {
      prompt: "walking in a futuristic city",
      character_reference_image: "https://picsum.photos/id/64/512/512",
      rendering_speed: "Turbo",
      style_type: "Auto",
      aspect_ratio: "16:9",
      resolution: "None",
      magic_prompt_option: "Auto",
      seed: -1,
    },
  });
  console.log("Generated Ideogram V3 Character Turbo image URL:", image);
  expect(image).toMatch(/^https/);
  expect(costs).toBe(0.1);
});

Deno.test(
  "Ideogram V3 Character: Default speed with Fiction style",
  async () => {
    const {
      costs,
      outputs: { image },
    } = await runNode(run, {
      env: {
        scope: {},
        variables: {
          REPLICATE_TOKEN: env.REPLICATE_TOKEN,
        },
      },
      inputs: {
        prompt: "standing on a mountain peak at sunset",
        character_reference_image: "https://picsum.photos/id/64/800/800",
        rendering_speed: "Default",
        style_type: "Fiction",
        aspect_ratio: "1:1",
        resolution: "None",
        magic_prompt_option: "On",
        seed: 42,
      },
    });
    console.log("Generated Ideogram V3 Character Default image URL:", image);
    expect(image).toMatch(/^https/);
    expect(costs).toBe(0.15);
  }
);

Deno.test(
  "Ideogram V3 Character: Quality speed with Realistic style",
  async () => {
    const {
      costs,
      outputs: { image },
    } = await runNode(run, {
      env: {
        scope: {},
        variables: {
          REPLICATE_TOKEN: env.REPLICATE_TOKEN,
        },
      },
      inputs: {
        prompt: "sitting in a cozy cafe reading a book",
        character_reference_image: "https://picsum.photos/id/64/1024/1024",
        rendering_speed: "Quality",
        style_type: "Realistic",
        aspect_ratio: "4:3",
        resolution: "None",
        magic_prompt_option: "Off",
        seed: -1,
      },
    });
    console.log("Generated Ideogram V3 Character Quality image URL:", image);
    expect(image).toMatch(/^https/);
    expect(costs).toBe(0.2);
  }
);

Deno.test("Ideogram V3 Character: with specific resolution", async () => {
  const {
    costs,
    outputs: { image },
  } = await runNode(run, {
    env: {
      scope: {},
      variables: {
        REPLICATE_TOKEN: env.REPLICATE_TOKEN,
      },
    },
    inputs: {
      prompt: "running through a forest",
      character_reference_image: "https://picsum.photos/id/64/600/600",
      rendering_speed: "Default",
      style_type: "Auto",
      aspect_ratio: "1:1",
      resolution: "1024x1024",
      magic_prompt_option: "Auto",
      seed: -1,
    },
  });
  console.log(
    "Generated Ideogram V3 Character with resolution image URL:",
    image
  );
  expect(image).toMatch(/^https/);
  expect(costs).toBe(0.15);
});

Deno.test("Ideogram V3 Character: default settings", async () => {
  const {
    costs,
    outputs: { image },
  } = await runNode(run, {
    env: {
      scope: {},
      variables: {
        REPLICATE_TOKEN: env.REPLICATE_TOKEN,
      },
    },
    inputs: {
      prompt: "cat astronaut walking at a moon",
      character_reference_image: "https://picsum.photos/id/64/512/512",
    },
  });
  console.log(
    "Generated Ideogram V3 Character default settings image URL:",
    image
  );
  expect(image).toMatch(/^https/);
  expect(costs).toBe(0.15);
});
