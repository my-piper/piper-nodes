import { load } from "https://deno.land/std@0.224.0/dotenv/mod.ts";
import { expect } from "https://deno.land/std@0.224.0/expect/mod.ts";
import { runNode } from "../../../utils/run-node.js";
import { costs, run } from "./script.js";

const { ARTWORKS_USER, ARTWORKS_PASSWORD } = await load({
  envPath: ".env",
  export: true,
});

Deno.test(
  "ArtWorks Dress on Image: costs calculation for regular scope",
  () => {
    const result = costs({
      env: { scope: {} },
      inputs: {},
    });
    expect(result).toBe(0.05);
  }
);

Deno.test("ArtWorks Dress on Image: costs are zero for user scope", () => {
  const result = costs({
    env: { scope: { ARTWORKS_USER: "user" } },
    inputs: {},
  });
  expect(result).toBe(0);
});

Deno.test("ArtWorks Dress on Image: dress person in image", async () => {
  const {
    costs,
    outputs: { image },
  } = await runNode(run, {
    env: {
      scope: {},
      variables: {
        ARTWORKS_USER,
        ARTWORKS_PASSWORD,
      },
    },
    inputs: {
      image:
        "https://cdn.jsdelivr.net/gh/my-piper/piper-nodes@main/assets/girl_posing.jpg",
      gender: "female",
      prompt: "red dress",
    },
  });
  console.log("Dress on image result:", image);
  expect(typeof image).toBe("string");
  expect(image.length).toBeGreaterThan(0);
  expect(costs).toBe(0.05);
});
