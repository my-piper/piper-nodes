import { load } from "https://deno.land/std@0.224.0/dotenv/mod.ts";
import { expect } from "https://deno.land/std@0.224.0/expect/mod.ts";
import { runNode } from "../../../utils/run-node.js";
import { costs, run } from "./script.js";

const { ARTWORKS_USER, ARTWORKS_PASSWORD } = await load({
  envPath: ".env",
  export: true,
});

Deno.test(
  "ArtWorks Face Swap Video: costs calculation for regular scope",
  () => {
    const result = costs({
      env: { scope: {} },
      inputs: {},
    });
    expect(result).toBe(0.005);
  }
);

Deno.test("ArtWorks Face Swap Video: costs are zero for user scope", () => {
  const result = costs({
    env: { scope: { ARTWORKS_USER: "user" } },
    inputs: {},
  });
  expect(result).toBe(0);
});

Deno.test("ArtWorks Face Swap Video: swap face on video", async () => {
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
      face: "https://cdn.jsdelivr.net/gh/my-piper/piper-nodes@main/assets/girl_posing.jpg",
      video:
        "https://cdn.jsdelivr.net/gh/my-piper/piper-nodes@main/assets/girl_camera_posing.mp4",
    },
  });
  console.log("Face swap video result:", video);
  expect(typeof video).toBe("string");
  expect(video.length).toBeGreaterThan(0);
  expect(costs).toBe(0.005);
});
