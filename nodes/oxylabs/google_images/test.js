import { load } from "https://deno.land/std@0.224.0/dotenv/mod.ts";
import { expect } from "https://deno.land/std@0.224.0/expect/mod.ts";
import { runNode } from "../../../utils/run-node.js";
import { costs, run } from "./script.js";

const { OXYLABS_AUTH } = await load({
  envPath: ".env",
  export: true,
});

Deno.test("Google Images: costs calculation for regular scope", () => {
  const result = costs({
    env: { scope: {} },
  });
  expect(result).toBe(0.001);
});

Deno.test("Google Images: costs are zero for user scope", () => {
  const result = costs({
    env: { scope: { OXYLABS_AUTH: "user" } },
  });
  expect(result).toBe(0);
});

Deno.test("Google Images: search for cats", async () => {
  const {
    costs: actualCosts,
    outputs: { images },
  } = await runNode(run, {
    env: {
      scope: {},
      variables: {
        OXYLABS_AUTH,
      },
    },
    inputs: {
      query: "cute cats",
    },
  });

  console.log("Found images:", images.length);
  console.log("First image URL length:", images[0]?.length);

  expect(Array.isArray(images)).toBe(true);
  expect(images.length).toBe(6);
  expect(actualCosts).toBe(0.001);

  // Check that all images are either data URLs or https URLs
  images.forEach((image, index) => {
    expect(
      image.startsWith("data:image/") || image.startsWith("https://")
    ).toBe(true);
    console.log(`Image ${index + 1}: ${image.substring(0, 50)}...`);
  });
});

Deno.test("Google Images: search for landscapes", async () => {
  const {
    costs: actualCosts,
    outputs: { images },
  } = await runNode(run, {
    env: {
      scope: {},
      variables: {
        OXYLABS_AUTH,
      },
    },
    inputs: {
      query: "mountain landscape",
    },
  });

  console.log("Found landscape images:", images.length);

  expect(Array.isArray(images)).toBe(true);
  expect(images.length).toBe(6);
  expect(actualCosts).toBe(0.001);

  // Verify all images are valid
  images.forEach((image) => {
    expect(typeof image).toBe("string");
    expect(image.length).toBeGreaterThan(0);
  });
});

Deno.test("Google Images: error handling without auth", async () => {
  try {
    await runNode(run, {
      env: {
        scope: {},
        variables: {},
      },
      inputs: {
        query: "test",
      },
    });
    throw new Error("Should have thrown an error");
  } catch (error) {
    expect(error.message).toContain("OXYLABS_AUTH");
  }
});

