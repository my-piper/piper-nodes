import { load } from "https://deno.land/std@0.224.0/dotenv/mod.ts";
import { expect } from "https://deno.land/std@0.224.0/expect/mod.ts";
import { runNode } from "../../../utils/run-node.js";
import { costs, run } from "./script.js";

const { ARTWORKS_USER, ARTWORKS_PASSWORD } = await load({
  envPath: ".env",
  export: true,
});

Deno.test("ArtWorks Extract Mask: costs calculation for regular scope", () => {
  const result = costs({
    env: { scope: {} },
    inputs: {},
  });
  expect(result).toBe(0.001);
});

Deno.test("ArtWorks Extract Mask: costs are zero for user scope", () => {
  const result = costs({
    env: { scope: { ARTWORKS_USER: "user" } },
    inputs: {},
  });
  expect(result).toBe(0);
});

Deno.test("ArtWorks Extract Mask: extract person mask from image", async () => {
  const {
    costs,
    outputs: { masks, merged },
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
      type: "yolo",
      model: "person_yolov8s-seg.pt",
      threshold: 0.5,
      applyConvexHull: false,
    },
  });
  console.log("Extracted masks:", masks);
  await Deno.writeFile("/tmp/extracted_mask.png", merged);
  console.log("Mask saved to: /tmp/extracted_mask.png");
  expect(Array.isArray(masks)).toBe(true);
  expect(masks.length).toBeGreaterThan(0);
  expect(merged).toBeInstanceOf(Uint8Array);
  expect(merged.length).toBeGreaterThan(0);
  expect(costs).toBe(0.001);
});
