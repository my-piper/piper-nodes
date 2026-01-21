import { load } from "https://deno.land/std@0.224.0/dotenv/mod.ts";
import { expect } from "https://deno.land/std@0.224.0/expect/mod.ts";
import { runNode } from "../../../utils/run-node.js";
import { costs, run } from "./script.js";

const { ARTWORKS_USER, ARTWORKS_PASSWORD } = await load({
  envPath: ".env",
  export: true,
});

Deno.test("ArtWorks Detect Face: costs calculation for regular scope", () => {
  const result = costs({
    env: { scope: {} },
    inputs: {},
  });
  expect(result).toBe(0.005);
});

Deno.test("ArtWorks Detect Face: costs are zero for user scope", () => {
  const result = costs({
    env: { scope: { ARTWORKS_USER: "user" } },
    inputs: {},
  });
  expect(result).toBe(0);
});

Deno.test(
  "ArtWorks Detect Face: detect face and extract features",
  async () => {
    const {
      costs,
      outputs: { face, features },
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
          "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800",
        index: 0,
      },
    });
    await Deno.writeFile("/tmp/detected_face.png", face);
    console.log("Face saved to: /tmp/detected_face.png");
    expect(face).toBeInstanceOf(Uint8Array);
    expect(face.length).toBeGreaterThan(0);
    expect(typeof features).toBe("object");
    expect(features).toHaveProperty("ageFrom");
    expect(features).toHaveProperty("ageTo");
    expect(features).toHaveProperty("gender");
    expect(features).toHaveProperty("race");
    expect(features).toHaveProperty("emotion");
    expect(typeof features.ageFrom).toBe("number");
    expect(typeof features.ageTo).toBe("number");
    expect(typeof features.gender).toBe("string");
    expect(typeof features.race).toBe("string");
    expect(typeof features.emotion).toBe("string");
    expect(costs).toBe(0.005);
  }
);
