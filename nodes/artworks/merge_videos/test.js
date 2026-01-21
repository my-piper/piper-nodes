import { load } from "https://deno.land/std@0.224.0/dotenv/mod.ts";
import { expect } from "https://deno.land/std@0.224.0/expect/mod.ts";
import { runNode } from "../../../utils/run-node.js";
import { costs, run } from "./script.js";

const { ARTWORKS_USER, ARTWORKS_PASSWORD } = await load({
  envPath: ".env",
  export: true,
});

Deno.test("ArtWorks Merge Videos: costs calculation for regular scope", () => {
  const result = costs({
    env: { scope: {} },
  });
  expect(result).toBe(0.005);
});

Deno.test("ArtWorks Merge Videos: costs are zero for user scope", () => {
  const result = costs({
    env: { scope: { ARTWORKS_USER: "user" } },
  });
  expect(result).toBe(0);
});

Deno.test("ArtWorks Merge Videos: merge two videos", async () => {
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
      video1:
        "https://cdn.jsdelivr.net/gh/my-piper/piper-nodes@main/assets/girl_camera_posing.mp4",
      video2:
        "https://cdn.jsdelivr.net/gh/my-piper/piper-nodes@main/assets/girl_camera_posing.mp4",
      width: 1024,
      height: 768,
    },
    schema: {
      node: {
        inputs: {
          video1: { type: "video" },
          video2: { type: "video" },
          width: { type: "integer" },
          height: { type: "integer" },
        },
      },
    },
  });
  console.log("Merged video:", video);
  expect(typeof video).toBe("string");
  expect(video.length).toBeGreaterThan(0);
  expect(costs).toBe(0.005);
});
