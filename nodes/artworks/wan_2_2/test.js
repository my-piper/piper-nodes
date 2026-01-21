import { load } from "https://deno.land/std@0.224.0/dotenv/mod.ts";
import { expect } from "https://deno.land/std@0.224.0/expect/mod.ts";
import { runNode } from "../../../utils/run-node.js";
import { costs, run } from "./script.js";

const { ARTWORKS_USER, ARTWORKS_PASSWORD } = await load({
  envPath: ".env",
  export: true,
});

Deno.test("ArtWorks Wan 2.2: costs calculation for regular scope", () => {
  const result = costs({
    env: { scope: {} },
  });
  expect(result).toBe(0.05);
});

Deno.test("ArtWorks Wan 2.2: costs are zero for user scope", () => {
  const result = costs({
    env: { scope: { ARTWORKS_USER: "user" } },
  });
  expect(result).toBe(0);
});

Deno.test("ArtWorks Wan 2.2: image to video generation", async () => {
  const {
    costs,
    outputs: { video },
  } = await runNode(run, {
    env: {
      scope: {},
      variables: {
        ARTWORKS_USER,
        ARTWORKS_PASSWORD,
      },
    },
    inputs: {
      version: "2_2",
      image:
        "https://cdn.jsdelivr.net/gh/my-piper/piper-nodes@main/assets/girl_posing.jpg",
      prompt: "dancing girl in a field of flowers",
      length: "5",
      resolution: "480p",
      fps: "16",
    },
  });
  console.log("Generated video from image:", video);
  expect(typeof video).toBe("string");
  expect(video.length).toBeGreaterThan(0);
  expect(costs).toBe(0.05);
});
