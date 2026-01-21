import { load } from "https://deno.land/std@0.224.0/dotenv/mod.ts";
import { expect } from "https://deno.land/std@0.224.0/expect/mod.ts";
import { runNode } from "../../../utils/run-node.js";
import { costs, run } from "./script.js";

const { ARTWORKS_USER, ARTWORKS_PASSWORD } = await load({
  envPath: ".env",
  export: true,
});

Deno.test("ArtWorks Extract Frame: costs calculation for regular scope", () => {
  const result = costs({
    env: { scope: {} },
  });
  expect(result).toBe(0.001);
});

Deno.test("ArtWorks Extract Frame: costs are zero for user scope", () => {
  const result = costs({
    env: { scope: { ARTWORKS_USER: "user" } },
  });
  expect(result).toBe(0);
});

Deno.test(
  "ArtWorks Extract Frame: extract first frame from video",
  async () => {
    const {
      costs,
      outputs: { frame },
    } = await runNode(run, {
      env: {
        scope: {},
        variables: {
          ARTWORKS_USER,
          ARTWORKS_PASSWORD,
        },
      },
      inputs: {
        video:
          "https://cdn.jsdelivr.net/gh/my-piper/piper-nodes@main/assets/girl_camera_posing.mp4",
        position: "first",
      },
    });
    console.log("Extracted first frame:", frame);
    expect(typeof frame).toBe("string");
    expect(frame.length).toBeGreaterThan(0);
    expect(costs).toBe(0.001);
  }
);

Deno.test("ArtWorks Extract Frame: extract last frame from video", async () => {
  const {
    costs,
    outputs: { frame },
  } = await runNode(run, {
    env: {
      scope: {},
      variables: {
        ARTWORKS_USER,
        ARTWORKS_PASSWORD,
      },
    },
    inputs: {
      video:
        "https://cdn.jsdelivr.net/gh/my-piper/piper-nodes@main/assets/girl_camera_posing.mp4",
      position: "last",
    },
  });
  console.log("Extracted last frame:", frame);
  expect(typeof frame).toBe("string");
  expect(frame.length).toBeGreaterThan(0);
  expect(costs).toBe(0.001);
});
