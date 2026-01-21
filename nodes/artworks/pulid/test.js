import { load } from "https://deno.land/std@0.224.0/dotenv/mod.ts";
import { expect } from "https://deno.land/std@0.224.0/expect/mod.ts";
import { runNode } from "../../../utils/run-node.js";
import { costs, run } from "./script.js";

const { ARTWORKS_USER, ARTWORKS_PASSWORD } = await load({
  envPath: ".env",
  export: true,
});

Deno.test(
  "ArtWorks PuLID: costs calculation for regular scope (no upscale)",
  () => {
    const result = costs({
      env: { scope: {} },
      inputs: { upscale: "no" },
    });
    expect(result).toBe(0.01);
  }
);

Deno.test(
  "ArtWorks PuLID: costs calculation for regular scope (skin detailing)",
  () => {
    const result = costs({
      env: { scope: {} },
      inputs: { upscale: "skin_detailing" },
    });
    expect(result).toBe(0.02);
  }
);

Deno.test(
  "ArtWorks PuLID: costs calculation for regular scope (enhancing quality)",
  () => {
    const result = costs({
      env: { scope: {} },
      inputs: { upscale: "enhancing_quality" },
    });
    expect(result).toBe(0.03);
  }
);

Deno.test(
  "ArtWorks PuLID: costs calculation for regular scope (full enhancing)",
  () => {
    const result = costs({
      env: { scope: {} },
      inputs: { upscale: "full_enhancing" },
    });
    expect(result).toBe(0.04);
  }
);

Deno.test("ArtWorks PuLID: costs are zero for user scope", () => {
  const result = costs({
    env: { scope: { ARTWORKS_USER: "user" } },
    inputs: { upscale: "full_enhancing" },
  });
  expect(result).toBe(0);
});

Deno.test("ArtWorks PuLID: generate portrait with PuLID", async () => {
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
      person:
        "https://cdn.jsdelivr.net/gh/my-piper/piper-nodes@main/assets/man_posing.jpg",
      upscale: "no",
      aspectRatio: "9:16",
    },
  });
  console.log("PuLID result:", image);
  expect(typeof image).toBe("string");
  expect(image.length).toBeGreaterThan(0);
  expect(costs).toBe(0.01);
});
